#!/bin/bash

# MAVLink Drone GCS - Installation Script
# This script sets up both backend and frontend for development

set -e

echo "======================================"
echo "  MAVLink Drone GCS - Installation"
echo "======================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check prerequisites
echo -e "${BLUE}Checking prerequisites...${NC}"

# Check Python
if ! command -v python3 &> /dev/null; then
    echo -e "${RED}✗ Python 3 not found${NC}"
    echo "Please install Python 3.10+ from https://www.python.org/downloads/"
    exit 1
fi

PYTHON_VERSION=$(python3 -c 'import sys; print(".".join(map(str, sys.version_info[:2])))')
echo -e "${GREEN}✓ Python $PYTHON_VERSION found${NC}"

# Check Node.js
if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    echo "Please install Node.js 18+ from https://nodejs.org/"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2)
echo -e "${GREEN}✓ Node.js $NODE_VERSION found${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
fi

NPM_VERSION=$(npm -v)
echo -e "${GREEN}✓ npm $NPM_VERSION found${NC}"

echo ""

# Backend installation
echo -e "${BLUE}[1/2] Setting up Backend...${NC}"

if [ ! -d "backend" ]; then
    echo -e "${RED}✗ backend directory not found${NC}"
    exit 1
fi

cd backend

# Create virtual environment
if [ ! -d ".venv" ]; then
    echo "Creating Python virtual environment..."
    python3 -m venv .venv
    echo -e "${GREEN}✓ Virtual environment created${NC}"
else
    echo -e "${YELLOW}⚠ Virtual environment already exists${NC}"
fi

# Activate virtual environment
if [ -f ".venv/bin/activate" ]; then
    source .venv/bin/activate
elif [ -f ".venv/Scripts/activate" ]; then
    source .venv/Scripts/activate
fi

# Install Python dependencies
echo "Installing Python dependencies..."
pip install -q -r requirements.txt
echo -e "${GREEN}✓ Backend dependencies installed${NC}"

# Check for environment file
if [ ! -f ".env" ]; then
    echo "Creating .env file with default values..."
    cat > .env << EOF
SITL_ADDRESS=udp://:14540
API_KEY=gcs-secret-key-2024
BACKEND_HOST=0.0.0.0
BACKEND_PORT=8000
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
else
    echo -e "${YELLOW}⚠ .env file already exists${NC}"
fi

cd ..
echo ""

# Frontend installation
echo -e "${BLUE}[2/2] Setting up Frontend...${NC}"

if [ ! -d "frontend" ]; then
    echo -e "${RED}✗ frontend directory not found${NC}"
    exit 1
fi

cd frontend

# Install Node dependencies
echo "Installing npm dependencies..."
npm install -q
echo -e "${GREEN}✓ Frontend dependencies installed${NC}"

cd ..
echo ""

# Summary
echo "======================================"
echo -e "${GREEN}✓ Installation Complete!${NC}"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Start the backend (Terminal 1):"
echo -e "   ${BLUE}cd backend${NC}"
echo -e "   ${BLUE}source .venv/bin/activate${NC}"
echo -e "   ${BLUE}uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload${NC}"
echo ""
echo "2. Start the frontend (Terminal 2):"
echo -e "   ${BLUE}cd frontend${NC}"
echo -e "   ${BLUE}npm run dev${NC}"
echo ""
echo "3. Open dashboard:"
echo -e "   ${BLUE}http://localhost:5173${NC}"
echo ""
echo "4. (Optional) Start PX4 SITL simulator (Terminal 3):"
echo -e "   ${BLUE}cd ~/PX4-Autopilot${NC}"
echo -e "   ${BLUE}make px4_sitl gazebo${NC}"
echo ""
echo "Or use this one-command startup:"
echo -e "   ${BLUE}./start.sh${NC}"
echo ""
