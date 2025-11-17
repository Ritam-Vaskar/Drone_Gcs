# MAVLink GCS API Specification

## Base URLs

- **REST API**: `http://localhost:8000`
- **WebSocket**: `ws://localhost:8000/ws`

## Authentication

All command endpoints require an API key query parameter:

\`\`\`
?token=gcs-secret-key-2024
\`\`\`

## WebSocket Endpoint

### Connection

\`\`\`javascript
const ws = new WebSocket("ws://localhost:8000/ws");

ws.onmessage = (event) => {
  const telemetry = JSON.parse(event.data);
  console.log(telemetry);
};
\`\`\`

### Telemetry Message Format

\`\`\`json
{
  "timestamp": "2024-11-16T20:00:00.000Z",
  "connected": true,
  "position": {
    "lat": 47.3977,
    "lon": 8.5455,
    "relative_alt_m": 12.3,
    "absolute_alt_m": 450.5
  },
  "attitude": {
    "roll_deg": 0.1,
    "pitch_deg": -1.2,
    "yaw_deg": 45.0
  },
  "velocity": {
    "north_m_s": 2.1,
    "east_m_s": 1.5,
    "down_m_s": -0.3
  },
  "battery": {
    "voltage_v": 11.1,
    "remaining_percent": 75
  },
  "flight_mode": "OFFBOARD",
  "health": {
    "is_gyrometer_calibration_ok": true,
    "is_accelerometer_calibration_ok": true,
    "is_magnetometer_calibration_ok": true,
    "is_level_calibration_ok": true,
    "is_local_position_ok": true,
    "is_global_position_ok": true,
    "is_home_position_ok": true,
    "is_armable": true
  }
}
\`\`\`

## REST Endpoints

### GET /api/v1/status

Get current telemetry snapshot.

**Response:**
\`\`\`json
{
  "connected": true,
  "telemetry": { /* same as WebSocket payload */ },
  "clients": 1
}
\`\`\`

### POST /api/v1/command/arm

Arm the drone.

**Parameters:**
- `token` (query): API key

**Response:**
\`\`\`json
{
  "status": "ok",
  "detail": "Arming drone"
}
\`\`\`

**Example:**
\`\`\`bash
curl -X POST "http://localhost:8000/api/v1/command/arm?token=gcs-secret-key-2024"
\`\`\`

### POST /api/v1/command/disarm

Disarm the drone.

**Parameters:**
- `token` (query): API key

**Response:**
\`\`\`json
{
  "status": "ok",
  "detail": "Disarming drone"
}
\`\`\`

### POST /api/v1/command/takeoff

Take off to specified altitude.

**Parameters:**
- `altitude_m` (query): Altitude in meters (1-100)
- `token` (query): API key

**Response:**
\`\`\`json
{
  "status": "ok",
  "detail": "Taking off to 20m"
}
\`\`\`

**Example:**
\`\`\`bash
curl -X POST "http://localhost:8000/api/v1/command/takeoff?altitude_m=20&token=gcs-secret-key-2024"
\`\`\`

### POST /api/v1/command/land

Land the drone.

**Parameters:**
- `token` (query): API key

**Response:**
\`\`\`json
{
  "status": "ok",
  "detail": "Landing drone"
}
\`\`\`

### GET /health

Health check endpoint.

**Response:**
\`\`\`json
{
  "status": "ok"
}
\`\`\`

## Error Responses

### 401 Unauthorized

\`\`\`json
{
  "detail": "Invalid API key"
}
\`\`\`

### 503 Service Unavailable

\`\`\`json
{
  "status": "error",
  "detail": "Drone not connected"
}
\`\`\`

### 400 Bad Request

\`\`\`json
{
  "status": "error",
  "detail": "Drone is not ready"
}
\`\`\`

## WebSocket Reconnection

The frontend automatically reconnects with exponential backoff if the connection drops.

Reconnection strategy:
- Initial delay: 1s
- Max delay: 30s
- Backoff multiplier: 1.5x

---

**Last Updated:** November 2024
**API Version:** v1
