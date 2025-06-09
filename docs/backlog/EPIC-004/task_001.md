---
task_id: 1
title: "Define Data Models for Learning Tracks & User Progress"
epic: "EPIC-004"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-001/4"] # Depends on Supabase Setup
parallel_work: ["EPIC-004_TASK_3", "EPIC-004_TASK_6"] # Workflow design and FE discovery can start based on these models
blocking_dependencies: ["EPIC-001/4"]
contract_dependencies: [] # This task *creates* these data model contracts
phase: "core"
---

# Task Overview
This foundational task for EPIC-004 involves designing and defining the database schemas (for Supabase) and corresponding Pydantic models (for backend use) that will represent Learning Tracks, their constituent Learning Units (which can be content or interactive components), and User Progress within these tracks. These models are critical for structuring personalized learning journeys.

## Business Context
To provide personalized and adaptive learning, the system needs a clear way to define learning paths and track how users progress through them. Well-defined data models for tracks, units, and progress enable the system to store, manage, and reason about learning sequences, user achievements, and areas needing more focus. This is the bedrock of the personalization features.

## Acceptance Criteria
- [ ] Pydantic models are defined in `app/db/models.py` for:
  - `LearningTrack`: e.g., `id`, `title`, `description`, `target_audience`, `ordered_unit_ids_list`.
  - `LearningUnit`: e.g., `id`, `title`, `unit_type` ("content_snippet", "mcq_component", "slider_component", "external_link"), `content_reference_id` (FK to content snippet or component config ID), `estimated_duration_minutes`.
  - `UserProgress`: e.g., `id`, `user_id` (FK), `track_id` (FK), `current_unit_id` (FK), `completed_unit_ids_list`, `assessment_scores` (JSONB or separate table), `last_accessed_at`.
- [ ] Supabase database table schemas are defined and implemented for:
  - `learning_tracks`
  - `learning_units` (potentially with a way to link units to tracks, e.g., through an association table or an array of unit IDs in tracks)
  - `user_progress`
- [ ] Relationships between tables are clearly defined (e.g., FK constraints).
- [ ] SQL migration scripts (if using Supabase local dev/migrations) or Studio configurations for these schemas are created and version controlled.
- [ ] Initial thoughts on indexing for performance are considered (e.g., indexing `user_id` and `track_id` in `user_progress`).

## Service Layer TDD Approach
### Test Strategy
- **Pydantic Models:** Validation is inherent. Testing involves ensuring they can be instantiated and correctly (de)serialize example data.
- **Schema Design:** "Testing" involves peer review against requirements and ensuring the schema can support the planned queries and data relationships. For example, can we easily query all units for a track, or a user's progress on a specific track?

### Key Test Scenarios (for schema validation through conceptual queries)
- Can the schema represent a learning track with an ordered sequence of diverse learning units?
- Can a user's progress (which unit they are on, which ones they've completed in a track) be clearly stored and retrieved?
- Can assessment results (e.g., from MCQs) be associated with a user's progress on a specific unit or track?
- How are `LearningUnit`s linked to their actual content (e.g., a specific content snippet from `learning_content_snippets` table, or a configuration for a rich component that needs to be invoked)? This linkage needs to be clear in the `LearningUnit` model.

## Technical Specifications
### Service Interface Design
- **Pydantic Models (`app/db/models.py` - examples):**
  ```python
  # LearningUnit
  class LearningUnitBase(BaseModel):
      title: str
      unit_type: str # e.g., 'content_snippet', 'mcq_component', 'article_link'
      # Reference to actual content. Could be a FK to another table,
      # or a JSON object with config for a component if not stored elsewhere.
      # For simplicity, let's assume a generic reference for now.
      content_config: dict | None = None # e.g. for MCQ: {question:, options:}, for snippet: {snippet_id:}
      estimated_duration_minutes: int | None = None

  class LearningUnitCreate(LearningUnitBase):
      pass

  class LearningUnit(LearningUnitBase):
      id: uuid.UUID

  # LearningTrack
  class LearningTrackBase(BaseModel):
      title: str
      description: str | None = None
      # For simplicity, an array of LearningUnit objects or their IDs in order.
      # A separate association table (track_units) might be more robust for ordering and metadata.
      unit_ids: list[uuid.UUID] # Ordered list of LearningUnit IDs

  class LearningTrackCreate(LearningTrackBase):
      pass

  class LearningTrack(LearningTrackBase):
      id: uuid.UUID

  # UserProgress
  class UserProgressBase(BaseModel):
      user_id: uuid.UUID
      track_id: uuid.UUID
      current_unit_id: uuid.UUID | None = None # Current unit the user is on
      completed_unit_ids: list[uuid.UUID] = []
      # For assessment scores, a JSONB field or a separate table might be better.
      # Example: scores = {"unit_id_1": {"score": 80, "attempts": 1}}
      assessment_results: dict[str, Any] = {}
      status: str = "not_started" # e.g., not_started, in_progress, completed

  class UserProgressCreate(UserProgressBase):
      pass

  class UserProgress(UserProgressBase):
      id: uuid.UUID
      started_at: datetime | None = None
      last_accessed_at: datetime | None = None
      completed_at: datetime | None = None
  ```
- **Supabase Tables:** Corresponding tables for `learning_tracks`, `learning_units`, and `user_progress`. An association table `track_learning_units` (`track_id`, `unit_id`, `sequence_order`) might be better for ordering units within a track than an array of IDs.

### Implementation Guidance
- Design `LearningUnit.content_reference_id` carefully. It needs to point to either a specific `learning_content_snippet.id` or provide enough information for the system to know which rich component to render with what specific configuration (if component configurations are not stored centrally). A flexible approach might use a JSONB field in `LearningUnit` for `component_config`.
- For `LearningTrack`, an ordered list of unit IDs is crucial. PostgreSQL arrays can work, but a junction table (`track_units`) is often more flexible for adding metadata to the relationship (like sequence number).
- `UserProgress.assessment_scores` could be a JSONB field for simplicity or a separate `user_assessment_attempts` table for more detailed tracking.
- Use Supabase Studio for initial design, then script with CLI migrations.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/4` (Supabase Setup).
- **Contract Dependencies**: None. This task *defines* these critical data models.
- **Parallel Work Opportunities**:
  - `EPIC-004_TASK_2` (CRUD for these models) can start once models are defined.
  - `EPIC-004_TASK_3` (LearningPathWorkflow design) can begin as it will manage state based on these models.
  - `EPIC-004_TASK_6` (Frontend UI for track discovery) can be designed based on how tracks and units are structured.
- **Mock Requirements**: Not for definition, but for testing CRUD operations (Task 4.2), these models will be used to create mock data.
- **Integration Points**: These models will be used by CRUD operations, Temporal workflows, AI agent logic for personalization, and frontend displays related to learning paths.

## Definition of Done
- [ ] Pydantic models for `LearningTrack`, `LearningUnit`, and `UserProgress` are defined and reviewed.
- [ ] Corresponding Supabase table schemas are implemented, including relationships.
- [ ] Schema migration scripts are created and version controlled.
- [ ] Design choices for representing ordered units and content references are documented.

## Technical Notes
- The structure of `LearningUnit` and how it references actual content (text snippets vs. component configurations) is a key design decision. A `unit_type` field and a flexible `config` or `reference_id` field would be good.
- Consider how content authors or admins would create and sequence these learning tracks and units (though the actual admin interface is out of scope for this task). The schema should support this.
- Normalization vs. denormalization: For example, storing `completed_unit_ids` as an array in `user_progress` is denormalized but might be efficient for reads. A separate `user_completed_units` table is more normalized. Choose based on expected query patterns and complexity.
