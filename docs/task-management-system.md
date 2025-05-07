_[← Back to Documentation Navigation](navigation.md)_

# AIgents Task Management System

## Overview

The AIgents Task Management System is a TypeScript framework designed to manage tasks and their contexts, with a focus on maintaining context throughout task transitions. This system provides developers with a structured approach to handling complex workflows where task boundaries and context preservation are essential.

## Core Components

The system consists of six primary components, each with a specific responsibility:

### 1. Task Verifier

The Task Verifier component ensures that tasks and task operations meet the required criteria before execution. It provides validation for:

- Task creation: Verifies that new tasks have all required properties
- Task transitions: Validates state changes from one status to another
- Task boundaries: Ensures proper parent-child relationships and context transfer
- Context availability: Checks if relevant context is available for operations

```typescript
interface TaskVerificationResult {
  verified: boolean;
  errors: string[];
  warnings: string[];
}

class TaskVerifier {
  verifyTaskCreation(taskData: TaskData): TaskVerificationResult;
  verifyTaskTransition(
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
  ): TaskVerificationResult;
  verifyTaskBoundaries(
    taskId: string,
    relatedTaskId: string,
  ): TaskVerificationResult;
  verifyContextAvailability(taskId: string): TaskVerificationResult;
}
```

### 2. Task Relationship Manager

The Task Relationship Manager handles parent-child relationships between tasks, allowing for hierarchical task structures:

- Create parent-child relationships
- Navigate task hierarchies
- Query child or parent tasks
- Validate relationship constraints

```typescript
class TaskRelationshipManager {
  createParentChildRelationship(
    parentTaskId: string,
    childTaskId: string,
  ): Promise<boolean>;
  getChildTasks(parentTaskId: string): Promise<Task[]>;
  getParentTask(childTaskId: string): Promise<Task | null>;
  removeRelationship(
    parentTaskId: string,
    childTaskId: string,
  ): Promise<boolean>;
  getTaskLineage(taskId: string): Promise<Task[]>;
}
```

### 3. Task Context Manager

The Task Context Manager preserves and transfers context between tasks:

- Store task-specific context
- Retrieve context when needed
- Transfer context between tasks
- Compare contexts to identify changes

```typescript
interface TaskContext {
  taskId: string;
  data: Record<string, any>;
  metadata: Record<string, any>;
  environmentState: Record<string, any>;
  resources: Record<string, string>;
  timestamp: number;
}

class TaskContextManager {
  captureContext(
    taskId: string,
    context: Partial<TaskContext>,
  ): Promise<boolean>;
  getContext(taskId: string): Promise<TaskContext | null>;
  transferContext(
    sourceTaskId: string,
    targetTaskId: string,
    options?: ContextTransferOptions,
  ): Promise<boolean>;
  compareContexts(
    sourceTaskId: string,
    targetTaskId: string,
  ): Promise<ContextDiff>;
}
```

### 4. Task Transition Manager

The Task Transition Manager handles task state transitions:

- Change task status (e.g., from "planned" to "in_progress")
- Validate transitions according to allowed workflows
- Execute pre-transition and post-transition hooks
- Track transition history

```typescript
type TaskStatus = "planned" | "in_progress" | "completed" | "cancelled";

class TaskTransitionManager {
  transitionTask(
    taskId: string,
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
  ): Promise<boolean>;
  getAvailableTransitions(taskStatus: TaskStatus): TaskStatus[];
  validateTransition(fromStatus: TaskStatus, toStatus: TaskStatus): boolean;
  getTransitionHistory(taskId: string): Promise<TaskTransition[]>;
}
```

### 5. Task Lifecycle Manager

The Task Lifecycle Manager provides hooks for custom logic execution at different points in the task lifecycle:

- Pre-creation hooks
- Post-creation hooks
- Pre-transition hooks
- Post-transition hooks
- Pre-completion hooks
- Post-completion hooks

```typescript
type LifecycleHook = (taskId: string, data: any) => Promise<void>;

class TaskLifecycleManager {
  registerPreCreationHook(hook: LifecycleHook): void;
  registerPostCreationHook(hook: LifecycleHook): void;
  registerPreTransitionHook(
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    hook: LifecycleHook,
  ): void;
  registerPostTransitionHook(
    fromStatus: TaskStatus,
    toStatus: TaskStatus,
    hook: LifecycleHook,
  ): void;
  registerPreCompletionHook(hook: LifecycleHook): void;
  registerPostCompletionHook(hook: LifecycleHook): void;
}
```

### 6. Task Manager

The Task Manager serves as the entry point to the system, integrating all other components through a unified API:

- Create, update, and delete tasks
- Transition task states
- Manage task hierarchies
- Handle task context
- Execute lifecycle hooks

```typescript
class TaskManager {
  // Task operations
  createTask(taskData: TaskData): Promise<string>;
  updateTask(taskId: string, taskData: Partial<TaskData>): Promise<boolean>;
  deleteTask(taskId: string): Promise<boolean>;
  getTask(taskId: string): Promise<Task | null>;

  // Task state transitions
  startTask(taskId: string): Promise<boolean>;
  completeTask(taskId: string): Promise<boolean>;
  cancelTask(taskId: string): Promise<boolean>;

  // Task relationships
  createChildTask(parentTaskId: string, taskData: TaskData): Promise<string>;
  getChildTasks(parentTaskId: string): Promise<Task[]>;
  getParentTask(childTaskId: string): Promise<Task | null>;

  // Task context
  captureTaskContext(
    taskId: string,
    context: Partial<TaskContext>,
  ): Promise<boolean>;
  getTaskContext(taskId: string): Promise<TaskContext | null>;
  transferTaskContext(
    sourceTaskId: string,
    targetTaskId: string,
  ): Promise<boolean>;

  // Batch operations
  batchUpdateTasks(
    taskIds: string[],
    updates: Partial<TaskData>,
  ): Promise<Record<string, boolean>>;
  batchTransitionTasks(
    taskIds: string[],
    toStatus: TaskStatus,
  ): Promise<Record<string, boolean>>;
}
```

## Core Concepts

### Tasks

Tasks are the fundamental units of work within the system. Each task has the following properties:

```typescript
interface Task {
  id: string; // Unique identifier
  name: string; // Task name
  description: string; // Task description
  status: TaskStatus; // Current status
  priority: "low" | "medium" | "high"; // Priority level
  steps?: TaskStep[]; // Optional sub-items
  metadata?: Record<string, any>; // Additional information
  created: number; // Creation timestamp
  updated: number; // Last update timestamp
  parentId?: string; // Optional parent task ID
}

interface TaskStep {
  id: string;
  description: string;
  completed: boolean;
}
```

### Task Status

Tasks can be in one of the following statuses:

- `planned`: Task is defined but not yet started
- `in_progress`: Task is currently being worked on
- `completed`: Task has been successfully finished
- `cancelled`: Task has been terminated before completion

### Task Context

Context represents the environment and state associated with a task:

```typescript
interface TaskContext {
  taskId: string; // Associated task ID
  data: Record<string, any>; // Task-specific data
  metadata: Record<string, any>; // Additional metadata
  environmentState: Record<string, any>; // Environment variables and state
  resources: Record<string, string>; // References to resources
  timestamp: number; // When context was captured
}
```

### Task Verification

Task verification ensures operations meet requirements before execution:

```typescript
interface TaskVerificationResult {
  verified: boolean; // Whether verification passed
  errors: string[]; // Critical issues
  warnings: string[]; // Non-critical issues
}

interface TaskVerificationOptions {
  strictMode?: boolean; // Whether to enforce all rules
  checkContextAvailability?: boolean; // Whether to check for context
  checkParentTask?: boolean; // Whether to validate parent task
  checkChildTasks?: boolean; // Whether to validate child tasks
}
```

## Data Flow

The typical data flow through the system follows these steps:

1. Task creation request is received by the Task Manager
2. Task Verifier validates the task data
3. Task Lifecycle Manager executes pre-creation hooks
4. Task is created and stored
5. Task Lifecycle Manager executes post-creation hooks
6. Task Relationship Manager establishes parent-child relationships if needed
7. Task Context Manager captures initial context

When transitioning a task:

1. Transition request is received by the Task Manager
2. Task Verifier validates the transition
3. Task Lifecycle Manager executes pre-transition hooks
4. Task Transition Manager performs the transition
5. Task Lifecycle Manager executes post-transition hooks
6. Task Context Manager updates context if necessary

## Integration Guide

### Installation

```bash
npm install aigents-task-management
```

### Basic Setup

```typescript
import { TaskManager } from "aigents-task-management";

// Initialize with default configuration
const taskManager = new TaskManager();

// Or with custom configuration
const taskManager = new TaskManager({
  storage: customStorageAdapter,
  strictVerification: true,
  contextRetentionDays: 30,
});
```

### Creating Tasks

```typescript
// Create a main task
const mainTaskId = await taskManager.createTask({
  name: "Implement Feature X",
  description: "Complete implementation of Feature X",
  priority: "high",
  steps: [
    { id: "step1", description: "Design API", completed: false },
    { id: "step2", description: "Implement backend", completed: false },
    { id: "step3", description: "Create frontend", completed: false },
  ],
});

// Create a child task
const childTaskId = await taskManager.createChildTask(mainTaskId, {
  name: "API Design",
  description: "Design the API endpoints for Feature X",
  priority: "high",
});
```

### Task Transitions

```typescript
// Start a task
await taskManager.startTask(taskId);

// Complete a task
await taskManager.completeTask(taskId);

// Cancel a task
await taskManager.cancelTask(taskId);
```

### Managing Context

```typescript
// Capture task context
await taskManager.captureTaskContext(taskId, {
  data: {
    codeFiles: ["src/components/Feature.tsx", "src/api/feature.ts"],
    currentStep: "API design",
  },
  metadata: {
    relatedTicket: "PROJ-123",
    estimatedHours: 4,
  },
});

// Retrieve task context
const context = await taskManager.getTaskContext(taskId);

// Transfer context between tasks
await taskManager.transferTaskContext(sourceTaskId, targetTaskId);
```

### Custom Lifecycle Hooks

```typescript
// Register a post-creation hook
taskManager.lifecycle.registerPostCreationHook(async (taskId, data) => {
  console.log(`Task ${taskId} created`);
  await notifyTeam(taskId);
});

// Register a pre-completion hook
taskManager.lifecycle.registerPreCompletionHook(async (taskId) => {
  const task = await taskManager.getTask(taskId);
  if (task && task.steps && task.steps.some((step) => !step.completed)) {
    throw new Error("Cannot complete task with incomplete steps");
  }
});
```

## Advanced Usage

### Batch Operations

```typescript
// Update multiple tasks
const updateResults = await taskManager.batchUpdateTasks(
  ["task1", "task2", "task3"],
  { priority: "high" },
);

// Transition multiple tasks
const transitionResults = await taskManager.batchTransitionTasks(
  ["task1", "task2", "task3"],
  "completed",
);
```

### Context Diff

```typescript
// Compare contexts between tasks
const diff = await taskManager.context.compareContexts(taskId1, taskId2);

console.log("Added:", diff.added);
console.log("Removed:", diff.removed);
console.log("Modified:", diff.modified);
```

### Custom Verification

```typescript
// Create custom verification rules
taskManager.verifier.addCustomVerificationRule((task) => {
  if (task.priority === "high" && !task.description) {
    return {
      verified: false,
      errors: ["High priority tasks must have a description"],
    };
  }
  return { verified: true, errors: [], warnings: [] };
});
```

## Error Handling

The system uses a consistent error handling pattern:

```typescript
try {
  const taskId = await taskManager.createTask({
    name: "Task without description",
  });
} catch (error) {
  if (error instanceof TaskValidationError) {
    console.error("Validation failed:", error.details);
  } else if (error instanceof StorageError) {
    console.error("Storage operation failed:", error.message);
  } else {
    console.error("Unknown error:", error);
  }
}
```

## Performance Considerations

- Use batch operations when working with multiple tasks
- Limit context size to prevent memory issues
- Consider caching for frequently accessed tasks
- Use pagination when retrieving large sets of tasks
- Implement cleanup procedures for completed tasks

## Security Considerations

- Implement proper access control for task operations
- Sanitize and validate all user input
- Avoid storing sensitive information in task context
- Encrypt task data when necessary
- Implement audit logging for critical operations

## Best Practices

1. Define clear task boundaries
2. Establish a consistent task hierarchy
3. Capture relevant context at each stage
4. Use verification to ensure data integrity
5. Implement appropriate lifecycle hooks
6. Document task workflows and transitions
7. Handle errors gracefully and provide meaningful feedback
8. Regularly clean up completed and canceled tasks

## Extension Points

The system provides several extension points:

- Custom storage adapters
- Custom verification rules
- Lifecycle hooks
- Context transformation plugins
- Custom task transition workflows

## Troubleshooting

### Common Issues

1. **Task verification failures**: Check the verification result errors for specific issues.
2. **Context transfer failures**: Ensure both source and target tasks exist and have compatible structures.
3. **Transition errors**: Verify that the requested transition is allowed in the current workflow.
4. **Relationship errors**: Check that both parent and child tasks exist and don't create circular references.

### Debugging

Enable debug mode for detailed logging:

```typescript
const taskManager = new TaskManager({
  debug: true,
  logLevel: "verbose",
});
```

## Conclusion

The AIgents Task Management System provides a comprehensive framework for managing tasks, their relationships, and contexts. By focusing on task boundaries and context preservation, it enables developers to build robust workflows that maintain state throughout complex operations.
