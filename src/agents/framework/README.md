# AIgents Mini Agent Framework

This framework provides a flexible, extensible architecture for creating AI agents that can work together in a coordinated manner, maintaining memory and context across interactions.

## Core Principles

1. **Task-Based Execution**: All work is done within the context of a task
2. **Memory Persistence**: Agents never forget their context and state
3. **Dynamic Configuration**: New agents can be added without modifying existing code
4. **Specialization**: Each agent has specific capabilities and responsibilities
5. **Coordination**: Agents communicate and collaborate through a central system

## Architecture

```
┌───────────────────────────────────────────────────────────────┐
│                                                               │
│                     AIgents Framework                         │
│                                                               │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    │
│  │ Agent       │    │ Task        │    │ Memory          │    │
│  │ Registry    │◄───┤ Manager     │◄───┤ System         │    │
│  └─────────────┘    └─────────────┘    └─────────────────┘    │
│         ▲                  ▲                    ▲             │
│         │                  │                    │             │
│         ▼                  ▼                    ▼             │
│  ┌─────────────┐    ┌─────────────┐    ┌─────────────────┐    │
│  │ Agent       │    │ Message     │    │ Storage         │    │
│  │ Factory     │◄───┤ Bus         │◄───┤ Adapters        │    │
│  └─────────────┘    └─────────────┘    └─────────────────┘    │
│                                                               │
└───────────────────────────────────────────────────────────────┘
         ▲                  ▲                    ▲
         │                  │                    │
         ▼                  ▼                    ▼
┌─────────────┐    ┌─────────────┐    ┌─────────────────┐
│ Doc Agent   │    │ Dependency  │    │ Planning        │
│             │    │ Agent       │    │ Agent           │
└─────────────┘    └─────────────┘    └─────────────────┘
```

## Core Components

### 1. Agent Registry

Maintains a registry of all available agents and their capabilities.

```typescript
interface AgentCapability {
  name: string;
  description: string;
  taskTypes: string[];
}

interface AgentRegistration {
  id: string;
  name: string;
  description: string;
  capabilities: AgentCapability[];
}
```

### 2. Agent Factory

Creates agent instances based on configuration and requirements.

```typescript
interface AgentConfig {
  id: string;
  type: string;
  settings: Record<string, any>;
}
```

### 3. Task Manager

Manages task creation, assignment, execution, and tracking.

```typescript
interface Task {
  id: string;
  type: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  priority: "low" | "medium" | "high";
  description: string;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
  steps: TaskStep[];
  context: Record<string, any>;
  result: any;
}

interface TaskStep {
  id: string;
  name: string;
  status: "pending" | "in_progress" | "completed" | "failed";
  completedAt?: string;
}
```

### 4. Message Bus

Facilitates communication between agents.

```typescript
interface Message {
  id: string;
  from: string;
  to: string | null; // null for broadcast
  type: string;
  content: any;
  timestamp: string;
}
```

### 5. Memory System

Provides persistent storage and retrieval of agent state and knowledge.

```typescript
interface MemoryItem {
  id: string;
  type: string;
  content: any;
  metadata: Record<string, any>;
  timestamp: string;
}
```

### 6. Storage Adapters

Interfaces with different storage backends (Vector DB, SQLite, file system).

```typescript
interface StorageAdapter {
  id: string;
  type: "vector" | "document" | "relational" | "file";
  store(item: any): Promise<string>;
  retrieve(id: string): Promise<any>;
  query(filter: Record<string, any>): Promise<any[]>;
}
```

## Base Agent Interface

All agents implement this common interface:

```typescript
interface Agent {
  id: string;
  name: string;
  type: string;
  capabilities: AgentCapability[];

  initialize(): Promise<void>;
  handleTask(task: Task): Promise<Task>;
  handleMessage(message: Message): Promise<void>;
  saveState(): Promise<void>;
  loadState(): Promise<void>;
}
```

## Configuration

Agents are configured via JSON or YAML files:

```json
{
  "agents": [
    {
      "id": "doc-agent",
      "type": "documentation",
      "settings": {
        "vectorDbPath": "./data/docs-vector-db",
        "downloadTimeout": 30000
      }
    },
    {
      "id": "dep-agent",
      "type": "dependency",
      "settings": {
        "scanFrequency": "weekly",
        "securityCheckEnabled": true
      }
    }
  ]
}
```

## Creating a New Agent

To create a new agent:

1. Create a new directory under `src/agents/[agent-type]`
2. Implement the Agent interface
3. Register capabilities in the agent registry
4. Create task handlers for the agent's responsibilities

## Example: Documentation Agent

```typescript
import { BaseAgent } from "../framework/base-agent";

export class DocumentationAgent extends BaseAgent {
  constructor(config) {
    super("documentation", config);

    this.registerCapability({
      name: "library-documentation",
      description: "Download and manage library documentation",
      taskTypes: ["documentation_update", "documentation_search"],
    });
  }

  async handleTask(task) {
    if (task.type === "documentation_update") {
      return this.handleDocumentationUpdate(task);
    } else if (task.type === "documentation_search") {
      return this.handleDocumentationSearch(task);
    }

    return task;
  }

  // Agent-specific methods...
}
```
