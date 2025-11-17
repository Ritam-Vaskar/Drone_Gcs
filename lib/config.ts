/**
 * Application Configuration
 */

export const config = {
  // Backend API URL
  apiUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  
  // WebSocket URL
  wsUrl: process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:8000/ws",
  
  // API Key for backend authentication
  apiKey: process.env.NEXT_PUBLIC_API_KEY || "gcs-secret-key-2024",
}
