interface ConnectionStatusProps {
  connected: boolean
}

export default function ConnectionStatus({ connected }: ConnectionStatusProps) {
  return (
    <div className="flex items-center gap-2">
      <div className={`w-2 h-2 rounded-full ${connected ? "bg-green-500 animate-pulse" : "bg-red-500"}`}></div>
      <span className={`text-xs font-mono ${connected ? "text-green-500" : "text-red-500"}`}>
        {connected ? "CONNECTED" : "DISCONNECTED"}
      </span>
    </div>
  )
}
