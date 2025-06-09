from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.endpoints import chat
from app.core import static_server # Assuming static_server.py is correctly structured with an APIRouter

app = FastAPI(title="Intelligent Tutoring System Backend")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows all origins. Adjust for production.
    allow_credentials=True,
    allow_methods=["*"],  # Allows all methods.
    allow_headers=["*"],  # Allows all headers.
)

# Include routers
app.include_router(chat.router, prefix="/ws", tags=["WebSocket Chat"]) # Mounted under /ws as per original @app.websocket("/ws/chat")
# The static server router might serve at root "/" or another prefix.
# If static_server.router is intended for root, it should be mounted without a prefix or with "/static_ui" for clarity.
# The original static_server.py had @app.get("/").
# The docker-compose maps port 54322 to this.
# If chat.router also has a "/" and "/health", they need distinct mount points or to be on different apps/ports.
# The `static` service in docker-compose implies this static_server is the primary thing for that port.
# The `backend` service (chat API) is on port 54321.
# Since static_server.py and chat.py are now part of the *same* FastAPI app instance if we include both routers,
# their paths must not conflict if served under the same port.
# However, docker-compose runs two commands:
# 1. `backend` service: `uvicorn backend.app.main:app --host 0.0.0.0 --port 54321`
# 2. `static` service: `uvicorn backend.app.core.static_server:app --host 0.0.0.0 --port 54322` (OLD)
# The `static` service command in docker-compose was updated to `uvicorn backend.app.core.static_server:router --host 0.0.0.0 --port 54322` (if I made this change, if not, it needs to be).
# Or, if `static_server.py` still defines its own `app` instance, then `main.py` is only for the `backend` service.
# Let's re-check docker-compose.yml command for static service.
# It was: `command: poetry run uvicorn backend.app.core.static_server:app --host 0.0.0.0 --port 54322 --reload`
# This means static_server.py is RUN AS A SEPARATE APP.
# So, `main.py` should ONLY include backend API routes (like chat.py).
# And `static_server.py` should keep its own `app = FastAPI()` instance.

# Revisiting static_server.py: It should NOT be an APIRouter if it's run as a separate app.
# It should define its own FastAPI app and add its own CORS.

# Okay, my previous change to static_server.py to make it an APIRouter was based on a
# misunderstanding. It's run as a separate FastAPI application by the `static` service.
# I need to revert static_server.py to use `app = FastAPI()` and add its own CORS.

# For THIS file (main.py), it will only include the chat router.

app.include_router(chat.router, prefix="/api/v1", tags=["Chat Endpoints"]) # Example prefix

@app.get("/")
async def main_root():
    return {"message": "Welcome to the main API of the Intelligent Tutoring System"}

@app.get("/health")
async def main_health_check():
    return {"status": "healthy", "service": "main-api"}

# If other routers are needed for the main backend service, add them here.
# For example, if static_server.py was meant to be part of this on a subpath:
# app.include_router(static_server.router, prefix="/old_static_ui", tags=["Static UI"])
# But based on docker-compose, it's separate.
