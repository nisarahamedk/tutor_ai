---
task_id: 4
title: "AI Agent Logic to Select and Configure Rich Components"
epic: "EPIC-003"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-002/3", 1] # Depends on Simple AI Agent and EPIC-003/1 (Rich Component Contracts)
parallel_work: ["EPIC-003_TASK_2", "EPIC-003_TASK_5"]
blocking_dependencies: ["EPIC-002/3", 1]
contract_dependencies: ["Rich Component AG-UI contracts from EPIC-003_TASK_1", "AI Agent I/O contract from EPIC-002_TASK_1"]
phase: "core"
---

# Task Overview
This task enhances the AI agent (from `EPIC-002_TASK_3`) to make decisions about when a rich interactive component is more appropriate for an interaction than a simple text response. It involves implementing logic for the agent to:
1.  Identify situations or intents where a specific rich component (e.g., MCQ, Slider) should be used.
2.  Select the appropriate component type.
3.  Configure the component with relevant data (e.g., question text and options for an MCQ, label and range for a slider) based on the learning context or user query.
4.  Format its output to include instructions for the backend/AG-UI system to render this component, using the contracts defined in `EPIC-003_TASK_1`.

## Business Context
This is a key step in making the AI tutor more interactive and effective. By enabling the AI agent to proactively choose and configure rich components, the learning experience becomes more dynamic and can cater to a wider variety of pedagogical strategies (e.g., assessments, interactive explanations, feedback collection).

## Acceptance Criteria
- [ ] AI agent (`TutorAgent` or equivalent in `app/agents/tutor_agent.py`) is modified to include logic for selecting rich components.
- [ ] Agent can identify at least one scenario where it should use a rich component (e.g., user asks a question that can be an MCQ, or agent decides to assess understanding).
- [ ] Agent can dynamically populate the configuration for the chosen component (e.g., generate MCQ options based on a topic).
- [ ] The agent's output data structure (as defined in `EPIC-002_TASK_1`, possibly extended) now supports specifying a rich component to be rendered. This output should align with what the backend (Temporal activity/AG-UI sender) expects to then generate the `ui:render_rich_component` AG-UI event (from `EPIC-003_TASK_1`).
  - This might involve adding a `requested_component` field to the `AgentOutputModel`, e.g.:
    ```json
    // AgentOutputModel from EPIC-002/1, potentially extended:
    {
      "response_type": "text | render_component | ...",
      "payload": { /* ... */ },
      "requested_component": { // New optional field
        "interaction_id": "uuid_for_frontend_to_return", // Agent might suggest or BE generates this
        "component_type": "MultipleChoiceQuestion",
        "config": { /* MCQ specific config */ }
      }
    }
    ```
- [ ] Unit tests for the agent are updated to cover the new component selection and configuration logic, mocking any external calls (LLM, content sources).

## Service Layer TDD Approach
### Test Strategy
- **Agent Logic (Unit Tests):**
  - Extend tests for the agent's `process_message` (or equivalent) method.
  - Mock LLM calls and any content/data sources the agent might use to configure components.
  - Test the decision logic: under what conditions does the agent choose to use a rich component vs. text?
  - Test component configuration: does the agent populate the `config` object for the component correctly based on mocked context or LLM output?
  - Verify the agent's output structure correctly includes the `requested_component` details.

### Key Test Scenarios
- Given user input "Quiz me on topic X":
  - Agent decides to use an MCQ component.
  - Agent (with mocked LLM/data) generates a question and options for topic X.
  - Agent output includes `response_type: "render_component"` and `requested_component` data for the MCQ, correctly formatted.
- Given a scenario where a text response is appropriate, agent output has `response_type: "text"` and no `requested_component`.
- If agent tries to configure a component but lacks necessary data (mocked scenario), it handles this gracefully (e.g., falls back to text response or asks for clarification).

## Technical Specifications
### Service Interface Design
- **Agent Output Model Extension:** The `AgentOutputModel` (defined in `EPIC-002_TASK_1` context) will need to be extended or have a flexible payload to accommodate instructions for rendering rich components. The example in Acceptance Criteria (`requested_component` field) is one way. The key is that this output must provide all necessary info for the calling Temporal activity to then construct the AG-UI `ui:render_rich_component` event.
- **Internal Logic:** The agent might use its LLM to help generate component configurations (e.g., "Generate 3 plausible distractors for an MCQ on topic Y, where the correct answer is Z").

### Implementation Guidance
- Modify the `TutorAgent.process_message` method or add new methods for handling component selection.
- The logic for *when* to use a component can start simple (e.g., keyword triggers, specific points in a predefined script) and become more sophisticated later.
- The agent needs to generate a unique `interaction_id` or have one provided to it, which will be part of the `requested_component` structure it outputs. This ID is crucial for tracking the interaction. The backend service calling the agent might be responsible for generating this ID and passing it to the agent, which then includes it in its `requested_component` output.
- Ensure the agent's output clearly distinguishes between a direct text response and a request to render a component.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-002_TASK_3` (Simple AI Agent), `EPIC-003_TASK_1` (Define AG-UI Event Contracts for Rich Components - agent needs to know what components exist and their required configs).
- **Contract Dependencies**: "Rich Component AG-UI contracts" (specifically, the `config` structure for each component type) from `EPIC-003_TASK_1`. Also, the agent's own "AI Agent I/O contract" from `EPIC-002_TASK_1` which is being extended here.
- **Parallel Work Opportunities**: `EPIC-003_TASK_2` (FE Rich Component Library Dev) can happen in parallel. `EPIC-003_TASK_5` (Backend handling of component events) will integrate this agent's output.
- **Mock Requirements**: LLM calls and any external data sources used for populating component configs must be mocked for unit tests.
- **Integration Points**: The output of this enhanced agent will be consumed by the Temporal activity (`call_ai_agent_activity` from `EPIC-002_TASK_4`), which will then trigger the backend AG-UI logic (Task 3.5) to send rendering instructions to the frontend.

## Definition of Done
- [ ] AI agent can select at least one type of rich component based on context.
- [ ] AI agent can dynamically configure the selected component.
- [ ] Agent's output structure correctly conveys the component rendering request.
- [ ] Unit tests for the new agent logic pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- The "intelligence" for choosing and configuring components can range from simple hardcoded rules to complex LLM-driven decisions. Start simple.
- The `interaction_id` generation and flow is critical. A good approach is:
    1. Backend (e.g., Temporal activity calling the agent) generates `interaction_id`.
    2. `interaction_id` is passed to the agent as part of its input context.
    3. Agent includes this `interaction_id` in its `requested_component` output.
    4. Backend uses this `interaction_id` when sending the `ui:render_rich_component` AG-UI event.
    5. Frontend sends this `interaction_id` back with user input from the component.
- This ensures the backend can correlate a user's interaction with the specific component instance it requested.
