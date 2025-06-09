---
task_id: 3
title: "Frontend AG-UI Client Handling for Rich Component Rendering & Events"
epic: "EPIC-003"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-002/6", 1, 2] # Depends on FE AI Text Handling, and EPIC-003/1 (Contracts), EPIC-003/2 (Component Lib)
parallel_work: []
blocking_dependencies: ["EPIC-002/6", 1, 2]
contract_dependencies: ["Rich Component AG-UI contracts from EPIC-003_TASK_1"]
phase: "core"
---

# Task Overview
This task involves extending the frontend's AG-UI client/service (`agUiService.ts` or equivalent React hook/context like `useAITutorChat`) to handle the new AG-UI events related to rich components. This includes:
1.  Receiving events from the backend that instruct the frontend to render a specific rich component with a given configuration (as defined in `EPIC-003_TASK_1`).
2.  Dynamically rendering the appropriate React component (from `EPIC-003_TASK_2`) based on these instructions.
3.  Capturing user interaction events emitted by these rich components and sending them back to the backend via AG-UI (as per `EPIC-003_TASK_1` contracts).

## Business Context
This task is the linchpin for making rich components truly interactive within the chat flow. It enables the frontend to respond to backend instructions for displaying dynamic UI elements and to communicate user interactions with these elements back for processing. This creates a much more engaging and varied user experience than plain text messages.

## Acceptance Criteria
- [ ] Frontend AG-UI service (`agUiService.ts` or hook) is updated to subscribe to and parse `ui:render_rich_component` events (or similar, from `EPIC-003_TASK_1`).
- [ ] Logic is implemented (e.g., within the main chat UI component or a dedicated manager) to dynamically render the correct React rich component based on the `component_type` specified in the AG-UI event.
  - [ ] The `config` from the event is correctly passed as props to the instantiated rich component.
  - [ ] The `interaction_id` from the event is correctly passed as a prop to the rich component.
- [ ] The AG-UI service/hook is updated to handle callbacks/events from rendered rich components when users interact with them.
- [ ] User interaction data (including the `interaction_id`) is formatted into the correct AG-UI event structure (e.g., `ui:component_interaction` from `EPIC-003_TASK_1`) and sent to the backend.
- [ ] The system can handle multiple rich components being active or displayed in the chat history.
- [ ] Unit/integration tests for the AG-UI service/hook and component rendering logic are implemented.

## Service Layer TDD Approach
### Test Strategy
- **AG-UI Service/Hook (Unit/Integration Tests):**
  - Test the handling of incoming `ui:render_rich_component` events: verify correct parsing, state updates, and triggering of component rendering logic.
  - Test the sending of `ui:component_interaction` events: verify correct payload formatting based on data received from component callbacks.
  - Mock the actual WebSocket connection and the React components themselves during these tests.
- **Chat UI / Component Manager (React Testing Library):**
  - Test that when the AG-UI service signals to render a component (mocked signal), the correct component type is chosen and rendered with the correct props.
  - Test that when a (mocked) rich component emits an interaction event, the UI/manager correctly calls the AG-UI service to send the data to the backend.

### Key Test Scenarios
- **AG-UI Service/Hook:**
  - Receiving a `ui:render_rich_component` event for an MCQ correctly updates state or calls a handler to render an MCQ.
  - Data from a rich component interaction (e.g., MCQ option selected) is correctly packaged and sent via the AG-UI `send` method.
- **Chat UI / Component Manager:**
  - When a "render MCQ" AG-UI event is processed, an `MultipleChoiceQuestion` component appears in the UI with the specified question and options.
  - When the rendered `MultipleChoiceQuestion` component calls its `onInteraction` prop, the Chat UI/manager captures this and triggers the `agUiService.sendComponentInteraction` method.

## Technical Specifications
### Service Interface Design
- Relies on AG-UI event contracts defined in `EPIC-003_TASK_1`.
- **Internal State/Logic:**
  - May need a way to manage the state of active rich components in the chat view (e.g., an array of component definitions in React state).
  - A mapping from `component_type` string (from AG-UI event) to actual React component constructors might be useful (e.g., a simple switch statement or a more dynamic registry).
  ```typescript
  // Example in useAITutorChat or similar
  // State:
  // activeRichComponents: Array<{ id: string; componentType: string; config: any; interactionId: string }>

  // Handling incoming render event:
  // addRichComponentToView(eventPayload);

  // Handling interaction callback from a component:
  // sendComponentInteraction(interactionData);
  ```

### Implementation Guidance
- Update the main AG-UI event handler in `agUiService.ts` or the central React hook (`useAITutorChat`) to recognize `ui:render_rich_component` events.
- Implement a mechanism to dynamically render components. This could be in the main chat message rendering loop, checking for a special message type that represents a rich component.
- Pass down the `interaction_id` to each rendered rich component.
- Ensure that when a rich component calls its interaction callback (e.g., `onInteraction`), this callback is wired up to a function in `agUiService.ts` or `useAITutorChat` that sends the `ui:component_interaction` AG-UI event to the backend.
- Consider how to display past interactions. For example, once an MCQ is answered, should it become read-only or be replaced by a summary? (Initial scope: just render and send interaction; display of historical interactions can be simpler).

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-002/6` (Frontend Handling of AI Agent Text Responses) - builds upon existing AG-UI client setup.
  - `EPIC-003_TASK_1` (Define AG-UI Event Contracts for Rich Components) - essential for event payloads.
  - `EPIC-003_TASK_2` (Develop Reusable React Rich Component Library) - needs at least one component to render.
- **Contract Dependencies**: "Rich Component AG-UI contracts" from `EPIC-003_TASK_1`.
- **Parallel Work Opportunities**: Can be developed once contracts (`EPIC-003_TASK_1`) are stable and at least one component from `EPIC-003_TASK_2` is available for integration.
- **Mock Requirements**: Mock AG-UI events (both for rendering and for interaction responses) will be crucial for testing this logic without full backend integration. Mock React components can also be used when testing the AG-UI service part.
- **Integration Points**: This task is the core frontend integration point for rich components. It connects AG-UI events from the backend to actual UI rendering and user interaction capture.

## Definition of Done
- [ ] Frontend can receive and process `ui:render_rich_component` AG-UI events.
- [ ] Correct rich components are dynamically rendered based on event data.
- [ ] User interactions with rich components are captured and sent to the backend as `ui:component_interaction` AG-UI events.
- [ ] The system handles rendering and interaction for at least one type of rich component end-to-end (with mocked backend responses if necessary).
- [ ] Relevant unit/integration tests pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Managing the lifecycle and state of multiple dynamic components within a chat stream can be complex. Start with a clear model for how components are added to the chat view and how their interactions are managed.
- Ensure `interaction_id` is correctly passed through the entire loop: BE renders with ID -> FE component gets ID -> FE component sends interaction with same ID -> BE receives interaction with ID.
