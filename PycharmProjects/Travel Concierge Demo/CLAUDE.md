# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

This is a Travel Concierge AI Platform repository with multiple implementation approaches and example agents. The repository contains several distinct codebases:

1. **Main Travel Concierge Platform** (`travel-concierge-platform/`) - Production-ready Node.js/React application
2. **ADK Samples** (`adk-samples/`) - Google Agent Development Kit examples including travel-concierge
3. **Legacy Implementation** (root directories) - Alternative implementations and prototypes

## Development Commands

### Main Platform (travel-concierge-platform/)

**Frontend Development:**
```bash
cd travel-concierge-platform/frontend
npm install
npm run dev          # Starts Next.js dev server
npm run build        # Production build
npm run lint         # ESLint check
```

**Backend Development:**
```bash
cd travel-concierge-platform/backend
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
python main.py       # Start FastAPI server
```

**Testing:**
```bash
# From travel-concierge-platform/ root
npm test             # Unit tests
npm run test:e2e     # Playwright E2E tests
npm run test:load    # Artillery load tests
```

**Deployment:**
```bash
npm run deploy:infrastructure  # Deploy GCP infrastructure
npm run deploy:application     # Deploy application
npm run security:audit         # Security audit
```

### ADK Travel Concierge (adk-samples/agents/travel-concierge/)

**Setup:**
```bash
cd adk-samples/agents/travel-concierge
poetry install
eval $(poetry env activate)
```

**Running:**
```bash
adk run travel_concierge     # CLI interface
adk web                      # Web interface
adk api_server travel_concierge  # API server
```

**Testing:**
```bash
poetry install --with dev
pytest                       # Unit tests
pytest eval                  # Agent trajectory tests
```

**Deployment:**
```bash
poetry install --with deployment
python deployment/deploy.py --create
```

### Legacy Frontend (frontend/)

```bash
cd frontend
npm install
npm run dev          # Next.js on port 3007
npm run build
npm start
```

## Architecture

### Main Platform Architecture

- **Orchestrator Service** (`src/orchestrator/`) - Central coordination using Node.js, Express, Socket.IO
- **AI Agents** (`src/agents/`) - Specialized agents for different travel functions
- **Frontend** (`travel-concierge-platform/frontend/`) - Next.js with React, TypeScript, Tailwind
- **Infrastructure** - Google Cloud Platform with Kubernetes, Firestore, Pub/Sub

### ADK Implementation

- **Multi-agent System** - Pre-booking and post-booking agent flows
- **Agent Types**: inspiration, planning, booking, pre-trip, in-trip, post-trip
- **Tools**: Google Places API, Google Search Grounding, MCP integration
- **Memory**: Session state for context persistence

## Key Configuration Files

### Environment Setup

**ADK Travel Concierge** (`.env` in `adk-samples/agents/travel-concierge/`):
```
GOOGLE_GENAI_USE_VERTEXAI=1
GOOGLE_CLOUD_PROJECT=your-project-id
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_PLACES_API_KEY=your-api-key
TRAVEL_CONCIERGE_SCENARIO=eval/itinerary_empty_default.json
```

### Authentication

For ADK agents:
```bash
gcloud auth application-default login
```

## Testing Approach

### Main Platform
- **Unit Tests**: Jest for backend services
- **E2E Tests**: Playwright for UI workflows
- **Load Tests**: Artillery for performance testing
- **Security Tests**: Automated vulnerability scanning

### ADK Agents
- **Unit Tests**: pytest for agent functionality
- **Evaluation Tests**: Agent trajectory validation
- **MCP Testing**: Airbnb MCP server integration

## Important Notes

### File Structure Awareness
- Multiple package.json files exist - always verify you're in the correct directory
- Backend can be Python (FastAPI) or Node.js depending on implementation
- Frontend uses Next.js with TypeScript in most cases

### GCP Integration
- Requires Google Cloud Project with Vertex AI enabled
- Uses Google Places API for location services
- Firestore for data persistence
- Pub/Sub for message queuing

### Agent Development
- ADK agents use Poetry for Python dependency management
- Each agent has specialized prompts and tools
- Session state management for conversation context
- MCP (Model Context Protocol) support for external integrations

### Security Considerations
- API keys stored in environment variables
- GCP authentication via service accounts
- PCI DSS compliance for payment processing
- GDPR/CCPA compliance for data handling

## Common Workflows

1. **Local Development**: Start with ADK `adk web` for rapid agent prototyping
2. **Production Deployment**: Use main platform with Kubernetes deployment
3. **Testing New Agents**: Use `adk run` for CLI testing before web integration
4. **Performance Testing**: Use Artillery for load testing API endpoints

## Dependencies

### Python (ADK)
- google-adk, google-genai, google-cloud-aiplatform
- pydantic for data validation
- poetry for dependency management

### Node.js (Main Platform)  
- Express, Socket.IO for backend
- React, Next.js, TypeScript for frontend
- Google Cloud libraries for GCP integration

### Testing
- pytest (Python), Jest (Node.js)
- Playwright for E2E testing
- Artillery for load testing