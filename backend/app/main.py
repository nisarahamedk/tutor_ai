from fastapi import FastAPI
from app.api.v1.endpoints import health # Import the health router
# from app.api.v1.endpoints import chat # Chat router will be added later

app = FastAPI(title="Intelligent Tutoring System Backend")

# Include health router
app.include_router(health.router, prefix="/api/v1", tags=["health"])
# app.include_router(chat.router, prefix="/api/v1/chat", tags=["chat"]) # Chat router will be added later


@app.get("/")
async def root():
    return {"message": "ITS Backend is running"}
