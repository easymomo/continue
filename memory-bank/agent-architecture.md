# AIgents: Agent Architecture Documentation

- **Created**: 2024-05-11
- **Project**: AIgents - Multi-Agent Framework for VS Code

## Overview

The AIgents framework implements a multi-agent architecture with a central coordinator agent that orchestrates specialized worker agents. This document outlines the design patterns, implementation details, and interaction flows of the agent system.

## Agent Design Pattern

The agent system follows an object-oriented design with clear inheritance and interface implementation:

```
Agent (Interface)
  ↑
BaseAgent (Abstract Class)
  ↑
  ├── CoordinatorAgent
  ├── ResearchAgent
  ├── DeveloperAgent
  ├── SecurityAgent
  └── [Future specialized agents]
```

### Core Components

#### 1. Agent Interface

Defines the contract that all agents must follow:

- Properties: id, type, name, description
- Methods: process, getModel, getTools

#### 2. BaseAgent Abstract Class

Implements the Agent interface and provides common functionality:

- Properties: id, type, name, description, model, tools
- Methods: getModel(), getTools()
- Abstract method: process()

#### 3. Specialized Agent Implementations

Extend BaseAgent with specialized behavior:

- CoordinatorAgent: Routes requests to appropriate worker agents
- ResearchAgent: Information gathering and analysis
- DeveloperAgent: Code implementation and technical solutions
- SecurityAgent: Security analysis and recommendations

## Coordinator Agent

The CoordinatorAgent serves as the central orchestrator in the multi-agent system:

### Responsibilities

- Analyzes user requests to understand their needs
- Determines which specialized agent is best suited for each task
- Delegates tasks to appropriate worker agents
- Coordinates between agents when tasks require multiple specialists
- Provides final responses to users based on agent outputs

### Implementation Details

- Maintains a registry of worker agents in a Map
- Uses LLM to determine which agent should handle each request
- Implements a delegation system using LangGraph's Command mechanism
- Provides fallback handling for direct responses when delegation isn't needed

## Worker Agents

Worker agents are specialized agents that focus on specific types of tasks:

### Common Characteristics

- Each has a specialized system prompt defining its role and responsibilities
- Each implements the `process()` method to handle messages
- Each includes logic to determine when to return control to the coordinator
- Each uses the same LLM model interface for consistency

### Research Agent

- Focus: Information gathering, analysis, and synthesis
- Responsibilities: Searching documentation, finding solutions, evaluating options
- Detection: Uses phrases like "need implementation", "security consideration" to return to coordinator

### Developer Agent

- Focus: Code implementation and technical solutions
- Responsibilities: Writing code, solving technical issues, implementing features
- Detection: Uses phrases like "need security review", "need documentation" to return to coordinator

### Security Agent

- Focus: Security analysis and vulnerability detection
- Responsibilities: Identifying security issues, recommending fixes, ensuring best practices
- Detection: Uses phrases like "need development assistance", "needs code changes" to return to coordinator

## Agent Interaction Flow

The interaction flow between agents follows this general pattern:

1. User submits a request to the system
2. CoordinatorAgent receives the request
3. CoordinatorAgent analyzes the request to determine the appropriate worker agent
4. CoordinatorAgent delegates to the selected worker agent
5. Worker agent processes the request and either:
   - Returns a response and stays active if more work is needed
   - Returns control to the coordinator when another agent's expertise is needed
6. CoordinatorAgent may redirect to another worker agent if needed
7. Final response is provided to the user

## Communication Mechanism

The agents use LangGraph's Command mechanism for inter-agent communication:

```typescript
// Example of returning control to coordinator
return new Command({
  goto: "coordinator",
  update: {
    messages: [
      ...state.messages,
      new AIMessage({
        content: response.content,
      }),
    ],
  },
});
```

## Agent State and Memory

The current implementation maintains state through the `messages` array in the state object. A more robust memory and context system is planned for future implementation.

## Future Enhancements

1. Implement persistent memory system for agent state
2. Add tool integrations for specialized capabilities
3. Create additional specialized agents (Documentation, Testing, Evaluation)
4. Implement structured messaging format for better inter-agent communication
5. Add agent monitoring and performance metrics

## Technical Stack

- TypeScript for type-safe implementation
- LangChain.js for LLM interactions
- LangGraph for agent orchestration
- BaseChatModel from LangChain for consistent model interface
