from fastapi import FastAPI, Request
from fastapi.responses import HTMLResponse
# from fastapi.staticfiles import StaticFiles # Not used directly if only serving index.html via Jinja2
from fastapi.templating import Jinja2Templates
from app.core.cors_config import add_cors_middleware # Corrected import path
import os
from dotenv import load_dotenv

load_dotenv() # Loads .env from CWD (e.g., backend/ or /app in Docker)

app = FastAPI(title="Static Frontend Server")

# Add CORS middleware
# Even though it's simple, good practice if API keys or anything sensitive might be involved later
# or if it needs to be accessed from a different frontend domain during development.
add_cors_middleware(app)


# This path needs to be relative to where the Docker container will find these files.
# If Dockerfile copies `frontend/public/templates` to `/app/frontend_static_templates` (when WORKDIR is /app),
# then the directory should be "frontend_static_templates".
templates_dir = "static_frontend_templates" # Placeholder - MUST MATCH DOCKERFILE COPY DESTINATION
templates = Jinja2Templates(directory=templates_dir)


@app.get("/", response_class=HTMLResponse)
async def read_root_static(request: Request):
    # Basic check to see if the templates directory and index.html might exist
    # This check is relative to the CWD of the Python process (e.g., /app in Docker)
    index_html_path = os.path.join(templates_dir, "index.html")

    if not os.path.isdir(templates_dir):
        return HTMLResponse(
            content=f"<html><body><h1>Error: Templates directory not found.</h1><p>Expected at: {os.path.abspath(templates_dir)}</p></body></html>",
            status_code=500
        )
    if not os.path.isfile(index_html_path):
        return HTMLResponse(
            content=f"<html><body><h1>Error: index.html not found in templates directory.</h1><p>Expected at: {os.path.abspath(index_html_path)}</p></body></html>",
            status_code=500
        )

    return templates.TemplateResponse("index.html", {
        "request": request,
        "ws_port": os.getenv("API_PORT", "54321") # This is the port for the main API (chat websocket)
    })

@app.get("/health")
async def static_server_health():
    return {"status": "healthy", "service": "static-server"}

# If you were to serve static files like CSS, JS from this server directly (not via Jinja include in index.html)
# You would mount StaticFiles, e.g.:
# app.mount("/static_assets", StaticFiles(directory=os.path.join(templates_dir, "css")), name="static_assets")
# However, the provided index.html seems to use relative paths for CSS, so Jinja2 serves index.html,
# and then the browser requests /css/style.css. This server currently only has a "/" route.
# The original templates/index.html was: <link rel="stylesheet" href="css/style.css">
# This means the static server also needs to serve files from templates_dir/css/style.css at the path /css/style.css
# We need a StaticFiles mount for this.

# Let's assume `templates_dir` contains `index.html` and a `css/style.css`.
# To serve `css/style.css` at `/css/style.css` and other assets:
app.mount("/css", StaticFiles(directory=os.path.join(templates_dir, "css")), name="css")
# Add other mounts if there are e.g. /js directories.
# If the structure is templates_dir/static/css then StaticFiles(directory=os.path.join(templates_dir, "static"))
# and mount it at /static. The original was `templates/css/style.css`. So the above mount is correct.

# The `StaticFiles` mount should generally come after specific routes like `/` if there's potential overlap,
# but for distinct paths like `/css`, order with `/` doesn't strictly matter.
# However, ensure `templates_dir` is structured correctly, e.g.,
# static_frontend_templates/
#   index.html
#   css/
#     style.css
