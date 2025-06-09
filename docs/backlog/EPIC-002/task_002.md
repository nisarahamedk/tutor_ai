---
task_id: 2
title: "Choose and Setup AI Agent Framework (e.g., LangGraph/CrewAI)"
epic: "EPIC-002"
status: "pending"
priority: "high"
estimated_hours: 7
dependencies: ["EPIC-001/3"] # Depends on Backend Project Setup
parallel_work: ["EPIC-002_TASK_1", "EPIC-002_TASK_3"]
blocking_dependencies: ["EPIC-001/3"]
contract_dependencies: []
phase: "foundation"
---

# Task Overview
This task involves researching and selecting an initial AI agent framework (e.g., LangGraph, CrewAI, or a simpler custom approach if deemed appropriate for initial needs). Once selected, the basic structure for this framework will be set up within the backend project, typically under the `app/agents/` directory. This provides the foundational code structure for developing the AI agent logic.

## Business Context
Choosing an appropriate AI agent framework can accelerate development by providing pre-built components for managing agent state, tools, and interactions with LLMs. A well-considered choice balances features with complexity, enabling the team to build and iterate on AI capabilities efficiently. This setup is the first step in materializing the "AI" in "AI Tutor".

## Acceptance Criteria
- [ ] Brief research/comparison of at least two AI agent frameworks (e.g., LangGraph, CrewAI) is conducted and documented, considering project needs (simple initial agent, potential for future complexity).
- [ ] A decision on the initial framework is made and justified.
- [ ] The chosen framework's libraries are added as dependencies to the backend project (`pyproject.toml`).
- [ ] Basic directory structure for the agent is created within `app/agents/` (e.g., `app/agents/tutor_agent.py`, `app/agents/tools/` if applicable).
- [ ] A placeholder/stub for the main tutoring agent (e.g., `TutorAgent` class or main function in `tutor_agent.py`) is created using the chosen framework's conventions.
- [ ] Basic configuration related to the agent framework (if any) is added (e.g., API keys for LLMs if directly used by framework, though preferably through a central config).

## Service Layer TDD Approach
### Test Strategy
- This task is primarily setup and research. Direct TDD for service logic is minimal.
- The "test" for the framework choice is its suitability for current and near-future needs.
- A simple "import test" could be written to ensure the chosen framework's main components can be imported into the agent stub file without issues.

### Key Test Scenarios
- Can the chosen AI agent framework be successfully installed as a dependency?
- Can the basic agent stub file (`tutor_agent.py`) be created and import necessary components from the framework?
- (If applicable) Can a minimal "hello world" example from the chosen framework's documentation be run or adapted within our project structure?

## Technical Specifications
### Service Interface Design
- Not directly defining service interfaces, but the chosen framework will dictate how agent logic, tools, and LLM interactions are structured.
- The `tutor_agent.py` stub will be the entry point for the agent logic.

### Implementation Guidance
- Review documentation for LangGraph and CrewAI, focusing on:
  - Ease of setup for simple agents.
  - Modularity and ability to add tools.
  - State management capabilities.
  - Integration with LLMs (e.g., OpenAI).
  - Community support and documentation quality.
- For the initial setup, aim for the simplest possible integration of the chosen framework.
- The `app/agents/` directory should be organized to accommodate potential future agents or shared agent tools.
- LLM API keys should be managed via the backend's central configuration (`app/core/config.py`) and accessed by the agent, not hardcoded or managed separately by the agent framework if avoidable.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/3` (Backend Project Setup) is required to have an environment to install and set up the framework.
- **Contract Dependencies**: None for this selection and setup task. The agent implementation (Task 2.3) will depend on contracts from Task 2.1.
- **Parallel Work Opportunities**: Can be done in parallel with `EPIC-002_TASK_1` (defining agent interaction contracts) as the specific contract details don't heavily influence the choice of a general-purpose agent framework initially.
- **Mock Requirements**: No mocks needed for framework setup.
- **Integration Points**: The agent structure created here will be fleshed out in `EPIC-002_TASK_3` and will be called by Temporal activities defined in `EPIC-002_TASK_4`.

## Definition of Done
- [ ] AI agent framework selected and decision documented.
- [ ] Framework installed, and basic agent stub/directory structure created in `app/agents/`.
- [ ] Placeholder agent code initializes without errors.
- [ ] Changes are committed to the repository.

## Technical Notes
- Consider starting with a very simple agent structure, even if the framework offers much more. Complexity can be added iteratively.
- The goal is to enable Task 2.3 (Develop Simple AI Agent). If the framework choice becomes a time sink, a simpler custom approach for the first agent might be a pragmatic fallback, with plans to adopt a framework later.
