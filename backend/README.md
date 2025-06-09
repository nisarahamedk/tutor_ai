# Backend Service

This directory contains the Python FastAPI backend for the Intelligent Tutoring System.

## Running the Backend (Development)

It's recommended to run the backend using the Docker Compose setup from the root of the project:
```bash
docker-compose up --build backend
```
This will build the backend Docker image and run the service as defined in `docker-compose.yml`.

### Local Poetry Development (Alternative)

If you want to run the backend directly using Poetry (e.g., for more direct debugging or specific development tasks):

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```

2.  **Ensure you have Poetry installed.**

3.  **Install dependencies:**
    ```bash
    poetry install
    ```

4.  **Set up your environment:**
    Copy the example environment file and fill in your details:
    ```bash
    cp .env.example .env
    # Then edit .env with your configurations
    ```
    If `.env.example` is not present, create `.env` and add necessary variables like:
    ```
    PYTHON_ENV=development
    # Add other variables like database URLs, API keys, Temporal server details, etc.
    TEMPORAL_SERVER_URL=localhost:7233
    ```

5.  **Run the FastAPI development server:**
    ```bash
    poetry run uvicorn app.main:app --reload --host 0.0.0.0 --port 54321
    ```

This will start the FastAPI application. The main application is defined in `app/main.py`.
