---
task_id: 8
title: "Temporal Workflow State Management for Rich Component Interactions"
epic: "EPIC-003"
status: "pending"
priority: "medium"
estimated_hours: 6
dependencies: [5] # Depends on EPIC-003/5 (BE handling of component data)
parallel_work: []
blocking_dependencies: [5]
contract_dependencies: ["Rich Component AG-UI contracts from EPIC-003_TASK_1 (interaction part)"] # For understanding data flow
phase: "core"
---

# Task Overview
This task involves updating the relevant Temporal workflows (primarily `ChatSessionWorkflow`) to more robustly manage state related to ongoing or completed rich component interactions. For example, this could involve tracking if a specific interactive question (identified by `interaction_id`) has been answered, what the answer was, or if a user needs to complete an interaction before proceeding.

## Business Context
As interactions become more complex than simple text exchanges, managing the state of these interactions within a durable workflow becomes important. This ensures that the system can correctly interpret sequences of interactions, handle timeouts or user delays, and maintain context even if users pause and resume their sessions. This contributes to a more robust and intelligent tutoring experience.

## Acceptance Criteria
- [ ] `ChatSessionWorkflow` in `app/temporal/workflows.py` is enhanced to store and manage state related to rich component interactions.
  - [ ] Example state: current `interaction_id` awaiting response, outcome of a previous interaction, number of attempts on a quiz component.
- [ ] Workflow logic is updated to use this state (e.g., prevent sending a new question if a previous one is unanswered, or pass interaction history to the AI agent).
- [ ] Workflow tests are updated to verify the new state management logic.
  - [ ] Test scenarios for sequences of interactions involving rich components.

## Service Layer TDD Approach
### Test Strategy
- **Temporal Workflow (`ChatSessionWorkflow`):**
  - Use `temporaltest.WorkflowEnvironment` for testing.
  - Test how the workflow updates its internal state upon receiving signals for component interactions (from Task 3.5).
  - Verify that workflow decisions (e.g., whether to call the AI agent, what context to pass) correctly use this stored state.
  - Test scenarios where multiple component interactions occur in sequence.

### Key Test Scenarios
- After a `ui:render_rich_component` (e.g., MCQ) is initiated by the workflow, the workflow state reflects that it's awaiting a response for that `interaction_id`.
- When a `ui:component_interaction` signal arrives for that `interaction_id`, the workflow updates its state with the user's input (e.g., selected MCQ option).
- If the AI agent (mocked) is called subsequently, the workflow passes relevant state (e.g., the fact that the user just answered MCQ `interaction_id_123` with option `B`) as part of the agent's input context.
- Workflow handles timeouts if a component interaction is expected but not received within a certain period (optional, advanced for this task).

## Technical Specifications
### Service Interface Design
- This task primarily concerns internal workflow state and logic, not new external service interfaces.
- The workflow will be reacting to signals (containing component interaction data) that were defined as part of `EPIC-003_TASK_5`.
- **Workflow State (Conceptual attributes within `ChatSessionWorkflow` class):**
  ```python
  # self.active_interactions: dict[str, RichComponentState]
  # where RichComponentState might store { component_type, config_sent, user_input, status }
  # self.interaction_history: list[CompletedInteraction]
  ```

### Implementation Guidance
- Identify key pieces of state related to rich components that need to be tracked within the workflow (e.g., `current_pending_interaction_id`, `last_interaction_result`).
- Use workflow variables to store this state.
- Modify workflow logic to:
  - Set state when a component is requested (e.g., note the `interaction_id` that is now active).
  - Update state when user input for that component is received via a signal.
  - Clear or archive state once an interaction is fully processed.
- Ensure that this state is used appropriately when constructing input for subsequent AI agent calls (via `call_ai_agent_activity`).

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-003_TASK_5` (Backend AG-UI Server & Temporal Workflow - Rich Component Event Handling), as this task relies on interaction data being signaled to the workflow.
- **Contract Dependencies**: Understanding of "Rich Component AG-UI contracts" (interaction part) from `EPIC-003_TASK_1` is needed to know what data the workflow will receive and need to store.
- **Parallel Work Opportunities**: Can be developed once the signaling mechanism from Task 3.5 is clear.
- **Mock Requirements**: Mock signals representing user interactions with components will be needed for workflow tests. Mock AI agent calls.
- **Integration Points**: This improved workflow state management directly impacts how the AI agent is called (Task 3.7 - AI processing component input) by providing better context.

## Definition of Done
- [ ] `ChatSessionWorkflow` appropriately stores and updates state related to rich component interactions.
- [ ] Workflow logic correctly utilizes this state for subsequent actions (e.g., contextualizing AI agent calls).
- [ ] Workflow tests for state management of component interactions pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Start with simple state management. For instance, just tracking the most recent `interaction_id` and its outcome might be sufficient initially.
- More complex state (e.g., history of all interactions in a session, attempts per question) can be added iteratively as requirements evolve.
- This state management is crucial for enabling more sophisticated conversational flows where the AI needs to remember previous interactions with components.
