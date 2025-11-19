import asyncio
import logging
import base64
import socket
from typing import Optional
import cv2
import numpy as np
import msgpack

logger = logging.getLogger(__name__)

class AirSimRPCClient:
    """Simple RPC client for AirSim using msgpack"""
    def __init__(self, host="127.0.0.1", port=41451, timeout=5.0):
        self.host = host
        self.port = port
        self.timeout = timeout
        self.socket: Optional[socket.socket] = None
        self.msg_id = 0
        
    def connect(self):
        """Connect to AirSim RPC server"""
        self.socket = socket.socket(socket.AF_INET, socket.SOCK_STREAM)
        self.socket.settimeout(self.timeout)
        self.socket.connect((self.host, self.port))
        
    def close(self):
        """Close connection"""
        if self.socket:
            self.socket.close()
            self.socket = None
            
    def call(self, method: str, *args):
        """Call an RPC method"""
        if not self.socket:
            raise ConnectionError("Not connected")
            
        self.msg_id += 1
        
        # Pack request: [type, msgid, method, params]
        request = msgpack.packb([0, self.msg_id, method, list(args)])
        self.socket.sendall(request)
        
        # Receive response
        unpacker = msgpack.Unpacker(raw=False)
        while True:
            data = self.socket.recv(4096)
            if not data:
                raise ConnectionError("Connection closed")
            unpacker.feed(data)
            for msg in unpacker:
                if len(msg) == 4 and msg[0] == 1:  # Response message
                    error, result = msg[2], msg[3]
                    if error:
                        raise Exception(f"RPC Error: {error}")
                    return result
        
class AirSimVideoStreamer:
    def __init__(self):
        self.is_connected = False
        self.camera_name = "front_center"
        self.client: Optional[AirSimRPCClient] = None
        self._connect_lock = asyncio.Lock()
        # Map friendly names to AirSim camera indices
        self.camera_map = {
            "front_center": "0",
            "bottom_center": "1"
        }

    async def connect(self):
        """Connect to AirSim RPC server."""
        async with self._connect_lock:
            if self.is_connected:
                return
            try:
                def _mk_client():
                    client = AirSimRPCClient()
                    client.connect()
                    # Test connection
                    try:
                        client.call('ping')
                    except:
                        pass  # Some AirSim versions don't have ping
                    return client
                
                self.client = await asyncio.to_thread(_mk_client)
                self.is_connected = True
                logger.info("✅ Connected to AirSim RPC API for video streaming")
            except Exception as e:
                logger.warning(f"⚠️  Could not connect to AirSim: {e}")
                logger.info("💡 Ensure Blocks.exe is running (port 41451)")
                self.is_connected = False

    async def get_frame(self) -> Optional[bytes]:
        """Fetch one frame using AirSim's simGetImage RPC call."""
        if not self.is_connected or not self.client:
            return None
        try:
            camera_id = self.camera_map.get(self.camera_name, "0")
            
            # Call simGetImage: returns compressed PNG image
            def _get_image():
                # ImageType 0 = Scene, pixels_as_float = False, compress = True
                return self.client.call('simGetImage', camera_id, 0)
            
            image_data = await asyncio.to_thread(_get_image)
            
            if not image_data:
                return None
            
            # Decode base64 if it's a string
            if isinstance(image_data, str):
                try:
                    image_data = base64.b64decode(image_data)
                except:
                    image_data = image_data.encode('latin1')
            
            # Decode image
            nparr = np.frombuffer(image_data, dtype=np.uint8)
            img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
            
            if img_bgr is None:
                return None
            
            # Add overlay text
            overlay = f"CAM: {self.camera_name.upper()}"
            cv2.putText(img_bgr, overlay, (10, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, (0, 255, 255), 2)
            
            # Encode as JPEG
            _, buffer = cv2.imencode('.jpg', img_bgr, [cv2.IMWRITE_JPEG_QUALITY, 80])
            return buffer.tobytes()
        except Exception as e:
            logger.debug(f"Error getting AirSim frame: {e}")
            return None
    
    async def stream_generator(self):
        """Generate MJPEG stream"""
        frame_count = 0
        while True:
            frame = await self.get_frame()
            if frame:
                frame_count += 1
                yield (b'--frame\r\n'
                       b'Content-Type: image/jpeg\r\n\r\n' + frame + b'\r\n')
            else:
                # Send a placeholder frame if no data
                if frame_count == 0:
                    # Create a black frame with text
                    placeholder = np.zeros((480, 640, 3), dtype=np.uint8)
                    cv2.putText(placeholder, "Waiting for AirSim...", (150, 240),
                               cv2.FONT_HERSHEY_SIMPLEX, 1, (100, 100, 100), 2)
                    _, buffer = cv2.imencode('.jpg', placeholder)
                    yield (b'--frame\r\n'
                           b'Content-Type: image/jpeg\r\n\r\n' + buffer.tobytes() + b'\r\n')
            
            await asyncio.sleep(0.033)  # ~30 FPS
    
    def switch_camera(self, camera_name: str):
        """Switch to different camera view"""
        valid_cameras = ["front_center", "bottom_center"]
        if camera_name in valid_cameras:
            self.camera_name = camera_name
            logger.info(f"📹 Switched to camera: {camera_name}")
            return True
        return False

# Global instance
video_streamer = AirSimVideoStreamer()
