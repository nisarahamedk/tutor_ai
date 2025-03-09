from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from typing import List
import json
import logging
from .cors_config import add_cors_middleware

logging.basicConfig(level=logging.INFO)

app = FastAPI()
add_cors_middleware(app)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self.active_connections.append(websocket)

    def disconnect(self, websocket: WebSocket):
        self.active_connections.remove(websocket)

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

manager = ConnectionManager()

@app.websocket("/ws/chat")
async def websocket_endpoint(websocket: WebSocket):
    await manager.connect(websocket)
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
            
            logging.info(f"Received message: {message}")
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
                    from agents.pre_assessment_agent import PreAssessmentAgent
                    agent = PreAssessmentAgent()
                    assessment = await agent.assess(message.get("content"))
                    response = {
                        "type": "assessment",
                        "content": assessment
                    }
                    logging.info(f"Sending response: {response}")
                    await manager.send_personal_message(json.dumps(response), websocket)
                except Exception as e:
                    logging.error(f"Error processing message: {e}")
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

@app.get("/")
async def root():
    return {"message": "Welcome to Personal Tutor AI System"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}
