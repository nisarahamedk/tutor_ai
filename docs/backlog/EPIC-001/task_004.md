---
task_id: 4
title: "Define and Setup Initial Supabase Database Schema & User Auth"
epic: "EPIC-001"
status: "pending"
priority: "high"
estimated_hours: 8
dependencies: []
parallel_work: ["EPIC-001_TASK_1", "EPIC-001_TASK_2", "EPIC-001_TASK_3"]
blocking_dependencies: []
contract_dependencies: [] # This task *creates* the data model contract
phase: "foundation"
---

# Task Overview
This task involves setting up the project in Supabase, defining the initial database schemas for users and chat messages, and implementing basic user authentication (signup/login) using Supabase's built-in authentication features. This provides the data persistence layer and user management for the initial chat application.

## Business Context
A secure and reliable database with a well-defined schema is fundamental for any application that handles user data and interactions. Supabase simplifies this by providing database hosting, authentication, and other backend services. Early setup of user authentication and message storage is crucial for enabling basic chat functionality and subsequent personalized experiences.

## Acceptance Criteria
- [ ] Supabase project is created and configured.
- [ ] Database schema for `users` is defined and implemented (leveraging Supabase Auth tables, potentially adding a `profiles` table for additional user info if needed, as per Supabase best practices).
- [ ] Database schema for `chat_messages` is defined and implemented (e.g., columns: `id` (PK), `user_id` (FK to users/auth.users), `content` (text), `created_at` (timestamp)).
- [ ] SQL migration scripts (if using Supabase local dev/migrations) or Studio configurations for these schemas are created and version controlled.
- [ ] Backend stub functions for user signup and login using Supabase Auth client are implemented in `app/services/auth_service.py` (or similar, called by API endpoints).
- [ ] Basic API endpoints for signup and login (e.g., `/api/v1/auth/signup`, `/api/v1/auth/login`) are created, calling the auth service.
- [ ] Supabase connection details are configured securely in the backend (e.g., via environment variables loaded into `app/core/config.py`).
- [ ] `app/db/database.py` is updated to initialize the Supabase client.

## Service Layer TDD Approach
### Test Strategy
- For schema definition, testing involves verifying the schema meets requirements through review and by writing data access functions.
- For authentication service functions (`auth_service.py`):
  - Unit tests should mock the Supabase client to verify that the service calls the correct Supabase methods for signup/login.
  - Test handling of successful authentication and common error scenarios (e.g., user exists, invalid credentials).
- For authentication API endpoints:
  - Integration tests (or endpoint tests) should verify that the API endpoints correctly call the `auth_service` and return appropriate HTTP responses (success with token, error messages).

### Key Test Scenarios
- **Schema:**
  - `chat_messages` table can store messages linked to a user.
  - User information is consistent with Supabase Auth.
- **Auth Service (Unit Tests):**
  - `signup_user` calls `supabase.auth.sign_up()` with correct parameters.
  - `login_user` calls `supabase.auth.sign_in_with_password()` with correct parameters.
  - Service handles potential exceptions from Supabase client (e.g., `AuthApiError`).
- **Auth API Endpoints (Integration Tests):**
  - `POST /api/v1/auth/signup` with valid data creates a user and returns a session/token.
  - `POST /api/v1/auth/signup` with existing email returns an error.
  - `POST /api/v1/auth/login` with valid credentials returns a session/token.
  - `POST /api/v1/auth/login` with invalid credentials returns an error.

## Technical Specifications
### Service Interface Design
- **Data Models (in `app/db/models.py` or implicitly via Supabase schema):**
  - `User` (leveraging Supabase `auth.users`, possibly a `Profile` table for public data: `id`, `username`, `avatar_url`).
  - `ChatMessage`: `id (uuid)`, `user_id (uuid)`, `content (text)`, `created_at (timestamptz)`.
- **Auth Service (`app/services/auth_service.py` stubs):**
  - `async def register_new_user(email, password) -> UserSession:`
  - `async def login_user(email, password) -> UserSession:`
- **API Endpoints (in `app/api/v1/endpoints/auth.py` stubs):**
  - `POST /signup` (accepts email, password; calls auth_service.register_new_user)
  - `POST /login` (accepts email, password; calls auth_service.login_user)

### Implementation Guidance
- Use Supabase Studio for initial schema design and then script it using Supabase CLI migrations if possible for version control.
- Follow Supabase documentation for setting up Auth and interacting with it from Python backend.
- Store Supabase URL and anon/service_role keys as environment variables.
- `app/db/crud.py` will later contain functions to interact with `chat_messages` table (e.g., `create_chat_message`). This task focuses on schema and auth.
- The `user_id` in `chat_messages` should reference `auth.users.id`.

### Dependencies and Prerequisites
- **Blocking Dependencies**: None. Can be started in parallel with backend/frontend setup.
- **Contract Dependencies**: None (this task defines the initial data model contracts for users and messages).
- **Parallel Work Opportunities**: `EPIC-001_TASK_1` (API Contracts), `EPIC-001_TASK_2` (FE Setup), `EPIC-001_TASK_3` (BE Setup).
- **Mock Requirements**: For unit testing `auth_service.py`, the Supabase client will need to be mocked.
- **Integration Points**:
  - User authentication data will be used by most backend services.
  - `chat_messages` schema will be used by the chat service (Task 1.5).
  - Frontend will interact with auth API endpoints (later task).

## Definition of Done
- [ ] Supabase project created and basic connection configured in backend.
- [ ] `users` (auth) and `chat_messages` schemas are implemented in Supabase.
- [ ] SQL migration scripts or schema definitions are version controlled.
- [ ] Basic user signup/login API endpoints and underlying service functions are implemented and tested (unit/integration).
- [ ] Configuration for Supabase client in `app/db/database.py` is complete.

## Technical Notes
- Consider Row Level Security (RLS) policies on Supabase tables early on (e.g., users can only select/update their own profile, users can only select messages in chats they are part of). This task might only define basic RLS for message creation/reading.
- The `profiles` table pattern is common in Supabase for public user data separate from `auth.users`.
