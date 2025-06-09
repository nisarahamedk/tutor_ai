---
task_id: 6
title: "Develop Additional Rich Component (e.g., Interactive Card or SkillSelectorButton)"
epic: "EPIC-003"
status: "pending"
priority: "medium"
estimated_hours: 7
dependencies: ["EPIC-001/2", 1] # Depends on FE Project Setup and EPIC-003/1 (Rich Component Contracts)
parallel_work: []
blocking_dependencies: ["EPIC-001/2", 1] # Hard dependency on FE setup and defined contracts for this component type
contract_dependencies: ["Rich Component AG-UI Contracts from EPIC-003_TASK_1"] # For this specific component's config and interaction
phase: "core"
---

# Task Overview
This task involves designing and implementing another distinct rich React component, following the patterns established in Task 3.2. Examples could be an "Interactive Card" for displaying mixed media (text, images, buttons), a "SkillSelectorButton" group for users to pick areas of interest, or a "SliderInput". The component will be based on the PRD and its specific AG-UI event contract defined or refined in `EPIC-003_TASK_1`.

## Business Context
Expanding the library of rich components increases the versatility and engagement potential of the ITS. Different types of interactions and information displays cater to diverse learning needs and content types, making the platform more effective and appealing.

## Acceptance Criteria
- [ ] One additional rich React component (e.g., `InteractiveCard.tsx` or `SkillSelectorButton.tsx`) is implemented.
- [ ] The component's props interface allows for dynamic configuration based on its specific contract from `EPIC-003_TASK_1`.
- [ ] The component correctly renders its UI based on the provided props.
- [ ] The component captures relevant user interactions (if any, e.g., button click on a card, skill selection).
- [ ] The component emits an event (e.g., via `onInteraction` callback) with interaction data, structured according to its AG-UI contract from `EPIC-003_TASK_1` (including `interaction_id`).
- [ ] The component is styled for a clean and intuitive user experience.
- [ ] Unit tests (React Testing Library) are written for the component.
- [ ] The component is demonstrated in Storybook or a test page.

## Service Layer TDD Approach
### Test Strategy
- **React Component Testing (React Testing Library):**
  - Test rendering with various props configurations specific to this new component type.
  - Simulate user interactions relevant to this component (e.g., clicking a button within an InteractiveCard, selecting a skill).
  - Verify the `onInteraction` callback is triggered with correctly structured data, including the `interaction_id`.

### Key Test Scenarios (Example for `SkillSelectorButton`)
- Given props for a label and a list of skills (each with id, name), the component renders the label and a button for each skill.
- When a user clicks a skill button, the `onInteraction` callback is triggered.
- The `onInteraction` callback receives an object containing the `interaction_id` and the `selected_skill_id`.
- Component correctly highlights the selected skill or provides visual feedback.

## Technical Specifications
### Service Interface Design
- **Component Props (Example for `SkillSelectorButton`):**
  ```typescript
  interface Skill {
    id: string;
    name: string;
  }

  interface SkillSelectorButtonProps {
    interactionId: string;
    label: string;
    skills: Skill[];
    onInteraction: (interactionData: { interactionId: string; componentType: "SkillSelectorButton"; userInput: { selectedSkillId: string } }) => void;
    // Potentially: alreadySelectedSkillId
  }
  ```
- The `onInteraction` callback's payload structure must match this component's specific AG-UI event contract (FE -> BE) defined in `EPIC-003_TASK_1`.

### Implementation Guidance
- Follow patterns from `EPIC-003_TASK_2` for component structure, props, and event emission.
- Ensure the component is self-contained and reusable.
- Use `shadcn/ui` primitives as appropriate.
- Store in `frontend/src/features/ai-tutor/components/rich/` or a shared library.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/2` (Frontend Project Setup), `EPIC-003_TASK_1` (Define AG-UI Event Contracts for Rich Components - specifically, the contract for *this* new component type must be defined).
- **Contract Dependencies**: "Rich Component AG-UI Contracts" from `EPIC-003_TASK_1` that pertain to this specific component.
- **Parallel Work Opportunities**: Can be developed in parallel with other components or backend logic, provided its specific contract in `EPIC-003_TASK_1` is finalized.
- **Mock Requirements**: Mock data (props) matching this component's contract for isolated development and testing.
- **Integration Points**: This component will be dynamically rendered by the main chat UI (Task 3.3) when instructed by the backend.

## Definition of Done
- [ ] The additional rich component is fully implemented and functional.
- [ ] Component is correctly configured by props and emits interaction data as per its contract.
- [ ] Component is styled and user-friendly.
- [ ] Unit tests pass with good coverage.
- [ ] Component is demonstrated (Storybook or test page).
- [ ] Code is reviewed and merged.

## Technical Notes
- Choose a component type that offers a different kind of interactivity than the one(s) built in Task 3.2 to broaden the platform's capabilities.
- If the component is complex, ensure the 7-hour estimate is feasible or adjust scope.
