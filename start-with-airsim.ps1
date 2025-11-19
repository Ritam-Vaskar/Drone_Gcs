# Quick Start Script for Drone GCS with AirSim
# This script sets up and starts all components

Write-Host "🚁 Drone GCS - Quick Start with AirSim" -ForegroundColor Cyan
Write-Host "=======================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup AirSim settings
Write-Host "📝 Step 1: Setting up AirSim configuration..." -ForegroundColor Yellow
& .\setup-airsim.ps1
Write-Host ""

# Step 2: Install Python dependencies
Write-Host "📦 Step 2: Installing Python dependencies..." -ForegroundColor Yellow
cd backend
.\.venv\Scripts\activate
pip install -q airsim opencv-python numpy Pillow
cd ..
Write-Host "✅ Python packages installed" -ForegroundColor Green
Write-Host ""

# Step 3: Instructions
Write-Host "🎮 Next Steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1️⃣  START PX4 SITL (Terminal 1):" -ForegroundColor White
Write-Host "   docker run --rm -it -p 14540:14540/udp -p 14550:14550/udp --env PX4_HOME_LAT=47.641468 --env PX4_HOME_LON=-122.140165 --env PX4_HOME_ALT=0 jonasvautherin/px4-gazebo-headless:latest" -ForegroundColor Gray
Write-Host ""

Write-Host "2️⃣  START AIRSIM BLOCKS (Terminal 2):" -ForegroundColor White
Write-Host "   - Download Blocks.zip from: https://github.com/microsoft/AirSim/releases" -ForegroundColor Gray
Write-Host "   - Extract to C:\AirSim\Blocks\" -ForegroundColor Gray
Write-Host "   - Run: C:\AirSim\Blocks\Blocks.exe" -ForegroundColor Gray
Write-Host ""

Write-Host "3️⃣  START BACKEND (Terminal 3):" -ForegroundColor White
Write-Host "   cd backend" -ForegroundColor Gray
Write-Host "   .\.venv\Scripts\activate" -ForegroundColor Gray
Write-Host "   uvicorn app.main:app --reload --host 0.0.0.0 --port 8000" -ForegroundColor Gray
Write-Host ""

Write-Host "4️⃣  START FRONTEND (Terminal 4):" -ForegroundColor White
Write-Host "   pnpm dev" -ForegroundColor Gray
Write-Host ""

Write-Host "5️⃣  OPEN DASHBOARD:" -ForegroundColor White
Write-Host "   http://localhost:3000" -ForegroundColor Gray
Write-Host ""

Write-Host "✨ You'll see:" -ForegroundColor Cyan
Write-Host "   ✅ Real telemetry from PX4 SITL" -ForegroundColor Green
Write-Host "   ✅ Live camera feed from AirSim" -ForegroundColor Green
Write-Host "   ✅ ARM, TAKEOFF, LAND controls" -ForegroundColor Green
Write-Host "   ✅ Switch between FPV and Bottom cameras" -ForegroundColor Green
Write-Host ""

Write-Host "📖 Full guide: AIRSIM_BLOCKS_SETUP.md" -ForegroundColor Yellow
Write-Host ""
