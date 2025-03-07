from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from .cors_config import add_cors_middleware

app = FastAPI()
add_cors_middleware(app)

app.mount("/", StaticFiles(directory="static", html=True), name="static")
