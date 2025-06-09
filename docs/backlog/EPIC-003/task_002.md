---
task_id: 2
title: "Develop Reusable React Rich Component Library (Initial Set)"
epic: "EPIC-003"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-001/2"] # Depends on FE Project Setup
parallel_work: ["EPIC-003_TASK_4", "EPIC-003_TASK_6"]
blocking_dependencies: ["EPIC-001/2"] # Hard dependency on FE setup
contract_dependencies: ["Rich Component AG-UI Contracts from EPIC-003_TASK_1"] # Critical for props and event emission
phase: "core"
---

# Task Overview
This task focuses on the design and implementation of an initial set of 2-3 core, reusable rich interactive React components. Examples include a Multiple Choice Question (MCQ) component and a Skill Slider. These components will be developed based on the PRD's requirements and the AG-UI event contracts defined in `EPIC-003_TASK_1`. They should be designed to be dynamically configurable via props and to emit events for user interactions. This task covers one such component, assuming 8 hours per complex component or two simpler ones. Let's target one complex component like MCQ.

## Business Context
Rich interactive components are key to making the ITS engaging and effective. A well-crafted library of these components allows for diverse learning activities directly within the chat interface, improving user experience and learning outcomes. This task delivers the first of these interactive elements.

## Acceptance Criteria
- [ ] At least one core rich React component (e.g., `MultipleChoiceQuestion.tsx`) is implemented in `frontend/src/features/ai-tutor/components/rich/` (or a shared component library).
- [ ] The component's props interface allows for dynamic configuration (e.g., question text, options for MCQ) based on the contract from `EPIC-003_TASK_1`.
- [ ] The component correctly renders its UI based on the provided props.
- [ ] The component captures relevant user interactions (e.g., selecting an MCQ option).
- [ ] The component emits an event (e.g., via a callback prop) with the interaction data, structured according to the AG-UI contract for user interactions from `EPIC-003_TASK_1` (including `interaction_id`).
- [ ] The component is styled for a clean and intuitive user experience using Tailwind CSS and shadcn/ui primitives where appropriate.
- [ ] Unit tests (e.g., using React Testing Library) are written for the component, covering rendering with different props and simulated user interactions.
- [ ] The component is demonstrated in a Storybook (if project uses it) or a simple test page.

## Service Layer TDD Approach
### Test Strategy
- **React Component Testing (React Testing Library):**
  - Test that the component renders correctly given various sets of props (e.g., different number of MCQ options, different question text).
  - Simulate user interactions (e.g., clicking an option in an MCQ).
  - Verify that the component calls the appropriate callback prop (`onInteraction`) with the correctly structured data (matching the FE->BE AG-UI contract) when a user interacts with it.
  - Test accessibility aspects if possible (e.g., keyboard navigation for MCQ).

### Key Test Scenarios (for MCQ component example)
- Given props for a question and 3 options, the component renders the question text and 3 selectable options.
- When a user clicks on an option, the `onInteraction` callback is triggered.
- The `onInteraction` callback receives an object containing the `interaction_id` (passed in via props) and the `selected_option_id`.
- If an option is already selected, clicking another option updates the selection and triggers the callback.
- Component renders correctly with varying lengths of question text and option text.

## Technical Specifications
### Service Interface Design
- **Component Props (Example for `MultipleChoiceQuestion`):**
  ```typescript
  interface MCQOption {
    id: string;
    text: string;
  }

  interface MultipleChoiceQuestionProps {
    interactionId: string; // Received from BE, to be sent back with interaction
    questionText: string;
    options: MCQOption[];
    onInteraction: (interactionData: { interactionId: string; componentType: "MultipleChoiceQuestion"; userInput: { selectedOptionId: string } }) => void;
    // Potentially: selectedOptionId (if component needs to be controlled), disabled state, etc.
  }
  ```
- The `onInteraction` callback's payload structure must match the AG-UI event contract defined in `EPIC-003_TASK_1` for FE -> BE communication.

### Implementation Guidance
- Develop components in isolation if possible, perhaps using Storybook or a dedicated test page for development and demonstration.
- Ensure components are reusable and configurable.
- Follow React best practices for state management within components (e.g., `useState` for selection state in MCQ).
- Emit interaction data via a prop callback function (e.g., `onInteraction`). The parent component or service (`agUiService.ts`) will be responsible for sending this data over AG-UI.
- Use `shadcn/ui` components (e.g., Button, RadioGroup, Label) as building blocks where appropriate to maintain UI consistency.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/2` (Frontend Project Setup).
- **Contract Dependencies**: Strongly depends on "Rich Component AG-UI Contracts" from `EPIC-003_TASK_1` for defining the component's props (configuration received from BE) and the structure of data it emits upon user interaction. Visual design can start, but full implementation requires these contracts.
- **Parallel Work Opportunities**: Can be developed in parallel with `EPIC-003_TASK_4` (AI Agent Logic for Rich Components) and `EPIC-003_TASK_6` (another rich component), once `EPIC-003_TASK_1` is defined.
- **Mock Requirements**: Mock data (props) matching the defined contracts will be needed for developing and testing the component in isolation (e.g., in Storybook).
- **Integration Points**: This component will be dynamically rendered by the main chat UI based on instructions from the AG-UI service (Task 3.3). Its emitted interaction data will be handled by the AG-UI service and sent to the backend.

## Definition of Done
- [ ] At least one rich component (e.g., MCQ) is fully implemented and functional.
- [ ] Component correctly configured by props and emits interaction data as per contracts.
- [ ] Component is styled and user-friendly.
- [ ] Unit tests pass with good coverage.
- [ ] Component is demonstrated (Storybook or test page).
- [ ] Code is reviewed and merged.

## Technical Notes
- Consider accessibility (ARIA attributes, keyboard navigation) during component development.
- This task might be split if developing multiple complex components simultaneously, or if one component proves to be more than 8 hours of work. The estimate here is for one such component.
- Focus on a single component first to establish patterns for the library.
