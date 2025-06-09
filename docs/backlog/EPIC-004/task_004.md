---
task_id: 4
title: "AI Agent Logic for Guiding Users Through Learning Tracks"
epic: "EPIC-004"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-002/3", 3] # Depends on Simple AI Agent & EPIC-004/3 (LearningPathWorkflow)
parallel_work: ["EPIC-004_TASK_5"] # Adaptive logic can be built upon this guidance framework
blocking_dependencies: ["EPIC-002/3", 3]
contract_dependencies: ["Learning Track & Unit data models from EPIC-004_TASK_1", "User Progress data model from EPIC-004_TASK_1", "AI Agent I/O contract from EPIC-002_TASK_1"]
phase: "core"
---

# Task Overview
This task enhances the AI agent (`TutorAgent`) to understand the concept of a learning track and a user's progress within it. The agent will be called by the `LearningPathWorkflow` (via activities) at various points (e.g., before starting a unit, after completing a unit, after a component interaction). The agent's role will be to provide context-specific guidance, introductions to topics, encouragement, or remediation suggestions based on the user's current position and performance in the learning track.

## Business Context
An AI tutor that can guide users through a structured learning path, offering timely advice and explanations, significantly enhances the learning experience. This task makes the AI agent a proactive guide in the learning journey, rather than just a reactive respondent or component configurer. This is central to the "tutoring" aspect of the ITS.

## Acceptance Criteria
- [ ] AI agent (`TutorAgent` in `app/agents/tutor_agent.py`) is modified to accept new types of input or context related to learning tracks and user progress (e.g., current `track_id`, `unit_id`, `user_progress_summary`).
- [ ] Agent implements logic to generate introductory explanations for learning units.
- [ ] Agent implements logic to provide encouragement or next-step guidance when a unit is completed.
- [ ] Agent can receive user interaction data from a component (via the workflow) and provide basic feedback or remediation suggestions. (This builds on `EPIC-003_TASK_7` but now in context of a learning path).
- [ ] Agent's responses are tailored based on the user's current context within the `LearningPathWorkflow`.
- [ ] Unit tests for the agent are updated to cover this new guidance logic, mocking LLM calls and any data fetching.

## Service Layer TDD Approach
### Test Strategy
- **Agent Logic (Unit Tests):**
  - Extend tests for the agent's main processing method or add new methods for specific guidance scenarios.
  - Provide mock input data representing different states within a learning path (e.g., "starting unit X", "just completed unit Y with outcome Z", "user answered MCQ on unit A incorrectly").
  - Mock LLM calls.
  - Verify the agent generates appropriate textual guidance, component requests (if any), or other actions based on the learning path context.

### Key Test Scenarios
- Given context "starting unit 'Introduction to Python Functions'": Agent generates a brief textual introduction to the topic.
- Given context "completed unit 'Python Functions Quiz' with score 80%": Agent provides positive feedback and suggests moving to the next unit.
- Given context "user answered MCQ on 'Python Loops' incorrectly, interaction_id_ABC": Agent provides a targeted hint or re-explanation related to Python Loops (potentially by requesting a content snippet or another component).
- Agent's output (text or component request) is appropriate for the given learning path state.

## Technical Specifications
### Service Interface Design
- **Agent Input Model (`AgentInputModel` or a specialized version for workflow interactions):**
  - Will need to carry context from the `LearningPathWorkflow`, such as:
    ```json
    {
      // from basic chat:
      "user_message": "string" // (if applicable, might be empty if agent is invoked by workflow event)
      "user_id": "string",
      "session_id": "string",
      // new context from LearningPathWorkflow:
      "learning_path_context": {
        "track_id": "string",
        "current_unit_id": "string",
        "current_unit_title": "string",
        "current_unit_type": "string", // e.g., "content_snippet", "mcq_component"
        "user_progress_on_track": { /* subset of UserProgress model */ },
        "last_interaction_result": { /* if applicable, e.g. from an MCQ */ }
      }
    }
    ```
  The Temporal activity calling the agent will be responsible for assembling this input.
- **Agent Output Model (`AgentOutputModel`):** Will be standard text or `requested_component` as defined previously.

### Implementation Guidance
- Modify `TutorAgent.process_message` or add specialized methods like `get_guidance_for_learning_path_event`.
- The agent will need to interpret the `learning_path_context`.
- Logic can be a combination of:
  - Rule-based responses for certain events (e.g., generic encouragement).
  - LLM-driven responses for generating explanations or tailored feedback (e.g., "User is on unit X of track Y. Their last quiz score was Z. Provide a brief motivating message and introduce unit X which is about [unit_X_topic].").
- The agent might request to re-present a content snippet or a different component based on user performance.

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-002_TASK_3` (Simple AI Agent foundation).
  - `EPIC-004_TASK_3` (Design and Implement `LearningPathWorkflow` - the workflow needs to be defined to know what context it will provide to the agent).
- **Contract Dependencies**:
  - `LearningTrack`, `LearningUnit`, `UserProgress` data models from `EPIC-004_TASK_1` (for understanding the context).
  - The agent's own "AI Agent I/O contract" from `EPIC-002_TASK_1` (which this task extends for input).
- **Parallel Work Opportunities**: `EPIC-004_TASK_5` (Basic Adaptive Logic) can be developed in conjunction, as this guidance logic forms a part of the adaptive behavior.
- **Mock Requirements**: Mock `LearningPathWorkflow` context data. Mock LLM calls. Mock `UserProgress` data.
- **Integration Points**: This enhanced agent logic is invoked by activities within `LearningPathWorkflow`. Its output (text or component requests) is then relayed to the user via AG-UI by the workflow/backend.

## Definition of Done
- [ ] AI agent can process context from `LearningPathWorkflow`.
- [ ] Agent generates relevant introductions, feedback, or guidance based on this context.
- [ ] Agent can tailor responses based on (mocked) user progress or interaction results.
- [ ] Unit tests for the new guidance logic pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- This task significantly increases the "tutor" aspect of the AI agent.
- The richness of the `learning_path_context` provided to the agent will determine the quality of its guidance.
- Start with simpler guidance logic and make it more sophisticated (e.g., more LLM-dependent) iteratively.
- Consider how the agent might initiate different types of follow-up actions (e.g., just send text, request a specific content snippet, request a new interactive component).
