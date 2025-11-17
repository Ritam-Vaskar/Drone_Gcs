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

export class MockTelemetryClient {
  private listeners: Set<(data: TelemetryData) => void> = new Set()
  private statusListeners: Set<(connected: boolean) => void> = new Set()
  private pollingInterval: NodeJS.Timeout | null = null
  private isConnected = false
  private messageCount = 0

  connect(): Promise<void> {
    return new Promise((resolve) => {
      if (this.pollingInterval) {
        clearInterval(this.pollingInterval)
      }

      this.isConnected = true
      this.notifyStatusListeners(true)
      console.log("[v0] Telemetry polling started")

      // Start polling for telemetry data
      this.pollingInterval = setInterval(() => {
        this.messageCount++
        const data = this.generateTelemetryData()
        this.notifyListeners(data)
      }, 500)

      resolve()
    })
  }

  private generateTelemetryData(): TelemetryData {
    const altitude = 50 + Math.sin(this.messageCount * 0.01) * 30
    const speed = Math.abs(Math.cos(this.messageCount * 0.02)) * 15
    const battery = Math.max(20, 100 - this.messageCount * 0.05)
    const roll = Math.sin(this.messageCount * 0.015) * 30
    const pitch = Math.cos(this.messageCount * 0.012) * 25
    const yaw = (this.messageCount * 0.5) % 360

    return {
      timestamp: new Date().toISOString(),
      connected: this.isConnected,
      position: {
        lat: 47.3977 + Math.sin(this.messageCount * 0.001) * 0.01,
        lon: 8.5456 + Math.cos(this.messageCount * 0.001) * 0.01,
        relative_alt_m: altitude,
        absolute_alt_m: altitude + 400,
      },
      attitude: {
        roll_deg: roll,
        pitch_deg: pitch,
        yaw_deg: yaw,
      },
      velocity: {
        north_m_s: Math.sin(this.messageCount * 0.02) * 5,
        east_m_s: Math.cos(this.messageCount * 0.02) * 5,
        down_m_s: 0,
      },
      battery: {
        voltage_v: 12.6 - this.messageCount * 0.001,
        remaining_percent: battery,
      },
      flight_mode:
        this.messageCount < 50
          ? "STABILIZE"
          : this.messageCount < 150
            ? "GUIDED"
            : "STABILIZE",
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
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval)
      this.pollingInterval = null
    }
    this.isConnected = false
    this.notifyStatusListeners(false)
  }

  isConnectedStatus(): boolean {
    return this.isConnected
  }
}

export const telemetryClient = new MockTelemetryClient()
