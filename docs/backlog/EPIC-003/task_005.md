---
task_id: 5
title: "Backend AG-UI Server & Temporal Workflow - Rich Component Event Handling"
epic: "EPIC-003"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-002/5", 1, 4] # Depends on BE AG-UI relay, EPIC-003/1 (Contracts), EPIC-003/4 (AI logic for components)
parallel_work: []
blocking_dependencies: ["EPIC-002/5", 1, 4]
contract_dependencies: ["Rich Component AG-UI contracts from EPIC-003_TASK_1", "AI Agent I/O contract (extended for components) from EPIC-003_TASK_4"]
phase: "core"
---

# Task Overview
This task modifies the backend systems (AG-UI server endpoint in `chat.py`, relevant Temporal workflows like `ChatSessionWorkflow`, and activities like `call_ai_agent_activity`) to handle the two-way communication for rich interactive components. This includes:
1.  Processing the AI agent's output (from `EPIC-003_TASK_4`) when it requests a rich component to be rendered. This involves constructing and sending the correct `ui:render_rich_component` AG-UI event to the frontend.
2.  Receiving `ui:component_interaction` AG-UI events from the frontend when a user interacts with a rich component.
3.  Passing this interaction data (e.g., selected MCQ answer) back to the Temporal workflow, which will then likely forward it to the AI agent for further processing (covered in Task 3.7).

## Business Context
This task forms the backend backbone for rich component interactivity. It enables the system to dynamically present interactive elements based on AI decisions and to capture user input from these elements. This is essential for creating more engaging and effective learning flows, such as quizzes, interactive exercises, and feedback mechanisms.

## Acceptance Criteria
- [ ] The Temporal activity calling the AI agent (e.g., `call_ai_agent_activity`) is updated to handle the agent's (potentially new) output structure that requests rich component rendering.
- [ ] If the agent requests a component, the workflow/activity triggers logic in the backend (e.g., `ChatService` or AG-UI handler in `chat.py`) to send the appropriate `ui:render_rich_component` AG-UI event to the frontend, using contracts from `EPIC-003_TASK_1`.
  - [ ] This includes generating and managing the `interaction_id` if not already handled by the agent.
- [ ] The backend AG-UI endpoint (`chat.py`) is updated to receive and parse `ui:component_interaction` events from the frontend (as per `EPIC-003_TASK_1`).
- [ ] Received interaction data (including `interaction_id`) is passed to the relevant Temporal workflow instance (e.g., `ChatSessionWorkflow` via a signal).
- [ ] The `ChatSessionWorkflow` is updated to handle this incoming interaction data (e.g., store it, or prepare it to be sent to the AI agent in a subsequent step/activity).
- [ ] Unit and integration tests are updated for the modified backend components.

## Service Layer TDD Approach
### Test Strategy
- **Temporal Activity/Workflow:**
  - Test that if the (mocked) AI agent output includes a `requested_component`, the workflow correctly initiates the process of sending the `ui:render_rich_component` AG-UI event (e.g., by signaling the main app or calling another activity).
  - Test that the workflow correctly handles an incoming signal representing a `ui:component_interaction` event, updating its state or preparing data for the next AI call.
- **AG-UI Endpoint/Handler (`chat.py`, `ChatService`):**
  - Test that when triggered (e.g., by a workflow signal with component details), it correctly formats and sends the `ui:render_rich_component` event.
  - Test that it correctly parses incoming `ui:component_interaction` events and signals the appropriate Temporal workflow with the interaction data. Mock WebSocket connections and Temporal client.

### Key Test Scenarios
- **Component Rendering Flow:**
  - (Mocked) AI Agent output specifies an MCQ.
  - Temporal workflow/activity processes this, triggering the (mocked) AG-UI sending mechanism.
  - The (mocked) AG-UI sender is called with a correctly formatted `ui:render_rich_component` event for an MCQ, including a valid `interaction_id`.
- **Component Interaction Flow:**
  - (Mocked) AG-UI endpoint receives a `ui:component_interaction` event for an MCQ answer (with `interaction_id`).
  - The endpoint correctly signals the (mocked) Temporal `ChatSessionWorkflow` instance associated with the `interaction_id` (or user session).
  - The workflow receives the signal with the MCQ answer data.

## Technical Specifications
### Service Interface Design
- Relies on AG-UI event contracts (`ui:render_rich_component`, `ui:component_interaction`) from `EPIC-003_TASK_1`.
- Relies on the AI Agent's output contract (extended for components) from `EPIC-003_TASK_4`.
- **Temporal Workflow (`ChatSessionWorkflow`):**
  - May need a new signal handler for `ui:component_interaction` data.
  - Logic to decide whether AI output is text (send via existing text relay) or component (use new component render relay).
- **AG-UI Handler (`chat.py`):**
  - Needs to manage `interaction_id`s: potentially store which workflow/session an `interaction_id` belongs to, so incoming interactions can be routed correctly. Alternatively, `interaction_id` could be globally unique and workflows could subscribe to specific ones. Simpler: `interaction_id` is tied to a session, and the session's workflow is signaled.

### Implementation Guidance
- **Sending `ui:render_rich_component`:**
  - The Temporal activity (`call_ai_agent_activity`) gets the component request from the AI.
  - This activity might then signal the FastAPI application (e.g., via a Redis pub/sub, or a direct call if co-located and designed carefully, or another activity that can call an HTTP endpoint on the FastAPI app if they are separate services). The signal should contain all data needed to form the AG-UI event.
  - The FastAPI AG-UI handler (in `chat.py`) receives this internal signal/request and sends the actual AG-UI event over WebSocket.
  - Ensure `interaction_id` is generated (if not by AI) and included. This ID must be temporarily stored or be inferable so the backend knows which workflow to notify when the user interacts with this specific component instance.
- **Receiving `ui:component_interaction`:**
  - The AG-UI endpoint in `chat.py` receives this event from the frontend.
  - It extracts the `interaction_id` and the user's input.
  - It uses the `interaction_id` (or the user's session ID) to find the correct `ChatSessionWorkflow` instance.
  - It signals this workflow instance with the user's input data.
- The `ChatSessionWorkflow` updates its state with this new input, ready for the next call to the AI agent (which will be Task 3.7).

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-002/5` (Backend AG-UI relay for text messages) - provides base for AG-UI sending.
  - `EPIC-003_TASK_1` (Rich Component AG-UI Contracts) - defines events.
  - `EPIC-003_TASK_4` (AI Agent Logic for Rich Components) - provides the trigger for rendering components.
- **Contract Dependencies**: "Rich Component AG-UI contracts" from `EPIC-003_TASK_1`, and the "AI Agent I/O contract" (extended version) from `EPIC-003_TASK_4`.
- **Parallel Work Opportunities**: `EPIC-003_TASK_7` (AI processing of component input) can be developed once the format of interaction data passed to the workflow is clear.
- **Mock Requirements**: Mock AI agent outputs, AG-UI connections, and Temporal client/workflows for isolated testing of components.
- **Integration Points**: This task connects the AI's decisions (Task 3.4) to the AG-UI sending mechanism, and incoming AG-UI interactions to the Temporal workflow system.

## Definition of Done
- [ ] Backend can process AI agent requests to render rich components and send correct AG-UI events to frontend.
- [ ] Backend AG-UI endpoint can receive and parse user interaction events from rich components.
- [ ] Interaction data is correctly passed to the relevant Temporal workflow.
- [ ] `interaction_id` is correctly managed and used for correlation.
- [ ] Unit and integration tests for new/modified backend logic pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- The mapping and management of `interaction_id` is critical. It must allow the stateless backend (FastAPI) to route an interaction received from any user back to the correct stateful workflow instance that is expecting it. This might involve the workflow explicitly waiting for a signal related to that `interaction_id` or the user's session.
- Consider the case where a user might interact with an old component instance. How should this be handled? (Initially, may assume only interaction with the latest component is valid or processed).
