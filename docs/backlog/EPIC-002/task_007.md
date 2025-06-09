---
task_id: 7
title: "Define Initial Learning Content Snippets (Data Model & Storage)"
epic: "EPIC-002"
status: "pending"
priority: "medium"
estimated_hours: 6
dependencies: ["EPIC-001/4"] # Depends on Supabase Setup
parallel_work: ["EPIC-002_TASK_8"]
blocking_dependencies: ["EPIC-001/4"]
contract_dependencies: [] # This task CREATES the content data model
phase: "foundation"
---

# Task Overview
This task involves defining a simple data model for basic learning content snippets (e.g., a topic name, a short piece of text or explanation, perhaps a content type identifier). It also includes implementing the necessary Supabase table schema and basic backend CRUD (Create, Read, Update, Delete) operations for managing these snippets. This is not about creating extensive content, but establishing the mechanism to store and retrieve it.

## Business Context
For the AI tutor to deliver educational value, it needs access to learning content. This task lays the groundwork for content management by defining how content snippets are structured and stored. Even a simple content storage mechanism allows the AI agent to start delivering targeted information beyond just conversational responses.

## Acceptance Criteria
- [ ] Pydantic models for `LearningContentSnippet` (or similar) are defined in `app/db/models.py`.
  - [ ] Model includes fields like `id`, `topic_name`, `content_text`, `content_type` (e.g., "explanation", "fun_fact"), `created_at`.
- [ ] Supabase database table schema for `learning_content_snippets` is defined and implemented.
  - [ ] Columns match the Pydantic model.
  - [ ] Appropriate data types and constraints (e.g., not null) are set.
- [ ] Basic CRUD functions for `LearningContentSnippet` are implemented in `app/db/crud.py`.
  - [ ] `create_snippet(snippet_data: LearningContentSnippetCreate) -> LearningContentSnippet`
  - [ ] `get_snippet_by_id(snippet_id: UUID) -> LearningContentSnippet | None`
  - [ ] `get_snippets_by_topic(topic_name: str) -> list[LearningContentSnippet]`
  - [ ] (Optional for now: `update_snippet`, `delete_snippet`)
- [ ] Unit tests for CRUD functions are written and pass, mocking the Supabase client.

## Service Layer TDD Approach
### Test Strategy
- **Pydantic Models:** Validation is inherent in Pydantic model definition.
- **CRUD Functions (`app/db/crud.py`):**
  - Unit test each CRUD function.
  - Mock the Supabase client (or database connection if using an ORM directly, though Supabase client is typical).
  - Verify that functions correctly format data for Supabase client calls.
  - Verify that functions correctly parse data returned from Supabase client.
  - Test handling of non-existent records (for get/update/delete) and database errors (mocked).

### Key Test Scenarios
- **`create_snippet`:**
  - Given valid snippet data, the function calls the (mocked) Supabase client's `insert` method with the correct table and data.
  - Function returns a `LearningContentSnippet` object matching the input data (plus generated ID/timestamp).
- **`get_snippet_by_id`:**
  - Given an ID, calls (mocked) Supabase `select` with correct filter.
  - Returns parsed `LearningContentSnippet` if (mocked) Supabase returns data.
  - Returns `None` if (mocked) Supabase returns no data.
- **`get_snippets_by_topic`:**
  - Given a topic name, calls (mocked) Supabase `select` with correct filter.
  - Returns a list of parsed `LearningContentSnippet` objects.

## Technical Specifications
### Service Interface Design
- **Pydantic Models (`app/db/models.py`):**
  ```python
  class LearningContentSnippetBase(BaseModel):
      topic_name: str
      content_text: str
      content_type: str = "explanation"

  class LearningContentSnippetCreate(LearningContentSnippetBase):
      pass

  class LearningContentSnippet(LearningContentSnippetBase):
      id: uuid.UUID
      created_at: datetime

      class Config:
          orm_mode = True
  ```
- **Supabase Table (`learning_content_snippets`):**
  - `id (uuid, primary key, default gen_random_uuid())`
  - `topic_name (text, not null)`
  - `content_text (text, not null)`
  - `content_type (text, default 'explanation')`
  - `created_at (timestamptz, default now())`
- **CRUD Signatures (`app/db/crud.py`):** As listed in Acceptance Criteria.

### Implementation Guidance
- Add the new table schema to Supabase (via Studio for dev, then script via migrations).
- Implement CRUD functions using the Supabase Python client, ensuring proper error handling for database operations.
- Pydantic models should be used for data validation and serialization.
- For now, these CRUD functions will be called directly by the AI agent (or a service it uses). No API endpoints for content management are required in this task.

### Dependencies and Prerequisites
- **Blocking Dependencies**: `EPIC-001/4` (Define and Setup Initial Supabase Database Schema & User Auth) for Supabase project setup and client initialization.
- **Contract Dependencies**: None. This task defines the data model for learning content snippets.
- **Parallel Work Opportunities**: `EPIC-002_TASK_8` (Basic AI Agent Content Delivery) can proceed once these CRUD functions are available or mocked.
- **Mock Requirements**: Supabase client needs to be mocked for unit testing CRUD functions.
- **Integration Points**: The AI agent (Task 2.8) will use these CRUD functions to fetch content.

## Definition of Done
- [ ] `LearningContentSnippet` Pydantic models are defined.
- [ ] `learning_content_snippets` table is created in Supabase.
- [ ] CRUD functions for snippets are implemented in `app/db/crud.py`.
- [ ] Unit tests for CRUD functions pass.
- [ ] Code is reviewed and merged.

## Technical Notes
- Keep the content model simple initially. More complex structures (e.g., relationships, versioning) can be added later.
- Consider indexing `topic_name` if it will be frequently queried.
- This task provides the very first "C" (Content) in a Content Management System sense, albeit very basic.
