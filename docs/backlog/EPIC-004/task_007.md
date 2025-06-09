---
task_id: 7
title: "Frontend Display of Progress Within Learning Tracks"
epic: "EPIC-004"
status: "pending"
priority: "medium"
estimated_hours: 6
dependencies: [6, 8] # Depends on EPIC-004/6 (Track Navigation UI) & EPIC-004/8 (BE Progress Data)
parallel_work: []
blocking_dependencies: [6, 8] # Needs UI structure and data source
contract_dependencies: ["User Progress data model from EPIC-004_TASK_1"]
phase: "core"
---

# Task Overview
This task involves implementing UI elements on the frontend to visually represent the user's progress within a selected or active learning track. This could include highlighting completed units, indicating the current unit, showing a percentage completion bar, or displaying scores from assessments taken within the track.

## Business Context
Visual feedback on progress is a key motivator for learners and helps them understand where they are in their learning journey. Clear progress indicators can increase user engagement, encourage completion of tracks, and provide a sense of accomplishment.

## Acceptance Criteria
- [ ] The learning track detail UI (from `EPIC-004_TASK_6`) is enhanced to display user progress.
- [ ] UI elements are implemented to visually distinguish:
  - Completed learning units.
  - The current learning unit.
  - Pending/upcoming learning units.
- [ ] A progress bar or percentage completion indicator for the overall track may be implemented.
- [ ] If assessment scores are part of `UserProgress`, these are displayed appropriately (e.g., next to the relevant unit or in a summary section).
- [ ] Frontend fetches `UserProgress` data from a backend API (endpoint to be defined/implemented in conjunction with `EPIC-004_TASK_8`).
- [ ] Unit tests for the new UI components are written.

## Service Layer TDD Approach
### Test Strategy
- **React Components (React Testing Library):**
  - Test components responsible for displaying progress (e.g., modified `UnitListItem.tsx`, new `TrackProgressBar.tsx`).
  - Mock the service/API call that fetches `UserProgress` data.
  - Verify correct rendering based on various mocked `UserProgress` states (e.g., no progress, 50% units completed, specific scores).
- **Frontend Service/API Client (for fetching progress):**
  - Unit test the service function that calls the backend API to get `UserProgress` data. Mock the HTTP client.

### Key Test Scenarios
- **Unit List Display:**
  - Given mocked `UserProgress` where 2 of 5 units are complete and unit 3 is current:
    - Units 1 & 2 are styled as "completed".
    - Unit 3 is styled as "current".
    - Units 4 & 5 are styled as "pending".
- **Progress Bar (if implemented):**
  - Given 2 of 4 units completed, progress bar shows 50%.
- **Score Display (if implemented):**
  - If `UserProgress` includes a score for a completed quiz unit, that score is displayed next to the unit.

## Technical Specifications
### Service Interface Design
- **Frontend API Client/Service (`userProgressService.ts` - new or extended):**
  - `async function getUserProgressForTrack(trackId: string): Promise<UserProgress | null>` (calls backend API)
- **UI Components (extensions of those in `EPIC-004_TASK_6` or new ones):**
  - `UnitListItem.tsx` might take a `status: 'completed' | 'current' | 'pending'` prop.
  - `TrackProgressBar.tsx` (new component).
- Relies on `UserProgress` data model from `EPIC-004_TASK_1`.

### Implementation Guidance
- Modify existing components from `EPIC-004_TASK_6` (like `LearningTrackDetailView.tsx` and `UnitListItem.tsx`) to incorporate progress display.
- Add new components if needed (e.g., for a progress bar).
- The frontend will need to call a new backend API endpoint to fetch `UserProgress` for a given user and track. This API will be built as part of `EPIC-004_TASK_8`.
- Use conditional styling (e.g., different CSS classes based on unit status) to visually indicate progress.
- Ensure the UI updates dynamically if progress changes (though real-time updates might be more advanced, fetching on view load is a start).

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-004_TASK_6` (Frontend UI for Learning Track Discovery and Navigation) - provides the base UI to enhance.
  - `EPIC-004_TASK_8` (Store and Retrieve User Progress in Learning Tracks) - backend must provide the API to fetch progress data. This task can start with mocked data if the API isn't ready.
- **Contract Dependencies**: "User Progress data model" from `EPIC-004_TASK_1`.
- **Parallel Work Opportunities**: Can be developed against a mocked `UserProgress` API endpoint while `EPIC-004_TASK_8` is in progress.
- **Mock Requirements**: Mock backend API responses for fetching `UserProgress` data (various scenarios of completion).
- **Integration Points**: This UI integrates with a backend API providing `UserProgress` data. It visually represents data managed by the `LearningPathWorkflow`.

## Definition of Done
- [ ] UI elements for displaying progress on learning units (completed, current, pending) are implemented.
- [ ] Overall track progress (e.g., percentage or bar) is displayed (if in scope).
- [ ] Frontend can fetch and display (mocked or real) `UserProgress` data.
- [ ] Unit tests for progress display components pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Keep the progress display clear and easy to understand at a glance.
- Performance: If a track has many units, ensure the progress calculation and rendering is efficient.
- The initial version might fetch progress when the track detail view is loaded. Real-time updates as the user completes units via AG-UI events would be a future enhancement.
