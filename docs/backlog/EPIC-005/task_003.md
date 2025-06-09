---
task_id: 3
title: "Develop Basic End-to-End (E2E) Tests for Core User Journeys"
epic: "EPIC-005"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-004/7", "EPIC-004/8", 2] # Depends on FE/BE features from EPIC-004, and EPIC-005/2 (Integration Tests)
parallel_work: ["EPIC-005_TASK_1", "EPIC-005_TASK_2"]
blocking_dependencies: ["EPIC-004/7", "EPIC-004/8"] # Requires a fully integrated system (FE+BE)
contract_dependencies: ["UI element selectors", "API responses from prior epics"]
phase: "polish"
---

# Task Overview
This task involves implementing a few key End-to-End (E2E) tests using a framework like Playwright or Cypress. These tests will simulate real user interactions from the frontend (browser) through to the backend services and back to the frontend. The goal is to verify that core user journeys are functioning correctly across the entire application stack. Examples include user login, sending a chat message and receiving an AI response, and starting a learning path.

## Business Context
E2E tests provide the highest level of confidence that the entire system is working as expected from a user's perspective. They catch issues that might only arise from the interaction of frontend and backend components in a live-like environment. Successful E2E tests for core journeys are a critical quality gate before deployment.

## Acceptance Criteria
- [ ] A suitable E2E testing framework (e.g., Playwright or Cypress) is chosen and set up for the project.
- [ ] At least 2-3 core user journeys are covered by E2E tests. Examples:
  1.  **Login & Basic Chat:** User logs in -> navigates to chat -> sends a message -> receives a (mocked or simple actual) AI response displayed in UI.
  2.  **Start Learning Path:** User logs in -> navigates to learning path discovery -> selects and starts a track -> sees the first unit or track overview.
- [ ] Tests interact with the application through the browser, simulating user actions (clicks, typing).
- [ ] Tests assert that expected UI changes occur (e.g., new messages appear, navigation to new pages, correct content displayed).
- [ ] Tests run against a deployed instance of the application (frontend and backend) in a stable test/staging environment.
- [ ] E2E tests are integrated into the CI/CD pipeline (e.g., run on a schedule or before deployment to production), if feasible.

## Service Layer TDD Approach
### Test Strategy
- E2E tests are black-box tests focusing on user-observable behavior. They do not directly test service layers but validate their integrated functionality through the UI.
- Test scripts should be robust to minor UI changes (e.g., using stable selectors like `data-testid`).
- Focus on verifying complete flows rather than isolated UI elements (which are better covered by component tests).

### Key Test Scenarios
- **Login Journey:**
  - Navigate to login page.
  - Enter valid test user credentials.
  - Click login button.
  - Verify successful navigation to a post-login page (e.g., chat dashboard).
  - Verify user-specific element (e.g., username display) is present.
- **Chat Interaction Journey:**
  - (After login) Navigate to chat interface.
  - Type a message into the input field and submit.
  - Verify the sent message appears in the chat display.
  - Verify an AI response (even if simple or mocked at a deeper level) appears in the chat display within a reasonable time.
- **Start Learning Path Journey:**
  - (After login) Navigate to the learning paths page.
  - Select a specific learning track from the list.
  - Click a "Start Track" button.
  - Verify navigation to the track's starting unit or overview page.
  - Verify some initial content or UI elements for that track are displayed.

## Technical Specifications
### Service Interface Design
- Tests interact with the application as a user would, through the UI. No direct interaction with backend service interfaces, but they rely on those APIs functioning correctly.

### Implementation Guidance
- **Framework Setup:** Install and configure Playwright/Cypress, including browser drivers.
- **Test Scripts:** Write test scripts in TypeScript/JavaScript.
- **Selectors:** Use robust selectors for UI elements (e.g., `data-testid`, ARIA labels, stable class names). Avoid highly brittle selectors based on generated class names or complex XPath.
- **Test Environment:** E2E tests need a running instance of both frontend and backend, connected to a test database and other necessary services (like a test Temporal server). This might be a dedicated staging environment or a docker-compose setup that includes all services.
- **Authentication:** Devise a strategy for logging in test users (e.g., programmatic login via API call if framework supports it, or UI login with test credentials).
- **Data Seeding:** Some E2E tests might require specific data to be present in the database (e.g., a known learning track). Plan for how to seed this data in the test environment.
- **CI Integration:** Running E2E tests in CI can be complex due to environment setup. Start with local runs and plan for CI integration. Tools like BrowserStack or Sauce Labs can be used for cross-browser testing in CI if needed (more advanced).

### Dependencies and Prerequisites
- **Blocking Dependencies**:
  - `EPIC-004/7` and `EPIC-004/8` (or substantial completion of the features to be tested across frontend and backend).
  - A stable, deployed test/staging environment where the full application can run.
  - `EPIC-005_TASK_2` (Integration Tests) should ideally be in good shape, as E2E tests are more expensive to run and debug.
- **Contract Dependencies**: Relies on the rendered UI accurately reflecting backend data and API responses.
- **Parallel Work Opportunities**: Can be developed in parallel with final backend polish tasks, once the core features are stable in a test environment.
- **Mock Requirements**: For E2E tests, the goal is to mock as little as possible. However, very external services (e.g., actual payment processing, live third-party LLM with variability) might still be mocked at their boundaries if they make tests flaky or expensive. For the AI response in chat, it could be a very simple, deterministic AI or even a canned response for E2E stability.
- **Integration Points**: These tests validate the integration of the entire stack: Frontend UI ↔ Frontend Logic ↔ AG-UI ↔ Backend API ↔ Backend Services ↔ Temporal ↔ Database.

## Definition of Done
- [ ] E2E testing framework is set up.
- [ ] At least 2-3 core user journeys are covered by E2E tests.
- [ ] Tests run reliably against a test/staging environment.
- [ ] Test results are clear and actionable (easy to see what failed).
- [ ] (Optional initial, preferred later) E2E tests are integrated into CI.
- [ ] Code (test scripts, framework config) is reviewed and merged.

## Technical Notes
- E2E tests are powerful but can be brittle and slow. Write them for the most critical user flows.
- Good selector strategy is key to maintainable E2E tests.
- Consider page object models or similar patterns to organize test code.
- Debugging E2E tests often involves inspecting browser state, network requests, and console logs. Frameworks usually provide tools for this.
