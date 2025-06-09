---
task_id: 3
title: "Develop Simple AI Agent for Text Processing & LLM Integration"
epic: "EPIC-002"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: [1, 2] # Depends on EPIC-002/1 (Contract) and EPIC-002/2 (Framework Setup)
parallel_work: []
blocking_dependencies: [1, 2]
contract_dependencies: ["AI Agent I/O contract from EPIC-002_TASK_1"]
phase: "foundation"
---

# Task Overview
This task involves implementing the initial version of the AI Tutor agent (e.g., in `app/agents/tutor_agent.py`). This agent will use the framework chosen in Task 2.2. Its primary capability will be to receive text input (based on the contract from Task 2.1), pass this text to a Large Language Model (LLM, e.g., OpenAI GPT series) for basic understanding and response generation, and then formulate a simple text response based on the LLM's output.

## Business Context
This is where the core "intelligence" of the tutor begins to take shape. By integrating with an LLM, the agent can move beyond pre-programmed responses and start to engage in more natural, context-aware conversations. This task delivers the first functional version of the AI agent capable of basic dialogue.

## Acceptance Criteria
- [ ] The AI agent (`TutorAgent` or equivalent) can be initialized.
- [ ] Agent has a method (e.g., `process_message(input_data: AgentInput) -> AgentOutput`) that accepts data compliant with `EPIC-002_TASK_1`'s input contract.
- [ ] Agent successfully makes a call to an LLM (e.g., OpenAI API) with the user's text input (or a derivative).
  - [ ] LLM API key is securely accessed from configuration (not hardcoded).
- [ ] Agent processes the LLM's response.
- [ ] Agent returns a response compliant with `EPIC-002_TASK_1`'s output contract (e.g., a simple text response).
- [ ] Basic error handling for LLM API calls (e.g., network issues, API errors) is implemented.
- [ ] Unit tests are written for the agent's core logic, mocking the LLM interaction.

## Service Layer TDD Approach
### Test Strategy
- **Agent Logic (Unit Tests):**
  - Test the main `process_message` method extensively.
  - Mock the LLM client/API call to isolate agent logic.
  - Verify that the agent correctly constructs prompts for the LLM based on input.
  - Verify that the agent correctly parses the LLM's response.
  - Test how the agent handles different types of LLM responses (e.g., valid text, empty response, error from LLM).
  - Test compliance with input and output data contracts.

### Key Test Scenarios
- Given user input "Hello", the agent calls the (mocked) LLM with an appropriate prompt.
- Given a (mocked) LLM response "Hi there! How can I help you?", the agent returns an `AgentOutput` containing this text.
- If the (mocked) LLM call fails, the agent handles the error gracefully (e.g., returns a default error message or raises a specific exception).
- Agent correctly extracts user message from the `AgentInput` data structure.
- Agent correctly formats its output into the `AgentOutput` data structure.

## Technical Specifications
### Service Interface Design
- **Agent Method (in `app/agents/tutor_agent.py`):**
  - `async def process_message(self, user_input: AgentInputModel) -> AgentOutputModel:`
    - `AgentInputModel` and `AgentOutputModel` are Pydantic models representing the contracts defined in `EPIC-002_TASK_1`.
- **LLM Interaction:**
  - Will use an LLM client library (e.g., `openai` Python package).
  - A simple prompt template might be used, e.g., "You are a helpful tutor. The user said: {user_message}".

### Implementation Guidance
- Implement the agent logic within the structure set up by the chosen framework in Task 2.2.
- Use the `openai` (or other LLM provider's) Python SDK for LLM calls.
- Ensure LLM API keys are read from environment variables via `app/core/config.py`.
- Start with a very simple prompt strategy. Prompt engineering can be refined later.
- Focus on the request-response flow; state management within the agent can be minimal for this task.
- Implement clear logging for LLM requests and responses (be mindful of PII if raw user data is logged).

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-002_TASK_1` (AI Agent Interaction Contract), `EPIC-002_TASK_2` (AI Agent Framework Setup).
- **Contract Dependencies**: "AI Agent I/O contract" from `EPIC-002_TASK_1`.
- **Parallel Work Opportunities**: None directly, as this task implements the core agent logic needed for integration.
- **Mock Requirements**: The LLM client/API calls **must** be mocked for unit tests to ensure tests are fast, deterministic, and don't incur costs.
- **Integration Points**: The `process_message` method of this agent will be called by a Temporal Activity developed in `EPIC-002_TASK_4`.

## Definition of Done
- [ ] AI agent can process input text, call an LLM, and generate a text response.
- [ ] Agent adheres to the defined input/output contracts.
- [ ] LLM API integration is functional and secure (key management).
- [ ] Basic error handling for LLM calls is implemented.
- [ ] Unit tests for agent logic (with mocked LLM) pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- This is a critical task. The quality of interaction with the LLM will directly impact user experience.
- Keep the scope limited to simple text-in, text-out for this first version. Do not attempt complex tool use or memory yet.
- Be mindful of LLM token limits and potential costs, even during development.
