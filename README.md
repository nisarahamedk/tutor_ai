# Intelligent Tutoring System (ITS) with AI Agents

An AI-driven tutoring system that delivers personalized and adaptive learning experiences. It leverages AI agents for assessment, guidance, and support, orchestrated through robust workflows to cater to individual learning needs.

## Project Goals

1. Create an intelligent tutoring system that adapts to individual learning needs
2. Provide real-time, interactive learning experiences through chat
3. Use AI agents to assess, guide, and support learners
4. Implement robust workflow orchestration for complex learning paths
5. Build a scalable and maintainable architecture

## Current Architecture

### Components

1. **API Layer (FastAPI)**
   - Real-time WebSocket communication for chat
   - RESTful endpoints for system interactions
   - CORS and iframe support enabled
   - Running on configurable port (default: 54321)
   - Handles WebSocket connections for chat functionality

2. **Frontend**
   - Simple chat interface
   - Real-time message updates
   - Support for structured responses
   - Served on configurable port (default: 54322)

3. **Workflow Orchestration (Temporal.io)**
   - Learning session management
   - Multi-step assessment processes
   - Long-running workflow support

4. **AI Agents**
   - PreAssessmentAgent for initial learner evaluation
   - (Planned) More specialized agents for different learning aspects

## Project Structure

```
tutor_ai/
├── README.md
├── agents/
│   ├── llm_service.py
│   └── pre_assessment_agent.py
├── api/
│   ├── cors_config.py
│   ├── main.py
│   └── static_server.py
├── docker-compose.yml
├── poetry.lock
├── pyproject.toml
├── scripts/
│   └── init-poetry.sh
├── templates/
│   ├── css/
│   │   └── style.css
│   └── index.html
├── temporal/
│   └── dynamicconfig/
│       └── development.yaml
└── tests/
    ├── integration/
    │   └── test_api.py
    └── unit/
        └── agents/
            ├── test_llm_service.py
            └── test_pre_assessment_agent.py
```

## Current Implementation

### Completed Features

1. **Basic Chat Infrastructure**
   - WebSocket-based real-time communication
   - Message handling and display
   - Basic error handling and logging

2. **Initial Assessment Flow**
   - User input processing
   - Preliminary assessment questions generation
   - Structured response handling

3. **Development Environment**
   - Local development server setup
   - CORS and security configurations
   - Basic logging system

### Current Workflow

1. User connects to the chat interface
2. User expresses learning interest (e.g., "I want to learn Python")
3. System triggers assessment workflow
4. PreAssessmentAgent generates relevant questions
5. Questions are presented to user in chat interface

## TODO List

### Short-term

1. **Temporal Integration**
   - [x] Set up Temporal server
   - [x] Implement proper workflow client
   - [ ] Add error handling and retries
   - [ ] Configure port forwarding for Temporal UI (8233)

2. **AI Agent Enhancement**
   - [ ] Integrate with actual LLM service
   - [ ] Add more sophisticated question generation
   - [ ] Implement response analysis

3. **User Experience**
   - [x] Improve chat interface design
     - [x] Move CSS to separate file
     - [x] Implement responsive layout
   - [ ] Add typing indicators
   - [ ] Implement message history

4. **Development Infrastructure**
   - [x] Implement environment-based configuration
   - [x] Set up template system for frontend
   - [ ] Add development documentation
   - [x] Set up automated testing
     - [x] Integration tests for API layer
     - [x] WebSocket chat flow testing
     - [ ] Unit tests for agents

### Medium-term

1. **Learning Management**
   - [ ] Create learning path generation
   - [ ] Implement progress tracking
   - [ ] Add assessment scoring

2. **System Architecture**
   - [ ] Add user authentication
   - [ ] Implement session management
   - [ ] Set up database for user data

3. **AI Capabilities**
   - [ ] Add specialized subject matter agents
   - [ ] Implement adaptive learning algorithms
   - [ ] Create content recommendation system

### Long-term

1. **Platform Enhancement**
   - [ ] Add support for multiple learning formats
   - [ ] Implement collaborative learning features
   - [ ] Create content management system

2. **Analytics and Monitoring**
   - [ ] Add learning analytics
   - [ ] Implement performance monitoring
   - [ ] Create reporting system

## Getting Started

1. Clone the repository
2. Bring up the services using
   `docker compose up`

### Environment Configuration

The application uses environment variables for configuration. These can be set in the `.env` file:

- `API_PORT`: Port for the main API server (default: 54321)
- `STATIC_PORT`: Port for the static file server (default: 54322)

You can customize these values by editing the `.env` file.

### Running Tests

The project uses pytest for testing. To run the tests:

1. Make sure the API server is running (needed for integration tests)
2. Run the tests:
   ```bash
   poetry run pytest tests/
   ```

The test suite includes:
- Integration tests for the API layer
- WebSocket chat flow testing
- Health check endpoint testing

## Development Notes

- The system is designed to be modular and extensible
- Each component (API, agents, workflows) is isolated for easier maintenance
- Logging is implemented for debugging and monitoring
- CORS is configured to allow cross-origin requests
- WebSocket connections handle real-time chat functionality

## Contributing

When contributing to this project:
1. Follow the existing code structure
2. Add appropriate logging
3. Update this README when adding new features
4. Ensure all endpoints have proper error handling
5. Test WebSocket connections thoroughly

## Development Status (Last Updated: March 9, 2024)

### Current State
1. Basic infrastructure is set up:
   - FastAPI backend with WebSocket support
   - Simple frontend chat interface
   - Initial test suite for API integration tests
   - LLMService class ready for integration

2. Testing Infrastructure:
   - Integration tests for API layer and WebSocket communication
   - Unit tests for PreAssessmentAgent
   - Test coverage for error handling and edge cases

3. Dependencies:
   - Added smolagents (v1.10.0) for LLM integration
   - Ollama installed locally with mistral model
   - All required Python packages in pyproject.toml

### Immediate Next Steps
1. **LLM Integration (In Progress)**
   - Fix CodeAgent prompt templates to match smolagents format
   - Update tests to handle the new prompt template structure
   - Test the integration with Ollama
   - Key files to work on:
     - `/agents/llm_service.py`
     - `/tests/unit/agents/test_llm_service.py`

2. Future Work:
   - Set up Temporal workflows
   - Improve the chat interface
   - Add user session management

### How to Continue Development
1. The LLMService class is ready for Ollama integration:
   ```python
   from smolagents import Agent, Message, Role
   from smolagents.llms import Ollama
   ```

2. Key components to implement:
   - Enhanced question generation using LLM
   - Dynamic context handling
   - Improved error handling and fallback mechanisms

3. Testing Strategy:
   - Run tests: `poetry run pytest tests/ -v`
   - Ensure all existing tests pass before adding new features
   - Follow TDD approach for new functionality

This README will be updated as the project evolves.