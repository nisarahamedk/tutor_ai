# Personal Tutor AI System

A sophisticated AI-powered tutoring system that provides personalized learning experiences through interactive chat sessions and intelligent workflow orchestration.

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
   - Running on configurable port (default: 54427)
   - Handles WebSocket connections for chat functionality

2. **Frontend**
   - Simple chat interface
   - Real-time message updates
   - Support for structured responses
   - Served on configurable port (default: 55251)

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
├── api/
│   ├── main.py              # Main FastAPI application with WebSocket support
│   └── static_server.py     # Static file server for frontend
├── agents/
│   └── pre_assessment_agent.py  # AI agent for initial assessment
├── workflows/
│   └── learning_workflow.py     # Temporal workflow definitions
├── static/
│   └── index.html              # Chat interface
├── venv/                       # Python virtual environment
└── run_servers.sh             # Script to run both API and static servers
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
   - [ ] Set up automated testing

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
2. Set up environment configuration:
   ```bash
   cp .env.example .env
   # Edit .env file to customize ports if needed
   ```
3. Install dependencies using Poetry:
   ```bash
   poetry install
   ```
4. Run the servers:
   ```bash
   ./run_servers.sh
   ```
5. Access the application:
   - Chat interface: http://localhost:{STATIC_PORT} (default: 55251)
   - API and WebSocket: http://localhost:{API_PORT} (default: 54427)
   - Temporal UI: http://localhost:8233 (requires port forwarding setup)

### Environment Configuration

The application uses environment variables for configuration. These can be set in the `.env` file:

- `API_PORT`: Port for the main API server (default: 54427)
- `STATIC_PORT`: Port for the static file server (default: 55251)

You can customize these values by editing the `.env` file.

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

## Next Steps

The immediate focus will be on:
1. Integrating with a proper LLM service
2. Setting up Temporal workflows
3. Improving the chat interface
4. Adding user session management

This README will be updated as the project evolves.