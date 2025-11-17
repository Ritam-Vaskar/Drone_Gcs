# Docker PX4 SITL Setup for Windows

## Quick Start with Docker

### 1. Install Docker Desktop
- Download from: https://www.docker.com/products/docker-desktop
- Install and restart your computer
- Enable WSL2 backend if prompted

### 2. Run PX4 SITL in Docker

**PowerShell Terminal 3:**
```powershell
docker run --rm -it -p 14540:14540/udp --name px4_sitl jonasvautherin/px4-gazebo-headless:latest
```

This will:
- Download PX4 SITL image (first time only)
- Start PX4 simulator
- Expose MAVLink on UDP port 14540
- Connect automatically to your backend

### Alternative: With Gazebo GUI (requires X11)
```powershell
# Install VcXsrv or Xming first for X11 support
docker run --rm -it -p 14540:14540/udp -e DISPLAY=host.docker.internal:0 jonasvautherin/px4-gazebo:latest
```

## Expected Output

When PX4 SITL starts successfully:
```
INFO  [simulator] Simulator connected on UDP port 14540
INFO  [commander] HOME SET
pxh> 
```

Your backend should then show:
```
INFO:     Connected to drone simulator
```

And frontend will show: **● ONLINE** (green)

## Troubleshooting

### Firewall Issues
If backend can't connect, allow UDP 14540:
```powershell
New-NetFirewallRule -DisplayName "MAVLink SITL" -Direction Inbound -Protocol UDP -LocalPort 14540 -Action Allow
```

### Docker Issues
- Ensure Docker Desktop is running
- Check WSL2 is enabled
- Restart Docker Desktop if needed

## Manual PX4 Build (Advanced - Linux/WSL2 only)

If you have WSL2 Ubuntu:
```bash
# Inside WSL2
cd ~
git clone https://github.com/PX4/PX4-Autopilot.git --recursive
cd PX4-Autopilot
bash ./Tools/setup/ubuntu.sh
make px4_sitl_default gazebo-classic
```

Then access from Windows at: `udp://localhost:14540`
