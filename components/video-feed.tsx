"use client"

import { useEffect, useRef, useState } from "react"
import { Video, VideoOff } from "lucide-react"
import { config } from "@/lib/config"

export default function VideoFeed() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const imgRef = useRef<HTMLImageElement>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [activeCamera, setActiveCamera] = useState<"front_center" | "bottom_center">("front_center")

  useEffect(() => {
    // Check if AirSim video is available
    fetch(`${config.apiUrl}/api/v1/video/status`)
      .then(res => res.json())
      .then(data => {
        if (data.connected && imgRef.current) {
          // Set MJPEG stream as image source
          imgRef.current.src = `${config.apiUrl}/api/v1/video/stream?t=${Date.now()}`
          setIsConnected(true)
        } else {
          setIsConnected(false)
          // Retry after 5 seconds
          setTimeout(() => {
            if (imgRef.current) {
              imgRef.current.src = `${config.apiUrl}/api/v1/video/stream?t=${Date.now()}`
            }
          }, 5000)
        }
      })
      .catch(err => {
        console.error("Video status check failed:", err)
        setIsConnected(false)
      })
  }, [])

  return (
    <div className="bg-cyan-950/30 border border-cyan-900/50 rounded p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isConnected ? (
            <Video className="w-5 h-5 text-green-400" />
          ) : (
            <VideoOff className="w-5 h-5 text-gray-600" />
          )}
          <h3 className="text-cyan-400 font-mono text-sm uppercase">Drone Camera Feed</h3>
        </div>
        <span
          className={`text-xs font-mono ${
            isConnected ? "text-green-400" : "text-gray-600"
          }`}
        >
          {isConnected ? "● STREAMING" : "○ NO SIGNAL"}
        </span>
      </div>

      <div className="relative aspect-video bg-black rounded overflow-hidden border border-cyan-900/30">
        {/* MJPEG stream as image */}
        <img
          ref={imgRef}
          className={`w-full h-full object-cover ${isConnected ? "block" : "hidden"}`}
          alt="Drone camera feed"
        />
        
        {!isConnected && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center">
              <div className="text-cyan-900 mb-3">
                <svg
                  className="w-20 h-20 mx-auto"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-cyan-700 text-sm font-mono">CAMERA FEED OFFLINE</p>
              <p className="text-cyan-900 text-xs mt-1 font-mono">
                Connect AirSim simulator for live video
              </p>
              <p className="text-cyan-900 text-xs mt-1 font-mono">
                See AIRSIM_SETUP.md for instructions
              </p>
            </div>
          </div>
        )}

        {/* Camera overlay info */}
        {isConnected && (
          <div className="absolute top-3 left-3 bg-black/70 px-2 py-1 rounded">
            <p className="text-xs font-mono text-cyan-400">CAM: {activeCamera.toUpperCase()}</p>
          </div>
        )}

        {/* Recording indicator */}
        {isConnected && (
          <div className="absolute top-3 right-3 flex items-center gap-2 bg-black/70 px-2 py-1 rounded">
            <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            <p className="text-xs font-mono text-red-400">REC</p>
          </div>
        )}
      </div>

      {/* Camera controls */}
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button
          onClick={async () => {
            setActiveCamera("front_center")
            try {
              await fetch(`${config.apiUrl}/api/v1/video/camera/front_center`, { method: "POST" })
              if (imgRef.current) {
                imgRef.current.src = `${config.apiUrl}/api/v1/video/stream?t=${Date.now()}`
              }
            } catch (err) {
              console.error("Failed to switch camera:", err)
            }
          }}
          disabled={!isConnected}
          className={`px-3 py-2 text-xs font-mono rounded border transition-colors ${
            activeCamera === "front_center"
              ? "bg-cyan-600/50 border-cyan-600 text-cyan-300"
              : "bg-cyan-950/50 border-cyan-900/50 text-cyan-700 hover:border-cyan-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          📹 FPV (FRONT)
        </button>
        <button
          onClick={async () => {
            setActiveCamera("bottom_center")
            try {
              await fetch(`${config.apiUrl}/api/v1/video/camera/bottom_center`, { method: "POST" })
              if (imgRef.current) {
                imgRef.current.src = `${config.apiUrl}/api/v1/video/stream?t=${Date.now()}`
              }
            } catch (err) {
              console.error("Failed to switch camera:", err)
            }
          }}
          disabled={!isConnected}
          className={`px-3 py-2 text-xs font-mono rounded border transition-colors ${
            activeCamera === "bottom_center"
              ? "bg-cyan-600/50 border-cyan-600 text-cyan-300"
              : "bg-cyan-950/50 border-cyan-900/50 text-cyan-700 hover:border-cyan-700"
          } disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          ⬇️ BOTTOM (LANDING)
        </button>
      </div>

      {/* Status info */}
      <div className={`mt-3 p-2 border rounded ${
        isConnected 
          ? "bg-green-950/30 border-green-900/50" 
          : "bg-yellow-950/30 border-yellow-900/50"
      }`}>
        <p className={`text-xs font-mono ${
          isConnected ? "text-green-700" : "text-yellow-700"
        }`}>
          {isConnected 
            ? "✅ AirSim Blocks connected - Streaming live video" 
            : "⚠️  Start AirSim Blocks.exe for camera feed"}
        </p>
        <p className={`text-xs font-mono mt-1 ${
          isConnected ? "text-green-800" : "text-yellow-800"
        }`}>
          Telemetry source: PX4 SITL | Video: {isConnected ? "AirSim" : "Offline"}
        </p>
      </div>
    </div>
  )
}
