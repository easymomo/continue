# Workflow Testing Guidelines

This document outlines recommended approaches and best practices for testing agent workflows, based on lessons learned from security and developer agent implementation.

## Core Principles

1. **Isolate from external dependencies** - Create mock implementations for testing that don't require the full task system
2. **Test complete workflows** - Verify entire sequences rather than just individual transitions
3. **Maintain type safety** - Ensure test implementations match production interfaces
4. **Balance isolation with realism** - Mock implementations should mimic real behavior accurately

## Mock Implementation Pattern

When testing workflows, use this pattern for creating test-specific implementations:

```typescript
// Example mock adapter for security workflow testing
class MockSecurityTaskAdapter implements TaskSystemAdapter {
  private tasks: Map<string, any> = new Map();
  private currentTaskId: string | null = null;

  // Implement required methods with simplified in-memory storage
  async createTask(metadata: any): Promise<string> {
    const taskId = `task-${Date.now()}`;
    this.tasks.set(taskId, {
      id: taskId,
      metadata,
      createdAt: new Date().toISOString(),
    });
    this.currentTaskId = taskId;
    return taskId;
  }

  // Other adapter methods...
}
```

## Workflow Stage Testing

For testing workflow stage transitions:

1. **Define test cases for each valid transition**
2. **Include negative test cases** for invalid transitions
3. **Verify state consistency** before and after transitions
4. **Test entire workflow paths** from start to completion

Example test structure:

```typescript
describe("Security Workflow", () => {
  let taskManager: SecurityTaskManager;
  let mockAdapter: MockSecurityTaskAdapter;

  beforeEach(() => {
    mockAdapter = new MockSecurityTaskAdapter();
    taskManager = new SecurityTaskManager(mockAdapter);
  });

  it("should create a security task in ASSESSMENT stage", async () => {
    // Test implementation
  });

  it("should transition from ASSESSMENT to ANALYSIS with valid data", async () => {
    // Test implementation
  });

  it("should reject invalid stage transitions", async () => {
    // Test implementation
  });

  it("should complete full workflow from ASSESSMENT to COMPLETED", async () => {
    // Test entire workflow path
  });
});
```

## Common Pitfalls to Avoid

1. **TypeScript enum incompatibilities** - Use string literals or object constants instead of enums in test files
2. **Missing validation in mocks** - Include basic validation even in test implementations
3. **Over-mocking behavior** - Balance between simplified mocks and realistic behavior
4. **Insufficient error scenarios** - Test both happy paths and error conditions

## Testing Artifacts

Consider capturing these artifacts during workflow testing:

1. State transitions logs
2. Generated metadata at each stage
3. Decision points and validation results
4. Complete workflow traces for debugging

By following these guidelines, workflow tests will be more reliable, maintainable, and effective at catching edge cases and integration issues.
