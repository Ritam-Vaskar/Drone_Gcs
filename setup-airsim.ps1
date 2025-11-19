# AirSim Blocks Auto-Setup Script
# Run this in PowerShell to create settings.json automatically

Write-Host "🚁 Setting up AirSim Blocks for Drone GCS..." -ForegroundColor Cyan

# Create AirSim directory
$airsimDir = "$env:USERPROFILE\Documents\AirSim"
Write-Host "📁 Creating directory: $airsimDir" -ForegroundColor Yellow
New-Item -ItemType Directory -Force -Path $airsimDir | Out-Null

# Settings JSON content
$settingsJson = @'
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
      "X": 0,
      "Y": 0,
      "Z": -2
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
'@

# Write settings file
$settingsPath = Join-Path $airsimDir "settings.json"
Write-Host "📝 Creating settings file: $settingsPath" -ForegroundColor Yellow
$settingsJson | Out-File -FilePath $settingsPath -Encoding UTF8

Write-Host ""
Write-Host "✅ AirSim settings configured successfully!" -ForegroundColor Green
Write-Host ""
Write-Host "📥 Next steps:" -ForegroundColor Cyan
Write-Host "1. Download Blocks.zip from: https://github.com/microsoft/AirSim/releases" -ForegroundColor White
Write-Host "2. Extract to C:\AirSim\Blocks\" -ForegroundColor White
Write-Host "3. Run: .\Blocks.exe" -ForegroundColor White
Write-Host ""
Write-Host "📍 Settings file location:" -ForegroundColor Cyan
Write-Host $settingsPath -ForegroundColor White
Write-Host ""
Write-Host "🔍 Opening settings directory..." -ForegroundColor Yellow
Start-Process explorer.exe $airsimDir
