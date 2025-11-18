"use client"

import { useState, useEffect } from "react"
import { ChevronRight, Gauge, Radio, Settings } from 'lucide-react'
import { Button } from "@/components/ui/button"
import TelemetryPanel from "@/components/telemetry-panel"
import DroneControls from "@/components/drone-controls"
import ConnectionStatus from "@/components/connection-status"
import VideoFeed from "@/components/video-feed"
import { telemetryClient } from "@/services/ws"
import { config } from "@/lib/config"

export default function DroneGCS() {
  const [activeSection, setActiveSection] = useState("telemetry")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [connected, setConnected] = useState(false)
  const [telemetry, setTelemetry] = useState(null)

  useEffect(() => {
    telemetryClient.connect(config.wsUrl).catch((error) => {
      console.error("[v0] Failed to connect telemetry:", error)
    })

    const unsubscribe = telemetryClient.subscribe((data) => {
      setTelemetry(data)
    })

    const unsubscribeStatus = telemetryClient.subscribeToStatus((isConnected) => {
      setConnected(isConnected)
    })

    return () => {
      unsubscribe()
      unsubscribeStatus()
      telemetryClient.disconnect()
    }
  }, [])

  return (
    <div className="flex h-screen bg-black">
      {/* Sidebar */}
      <div
        className={`${sidebarCollapsed ? "w-16" : "w-72"} bg-neutral-950 border-r border-cyan-900/30 transition-all duration-300 fixed md:relative z-50 md:z-auto h-full`}
      >
        <div className="p-4">
          <div className="flex items-center justify-between mb-8">
            <div className={`${sidebarCollapsed ? "hidden" : "block"}`}>
              <h1 className="text-cyan-400 font-bold text-lg tracking-widest">DRONE GCS</h1>
              <p className="text-cyan-900 text-xs">MAVLink Ground Control</p>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-cyan-600 hover:text-cyan-400"
            >
              <ChevronRight
                className={`w-4 h-4 transition-transform ${sidebarCollapsed ? "" : "rotate-180"}`}
              />
            </Button>
          </div>

          <nav className="space-y-2">
            {[
              { id: "telemetry", icon: Gauge, label: "TELEMETRY" },
              { id: "controls", icon: Radio, label: "CONTROLS" },
              { id: "systems", icon: Settings, label: "SYSTEMS" },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => setActiveSection(item.id)}
                className={`w-full flex items-center gap-3 p-3 rounded transition-colors ${
                  activeSection === item.id
                    ? "bg-cyan-600/20 text-cyan-400 border border-cyan-600/50"
                    : "text-cyan-700 hover:text-cyan-400 hover:bg-cyan-900/10"
                }`}
              >
                <item.icon className="w-5 h-5" />
                {!sidebarCollapsed && <span className="text-sm font-mono">{item.label}</span>}
              </button>
            ))}
          </nav>

          {!sidebarCollapsed && (
            <div className="mt-8 p-4 bg-cyan-950/30 border border-cyan-900/50 rounded">
              <ConnectionStatus connected={connected} />
              <div className="mt-3 space-y-1 text-xs font-mono text-cyan-700">
                <div>MODE: {telemetry?.flight_mode || "UNKNOWN"}</div>
                <div>ALT: {telemetry?.position?.relative_alt_m?.toFixed(1) || "0"}m</div>
                <div>BAT: {telemetry?.battery?.remaining_percent?.toFixed(0) || "0"}%</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Overlay */}
      {!sidebarCollapsed && (
        <div className="fixed inset-0 bg-black/50 z-40 md:hidden" onClick={() => setSidebarCollapsed(true)} />
      )}

      {/* Main Content */}
      <div className="flex-1 flex flex-col">
        {/* Top Toolbar */}
        <div className="h-16 bg-neutral-950 border-b border-cyan-900/30 flex items-center justify-between px-6">
          <div className="flex items-center gap-4">
            <div className="text-sm font-mono text-cyan-400">
              DRONE GCS / <span className="text-cyan-300">{activeSection.toUpperCase()}</span>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className={`text-xs font-mono ${connected ? "text-green-500" : "text-red-500"}`}>
              {connected ? "● ONLINE" : "● OFFLINE"}
            </div>
          </div>
        </div>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-auto">
          {activeSection === "telemetry" && (
            <div className="p-6">
              <div className="grid gap-4 lg:grid-cols-2">
                <VideoFeed />
                <TelemetryPanel telemetry={telemetry} connected={connected} />
              </div>
            </div>
          )}
          {activeSection === "controls" && <DroneControls connected={connected} telemetry={telemetry} />}
          {activeSection === "systems" && (
            <div className="p-6">
              <div className="text-cyan-400 font-mono mb-4">SYSTEM STATUS</div>
              <div className="grid gap-4">
                {telemetry?.health && (
                  <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
                    <div className="font-mono text-cyan-300 mb-3">SENSOR CALIBRATION</div>
                    <div className="grid grid-cols-2 gap-2 text-xs font-mono text-cyan-700">
                      <div>{telemetry.health.is_gyrometer_calibration_ok ? "✓" : "✗"} Gyro</div>
                      <div>{telemetry.health.is_accelerometer_calibration_ok ? "✓" : "✗"} Accel</div>
                      <div>{telemetry.health.is_magnetometer_calibration_ok ? "✓" : "✗"} Mag</div>
                      <div>{telemetry.health.is_level_calibration_ok ? "✓" : "✗"} Level</div>
                      <div>{telemetry.health.is_local_position_ok ? "✓" : "✗"} Local Pos</div>
                      <div>{telemetry.health.is_global_position_ok ? "✓" : "✗"} GPS</div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
