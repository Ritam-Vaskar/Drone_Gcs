# AirSim Setup Guide

## Overview
AirSim is Microsoft's open-source simulator that provides photo-realistic environments and camera feeds. This guide shows how to integrate AirSim with the Drone GCS for realistic video streaming.

## Why AirSim?
- 📹 **Real Camera Feeds**: Multiple camera views (FPV, Follow, Top-down)
- 🌍 **Photo-realistic**: Unreal Engine-based visuals
- 🎮 **Multiple Environments**: Urban, rural, indoor scenarios
- 🔗 **MAVLink Compatible**: Works alongside PX4 SITL for telemetry

## Architecture

```
┌─────────────┐         ┌──────────────┐         ┌──────────────┐
│   AirSim    │◄────────┤   Backend    │◄────────┤   Frontend   │
│  Simulator  │ WebRTC/ │   FastAPI    │ WebSocket│  React App   │
│             │  RTSP   │              │          │              │
│ Camera Feed ├────────►│ Video Stream ├─────────►│ Video Player │
└─────────────┘         │ Telemetry    │          └──────────────┘
                        └──────────────┘
```

## Installation Options

### Option 1: Prebuilt Binary (Recommended for Windows)

1. **Download AirSim Release**
   ```bash
   # Visit: https://github.com/microsoft/AirSim/releases
   # Download the Windows binary (e.g., AirSim-Windows.zip)
   ```

2. **Extract and Run**
   ```bash
   # Extract to a folder (e.g., C:\AirSim)
   # Run the executable: AirSim.exe
   ```

3. **Configure MAVLink**
   Create `settings.json` in `%USERPROFILE%\Documents\AirSim\`:
   ```json
   {
     "SettingsVersion": 1.2,
     "SimMode": "Multirotor",
     "Vehicles": {
       "PX4": {
         "VehicleType": "PX4Multirotor",
         "UseSerial": false,
         "UseTcp": true,
         "TcpPort": 4560,
         "LockStep": true,
         "Parameters": {
           "NAV_RCL_ACT": 0,
           "NAV_DLL_ACT": 0,
           "COM_OBL_ACT": 1,
           "LPE_LAT": 47.641468,
           "LPE_LON": -122.140165
         },
         "Cameras": {
           "front_center": {
             "CaptureSettings": [
               {
                 "ImageType": 0,
                 "Width": 1920,
                 "Height": 1080,
                 "FOV_Degrees": 90
               }
             ],
             "X": 0.5, "Y": 0.0, "Z": -0.2,
             "Pitch": 0, "Roll": 0, "Yaw": 0
           }
         }
       }
     }
   }
   ```

### Option 2: Build from Source (Advanced)

1. **Prerequisites**
   - Visual Studio 2019/2022
   - Unreal Engine 4.27 or 5.x
   - Python 3.8+

2. **Clone Repository**
   ```bash
   git clone https://github.com/microsoft/AirSim.git
   cd AirSim
   ```

3. **Build**
   ```bash
   # Windows
   build.cmd
   ```

## Integration with PX4 SITL

### 1. Start PX4 SITL (for telemetry)
```bash
docker run --rm -it -p 14540:14540/udp px4io/px4-sitl-standalone:latest
```

### 2. Start AirSim
- Launch AirSim executable
- Wait for simulator to load
- Press Play in Unreal Engine

### 3. Backend Connection
The backend will connect to:
- **PX4 SITL**: `udp://:14540` (for MAVLink telemetry)
- **AirSim**: TCP port 4560 (for camera feed)

### 4. Verify Connection
Check backend logs:
```
[INFO] Connected to drone on udp://:14540
[INFO] AirSim video stream started on port 8001
```

## Backend Video Streaming Setup

### Update `backend/requirements.txt`
```txt
airsim>=1.8.1
opencv-python>=4.8.0
av>=10.0.0
```

### Add Video Endpoint to `backend/app/main.py`
```python
from fastapi.responses import StreamingResponse
import airsim
import cv2
import asyncio

# Initialize AirSim client
airsim_client = airsim.MultirotorClient()

async def generate_video_frames():
    """Stream video frames from AirSim camera"""
    while True:
        # Get camera image
        responses = airsim_client.simGetImages([
            airsim.ImageRequest("front_center", airsim.ImageType.Scene, False, False)
        ])
        
        if responses:
            response = responses[0]
            img1d = np.frombuffer(response.image_data_uint8, dtype=np.uint8)
            img_rgb = img1d.reshape(response.height, response.width, 3)
            
            # Encode as JPEG
            _, buffer = cv2.imencode('.jpg', img_rgb)
            frame = buffer.tobytes()
            
            yield (b'--frame\r\n'
                   b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
        
        await asyncio.sleep(0.033)  # ~30 FPS

@app.get("/api/v1/video/stream")
async def video_stream():
    """MJPEG video stream endpoint"""
    return StreamingResponse(
        generate_video_frames(),
        media_type="multipart/x-mixed-replace; boundary=frame"
    )
```

### Update `.env`
```env
AIRSIM_ENABLED=true
AIRSIM_HOST=127.0.0.1
AIRSIM_PORT=4560
```

## Frontend Video Integration

### Update `components/video-feed.tsx`
```tsx
useEffect(() => {
  if (videoRef.current) {
    // Connect to MJPEG stream
    videoRef.current.src = `${config.apiUrl}/api/v1/video/stream`
    setIsConnected(true)
  }
}, [])
```

## Testing Camera Feed

1. **Start Backend**
   ```bash
   cd backend
   .\.venv\Scripts\activate
   uvicorn app.main:app --reload
   ```

2. **Start Frontend**
   ```bash
   pnpm dev
   ```

3. **Verify Stream**
   - Open http://localhost:3000
   - Navigate to TELEMETRY section
   - Video feed should show AirSim camera view
   - Status should show "● STREAMING"

## Camera Controls

The video feed component supports multiple camera views:

- **FPV VIEW**: First-person view from drone's front camera
- **FOLLOW VIEW**: Third-person following camera
- **TOP VIEW**: Bird's eye view

Switch cameras using the buttons below the video feed.

## Troubleshooting

### No Video Stream
1. Verify AirSim is running and showing camera view
2. Check backend logs for connection errors
3. Test stream directly: http://localhost:8000/api/v1/video/stream
4. Ensure `AIRSIM_ENABLED=true` in `.env`

### Poor Video Quality
- Adjust camera resolution in `settings.json`
- Reduce frame rate if CPU is overloaded
- Check network bandwidth

### High Latency
- Use H.264 encoding instead of MJPEG for production
- Enable hardware encoding in AirSim settings
- Reduce resolution to 1280x720

### AirSim Not Connecting to PX4
1. Verify `TcpPort: 4560` in settings.json
2. Check PX4 SITL is running on port 14540
3. Restart both simulators
4. Check firewall settings

## Performance Optimization

### GPU Acceleration
Enable in AirSim settings:
```json
{
  "ViewMode": "SpringArmChase",
  "RenderQuality": "High",
  "Recording": {
    "RecordOnMove": false,
    "RecordInterval": 0.05
  }
}
```

### Network Optimization
Use WebRTC for lower latency:
```bash
pip install aiortc
```

Update backend to use WebRTC instead of MJPEG.

## Alternative: Gazebo Camera Plugin

If AirSim is too resource-intensive, use Gazebo with camera plugin:

```bash
# Install Gazebo Garden
# Add camera plugin to drone model
# Stream via GStreamer to backend
```

## Resources

- [AirSim Documentation](https://microsoft.github.io/AirSim/)
- [AirSim GitHub](https://github.com/microsoft/AirSim)
- [PX4 + AirSim Integration](https://docs.px4.io/main/en/sim_airsim/)
- [Camera Settings Reference](https://microsoft.github.io/AirSim/image_apis/)

## Next Steps

1. ✅ Install AirSim prebuilt binary
2. ✅ Configure MAVLink connection
3. ✅ Add video streaming endpoint to backend
4. ✅ Test camera feed in frontend
5. 🔄 Optimize for performance
6. 🔄 Add recording capabilities
7. 🔄 Implement camera switching

## Notes

- AirSim requires a powerful GPU (GTX 1060+)
- Unreal Engine can consume 4-8GB RAM
- Consider using prebuilt environments to save build time
- For production, use H.264/WebRTC instead of MJPEG
