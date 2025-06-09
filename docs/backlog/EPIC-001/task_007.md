---
task_id: 7
title: "Setup Basic Temporal.io Workflow for Chat Sessions"
epic: "EPIC-001"
status: "pending"
priority: "medium"
estimated_hours: 7
dependencies: [3] # Depends on Task 1.3 (Backend Setup)
parallel_work: ["EPIC-001_TASK_6", "EPIC-001_TASK_8"]
blocking_dependencies: [3] # Hard dependency on backend project structure
contract_dependencies: [] # No direct contract dependencies for this initial workflow setup
phase: "foundation"
---

# Task Overview
This task involves setting up a local Temporal.io development environment and defining a very simple Temporal workflow, named `ChatSessionWorkflow`. This workflow will be initiated when a user starts a chat session (though the exact trigger mechanism from the backend might be basic initially). The workflow's initial responsibilities will be minimal, such as logging session start/end or persisting a session ID. The Temporal SDK will also be integrated into the FastAPI backend.

## Business Context
Temporal.io will be crucial for managing long-running, stateful interactions like chat sessions and particularly complex learning paths. Introducing it early, even with a simple workflow, allows the team to familiarize themselves with Temporal concepts and set up the foundational integration. This de-risks later, more complex workflow development.

## Acceptance Criteria
- [ ] Local Temporal.io development server (e.g., Temporal CLI with test server, or Dockerized Temporalite) is set up and accessible.
- [ ] Temporal Python SDK is added to the backend project (`pyproject.toml`) and installed.
- [ ] `app/temporal/client.py` is implemented to initialize and provide a Temporal client instance.
- [ ] A simple `ChatSessionWorkflow` is defined in `app/temporal/workflows.py`.
  - [ ] Workflow interface takes parameters like `user_id` and `session_id`.
  - [ ] Workflow has at least one simple activity (e.g., `log_session_start_activity`).
- [ ] A basic activity (e.g., `log_session_start_activity`) is defined in `app/temporal/activities.py` that logs its input or performs a trivial action.
- [ ] A Temporal worker process is configured and can be run to register and poll for workflow/activity tasks.
- [ ] Backend (e.g., in `app/services/chat_service.py` or a debug endpoint) can successfully start an instance of `ChatSessionWorkflow` using the Temporal client.
- [ ] Workflow execution can be observed in the Temporal Web UI (or CLI).

## Service Layer TDD Approach
### Test Strategy
- **Temporal Activities:**
  - Unit test the activity functions by directly invoking them. Mock any external services they might call (though initially, they might just log).
- **Temporal Workflows:**
  - Use `temporaltest.WorkflowEnvironment` (or equivalent from the Python SDK's testing utilities) to test workflow logic in-memory.
  - Verify that the workflow calls the expected activities with the correct parameters.
  - Test workflow completion or behavior in response to signals (if any were defined, though likely not for this very first simple workflow).
- **Temporal Client Integration:**
  - Test the part of the backend service that starts the workflow, ensuring it calls the Temporal client correctly. This might be an integration test.

### Key Test Scenarios
- **Activity (`log_session_start_activity`):**
  - Given input (e.g., user_id, session_id), the activity logs this information correctly.
- **Workflow (`ChatSessionWorkflow`):**
  - When the workflow starts, it executes the `log_session_start_activity` with the correct parameters derived from workflow input.
  - Workflow completes successfully after the activity.
- **Backend Integration:**
  - A call to a specific backend service function successfully initiates the `ChatSessionWorkflow` on the Temporal server.
  - The workflow execution is visible in Temporal UI/CLI.

## Technical Specifications
### Service Interface Design
- **Workflow Interface (`ChatSessionWorkflow` in `app/temporal/workflows.py`):**
  - `@workflow.defn`
  - `async def run(self, user_id: str, session_id: str):`
- **Activity Interface (`log_session_start_activity` in `app/temporal/activities.py`):**
  - `@activity.defn`
  - `async def log_session_start(user_id: str, session_id: str) -> str:` (returns a confirmation string)
- **Temporal Client (`app/temporal/client.py`):**
  - Provides a function `get_temporal_client()` that returns an initialized `temporalio.client.Client`.

### Implementation Guidance
- Follow Temporal Python SDK documentation for setting up client, workflows, activities, and workers.
- The trigger for starting `ChatSessionWorkflow` might be a simple API call in this task, or manually triggered for testing. Full integration with user login or first message will come later.
- Keep the workflow logic extremely simple for this initial setup task. The goal is integration and familiarization.
- Ensure the Temporal worker correctly registers the workflow and activity types.
- Refer to `architecture.md` for the location of Temporal files.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001_TASK_3` (Backend Project Setup) is required to have a place to integrate the SDK and define workflows/activities.
- **Contract Dependencies**: None for this initial setup. Later workflows will depend on data models and event contracts.
- **Parallel Work Opportunities**: Can be developed in parallel with `EPIC-001_TASK_6` (Frontend Chat Implementation) and `EPIC-001_TASK_8` (CI/CD Setup).
- **Mock Requirements**: For unit testing activities that might have external calls (though not this basic one), those externals would be mocked. `temporaltest` environment mocks the server.
- **Integration Points**: The Temporal client in `app/temporal/client.py` will be used by various backend services to start and signal workflows. This `ChatSessionWorkflow` will be significantly expanded in EPIC-002 to include AI agent interactions.

## Definition of Done
- [ ] Local Temporal server is operational.
- [ ] Temporal SDK integrated into the backend. Temporal client is configurable.
- [ ] `ChatSessionWorkflow` and a simple activity are defined and registered.
- [ ] A Temporal worker can run and execute the defined workflow and activity.
- [ ] Backend can successfully trigger the `ChatSessionWorkflow`.
- [ ] Basic tests for the activity and workflow pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- This is a learning task for the team regarding Temporal. Allocate time for understanding basic concepts if the team is new to Temporal.
- The choice of local Temporal server (CLI test server vs. Dockerized full server vs. Temporalite) should be documented for other developers. Temporalite is often a good choice for local dev.
- Error handling within workflows and activities will become more important in later tasks.
