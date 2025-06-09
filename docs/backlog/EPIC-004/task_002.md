---
task_id: 2
title: "Implement CRUD Operations for Learning Tracks & Units"
epic: "EPIC-004"
status: "pending"
priority: "high"
estimated_hours: 7
dependencies: [1] # Depends on EPIC-004/1 (Learning Track Data Models)
parallel_work: ["EPIC-004_TASK_6"] # FE track discovery can use these CRUD ops (or mocked versions)
blocking_dependencies: [1]
contract_dependencies: ["Learning Track & Unit data models from EPIC-004_TASK_1"]
phase: "core"
---

# Task Overview
This task involves developing the backend CRUD (Create, Read, Update, Delete) operations in `app/db/crud.py` for managing Learning Tracks and their constituent Learning Units. These operations will interact with the Supabase database based on the Pydantic models and schemas defined in `EPIC-004_TASK_1`. These CRUD functions are essential for адміністративні tasks (like content creation, not built here) and for the system to retrieve learning path information.

## Business Context
While the full admin interface for creating learning tracks is not part of this epic, the underlying CRUD operations are necessary for the system to function. They allow developers or scripts to populate initial learning content and enable other services (like the AI agent or frontend) to fetch track and unit details, which is fundamental for displaying and navigating learning paths.

## Acceptance Criteria
- [ ] CRUD functions are implemented in `app/db/crud.py` for `LearningTrack`:
  - `create_learning_track(track_data: LearningTrackCreate) -> LearningTrack`
  - `get_learning_track(track_id: UUID) -> LearningTrack | None`
  - `get_all_learning_tracks() -> list[LearningTrack]`
  - `update_learning_track(track_id: UUID, track_update_data: LearningTrackUpdate) -> LearningTrack | None` (Pydantic model `LearningTrackUpdate` needed)
  - `delete_learning_track(track_id: UUID) -> bool`
- [ ] CRUD functions are implemented in `app/db/crud.py` for `LearningUnit`:
  - `create_learning_unit(unit_data: LearningUnitCreate) -> LearningUnit`
  - `get_learning_unit(unit_id: UUID) -> LearningUnit | None`
  - `get_learning_units_for_track(track_id: UUID) -> list[LearningUnit]` (may involve fetching units based on `unit_ids` in `LearningTrack` model or querying an association table)
  - `update_learning_unit(unit_id: UUID, unit_update_data: LearningUnitUpdate) -> LearningUnit | None` (Pydantic model `LearningUnitUpdate` needed)
  - `delete_learning_unit(unit_id: UUID) -> bool`
- [ ] Pydantic models for update operations (e.g., `LearningTrackUpdate`, `LearningUnitUpdate`, allowing partial updates) are defined.
- [ ] Unit tests for all CRUD functions are written and pass, mocking the Supabase client.
- [ ] Functions handle cases like "not found" for get/update/delete operations appropriately.

## Service Layer TDD Approach
### Test Strategy
- **CRUD Functions (`app/db/crud.py`):**
  - Unit test each CRUD function individually.
  - Mock the Supabase client instance.
  - Verify that each function makes the correct calls to the (mocked) Supabase client (e.g., correct table name, correct `insert` data, correct `select` filters, correct `update` payload, correct `delete` conditions).
  - Verify that functions correctly parse the (mocked) Supabase client's return data into Pydantic models.
  - Test edge cases: creating items with missing optional fields, getting/updating/deleting non-existent items.

### Key Test Scenarios
- **`create_learning_track`:** Given `LearningTrackCreate` data, it calls Supabase `insert` and returns a complete `LearningTrack` object.
- **`get_learning_track`:** Returns a `LearningTrack` if Supabase returns data, `None` otherwise.
- **`get_all_learning_tracks`:** Returns a list of `LearningTrack` objects.
- **`update_learning_track`:** Calls Supabase `update` with correct data and ID; returns updated `LearningTrack` or `None` if not found.
- **`delete_learning_track`:** Calls Supabase `delete` with correct ID; returns `True` on (mocked) success, `False` if not found.
- Similar tests for all `LearningUnit` CRUD functions.
- **`get_learning_units_for_track`:** Correctly fetches units based on the track's `unit_ids` list or by querying the association table.

## Technical Specifications
### Service Interface Design
- **CRUD Function Signatures:** As listed in Acceptance Criteria.
- **Pydantic Update Models (e.g., `app/db/models.py`):**
  ```python
  class LearningTrackUpdate(BaseModel):
      title: Optional[str] = None
      description: Optional[str] = None
      unit_ids: Optional[list[uuid.UUID]] = None
      # other fields that can be updated

  class LearningUnitUpdate(BaseModel):
      title: Optional[str] = None
      unit_type: Optional[str] = None
      content_config: Optional[dict] = None
      estimated_duration_minutes: Optional[int] = None
      # other fields
  ```

### Implementation Guidance
- Implement these functions within `app/db/crud.py`.
- Use the Supabase Python client for database interactions.
- Ensure Pydantic models are used for request data validation (for create/update) and for serializing response data.
- The `get_learning_units_for_track` function will need to be implemented based on the chosen strategy for linking units to tracks in `EPIC-004_TASK_1` (e.g., if `unit_ids` is an array in `learning_tracks`, this might involve a query like `select().in_('id', track.unit_ids)` on the `learning_units` table).
- Handle potential database errors gracefully (e.g., log them, raise custom exceptions if needed, though basic CRUD might just let Supabase errors propagate for now).

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-004_TASK_1` (Define Data Models for Learning Tracks & User Progress).
- **Contract Dependencies**: "Learning Track & Unit data models" from `EPIC-004_TASK_1`.
- **Parallel Work Opportunities**:
  - `EPIC-004_TASK_6` (Frontend UI for Learning Track Discovery) can use these CRUD operations (or their mocked equivalents) to fetch data for display.
  - Backend services that need to populate or manage tracks (e.g., an admin tool, if one were being built) would use these.
- **Mock Requirements**: Supabase client must be mocked for unit tests.
- **Integration Points**: These CRUD functions will be used by:
  - Potentially an admin interface (future) or scripts for content population.
  - The application itself when fetching track/unit details for display or processing (e.g., by `LearningPathWorkflow` or AI agent).

## Definition of Done
- [ ] All specified CRUD functions for `LearningTrack` and `LearningUnit` are implemented.
- [ ] Pydantic `Update` models are defined.
- [ ] Unit tests for all CRUD functions pass with good coverage.
- [ ] Functions correctly handle "not found" and other common scenarios.
- [ ] Code is reviewed and merged.

## Technical Notes
- Consider transactional integrity if multiple operations need to be atomic (e.g., when creating a track and its units simultaneously - though this might be handled at a service layer above these basic CRUD ops). For now, individual CRUD is fine.
- These functions provide the lowest level of data access. Higher-level services might combine these calls for more complex operations.
- Ensure consistency in return types (e.g., always return the Pydantic model on create/update, or `None`/`bool` as appropriate).
