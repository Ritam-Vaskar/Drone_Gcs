#!/bin/bash

# MAVLink Drone GCS - Unified Startup Script
# This script starts both backend and frontend in separate processes

set -e

echo "======================================"
echo "  MAVLink Drone GCS - Startup Script"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Backend setup and start
echo -e "${BLUE}[1/2] Starting Backend...${NC}"
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d ".venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv .venv
fi

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
fi

# Install dependencies
echo "Installing backend dependencies..."
pip install -q -r requirements.txt

# Start backend in background
echo -e "${GREEN}✓ Backend ready${NC}"
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"
sleep 2

# Frontend setup and start
echo ""
echo -e "${BLUE}[2/2] Starting Frontend...${NC}"
cd ../frontend

echo "Installing frontend dependencies..."
npm install -q

# Start frontend in background
echo -e "${GREEN}✓ Frontend ready${NC}"
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"
sleep 2

# Display startup information
echo ""
echo "======================================"
echo -e "${GREEN}✓ All services started!${NC}"
echo "======================================"
echo ""
echo "Access points:"
echo -e "  Backend API:  ${BLUE}http://localhost:8000${NC}"
echo -e "  Frontend:     ${BLUE}http://localhost:5173${NC}"
echo -e "  WebSocket:    ${BLUE}ws://localhost:8000/ws${NC}"
echo ""
echo "Available commands:"
echo "  - ARM drone"
echo "  - DISARM drone"
echo "  - TAKEOFF (specify altitude)"
echo "  - LAND"
echo ""
echo "To stop the servers:"
echo "  Press Ctrl+C in this terminal"
echo ""
echo "To start PX4 SITL simulator (optional, in another terminal):"
echo "  cd ~/PX4-Autopilot"
echo "  make px4_sitl gazebo"
echo ""
echo "Or start ArduPilot simulator:"
echo "  sim_vehicle.py -v ArduCopter --console --map"
echo ""

# Wait for signals
trap "kill $BACKEND_PID $FRONTEND_PID 2>/dev/null; exit 0" SIGINT SIGTERM

wait
