---
task_id: 5
title: "Relay AI Agent Responses to Frontend via AG-UI"
epic: "EPIC-002"
status: "pending"
priority: "high"
estimated_hours: 7
dependencies: [1, 4] # Depends on EPIC-002/1 (AG-UI Contracts for AI) and EPIC-002/4 (AI in Temporal)
parallel_work: ["EPIC-002_TASK_6"]
blocking_dependencies: [1, 4]
contract_dependencies: ["AG-UI AI event contracts from EPIC-002_TASK_1"]
phase: "foundation"
---

# Task Overview
This task focuses on taking the AI agent's response, now available within the Temporal workflow (as a result of Task 2.4), and sending it back to the appropriate frontend client using AG-UI. This involves modifying the backend's AG-UI server logic (likely in `app/api/v1/endpoints/chat.py` or a related chat service) to emit the AG-UI events defined in Task 2.1 for AI responses.

## Business Context
Displaying the AI agent's responses to the user is critical for closing the communication loop. This task enables the backend to push AI-generated messages or instructions to the frontend in real-time, making the AI tutor's contributions visible and interactive.

## Acceptance Criteria
- [ ] Backend logic is implemented to retrieve the AI agent's response from the completed `call_ai_agent_activity` within the `ChatSessionWorkflow`.
- [ ] The backend AG-UI server component (e.g., in `chat.py` or `ChatService`) is enhanced to send messages to specific connected clients or broadcast to a session.
  - [ ] This requires a mechanism to map workflow instances/user sessions to active AG-UI connections.
- [ ] AI agent's text responses are formatted into the AG-UI event structure defined in `EPIC-002_TASK_1` (e.g., `ai:text_response`).
- [ ] The formatted AG-UI event is successfully sent to the relevant frontend client(s) via the established WebSocket/SSE connection.
- [ ] Basic error handling for sending AG-UI messages is implemented (e.g., client disconnected).

## Service Layer TDD Approach
### Test Strategy
- **AG-UI Sending Logic (Unit/Integration Tests):**
  - Test the component responsible for sending AG-UI events (e.g., a `AGUIBroadcaster` or methods within `ChatService`).
  - If possible, mock the actual WebSocket connections to verify that the correct data is attempted to be sent to the correct client(s).
  - Test how the system maps a user/session to their AG-UI connection.
- **Workflow to AG-UI Integration:**
  - This is more of an integration concern. Test that when a workflow completes the AI activity, the AG-UI sending logic is triggered with the correct AI response data. This might involve observing side effects or using a test utility that captures outgoing AG-UI messages.

### Key Test Scenarios
- Given an AI text response for a specific user session, the backend formats an `ai:text_response` AG-UI event.
- The formatted event is sent over the WebSocket connection associated with that user session.
- If a user's WebSocket connection is not found or inactive, the system handles this gracefully (e.g., logs an error, perhaps stores the message for later retrieval if implementing offline capabilities - though out of scope for now).
- Test with multiple connected clients to ensure messages are routed to the correct user.

## Technical Specifications
### Service Interface Design
- **AG-UI Event (`ai:text_response` BE -> FE):** As defined in `EPIC-002_TASK_1`. Payload example: `{ "message_id": "string", "text": "string", "attribution": "AI Tutor" }`.
- **Internal Logic:**
  - The `ChatSessionWorkflow` might need to signal the main FastAPI application with the AI response and user/session identifier.
  - Alternatively, a Temporal activity could directly interact with a component (e.g., a Redis-backed pub/sub or a shared connection manager) that the AG-UI endpoint in `chat.py` uses to send messages. The former (workflow signal) is often cleaner.
  - A connection manager mapping `user_id` or `session_id` to active `WebSocket` objects will be necessary in `chat.py`.

### Implementation Guidance
- **Workflow to FastAPI Communication:** If using signals, the workflow will signal the FastAPI app. The FastAPI app needs a handler for this signal that then uses the AG-UI connection manager to send the message. This requires careful design to avoid tight coupling. A simpler, direct approach might involve an activity that uses a common service accessible by both Temporal workers and FastAPI (e.g. a message queue or a direct call to a service method if running in the same process space, though less robust). For this task, assume a mechanism where the workflow result can trigger an action in the FastAPI process that has access to WebSocket connections.
- **Connection Management:** The AG-UI endpoint in `chat.py` needs to maintain a list/dictionary of active connections, indexed by something that the workflow can refer to (e.g., `user_id` or a unique `connection_id` established at handshake and passed to the workflow).
- Refer to AG-UI server documentation or examples for best practices on sending messages to specific clients.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-002_TASK_1` (AG-UI Event Contracts for AI), `EPIC-002_TASK_4` (AI Agent Integrated with Temporal, so there's a response to send).
- **Contract Dependencies**: "AG-UI AI event contracts" from `EPIC-002_TASK_1`.
- **Parallel Work Opportunities**: `EPIC-002_TASK_6` (Frontend Handling of AI Responses) can be fully developed once this backend part is functional or if the frontend mocks this behavior based on the contract.
- **Mock Requirements**: For testing, the WebSocket connections and the connection manager will likely need to be mocked. The AI response from the workflow will also be a mock input to this part of the system.
- **Integration Points**: This task connects the output of the Temporal/AI pipeline back to the user via AG-UI. It's a critical link for user interaction.

## Definition of Done
- [ ] Backend can take an AI response from a Temporal workflow context and send it as an AG-UI event to the correct frontend client.
- [ ] AG-UI event for AI text responses is correctly formatted and sent.
- [ ] Connection management for AG-UI clients is robust enough for this purpose.
- [ ] Basic error handling for message sending is in place.
- [ ] Code is reviewed and merged.

## Technical Notes
- The method for linking a Temporal workflow instance (and its AI-generated response) to a specific live WebSocket connection is a key challenge here. Solutions could involve:
  - Workflow signaling the main app with user/session ID.
  - Activities writing to a user-specific queue that the main app polls.
  - Using a shared service (e.g., Redis pub/sub) where workflows publish and the main app subscribes.
- Start with the simplest reliable mechanism. The signal approach is common if workflow and API are within the same logical service boundary.
