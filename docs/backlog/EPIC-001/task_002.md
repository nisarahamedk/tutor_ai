---
task_id: 2
title: "Setup Frontend Project (Next.js) & Basic Chat UI Structure"
epic: "EPIC-001"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: []
parallel_work: ["EPIC-001_TASK_1", "EPIC-001_TASK_3", "EPIC-001_TASK_4"]
blocking_dependencies: []
contract_dependencies: [] # Visual structure first, AG-UI contracts from Task 1.1 will be used by Task 1.6
phase: "foundation"
---

# Task Overview
This task involves initializing the Next.js frontend project and establishing the core directory structure. A very basic, non-functional UI for the chat interface (message display area and an input field) will be created. This sets the stage for further frontend development, including component creation and API integration.

## Business Context
A well-structured frontend project is essential for maintainability and scalability. Creating a basic visual representation of the chat interface early, even without functionality, allows stakeholders to visualize the product's core interaction model and provides a tangible starting point for iterative development.

## Acceptance Criteria
- [ ] Next.js project is initialized successfully using the `app/` router.
- [ ] Core frontend directory structure is created:
  - `src/app/` (for layout, pages)
  - `src/components/ui/` (for shadcn/ui components)
  - `src/components/common/` (for any common shared components)
  - `src/features/ai-tutor/components/` (for chat-specific components)
  - `src/features/ai-tutor/services/` (for `agUiService.ts` stub)
  - `src/lib/` (for `ag-ui-client.ts` stub and `utils.ts`)
- [ ] `shadcn/ui` is installed and configured.
- [ ] A basic, static chat page is created (e.g., `src/app/chat/page.tsx` or integrated into `src/app/page.tsx`).
- [ ] The chat page includes:
  - A placeholder area for displaying messages.
  - A static message input field and a send button (non-functional).
- [ ] Basic HTML structure and styling (e.g., Tailwind CSS) are applied for a clean layout.
- [ ] Code is committed to the repository in a new `feature/EPIC-001-frontend-setup` branch.

## Service Layer TDD Approach
### Test Strategy
- For this task, which is primarily about project setup and static UI, service-layer TDD is not the main focus.
- Basic UI component rendering tests (e.g., using React Testing Library) can be considered for the chat page and its static elements to ensure they are displayed.
- E2E tests are not in scope for this task but will be crucial later.

### Key Test Scenarios (for UI rendering)
- Verify the main chat page renders without errors.
- Verify the message display area is present.
- Verify the text input field and send button are present.
- Verify basic layout and styling are applied.

## Technical Specifications
### Service Interface Design
- No direct service interfaces are designed in this task, as it's UI setup.
- Stubs for `ag-ui-client.ts` and `agUiService.ts` will be created but not implemented.
  - `frontend/src/lib/ag-ui-client.ts`: May contain initial setup comments or placeholder for AG-UI core client.
  - `frontend/src/features/ai-tutor/services/agUiService.ts`: Placeholder file for feature-specific AG-UI logic.

### Implementation Guidance
- Follow Next.js best practices for project structure using the `app/` router.
- Utilize Tailwind CSS for styling, configured via `tailwind.config.ts`.
- Create simple, presentational React components for the chat UI elements.
- Do not implement any client-side logic for sending/receiving messages in this task.
- Ensure `components.json` for `shadcn/ui` is correctly configured.
- Refer to `architecture.md` for the target frontend structure.

### Dependencies and Prerequisites
- **Blocking Dependencies**: None. Can start immediately.
- **Contract Dependencies**: None for this initial setup. Subsequent tasks (like Task 1.6) will depend on AG-UI contracts from Task 1.1.
- **Parallel Work Opportunities**: `EPIC-001_TASK_1` (API/AG-UI Contracts), `EPIC-001_TASK_3` (Backend Setup), `EPIC-001_TASK_4` (DB Setup).
- **Mock Requirements**: No mocks needed for this task as it's static UI.
- **Integration Points**: The UI created here will later integrate with `agUiService.ts` (Task 1.6) to connect to the backend.

## Definition of Done
- [ ] Next.js project initialized and directory structure created as specified.
- [ ] `shadcn/ui` installed and configured.
- [ ] Basic static chat UI (message area, input field, button) is implemented.
- [ ] Code is well-organized and follows basic coding standards.
- [ ] Changes are committed to the feature branch and a Pull Request is opened (or ready to be).

## Technical Notes
- Focus on a clean and scalable component structure within `features/ai-tutor/components/`.
- This task provides the foundational playground for all subsequent frontend work.
