from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from .cors_config import add_cors_middleware
import os
from dotenv import load_dotenv

load_dotenv()

app = FastAPI()
add_cors_middleware(app)

templates = Jinja2Templates(directory="templates")


@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {
        "request": request,
        "ws_port": os.getenv("API_PORT", "54427")
    })
