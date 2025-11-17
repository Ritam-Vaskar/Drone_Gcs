"use client"

interface TelemetryData {
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
  health?: any
  timestamp?: string
}

interface TelemetryPanelProps {
  telemetry: TelemetryData | null
  connected: boolean
}

export default function TelemetryPanel({ telemetry, connected }: TelemetryPanelProps) {
  if (!connected) {
    return (
      <div className="p-6">
        <div className="bg-red-950/30 border border-red-900/50 rounded p-6 text-center">
          <div className="text-red-400 font-mono">⚠ NO CONNECTION</div>
          <div className="text-red-700 text-sm mt-2">Initializing telemetry stream...</div>
        </div>
      </div>
    )
  }

  const groundSpeed = telemetry?.velocity
    ? Math.sqrt(
        telemetry.velocity.north_m_s ** 2 + telemetry.velocity.east_m_s ** 2,
      )
    : 0

  return (
    <div className="p-6 space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Altitude */}
        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
          <div className="text-cyan-600 text-xs font-mono uppercase mb-2">Altitude</div>
          <div className="text-cyan-300 text-2xl font-mono font-bold">
            {telemetry?.position?.relative_alt_m?.toFixed(2) || "0"}
          </div>
          <div className="text-cyan-700 text-xs font-mono">meters AGL</div>
        </div>

        {/* Ground Speed */}
        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
          <div className="text-cyan-600 text-xs font-mono uppercase mb-2">Ground Speed</div>
          <div className="text-cyan-300 text-2xl font-mono font-bold">{groundSpeed.toFixed(2)}</div>
          <div className="text-cyan-700 text-xs font-mono">m/s</div>
        </div>

        {/* Battery */}
        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
          <div className="text-cyan-600 text-xs font-mono uppercase mb-2">Battery</div>
          <div className="text-cyan-300 text-2xl font-mono font-bold">
            {telemetry?.battery?.remaining_percent || "0"}%
          </div>
          <div className="text-cyan-700 text-xs font-mono">{telemetry?.battery?.voltage_v?.toFixed(2)}V</div>
        </div>

        {/* Flight Mode */}
        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
          <div className="text-cyan-600 text-xs font-mono uppercase mb-2">Flight Mode</div>
          <div className="text-cyan-300 text-2xl font-mono font-bold">{telemetry?.flight_mode || "UNKNOWN"}</div>
          <div className="text-cyan-700 text-xs font-mono">Current mode</div>
        </div>
      </div>

      {/* Position */}
      <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
        <div className="text-cyan-600 text-xs font-mono uppercase mb-4">GPS Position</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-cyan-700 text-xs mb-1">Latitude</div>
            <div className="text-cyan-300 font-mono">{telemetry?.position?.lat?.toFixed(6) || "0"}</div>
          </div>
          <div>
            <div className="text-cyan-700 text-xs mb-1">Longitude</div>
            <div className="text-cyan-300 font-mono">{telemetry?.position?.lon?.toFixed(6) || "0"}</div>
          </div>
          <div>
            <div className="text-cyan-700 text-xs mb-1">Absolute Alt</div>
            <div className="text-cyan-300 font-mono">{telemetry?.position?.absolute_alt_m?.toFixed(2)}m</div>
          </div>
        </div>
      </div>

      {/* Attitude */}
      <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
        <div className="text-cyan-600 text-xs font-mono uppercase mb-4">Attitude</div>
        <div className="grid grid-cols-3 gap-4">
          <div>
            <div className="text-cyan-700 text-xs mb-1">Roll</div>
            <div className="text-cyan-300 font-mono">{telemetry?.attitude?.roll_deg?.toFixed(2)}°</div>
          </div>
          <div>
            <div className="text-cyan-700 text-xs mb-1">Pitch</div>
            <div className="text-cyan-300 font-mono">{telemetry?.attitude?.pitch_deg?.toFixed(2)}°</div>
          </div>
          <div>
            <div className="text-cyan-700 text-xs mb-1">Yaw</div>
            <div className="text-cyan-300 font-mono">{telemetry?.attitude?.yaw_deg?.toFixed(2)}°</div>
          </div>
        </div>
      </div>
    </div>
  )
}
