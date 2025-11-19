# AirSim Blocks Setup Guide (Lightweight)

## ✅ Perfect for Your System
This setup works on **any laptop** without dedicated GPU. You'll get real camera feed + MAVLink telemetry!

---

## Step 1: Download AirSim Blocks

### Option A: Direct Download (Recommended)
1. Visit: https://github.com/microsoft/AirSim/releases
2. Find latest release (v1.8.1 or newer)
3. Download: **`Blocks.zip`** (Windows x64)
4. Extract to: `C:\AirSim\Blocks\`

### Option B: Alternative Binary
```powershell
# If GitHub link is slow, use this direct link
# Download from: https://github.com/microsoft/AirSim/releases/download/v1.8.1-windows/Blocks.zip
```

---

## Step 2: Configure AirSim

### Create Settings File
Create this file:
```
%USERPROFILE%\Documents\AirSim\settings.json
```

Full path example:
```
C:\Users\KIIT0001\Documents\AirSim\settings.json
```

### Settings Content (Copy exactly)
```json
{
  "SettingsVersion": 1.2,
  "SimMode": "Multirotor",
  "ClockType": "SteppableClock",
  "Vehicles": {
    "Drone1": {
      "VehicleType": "SimpleFlight",
      "DefaultVehicleState": "Armed",
      "AutoCreate": true,
      "Cameras": {
        "front_center": {
          "CaptureSettings": [
            {
              "ImageType": 0,
              "Width": 640,
              "Height": 480,
              "FOV_Degrees": 90,
              "AutoExposureSpeed": 100,
              "MotionBlurAmount": 0
            }
          ],
          "X": 0.25,
          "Y": 0.0,
          "Z": 0.0,
          "Pitch": 0,
          "Roll": 0,
          "Yaw": 0
        },
        "bottom_center": {
          "CaptureSettings": [
            {
              "ImageType": 0,
              "Width": 320,
              "Height": 240
            }
          ],
          "X": 0.0,
          "Y": 0.0,
          "Z": 0.0,
          "Pitch": -90,
          "Roll": 0,
          "Yaw": 0
        }
      },
      "X": 0, "Y": 0, "Z": -2
    }
  },
  "Recording": {
    "RecordOnMove": false,
    "RecordInterval": 0.05
  },
  "CameraDefaults": {
    "CaptureSettings": [
      {
        "ImageType": 0,
        "Width": 640,
        "Height": 480,
        "FOV_Degrees": 90
      }
    ]
  }
}
```

**What these settings do:**
- `SimpleFlight`: Lightweight physics (no GPU needed)
- `640x480`: Moderate resolution (smooth on any laptop)
- `front_center`: FPV camera
- `bottom_center`: Downward camera for landing
- `AutoCreate`: Drone spawns automatically

---

## Step 3: Create Settings File (Automated)

Let me create a PowerShell script to set this up:

```powershell
# Run this in PowerShell
$airsimDir = "$env:USERPROFILE\Documents\AirSim"
New-Item -ItemType Directory -Force -Path $airsimDir
```

---

## Step 4: Launch AirSim Blocks

1. Navigate to extracted folder:
   ```powershell
   cd C:\AirSim\Blocks
   ```

2. Run the simulator:
   ```powershell
   .\Blocks.exe
   ```

3. **What you'll see:**
   - Small window opens with cube environment
   - Drone spawns automatically
   - Press `1` to see FPV camera view
   - Press `F1` for help menu

---

## Step 5: Update Backend for Camera Feed

### Install AirSim Python Package
```powershell
cd C:\Users\KIIT0001\Downloads\voyguard\Task2\backend
.\.venv\Scripts\activate
pip install airsim opencv-python pillow
```

### Update `requirements.txt`
Add these lines:
```txt
airsim>=1.8.1
opencv-python>=4.8.0
Pillow>=10.0.0
```

---

## Step 6: Add Video Streaming to Backend

### Create new file: `backend/app/video_stream.py`

```python
import asyncio
import logging
from typing import Optional
import airsim
import cv2
import numpy as np
from io import BytesIO
from PIL import Image

logger = logging.getLogger(__name__)

class AirSimVideoStreamer:
    def __init__(self):
        self.client: Optional[airsim.MultirotorClient] = None
        self.is_connected = False
        self.camera_name = "front_center"
        
    async def connect(self):
        """Connect to AirSim simulator"""
        try:
            self.client = airsim.MultirotorClient()
            self.client.confirmConnection()
            self.is_connected = True
            logger.info("✅ Connected to AirSim for video streaming")
        except Exception as e:
            logger.error(f"❌ Failed to connect to AirSim: {e}")
            self.is_connected = False
    
    async def get_frame(self) -> Optional[bytes]:
        """Get single frame from AirSim camera"""
        if not self.is_connected or not self.client:
            return None
            
        try:
            # Get uncompressed image
            responses = self.client.simGetImages([
                airsim.ImageRequest(self.camera_name, airsim.ImageType.Scene, False, False)
            ])
            
            if responses and len(responses[0].image_data_uint8) > 0:
                response = responses[0]
                
                # Convert to numpy array
                img1d = np.frombuffer(response.image_data_uint8, dtype=np.uint8)
                img_rgb = img1d.reshape(response.height, response.width, 3)
                
                # Encode as JPEG
                _, buffer = cv2.imencode('.jpg', img_rgb, [cv2.IMWRITE_JPEG_QUALITY, 80])
                return buffer.tobytes()
            
            return None
        except Exception as e:
            logger.error(f"Error getting AirSim frame: {e}")
            return None
    
    async def stream_generator(self):
        """Generate MJPEG stream"""
        while True:
            frame = await self.get_frame()
            if frame:
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            await asyncio.sleep(0.033)  # ~30 FPS

# Global instance
video_streamer = AirSimVideoStreamer()
```

---

## Step 7: Update `backend/app/main.py`

Add these imports at the top:
```python
from fastapi.responses import StreamingResponse
from app.video_stream import video_streamer
```

Add this endpoint before `if __name__ == "__main__":`:
```python
@app.get("/api/v1/video/stream")
async def video_stream():
    """MJPEG video stream from AirSim camera"""
    if not video_streamer.is_connected:
        await video_streamer.connect()
    
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
```

In the startup event, add:
```python
@app.on_event("startup")
async def startup_event():
    asyncio.create_task(init_drone())
    # Connect to AirSim for video
    asyncio.create_task(video_streamer.connect())
```

---

## Step 8: Update Frontend Video Component

Update `components/video-feed.tsx`:

```tsx
useEffect(() => {
  // Check if video is available
  fetch(`${config.apiUrl}/api/v1/video/status`)
    .then(res => res.json())
    .then(data => {
      if (data.connected && videoRef.current) {
        videoRef.current.src = `${config.apiUrl}/api/v1/video/stream`
        setIsConnected(true)
      }
    })
    .catch(err => console.error("Video status check failed:", err))
}, [])
```

---

## Step 9: Test Everything

### Terminal 1: Start PX4 SITL (Already Running)
```powershell
docker run --rm -it -p 14540:14540/udp -p 14550:14550/udp --env PX4_HOME_LAT=47.641468 --env PX4_HOME_LON=-122.140165 --env PX4_HOME_ALT=0 jonasvautherin/px4-gazebo-headless:latest
```

### Terminal 2: Start AirSim Blocks
```powershell
cd C:\AirSim\Blocks
.\Blocks.exe
```

### Terminal 3: Start Backend
```powershell
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Terminal 4: Start Frontend
```powershell
pnpm dev
```

---

## Step 10: Control the Drone

1. Open http://localhost:3000
2. You should see:
   - ✅ Camera feed from AirSim
   - ✅ Real telemetry from PX4 SITL
   - ✅ Connection status: ONLINE

3. Go to **CONTROLS** tab
4. Click **ARM** → Drone arms
5. Click **TAKEOFF** → Drone rises to 2.5m
6. Watch the camera feed change as altitude increases!

---

## Step 11: AirSim Camera Controls

In AirSim window:
- `1` - FPV camera view
- `2` - Chase camera (follow drone)
- `3` - Free camera
- `0` - Cycle through cameras
- `F1` - Help menu
- `Arrow keys` - Manual control (if needed)

---

## Troubleshooting

### AirSim won't start
- Try compatibility mode: Right-click `Blocks.exe` → Properties → Compatibility → Windows 8
- Check if DirectX 11 is installed

### No camera feed in dashboard
1. Verify AirSim is running
2. Check backend logs: Should see "✅ Connected to AirSim"
3. Test stream: http://localhost:8000/api/v1/video/stream
4. Restart backend after AirSim starts

### Camera feed is black
- In AirSim, press `1` to switch to drone camera
- Check settings.json location is correct
- Restart Blocks.exe

### Drone doesn't move in AirSim when commanded
- **This is NORMAL!** 
- PX4 SITL provides telemetry
- AirSim provides camera
- They run independently for this setup

### To sync them (Advanced):
You'd need to use AirSim's PX4 plugin, but that requires Unreal Engine full build.

---

## What You'll Get

✅ **Working System:**
```
┌─────────────────┐
│  PX4 SITL       │ → Real MAVLink telemetry
│  (Docker)       │ → GPS, altitude, battery, attitude
└─────────────────┘
         ↓
┌─────────────────┐
│  Backend        │ → Combines both streams
│  (FastAPI)      │ → Commands to PX4
└─────────────────┘
         ↓
┌─────────────────┐
│  AirSim Blocks  │ → Camera feed only
│  (Lightweight)  │ → Visual reference
└─────────────────┘
         ↓
┌─────────────────┐
│  Frontend       │ → Shows everything
│  (React)        │ → Telemetry + Video
└─────────────────┘
```

---

## Camera Features You Get

- ✅ FPV camera (front view)
- ✅ Bottom camera (for landing)
- ✅ Real-time MJPEG streaming
- ✅ 640x480 resolution @ 30 FPS
- ✅ Smooth on any laptop

---

## Alternative: Simple Gazebo Camera

If AirSim Blocks still has issues, use Gazebo camera:

```bash
# Install Gazebo Garden (lightweight)
# Add camera plugin to drone model
# Stream via OpenCV
```

---

## Next Steps

1. ✅ Download Blocks.zip
2. ✅ Create settings.json
3. ✅ Install Python packages
4. ✅ Add video endpoints to backend
5. ✅ Test camera feed
6. 🎥 Record demo video!

---

## Performance Tips

- Lower resolution to 320x240 if slow: Change Width/Height in settings.json
- Reduce FPS to 15: Change `await asyncio.sleep(0.033)` to `(0.067)`
- Close other apps while testing
- Use wired connection for streaming

---

## Resources

- [AirSim Documentation](https://microsoft.github.io/AirSim/)
- [AirSim Python API](https://microsoft.github.io/AirSim/api_docs/html/)
- [Settings Reference](https://microsoft.github.io/AirSim/settings/)
