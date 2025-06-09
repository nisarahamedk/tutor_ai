---
task_id: 2
title: "Develop Integration Tests for Key Backend Flows"
epic: "EPIC-005"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: ["EPIC-004/8", 1] # Depends on core features (EPIC-004/8) and ideally improved unit tests (EPIC-005/1)
parallel_work: ["EPIC-005_TASK_1", "EPIC-005_TASK_3"]
blocking_dependencies: ["EPIC-004/8"] # Core features must be mostly stable
contract_dependencies: ["API contracts", "AG-UI event contracts", "Service interfaces from prior epics"]
phase: "polish"
---

# Task Overview
This task focuses on creating integration tests that verify interactions between different components of the backend system. Unlike unit tests that mock dependencies, integration tests will use live (but test-scoped) instances of services like Supabase (for database) and a local Temporal worker/server. The goal is to test key flows, such as a chat message being processed through the API, potentially triggering a Temporal workflow, interacting with an AI agent (which might be mocked at its boundary for LLM calls), and persisting data.

## Business Context
Integration tests provide confidence that different parts of the system work together correctly. They catch issues at component boundaries that unit tests might miss, such as misconfigured integrations, data format mismatches between services, or unexpected behavior when components interact. This is crucial for ensuring the reliability of end-to-end backend processes.

## Acceptance Criteria
- [ ] Identify 2-3 key backend flows for integration testing. Examples:
  - Basic chat message: API receives message -> AG-UI connection -> (Simplified) ChatSessionWorkflow -> Message stored.
  - AI interaction: User message -> ChatSessionWorkflow -> call_ai_agent_activity (mocking actual LLM) -> AI response processed by workflow.
  - Learning path start: API call to start track -> LearningPathWorkflow initiated -> UserProgress record created.
- [ ] Set up a test environment that can run these integration tests, including:
  - A separate test database instance/schema in Supabase.
  - Ability to run a local Temporal worker and server connected to a test namespace.
- [ ] Integration tests are written using `pytest`.
- [ ] Tests interact with live API endpoints (e.g., using `TestClient` from FastAPI).
- [ ] Tests verify data persistence in the test Supabase database.
- [ ] Tests verify Temporal workflow initiation and basic state changes (e.g., by querying workflow status or checking for activity execution if possible with test utilities).
- [ ] AI agent interactions within these flows might mock the final LLM call but test the integration up to the agent and its response handling.
- [ ] All new integration tests pass consistently in the CI pipeline (if feasible, or in a dedicated integration test environment).

## Service Layer TDD Approach
### Test Strategy
- Focus on testing the "glue" between components: API endpoints, service calls, Temporal workflow invocations, database interactions.
- Use a real database (test instance) to verify ORM/CRUD logic and data integrity.
- Use a real Temporal test server to verify workflow and activity orchestration.
- Mock external third-party services at their boundaries (e.g., actual LLM calls, external payment gateways if any). For the AI agent, this means the agent itself runs, but its call to OpenAI would be mocked.
- Ensure proper data setup before each test and cleanup afterwards to maintain test independence.

### Key Test Scenarios
- **Chat Message Flow:**
  - `POST` to `/api/v1/chat/messages` with valid auth and data.
  - Verify message is stored in the test Supabase `chat_messages` table.
  - Verify (if applicable and testable) that the `ChatSessionWorkflow` was signaled or started.
- **AI Response Flow (Simplified):**
  - User sends a message that should trigger an AI response (via `ChatSessionWorkflow`).
  - Verify `call_ai_agent_activity` is invoked (mocking its LLM call but running the activity and agent code).
  - Verify the workflow processes the (mocked) AI agent's response.
- **Learning Path Initiation:**
  - Call API endpoint to start a learning track for a test user.
  - Verify a `LearningPathWorkflow` instance is started in Temporal for that user/track.
  - Verify a `UserProgress` record is created in the test Supabase database.

## Technical Specifications
### Service Interface Design
- Tests will interact with existing API contracts, AG-UI (if testable at this level), and service method signatures.

### Implementation Guidance
- Use FastAPI's `TestClient` for making requests to API endpoints within tests.
- Configure tests to use a separate Supabase database or schema for testing to avoid conflicts with development data. Use environment variables for test DB connection strings.
- Use Temporal's testing utilities or a local Temporal server instance for testing workflows.
- Develop helper functions for setting up test data (e.g., creating test users, test learning tracks) and for cleaning up data after tests.
- Structure integration tests in `tests/integration/`.
- For AI agent integration, the agent code runs, but the specific part making the external LLM call is mocked to return a predefined response. This tests the agent's internal logic and its integration with activities/workflows.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-004/8` (Core features mostly stable and available for integration testing). `EPIC-005_TASK_1` (Comprehensive Unit Tests) is recommended to be well underway or complete, as integration tests build upon stable units.
- **Contract Dependencies**: API contracts, AG-UI event contracts, and internal service/data model contracts from previous epics.
- **Parallel Work Opportunities**: Can be developed in parallel with `EPIC-005_TASK_1` (Unit Tests) and `EPIC-005_TASK_3` (E2E Tests).
- **Mock Requirements**: Mock external third-party services (especially LLMs at the final call point). Test environment setup (DB, Temporal) is crucial.
- **Integration Points**: These tests explicitly verify the integration points between different backend services (API, services, Temporal, database, AI agent integration points).

## Definition of Done
- [ ] Test environment for integration tests (test DB, local Temporal) is configured.
- [ ] At least 2-3 key backend flows are covered by integration tests.
- [ ] Tests verify interactions with live (test) database and Temporal server.
- [ ] Tests pass reliably.
- [ ] (If integrated into CI) CI pipeline successfully runs these integration tests.
- [ ] Code (new tests and any test setup helpers) is reviewed and merged.

## Technical Notes
- Integration tests can be slower to run than unit tests. Plan for this in CI execution time or run them less frequently if needed (e.g., nightly, or only on PRs to main).
- Managing test data and ensuring test isolation can be challenging. Use strategies like:
  - Transactional tests if database supports it well with the testing framework.
  - Unique naming for test data and cleanup scripts/hooks.
- These tests are invaluable for catching bugs that only appear when components interact.
