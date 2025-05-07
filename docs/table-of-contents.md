_[← Back to Documentation Navigation](navigation.md)_

# Table of Contents

## Overview

- [Index](index.md) - Project overview and goals

## Architecture Documentation

1. [Architecture Overview](architecture/overview.md)

   - Project structure
   - Key components
   - Main features
   - Data flow
   - **Diagrams**: High-level architecture diagram

2. [Context System](architecture/context-system.md)

   - Context providers
   - Retrieval system
   - Indexing
   - Context flow
   - Retrieval process
   - **Diagrams**: System architecture, Context flow sequence diagram

3. [LLM Integration](architecture/llm-integration.md)

   - LLM abstraction
   - Supported LLM types
   - Key components
   - Integration points
   - Challenges and considerations
   - **Diagrams**: LLM integration architecture, Request/response flow

4. [Agent System](architecture/agent-system.md)

   - Current implementation
   - Limitations
   - Evolution to team-based agents
   - Implementation strategy
   - **Diagrams**: Current agent architecture, Current workflow, Proposed team-based architecture, Team workflow

5. [IDE Integration](architecture/ide-integration.md)

   - Architecture
   - IDE interface
   - VSCode implementation
   - UI components
   - Event handling
   - Messenger system
   - File and code operations
   - **Diagrams**: IDE integration architecture, Messenger flow

6. [MCP System](architecture/mcp-system.md)
   - Key components
   - Integration with Continue
   - MCP capabilities
   - Relevance to agent-based system
   - Future extensions
   - **Diagrams**: MCP architecture, Interaction flow

## Technology Documentation

1. [Vector Databases](technologies/vector-databases.md)

   - ChromaDB architecture
   - Local storage mechanisms
   - Project isolation
   - Performance characteristics
   - AIgents implementation
   - TypeScript integration
   - **Diagrams**: ChromaDB architecture

2. [Agent Frameworks](technologies/agent-frameworks.md)

   - LangChain.js overview
   - LangGraph functionality
   - Agent creation patterns
   - Tool definition and usage
   - Memory systems
   - AIgents integration
   - **Diagrams**: Agent framework architecture

3. [Embedding Providers](technologies/embedding-providers.md)

   - Ollama embedding capabilities
   - Available embedding models
   - Performance characteristics
   - AIgents implementation
   - Integration with vector databases
   - **Diagrams**: Embedding system flow

4. [LLM Providers](technologies/llm-providers.md)
   - LM Studio capabilities
   - Local model management
   - API integration
   - Model selection and configuration
   - Performance tuning
   - AIgents integration
   - **Diagrams**: LLM provider architecture

## Project Evolution

- [Index](index.md#evolution-plan) - Evolution plan
- [Agent System](architecture/agent-system.md#evolving-to-team-based-agents) - Team-based agents architecture
