---
task_id: 1
title: "Define Chat API and AG-UI Event Contracts"
epic: "EPIC-001"
status: "pending"
priority: "high"
estimated_hours: 6
dependencies: [] # No numeric task IDs, string format for inter-epic if any
parallel_work: ["EPIC-001_TASK_2", "EPIC-001_TASK_3", "EPIC-001_TASK_4"] # Descriptive
blocking_dependencies: [] # Numeric task IDs for intra-epic, string for inter-epic
contract_dependencies: [] # Names of contracts this task depends on
phase: "foundation"
---

# Task Overview
This task is foundational for enabling communication within the Intelligent Tutoring System. It involves defining the precise technical contracts for how chat messages are exchanged between the frontend and backend, and how real-time events related to chat are structured using AG-UI. A clear, well-defined contract here is crucial for parallel development of client and server components.

## Business Context
Clear and efficient communication is the backbone of the chat-first ITS. By defining these contracts upfront, we ensure that both frontend and backend teams can build their respective parts with a shared understanding of the data they will exchange. This accelerates development and reduces integration friction, leading to faster delivery of the basic chat functionality, which is the first step towards user interaction.

## Acceptance Criteria
- [ ] OpenAPI (or equivalent, e.g., detailed Markdown) specification for backend chat message API endpoints is created and approved.
  - [ ] Includes POST endpoint for sending a message.
  - [ ] Includes request/response schemas (e.g., user_id, content, timestamp, message_id).
  - [ ] Includes error codes and response structures for common errors (e.g., validation, authentication).
- [ ] AG-UI event structures for basic chat interactions are documented and approved.
  - [ ] Event for user sending a message (FE -> BE).
  - [ ] Event for broadcasting a new message to chat participants (BE -> FE).
  - [ ] Event for user joining/leaving notifications (optional for now, but consider).
  - [ ] Payloads for each event are clearly defined.
- [ ] Documentation for these contracts is stored in a shared, accessible location (e.g., `docs/api_contracts/chat_api.md`, `docs/agui_contracts/chat_events.md`).
- [ ] Contracts are reviewed and signed off by representatives from frontend and backend development teams.

## Service Layer TDD Approach
### Test Strategy
- Since this task is about contract definition, traditional TDD is not directly applicable to code implementation.
- However, the "tests" for these contracts are their clarity, completeness, and ability to prevent ambiguity.
- Validation will occur through review and by using these contracts as the single source of truth for implementing dependent tasks (e.g., backend API stubs, frontend mock client).

### Key Test Scenarios (for contract validation)
- Can a frontend developer use the API spec to create a mock request and understand the expected response for sending a message?
- Can a backend developer use the API spec to understand what data to expect and how to structure their response?
- Do AG-UI event definitions clearly outline the payload for a new message, so the frontend knows what data to render?
- Are error conditions in the API contract clear enough for the frontend to handle them gracefully?
- Is there a clear understanding of message sender identification in both API and AG-UI events?

## Technical Specifications
### Service Interface Design
- **Chat Message API (e.g., `/api/v1/chat/messages`):**
  - `POST /api/v1/chat/messages`:
    - Request Body: `{ "user_id": "string", "content": "string" }` (user_id might be derived from auth token server-side)
    - Response Body (Success 201): `{ "message_id": "string", "user_id": "string", "content": "string", "timestamp": "iso_datetime" }`
    - Response Body (Error 400/401/500): `{ "error_code": "string", "message": "string" }`
- **AG-UI Events (Conceptual Names):**
  - `chat:send_message`: (FE -> BE)
    - Payload: `{ "content": "string" }` (user context likely from session)
  - `chat:new_message`: (BE -> FE)
    - Payload: `{ "message_id": "string", "user_id": "string", "user_name": "string", "content": "string", "timestamp": "iso_datetime" }`
  - `chat:user_joined` (Optional): (BE -> FE)
    - Payload: `{ "user_id": "string", "user_name": "string" }`

### Implementation Guidance
- Use standard OpenAPI (Swagger) conventions for the API specification.
- For AG-UI events, a clear Markdown document with JSON schema examples for payloads is sufficient.
- Focus on simplicity for initial contracts; they can be versioned and expanded later.
- Ensure data types, required fields, and example values are provided.
- Consider where user identification (user_id, user_name) will come from (e.g., JWT token for API, session context for AG-UI).

### Dependencies and Prerequisites
- **Blocking Dependencies**: None. This task is foundational.
- **Contract Dependencies**: None. This task *creates* the contracts.
- **Parallel Work Opportunities**: Enables `EPIC-001_TASK_2` (FE Setup), `EPIC-001_TASK_3` (BE Setup), `EPIC-001_TASK_5` (BE Chat Message Handling - stubbing), `EPIC-001_TASK_6` (FE Chat Message Sending/Receiving - with mocks).
- **Mock Requirements**: The defined contracts will be used by other tasks to create their mocks (e.g., mock API server for frontend, mock AG-UI client for backend testing).
- **Integration Points**: These contracts are the primary integration points for basic chat functionality between frontend and backend.

## Definition of Done
- [ ] OpenAPI specification for chat API is complete, reviewed, and stored.
- [ ] AG-UI event contract document for chat is complete, reviewed, and stored.
- [ ] Both contracts have been approved by FE and BE representatives.
- [ ] Location of contract documents is communicated to the team.

## Technical Notes
- Ensure consistency in naming conventions (e.g., snake_case vs camelCase) across API and AG-UI contracts if possible, or clearly document differences.
- Versioning strategy for these contracts should be considered for future iterations, although not implemented in this task (e.g., `/v1/` in API path).
- Initial focus is on text messages. Rich content messages will be a future addition.
