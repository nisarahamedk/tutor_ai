---
task_id: 8
title: "Store and Retrieve User Progress in Learning Tracks (Supabase & Temporal)"
epic: "EPIC-004"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: [1, 3] # Depends on EPIC-004/1 (Data Models) & EPIC-004/3 (LearningPathWorkflow)
parallel_work: ["EPIC-004_TASK_7"] # FE progress display relies on this
blocking_dependencies: [1, 3]
contract_dependencies: ["User Progress data model from EPIC-004_TASK_1"]
phase: "core"
---

# Task Overview
This task focuses on implementing the backend logic to store and retrieve `UserProgress` data in Supabase. This will be primarily orchestrated by the `LearningPathWorkflow` (defined in `EPIC-004_TASK_3`), which will call Temporal activities to perform CRUD operations on the `user_progress` table (and potentially related tables like assessment scores). This task also includes creating or exposing API endpoints or service functions for the frontend to fetch this progress data (needed by `EPIC-004_TASK_7`).

## Business Context
Persisting user progress is fundamental for any learning system that aims to be adaptive or track completion over time. This allows users to leave and return to their learning, see what they've accomplished, and enables the system to make informed decisions about what to present next. It's critical for personalization and for providing users with a continuous learning experience.

## Acceptance Criteria
- [ ] CRUD functions for `UserProgress` are implemented in `app/db/crud.py` (extending from stubs if any).
  - `create_user_progress(progress_data: UserProgressCreate) -> UserProgress`
  - `get_user_progress(user_id: UUID, track_id: UUID) -> UserProgress | None`
  - `update_user_progress(user_id: UUID, track_id: UUID, progress_update_data: UserProgressUpdate) -> UserProgress | None` (Pydantic `UserProgressUpdate` model needed)
  - `delete_user_progress(user_id: UUID, track_id: UUID) -> bool` (less common, but for completeness)
- [ ] A new Temporal activity (e.g., `update_user_progress_activity`) is implemented in `app/temporal/activities.py`.
  - This activity takes `UserProgressUpdate` data (or specific fields like `current_unit_id`, `completed_unit_ids_add`, `new_assessment_result`) and calls the relevant CRUD functions.
- [ ] The `LearningPathWorkflow` is updated to call `update_user_progress_activity` at appropriate times:
  - When a track is started (to create initial progress entry).
  - When a unit is completed.
  - When an assessment/interaction provides a score or result.
  - When a track is completed.
- [ ] An API endpoint (e.g., `GET /api/v1/users/{user_id}/progress/{track_id}`) is created for the frontend to fetch `UserProgress` data. This endpoint will use the CRUD functions.
- [ ] Unit tests for `UserProgress` CRUD functions and the new Temporal activity are written and pass.
- [ ] Integration test for the API endpoint fetching user progress.

## Service Layer TDD Approach
### Test Strategy
- **CRUD Functions (`app/db/crud.py` for `UserProgress`):**
  - Unit test each CRUD function, mocking Supabase client. Verify correct Supabase calls and data parsing.
- **Temporal Activity (`update_user_progress_activity`):**
  - Unit test the activity, mocking the `UserProgress` CRUD functions it calls. Verify it calls them with correct data.
- **`LearningPathWorkflow`:**
  - Extend workflow tests (from `EPIC-004_TASK_3`) to verify it calls `update_user_progress_activity` (mocked) with the correct progress data at the right stages (e.g., after a unit completion signal).
- **API Endpoint (for fetching progress):**
  - Integration test the endpoint. Mock authentication. Verify it calls the `get_user_progress` CRUD function and returns data in the expected format.

### Key Test Scenarios
- **`UserProgress` CRUD:** Similar to other CRUD tests (create, get, update, delete, handle not found).
- **`update_user_progress_activity`:** Given data like "add unit_X to completed_units", it calls `crud.update_user_progress` correctly.
- **`LearningPathWorkflow`:** When a (mocked) unit completion signal arrives, the workflow calls (mocked) `update_user_progress_activity` with data indicating the unit is complete and what the new current unit is.
- **API Endpoint:** `GET /api/v1/users/some_user/progress/some_track` returns correct (mocked) `UserProgress` data or 404 if none.

## Technical Specifications
### Service Interface Design
- **Pydantic Models (`app/db/models.py`):** `UserProgressCreate`, `UserProgressUpdate` (allowing partial updates like appending to `completed_unit_ids` or updating `assessment_results` sub-fields).
- **CRUD Signatures (`app/db/crud.py`):** As in Acceptance Criteria.
- **Activity Signature (`app/temporal/activities.py`):**
  ```python
  @activity.defn
  async def update_user_progress(user_id: str, track_id: str, updates: dict) -> UserProgress:
      # 'updates' could be a UserProgressUpdate model or a dict for flexibility
      # Calls crud.update_user_progress or crud.create_user_progress
      pass
  ```
- **API Endpoint (`app/api/v1/endpoints/progress.py` - new file):**
  - `GET /users/{user_id}/tracks/{track_id}/progress` (protected, ensure requesting user can only get their own progress or if admin).

### Implementation Guidance
- Implement `UserProgress` CRUD functions in `app/db/crud.py`. Pay attention to how to update specific fields like arrays (`completed_unit_ids`) or JSONB (`assessment_results`) in Supabase.
- Implement the `update_user_progress_activity`, ensuring it's robust.
- Integrate calls to this activity within `LearningPathWorkflow` at logical points (start_track, unit_complete, assessment_complete, track_complete).
- Create the new API endpoint for fetching progress, ensuring it's authenticated and authorized appropriately.
- The activity should handle both creating the initial `UserProgress` record (e.g., when a track is first started) and updating existing ones.

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-004_TASK_1` (Define Data Models for Learning Tracks & User Progress).
  - `EPIC-004_TASK_3` (Design and Implement `LearningPathWorkflow` - this workflow will call the activity).
- **Contract Dependencies**: "User Progress data model" from `EPIC-004_TASK_1`.
- **Parallel Work Opportunities**: `EPIC-004_TASK_7` (Frontend Display of Progress) can start development using a mocked version of the API endpoint defined in this task.
- **Mock Requirements**: Supabase client (for CRUD tests), CRUD functions (for activity tests), `update_user_progress_activity` (for workflow tests).
- **Integration Points**: This is a critical integration point. The `LearningPathWorkflow` *writes* progress via this task's activity/CRUD. The frontend (`EPIC-004_TASK_7`) *reads* progress via this task's API endpoint/CRUD. The AI Agent (`EPIC-004_TASK_4` and `EPIC-004_TASK_5`) *uses* progress data to make decisions.

## Definition of Done
- [ ] CRUD functions for `UserProgress` are implemented and tested.
- [ ] `update_user_progress_activity` is implemented and tested.
- [ ] `LearningPathWorkflow` correctly calls the activity to update progress.
- [ ] API endpoint for frontend to fetch user progress is implemented and tested.
- [ ] Code is reviewed and merged.

## Technical Notes
- Updating arrays or JSONB fields in Supabase using the Python client requires specific syntax (e.g., for appending to arrays or updating nested JSON keys). Research this for `crud.update_user_progress`.
- Ensure data consistency. For example, `current_unit_id` should always be a valid unit in the track, and units in `completed_unit_ids` should also be valid.
- The API endpoint for fetching progress should be secured so users can only fetch their own progress, unless an admin role is implemented.
