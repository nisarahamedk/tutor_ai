import logging
import logging.handlers
import os

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)
log_file_path = "logs/chat_server.log"

handler = logging.handlers.RotatingFileHandler(log_file_path, maxBytes=1000000, backupCount=5)
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')
handler.setFormatter(formatter)
# Get a specific logger for this module if preferred, or configure root logger carefully
chat_logger = logging.getLogger(__name__) # Using a specific logger
chat_logger.setLevel(logging.INFO)
chat_logger.addHandler(handler)
# If you intend to configure the root logger, ensure it's what you want
# logger = logging.getLogger()
# logger.setLevel(logging.INFO)
# logger.addHandler(handler)

from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List
import json
# import logging # logging already imported

# from fastapi.middleware.cors import CORSMiddleware # Middleware is handled in main.py

router = APIRouter()

# app.add_middleware( # This will be done in main.py for the main app instance
#     CORSMiddleware,
#     allow_origins=["*"],  # Allows all origins
#     allow_credentials=True,
#     allow_methods=["*"],  # Allows all methods
#     allow_headers=["*"]  # Allows all headers
# )

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        chat_logger.info("ConnectionManager.connect called")
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

@router.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
    chat_logger.info("WebSocket connected")
    chat_logger.info(f"WebSocket state: {websocket.client_state}")
    try:
        while True:
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
            except json.JSONDecodeError:
                error_response = {
                    "type": "error",
                    "message": "Invalid JSON format"
                }
                await manager.send_personal_message(json.dumps(error_response), websocket)
                continue

            chat_logger.info(f"Received message: {message}")
            if not isinstance(message, dict):
                error_response = {
                    "type": "error",
                    "message": "Message must be a JSON object"
                }
                await manager.send_personal_message(json.dumps(error_response), websocket)
                continue

            if message.get("type") == "start_learning":
                if "content" not in message:
                    error_response = {
                        "type": "error",
                        "message": "Missing required field: content"
                    }
                    await manager.send_personal_message(json.dumps(error_response), websocket)
                    continue

                try:
                    # For now, let's directly use the PreAssessmentAgent without Temporal
                    from app.agents.pre_assessment_agent import PreAssessmentAgent
                    agent = PreAssessmentAgent()
                    assessment = await agent.assess(message.get("content"))
                    response = {
                        "type": "assessment",
                        "content": assessment
                    }
                    chat_logger.info(f"Sending response: {response}")
                    await manager.send_personal_message(json.dumps(response), websocket)
                except Exception as e:
                    chat_logger.error(f"Error processing message: {e}")
                    error_response = {
                        "type": "error",
                        "content": str(e)
                    }
                    await manager.send_personal_message(json.dumps(error_response), websocket)
            else:
                error_response = {
                    "type": "error",
                    "message": f"Invalid message type: {message.get('type')}"
                }
                await manager.send_personal_message(json.dumps(error_response), websocket)

    except WebSocketDisconnect:
        manager.disconnect(websocket)

# These routes can be part of this router or a separate one, then included in main.py
@router.get("/")
async def root():
    return {"message": "Welcome to Personal Tutor AI System - Chat API"}

@router.get("/health")
async def health_check():
    # This health check is specific to the chat router/service
    return {"status": "healthy", "service": "chat"}
