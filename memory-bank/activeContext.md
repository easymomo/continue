# Active Context

## Current Focus
- Agent framework evaluation and selection completed
- Architecture design for multi-agent system using LangChain.js/LangGraph
- **Implementation planning based on VS Code extension code analysis**
- **Integration strategy with existing Redux workflow and LLM connections**
- **Custom "AIgents" mode implementation in the VS Code/Cursor UI**
- Local LLM integration strategy with LM Studio and Ollama

## Focus Areas
- [x] Agent framework evaluation and architecture
- [x] Local LLM integration strategy via LM Studio and Ollama
- [ ] Multi-agent system hierarchy and communication design
- [ ] VS Code extension integration approach
- [ ] MCP integration leveraging VS Code's native MCP support
- [ ] Custom "AIgents" mode UI implementation

## Project Overview
This project aims to transform a single-agent VS Code extension into a comprehensive multi-agent system with specialized roles and capabilities. The system will utilize a hierarchical structure with a Master Agent coordinating specialized worker agents. Key components include:

1. **Multi-Agent Architecture**: A hierarchical system with a Master Agent and specialized worker agents.
2. **Local-First LLM Integration**: Prioritizing local LLM usage through existing extension integrations with LM Studio and Ollama, with support for cloud-based models when needed.
3. **Vector Database**: Implementing a vector database for efficient storage and retrieval of documentation and search results.
4. **Instruction Management System**: Creating a flexible system for managing agent instructions without code modifications.
5. **MCP Integration**: Leveraging VS Code's built-in MCP support to utilize registered MCP servers without creating redundant connections.
6. **Custom UI Mode**: Adding a new "AIgents" mode option to the existing UI dropdown, preserving all current functionality.

## Selected Technical Approach
- **Agent Framework**: LangChain.js with LangGraph for orchestrating multi-agent workflows
- **Agent Model**: CrewAI-inspired role-based model with hierarchical structure
- **LLM Integration**: Adapter for both local (LM Studio, Ollama) and cloud LLMs
- **Vector Database**: Chroma DB for development, with options for Pinecone or Qdrant in production
- **Instruction Management**: YAML/JSON configuration files with hot-reload capabilities
- **MCP Implementation**: Using VS Code's MCP API to discover and utilize registered MCP servers
- **UI Integration**: Adding "AIgents" as a new mode option alongside existing Agent, Chat, and Edit modes

## Custom AIgents Mode Implementation
The extension will add a new "AIgents" mode to the mode selector dropdown, alongside the existing Agent, Chat, and Edit modes. This approach has several advantages:

1. **Preserves Existing Functionality**: All current modes remain completely untouched
2. **Clear User Experience**: Users can easily switch between standard operation and our enhanced multi-agent system
3. **Simplified Development**: Avoids the complexity of modifying existing code paths
4. **LLM Compatibility**: Works with the selected LLM from the existing model dropdown

The implementation will include:
- Adding the AIgents option to the mode selector dropdown
- Creating custom UI indicators for the AIgents mode
- Implementing specialized controls for interacting with multiple agents
- Routing messages through our multi-agent system when in AIgents mode

## Code Analysis Findings
- **Redux State Flow**:
  - `streamResponseThunk`: Entry point for user messages
  - `streamNormalInput`: Handles sending messages to LLM
  - `callTool`: Manages tool execution requests
- **LLM Integration**:
  - `ideMessenger.llmStreamChat`: Main LLM communication method
  - Model-specific classes in `core/llm/llms/` directory
  - Model selection UI with support for different providers
- **Existing Agent Implementation**:
  - Current implementation uses a single agent architecture
  - Agent mode is toggled via `selectUseTools` selector
  - Tools are included in LLM requests when in agent mode
  - Tool execution follows policy-based permission system

## Enhanced Agent Types
- **Core Agents**:
  - Master Agent (Coordinator)
  - Developer Agent (Coding specialist)
  - Research Agent (Documentation and search specialist)
  - Testing Agent (Code testing and validation)
  
- **Additional Specialized Agents**:
  - Evaluation Agent (Assesses quality of solutions)
  - Learning Agent (Captures and applies learning from interactions)
  - Integration Agent (Manages external system integrations)

## MCP Integration Strategy
The implementation will leverage VS Code's native MCP support to:
- Discover MCP servers registered in VS Code
- Access tools and resources provided by these servers
- Implement proper security and permission controls
- Use VS Code's existing configuration and authentication systems

This approach eliminates the need to create separate connections or manage transport protocols manually, providing a more seamless experience for users who already have MCP servers configured in VS Code.

## Recent Activity
- Completed research on agent frameworks and identified LangChain.js with LangGraph as the optimal choice
- Analyzed existing VS Code extension to identify integration points
- Identified existing LLM integrations with LM Studio and Ollama in the forked extension
- Designed initial agent hierarchy and communication patterns
- Updated implementation plan to leverage VS Code's native MCP support
- **Completed code analysis of VS Code extension**
- **Mapped integration points for agent system**
- **Designed custom "AIgents" mode approach for UI integration**

## Next Steps
1. Set up development environment with LangChain.js and necessary dependencies
2. Create the UI components for the new "AIgents" mode
3. Implement the mode registration and selection handling
4. Investigate VS Code's MCP API to understand how to utilize registered MCP servers
5. Design the agent-MCP bridge for seamless tool access
6. Create proof of concept for basic agent communication
7. Implement Master Agent prototype
