---
task_id: 3
title: "Design and Implement `LearningPathWorkflow` in Temporal"
epic: "EPIC-004"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-001/7", 1] # Depends on Temporal Setup and EPIC-004/1 (Data Models)
parallel_work: ["EPIC-004_TASK_4"] # AI logic for guiding tracks can be designed alongside workflow
blocking_dependencies: ["EPIC-001/7", 1]
contract_dependencies: ["Learning Track & Unit data models from EPIC-004_TASK_1", "User Progress data model from EPIC-004_TASK_1"]
phase: "core"
---

# Task Overview
This task involves designing and implementing a new, more complex Temporal workflow named `LearningPathWorkflow`. This stateful workflow will manage a user's progression through an entire learning track (defined in `EPIC-004_TASK_1`). It will orchestrate various learning activities (like presenting content snippets, invoking rich components for quizzes/assessments), track the user's state over potentially long durations (days or weeks), and interact with the AI agent (via activities) for personalized guidance and adaptation.

## Business Context
The `LearningPathWorkflow` is the engine that drives personalized, multi-step learning journeys. It moves beyond single-session chat interactions (`ChatSessionWorkflow`) to manage a user's entire experience within a specific learning track. This is fundamental for delivering structured, adaptive learning and tracking long-term progress.

## Acceptance Criteria
- [ ] `LearningPathWorkflow` is defined in `app/temporal/workflows.py`.
  - [ ] Workflow interface accepts parameters like `user_id` and `track_id`.
- [ ] Workflow logic can iterate through the units of a given `LearningTrack` (fetched via an activity).
- [ ] For each unit, the workflow determines the type of activity:
  - If content snippet: an activity is called to fetch content and potentially instruct AI to present it (or directly signal AG-UI).
  - If interactive component (e.g., MCQ): an activity is called to instruct AI to configure and request rendering of this component (similar to EPIC-003 logic, but now orchestrated by this workflow).
- [ ] Workflow can receive signals regarding user interactions with components or completion of units (e.g., `user_completed_unit_signal(unit_id, outcome)`).
- [ ] Workflow updates `UserProgress` (via an activity using CRUD from `EPIC-004_TASK_8` - this task will define stubs/needs for that activity).
- [ ] Workflow can be started successfully and its basic progression (e.g., moving from one unit to the next upon completion signal) can be observed.
- [ ] Unit tests for the workflow are written, mocking activities.

## Service Layer TDD Approach
### Test Strategy
- **Temporal Workflow (`LearningPathWorkflow`):**
  - Use `temporaltest.WorkflowEnvironment` for testing.
  - Mock all activities called by the workflow (e.g., fetching track details, fetching unit content, calling AI agent, updating user progress).
  - Test workflow initialization with `user_id` and `track_id`.
  - Test the main loop of iterating through learning units.
  - Simulate signals (e.g., `user_completed_unit_signal`) and verify the workflow transitions to the next unit or completes the track.
  - Test how the workflow determines which activity to call based on `LearningUnit.unit_type`.
  - Verify it calls activities with correct parameters.

### Key Test Scenarios
- Workflow starts, fetches (mocked) track details and its first unit.
- If first unit is "content_snippet", workflow calls (mocked) `present_content_activity`.
- Workflow receives (mocked) `user_completed_unit_signal` for the first unit.
- Workflow progresses to the second unit. If it's an "mcq_component", it calls (mocked) `present_mcq_activity`.
- Workflow receives completion signal for all units and completes successfully.
- Workflow correctly calls (mocked) `update_user_progress_activity` at various stages (e.g., starting track, completing unit, completing track).

## Technical Specifications
### Service Interface Design
- **Workflow Interface (`LearningPathWorkflow` in `app/temporal/workflows.py`):**
  ```python
  @workflow.defn
  class LearningPathWorkflow:
      async def run(self, user_id: str, track_id: str):
          # ... workflow logic ...

      @workflow.signal
      async def user_completed_unit(self, unit_id: str, outcome: dict | None):
          # ... handle signal ...

      @workflow.signal
      async def user_interacted_with_component(self, interaction_id: str, interaction_data: dict):
          # ... handle signal from component interaction ...

      @workflow.query
      def get_status(self) -> dict:
          # ... return current progress/status ...
  ```
- **Activities to be called by this workflow (defined in `app/temporal/activities.py`, stubs initially):**
  - `fetch_track_details_activity(track_id: str) -> LearningTrack`
  - `fetch_unit_content_activity(unit: LearningUnit) -> ActualContent` (where ActualContent varies)
  - `call_ai_for_component_config_activity(unit: LearningUnit, user_context: dict) -> AgentOutputModel` (AI provides component config)
  - `update_user_progress_activity(progress_data: UserProgressUpdate) -> None` (interacts with CRUD from `EPIC-004_TASK_8`)
  - `call_ai_for_guidance_activity(user_id: str, track_id: str, current_progress: UserProgress) -> AgentOutputModel`

### Implementation Guidance
- The workflow will be the main orchestrator for a learning track.
- It will fetch track data using an activity that calls CRUD functions from `EPIC-004_TASK_2`.
- It will loop through `LearningUnit`s:
    - For a content unit, it might call an activity that tells the AI agent (or another service) to present this content.
    - For an interactive unit (like an MCQ), it will call an activity that gets the AI agent to configure the component (similar to `EPIC-003_TASK_4` but now the workflow is triggering it for a specific unit). This configuration is then sent to the frontend (similar to `EPIC-003_TASK_5`).
- The workflow will wait for signals indicating user interaction/completion (e.g., `user_interacted_with_component` or `user_completed_unit`).
- Upon completion/interaction, it will call an activity to update `UserProgress` in the database.
- The workflow will also call activities to get AI guidance/feedback at appropriate points.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/7` (Basic Temporal Setup), `EPIC-004_TASK_1` (Data Models for Learning Tracks, Units, and Progress).
- **Contract Dependencies**: `LearningTrack`, `LearningUnit`, and `UserProgress` data models from `EPIC-004_TASK_1`. It will also eventually use AI Agent contracts and Rich Component contracts when orchestrating those activities.
- **Parallel Work Opportunities**:
  - `EPIC-004_TASK_4` (AI Agent Logic for Guiding Users Through Learning Tracks) can be developed in parallel, as this workflow will be calling that agent logic via activities.
  - Activities that this workflow will call (e.g., for fetching content, updating progress) can be stubbed out first and then implemented.
- **Mock Requirements**: All activities called by the workflow must be mocked for workflow unit tests. This includes data fetching, AI calls, and DB updates.
- **Integration Points**: This workflow integrates data models, AI agent capabilities, rich component interactions, and user progress tracking into a cohesive learning experience. It will be initiated by a user action (e.g., selecting a track).

## Definition of Done
- [ ] `LearningPathWorkflow` class structure is defined.
- [ ] Workflow can fetch (mocked) track and unit details.
- [ ] Workflow can loop through units and call (mocked) activities based on unit type.
- [ ] Workflow defines and handles signals for unit completion/interaction.
- [ ] Workflow calls (mocked) activity to update user progress.
- [ ] Basic workflow unit tests (mocking all activities) pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- This is a complex, long-running workflow. Careful state management and error handling are crucial.
- Consider using child workflows for complex units if necessary, though perhaps not for the initial implementation.
- The interaction between `ChatSessionWorkflow` and `LearningPathWorkflow` needs consideration. Does `ChatSessionWorkflow` trigger `LearningPathWorkflow`? Or are they largely independent? (Likely, starting a learning path would be an action that could initiate a `LearningPathWorkflow`).
- This task focuses on the workflow structure and orchestration. Full implementation of all activities it calls will span other tasks.
