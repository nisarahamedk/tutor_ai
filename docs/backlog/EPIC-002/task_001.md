---
task_id: 1
title: "Define AI Agent Interaction Contract & AG-UI Events"
epic: "EPIC-002"
status: "pending"
priority: "high"
estimated_hours: 6
dependencies: ["EPIC-001/1"]
parallel_work: ["EPIC-002_TASK_2", "EPIC-002_TASK_3"]
blocking_dependencies: ["EPIC-001/1"]
contract_dependencies: ["Basic chat AG-UI events from EPIC-001/1"]
phase: "foundation"
---

# Task Overview
This task defines the technical contracts for how the backend (specifically Temporal workflows/activities) will interact with the AI Agent(s). It also covers any new AG-UI event structures needed for the AI agent to communicate basic instructions or text-based responses back to the frontend. This builds upon the foundational chat contracts from EPIC-001.

## Business Context
Clear contracts for AI agent interactions are vital for integrating AI capabilities smoothly. These definitions ensure that the AI agent's inputs and outputs are well-understood by the calling backend logic (Temporal activities) and that any AI-driven communications to the frontend via AG-UI are clearly structured. This enables parallel development of the agent itself and its integration points.

## Acceptance Criteria
- [ ] Data structures for messages/data passed *to* the AI agent are defined and documented.
  - [ ] Includes user input, relevant context (e.g., session ID, user profile snippets).
- [ ] Data structures for responses/commands received *from* the AI agent are defined and documented.
  - [ ] Includes simple text responses, potential requests for clarification, or basic commands (e.g., "request_user_rating_for_response").
- [ ] New AG-UI event structures for AI-driven interactions are documented and approved (if any beyond simple text).
  - [ ] Example: `ai:text_response` (BE -> FE) payload: `{ "message_id": "string", "text": "string", "source": "ai_agent" }`.
  - [ ] Example: `ai:request_clarification` (BE -> FE) payload: `{ "message_id": "string", "prompt_text": "string" }`.
- [ ] Documentation for these contracts is stored in a shared, accessible location (e.g., `docs/api_contracts/ai_agent_interface.md`, `docs/agui_contracts/ai_events.md`).
- [ ] Contracts are reviewed and signed off by relevant backend and AI development team members.

## Service Layer TDD Approach
### Test Strategy
- Similar to other contract definition tasks, validation is through clarity, completeness, and review.
- These contracts will serve as the source of truth for implementing AI agent stubs/mocks and the Temporal activities that call the agent.

### Key Test Scenarios (for contract validation)
- Can a developer building a Temporal activity understand what data to send to the AI agent?
- Can an AI developer understand what data format their agent will receive and what format it should output?
- If new AG-UI events are defined, can a frontend developer understand the payload to handle these AI-specific messages?
- Are potential error states or alternative responses from the AI agent considered in the contract?

## Technical Specifications
### Service Interface Design
- **AI Agent Input Data Structure (Conceptual):**
  ```json
  {
    "user_message": "string",
    "user_id": "string",
    "session_id": "string",
    "conversation_history_summary": "string" // Optional, could be complex
    // Potentially other contextual data
  }
  ```
- **AI Agent Output Data Structure (Conceptual):**
  ```json
  {
    "response_type": "text | request_clarification | other_command",
    "payload": {
      // Structure varies based on response_type
      // For "text": { "text_content": "string" }
      // For "request_clarification": { "clarification_prompt": "string" }
    }
  }
  ```
- **AG-UI Events (Example `ai:text_response` BE -> FE):**
  - Payload: `{ "message_id": "string", "text": "string", "attribution": "AI Tutor" }` (aligns with `chat:new_message` but with AI attribution).

### Implementation Guidance
- Document contracts in Markdown with clear JSON schema examples.
- Focus on the initial, simple text-based interactions. Rich component driving will come in EPIC-003.
- Ensure the contracts are extensible for future AI capabilities.
- Consider how the AI agent's response type will be used by the calling Temporal activity to decide further actions (e.g., send to user via AG-UI, or update workflow state).

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/1` (Basic Chat API and AG-UI Event Contracts) - this task extends those.
- **Contract Dependencies**: Relies on the established "Basic chat AG-UI events" from `EPIC-001/1` as a baseline for how messages are sent to the user.
- **Parallel Work Opportunities**: Enables `EPIC-002_TASK_2` (AI Framework Setup), `EPIC-002_TASK_3` (Simple AI Agent Dev), and frontend work to handle new AI-specific AG-UI events (if any).
- **Mock Requirements**: These contracts will be used to create mock AI agent responses for testing Temporal activities, and mock AG-UI events for frontend development.
- **Integration Points**: This contract defines the interface for Temporal activities calling the AI agent, and for AI-driven messages sent to the frontend.

## Definition of Done
- [ ] AI Agent input data structure contract is complete, reviewed, and stored.
- [ ] AI Agent output data structure contract is complete, reviewed, and stored.
- [ ] Any new AG-UI event contracts for AI interaction are complete, reviewed, and stored.
- [ ] All contracts approved by relevant team members.
- [ ] Location of contract documents is communicated.

## Technical Notes
- Versioning of the AI Agent interface should be considered for future changes.
- Keep the initial contract simple to facilitate rapid progress on the first AI agent integration.
