---
task_id: 3
title: "Setup Backend Project (FastAPI) & Basic API Structure"
epic: "EPIC-001"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: []
parallel_work: ["EPIC-001_TASK_1", "EPIC-001_TASK_2", "EPIC-001_TASK_4"]
blocking_dependencies: []
contract_dependencies: ["Chat API Contract from EPIC-001_TASK_1 (once defined)"] # Soft dependency for stub signatures
phase: "foundation"
---

# Task Overview
This task focuses on initializing the Python FastAPI backend project and establishing its core directory structure as outlined in `architecture.md`. It includes creating placeholder files for API endpoints, services, and configuration, providing a skeleton for future backend development. Stub implementations for chat API endpoints will be created based on the contract defined in Task 1.1.

## Business Context
A robust and well-organized backend is critical for the ITS's functionality, scalability, and maintainability. Setting up the project structure correctly from the outset ensures that developers can easily locate code, add new features, and manage dependencies effectively. This initial setup accelerates subsequent backend development phases.

## Acceptance Criteria
- [ ] FastAPI project is initialized using Poetry.
- [ ] Core backend directory structure is created as per `architecture.md`:
  - `app/api/v1/endpoints/` (with `chat.py` and `health.py` stubs)
  - `app/core/` (with `config.py` stub)
  - `app/db/` (with `database.py`, `models.py`, `crud.py` stubs)
  - `app/agents/` (with `tutor_agent.py` stub)
  - `app/temporal/` (with `workflows.py`, `activities.py`, `client.py` stubs)
  - `app/services/` (e.g., `chat_service.py` stub)
  - `app/main.py` (FastAPI app initialization)
- [ ] Placeholder functions for chat API endpoints (e.g., send message) are created in `app/api/v1/endpoints/chat.py`. These should align with the Chat API Contract from `EPIC-001_TASK_1` once available, returning dummy data or HTTP 501 "Not Implemented".
- [ ] Basic health check endpoint (e.g., `/health`) is implemented in `app/api/v1/endpoints/health.py` returning a 200 OK status.
- [ ] Initial `pyproject.toml` includes FastAPI, Uvicorn, Pydantic, and other core dependencies.
- [ ] Basic application configuration (e.g., using Pydantic settings) is set up in `app/core/config.py`.
- [ ] Code is committed to the repository in a new `feature/EPIC-001-backend-setup` branch.

## Service Layer TDD Approach
### Test Strategy
- For project setup and basic stubs, service-layer TDD is not heavily emphasized.
- However, a simple unit test for the `/health` endpoint should be created to verify it returns 200 OK.
- As API endpoint stubs are created based on Task 1.1, initial (failing) tests could be written for these endpoints to be fleshed out in Task 1.5.

### Key Test Scenarios
- `/health` endpoint returns HTTP 200 and a simple JSON response (e.g., `{"status": "ok"}`).
- (Future, for Task 1.5) Placeholder chat API endpoint stubs exist and are importable.

## Technical Specifications
### Service Interface Design
- **API Endpoints (Stubs):**
  - `GET /api/v1/health`: Returns `{"status": "ok"}`.
  - `POST /api/v1/chat/messages`: Placeholder function in `chat.py`. Signature and dummy response should align with `EPIC-001_TASK_1`. This task primarily creates the file and function structure.
- **AG-UI Endpoint (`chat.py`):** A stub for the WebSocket endpoint will be created, but full AG-UI server setup is part of Task 1.5.
- **Directory Structure Stubs:**
  - `app/db/database.py`: Placeholder for Supabase client initialization.
  - `app/db/models.py`: Placeholder for Pydantic/SQLAlchemy models.
  - `app/db/crud.py`: Placeholder for CRUD functions.
  - `app/temporal/client.py`: Placeholder for Temporal client.
  - `app/temporal/workflows.py`, `app/temporal/activities.py`: Placeholders.
  - `app/services/chat_service.py`: Placeholder for chat business logic.

### Implementation Guidance
- Use Poetry for dependency management.
- Follow FastAPI best practices for structuring the application.
- Refer to `architecture.md` for the target backend structure.
- Ensure `app/main.py` correctly initializes the FastAPI app and includes routers from `app/api/v1/endpoints/`.
- Stubs should have minimal logic, primarily ensuring the application can run.

### Dependencies and Prerequisites
- **Blocking Dependencies**: None. Can start immediately.
- **Contract Dependencies**: Signatures for API stubs in `chat.py` will depend on the "Chat API Contract" defined in `EPIC-001_TASK_1`. This task can start by creating the files and basic structure, then align function signatures once Task 1.1 is complete or its draft is available.
- **Parallel Work Opportunities**: `EPIC-001_TASK_1` (API/AG-UI Contracts), `EPIC-001_TASK_2` (Frontend Setup), `EPIC-001_TASK_4` (DB Setup).
- **Mock Requirements**: No mocks needed for this setup task itself.
- **Integration Points**: The API stubs created here will be implemented in Task 1.5. The overall structure supports future integration of database (Task 1.4), Temporal (Task 1.7), and AI agents (EPIC-002).

## Definition of Done
- [ ] FastAPI project initialized with Poetry and directory structure created as specified.
- [ ] Placeholder files and stubs for services, endpoints, and core logic are created.
- [ ] `/health` endpoint is functional.
- [ ] Chat API endpoint stubs in `chat.py` are present (signatures to be aligned with Task 1.1).
- [ ] Code is well-organized and follows basic Python coding standards.
- [ ] Changes are committed to the feature branch and a Pull Request is opened (or ready to be).

## Technical Notes
- This task lays the architectural groundwork for the entire backend. Adherence to the structure in `architecture.md` is key.
- Ensure `.gitignore` is configured appropriately for a Python/FastAPI project.
