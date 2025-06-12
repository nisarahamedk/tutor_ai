# Current Behavior Documentation - AI Tutor Components

This document outlines key behaviors, observed functionalities, and limitations of the AI Tutor components as identified during the initial testing phase (pre-refactoring).

## 1. `AITutorChat` (`features/ai-tutor/AITutorChat.tsx`)

-   **Core Functionalities**:
    -   **Tab Management**: Manages four primary tabs: "Home", "Progress", "Review", and "Explore". Each tab has an initial set of messages and can render specific child components. Message history is maintained per tab for tabs with chat inputs.
    -   **Messaging**: Allows users to send text messages. It simulates an AI response (currently a generic echo or simple logic based on keywords like "help", "review"). Includes a loading indicator ("AI is thinking...") during simulated API calls. Handles basic error states for message sending with an automatic retry mechanism.
    -   **Interaction Flows**: Orchestrates complex user workflows by conditionally rendering different child components within its message area based on user actions or state changes. This includes:
        -   **New Track Onboarding**: `HomePageComponent` -> `TrackExplorationComponent` -> `SkillAssessmentComponent` -> `LearningPreferencesComponent` -> `InteractiveLessonComponent`.
        -   Direct navigation to `ProgressDashboardComponent` (Progress tab) or `FlashcardReviewComponent` (Review tab/actions).
-   **Child Component Integration**:
    -   Dynamically renders child components like `HomePageComponent`, `TrackExplorationComponent`, etc., often passing callback functions to them to drive state changes within `AITutorChat`.
    -   The initial state of each tab usually involves rendering a specific child component (e.g., `HomePageComponent` on the "Home" tab).
-   **State Management**: Manages a significant amount of state, including messages per tab, the active tab, loading states, error states, and various states related to the different learning/interaction flows.

## 2. Child Components (`components/ai-tutor/`)

### `HomePageComponent.tsx`

-   **Discrepancy**: **Crucially, the current `HomePageComponent.tsx` is a placeholder, only rendering `<h1>Home Page</h1>`. This contrasts sharply with its expected functionality as implied by `AITutorChat.tsx` and its unit tests (`AITutorChat.test.tsx`), which assume it's a functional component that accepts and uses props like `onStartNewTrack`, `onContinueLearning`, and `onStartReview` to render interactive buttons.** The integration tests and `AITutorChat` itself rely on these props being handled by `HomePageComponent` for core workflow initiation.

### `TrackExplorationComponent.tsx`

-   **Data Source**: Displays a list of learning tracks based on **internal, hardcoded data**. It does not currently accept tracks as props.
-   **Display Logic**: For each track, it shows title, description, icon, difficulty, duration, and a list of skills.
-   **Skills Display**: Shows the first 3 skills as badges. If a track has more than 3 skills, it displays a "+X more" badge.
-   **Interaction**: Clicking on a track card triggers the `onTrackSelect` callback prop with the data of the selected track.

### `ProgressDashboardComponent.tsx`

-   **Data Source**: Displays learning tracks and achievements based on **internal, hardcoded data**.
-   **Track Display**: Shows track name, progress percentage (with a visual progress bar), status (active, paused, planned with color indicators), time spent, and the next lesson.
-   **Achievements Display**: Lists recent achievements with text, icons, and dates.
-   **Interaction**: Clicking a track card calls `onSelectTrack`. A "Continue Learning" button calls `onContinueLearning`.

### `FlashcardReviewComponent.tsx`

-   **Data Source**: Uses an **internal, hardcoded array of flashcards**.
-   **Testability Limitation**: The hardcoded internal data makes it difficult to test scenarios like an empty flashcard list or behavior with varied/complex flashcard content without modifying the component's source code (e.g., to accept flashcards as props).
-   **Review Flow**:
    -   Displays one flashcard at a time, initially showing the question.
    -   Shows current card number and total (e.g., "1 of 3").
    -   A progress bar indicates the percentage of cards reviewed.
    -   "Show Answer" button reveals the answer.
    -   Once the answer is shown, "Hard", "Medium", "Easy" buttons appear. Clicking any of these advances to the next card or calls `onComplete` if all cards are reviewed.
-   **Empty State Logic**: Contains logic to display a "No flashcards available" message if its internal `flashcards` array were empty.

### `SkillAssessmentComponent.tsx`

-   **Data Source**: Initializes with an **internal, hardcoded list of skills** and their default levels.
-   **Skill Level Adjustment**: Users can adjust the level (1-5) for each skill using a slider. The corresponding textual description of the level (Beginner, Some Experience, etc.) updates dynamically.
-   **Interaction**: A "Continue Assessment" button calls the `onComplete` callback prop with an array of all skills and their current levels.

### `InteractiveLessonComponent.tsx`

-   **Data Source**: Uses an **internal, hardcoded `steps` array** (currently with only one defined step for "JavaScript Functions").
    -   Displays step title, content, and a specific task.
-   **Code Editor**: Provides a textarea for users to input code, pre-filled with a template.
-   **Interaction**:
    -   "Run Code" button: Simulates running code via `mockApi.runCode` and `alert`s the output/error.
    -   "Submit" button: Simulates submitting code via `mockApi.submitCode` (with a hardcoded `lessonId`) and `alert`s feedback. If the API mock indicates correctness, an additional success alert is shown.
-   **Multi-Step Design**: The component is structured for multi-step lessons (using `currentStep` state), but this functionality is not fully implemented as only one step is defined and navigation logic is placeholder.
-   **Static Progress/Count**: Displays a hardcoded "Lesson 1 of 5" badge and calculates progress based on a hardcoded total of 5 steps.

### `LearningPreferencesComponent.tsx`

-   **Data Source**: Uses internal hardcoded arrays for learning style options and goal options.
-   **Preference Selection**:
    -   **Time Availability**: User selects hours per week via a slider (default 10 hours). The selected value is displayed.
    -   **Learning Style**: User selects one style from a list of cards (e.g., Visual, Hands-on). Selection is visually indicated.
    -   **Goals**: User selects one or more goals from a list of buttons. Selection is visually indicated (button variant changes). Goals can be toggled.
-   **Interaction**:
    -   The "Start My Learning Journey" button is disabled until a learning style AND at least one goal are selected.
    -   Clicking the enabled submit button calls the `onComplete` callback prop with an object containing `timeAvailability`, `learningStyle` (ID), and an array of selected `goals`.

## Other Observations

-   **Styling & UI Libraries**: Components heavily rely on `shadcn/ui` (Button, Card, Badge, Progress, Slider) and `lucide-react` for icons. Tailwind CSS is used for styling.
-   **Motion**: `framer-motion` is used for animations, though these are generally not covered in functional tests.
-   **Mock API**: Some components (e.g., `InteractiveLessonComponent`) use a `mockApi` for simulating backend interactions. This is helpful for UI testing but means actual API integration is not yet tested.
-   **Error Handling**: Basic error display (e.g., in `AITutorChat` for message sending) exists but is not comprehensive across all components for all possible failure modes.
-   **Accessibility**: Basic ARIA attributes are present in some places (e.g., roles on buttons, sliders), but a full accessibility audit would be needed. Labels for form-like elements are generally present. Some clickable `div`s acting as buttons or selection items could be more semantic (e.g., using `role="button"` or actual `<button>` elements).
