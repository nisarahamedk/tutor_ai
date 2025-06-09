---
task_id: 5
title: "Basic Adaptive Logic: Content Adjustment Based on Performance"
epic: "EPIC-004"
status: "pending"
priority: "medium"
estimated_hours: 8
dependencies: ["EPIC-003/7", 4] # Depends on AI processing component input (EPIC-003) & AI guiding tracks (EPIC-004/4)
parallel_work: []
blocking_dependencies: ["EPIC-003/7", 4]
contract_dependencies: ["User Progress data model from EPIC-004_TASK_1", "Learning Track & Unit models from EPIC-004_TASK_1"]
phase: "core"
---

# Task Overview
This task implements a simple adaptive learning algorithm within the `LearningPathWorkflow` and/or the AI agent. The goal is to make basic adjustments to the learning path or content delivery based on user performance. For example, if a user fails an MCQ related to a learning unit, the system might decide to re-present a prerequisite unit, offer a different explanation of the current unit, or suggest a supplementary resource.

## Business Context
Adaptive learning is a cornerstone of personalized education. Even simple adaptations, like offering remedial content after a failed assessment, can significantly improve learning outcomes by addressing individual student needs in a timely manner. This task introduces the first explicit adaptive behavior into the ITS.

## Acceptance Criteria
- [ ] At least one simple adaptive rule is implemented in the `LearningPathWorkflow` or AI agent.
  - Example rule: If `UserProgress.assessment_results` for a unit's MCQ shows a failing score (e.g., < 60%), the workflow/agent decides to re-offer the original content snippet for that unit, or offer a designated "remedial" snippet if available.
- [ ] The workflow/agent can modify its sequence of activities based on this rule.
  - Example: Instead of moving to next unit, it re-activates presentation of current unit's content or a remedial unit.
- [ ] The `UserProgress` data model (or how it's used) supports storing information needed for this adaptive logic (e.g., assessment scores, number of attempts on a unit).
- [ ] Unit tests for the workflow/agent are updated to cover these adaptive scenarios.

## Service Layer TDD Approach
### Test Strategy
- **Temporal Workflow (`LearningPathWorkflow`) / AI Agent Logic (Unit Tests):**
  - Test the decision-making logic for adaptation.
  - Provide mock `UserProgress` data showing different performance scenarios (e.g., user passed quiz, user failed quiz).
  - Verify that the workflow/agent chooses the correct next step (e.g., proceed to next unit, re-present current unit, offer remedial unit) based on the adaptive rule and the mocked performance data.
  - Mock activities for presenting content or components.

### Key Test Scenarios
- Given `UserProgress` indicating a user failed an MCQ for `unit_A`:
  - The adaptive logic is triggered.
  - The workflow/agent decides to (e.g.) re-execute an activity to present the content for `unit_A` again, or present content for a designated `remedial_unit_for_A`.
- Given `UserProgress` indicating a user passed an MCQ for `unit_A`:
  - The adaptive logic allows normal progression to `unit_B`.
- Test threshold conditions for adaptation (e.g., score >= 60% proceeds, score < 60% triggers adaptation).

## Technical Specifications
### Service Interface Design
- This primarily involves changes to internal logic of the `LearningPathWorkflow` and/or the `TutorAgent`.
- It will consume `UserProgress` data (from `EPIC-004_TASK_1`) and `LearningUnit` definitions (which might include pointers to remedial content or prerequisites).
- **Possible `LearningUnit` extension:**
  ```python
  class LearningUnit(LearningUnitBase):
      id: uuid.UUID
      # ... other fields ...
      remedial_unit_id: uuid.UUID | None = None # ID of a unit to offer if this one is failed
      prerequisite_unit_ids: list[uuid.UUID] = []
  ```

### Implementation Guidance
- **Decision Logic Placement:** The adaptive decision could reside in:
  1.  **`LearningPathWorkflow`:** The workflow itself checks `UserProgress` after an assessment unit and alters its path (e.g., loops back, jumps to a remedial unit activity).
  2.  **AI Agent:** The workflow passes `UserProgress` to the AI agent, and the agent's response dictates the next step (e.g., "User failed, I suggest re-reading this: [snippet_id]" or "User failed, let's try this simpler quiz: [component_config]").
  - A combination is also possible. For simple rule-based adaptation, workflow logic might be cleaner. For more nuanced, LLM-driven adaptation, AI agent is better. Start with simpler workflow-based rules.
- **Content/Activity for Adaptation:**
  - The system needs content or activities to adapt *to*. This might mean:
    - Re-presenting the same unit's content.
    - Having specific "remedial" `LearningUnit`s that are only introduced if a user struggles.
    - The AI agent dynamically generating a simpler explanation or a different type of question. (More advanced).
- Ensure the loop doesn't become infinite (e.g., limit number of retries for a failed unit).

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-003_TASK_7` (AI Agent - Processing User Input from Rich Components) - to get assessment outcomes.
  - `EPIC-004_TASK_4` (AI Agent Logic for Guiding Users Through Learning Tracks) - as the AI is involved in the guidance and potentially in deciding adaptations.
  - `EPIC-004_TASK_8` (Store and Retrieve User Progress) - must be able to save and read assessment outcomes.
- **Contract Dependencies**: `UserProgress` data model (especially `assessment_results`), `LearningTrack` and `LearningUnit` models from `EPIC-004_TASK_1`.
- **Parallel Work Opportunities**: None directly for this internal logic task.
- **Mock Requirements**: Mock `UserProgress` data, assessment outcomes, and activities/agent responses for presenting content/components.
- **Integration Points**: This adaptive logic integrates user performance data (`UserProgress`) with the orchestration logic (`LearningPathWorkflow` and AI Agent) to modify the sequence or type of learning activities presented to the user.

## Definition of Done
- [ ] At least one simple adaptive rule based on user performance is implemented.
- [ ] The `LearningPathWorkflow` and/or AI Agent can alter the learning sequence based on this rule.
- [ ] `UserProgress` data is used to inform adaptive decisions.
- [ ] Unit tests for the adaptive logic pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Start with a very simple, explicit rule. For example: "If MCQ score < 50%, repeat content snippet for the unit. Else, proceed."
- Avoid overly complex rule chains initially.
- The definition of "performance" needs to be clear (e.g., score on a quiz, number of attempts, time taken).
- This is the first step towards more sophisticated personalization algorithms that might consider learning styles, confidence levels, etc., in future epics.
