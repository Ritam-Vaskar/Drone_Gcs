# MAVLink Drone Ground Control System - Setup Guide

## 📋 Prerequisites

Before starting, ensure you have the following installed:

- **Python 3.10+** - [Download](https://www.python.org/downloads/)
- **Node.js 18+** - [Download](https://nodejs.org/)
- **Git** - [Download](https://git-scm.com/)
- **PX4 SITL Simulator** or **ArduPilot SITL** (optional but recommended)

### Check Versions

\`\`\`bash
python3 --version  # Should be 3.10+
node --version      # Should be 18+
npm --version       # Should be 9+
\`\`\`

## 🚀 Installation Steps

### Step 1: Backend Setup

#### 1a. Navigate to Backend Directory

\`\`\`bash
cd backend
\`\`\`

#### 1b. Create Virtual Environment

\`\`\`bash
# On macOS/Linux:
python3 -m venv .venv
source .venv/bin/activate

# On Windows:
python -m venv .venv
.venv\Scripts\activate
\`\`\`

#### 1c. Install Dependencies

\`\`\`bash
pip install -r requirements.txt
\`\`\`

This installs:
- `fastapi` - Web framework
- `uvicorn` - ASGI server
- `mavsdk` - MAVLink SDK for drone communication
- `websockets` - Real-time communication with frontend

### Step 2: Frontend Setup

#### 2a. Navigate to Frontend Directory

\`\`\`bash
cd frontend
\`\`\`

#### 2b. Install Dependencies

\`\`\`bash
npm install
\`\`\`

## 🎮 Running the System Locally

### Option A: Quick Start (All-in-One)

From the **project root** directory, run:

\`\`\`bash
chmod +x start.sh
./start.sh
\`\`\`

This will:
1. Start the Python backend on `http://localhost:8000`
2. Start the React frontend on `http://localhost:5173`
3. Display access URLs

### Option B: Manual Start

#### Terminal 1: Start the Backend

\`\`\`bash
cd backend
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

You should see:
\`\`\`
INFO:     Uvicorn running on http://0.0.0.0:8000
INFO:     Application startup complete
\`\`\`

#### Terminal 2: Start the Frontend

\`\`\`bash
cd frontend
npm run dev
\`\`\`

You should see:
\`\`\`
Local:        http://localhost:5173/
\`\`\`

#### Terminal 3: Start PX4 SITL Simulator (Optional)

If you want to simulate a drone:

**On Ubuntu/Linux:**
\`\`\`bash
cd ~/PX4-Autopilot
make px4_sitl gazebo
\`\`\`

**Or use ArduPilot:**
\`\`\`bash
# Install ArduPilot if not already installed
# Then run:
sim_vehicle.py -v ArduCopter --console --map
\`\`\`

### Step 3: Access the Dashboard

Open your browser and navigate to:

\`\`\`
http://localhost:5173/
\`\`\`

## 🔌 Connection Status

- **Backend API**: `http://localhost:8000`
- **WebSocket**: `ws://localhost:8000/ws`
- **Frontend**: `http://localhost:5173`

### Expected Behavior

| Status | Indicator | Meaning |
|--------|-----------|---------|
| ✓ Online | Green dot | Simulator connected & telemetry flowing |
| ✗ Offline | Red dot | Simulator not running or backend down |

## 🎯 Features Available

### Telemetry Panel
- Real-time altitude, speed, battery, and flight mode
- GPS coordinates and absolute altitude
- Aircraft attitude (roll, pitch, yaw)
- Battery voltage and percentage

### Controls Panel
- **ARM** - Arm the drone
- **DISARM** - Disarm the drone
- **TAKEOFF** - Take off to specified altitude (1-100m)
- **LAND** - Land the drone

### Systems Panel
- Sensor calibration status
- GPS and local position health

## 🚨 Troubleshooting

### Issue: "Cannot connect to simulator"

**Solution:**
1. Ensure PX4 SITL is running: `make px4_sitl gazebo`
2. Check that the SITL is listening on UDP port 14540
3. Verify firewall settings allow localhost connections

\`\`\`bash
# Test connection
nc -uz localhost 14540
\`\`\`

### Issue: "WebSocket connection failed"

**Solution:**
1. Verify backend is running on port 8000
2. Check CORS settings (should allow `*` for development)
3. Try accessing `http://localhost:8000/health` - should return `{"status":"ok"}`

### Issue: "Commands not working"

**Solution:**
1. Ensure drone is armed before takeoff/land
2. Check that simulator is sending telemetry
3. Verify API key in frontend matches backend (`gcs-secret-key-2024`)

### Issue: npm install fails

**Solution:**
\`\`\`bash
# Clear cache and retry
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
\`\`\`

## 🔧 Configuration

### Backend Configuration

Edit `backend/.env`:

\`\`\`env
SITL_ADDRESS=udp://:14540        # Simulator address
API_KEY=gcs-secret-key-2024      # API authentication key
BACKEND_HOST=0.0.0.0              # Server host
BACKEND_PORT=8000                 # Server port
\`\`\`

### API Endpoints

| Endpoint | Method | Purpose |
|----------|--------|---------|
| `/api/v1/status` | GET | Get current telemetry |
| `/api/v1/command/arm` | POST | Arm drone |
| `/api/v1/command/disarm` | POST | Disarm drone |
| `/api/v1/command/takeoff` | POST | Takeoff to altitude |
| `/api/v1/command/land` | POST | Land drone |

**Example API Call:**
\`\`\`bash
curl -X POST "http://localhost:8000/api/v1/command/arm?token=gcs-secret-key-2024"
\`\`\`

## 📱 Project Structure

\`\`\`
drone-gcs/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI application
│   │   └── config.py        # Configuration
│   ├── requirements.txt      # Python dependencies
│   ├── .env                  # Environment variables
│   └── run.sh               # Backend startup script
├── frontend/
│   ├── src/
│   │   ├── components/      # React components
│   │   ├── pages/           # Next.js pages
│   │   └── services/        # WebSocket client
│   ├── package.json
│   └── vite.config.js
├── SETUP_GUIDE.md           # This file
├── START.md                 # Quick start guide
└── API_SPEC.md             # API documentation
\`\`\`

## 📚 Next Steps

1. **Simulator Integration** - Set up PX4 or ArduPilot SITL
2. **Mission Planning** - Add waypoint support
3. **Data Logging** - Record telemetry to database
4. **Cloud Deployment** - Deploy to AWS/DigitalOcean
5. **Mobile UI** - Responsive design for tablets/phones

## 🆘 Support

For issues or questions:
1. Check the Troubleshooting section
2. Review backend logs: `http://localhost:8000/health`
3. Check frontend browser console (F12)
4. Refer to [MAVSDK Documentation](https://mavsdk.mavlink.io/)

---

**Last Updated:** November 2024
**Version:** 1.0.0
