---
task_id: 1
title: "Develop Comprehensive Unit Tests for Backend Services & Agents"
epic: "EPIC-005"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-004/8"] # Depends on completion of core features from EPIC-004
parallel_work: ["EPIC-005_TASK_2", "EPIC-005_TASK_3"]
blocking_dependencies: ["EPIC-004/8"] # Assumes features are mostly complete to be tested
contract_dependencies: ["Service interfaces from EPIC-001 to EPIC-004", "Agent I/O contracts"]
phase: "polish"
---

# Task Overview
This task focuses on retrospectively ensuring comprehensive unit test coverage for key backend services and critical AI agent logic developed throughout previous epics (EPIC-001 to EPIC-004). While individual tasks should have included some unit tests, this task is dedicated to reviewing existing tests, identifying gaps, and adding more tests to cover business logic, service interactions, and edge cases. The focus is on service-layer TDD principles: testing logic, not trivial code.

## Business Context
Robust unit testing is essential for maintaining code quality, preventing regressions, and enabling confident refactoring. As the system grows, a strong unit test suite ensures that new changes don't break existing functionality, leading to a more stable and reliable application. This is crucial before broader integration testing and deployment.

## Acceptance Criteria
- [ ] Review existing unit tests for backend services (e.g., in `app/services/`, `app/db/crud.py`), AI agents (`app/agents/`), and Temporal activities (`app/temporal/activities.py`).
- [ ] Identify areas with low test coverage or critical logic not adequately tested.
- [ ] Write new unit tests to achieve a target coverage level (e.g., 80% line or branch coverage for key modules, though quality of tests is more important than raw percentage).
- [ ] Tests should focus on:
  - Business logic within service functions.
  - Correct handling of different inputs and parameters.
  - Mocking external dependencies (database, other services, LLMs) correctly.
  - Verification of outputs and side effects (e.g., calls to mocked dependencies).
  - Edge cases and error handling.
- [ ] All new and existing unit tests pass consistently in the CI pipeline.
- [ ] (Optional) Test coverage reports are generated and reviewed.

## Service Layer TDD Approach
### Test Strategy
- Adhere to service-layer TDD: focus tests on application logic and use cases, not trivial getters/setters or basic validation already handled by frameworks like Pydantic.
- Ensure mocks are used effectively to isolate the unit under test.
- For AI agents, test decision-making logic and how inputs are processed to generate prompts or structured outputs, mocking the actual LLM calls.
- For Temporal activities, test their core logic, mocking any client calls they make to external services or other activities/workflows.

### Key Test Scenarios
- **Chat Service:** Test logic for message processing, user context handling (if any beyond basic CRUD).
- **Learning Path Service (if any high-level service exists beyond CRUD):** Test logic for managing track progression rules if not solely in Temporal.
- **AI Agent:**
  - Test prompt generation logic based on various inputs.
  - Test parsing of (mocked) LLM responses.
  - Test logic for selecting/configuring rich components based on (mocked) context.
  - Test guidance logic within learning paths based on (mocked) progress.
- **Temporal Activities:**
  - Test activities that call Supabase CRUD, ensuring they pass correct data.
  - Test activities that call AI agents, ensuring correct parameter passing and handling of agent output.
- **CRUD functions:** Ensure thorough testing of all CRUD operations for all major data models (users, messages, tracks, units, progress), covering create, read, update, delete, and list scenarios, including "not found" and error conditions.

### Implementation Guidance
- Use `pytest` as the testing framework.
- Use `unittest.mock` (or `pytest-mock`) for creating mocks and spies.
- Organize tests in the `tests/unit/` directory, mirroring the application structure (e.g., `tests/unit/services/`, `tests/unit/agents/`).
- Aim for clear, descriptive test names that explain what they are testing.
- Ensure tests are independent and can be run in any order.
- Refactor existing tests if they are brittle or hard to understand.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-004/8` (or substantial completion of features in EPICs 1-4) as the code needs to exist to be tested.
- **Contract Dependencies**: Relies on the defined service interfaces, Pydantic models, and AI agent I/O contracts from previous epics.
- **Parallel Work Opportunities**: Can be done in parallel with `EPIC-005_TASK_2` (Integration Tests) and `EPIC-005_TASK_3` (E2E Tests), though unit tests often form the foundation.
- **Mock Requirements**: Extensive use of mocks for external dependencies (Supabase client, LLM APIs, other services).
- **Integration Points**: This task doesn't integrate new components but rather solidifies existing ones by improving their test coverage.

## Definition of Done
- [ ] Unit test coverage for key backend modules is reviewed and improved.
- [ ] New unit tests are added for previously untested critical logic and edge cases.
- [ ] All unit tests pass reliably.
- [ ] (Optional) Test coverage report shows improvement in targeted areas.
- [ ] Code (new/updated tests) is reviewed and merged.

## Technical Notes
- While aiming for high coverage is good, prioritize testing complex logic, critical paths, and areas prone to bugs over achieving a simple percentage for trivial code.
- Ensure that tests clean up any state they create if they interact with a real (test) database, though unit tests should primarily use mocks.
- This task might uncover bugs or areas needing refactoring in the application code, which is a positive outcome.
