# Workflow Testing Guidelines

This guide outlines best practices for testing agent workflows in our system, based on lessons learned from the security workflow implementation.

## Core Testing Principles

1. **Isolate Tests from Dependencies**

   - Use mock implementations of the `TaskSystemAdapter` to avoid dependency on the full memory subsystem
   - Test workflow logic independently from agent communication logic
   - Create dedicated test fixtures for each workflow type

2. **Test Complete Workflows**

   - Test full paths from initial task creation to completion
   - Verify state transitions maintain data consistency
   - Validate artifact generation at each stage

3. **Maintain Type Safety**

   - Ensure mock implementations maintain the same type interfaces as production code
   - Be aware of TypeScript enum comparison issues in tests
   - Use type assertions and validation to catch type-related errors early

4. **Balance Isolation with Realism**
   - Mock dependencies but maintain realistic data structures
   - Validate behavior against real-world scenarios
   - Test both happy paths and error conditions

## Mock Implementation Pattern

Here's an example of a mock adapter for testing a security workflow:

```typescript
class MockSecurityTaskAdapter implements TaskSystemAdapter {
  private tasks: Map<string, SecurityTask> = new Map();
  private taskCounter = 0;
  private transitionLog: Array<{
    from: SecurityWorkflowStage;
    to: SecurityWorkflowStage;
  }> = [];

  // Create a new security task
  async createTask(data: Partial<SecurityTask>): Promise<string> {
    const taskId = `task-${++this.taskCounter}`;
    const newTask: SecurityTask = {
      id: taskId,
      currentStage: SecurityWorkflowStage.ASSESSMENT,
      vulnerabilities: [],
      artifacts: [],
      ...data,
    };
    this.tasks.set(taskId, newTask);
    return taskId;
  }

  // Retrieve a task by ID
  async getTask(id: string): Promise<SecurityTask> {
    const task = this.tasks.get(id);
    if (!task) {
      throw new Error(`Task not found: ${id}`);
    }
    return { ...task }; // Return a copy to prevent mutation
  }

  // Update a task with new data
  async updateTask(
    id: string,
    updates: Partial<SecurityTask>,
  ): Promise<boolean> {
    const task = this.tasks.get(id);
    if (!task) {
      return false;
    }

    // Log stage transitions for testing
    if (updates.currentStage && updates.currentStage !== task.currentStage) {
      this.transitionLog.push({
        from: task.currentStage,
        to: updates.currentStage,
      });

      // Validate transitions (optional, depending on test requirements)
      if (!isValidTransition(task.currentStage, updates.currentStage)) {
        throw new Error(
          `Invalid stage transition from ${task.currentStage} to ${updates.currentStage}`,
        );
      }
    }

    // Update the task with new data
    this.tasks.set(id, {
      ...task,
      ...updates,
    });

    return true;
  }

  // Get the transition log for verification
  getTransitionLog() {
    return [...this.transitionLog];
  }
}
```

## Workflow Stage Testing

### Define Test Cases for Transitions

Test each valid transition individually to isolate issues:

```typescript
describe("SecurityWorkflow stage transitions", () => {
  let adapter: MockSecurityTaskAdapter;
  let taskId: string;

  beforeEach(async () => {
    adapter = new MockSecurityTaskAdapter();
    taskId = await adapter.createTask({});
  });

  it("should transition from ASSESSMENT to ANALYSIS", async () => {
    const result = await adapter.updateTask(taskId, {
      currentStage: SecurityWorkflowStage.ANALYSIS,
      // Include stage-specific data updates
    });

    expect(result).toBe(true);

    const task = await adapter.getTask(taskId);
    expect(task.currentStage).toBe(SecurityWorkflowStage.ANALYSIS);
  });

  it("should reject invalid transition from ASSESSMENT to VERIFICATION", async () => {
    await expect(
      adapter.updateTask(taskId, {
        currentStage: SecurityWorkflowStage.VERIFICATION,
      }),
    ).rejects.toThrow(/Invalid stage transition/);
  });

  // Additional tests for each valid transition
});
```

### Test Full Workflow Paths

Test complete paths from initial state to completion:

```typescript
it("should progress through the complete security workflow", async () => {
  // Create task in initial stage
  const taskId = await adapter.createTask({});

  // Stage 1: ASSESSMENT → ANALYSIS
  await adapter.updateTask(taskId, {
    currentStage: SecurityWorkflowStage.ANALYSIS,
    artifacts: [
      {
        type: "SCOPE_DOCUMENT",
        content: "Security assessment scope",
      },
    ],
  });

  // Stage 2: ANALYSIS → VULNERABILITY_SCAN
  await adapter.updateTask(taskId, {
    currentStage: SecurityWorkflowStage.VULNERABILITY_SCAN,
    artifacts: [
      // Previous artifacts remain and new ones are added
      { type: "SCOPE_DOCUMENT", content: "Security assessment scope" },
      { type: "ANALYSIS_REPORT", content: "Security analysis findings" },
    ],
  });

  // Stage 3: VULNERABILITY_SCAN → REMEDIATION
  await adapter.updateTask(taskId, {
    currentStage: SecurityWorkflowStage.REMEDIATION,
    vulnerabilities: [
      {
        id: "vuln-1",
        severity: "HIGH",
        description: "SQL Injection vulnerability",
      },
    ],
  });

  // Stage 4: REMEDIATION → VERIFICATION
  await adapter.updateTask(taskId, {
    currentStage: SecurityWorkflowStage.VERIFICATION,
    vulnerabilities: [
      {
        id: "vuln-1",
        severity: "HIGH",
        description: "SQL Injection vulnerability",
        remediation: "Implemented prepared statements",
        status: "RESOLVED",
      },
    ],
  });

  // Stage 5: VERIFICATION → COMPLETED
  await adapter.updateTask(taskId, {
    currentStage: SecurityWorkflowStage.COMPLETED,
  });

  // Verify the final state
  const task = await adapter.getTask(taskId);
  expect(task.currentStage).toBe(SecurityWorkflowStage.COMPLETED);

  // Verify all transitions were recorded
  const transitions = adapter.getTransitionLog();
  expect(transitions.length).toBe(5);

  // Verify specific transitions if needed
  expect(transitions[0]).toEqual({
    from: SecurityWorkflowStage.ASSESSMENT,
    to: SecurityWorkflowStage.ANALYSIS,
  });
  // ... verify other transitions
});
```

## Common Pitfalls to Avoid

### TypeScript Enum Incompatibilities

**Problem:** TypeScript enums imported from different modules may not be correctly compared with `===`.

**Solution:** Convert enums to strings for comparison or use string literals in tests:

```typescript
// Instead of:
if (task.currentStage === SecurityWorkflowStage.ANALYSIS) {
  /* ... */
}

// Use:
if (
  task.currentStage.toString() === SecurityWorkflowStage.ANALYSIS.toString()
) {
  /* ... */
}

// Or better, use string literals in tests:
if (task.currentStage === "ANALYSIS") {
  /* ... */
}
```

### Missing Validation in Mocks

**Problem:** Mock implementations might skip validation logic present in production code.

**Solution:** Implement critical validation in mock classes to catch logical errors:

```typescript
async updateTask(id: string, updates: Partial<SecurityTask>): Promise<boolean> {
  // Always validate transitions, even in mocks
  if (updates.currentStage && task.currentStage !== updates.currentStage) {
    if (!isValidTransition(task.currentStage, updates.currentStage)) {
      throw new Error(`Invalid transition: ${task.currentStage} → ${updates.currentStage}`);
    }
  }

  // Continue with update...
}
```

### Over-Mocking

**Problem:** Creating overly simplistic mocks that don't catch real-world issues.

**Solution:** Retain essential behavior in mocks, particularly for:

- Data validation
- Stage transition rules
- Artifact consistency checks
- Error handling paths

### Insufficient Error Scenarios

**Problem:** Only testing happy paths without considering error scenarios.

**Solution:** Add specific test cases for common errors:

- Invalid stage transitions
- Missing required artifacts
- Malformed data
- Concurrency issues (if applicable)

## Test Artifact Collection

### State Transition Logs

Capture transition logs in your mock implementations to provide debugging information:

```typescript
class MockTaskAdapter {
  private transitionLog = [];

  // Log transitions in your update method
  async updateTask(id, updates) {
    if (updates.currentStage && task.currentStage !== updates.currentStage) {
      this.transitionLog.push({
        taskId: id,
        timestamp: new Date(),
        from: task.currentStage,
        to: updates.currentStage,
        data: updates,
      });
    }
    // Update implementation...
  }

  // Expose logs for test verification
  getTransitionLog() {
    return [...this.transitionLog];
  }
}
```

### Decision Point Documentation

Document key decision points in your workflow to enhance test documentation:

```typescript
it("should handle vulnerability remediation process", async () => {
  // Setup task...

  // DECISION POINT: Determine if vulnerabilities are serious enough for remediation
  const hasCriticalVulnerabilities = task.vulnerabilities.some(
    (v) => v.severity === "CRITICAL" || v.severity === "HIGH",
  );

  if (hasCriticalVulnerabilities) {
    await adapter.updateTask(taskId, {
      currentStage: SecurityWorkflowStage.REMEDIATION,
      // Update data...
    });

    // DECISION POINT: Determine if remediation was successful
    const remediationSuccessful = task.vulnerabilities.every(
      (v) => v.status === "RESOLVED" || v.severity === "LOW",
    );

    // Continue with verification if successful...
  }

  // Verify results...
});
```

By following these guidelines, your workflow tests will be more robust, maintainable, and effective at catching issues before they reach production.
