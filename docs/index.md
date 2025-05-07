_[← Back to Documentation Navigation](navigation.md)_

# AI Dev Agents Documentation

**Navigation:**

- **You are here:** Index
- [Table of Contents](table-of-contents.md)
- [Architecture Overview](architecture/overview.md)
- [Context System](architecture/context-system.md)
- [LLM Integration](architecture/llm-integration.md)
- [Agent System](architecture/agent-system.md)
- [IDE Integration](architecture/ide-integration.md)
- [MCP System](architecture/mcp-system.md)
- **Task Management System:**
  - [System Overview](task-management-system.md)
  - [API Reference](task-management-api.md)
  - [Examples & Usage](task-management-examples.md)
  - [AIgents Task Management](aigents-task-management.md)
- **Technologies:**
  - [Vector Databases](technologies/vector-databases.md)
  - [Agent Frameworks](technologies/agent-frameworks.md)
  - [Embedding Providers](technologies/embedding-providers.md)
  - [LLM Providers](technologies/llm-providers.md)

This documentation provides a comprehensive analysis of the Continue VSCode extension and outlines our plan to evolve it into an agent-based system.

## Project Goal

Our goal is to create an evolved version of the Continue VSCode extension that uses a team of AI agents to generate code. Instead of having a single AI model handle all aspects of code generation, we will distribute the work to specialized agents that collaborate to produce higher-quality results.

## Key Features to Implement

1. **Agent Team Architecture**: A system of specialized agents with different roles
2. **Task Distribution**: Breaking down user requests into subtasks for different agents
3. **Collaborative Context Management**: Allowing agents to share and build upon each other's understanding
4. **Communication Protocol**: Enabling agents to communicate and collaborate effectively
5. **Result Aggregation**: Combining the work of multiple agents into coherent solutions

## Architecture Documentation

The following documents provide detailed analysis of the Continue extension's architecture:

- [Architecture Overview](architecture/overview.md): High-level overview of the Continue extension's structure
- [Context System](architecture/context-system.md): How the extension gathers and uses code context
- [LLM Integration](architecture/llm-integration.md): How the extension interacts with AI models
- [Agent System](architecture/agent-system.md): Current agent implementation and evolution plan
- [IDE Integration](architecture/ide-integration.md): How the extension integrates with VSCode
- [MCP System](architecture/mcp-system.md): The Model Context Protocol system and its capabilities

## Technologies Documentation

The following documents provide detailed information about the technologies used in the AIgents project:

- [Vector Databases](technologies/vector-databases.md): ChromaDB and vector storage systems
- [Agent Frameworks](technologies/agent-frameworks.md): LangChain.js and agent orchestration tools
- [Embedding Providers](technologies/embedding-providers.md): Ollama and other embedding generation options
- [LLM Providers](technologies/llm-providers.md): LM Studio and other model providers

## Current Architecture Summary

The Continue extension is built with a modular architecture that separates:

1. **Core Functionality**: Platform-independent code in the `core/` directory
2. **IDE Integration**: IDE-specific implementations in the `extensions/` directory
3. **UI Components**: User interface elements in the `gui/` directory

Key features of the current extension include:

- **Chat**: Interactive conversations with AI about code
- **Autocomplete**: AI-powered code suggestions as you type
- **Edit**: AI-assisted code modification
- **Agent**: Making substantial codebase changes with AI guidance

## Evolution Plan

Our plan is to evolve the extension's agent feature into a team-based system:

1. **Phase 1**: Analyze the current architecture (this documentation)
2. **Phase 2**: Design the agent team architecture and communication protocol
3. **Phase 3**: Implement the core agent framework and basic collaboration
4. **Phase 4**: Develop specialized agents for different aspects of code generation
5. **Phase 5**: Enhance the user interface to show the work of multiple agents

## Getting Started

To work on this project, familiarize yourself with:

1. The Continue extension's architecture as documented here
2. VSCode extension development
3. AI agent systems and collaboration patterns
4. TypeScript and modern JavaScript development

## Next Steps

After reviewing this documentation, the next steps are:

1. Set up a development environment for the Continue extension
2. Implement a prototype of the agent team architecture
3. Test the prototype with simple code generation tasks
4. Iterate based on results and feedback

Together, we aim to create a powerful new AI coding assistant that leverages the power of specialized agent teams to generate higher-quality code.

---

**Navigation:**

- **You are here:** Index
- [Table of Contents](table-of-contents.md)
- [Architecture Overview](architecture/overview.md)
- [Context System](architecture/context-system.md)
- [LLM Integration](architecture/llm-integration.md)
- [Agent System](architecture/agent-system.md)
- [IDE Integration](architecture/ide-integration.md)
- [MCP System](architecture/mcp-system.md)
- **Task Management System:**
  - [System Overview](task-management-system.md)
  - [API Reference](task-management-api.md)
  - [Examples & Usage](task-management-examples.md)
  - [AIgents Task Management](aigents-task-management.md)
- **Technologies:**
  - [Vector Databases](technologies/vector-databases.md)
  - [Agent Frameworks](technologies/agent-frameworks.md)
  - [Embedding Providers](technologies/embedding-providers.md)
  - [LLM Providers](technologies/llm-providers.md)
