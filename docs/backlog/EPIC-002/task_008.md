---
task_id: 8
title: "Basic AI Agent Content Delivery (Proof of Concept)"
epic: "EPIC-002"
status: "pending"
priority: "medium"
estimated_hours: 7
dependencies: [3, 7] # Depends on EPIC-002/3 (Simple AI Agent) & EPIC-002/7 (Content Snippets)
parallel_work: []
blocking_dependencies: [3, 7]
contract_dependencies: ["Content data model from EPIC-002_TASK_7", "AI Agent I/O contract from EPIC-002_TASK_1"]
phase: "foundation"
---

# Task Overview
This task enhances the simple AI agent (from Task 2.3) with the ability to retrieve and incorporate a basic learning content snippet (from Task 2.7) into its response. This will be a proof-of-concept for content delivery, likely triggered by a very simple user query or a hardcoded condition within the agent. The goal is to demonstrate the agent's capability to fetch and present stored educational content.

## Business Context
An AI tutor that only chats is not very educational. This task introduces the first instance of the AI agent actively delivering pre-defined learning content, moving it closer to its role as a tutor. This demonstrates a core value proposition: providing relevant information to the user based on their (implied or explicit) needs.

## Acceptance Criteria
- [ ] The AI agent (`TutorAgent` or equivalent in `app/agents/tutor_agent.py`) is modified.
- [ ] Agent includes logic to fetch a learning content snippet using the CRUD functions from `EPIC-002_TASK_7` (e.g., `crud.get_snippets_by_topic`).
  - [ ] The trigger for fetching content can be simple (e.g., if user input contains "teach me about X", try to find topic "X").
- [ ] The fetched content snippet's text is incorporated into the prompt sent to the LLM, or appended to the LLM's response.
- [ ] The agent's final response to the user (via its standard output contract) includes this retrieved content.
- [ ] If content for a requested topic is not found, the agent responds gracefully (e.g., "I don't have information on that specific topic yet.").
- [ ] Unit tests for the agent are updated to cover this new content delivery logic, mocking the CRUD functions and LLM calls.

## Service Layer TDD Approach
### Test Strategy
- **Agent Logic (Unit Tests):**
  - Extend tests for the agent's `process_message` method.
  - Mock the CRUD functions (e.g., `get_snippets_by_topic`) to simulate finding or not finding content.
  - Mock the LLM client/API call.
  - Verify that the agent calls the CRUD function with the correct parameters based on user input.
  - Verify that if content is found, it's used appropriately in the LLM prompt or combined with the LLM response.
  - Verify graceful handling when content is not found.

### Key Test Scenarios
- User input "teach me about Python":
  - (Mocked) `get_snippets_by_topic("Python")` is called.
  - If (mocked) `get_snippets_by_topic` returns a content snippet:
    - The snippet's text is included in the prompt to the (mocked) LLM, OR
    - The snippet's text is part of the agent's final textual response.
  - If (mocked) `get_snippets_by_topic` returns empty/None, the agent responds with a "not found" message.
- Agent still handles general conversation if the trigger for content delivery is not met.

## Technical Specifications
### Service Interface Design
- No new external contracts. This task modifies the internal logic of the AI agent.
- The agent will interact with the CRUD service interface for `LearningContentSnippet` defined in `EPIC-002_TASK_7`.

### Implementation Guidance
- Modify the `TutorAgent.process_message` method.
- Add a simple intent recognition or keyword matching step to identify if the user is asking for specific content (e.g., "tell me about [topic]").
- Call the appropriate CRUD function (e.g., `crud.get_snippets_by_topic`) from `app/db/crud.py`.
- Decide on a strategy for incorporating the content:
  1.  **Pre-LLM:** Include snippet in the prompt to the LLM (e.g., "User asked about X. Here is some info: [snippet]. Explain this.").
  2.  **Post-LLM:** Get a conversational response from LLM, then append the snippet.
  3.  **LLM Summarizes Snippet:** Pass snippet to LLM and ask it to explain/summarize.
  - Strategy 1 or 2 is likely simplest for a PoC.
- Ensure the agent's output still conforms to the `AgentOutputModel` from `EPIC-002_TASK_1`.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-002_TASK_3` (Simple AI Agent), `EPIC-002_TASK_7` (Define Initial Learning Content Snippets & CRUD).
- **Contract Dependencies**: "Content data model" from `EPIC-002_TASK_7` (for understanding snippet structure), "AI Agent I/O contract" from `EPIC-002_TASK_1` (for agent's overall input/output).
- **Parallel Work Opportunities**: None directly for this implementation task.
- **Mock Requirements**: CRUD functions for content snippets and LLM API calls must be mocked for unit tests.
- **Integration Points**: This enhanced agent, when called by the Temporal activity (from Task 2.4), will now produce responses that can include fetched content.

## Definition of Done
- [ ] AI agent can retrieve content snippets based on simple triggers.
- [ ] Retrieved content is included in the agent's response to the user.
- [ ] Agent handles cases where content is not found.
- [ ] Unit tests for the new content delivery logic pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- This is a Proof of Concept. The trigger mechanism and content integration strategy will be very basic.
- More sophisticated content retrieval (e.g., semantic search, RAG) and dialogue management around content are for future epics.
- The focus is on demonstrating the flow: User Request -> Agent -> CRUD -> Content -> Agent -> LLM (optional for content part) -> User.
