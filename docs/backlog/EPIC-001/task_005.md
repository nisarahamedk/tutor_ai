---
task_id: 5
title: "Implement Backend Chat Message Handling (API Endpoint & AG-UI Stub)"
epic: "EPIC-001"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: [1, 4] # Depends on Task 1.1 (Chat API Contract) and Task 1.4 (DB Schema)
parallel_work: ["EPIC-001_TASK_6"] # FE can start integrating once this is ready or mocked
blocking_dependencies: [1, 4] # Hard dependencies
contract_dependencies: ["Chat API Contract from EPIC-001_TASK_1", "User & Message data models from EPIC-001_TASK_4"]
phase: "foundation"
---

# Task Overview
This task involves implementing the backend logic for handling incoming chat messages via the API endpoint defined in Task 1.1. This includes receiving a message, validating it, persisting it to Supabase using the schema from Task 1.4, and preparing it for broadcast. A basic AG-UI server endpoint will also be set up to handle WebSocket connections, though full Temporal integration for message broadcasting will follow in later tasks.

## Business Context
The ability for the backend to receive, store, and process chat messages is a core requirement for the ITS. This task makes the chat API functional, allowing users (via the frontend) to send messages that are then saved by the system. It's a critical step towards enabling real-time communication.

## Acceptance Criteria
- [ ] FastAPI `POST /api/v1/chat/messages` endpoint (stubbed in Task 1.3) is fully implemented.
  - [ ] Endpoint requires authentication (e.g., using a JWT obtained from Task 1.4's auth).
  - [ ] Endpoint validates incoming message payload against the defined schema (from Task 1.1).
  - [ ] Valid messages are persisted to the `chat_messages` table in Supabase (using CRUD functions from `app/db/crud.py` which might be partially developed here or in Task 1.4).
  - [ ] Endpoint returns the created message object or appropriate error responses as per Task 1.1 contract.
- [ ] CRUD functions for creating and retrieving chat messages are implemented in `app/db/crud.py`.
- [ ] A basic AG-UI WebSocket endpoint is established in `app/api/v1/endpoints/chat.py`.
  - [ ] It can accept WebSocket connections.
  - [ ] It can receive messages from connected clients (though processing might be minimal in this task).
  - [ ] Broadcasting messages via AG-UI is *not* part of this task (will be handled after Temporal integration for AI responses). This task focuses on the API and AG-UI connection setup.
- [ ] Unit tests for the message handling logic in the service layer are written and pass.
- [ ] Integration tests for the chat message API endpoint are written and pass.

## Service Layer TDD Approach
### Test Strategy
- **Service Layer (`chat_service.py` or equivalent logic):**
  - Unit test the service function responsible for processing and saving a new message.
  - Mock the database interaction (`crud.py`) to isolate service logic.
  - Test validation logic within the service.
- **CRUD Layer (`app/db/crud.py` for messages):**
  - Test `create_chat_message` function by interacting with a test database (or mock Supabase client) to ensure it correctly inserts data and handles potential DB errors.
- **API Endpoint (`chat.py`):**
  - Integration tests for the `POST /api/v1/chat/messages` endpoint.
  - Mock authentication to focus on message handling logic.
  - Verify correct responses for valid and invalid inputs, and successful message creation.

### Key Test Scenarios
- **Chat Service:**
  - Valid message data is correctly passed to `crud.create_chat_message`.
  - Invalid message data (e.g., empty content) raises a validation error.
- **Message CRUD:**
  - `create_chat_message` correctly forms and executes the SQL insert.
  - `get_chat_message_by_id` retrieves a message.
- **API Endpoint:**
  - Authenticated user can post a valid message; message is saved; 201 response with message data.
  - Unauthenticated user receives 401.
  - Invalid message payload (e.g., missing fields) receives 400/422.
  - Server error during persistence returns 500.
- **AG-UI Endpoint:**
  - WebSocket connection can be established.
  - Text message sent over WebSocket is received by the backend endpoint.

## Technical Specifications
### Service Interface Design
- **API Endpoint (`POST /api/v1/chat/messages`):** As defined in `EPIC-001_TASK_1`.
- **Service Function (e.g., in `app/services/chat_service.py`):**
  - `async def process_new_message(user_id: str, message_content: str) -> ChatMessage:` (or similar, takes authenticated user and content, returns persisted message).
- **CRUD Functions (in `app/db/crud.py`):**
  - `async def create_chat_message(db_client, user_id: str, content: str) -> ChatMessage:`
  - `async def get_chat_message(db_client, message_id: str) -> ChatMessage | None:`
- **AG-UI WebSocket Endpoint (`app/api/v1/endpoints/chat.py`):**
  - Will use FastAPI's `WebSocket` and `WebSocketDisconnect`.
  - Initial implementation will focus on connection management and receiving messages. Broadcasting is deferred.

### Implementation Guidance
- Implement authentication dependency for the API endpoint (e.g., FastAPI dependency that verifies JWT).
- Use Pydantic models for request/response validation in the API.
- Ensure `chat_service.py` encapsulates the business logic for message processing.
- `crud.py` functions should handle direct Supabase client interactions for messages.
- For AG-UI, set up the basic connection handler. Logic to tie this into Temporal/AI responses will come in EPIC-002.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001_TASK_1` (Chat API Contract), `EPIC-001_TASK_4` (DB Schema & Supabase Setup, Auth for API).
- **Contract Dependencies**: "Chat API Contract" from Task 1.1, "User & Message data models" from Task 1.4.
- **Parallel Work Opportunities**: `EPIC-001_TASK_6` (Frontend can start implementing message sending, initially against a mock, then integrating with this task's API).
- **Mock Requirements**: Supabase client will be mocked for service unit tests. Auth might be mocked for API integration tests focusing purely on message logic.
- **Integration Points**: This API endpoint will be used by the frontend (Task 1.6). The AG-UI endpoint will be expanded in EPIC-002. Message data stored here will be read by AI agents later.

## Definition of Done
- [ ] `POST /api/v1/chat/messages` API endpoint is functional, including auth, validation, persistence.
- [ ] CRUD operations for chat messages are implemented.
- [ ] Basic AG-UI WebSocket endpoint is established and can receive messages.
- [ ] Unit and integration tests pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Focus on making the API robust. The AG-UI part is just a stub for connection at this stage.
- Error handling and appropriate HTTP status codes from the API are important.
- User ID for messages should be sourced from the authenticated user context (e.g., JWT).
