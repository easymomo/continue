_[← Back to Documentation Navigation](navigation.md)_

# Task Management System API Reference

This document provides a quick reference to the types, interfaces, and methods available in the task management system.

## Core Types and Interfaces

### Task

```typescript
interface Task {
  id: string;
  parentId?: string;
  name: string;
  description: string;
  status: "planned" | "in_progress" | "completed" | "cancelled";
  createdAt: number;
  updatedAt: number;
  completedAt?: number;
  planReference: { elementId: string; version: number };
  priority: "low" | "medium" | "high";
  metadata: Record<string, any>;
  steps: TaskStep[];
  contextMarkers: ContextMarker[];
}
```

### Context

```typescript
interface Context {
  id: string;
  taskId: string;
  timestamp: number;
  codebaseState: string;
  components: ContextComponent[];
  validationResult?: ContextValidationResult;
  metadata?: Record<string, any>;
}
```

### TaskCreateData

```typescript
interface TaskCreateData {
  name: string;
  description: string;
  priority?: "low" | "medium" | "high";
  planReference?: { elementId: string; version: number };
  metadata?: Record<string, any>;
  steps?: Array<{ name: string; description?: string }>;
}
```

### TaskVerificationResult

```typescript
interface TaskVerificationResult {
  verified: boolean;
  errors: string[];
  warnings: string[];
}
```

### TaskVerificationOptions

```typescript
interface TaskVerificationOptions {
  strictMode?: boolean;
  checkContextAvailability?: boolean;
  checkParentTask?: boolean;
  checkChildTasks?: boolean;
}
```

### TaskTransitionResult

```typescript
interface TaskTransitionResult {
  success: boolean;
  taskId: string;
  previousStatus: Task["status"];
  newStatus: Task["status"];
  verificationResult?: TaskVerificationResult;
  timestamp: number;
  message?: string;
}
```

### TaskTransitionOptions

```typescript
interface TaskTransitionOptions {
  verificationOptions?: TaskVerificationOptions;
  force?: boolean;
  cascadeToChildren?: boolean;
  preserveContext?: boolean;
}
```

### TaskContextOptions

```typescript
interface TaskContextOptions {
  captureEnvironment?: boolean;
  captureCodeState?: boolean;
  captureTaskState?: boolean;
  deepCopy?: boolean;
}
```

### ContextTransferOptions

```typescript
interface ContextTransferOptions extends TaskContextOptions {
  mergeStrategy?: "replace" | "merge" | "append";
  preserveHistory?: boolean;
}
```

### TaskManagerOptions

```typescript
interface TaskManagerOptions {
  verificationOptions?: TaskVerificationOptions;
  transitionOptions?: TaskTransitionOptions;
  contextOptions?: TaskContextOptions;
}
```

## TaskVerifier

```typescript
class TaskVerifier {
  constructor(lifecycleManager: TaskLifecycleManager);

  async verifyTaskCreation(
    taskData: any,
    options?: TaskVerificationOptions,
  ): Promise<TaskVerificationResult>;

  async verifyTaskTransition(
    task: Task,
    newStatus: Task["status"],
    options?: TaskVerificationOptions,
  ): Promise<TaskVerificationResult>;

  async verifyTaskBoundary(
    currentTask: Task | null,
    nextTask: Task,
    options?: TaskVerificationOptions,
  ): Promise<TaskVerificationResult>;

  async verifyTaskContext(
    taskId: string,
    options?: TaskVerificationOptions,
  ): Promise<TaskVerificationResult>;

  getRecommendations(result: TaskVerificationResult): string[];
}
```

## TaskRelationshipManager

```typescript
class TaskRelationshipManager {
  constructor(transactionManager: TransactionManager);

  async initialize(): Promise<void>;

  async createChildTask(
    parentId: string,
    taskData: TaskCreateData,
  ): Promise<string>;

  async getChildTasks(taskId: string): Promise<Task[]>;

  async getParentTask(taskId: string): Promise<Task | undefined>;

  async getTaskLineage(taskId: string): Promise<Task[]>;

  async isDescendantOf(
    taskId: string,
    potentialAncestorId: string,
  ): Promise<boolean>;

  async getRelatedTasks(taskId: string): Promise<Task[]>;

  async updateTaskParent(taskId: string, newParentId: string): Promise<void>;

  async removeRelationship(parentId: string, childId: string): Promise<boolean>;

  async getAllRelationships(): Promise<TaskRelationship[]>;
}
```

## TaskContextManager

```typescript
class TaskContextManager {
  async captureTaskContext(
    task: Task,
    options?: TaskContextOptions,
  ): Promise<Context>;

  async getTaskContext(taskId: string): Promise<Context | undefined>;

  async transferContext(
    sourceTaskId: string,
    targetTaskId: string,
    options?: ContextTransferOptions,
  ): Promise<boolean>;

  async validateTaskContext(taskId: string): Promise<{
    valid: boolean;
    message?: string;
    missingComponents?: string[];
  }>;

  clearTaskContext(taskId: string): boolean;

  async getContextDiff(
    taskId1: string,
    taskId2: string,
  ): Promise<{
    added: ContextComponent[];
    removed: ContextComponent[];
    modified: ContextComponent[];
  }>;

  async getContextHistory(taskId: string): Promise<{
    contexts: Context[];
    transitions: Array<{ from: string; to: string; timestamp: number }>;
  }>;
}
```

## TaskTransitionManager

```typescript
class TaskTransitionManager {
  constructor(
    verifier: TaskVerifier,
    relationshipManager: TaskRelationshipManager,
    lifecycleManager: TaskLifecycleManager,
  );

  async transitionTask(
    taskId: string,
    newStatus: Task["status"],
    options?: TaskTransitionOptions,
  ): Promise<TaskTransitionResult>;

  async startTask(
    taskId: string,
    options?: TaskTransitionOptions,
  ): Promise<TaskTransitionResult>;

  async completeTask(
    taskId: string,
    options?: TaskTransitionOptions,
  ): Promise<TaskTransitionResult>;

  async cancelTask(
    taskId: string,
    options?: TaskTransitionOptions,
  ): Promise<TaskTransitionResult>;

  async transitionBetweenTasks(
    currentTaskId: string | null,
    nextTaskId: string,
    options?: TaskTransitionOptions,
  ): Promise<TaskTransitionResult>;

  async batchTransition(
    taskIds: string[],
    newStatus: Task["status"],
    options?: TaskTransitionOptions,
  ): Promise<TaskTransitionResult[]>;

  async getTransitionRecommendations(taskId: string): Promise<{
    nextStates: Task["status"][];
    recommendations: string[];
  }>;
}
```

## TaskLifecycleManager

```typescript
class TaskLifecycleManager {
  registerPreCreateHook(hook: PreCreateHook): void;
  registerPostCreateHook(hook: PostCreateHook): void;
  registerPreStartHook(hook: PreStartHook): void;
  registerPostStartHook(hook: PostStartHook): void;
  registerPreCompleteHook(hook: PreCompleteHook): void;
  registerPostCompleteHook(hook: PostCompleteHook): void;
  registerPreCancelHook(hook: PreCancelHook): void;
  registerPostCancelHook(hook: PostCancelHook): void;

  async triggerPreCreateHook(taskData: TaskCreateData): Promise<void>;
  async triggerPostCreateHook(task: Task): Promise<void>;
  async triggerPreStartHook(taskId: string): Promise<void>;
  async triggerPostStartHook(task: Task): Promise<void>;
  async triggerPreCompleteHook(taskId: string): Promise<void>;
  async triggerPostCompleteHook(task: Task): Promise<void>;
  async triggerPreCancelHook(taskId: string): Promise<void>;
  async triggerPostCancelHook(task: Task): Promise<void>;

  removePreCreateHook(hook: PreCreateHook): boolean;
  removePostCreateHook(hook: PostCreateHook): boolean;
  removePreStartHook(hook: PreStartHook): boolean;
  removePostStartHook(hook: PostStartHook): boolean;
  removePreCompleteHook(hook: PreCompleteHook): boolean;
  removePostCompleteHook(hook: PostCompleteHook): boolean;
  removePreCancelHook(hook: PreCancelHook): boolean;
  removePostCancelHook(hook: PostCancelHook): boolean;

  canTransitionTo(
    currentStatus: Task["status"],
    newStatus: Task["status"],
  ): boolean;

  getLifecycleEventDescription(
    event: "create" | "start" | "complete" | "cancel",
  ): string;

  clearAllHooks(): void;
}
```

## TaskManager

```typescript
class TaskManager {
  constructor(transactionManager: TransactionManager);

  async createTask(
    taskData: any,
    options?: TaskManagerOptions,
  ): Promise<string>;

  async createChildTask(
    parentId: string,
    taskData: any,
    options?: TaskManagerOptions,
  ): Promise<string>;

  async startTask(
    taskId: string,
    options?: TaskManagerOptions,
  ): Promise<boolean>;

  async completeTask(
    taskId: string,
    options?: TaskManagerOptions,
  ): Promise<boolean>;

  async cancelTask(
    taskId: string,
    options?: TaskManagerOptions,
  ): Promise<boolean>;

  async switchTasks(
    fromTaskId: string | null,
    toTaskId: string,
    options?: TaskManagerOptions & { transferContext?: boolean },
  ): Promise<boolean>;

  async getTask(taskId: string): Promise<Task>;

  async getChildTasks(taskId: string): Promise<Task[]>;

  async getParentTask(taskId: string): Promise<Task | undefined>;

  async getTaskLineage(taskId: string): Promise<Task[]>;

  async verifyTask(
    task: Task,
    operation: "create" | "transition" | "boundary",
    options?: { newStatus?: Task["status"]; nextTask?: Task },
  ): Promise<boolean>;

  async getTaskContext(taskId: string): Promise<any>;

  async compareTaskContexts(taskId1: string, taskId2: string): Promise<any>;
}
```

## Type Definitions

```typescript
type PreCreateHook = (taskData: TaskCreateData) => Promise<void>;
type PostCreateHook = (task: Task) => Promise<void>;
type PreStartHook = (taskId: string) => Promise<void>;
type PostStartHook = (task: Task) => Promise<void>;
type PreCompleteHook = (taskId: string) => Promise<void>;
type PostCompleteHook = (task: Task) => Promise<void>;
type PreCancelHook = (taskId: string) => Promise<void>;
type PostCancelHook = (task: Task) => Promise<void>;
```
