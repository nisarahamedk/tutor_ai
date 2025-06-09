from fastapi import APIRouter, WebSocket, WebSocketDisconnect

router = APIRouter()

# Placeholder for chat endpoint logic (align with EPIC-001_TASK_1)
# This is a very basic stub. Actual implementation will involve AG-UI.

@router.post("/messages")
async def send_message_stub():
    # In a real scenario, this would process the message and interact with services/agents
    # For now, returns HTTP 501 Not Implemented
    return {"message": "Not Implemented"}, 501

@router.websocket("/ws")
async def websocket_endpoint_stub(websocket: WebSocket):
    await websocket.accept()
    try:
        while True:
            data = await websocket.receive_text()
            await websocket.send_text(f"Message text was: {data}. Not Implemented.")
    except WebSocketDisconnect:
        print("Client disconnected from chat WebSocket stub")

# Further stubs for other chat functionalities (e.g., getting history) can be added here.
