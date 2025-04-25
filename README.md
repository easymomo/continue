# AIgents Project

## Overview

AIgents is a fork of the VSCode extension Continue, enhanced with multi-agent capabilities. The project aims to address the primary limitation of AI IDEs like Cursor and Windsurf: the limited context window that causes LLMs to "forget" ongoing tasks after several interactions.

## Core Problem

Current AI IDEs have limited memory and continuity when running tasks with LLMs. After a few messages, they often "forget" context, requiring users to re-explain their tasks and goals.

## Key Features

- Multi-agent architecture replacing the single agent setup
- Persistent memory and context retention
- Task-based workflow system
- Dropdown selection for multi-agent mode

## Development Philosophy

- Plan-driven development (no work without a plan)
- For new projects: architecture design followed by detailed planning
- For existing projects: code analysis, architecture refinement, and detailed planning
- Production-ready, secure, and testable code

## Dependency Management

- Documentation Agent tracks library versions and documentation
- Vector DB storage for documentation with timestamps
- Migration plans for outdated dependencies
- Option to use current versions with appropriate documentation if updates aren't feasible

## Memory Management

- Persistent context awareness (codebase, plan, tasks, current state, desired state)
- Task-based work organization (all work happens within tasks)
- Task stack management (new tasks can be pushed onto the stack while preserving previous tasks)
- Systematic context rebuilding when necessary
- Text files for configuration and system memory
- Vector DB for search results and documentation
- Optional SQLite for additional data storage

## Message Processing

Messages are analyzed for:

1. Simple actions that don't affect the plan - create task and execute
2. Plan-affecting actions - analyze request, gather context, create/update tasks accordingly

## Core Components

- Agent Registry - manages agent registration and discovery
- Task Manager - handles creation, assignment, and execution of tasks
- Memory System - provides persistent storage and retrieval of agent state
- Message Bus - facilitates communication between agents

## Project Overview

AI Dev Agents is a fork of a VS Code extension that currently uses a single-agent architecture to generate code based on user prompts. The main goal of this project is to replace the single agent with a sophisticated multi-agent system that distributes responsibilities across specialized agents for more effective software development.

The project maintains the core capabilities of the original VS Code extension while enhancing it with a hierarchical agent system that provides better project management, security audits, documentation integration, and task distribution.

### Core Technologies

- **Frontend**: React components with TypeScript
- **State Management**: Redux with Redux Toolkit
- **Tool System**: Custom-built tool definitions and execution pipeline
- **LLM Integration**: Direct API connections to language models
- **IDE Integration**: VS Code extension integration

## Multi-Agent Architecture

Instead of relying on a single agent to handle all aspects of software development, our approach introduces a hierarchical system of specialized agents:

### Master Agent

- Central coordinator that maintains the overall project concept and vision
- Orchestrates communication between specialized worker agents
- Makes high-level decisions about task allocation and project direction

### Specialized Worker Agents

1. **Project Manager Agent**

   - Handles project breakdown and planning
   - Creates and maintains project and product files
   - Tracks project progress
   - Provides status updates on demand

2. **Security Agent**

   - Performs live code audits
   - Reviews implementation plans for security considerations
   - Integrates production-ready security measures
   - Implements best practices, OWASP guidelines, and security strategies
   - Handles security aspects: middleware, tokens, cookies, encryption

3. **Search Agent**

   - Searches the web for solutions and references
   - Activates automatically when errors occur
   - Accesses and analyzes logs to diagnose issues

4. **Documentation Agent**

   - Downloads up-to-date documentation from official sources
   - Maintains a knowledge base of technologies used in the project
   - Ensures code follows latest best practices and patterns

5. **Developer Agents** (Hierarchical)
   - Primary developers receive features from Project Manager
   - Break down complex tasks into subtasks
   - Create and manage child Developer Agents for subtasks
   - Ensure coherence across implementations
   - Each agent works with specific inputs and expected outputs
   - Can further create sub-agents for more complex tasks

## Development Workflow

For each code generation task:

1. Prompt is analyzed and broken down to understand requirements
2. Plan is created, including tests (TDD approach)
3. Documentation is checked for up-to-date best practices
4. Tests are created based on expected inputs and outputs
5. Code is implemented to pass the tests
6. Security checks are performed
7. Unit tests are verified
8. Function creation/deletion is reported to Project Manager
9. Progress is updated in the project tracking system

## Interaction Model

The system supports two primary modes of interaction:

1. **Project Development Mode**

   - Focused on adding planned features and functionality
   - Following the structured development workflow

2. **Ad-hoc Assistance Mode**
   - Handles conversations unrelated to planned features
   - Provides assistance with files, environment setup, etc.
   - May involve standalone agent for operations (Docker, app setup, etc.)

## Global Overview Plan

1. **Phase 1: Agent Framework Development**

   - Design agent communication protocol
   - Build agent state management system
   - Create agent factory and lifecycle management
   - Implement prompt analysis and task breakdown system

2. **Phase 2: Specialized Agent Implementation**

   - Build Master Agent coordinator logic
   - Implement Project Manager tracking system
   - Develop Security Agent with auditing capabilities
   - Create Search Agent with web search integration
   - Build Documentation Agent with fetching capabilities
   - Implement hierarchical Developer Agent system

3. **Phase 3: Workflow Integration**

   - Design Test-Driven Development workflow
   - Create project tracking and reporting system
   - Implement security audit integration
   - Build documentation checking system
   - Develop instruction parsing and execution system

4. **Phase 4: IDE Integration**

   - Connect agent system to VS Code extension
   - Implement UI for agent interactions and visualizations
   - Create progress and status visualization dashboard
   - Build agent communication history viewer

5. **Phase 5: Optimization and Scaling**
   - Optimize agent communication for speed
   - Implement parallel processing for multi-agent tasks
   - Build caching and memory systems for efficiency
   - Create scaling mechanisms for complex projects

## Principles

- Following instructions is the highest priority
- Every prompt is carefully analyzed before action
- Test-Driven Development is the standard approach
- Security considerations are built into every step
- Documentation and best practices guide all implementations
- Project tracking is continuous and comprehensive

## Getting Started

### Prerequisites

- Node.js and npm
- VS Code

### Installation

1. Clone the repository

```bash
git clone https://github.com/username/ai-dev-agents.git
cd ai-dev-agents
```

2. Install dependencies

```bash
npm install
```

3. Build the extension

```bash
npm run build
```

4. Install the extension in VS Code

## Contributing

Contributions are welcome! Check out our [contributing guide](CONTRIBUTING.md) for details.

## License

This project contains both licensed and proprietary components:

- Original code from the forked VS Code extension is licensed under its original license
- All modifications, extensions, and new features developed as part of AI Dev Agents are proprietary and not available for redistribution without explicit permission

© 2024 AI Dev Agents Team. All Rights Reserved.

## Project Vision & Raw Concept

This project uses a fork of a VSCode extension. The extension sends data with some context to LLMs (I suppose it works this way) to an agent and generates code. The main goal of this project is to swap that agent with my own implementation.

I would like to have an agent-based solution to replace the single agent of the application.

Here is the idea:
There is a master agent, it holds the whole concept and idea of the project. It has some worker agents:

- A Project Manager agent (Project Breakdown, create and maintain project and products files, project progress), we can ask the project manager any time about the progress of the project
- A Security Agent to audit the code live but also review the plans and include production ready security measures in the plan taking into account the project overall (Security strategy, middlewares, tokens, cookies, encryption, Best practices, OWASP...)
- A Search agent (Searches the web, activates when there is an error, can get access to logs)
- A Documentation agent, downloads up to date documentation for all the official sites of the technologies used in the project
- Developer agents (Receive features from the Project Manager Agent, receives the input and desired output, complete the task if they are simple, if not, break them down and create worker agents for each of the sub tasks. He is responsible for ensuring each of the children Developer Agents is doing something coherent with the project for a given task. Each of the sub agents receive its tasks with the desired input and output and has to create the feature. If the task is too complex, the sub agents does the same thing his parent Developer Agent did and breaks down the tasks and distribute them.

Any time some code needs to be generated, we check the documentation for up to date code and best practices, create the tests (Because we use TDD and we know the input and outputs), then implement the code, do security checks and unit tests.

Every function created (or deleted) is communicated back to the project manager to keep track of the progress.

Following the instructions is the top most important thing. So every prompt is analyzed and broken down to understand its meaning, plan the actions and then take action.

We need an instruction file that we will follow word for word except if we decide to make an exception.

Not all the communications in the chat will be about adding new features, we need a way to have some conversations about subject that may not be planned in the project, like interacting with some files, maybe we need another standalone agent for this kind of interactions (run docker, set up this app, ...)

## LLM Integration

**Local-First Approach**: This project is designed to work primarily with local LLMs through existing integrations with:

- **LM Studio**: For local model deployment and inference
- **Ollama**: For easy local model management and API access

This local-first approach provides several advantages:

- **Privacy**: Your code and prompts remain on your machine
- **Cost efficiency**: No per-token charges from cloud providers
- **Offline usage**: Work without an internet connection
- **Customization**: Use specialized models fine-tuned for coding tasks

While the system prioritizes local LLMs, it also supports cloud-based models when needed for more complex tasks or when local resources are insufficient.
