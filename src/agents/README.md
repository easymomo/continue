# AIgents Framework - Agent System

This directory contains the implementation of the AIgents multi-agent framework, designed to address the context limitations in AI IDEs by providing persistent memory and task management.

## Directory Structure

```
/agents
│
├── framework/               # Core framework components
│   ├── agent-registry.ts    # Agent registration and discovery system
│   ├── base-agent.ts        # Base agent class for extension
│   ├── message-bus.ts       # Inter-agent communication system
│   ├── memory-system.ts     # Persistent memory system
│   ├── task-manager.ts      # Task creation, assignment, and tracking
│   └── types.ts             # Type definitions for the framework
│
├── dependency-agent.ts      # Specialized agent for dependency management
│
└── examples/                # Example implementations using the framework
    └── dependency-example.ts  # Example using the dependency agent
```

## Framework Components

### Agent Registry

The Agent Registry serves as a central registration system for all agents in the framework. It maintains information about each agent's capabilities and the task types they can handle.

```typescript
// Example: Registering an agent
const myAgent = new MyCustomAgent();
await framework.registerAgent(myAgent);

// Example: Finding agents by capability
const securityAgents = framework.findAgentsByCapability("securityAudit");
```

### Task Manager

The Task Manager handles the creation, assignment, and execution of tasks within the framework. It ensures that tasks are properly tracked and that their state is persisted.

```typescript
// Example: Creating a task
const task = await framework.createTask({
  type: "code-analysis",
  priority: TaskPriority.HIGH,
  description: "Analyze the codebase for security vulnerabilities",
  data: { paths: ["src/"] },
  context: {},
});

// Example: Assigning a task to an agent
await framework.assignTask(task.id, securityAgent.id);
```

### Memory System

The Memory System provides persistent storage and retrieval of agent state and knowledge. It allows agents to store and retrieve information across sessions.

```typescript
// Example: Storing a memory item
const memoryItem = await memorySystem.storeMemory(
  "codebase-analysis",
  { vulnerabilities: [], fileCount: 120 },
  { projectId: "my-project", timestamp: Date.now() },
);

// Example: Querying memories
const analysisResults = memorySystem.getMemoriesByType("codebase-analysis");
```

### Message Bus

The Message Bus facilitates communication between agents in the framework. It supports both direct messages and broadcast messages.

```typescript
// Example: Sending a message to a specific agent
await messageBus.sendMessage(
  "security-agent",
  "project-manager",
  "vulnerability-found",
  { file: "src/app.js", severity: "high" },
);

// Example: Broadcasting a message to all agents
await messageBus.broadcastMessage("project-manager", "project-updated", {
  newFiles: ["src/components/new-feature.js"],
});
```

## Creating Custom Agents

Custom agents can be created by extending the BaseAgent class:

```typescript
import { BaseAgent } from "./framework/base-agent";
import { Task, TaskStatus } from "./framework/types";

export class MyCustomAgent extends BaseAgent {
  constructor() {
    super({
      name: "My Custom Agent",
      description: "Performs custom operations",
      version: "1.0.0",
      capabilities: {
        customOperation: true,
      },
      supportedTaskTypes: ["custom-task"],
    });
  }

  protected async onInitialize(): Promise<void> {
    // Initialization logic
  }

  protected async onHandleTask(task: Task): Promise<Task> {
    if (task.type === "custom-task") {
      // Handle the task
      task.status = TaskStatus.COMPLETED;
      task.result = { message: "Task completed successfully" };
    } else {
      task.status = TaskStatus.FAILED;
      task.error = "Unsupported task type";
    }

    return task;
  }

  protected async onHandleMessage(message: Message): Promise<void> {
    // Handle incoming messages
  }
}
```

## Current Status

For the current implementation status and upcoming work, please refer to the [Project Plan](../core/project-plan.md).

## Next Steps

1. Complete Base Agent testing with multiple specialized agents
2. Implement task stack management
3. Enhance memory system with vector storage
4. Begin Master Agent implementation
5. Start integration with VSCode extension API
