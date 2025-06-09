---
task_id: 7
title: "AI Agent - Processing User Input from Rich Components"
epic: "EPIC-003"
status: "pending"
priority: "medium"
estimated_hours: 7
dependencies: [4, 5] # Depends on EPIC-003/4 (AI logic for components), EPIC-003/5 (BE handling of component data)
parallel_work: []
blocking_dependencies: [4, 5]
contract_dependencies: ["Rich Component AG-UI contracts from EPIC-003_TASK_1 (interaction part)", "AI Agent I/O contract from EPIC-002_TASK_1"]
phase: "core"
---

# Task Overview
This task focuses on enhancing the AI agent to understand and act upon the data received from user interactions with rich components. When the backend (via Temporal workflow, as set up in Task 3.5) passes user input from a component (e.g., an MCQ answer, a slider value) back to the agent, the agent needs to process this structured input and decide on the next step in the conversation or learning flow.

## Business Context
For rich components to be truly interactive and pedagogically useful, the AI tutor must be able to interpret user responses to them. This allows the agent to provide targeted feedback, adapt the learning path, or continue the conversation in a contextually relevant manner based on the user's explicit input through these components.

## Acceptance Criteria
- [ ] The AI agent's input processing logic (`TutorAgent.process_message` or a new dedicated method) is updated to handle new types of input derived from rich component interactions.
  - [ ] This input will likely come via the `AgentInputModel` (from `EPIC-002_TASK_1`), perhaps with a new field indicating the source is a component interaction, e.g., `component_interaction_data`.
- [ ] Agent can correctly interpret the data from at least one type of rich component interaction (e.g., identify the selected option ID for an MCQ).
- [ ] Based on the interpreted interaction, the agent can generate a relevant follow-up response (text or another component).
  - Example for MCQ: If answer is correct, provide positive feedback. If incorrect, provide corrective feedback or a hint.
- [ ] The agent's decision logic considers the `interaction_id` to maintain context if needed (though much of the state might be in the workflow).
- [ ] Unit tests for the agent are updated to cover processing of various component interaction data, mocking LLM calls.

## Service Layer TDD Approach
### Test Strategy
- **Agent Logic (Unit Tests):**
  - Extend tests for the agent's main processing method.
  - Provide mock `AgentInputModel` data that simulates different rich component interactions (e.g., user selected correct/incorrect MCQ option, user set slider to specific value).
  - Mock LLM calls.
  - Verify the agent correctly parses the component interaction data.
  - Verify the agent generates an appropriate `AgentOutputModel` (e.g., feedback text, request for another component) based on the interaction.

### Key Test Scenarios
- Given input simulating a correct MCQ answer for `interaction_id_123`:
  - Agent identifies the answer as correct.
  - Agent generates a positive feedback message (text response).
- Given input simulating an incorrect MCQ answer:
  - Agent identifies the answer as incorrect.
  - Agent generates corrective feedback or a hint (text response).
- Given input simulating a slider value submission:
  - Agent acknowledges the input and perhaps tailors its next response based on the value.
- Agent correctly uses the `interaction_id` if its logic requires correlating the input to a previous state or request.

## Technical Specifications
### Service Interface Design
- **Agent Input Model (`AgentInputModel` from `EPIC-002_TASK_1`, possibly extended):**
  - May need a new field or a structured way to pass component interaction data. For example:
  ```json
  // Current AgentInputModel (conceptual)
  // { "user_message": "string", ... }

  // Extended or new input type for component interactions:
  // {
  //   "interaction_id": "uuid_from_original_component_render",
  //   "component_type": "MultipleChoiceQuestion",
  //   "user_input": { "selected_option_id": "opt_2" },
  //   "original_context": { ... } // Optional: context from when component was first requested by agent
  // }
  ```
  The Temporal activity (`call_ai_agent_activity`) will be responsible for packaging this data for the agent.
- The agent's output will conform to `AgentOutputModel` (text or another component request).

### Implementation Guidance
- Modify the `TutorAgent` to check for and process this new type of input data.
- The agent's logic might involve:
  - Simple rule-based responses (e.g., for MCQ: if `selected_option_id == correct_option_id` -> "Correct!").
  - Passing the interaction data to an LLM for more nuanced feedback generation (e.g., "User chose option B for question X. The correct answer was C. Explain why B is incorrect and C is correct, based on this context: [original question context]").
- The `interaction_id` can be used by the agent if it needs to refer to the specific instance of the component it previously requested (e.g., to retrieve the original question text for an MCQ to formulate feedback).

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-003_TASK_4` (AI Agent Logic to Select and Configure Rich Components) - agent needs to first request components.
  - `EPIC-003_TASK_5` (Backend AG-UI Server & Temporal Workflow - Rich Component Event Handling) - ensures interaction data from FE reaches the workflow to be passed to the agent.
- **Contract Dependencies**: "Rich Component AG-UI contracts" from `EPIC-003_TASK_1` (specifically the FE->BE interaction payload structure, which forms the basis of what the agent receives). The agent's own "AI Agent I/O contract" from `EPIC-002_TASK_1` (which is what this task effectively extends for input).
- **Parallel Work Opportunities**: None directly for this internal agent logic task.
- **Mock Requirements**: Mock input data representing various component interactions. Mock LLM calls.
- **Integration Points**: This task makes the AI agent responsive to user interactions with rich components, closing the loop: `Agent requests component -> FE renders & user interacts -> Backend relays interaction -> Agent processes interaction -> Agent generates follow-up`.

## Definition of Done
- [ ] AI agent can parse and interpret interaction data from at least one type of rich component.
- [ ] Agent generates contextually appropriate responses based on this interaction data.
- [ ] Unit tests for processing component interactions pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- The complexity here can vary greatly. Start with simple, direct processing of interaction data. LLM-driven interpretation and feedback generation can be very powerful but also more complex to implement and test.
- How the agent gets context about the original component request (e.g., what the MCQ question and options were) is important. This context might need to be persisted in the workflow and passed to the agent along with the user's interaction data.
