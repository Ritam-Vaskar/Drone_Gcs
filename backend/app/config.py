import os
from dotenv import load_dotenv

load_dotenv()

# Set to True to enable mock mode (test without simulator)
MOCK_MODE = os.getenv("MOCK_MODE", "false").lower() == "true"

SITL_ADDRESS = os.getenv("SITL_ADDRESS", "udp://:14540")
API_KEY = os.getenv("API_KEY", "gcs-secret-key-2024")
BACKEND_HOST = os.getenv("BACKEND_HOST", "0.0.0.0")
BACKEND_PORT = int(os.getenv("BACKEND_PORT", "8000"))
