"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { AlertCircle } from 'lucide-react'
import { config } from "@/lib/config"

interface DroneControlsProps {
  connected: boolean
  telemetry: any
}

export default function DroneControls({ connected, telemetry }: DroneControlsProps) {
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [takeoffAlt, setTakeoffAlt] = useState(10)

  const API_KEY = config.apiKey

  const sendCommand = async (endpoint: string, body: any = {}) => {
    setLoading(true)
    try {
      const response = await fetch(`${config.apiUrl}/api/v1/command/${endpoint}?token=${API_KEY}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await response.json()
      setMessage(data.detail || data.error || "Command sent")

      setTimeout(() => setMessage(""), 3000)
    } catch (error) {
      setMessage("Error sending command")
    } finally {
      setLoading(false)
    }
  }

  if (!connected) {
    return (
      <div className="p-6">
        <div className="bg-red-950/30 border border-red-900/50 rounded p-6 text-center">
          <div className="text-red-400 font-mono">⚠ DRONE NOT CONNECTED</div>
          <div className="text-red-700 text-sm mt-2">Backend is offline. Ensure simulator and backend are running.</div>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Status Alert */}
      {message && (
        <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
          <div className="text-cyan-400 text-sm font-mono">{message}</div>
        </div>
      )}

      {/* Arm/Disarm Controls */}
      <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-6">
        <div className="text-cyan-600 text-xs font-mono uppercase mb-4">Arm Status</div>
        <div className="flex gap-3">
          <Button
            onClick={() => sendCommand("arm")}
            disabled={loading}
            className="bg-green-600 hover:bg-green-700 text-white font-mono"
          >
            ARM
          </Button>
          <Button
            onClick={() => sendCommand("disarm")}
            disabled={loading}
            className="bg-red-600 hover:bg-red-700 text-white font-mono"
          >
            DISARM
          </Button>
        </div>
      </div>

      {/* Takeoff/Land Controls */}
      <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-6">
        <div className="text-cyan-600 text-xs font-mono uppercase mb-4">Flight Controls</div>
        <div className="space-y-4">
          <div>
            <label className="text-cyan-700 text-xs font-mono mb-2 block">Takeoff Altitude (meters)</label>
            <input
              type="number"
              value={takeoffAlt}
              onChange={(e) => setTakeoffAlt(Number(e.target.value))}
              className="w-full bg-neutral-900 border border-cyan-900/50 rounded px-3 py-2 text-cyan-300 font-mono text-sm"
              min="1"
              max="100"
            />
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => sendCommand("takeoff", { altitude_m: takeoffAlt })}
              disabled={loading}
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-mono"
            >
              TAKEOFF
            </Button>
            <Button
              onClick={() => sendCommand("land")}
              disabled={loading}
              className="flex-1 bg-orange-600 hover:bg-orange-700 text-white font-mono"
            >
              LAND
            </Button>
          </div>
        </div>
      </div>

      {/* Safety Warning */}
      <div className="bg-yellow-950/30 border border-yellow-900/50 rounded p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
        <div>
          <div className="text-yellow-600 text-xs font-mono uppercase">Safety Notice</div>
          <div className="text-yellow-700 text-xs mt-1">Ensure simulator is running before sending commands.</div>
        </div>
      </div>
    </div>
  )
}
