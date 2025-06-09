from fastapi.testclient import TestClient
# Adjust the import path based on how 'app.main.app' is discovered by pytest
# This might require adding __init__.py files in parent directories or configuring PYTHONPATH
# For now, assuming 'app' is discoverable from the 'backend' directory.
# If running pytest from the 'backend' directory, this should work if 'app' is a package.

# Option 1: If app is directly in app folder (adjust as needed for your structure)
# from ..app.main import app

# Option 2: If you add backend to PYTHONPATH or run pytest from root and backend is a package
# from backend.app.main import app

# Option 3: For a more robust way if structure allows, and assuming pytest runs from `backend` dir
import sys
import os

# This assumes tests are run from the `backend` directory or `backend` is in PYTHONPATH
# Add the parent directory of 'app' to sys.path to allow 'from app.main import app'
# This is a common way to handle imports in tests when the app structure is app/main.py
# and tests are in tests/
# Make sure your FastAPI app instance is named 'app' in 'main.py'

# Correctly add 'backend' to sys.path if tests are run from the root project directory
# or if 'backend.app' is how you'd typically import.
# However, if pytest is run from within the 'backend' directory, 'app' should be importable.

# Assuming `pytest` is run from the `backend` directory:
from app.main import app


client = TestClient(app)

def test_health_check():
    response = client.get("/api/v1/health")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}

def test_root_endpoint():
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "ITS Backend is running"}
