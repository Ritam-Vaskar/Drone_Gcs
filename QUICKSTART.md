# MAVLink GCS - Quick Start Guide

## 🎯 What Has Been Built

A **complete MAVLink Ground Control System** with:

### ✅ Backend (Python + FastAPI + MAVSDK)
- Real-time MAVLink telemetry ingestion from PX4/ArduPilot SITL
- WebSocket streaming of parsed telemetry (JSON format)
- REST API for drone commands (ARM, DISARM, TAKEOFF, LAND)
- API key authentication
- Auto-reconnect to simulator

### ✅ Frontend (React + Next.js + TypeScript)
- Real-time telemetry dashboard
- WebSocket client with auto-reconnect
- Live display: GPS, altitude, speed, battery, flight mode, attitude
- Command controls with confirmation
- Responsive tactical-themed UI

## 🚀 Quick Start (Windows)

### Prerequisites
- ✅ Python 3.10+ (you have 3.13.7)
- ✅ Node.js 18+ 
- Git
- PX4 or ArduPilot SITL simulator (optional - mock mode available)

### Step 0: Choose Your Mode

**Option A: Mock Mode (No Simulator Required)**
```powershell
# Already configured! The .env file has MOCK_MODE=true
# This generates fake telemetry data for testing
```

**Option B: Real Simulator**
```powershell
# Edit backend/.env and set:
MOCK_MODE=false
# Then follow SIMULATOR_SETUP.md to install PX4/ArduPilot SITL
```

### Step 1: Start Backend

**Terminal 1 (PowerShell):**
```powershell
cd backend
.\.venv\Scripts\Activate.ps1
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```

Expected output (Mock Mode):
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     ⚠ MOCK MODE ENABLED - No real simulator connection
INFO:     Starting mock telemetry generation...
```

Expected output (Real Simulator):
```
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Connecting to simulator at udp://:14540...
INFO:     Connected to drone simulator
```

### Step 2: Start Frontend

**Terminal 2 (PowerShell):**
```powershell
# From project root
npm run dev
```

Expected output:
```
  ▲ Next.js 14.2.25
  - Local:        http://localhost:3000
```

### Step 3: Start Simulator (Optional for full testing)

**Terminal 3:**

**For PX4:**
```bash
cd ~/PX4-Autopilot
make px4_sitl gazebo
```

**For ArduPilot:**
```bash
sim_vehicle.py -v ArduCopter --console --map
```

### Step 4: Open Dashboard

Visit: **http://localhost:3000**

## 🎮 Testing With Mock Mode (Default)

With `MOCK_MODE=true` in `backend/.env`:
1. Dashboard shows **"● ONLINE"** status (green)
2. Simulated telemetry flows automatically
3. All UI features work
4. Commands are acknowledged but don't control real drone
5. Perfect for testing and development!

## 🎮 Testing With Real Simulator

Once simulator is running:
1. Dashboard shows "ONLINE" status (green)
2. Real-time telemetry flows automatically
3. Use CONTROLS tab to:
   - **ARM** the drone
   - **TAKEOFF** (enter altitude)
   - **LAND** the drone

## 📡 API Endpoints

### WebSocket
- **URL**: `ws://localhost:8000/ws`
- **Format**: Streams JSON telemetry every 100ms

### REST API (POST)
- `/api/v1/command/arm` - Arm the drone
- `/api/v1/command/disarm` - Disarm the drone
- `/api/v1/command/takeoff?altitude_m=10` - Takeoff to altitude
- `/api/v1/command/land` - Land the drone
- `/api/v1/status` (GET) - Current status snapshot

**Authentication**: Add `?token=gcs-secret-key-2024` to all command endpoints

## 🔧 Configuration

### Backend Configuration
Edit `backend/app/main.py`:
- Change `system_address="udp://:14540"` for different MAVLink connection
- Change `API_KEY` for different authentication

### Frontend Configuration
Edit `.env.local` (create if needed):
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_WS_URL=ws://localhost:8000/ws
NEXT_PUBLIC_API_KEY=gcs-secret-key-2024
```

## 📊 Telemetry Data Format

```json
{
  "timestamp": "2025-11-17T14:00:00Z",
  "connected": true,
  "position": {
    "lat": 47.3977,
    "lon": 8.5456,
    "relative_alt_m": 12.5,
    "absolute_alt_m": 412.5
  },
  "attitude": {
    "roll_deg": 0.1,
    "pitch_deg": -1.2,
    "yaw_deg": 45.0
  },
  "velocity": {
    "north_m_s": 4.3,
    "east_m_s": 2.1,
    "down_m_s": 0.0
  },
  "battery": {
    "voltage_v": 12.6,
    "remaining_percent": 85
  },
  "flight_mode": "STABILIZE",
  "health": {
    "is_armable": true,
    "is_global_position_ok": true
  }
}
```

## 🐛 Troubleshooting

### Backend won't connect to simulator
- Ensure simulator is running first
- Check UDP port 14540 is not blocked
- Verify simulator is broadcasting MAVLink

### Frontend shows OFFLINE
- Check backend is running on port 8000
- Open browser console for WebSocket errors
- Verify CORS is enabled (already configured)

### Commands fail
- Ensure drone is in correct state (armed/disarmed)
- Check API key matches in frontend and backend
- Verify simulator is accepting commands

## 📦 Project Structure

```
Task2/
├── backend/                    # Python FastAPI backend
│   ├── app/
│   │   └── main.py            # Main server with MAVLink integration
│   ├── requirements.txt       # Python dependencies
│   └── .venv/                 # Virtual environment
├── app/                       # Next.js pages
│   ├── page.tsx              # Main dashboard
│   └── layout.tsx            # App layout
├── components/               # React components
│   ├── telemetry-panel.tsx  # Telemetry display
│   ├── drone-controls.tsx   # Command controls
│   └── connection-status.tsx # Status indicator
├── services/
│   └── ws.ts                # WebSocket client
├── lib/
│   └── config.ts            # Configuration
└── package.json             # Node dependencies
```

## 🎯 Current Status

### ✅ Working Features
- Backend connects to MAVLink simulator
- Real-time telemetry streaming via WebSocket
- Frontend displays all telemetry data
- Command controls (ARM/DISARM/TAKEOFF/LAND)
- Auto-reconnect on disconnect
- API authentication
- Responsive UI

### 🚧 To Be Added (Future Enhancements)
- Map visualization (Leaflet/Mapbox)
- Telemetry charts (altitude/speed over time)
- Mission upload & waypoints
- Session recording/replay
- Multi-vehicle support
- Docker deployment

## 📝 Notes

- System is simulator-only (no real hardware)
- Backend uses MAVSDK 3.10.2 (latest stable)
- Frontend uses React 18.2 + Next.js 14.2.25
- Authentication is basic (API key) - suitable for development
- All components support auto-reconnect
