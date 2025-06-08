# Architecture Document: Intelligent Tutoring System (ITS)

## 1. Overview

This document outlines the architecture for the Intelligent Tutoring System (ITS), an AI-driven platform designed to provide personalized and adaptive learning experiences. The system features a chat-first interface, leveraging AI agents and rich interactive components to deliver engaging and effective tutoring.

## 2. Architectural Principles

*   **Chat-First:** All user interactions are centered around a conversational interface.
*   **Agent-Driven:** AI agents orchestrate the learning experience, from assessment to content delivery.
*   **Rich Interactivity:** Modern UI components are used within the chat to minimize typing and maximize engagement.
*   **Adaptability:** The system personalizes learning paths and content based on individual user needs and progress.
*   **Scalability and Maintainability:** The architecture is designed to be scalable and easy to maintain.
*   **Modularity:** Components are designed to be loosely coupled, allowing for independent development and updates.

## 3. System Components

The ITS is composed of the following main components:

*   **Frontend:** User-facing application responsible for rendering the chat interface and interactive components.
*   **Backend:** Server-side application that handles business logic, data processing, and communication with AI agents and other services.
*   **AI Agents:** Core intelligence of the system, responsible for understanding user input, making decisions, and interacting with LLMs.
*   **Temporal.io Cluster:** Workflow orchestration engine for managing long-running processes, particularly chat conversations and learning paths.

### 3.1. Frontend

*   **Framework:** React
*   **Key Libraries/Technologies:**
    *   **AG-UI Client:** Manages communication with the backend, handling events and state updates for a seamless interactive experience.
    *   **Rich Component Library:** A set of custom React components designed for the chat interface (e.g., interactive cards, sliders, code editors, visual diagrams).
*   **Responsibilities:**
    *   Render the main chat dashboard.
    *   Display rich components as instructed by the AI agents.
    *   Capture user input through text and interactive components.
    *   Send user actions and events to the backend via AG-UI.
    *   Receive and display real-time updates and messages from the backend/AI agents.

### 3.2. Backend

*   **Framework:** Python FastAPI
*   **Key Libraries/Technologies:**
    *   **AG-UI Server:** Acts as the primary interface for the frontend, routing requests and broadcasting events. It will integrate with AI agent frameworks (e.g., LangGraph, CrewAI).
    *   **Temporal.io SDK:** To communicate with the Temporal cluster for starting, signaling, and querying workflows.
    *   **Supabase Client:** For interacting with Supabase, which will serve as the managed PostgreSQL database, providing authentication, real-time subscriptions, and storage.
*   **Responsibilities:**
    *   Expose API endpoints for frontend requests.
    *   Authenticate and authorize users.
    *   Manage user sessions and state.
    *   Interface with AI agents to process user input and generate responses.
    *   Initiate and manage Temporal workflows for each chat session and learning path.
    *   Store and retrieve data from the database.

### 3.3. AI Agents

*   **Frameworks (Potential):** LangGraph, CrewAI (integrated via AG-UI)
*   **Key Libraries/Technologies:**
    *   **LLM SDKs (e.g., OpenAI API, Hugging Face Transformers):** For interacting with Large Language Models.
    *   **AG-UI Integration:** To receive user input from the backend and send instructions/content back.
*   **Responsibilities:**
    *   Process and understand natural language input from users.
    *   Determine user intent and context.
    *   Make decisions on how to guide the learning process (e.g., which topic to present, what type of assessment to use).
    *   Select and configure appropriate rich components for the frontend to display.
    *   Generate personalized content and feedback.
    *   Interact with LLMs for complex reasoning, content generation, and conversational abilities.
    *   Manage the state of the learning interaction within a Temporal workflow.

### 3.4. Temporal.io Cluster

*   **Responsibilities:**
    *   Orchestrate long-running, stateful chat conversations. Each active user chat session can be modeled as a workflow instance.
    *   Manage complex learning paths that may involve multiple steps, conditions, and interactions with AI agents.
    *   Ensure reliability and fault tolerance for critical user interactions.
    *   Handle asynchronous tasks and timers related to the learning process (e.g., reminders, scheduled content).

## 4. Data Flow and Communication

1.  **User Interaction:** The user interacts with the React frontend through the chat interface and rich components.
2.  **Frontend to Backend (AG-UI):** User actions are sent to the FastAPI backend via AG-UI (e.g., using WebSockets or SSE for real-time communication).
3.  **Backend Processing:**
    *   The FastAPI backend receives the event via its AG-UI server component.
    *   It may update user state in the database.
    *   It signals the relevant Temporal workflow instance associated with the user's chat session.
4.  **Temporal Workflow Execution:**
    *   The Temporal workflow, representing the user's chat session and learning state, executes its defined logic.
    *   Activities within the workflow will call AI Agents.
5.  **AI Agent Interaction:**
    *   The AI Agent (e.g., a LangGraph agent) processes the input, potentially interacts with an LLM, and determines the next steps.
    *   The agent decides on the content to send back and the rich components to use.
6.  **Backend to Frontend (AG-UI):** The AI Agent (via the backend's AG-UI server) sends events/messages back to the React frontend. These messages might include new content to display, instructions to render specific rich components, or state updates.
7.  **UI Update:** The React frontend receives the events via its AG-UI client and updates the UI accordingly, displaying new messages or interactive elements.

## 5. Architecture Diagram

```mermaid
graph TD
    User[User] --> FE[React Frontend with AG-UI Client]
    FE -->|AG-UI (Events, Actions)| BE[FastAPI Backend with AG-UI Server]
    BE -->|Workflow Commands| Temporal[Temporal.io Cluster]
    Temporal -->|Activity Tasks| AIAgents[AI Agents / LLM Interactions]
    AIAgents -->|Results| Temporal
    Temporal -->|Workflow Updates| BE
    BE -->|AG-UI (Events, State Updates)| FE
    BE --> DB[(Database)]

    subgraph "Browser"
        FE
    end

    subgraph "Server Infrastructure"
        BE
        Temporal
        AIAgents
        DB
    end

    style FE fill:#add,stroke:#333,stroke-width:2px
    style BE fill:#dda,stroke:#333,stroke-width:2px
    style Temporal fill:#dad,stroke:#333,stroke-width:2px
    style AIAgents fill:#ada,stroke:#333,stroke-width:2px
    style DB fill:#ddd,stroke:#333,stroke-width:2px
```

## 6. Data Persistence

*   **User Data:** User profiles, authentication details, preferences.
*   **Learning Progress:** Track completion, assessment scores, current position in learning tracks.
*   **Content Cache:** Potentially cache frequently accessed learning materials.
*   **Workflow State:** Temporal.io handles the persistence of workflow state.
*   Supabase (PostgreSQL) is the preferred choice for data persistence. It offers a managed database solution along with built-in features like authentication, real-time capabilities, and storage, which can simplify development and reduce operational overhead.

## 7. Scalability and Deployment

*   **Frontend:** Can be deployed as static assets to a CDN.
*   **Backend (FastAPI):** Containerized (e.g., Docker) and deployed using a scalable hosting solution (e.g., Kubernetes, Serverless Functions).
*   **AI Agents:** Can be deployed as separate microservices, containerized, and scaled independently.
*   **Temporal.io Cluster:** Can be self-hosted or use Temporal Cloud.
*   Load balancers will be used to distribute traffic.
*   Asynchronous task queues (potentially managed by Temporal) will handle background processing.
```
