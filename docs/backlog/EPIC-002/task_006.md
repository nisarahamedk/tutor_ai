---
task_id: 6
title: "Frontend Handling of AI Agent Text Responses"
epic: "EPIC-002"
status: "pending"
priority: "high"
estimated_hours: 6
dependencies: ["EPIC-001/6", 1] # Depends on EPIC-001/6 (FE Chat) and EPIC-002/1 (AI AG-UI Contracts)
parallel_work: []
blocking_dependencies: ["EPIC-001/6", 1]
contract_dependencies: ["AG-UI AI event contracts from EPIC-002_TASK_1"]
phase: "foundation"
---

# Task Overview
This task involves updating the frontend AG-UI client (`agUiService.ts` or equivalent hooks/context) and the chat UI components to properly handle and display the new AG-UI events that carry text responses from the AI agent. These events and their payloads are defined in `EPIC-002_TASK_1`.

## Business Context
For users to benefit from the AI agent, its responses must be clearly displayed within the chat interface. This task ensures that the frontend can listen for AI-specific messages, parse them correctly, and render them in a way that distinguishes them from user messages, providing a seamless conversational experience.

## Acceptance Criteria
- [ ] Frontend AG-UI client/service is updated to subscribe to and handle new AG-UI events for AI text responses (e.g., `ai:text_response` as defined in `EPIC-002_TASK_1`).
- [ ] The main chat UI component is updated to:
  - Receive parsed AI messages from the AG-UI service.
  - Add these AI messages to the displayed list of chat messages.
  - Visually differentiate AI agent messages from user messages (e.g., different alignment, avatar, background color).
- [ ] The `MessageType` (or equivalent type/interface for chat messages on the frontend) is updated to accommodate any new fields specific to AI messages (e.g., `attribution: "AI Tutor"`).
- [ ] Frontend correctly renders text responses sent by the (mocked or actual) backend AI agent.

## Service Layer TDD Approach
### Test Strategy
- **AG-UI Client/Service (`agUiService.ts` or hooks):**
  - Unit test the logic that handles incoming `ai:text_response` events.
  - Verify that the event payload is correctly parsed and transformed into the frontend's `MessageType`.
  - Ensure that the service correctly dispatches the new message to UI subscribers/state.
- **React Chat UI Components:**
  - Use React Testing Library to test components.
  - Mock the `agUiService.ts` (or hook) to simulate receiving AI messages.
  - Verify that AI messages are rendered correctly in the message list.
  - Verify that AI messages are visually distinct from user messages.

### Key Test Scenarios
- **AG-UI Service/Hook:**
  - When an `ai:text_response` event is received by the (mocked) AG-UI client, the service parses it and updates its internal state or calls the registered handler with the correct `MessageType` object.
  - The `MessageType` object for an AI message includes correct attribution.
- **Chat UI Components (with mocked service):**
  - When the (mocked) service provides a new AI message, it appears in the chat display.
  - AI messages have a different visual style (e.g., specific CSS class applied) compared to user messages.
  - Message list correctly interleaves user and AI messages in chronological order (if timestamps are used).

## Technical Specifications
### Service Interface Design
- **AG-UI Event (`ai:text_response` BE -> FE):** As defined in `EPIC-002_TASK_1`. Payload example: `{ "message_id": "string", "text": "string", "attribution": "AI Tutor" }`.
- **Frontend `MessageType` (e.g., in `src/features/ai-tutor/types/index.ts`):**
  ```typescript
  interface Message {
    id: string;
    userId?: string; // Optional if it's an AI message not tied to a user sender
    userName?: string; // Optional, could be "You" for user or "AI Tutor" for AI
    text: string;
    timestamp: string; // ISO datetime string
    isOwnMessage?: boolean; // To style user's own messages
    source?: 'user' | 'ai'; // To differentiate message origin
    attribution?: string; // e.g., "AI Tutor"
  }
  ```

### Implementation Guidance
- Update the AG-UI message handling logic in `agUiService.ts` (or the relevant React hook/context like `useAITutorChat`) to listen for the new event type (e.g., `ai:text_response`).
- Modify the React components responsible for rendering messages to apply different styling based on the `message.source` or `message.attribution` field.
- Ensure that the state management for the message list can handle these new message types.
- If not already done in Task 1.6, consider adding unique keys (`key={message.id}`) to messages when rendering lists in React.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/6` (Frontend Chat Message Sending/Receiving - provides the basic chat UI and message display structure), `EPIC-002_TASK_1` (AI Agent Interaction Contract & AG-UI Events - defines the events to handle).
- **Contract Dependencies**: "AG-UI AI event contracts" from `EPIC-002_TASK_1`.
- **Parallel Work Opportunities**: Can be developed once `EPIC-002_TASK_1` is defined, using mock AG-UI events before the backend (Task 2.5) is fully ready to send them.
- **Mock Requirements**: Mock AG-UI events (matching the contract from `EPIC-002_TASK_1`) will be needed to test the frontend handling logic independently of the backend.
- **Integration Points**: This task integrates with the backend's AG-UI event broadcasting (Task 2.5).

## Definition of Done
- [ ] Frontend can receive and parse `ai:text_response` AG-UI events.
- [ ] AI agent's text messages are displayed correctly in the chat UI.
- [ ] AI messages are visually distinguishable from user messages.
- [ ] Frontend `MessageType` is updated as needed.
- [ ] Unit/component tests for the new frontend logic pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Pay attention to the user experience: AI messages should be clearly identifiable. Consider using avatars or distinct message bubble styles.
- Ensure the message ordering (interleaving user and AI messages) is correct, typically based on timestamps.
