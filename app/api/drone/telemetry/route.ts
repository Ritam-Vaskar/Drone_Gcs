import { NextRequest } from "next/server"

let messageCount = 0

export async function GET(request: NextRequest) {
  const encoder = new TextEncoder()

  const customReadable = new ReadableStream({
    start(controller) {
      const interval = setInterval(() => {
        messageCount++
        
        // Simulate drone data with realistic values
        const altitude = 50 + Math.sin(messageCount * 0.01) * 30
        const speed = Math.abs(Math.cos(messageCount * 0.02)) * 15
        const battery = Math.max(20, 100 - (messageCount * 0.05))
        const roll = Math.sin(messageCount * 0.015) * 30
        const pitch = Math.cos(messageCount * 0.012) * 25
        const yaw = (messageCount * 0.5) % 360

        const data = {
          timestamp: new Date().toISOString(),
          connected: true,
          position: {
            lat: 47.3977 + (Math.sin(messageCount * 0.001) * 0.01),
            lon: 8.5456 + (Math.cos(messageCount * 0.001) * 0.01),
            relative_alt_m: altitude,
            absolute_alt_m: altitude + 400,
          },
          attitude: {
            roll_deg: roll,
            pitch_deg: pitch,
            yaw_deg: yaw,
          },
          velocity: {
            north_m_s: Math.sin(messageCount * 0.02) * 5,
            east_m_s: Math.cos(messageCount * 0.02) * 5,
            down_m_s: 0,
          },
          battery: {
            voltage_v: 12.6 - (messageCount * 0.001),
            remaining_percent: battery,
          },
          flight_mode: messageCount < 50 ? "STABILIZE" : messageCount < 150 ? "GUIDED" : "STABILIZE",
          health: {
            is_gyrometer_calibration_ok: true,
            is_accelerometer_calibration_ok: true,
            is_magnetometer_calibration_ok: true,
            is_level_calibration_ok: true,
            is_local_position_ok: true,
            is_global_position_ok: true,
            is_home_position_ok: true,
            is_armable: true,
          },
        }

        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }, 500) // Send data every 500ms

      // Cleanup interval on connection close
      request.signal.addEventListener("abort", () => {
        clearInterval(interval)
        controller.close()
      })
    },
  })

  return new Response(customReadable, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  })
}
