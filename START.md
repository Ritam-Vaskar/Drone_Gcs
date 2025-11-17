# Quick Start - Run Locally in 5 Minutes

## Prerequisites

- Python 3.10+
- Node.js 18+
- Git

## 1️⃣ Clone or Download Project

\`\`\`bash
cd drone-gcs
\`\`\`

## 2️⃣ Start Backend (Terminal 1)

\`\`\`bash
cd backend
python3 -m venv .venv
source .venv/bin/activate  # Windows: .venv\Scripts\activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
\`\`\`

Expected output: `Uvicorn running on http://0.0.0.0:8000`

## 3️⃣ Start Frontend (Terminal 2)

\`\`\`bash
cd frontend
npm install
npm run dev
\`\`\`

Expected output: `Local: http://localhost:5173/`

## 4️⃣ Open Dashboard

Visit: **http://localhost:5173/**

## 5️⃣ (Optional) Start Simulator (Terminal 3)

\`\`\`bash
cd ~/PX4-Autopilot
make px4_sitl gazebo
\`\`\`

Or use ArduPilot:
\`\`\`bash
sim_vehicle.py -v ArduCopter --console --map
\`\`\`

## ✅ You're Done!

You should see:
- Green "ONLINE" indicator when simulator connects
- Real-time telemetry flowing in the dashboard
- Full control over drone (arm, takeoff, land)

## 🎮 Try These Commands

1. **ARM**: Click "ARM" button
2. **TAKEOFF**: Enter altitude (10m default), click "TAKEOFF"
3. **LAND**: Click "LAND" to return to ground

See `SETUP_GUIDE.md` for detailed configuration and troubleshooting.
