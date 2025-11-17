/**
 * WebSocket Telemetry Client Service
 * Handles connection, reconnection, and telemetry streaming
 */

export interface TelemetryData {
  timestamp: string
  connected: boolean
  position?: {
    lat: number
    lon: number
    relative_alt_m: number
    absolute_alt_m: number
  }
  attitude?: {
    roll_deg: number
    pitch_deg: number
    yaw_deg: number
  }
  velocity?: {
    north_m_s: number
    east_m_s: number
    down_m_s: number
  }
  battery?: {
    voltage_v: number
    remaining_percent: number
  }
  flight_mode?: string
  health?: {
    is_gyrometer_calibration_ok: boolean
    is_accelerometer_calibration_ok: boolean
    is_magnetometer_calibration_ok: boolean
    is_level_calibration_ok: boolean
    is_local_position_ok: boolean
    is_global_position_ok: boolean
    is_home_position_ok: boolean
    is_armable: boolean
  }
}

export class TelemetryWebSocket {
  private ws: WebSocket | null = null
  private url: string
  private reconnectAttempts = 0
  private maxReconnectAttempts = 10
  private reconnectDelay = 1000
  private maxReconnectDelay = 30000
  private listeners: Set<(data: TelemetryData) => void> = new Set()
  private statusListeners: Set<(connected: boolean) => void> = new Set()

  constructor(url?: string) {
    // Will be set dynamically when connect() is called
    this.url = url || ""
  }

  connect(url?: string): Promise<void> {
    if (url) {
      this.url = url
    }
    if (!this.url) {
      this.url = "ws://localhost:8000/ws"
    }
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(this.url)

        this.ws.onopen = () => {
          console.log("[v0] WebSocket connected")
          this.reconnectAttempts = 0
          this.reconnectDelay = 1000
          this.notifyStatusListeners(true)
          resolve()
        }

        this.ws.onmessage = (event) => {
          try {
            const data: TelemetryData = JSON.parse(event.data)
            this.notifyListeners(data)
          } catch (e) {
            console.error("[v0] Failed to parse telemetry:", e)
          }
        }

        this.ws.onerror = (error) => {
          console.error("[v0] WebSocket error:", error)
          reject(error)
        }

        this.ws.onclose = () => {
          console.log("[v0] WebSocket closed")
          this.notifyStatusListeners(false)
          this.attemptReconnect()
        }
      } catch (error) {
        console.error("[v0] Connection error:", error)
        reject(error)
      }
    })
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error("[v0] Max reconnection attempts reached")
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(this.reconnectDelay * Math.pow(1.5, this.reconnectAttempts - 1), this.maxReconnectDelay)

    console.log(`[v0] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`)

    setTimeout(() => {
      this.connect().catch(() => {
        // Error will trigger onclose which calls attemptReconnect
      })
    }, delay)
  }

  subscribe(listener: (data: TelemetryData) => void): () => void {
    this.listeners.add(listener)
    return () => this.listeners.delete(listener)
  }

  subscribeToStatus(listener: (connected: boolean) => void): () => void {
    this.statusListeners.add(listener)
    return () => this.statusListeners.delete(listener)
  }

  private notifyListeners(data: TelemetryData): void {
    this.listeners.forEach((listener) => {
      try {
        listener(data)
      } catch (e) {
        console.error("[v0] Error in telemetry listener:", e)
      }
    })
  }

  private notifyStatusListeners(connected: boolean): void {
    this.statusListeners.forEach((listener) => {
      try {
        listener(connected)
      } catch (e) {
        console.error("[v0] Error in status listener:", e)
      }
    })
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN
  }
}

// Export singleton instance (URL will be set on connect)
export const telemetryClient = new TelemetryWebSocket()
