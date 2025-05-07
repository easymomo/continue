# Agent Task System Architecture

This document outlines the architecture of our agent task system, describing how we've structured agents to work with the memory subsystem for efficient task management and context preservation.

## Core Architecture

Our agent system is built on a layered architecture that separates agent logic from task and memory management:

```
┌─────────────────────────────────────┐
│           Agent Classes             │
│  (ResearchAgent, SecurityAgent...)  │
├─────────────────────────────────────┤
│         Task System Adapter         │
├─────────────────────────────────────┤
│            Task Managers            │
│  (Research, Security, Developer...) │
├─────────────────────────────────────┤
│         Memory Subsystem            │
│  (Storage, Transactions, Context)   │
└─────────────────────────────────────┘
```

### Key Components

1. **Agent Classes**

   - Represent different agent types (Research, Security, Developer)
   - Process user messages and generate responses
   - Delegate task management to specialized components

2. **Task System Adapter**

   - Provides a simplified interface to the memory system
   - Handles task creation, retrieval, and updates
   - Manages context for agent interactions

3. **Task Managers**

   - Implement domain-specific workflows
   - Define and enforce valid task transitions
   - Create and manage task artifacts

4. **Memory Subsystem**
   - Provides persistent storage
   - Implements transactional operations
   - Maintains context and relationships

## Workflow Pattern

We've implemented a consistent workflow pattern across all agent types:

```
┌───────────┐     ┌───────────┐     ┌───────────┐     ┌───────────┐
│  Message  │────▶│  Extract  │────▶│  Process  │────▶│  Update   │
│  Received │     │   Task    │     │    by     │     │   Task    │
└───────────┘     │  Context  │     │   Stage   │     │  State    │
                  └───────────┘     └───────────┘     └───────────┘
                                          │
                                          ▼
                                    ┌───────────┐
                                    │ Determine │
                                    │   Next    │
                                    │   Stage   │
                                    └───────────┘
```

### Workflow Stages

Each agent type defines its own set of workflow stages that model its specific domain:

1. **Research Agent Stages**

   - PLANNING
   - GATHERING
   - ANALYZING
   - SYNTHESIZING
   - REPORTING
   - COMPLETED

2. **Security Agent Stages**

   - ASSESSMENT
   - ANALYSIS
   - VULNERABILITY_SCAN
   - REMEDIATION
   - VERIFICATION
   - COMPLETED

3. **Developer Agent Stages**
   - PLANNING
   - DESIGNING
   - IMPLEMENTING
   - TESTING
   - REVIEWING
   - REFACTORING
   - DOCUMENTING
   - COMPLETED

## Task System Adapter Pattern

The Task System Adapter pattern provides a clean interface between agents and the memory system:

```typescript
// Task System Adapter Interface
interface TaskSystemAdapter {
  // Task Management
  createTask(data: any): Promise<string>;
  getTask(id: string): Promise<any>;
  updateTask(id: string, updates: any): Promise<boolean>;

  // Memory Operations
  storeMemory(memory: any): Promise<void>;
  queryMemories(query: any): Promise<any[]>;

  // Context Management
  createContext(name: string): Promise<string>;
  getCurrentContext(): Promise<any>;
  addToContext(contextId: string, data: any): Promise<void>;
}
```

This pattern offers several benefits:

1. **Loose Coupling**: Agents are not tightly coupled to the memory implementation
2. **Testability**: Easy to create mock implementations for testing
3. **Flexibility**: Can swap implementation details without changing agent logic

## Agent Integration

Agents integrate with the task system using the following pattern:

```typescript
class ExampleAgent extends BaseAgent {
  private taskSystemAdapter: TaskSystemAdapter;
  private taskManager: ExampleTaskManager;

  constructor(/* parameters */) {
    super(/* parameters */);
    this.taskSystemAdapter = createTaskSystemAdapter(/* config */);
    this.taskManager = new ExampleTaskManager(this.taskSystemAdapter);
  }

  async process(message: any): Promise<any> {
    // 1. Extract task context from message
    const taskContext = await this.extractTaskContext(message);

    // 2. Get or create task
    let taskId = taskContext.taskId;
    if (!taskId) {
      taskId = await this.taskManager.createTask(/* initial data */);
    }

    // 3. Retrieve current task state
    const task = await this.taskManager.getTask(taskId);

    // 4. Process based on current stage
    let response;
    switch (task.currentStage) {
      case ExampleWorkflowStage.STAGE_ONE:
        response = await this.handleStageOne(message, task);
        break;
      case ExampleWorkflowStage.STAGE_TWO:
        response = await this.handleStageTwo(message, task);
        break;
      // ... other stages
    }

    // 5. Determine next stage if needed
    const nextStage = this.determineNextStage(message, task);
    if (nextStage && nextStage !== task.currentStage) {
      await this.taskManager.updateTask(taskId, {
        currentStage: nextStage,
      });
    }

    // 6. Store decision and return response
    await this.taskSystemAdapter.storeMemory({
      type: "decision",
      taskId,
      content: response,
      timestamp: new Date(),
    });

    return response;
  }

  // Stage-specific handler methods...
}
```

## Task Manager Implementation

Task managers handle the domain-specific aspects of workflow:

```typescript
class ExampleTaskManager {
  constructor(private taskAdapter: TaskSystemAdapter) {}

  async createTask(data: Partial<ExampleTask> = {}): Promise<string> {
    return this.taskAdapter.createTask({
      currentStage: ExampleWorkflowStage.INITIAL_STAGE,
      artifacts: [],
      // Other default properties
      ...data,
    });
  }

  async getTask(id: string): Promise<ExampleTask> {
    return this.taskAdapter.getTask(id);
  }

  async updateTask(
    id: string,
    updates: Partial<ExampleTask>,
  ): Promise<boolean> {
    // Validate stage transition if changing stages
    if (updates.currentStage) {
      const task = await this.getTask(id);
      if (!this.isValidTransition(task.currentStage, updates.currentStage)) {
        throw new Error(
          `Invalid stage transition from ${task.currentStage} to ${updates.currentStage}`,
        );
      }
    }

    return this.taskAdapter.updateTask(id, updates);
  }

  isValidTransition(
    from: ExampleWorkflowStage,
    to: ExampleWorkflowStage,
  ): boolean {
    const validTransitions = {
      [ExampleWorkflowStage.INITIAL_STAGE]: [ExampleWorkflowStage.NEXT_STAGE],
      // Define other valid transitions
    };

    return validTransitions[from]?.includes(to) || false;
  }
}
```

## Testing Approach

The architecture enables effective testing through the use of mock adapters:

```typescript
// Mock adapter for testing
class MockTaskAdapter implements TaskSystemAdapter {
  private tasks = new Map<string, any>();

  async createTask(data: any): Promise<string> {
    const id = `task-${Date.now()}`;
    this.tasks.set(id, data);
    return id;
  }

  async getTask(id: string): Promise<any> {
    return this.tasks.get(id);
  }

  async updateTask(id: string, updates: any): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) return false;
    this.tasks.set(id, { ...task, ...updates });
    return true;
  }

  // Other method implementations...
}

// Test example
async function testAgentWorkflow() {
  const mockAdapter = new MockTaskAdapter();
  const agent = new ExampleAgent(/* params */);
  agent.useTaskAdapter(mockAdapter);

  // Test workflow progression
  const response1 = await agent.process({ text: "Start task" });
  const response2 = await agent.process({ text: "Continue task" });

  // Verify task state
  const tasks = await mockAdapter.listTasks();
  // Assert expected state
}
```

## Best Practices

1. **Separate Agent Logic from Task Management**

   - Agent classes focus on message processing
   - Task managers handle domain-specific workflow logic
   - Adapters abstract memory system details

2. **Define Clear Stage Transitions**

   - Document valid transitions between stages
   - Enforce validation in task managers
   - Create visual workflow diagrams for reference

3. **Maintain Type Safety**

   - Define explicit types for tasks and artifacts
   - Use string literal types for workflow stages
   - Leverage TypeScript to catch errors early

4. **Implement Comprehensive Testing**
   - Create mock adapters for unit testing
   - Test individual stage transitions
   - Verify complete workflow paths

## Future Directions

1. **Standardized Task System**

   - Further standardize the task system interface
   - Create base classes for common patterns
   - Develop reusable testing utilities

2. **Enhanced Workflow Visualization**

   - Generate workflow diagrams from code
   - Provide runtime visualization of task state
   - Implement monitoring dashboards

3. **Optimization for Performance**
   - Implement caching for frequently accessed tasks
   - Optimize memory operations for large datasets
   - Profile and improve critical paths
