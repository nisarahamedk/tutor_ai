---
task_id: 6
title: "Frontend UI for Learning Track Discovery and Navigation"
epic: "EPIC-004"
status: "pending"
priority: "medium"
estimated_hours: 7
dependencies: ["EPIC-001/2", 2] # Depends on FE Setup & EPIC-004/2 (CRUD for Tracks/Units)
parallel_work: ["EPIC-004_TASK_7"] # FE progress display can be worked on after this
blocking_dependencies: ["EPIC-001/2", 2]
contract_dependencies: ["Learning Track & Unit data models from EPIC-004_TASK_1 (for display)"]
phase: "core"
---

# Task Overview
This task involves implementing the frontend UI elements that allow users to discover available learning tracks and navigate them. This could include a page or section displaying a list or carousel of learning tracks (as per PRD), with options to view track details and start a track. Users should also be able to see their current position or the next steps within a track they have started.

## Business Context
Making learning tracks easily discoverable and navigable is key to user engagement with structured content. A clear and inviting UI for track selection encourages users to embark on learning journeys and helps them understand the scope and sequence of the educational material available.

## Acceptance Criteria
- [ ] A new UI section/page is created on the frontend for learning track discovery (e.g., `/learning-paths`).
- [ ] This section fetches and displays a list of available `LearningTrack`s from the backend (using an API that leverages CRUD from `EPIC-004_TASK_2`).
  - [ ] Each track in the list shows at least its title and description.
  - [ ] Interactive cards or similar elements from PRD are used for display.
- [ ] Users can click on a track to view more details (e.g., list of units within the track, estimated total duration - details might be on a separate page or an expanded view).
- [ ] A mechanism exists for the user to "start" or "enroll" in a learning track.
  - [ ] This action communicates with the backend to potentially initialize `UserProgress` for that track and start the `LearningPathWorkflow` instance (details of backend action handled in other tasks, FE just needs to trigger it).
- [ ] If a user has already started a track, the UI should indicate this (e.g., "Continue Track" button, progress indicator).
- [ ] Basic navigation elements (e.g., "Next Unit", "Previous Unit" buttons, or a clickable list of units) are present if viewing an active track's details.
- [ ] Unit tests for the new UI components are written.

## Service Layer TDD Approach
### Test Strategy
- **React Components (React Testing Library):**
  - Test components for displaying lists of tracks, individual track details, and navigation elements.
  - Mock the service/API calls that fetch track data.
  - Verify correct rendering based on mocked track data (e.g., correct titles, descriptions, unit lists).
  - Simulate user actions (clicking a track, starting a track, navigating units) and verify that appropriate service calls are made or UI state changes occur.
- **Frontend Service/API Client (for fetching tracks):**
  - Unit test the service functions that call the backend API to get track data. Mock the HTTP client (`fetch` or `axios`).

### Key Test Scenarios
- **Track List Display:**
  - Given a mocked list of 3 learning tracks, the UI renders 3 track cards/items.
  - Each track card displays its title and description.
- **Track Detail Display:**
  - Clicking a track card navigates to a detail view (or expands) showing units for that track.
- **Starting a Track:**
  - Clicking "Start Track" button calls the (mocked) backend service to enroll the user.
- **Navigating an Active Track:**
  - If a track is active, "Next Unit" button is visible (if not on last unit).
  - Clicking "Next Unit" (if UI handles this directly) updates the currently viewed unit or signals the backend.

## Technical Specifications
### Service Interface Design
- **Frontend API Client/Service (`learningPathService.ts` - new or extended):**
  - `async function getAllLearningTracks(): Promise<LearningTrack[]>` (calls backend API)
  - `async function getLearningTrackDetails(trackId: string): Promise<LearningTrackWithUnits>` (calls backend API; `LearningTrackWithUnits` might include full unit objects)
  - `async function startLearningTrack(trackId: string): Promise<UserProgress>` (calls backend API to initiate track for user)
- **UI Components (in `frontend/src/features/ai-tutor/components/learning-paths/` or similar):**
  - `LearningTrackList.tsx`: Displays multiple `LearningTrackCard.tsx` components.
  - `LearningTrackCard.tsx`: Displays summary of one track.
  - `LearningTrackDetailView.tsx`: Displays units and progress for a selected track.
  - `UnitListItem.tsx`: Displays a single unit within the detail view.

### Implementation Guidance
- Create new React components for displaying tracks and units.
- Use `shadcn/ui` components (e.g., Card, Button, Accordion) to build the UI, aligning with PRD.
- Implement service calls to new backend API endpoints (to be created in tandem or mocked) that expose Learning Track data via CRUD operations from `EPIC-004_TASK_2`.
- Manage frontend state related to selected tracks, current unit view, etc., using React state, context, or a state management library.
- The "Start Track" functionality will trigger a backend process (likely starting the `LearningPathWorkflow` and creating a `UserProgress` entry). The exact API endpoint for this needs to be coordinated with backend tasks.

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-001/2` (Frontend Project Setup).
  - `EPIC-004_TASK_2` (Implement CRUD Operations for Learning Tracks & Units) - needed to fetch track data. Backend API endpoints exposing this CRUD will be required for full functionality, or need to be mocked.
- **Contract Dependencies**: "Learning Track & Unit data models" from `EPIC-004_TASK_1` (for structuring display and understanding data from backend).
- **Parallel Work Opportunities**: `EPIC-004_TASK_7` (Frontend Display of Progress) can be started once basic track navigation UI is in place. Can be developed against mocked backend API for tracks/units.
- **Mock Requirements**: Mock backend API responses for fetching learning tracks and units.
- **Integration Points**: This UI integrates with backend APIs that provide learning track data. User actions here (like starting a track) will trigger backend workflows.

## Definition of Done
- [ ] UI for discovering and listing learning tracks is implemented.
- [ ] UI for viewing details of a learning track (including its units) is implemented.
- [ ] User can initiate starting/enrolling in a learning track.
- [ ] Basic navigation for units within an active track is present.
- [ ] Unit tests for key UI components pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Focus on a clear and intuitive user flow for finding and starting tracks.
- The visual design should align with the PRD (interactive cards/carousels).
- How much unit detail to show in the track overview vs. a dedicated unit view needs consideration.
- The interaction for "starting" a track needs to be clearly defined with the backend team (what API call, what response is expected).
