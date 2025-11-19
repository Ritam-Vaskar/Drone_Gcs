# Complete Testing Guide - Drone GCS with AirSim

## 🎯 What You'll Achieve
- ✅ See real-time telemetry (GPS, altitude, attitude, speed)
- ✅ Watch live camera feed from drone perspective
- ✅ Control drone (ARM → TAKEOFF → watch altitude increase → LAND)
- ✅ Switch camera views (FPV front vs Bottom landing camera)

---

## 📋 Prerequisites Checklist

### Already Installed ✅
- [x] Docker Desktop running
- [x] Python 3.13.7 in `.venv`
- [x] Node.js and pnpm
- [x] PX4 SITL image: `jonasvautherin/px4-gazebo-headless`

### Need to Download 📥
- [ ] **AirSim Blocks** (~500MB) from https://github.com/microsoft/AirSim/releases
  - Look for: `Blocks.zip` (Windows x64)
  - Extract to: `C:\AirSim\Blocks\`

---

## 🚀 Step-by-Step Setup

### Step 1: Configure AirSim (One-Time Setup)

Run the auto-setup script:
```powershell
.\setup-airsim.ps1
```

**What it does:**
- Creates `%USERPROFILE%\Documents\AirSim\settings.json`
- Configures 2 cameras (front FPV + bottom landing)
- Sets resolution to 640x480 (smooth on any laptop)

**Verify:**
```powershell
cat $env:USERPROFILE\Documents\AirSim\settings.json
```
You should see JSON with "Drone1" vehicle config.

---

### Step 2: Install Backend Dependencies

```powershell
cd backend
.\.venv\Scripts\activate
pip install airsim opencv-python numpy Pillow
```

**Verify:**
```powershell
pip list | Select-String "airsim|opencv"
```

---

### Step 3: Start All Components

#### Terminal 1: PX4 SITL (Telemetry Source)
```powershell
docker run --rm -it `
  -p 14540:14540/udp `
  -p 14550:14550/udp `
  --env PX4_HOME_LAT=47.641468 `
  --env PX4_HOME_LON=-122.140165 `
  --env PX4_HOME_ALT=0 `
  jonasvautherin/px4-gazebo-headless:latest
```

**✅ Success indicators:**
```
INFO  [mavlink] mode: Onboard, data rate: 4000000 B/s on udp port 14580
INFO  [px4] Startup script returned successfully
```

#### Terminal 2: AirSim Blocks (Camera Source)
```powershell
cd C:\AirSim\Blocks
.\Blocks.exe
```

**✅ Success indicators:**
- Window opens with 3D cube environment
- Drone appears in center
- Press `1` key → See FPV camera view
- Press `F1` → Help menu appears

**Keyboard controls in AirSim:**
- `1` - FPV camera
- `2` - Chase camera
- `3` - Free camera
- `F1` - Help
- Arrow keys - Manual movement (optional)

#### Terminal 3: Backend Server
```powershell
cd backend
.\.venv\Scripts\activate
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

**✅ Success indicators:**
```
INFO:app.main:Connecting to simulator at udp://:14540...
INFO:app.main:Connected to drone simulator
INFO:app.main:✅ Connected to AirSim for video streaming
```

**⚠️ If you see:**
```
⚠️  Could not connect to AirSim: [Error]
```
**Fix:** Make sure Blocks.exe is running, then restart backend.

#### Terminal 4: Frontend Dashboard
```powershell
pnpm dev
```

**✅ Success indicators:**
```
✓ Ready in 2s
○ Local:   http://localhost:3000
```

---

## 🧪 Testing Sequence

### 1. Open Dashboard
Navigate to: **http://localhost:3000**

**What you should see:**
- Top-right: `● ONLINE` (green)
- Left panel: "CONNECTED" with MODE, ALT, BAT
- Main area: Camera feed (or "NO SIGNAL" if AirSim not connected)
- Telemetry cards showing real values

### 2. Verify Telemetry Connection

**Check these values are updating:**
- ✅ GPS Position: Lat/Lon around 47.6/-122.1
- ✅ Altitude: 0 meters AGL
- ✅ Flight Mode: "UNKNOWN" or "READY"
- ✅ Connection status: Green

**If stuck at "OFFLINE":**
1. Check PX4 SITL is running (Terminal 1)
2. Check backend logs for connection errors
3. Restart backend

### 3. Test Camera Feed

**In dashboard:**
- Look at "DRONE CAMERA FEED" panel
- Should see: `● STREAMING` (green) if AirSim connected
- Should see: Live video from AirSim environment

**If showing "NO SIGNAL":**
1. Verify AirSim Blocks.exe is running
2. In AirSim, press `1` to switch to drone camera
3. Check backend logs: Should see "✅ Connected to AirSim"
4. Refresh browser page

**Test camera switching:**
- Click `📹 FPV (FRONT)` → See forward view
- Click `⬇️ BOTTOM (LANDING)` → See downward view

### 4. Test Drone Commands

#### Step A: ARM the Drone
1. Click **CONTROLS** in left sidebar
2. Click **ARM** button
3. **✅ Expected:** Status changes to "Armed"

**Backend logs should show:**
```
INFO:app.main:Arming drone...
```

#### Step B: TAKEOFF
1. Click **TAKEOFF** button
2. **✅ Expected:**
   - Altitude starts increasing: 0m → 1m → 2m → 2.5m
   - Ground speed shows movement
   - In AirSim: Drone rises up (if you're watching)
   - Camera view changes as drone gains altitude

**Watch these values change:**
- Altitude AGL: 0 → 2.5m
- Ground Speed: 0 → ~1.5 m/s → 0
- Vertical Speed: Positive during climb

**⏱ Time to reach 2.5m:** ~3-5 seconds

#### Step C: Observe Flight
Let it hover at 2.5m for 10 seconds.

**Check:**
- Altitude stable at ~2.5m
- Position holds (GPS coordinates stable)
- Camera shows elevated view
- Roll/Pitch near 0°

#### Step D: LAND
1. Click **LAND** button
2. **✅ Expected:**
   - Altitude decreasing: 2.5m → 2m → 1m → 0m
   - Camera view lowers
   - Touches ground smoothly
   - Status: "Landed"

### 5. Complete Flight Test

**Full sequence:**
```
OFFLINE → ARM → TAKEOFF → HOVER → LAND → DISARM
```

**Expected altitude profile:**
```
0m (ground) → 2.5m (hover) → 0m (landed)
```

**Duration:** ~20 seconds total

---

## 📊 What Each Component Does

### PX4 SITL (Simulator)
- **Provides:** MAVLink telemetry stream
- **Data:** GPS, altitude, attitude, velocity, battery
- **Protocol:** UDP on port 14540
- **Visual:** None (headless)

### AirSim Blocks
- **Provides:** Camera video feed
- **Data:** RGB images from 2 cameras
- **Connection:** TCP localhost
- **Visual:** 3D environment window

### Backend (FastAPI)
- **Connects to:** Both PX4 and AirSim
- **Sends to frontend:** 
  - WebSocket telemetry stream
  - MJPEG video stream
  - Command API (ARM/TAKEOFF/LAND)

### Frontend (React)
- **Displays:** Dashboard with telemetry + video
- **Controls:** Sends commands to backend
- **Updates:** Real-time via WebSocket

---

## 🐛 Troubleshooting

### Problem: "OFFLINE" status
**Cause:** Backend can't connect to PX4 SITL

**Fix:**
1. Verify Docker container running:
   ```powershell
   docker ps
   ```
2. Check port 14540 is exposed
3. Restart backend
4. Check backend logs for errors

### Problem: No camera feed
**Cause:** AirSim not connected

**Fix:**
1. Ensure Blocks.exe is running
2. In AirSim window, press `1` (FPV camera)
3. Check backend logs: Should see "✅ Connected to AirSim"
4. Restart backend after starting AirSim
5. Test stream directly: http://localhost:8000/api/v1/video/stream

### Problem: Altitude stays at 0m
**Cause:** Drone not armed or command failed

**Fix:**
1. Click ARM first
2. Check backend logs for errors
3. Verify PX4 SITL shows "Armed" in terminal
4. Try TAKEOFF again

### Problem: Battery shows 0%
**Cause:** PX4 SITL doesn't simulate battery

**Fix:** This is normal - SITL has infinite battery

### Problem: Flight mode shows "UNKNOWN"
**Cause:** Some PX4 modes not mapped

**Fix:** This is expected - functionality still works

### Problem: AirSim window is black
**Cause:** Camera not initialized

**Fix:**
1. Press `1` to switch to FPV
2. Press `0` to cycle cameras
3. Check settings.json exists
4. Restart Blocks.exe

### Problem: Video is laggy
**Cause:** System resource constraints

**Fix:**
1. Lower resolution in settings.json:
   ```json
   "Width": 320,
   "Height": 240
   ```
2. Reduce frame rate in `video_stream.py`:
   ```python
   await asyncio.sleep(0.067)  # 15 FPS instead of 30
   ```
3. Close other applications

---

## 📈 Advanced Testing

### Test 1: Multiple Takeoffs
```
ARM → TAKEOFF → LAND → TAKEOFF → LAND → DISARM
```

### Test 2: Camera Switching During Flight
```
ARM → TAKEOFF → Switch to BOTTOM camera → Watch ground recede → LAND
```

### Test 3: Telemetry Accuracy
Compare dashboard values with PX4 SITL terminal output.

### Test 4: Connection Recovery
1. Stop PX4 SITL
2. Dashboard shows "OFFLINE"
3. Restart PX4 SITL
4. Backend auto-reconnects
5. Dashboard back to "ONLINE"

---

## ✅ Success Criteria

Your system is working if:
- [ ] Dashboard shows `● ONLINE`
- [ ] Telemetry values update every second
- [ ] Camera feed shows live video
- [ ] ARM command works (status changes)
- [ ] TAKEOFF increases altitude to 2.5m
- [ ] Camera view changes during flight
- [ ] LAND brings drone back to 0m
- [ ] Can switch between front/bottom cameras

---

## 📸 Expected Results

### Before Takeoff
- Altitude: 0m
- Ground Speed: 0 m/s
- Status: Armed
- Camera: Ground level view

### During Climb
- Altitude: 0 → 2.5m (increasing)
- Vertical Speed: +1 to +2 m/s
- Camera: Rising perspective

### At Hover
- Altitude: ~2.5m (stable)
- Ground Speed: ~0 m/s
- Vertical Speed: ~0 m/s
- Camera: Elevated view

### During Landing
- Altitude: 2.5 → 0m (decreasing)
- Vertical Speed: -0.5 to -1 m/s
- Camera: Lowering to ground

---

## 🎥 Recording Demo

To record a demo video:
1. Start all components
2. Open dashboard
3. Use Windows Game Bar: `Win + G`
4. Click Record button
5. Perform: ARM → TAKEOFF → LAND
6. Save recording

---

## 🚀 Next Steps

After successful testing:
1. ✅ Push to GitHub
2. ✅ Document in README
3. 🔄 Experiment with manual controls in AirSim
4. 🔄 Try different environments (if available)
5. 🔄 Add waypoint navigation (future)
6. 🔄 Implement video recording (future)

---

## 📚 Resources

- **AirSim Docs:** https://microsoft.github.io/AirSim/
- **PX4 SITL:** https://docs.px4.io/main/en/simulation/
- **MAVSDK Python:** https://mavsdk.mavlink.io/main/en/python/
- **Your Setup Guides:**
  - `AIRSIM_BLOCKS_SETUP.md` - Detailed AirSim guide
  - `QUICKSTART.md` - Basic setup
  - `SIMULATOR_SETUP.md` - Docker simulator

---

## 💡 Tips

1. **Always start PX4 SITL first** - Backend needs it
2. **Start AirSim before backend** - For video on first try
3. **Use `pnpm dev` for frontend** - Hot reload during testing
4. **Check backend logs** - Best debugging info
5. **Press F1 in AirSim** - See all keyboard shortcuts
6. **Test in this order:** Connection → Telemetry → Commands → Video

---

**Happy Flying! 🚁✨**
