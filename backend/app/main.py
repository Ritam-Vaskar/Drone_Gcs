import asyncio
import json
from datetime import datetime
from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
from mavsdk import System
from mavsdk.action import ActionError
import logging
from app.config import MOCK_MODE, SITL_ADDRESS, API_KEY
from app.video_stream import video_streamer

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="MAVLink GCS Backend")

# Add CORS middleware for frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global state
drone = System()
ws_clients = set()
telemetry_data = {}
is_connected = False
mock_mode = MOCK_MODE

def verify_api_key(token: str = None):
    if token != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return True

# Initialize drone connection
async def init_drone():
    global is_connected, mock_mode
    
    if mock_mode:
        logger.info("⚠ MOCK MODE ENABLED - No real simulator connection")
        is_connected = True
        asyncio.create_task(mock_telemetry_loop())
        return
    
    try:
        logger.info(f"Connecting to simulator at {SITL_ADDRESS}...")
        await drone.connect(system_address=SITL_ADDRESS)
        is_connected = True
        logger.info("Connected to drone simulator")
        asyncio.create_task(telemetry_loop())
    except Exception as e:
        logger.error(f"Connection error: {e}")
        is_connected = False
        asyncio.create_task(reconnect_loop())

async def reconnect_loop():
    while not is_connected:
        await asyncio.sleep(5)
        await init_drone()

async def mock_telemetry_loop():
    """Generate mock telemetry data for testing without simulator"""
    global telemetry_data
    import math
    counter = 0
    
    logger.info("Starting mock telemetry generation...")
    
    while is_connected:
        counter += 1
        t = counter * 0.1
        
        telemetry_data = {
            "timestamp": datetime.now().isoformat(),
            "connected": True,
            "position": {
                "lat": 47.3977 + math.sin(t * 0.1) * 0.001,
                "lon": 8.5456 + math.cos(t * 0.1) * 0.001,
                "relative_alt_m": 50 + math.sin(t * 0.2) * 20,
                "absolute_alt_m": 450 + math.sin(t * 0.2) * 20
            },
            "attitude": {
                "roll_deg": math.sin(t * 0.3) * 15,
                "pitch_deg": math.cos(t * 0.25) * 10,
                "yaw_deg": (t * 10) % 360
            },
            "velocity": {
                "north_m_s": 5 + math.sin(t * 0.15) * 3,
                "east_m_s": 3 + math.cos(t * 0.15) * 2,
                "down_m_s": 0
            },
            "battery": {
                "voltage_v": 12.6 - (counter * 0.0001),
                "remaining_percent": max(20, 100 - counter * 0.01)
            },
            "flight_mode": "GUIDED" if counter % 200 < 100 else "STABILIZE",
            "health": {
                "is_gyrometer_calibration_ok": True,
                "is_accelerometer_calibration_ok": True,
                "is_magnetometer_calibration_ok": True,
                "is_level_calibration_ok": True,
                "is_local_position_ok": True,
                "is_global_position_ok": True,
                "is_home_position_ok": True,
                "is_armable": True
            }
        }
        
        await asyncio.sleep(0.1)

async def telemetry_loop():
    """Continuously fetch telemetry and broadcast to WebSocket clients"""
    global telemetry_data
    
    try:
        async for gps_info in drone.telemetry.gps_info():
            await asyncio.sleep(0.1)
    except Exception as e:
        logger.error(f"Telemetry error: {e}")

# Startup event
@app.on_event("startup")
async def startup():
    await init_drone()

# WebSocket endpoint for real-time telemetry
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    global telemetry_data
    await websocket.accept()
    ws_clients.add(websocket)
    logger.info(f"WebSocket client connected. Total: {len(ws_clients)}")
    
    try:
        while True:
            try:
                if is_connected:
                    # In mock mode, telemetry_data is already being updated by mock_telemetry_loop
                    # In real mode, fetch from drone
                    if not mock_mode:
                        position = await drone.telemetry.position().__anext__()
                        attitude = await drone.telemetry.attitude_euler().__anext__()
                        velocity = await drone.telemetry.velocity_ned().__anext__()
                        battery = await drone.telemetry.battery().__anext__()
                        flight_mode = await drone.telemetry.flight_mode().__anext__()
                        health = await drone.telemetry.health().__anext__()
                        
                        telemetry_data = {
                            "timestamp": datetime.now().isoformat(),
                            "connected": True,
                            "position": {
                                "lat": position.latitude_deg,
                                "lon": position.longitude_deg,
                                "relative_alt_m": position.relative_altitude_m,
                                "absolute_alt_m": position.absolute_altitude_m
                            },
                            "attitude": {
                                "roll_deg": attitude.roll_deg,
                                "pitch_deg": attitude.pitch_deg,
                                "yaw_deg": attitude.yaw_deg
                            },
                            "velocity": {
                                "north_m_s": velocity.north_m_s,
                                "east_m_s": velocity.east_m_s,
                                "down_m_s": velocity.down_m_s
                            },
                            "battery": {
                                "voltage_v": battery.voltage_v,
                                "remaining_percent": battery.remaining_percent
                            },
                            "flight_mode": str(flight_mode),
                            "health": {
                                "is_gyrometer_calibration_ok": getattr(health, 'is_gyrometer_calibration_ok', True),
                                "is_accelerometer_calibration_ok": getattr(health, 'is_accelerometer_calibration_ok', True),
                                "is_magnetometer_calibration_ok": getattr(health, 'is_magnetometer_calibration_ok', True),
                                "is_local_position_ok": getattr(health, 'is_local_position_ok', True),
                                "is_global_position_ok": getattr(health, 'is_global_position_ok', True),
                                "is_home_position_ok": getattr(health, 'is_home_position_ok', True),
                                "is_armable": getattr(health, 'is_armable', True)
                            }
                        }
                    
                    # Send telemetry (either from mock or real drone)
                    if telemetry_data:
                        await websocket.send_text(json.dumps(telemetry_data))
                
                await asyncio.sleep(0.1)
            except StopAsyncIteration:
                await asyncio.sleep(1)
            except Exception as e:
                logger.error(f"Telemetry fetch error: {e}")
                await asyncio.sleep(1)
                
    except WebSocketDisconnect:
        ws_clients.discard(websocket)
        logger.info(f"WebSocket client disconnected. Total: {len(ws_clients)}")

# REST endpoints for commands
@app.post("/api/v1/command/arm")
async def arm(token: str = None):
    verify_api_key(token)
    try:
        if not is_connected:
            return JSONResponse({"status": "error", "detail": "Drone not connected"}, status_code=503)
        await drone.action.arm()
        return {"status": "ok", "detail": "Arming drone"}
    except ActionError as e:
        return JSONResponse({"status": "error", "detail": str(e)}, status_code=400)

@app.post("/api/v1/command/disarm")
async def disarm(token: str = None):
    verify_api_key(token)
    try:
        if not is_connected:
            return JSONResponse({"status": "error", "detail": "Drone not connected"}, status_code=503)
        await drone.action.disarm()
        return {"status": "ok", "detail": "Disarming drone"}
    except ActionError as e:
        return JSONResponse({"status": "error", "detail": str(e)}, status_code=400)

@app.post("/api/v1/command/takeoff")
async def takeoff(token: str = None, altitude_m: float = 10):
    verify_api_key(token)
    try:
        if not is_connected:
            return JSONResponse({"status": "error", "detail": "Drone not connected"}, status_code=503)
        await drone.action.set_takeoff_altitude(altitude_m)
        await drone.action.takeoff()
        return {"status": "ok", "detail": f"Taking off to {altitude_m}m"}
    except ActionError as e:
        return JSONResponse({"status": "error", "detail": str(e)}, status_code=400)

@app.post("/api/v1/command/land")
async def land(token: str = None):
    verify_api_key(token)
    try:
        if not is_connected:
            return JSONResponse({"status": "error", "detail": "Drone not connected"}, status_code=503)
        await drone.action.land()
        return {"status": "ok", "detail": "Landing drone"}
    except ActionError as e:
        return JSONResponse({"status": "error", "detail": str(e)}, status_code=400)

@app.get("/api/v1/status")
async def status():
    return {
        "connected": is_connected,
        "telemetry": telemetry_data,
        "clients": len(ws_clients)
    }

@app.get("/health")
async def health():
    return {"status": "ok"}

# Video streaming endpoints
@app.get("/api/v1/video/stream")
async def video_stream():
    """MJPEG video stream from AirSim camera"""
    if not video_streamer.is_connected:
        await video_streamer.connect()
    
    if not video_streamer.is_connected:
        return JSONResponse(
            {"status": "error", "detail": "AirSim not connected. Start Blocks.exe first."},
            status_code=503
        )
    
    return StreamingResponse(
        video_streamer.stream_generator(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )

@app.get("/api/v1/video/status")
async def video_status():
    """Check if video stream is available"""
    return {
        "connected": video_streamer.is_connected,
        "camera": video_streamer.camera_name
    }

@app.post("/api/v1/video/camera/{camera_name}")
async def switch_camera(camera_name: str):
    """Switch between cameras (front_center, bottom_center)"""
    success = video_streamer.switch_camera(camera_name)
    if success:
        return {"status": "ok", "camera": camera_name}
    return JSONResponse(
        {"status": "error", "detail": "Invalid camera name"},
        status_code=400
    )

# Startup event
@app.on_event("startup")
async def startup_event():
    """Initialize drone and video connections on startup"""
    asyncio.create_task(init_drone())
    # Try to connect to AirSim (will log warning if not available)
    asyncio.create_task(video_streamer.connect())
