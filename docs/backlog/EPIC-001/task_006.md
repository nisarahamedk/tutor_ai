---
task_id: 6
title: "Implement Frontend Chat Message Sending/Receiving (AG-UI Client Stub)"
epic: "EPIC-001"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: [1, 2] # Depends on Task 1.1 (AG-UI Event Contracts), Task 1.2 (Basic Chat UI)
parallel_work: ["EPIC-001_TASK_5", "EPIC-001_TASK_7"]
blocking_dependencies: [1, 2] # Hard dependencies
contract_dependencies: ["AG-UI Event Contracts from EPIC-001_TASK_1"]
phase: "foundation"
---

# Task Overview
This task focuses on implementing the frontend logic to send chat messages to the backend and receive/display messages from the backend using AG-UI. This involves setting up the AG-UI client (`ag-ui-client.ts` and `agUiService.ts`), handling WebSocket/SSE connections, and updating the React UI components (from Task 1.2) to interact with this service. Initially, this can be developed against a mock AG-UI server or integrated with Task 1.5 once its AG-UI endpoint stub is ready.

## Business Context
Enabling users to send and see messages in real-time is the core of any chat application. This task brings the static UI from Task 1.2 to life by connecting it to the communication backbone (AG-UI), allowing for the first end-to-end user interaction with the chat system.

## Acceptance Criteria
- [ ] `ag-ui-client.ts` is implemented to establish and manage WebSocket/SSE connection to the backend AG-UI endpoint.
  - [ ] Handles connection opening, error handling, and graceful closure.
- [ ] `agUiService.ts` (or equivalent in React hooks/context) is implemented to:
  - Provide functions for sending chat messages (as per AG-UI contract from Task 1.1).
  - Subscribe to incoming messages from the AG-UI client (as per AG-UI contract from Task 1.1).
- [ ] The chat UI (from Task 1.2) is updated:
  - Input field value is captured.
  - "Send" button click triggers `agUiService.ts` to send the message.
  - Incoming messages from `agUiService.ts` are displayed in the message area.
  - Basic state management for messages (e.g., an array of message objects in React state).
- [ ] Frontend can successfully send a message to the (mock or actual Task 1.5) backend AG-UI endpoint.
- [ ] Frontend can successfully receive a message broadcast from the (mock or actual Task 1.5 via a simple echo for now) backend AG-UI endpoint and display it.
- [ ] Basic error handling for connection issues or message send failures is implemented on the frontend.

## Service Layer TDD Approach
### Test Strategy
- **AG-UI Client/Service (`ag-ui-client.ts`, `agUiService.ts`):**
  - Unit test functions responsible for formatting messages to be sent.
  - Unit test functions responsible for parsing incoming messages.
  - Mock the actual WebSocket/SSE object to test connection logic, sending, and receiving handlers.
- **React Components/Hooks:**
  - Use React Testing Library to test components that use the AG-UI service.
  - Mock the `agUiService.ts` to simulate sending/receiving messages and verify UI updates correctly (e.g., new message appears, input clears).

### Key Test Scenarios
- **AG-UI Service:**
  - `sendMessage(content)` calls the underlying AG-UI client's send method with correctly formatted payload.
  - Incoming AG-UI message for `chat:new_message` is correctly parsed and dispatched to UI handlers.
  - Connection errors are handled and potentially reported.
- **Chat UI Components (with mocked service):**
  - Typing in input field updates component state.
  - Clicking "Send" calls the (mocked) `agUiService.sendMessage` with input content and clears input.
  - When (mocked) `agUiService` emits a new message, it's added to the displayed message list.
  - Message list renders correctly with multiple messages.

## Technical Specifications
### Service Interface Design
- **`ag-ui-client.ts`:**
  - `connect(url): void`
  - `disconnect(): void`
  - `on(eventName, callback): void` (to subscribe to AG-UI events like `chat:new_message`)
  - `send(eventName, payload): void` (to send AG-UI events like `chat:send_message`)
- **`agUiService.ts` (or React hook/context like `useAITutorChat` from `architecture.md`):**
  - `async function sendMessage(content: string): Promise<void>`
  - `function subscribeToMessages(handler: (message: MessageType) => void): UnsubscribeFunction`
  - State management for message list, connection status.
- **Message Type (in `src/features/ai-tutor/types/`):**
  - e.g., `{ id: string; userId: string; userName: string; content: string; timestamp: string; isOwnMessage?: boolean }`

### Implementation Guidance
- Use native WebSocket API or a lightweight library if preferred. For AG-UI, it might prescribe a specific client or method. Assume native WebSocket/SSE for now.
- Manage chat message state within a React context or a state management library (if introduced, though likely overkill for now).
- Ensure messages sent by the current user are visually distinguishable (e.g., different alignment or color).
- Focus on the client-side implementation. Backend AG-UI (Task 1.5) will initially be a simple echo or stub; full AI response comes later.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001_TASK_1` (AG-UI Event Contracts), `EPIC-001_TASK_2` (Basic Chat UI Structure).
- **Contract Dependencies**: "AG-UI Event Contracts" from Task 1.1.
- **Parallel Work Opportunities**: Can be developed in parallel with `EPIC-001_TASK_5` (Backend Message Handling). Frontend can use a mock WebSocket server initially.
- **Mock Requirements**: A mock WebSocket server (e.g., using `ws` library in a simple Node script, or a browser-based mock) can be useful if the backend AG-UI endpoint (Task 1.5) is not yet ready for full interaction. The `agUiService.ts` itself will be mocked for testing UI components.
- **Integration Points**: Integrates with the backend AG-UI endpoint developed in Task 1.5 (and expanded in EPIC-002).

## Definition of Done
- [ ] AG-UI client setup and connection management implemented.
- [ ] Frontend service/hook for sending and receiving messages via AG-UI is functional.
- [ ] Chat UI allows users to type and send messages.
- [ ] Chat UI displays messages received from AG-UI.
- [ ] Basic error handling for connectivity is present.
- [ ] Unit/component tests for AG-UI service and chat UI are implemented and pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- This task makes the chat "feel" real for the first time.
- Pay attention to UI responsiveness and clear feedback to the user on message send status (e.g., pending, sent, failed).
- Keep the message structure simple for now, aligning with Task 1.1.
