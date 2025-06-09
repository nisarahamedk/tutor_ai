---
task_id: 4
title: "Integrate AI Agent with Backend via Temporal Activity"
epic: "EPIC-002"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-001/7", 3] # Depends on EPIC-001/7 (Temporal Setup) and EPIC-002/3 (Simple AI Agent)
parallel_work: ["EPIC-002_TASK_5"]
blocking_dependencies: ["EPIC-001/7", 3]
contract_dependencies: ["AI Agent I/O contract from EPIC-002_TASK_1"]
phase: "foundation"
---

# Task Overview
This task involves creating a new Temporal activity that serves as a bridge to the AI agent developed in Task 2.3. The existing `ChatSessionWorkflow` (from Task 1.7 of EPIC-001) will be modified to invoke this new activity whenever a user sends a message that needs an AI response. The activity will be responsible for calling the AI agent's processing method and returning its output to the workflow.

## Business Context
Integrating the AI agent into the backend's workflow orchestration (Temporal) is key to managing AI interactions reliably. Temporal activities provide the necessary resilience (retries, timeouts) for calling potentially long-running or fallible services like an AI agent. This task makes the AI agent a usable component within the backend system.

## Acceptance Criteria
- [ ] A new Temporal activity (e.g., `call_ai_agent_activity`) is defined in `app/temporal/activities.py`.
  - [ ] This activity takes necessary input (e.g., user message, session context) to pass to the AI agent.
  - [ ] The activity instantiates or accesses the AI agent (from Task 2.3).
  - [ ] The activity calls the AI agent's processing method (e.g., `agent.process_message()`).
  - [ ] The activity returns the AI agent's response (compliant with `EPIC-002_TASK_1` output contract).
- [ ] The `ChatSessionWorkflow` (defined in `app/temporal/workflows.py`) is modified:
  - [ ] When a user message is received (mechanism to be refined, e.g., via a signal or as part of workflow data), the workflow now calls `call_ai_agent_activity`.
  - [ ] The workflow receives the AI agent's response from the activity.
- [ ] The Temporal worker is updated to register the new activity.
- [ ] Unit tests for the new activity are written, mocking the AI agent.
- [ ] Workflow tests for `ChatSessionWorkflow` are updated to verify it calls the new activity and handles its response.

## Service Layer TDD Approach
### Test Strategy
- **Temporal Activity (`call_ai_agent_activity`):**
  - Unit test the activity function.
  - Mock the AI agent instance/module that the activity calls.
  - Verify the activity correctly calls the agent's `process_message` method with the right parameters.
  - Verify the activity returns the (mocked) agent's output.
  - Test handling of exceptions raised by the (mocked) agent.
- **Temporal Workflow (`ChatSessionWorkflow`):**
  - Use `temporaltest.WorkflowEnvironment` to test the workflow.
  - Mock the `call_ai_agent_activity`.
  - Verify the workflow calls the activity when expected (e.g., upon receiving a user message signal).
  - Verify the workflow correctly handles the data returned by the (mocked) activity.

### Key Test Scenarios
- **Activity (`call_ai_agent_activity`):**
  - Given input data, the activity calls `agent.process_message` with this data.
  - Activity returns the exact output provided by the (mocked) agent.
  - If (mocked) `agent.process_message` raises an exception, the activity propagates it or handles it as defined.
- **Workflow (`ChatSessionWorkflow`):**
  - On receiving a user message signal, the workflow executes `call_ai_agent_activity` with appropriate parameters.
  - The result from the (mocked) activity is stored in a workflow variable or used as expected.

## Technical Specifications
### Service Interface Design
- **Activity Interface (`call_ai_agent_activity` in `app/temporal/activities.py`):**
  - `@activity.defn`
  - `async def call_ai_agent(agent_input: AgentInputModel) -> AgentOutputModel:`
    - `AgentInputModel` and `AgentOutputModel` are Pydantic models from `EPIC-002_TASK_1`.
- **Workflow Modification (`ChatSessionWorkflow`):**
  - Will use `await workflow.execute_activity()` to call the new activity.
  - The mechanism for "receiving a user message" in the workflow needs to be defined. For example, the API endpoint (Task 1.5) could signal the workflow with the new message.

### Implementation Guidance
- The activity should be responsible for instantiating or getting access to the AI agent. This might involve dependency injection if the agent has its own dependencies (like LLM clients).
- The `ChatSessionWorkflow` needs a way to receive user messages. A common pattern is for an external service (like the FastAPI endpoint handling user messages) to signal the workflow instance associated with that user's session.
- Ensure the AI agent's interaction contract (input/output models) is used for data passing between the workflow and activity, and activity and agent.
- Update the Temporal worker script to include the new activity in its registration.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/7` (Basic Temporal Workflow setup), `EPIC-002_TASK_3` (Simple AI Agent implementation).
- **Contract Dependencies**: "AI Agent I/O contract" from `EPIC-002_TASK_1`.
- **Parallel Work Opportunities**: `EPIC-002_TASK_5` (Relay AI Responses to Frontend) can begin once the structure of the AI response from the workflow is clear.
- **Mock Requirements**: The AI agent itself will be mocked when unit testing the activity. The activity will be mocked when testing the workflow.
- **Integration Points**: This integration is key: `FastAPI endpoint -> Signals Workflow -> Workflow calls Activity -> Activity calls AI Agent`. The output from this (AI response) will then be relayed to the frontend in Task 2.5.

## Definition of Done
- [ ] `call_ai_agent_activity` is implemented and calls the AI agent.
- [ ] `ChatSessionWorkflow` is updated to use this activity to get AI responses for user messages.
- [ ] Temporal worker registers the new activity.
- [ ] Unit tests for the activity and updated workflow tests pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Consider activity heartbeating if AI agent calls are expected to be very long, though for simple text responses, this might be overkill initially.
- This task focuses on the Temporal orchestration. The actual sending of the AI response back to the user via AG-UI is handled in the next task (2.5).
- The signaling mechanism from FastAPI to the Workflow needs to be robust (e.g., ensuring the correct workflow instance is signaled).
