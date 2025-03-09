import pytest
from fastapi.testclient import TestClient
import websockets
import json
import asyncio
from api.main import app

@pytest.fixture
def client():
    return TestClient(app)

@pytest.mark.asyncio
async def test_websocket_chat_flow():
    """Test the complete chat flow including initial assessment."""
    uri = "ws://localhost:52522/ws/chat"
    async with websockets.connect(uri) as websocket:
        # Send learning request
        message = {
            "type": "start_learning",
            "content": "I want to learn python"
        }
        await websocket.send(json.dumps(message))
        
        # Get assessment response
        response = await websocket.recv()
        response_data = json.loads(response)
        
        assert response_data["type"] == "assessment"
        assert "questions" in response_data["content"]
        assert len(response_data["content"]["questions"]) > 0
        
        # Verify question content
        questions = response_data["content"]["questions"]
        expected_topics = ["programming", "goal", "interest", "time", "learning style"]
        assert any(any(topic in q.lower() for topic in expected_topics) for q in questions)

def test_health_check(client):
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

@pytest.mark.asyncio
async def test_invalid_message_type():
    """Test handling of invalid message types."""
    uri = "ws://localhost:52522/ws/chat"
    async with websockets.connect(uri) as websocket:
        message = {
            "type": "invalid_type",
            "content": "test"
        }
        await websocket.send(json.dumps(message))
        
        response = await websocket.recv()
        response_data = json.loads(response)
        
        assert response_data["type"] == "error"
        assert "message" in response_data
        assert "invalid_type" in response_data["message"]

@pytest.mark.asyncio
async def test_malformed_json():
    """Test handling of malformed JSON messages."""
    uri = "ws://localhost:52522/ws/chat"
    async with websockets.connect(uri) as websocket:
        await websocket.send("not a json message")
        
        response = await websocket.recv()
        response_data = json.loads(response)
        
        assert response_data["type"] == "error"
        assert "message" in response_data
        assert "JSON" in response_data["message"]

@pytest.mark.asyncio
async def test_missing_content():
    """Test handling of messages with missing content."""
    uri = "ws://localhost:52522/ws/chat"
    async with websockets.connect(uri) as websocket:
        message = {
            "type": "start_learning"
            # Missing content field
        }
        await websocket.send(json.dumps(message))
        
        response = await websocket.recv()
        response_data = json.loads(response)
        
        assert response_data["type"] == "error"
        assert "message" in response_data
        assert "content" in response_data["message"].lower()