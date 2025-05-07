_[← Back to Documentation Navigation](navigation.md)_

# Task Management System Examples

This document provides example code for common task management scenarios to help you get started with integrating the system into your application.

## Basic Setup

```typescript
import { TransactionManager } from "../persistence/transaction";
import { StorageManager } from "../persistence/storage";
import { TaskManager } from "../memory/tasks";

// Create storage and transaction managers
const storageManager = new StorageManager({
  type: "memory",
  path: "./storage",
});

const transactionManager = new TransactionManager(storageManager);

// Initialize the task manager
const taskManager = new TaskManager(transactionManager);
```

## Task Creation and Hierarchy

### Creating a Main Task

```typescript
// Create a main task
const mainTaskId = await taskManager.createTask({
  name: "Implement Feature X",
  description: "Complete implementation of feature X with all components",
  priority: "high",
  metadata: {
    requiredBy: "Sprint 3",
    estimatedTime: "5 days",
  },
});

console.log(`Created main task: ${mainTaskId}`);
```

### Creating Subtasks

```typescript
// Create child tasks
const designTaskId = await taskManager.createChildTask(mainTaskId, {
  name: "Design Feature X",
  description: "Create design documents and mockups for Feature X",
  priority: "high",
  steps: [
    { name: "Research existing solutions", description: "Look at competitors" },
    { name: "Create wireframes", description: "Draft initial UI layouts" },
    { name: "Create detailed mockups", description: "Detailed UI designs" },
  ],
});

const implementTaskId = await taskManager.createChildTask(mainTaskId, {
  name: "Implement Backend for Feature X",
  description: "Code the backend services for Feature X",
  priority: "medium",
  steps: [
    { name: "Create data models", description: "Define database schema" },
    { name: "Implement API endpoints", description: "Create RESTful services" },
    { name: "Write tests", description: "Unit and integration tests" },
  ],
});

const testTaskId = await taskManager.createChildTask(mainTaskId, {
  name: "Test Feature X",
  description: "Comprehensive testing of Feature X",
  priority: "medium",
});

// Get all child tasks
const childTasks = await taskManager.getChildTasks(mainTaskId);
console.log(`Main task has ${childTasks.length} subtasks`);
```

## Task Workflow

### Starting a Task

```typescript
// Start the main task
await taskManager.startTask(mainTaskId);

// Start a child task
await taskManager.startTask(designTaskId);

// Check task status
const designTask = await taskManager.getTask(designTaskId);
console.log(`Design task status: ${designTask.status}`); // "in_progress"
```

### Completing a Task

```typescript
// Complete the design task
await taskManager.completeTask(designTaskId);

// Try switching to the implementation task
await taskManager.switchTasks(designTaskId, implementTaskId, {
  transferContext: true, // Transfer context from design to implementation
  contextOptions: {
    preserveHistory: true,
  },
});

// Start the implementation task
await taskManager.startTask(implementTaskId);
```

### Cancelling a Task

```typescript
// Cancel a task that's no longer needed
await taskManager.cancelTask(testTaskId);

// Check status
const testTask = await taskManager.getTask(testTaskId);
console.log(`Test task status: ${testTask.status}`); // "cancelled"
```

## Task Verification

### Verifying Task Creation

```typescript
// Get the task verifier from the task manager
const verifier = taskManager.getVerifier();

// Verify task creation
const taskData = {
  name: "Invalid Task",
  // Missing description and other required fields
};

const verificationResult = await verifier.verifyTaskCreation(taskData);

if (!verificationResult.verified) {
  console.error("Task creation verification failed:");
  console.error("Errors:", verificationResult.errors);
  console.warn("Warnings:", verificationResult.warnings);

  // Get recommendations for fixing issues
  const recommendations = verifier.getRecommendations(verificationResult);
  console.log("Recommendations:", recommendations);
}
```

### Verifying Task Transitions

```typescript
// Check if task can be completed
const task = await taskManager.getTask(mainTaskId);
const canComplete = await taskManager.verifyTask(task, "transition", {
  newStatus: "completed",
});

if (!canComplete) {
  // Get transition recommendations
  const transitionManager = taskManager.getTransitionManager();
  const recommendations =
    await transitionManager.getTransitionRecommendations(mainTaskId);

  console.log("Possible next states:", recommendations.nextStates);
  console.log("Recommendations:", recommendations.recommendations);
}
```

## Context Management

### Capturing Task Context

```typescript
// Get the context manager
const contextManager = taskManager.getContextManager();

// Capture context for a task
const task = await taskManager.getTask(implementTaskId);
const context = await contextManager.captureTaskContext(task, {
  captureEnvironment: true,
  captureCodeState: true,
  captureTaskState: true,
});

console.log(`Captured context with ${context.components.length} components`);
```

### Transferring Context Between Tasks

```typescript
// Transfer context when moving to testing
await contextManager.transferContext(implementTaskId, testTaskId, {
  mergeStrategy: "merge", // Merge with any existing context
  preserveHistory: true, // Keep history of previous context
  captureCodeState: true, // Capture current code state during transfer
});

// Compare contexts between tasks
const diff = await contextManager.getContextDiff(implementTaskId, testTaskId);
console.log(
  `Context differences: ${diff.added.length} added, ${diff.removed.length} removed, ${diff.modified.length} modified components`,
);
```

## Lifecycle Hooks

### Registering Lifecycle Hooks

```typescript
// Get the lifecycle manager
const lifecycleManager = taskManager.getLifecycleManager();

// Register a pre-start hook
lifecycleManager.registerPreStartHook(async (taskId) => {
  console.log(`About to start task ${taskId}`);

  // Verify environment is ready
  const isEnvironmentReady = await checkEnvironmentReadiness();
  if (!isEnvironmentReady) {
    throw new Error("Environment not ready for task to start");
  }
});

// Register a post-complete hook
lifecycleManager.registerPostCompleteHook(async (task) => {
  console.log(`Task ${task.id} has been completed`);

  // Send notification
  await sendNotification({
    type: "task_completed",
    taskId: task.id,
    taskName: task.name,
    completedAt: task.completedAt,
  });

  // Update project status
  await updateProjectStatus(task);
});
```

### Custom Verification Hook

```typescript
// Register a pre-complete hook for custom verification
lifecycleManager.registerPreCompleteHook(async (taskId) => {
  // Get the task
  const task = await taskManager.getTask(taskId);

  // Get child tasks
  const childTasks = await taskManager.getChildTasks(taskId);

  // Verify all child tasks are completed
  const incompleteChildTasks = childTasks.filter(
    (child) => child.status !== "completed" && child.status !== "cancelled",
  );

  if (incompleteChildTasks.length > 0) {
    throw new Error(
      `Cannot complete task "${task.name}": ${incompleteChildTasks.length} child tasks are still incomplete`,
    );
  }

  // Verify required steps are completed
  if (task.steps && task.steps.length > 0) {
    const incompleteSteps = task.steps.filter(
      (step) => step.status !== "completed" && step.status !== "skipped",
    );

    if (incompleteSteps.length > 0) {
      throw new Error(
        `Cannot complete task "${task.name}": ${incompleteSteps.length} steps are incomplete`,
      );
    }
  }
});
```

## Batch Operations

### Batch Transitions

```typescript
// Get the transition manager
const transitionManager = taskManager.getTransitionManager();

// Get all tasks for a feature
const featureTasks = await getTasksByFeature("Feature X");
const taskIds = featureTasks.map((task) => task.id);

// Batch cancel all tasks
const results = await transitionManager.batchTransition(taskIds, "cancelled", {
  force: true, // Force the transition even if verification fails
  cascadeToChildren: true, // Cascade to child tasks
});

// Check results
const failures = results.filter((result) => !result.success);
if (failures.length > 0) {
  console.error(`${failures.length} tasks failed to transition:`);
  failures.forEach((failure) => {
    console.error(`- Task ${failure.taskId}: ${failure.message}`);
  });
}
```

## Advanced Task Switching

### Complex Task Switch with Context Transfer

```typescript
// When switching between complex related tasks:
async function switchToRelatedTask(fromTaskId, toTaskId) {
  try {
    // Check if tasks are related
    const relationshipManager = taskManager.getRelationshipManager();
    const areRelated = await relationshipManager.areTasksRelated(
      fromTaskId,
      toTaskId,
    );

    // Switch tasks with appropriate options
    await taskManager.switchTasks(fromTaskId, toTaskId, {
      transferContext: true,
      contextOptions: {
        mergeStrategy: areRelated ? "merge" : "append",
        preserveHistory: true,
        captureCodeState: true,
        captureTaskState: true,
      },
      transitionOptions: {
        preserveContext: true,
        // If tasks aren't related, don't verify boundaries too strictly
        verificationOptions: {
          strictMode: areRelated,
          checkContextAvailability: areRelated,
        },
      },
    });

    console.log(`Successfully switched from task ${fromTaskId} to ${toTaskId}`);
    return true;
  } catch (error) {
    console.error(`Failed to switch tasks: ${error.message}`);
    return false;
  }
}

// Use the function
await switchToRelatedTask(designTaskId, implementTaskId);
```

### Task Boundary Verification

```typescript
// Get tasks
const currentTask = await taskManager.getTask(implementTaskId);
const nextTask = await taskManager.getTask(testTaskId);

// Verify boundary
const verifier = taskManager.getVerifier();
const boundaryResult = await verifier.verifyTaskBoundary(
  currentTask,
  nextTask,
  {
    checkContextAvailability: true,
    checkParentTask: true,
  },
);

if (!boundaryResult.verified) {
  // Handle boundary issues
  console.error("Task boundary issues:");
  console.error(boundaryResult.errors);
  console.warn(boundaryResult.warnings);

  // Get recommendations
  const recommendations = verifier.getRecommendations(boundaryResult);
  console.log("Recommendations:", recommendations);
} else {
  // Safe to switch
  await taskManager.switchTasks(implementTaskId, testTaskId, {
    transferContext: true,
  });
}
```

## Error Handling

### Handling Task Operation Errors

```typescript
// Try to complete a task that has incomplete children
try {
  await taskManager.completeTask(mainTaskId);
} catch (error) {
  console.error(`Error completing task: ${error.message}`);

  // Get recommendations for fixing
  const transitionManager = taskManager.getTransitionManager();
  const { nextStates, recommendations } =
    await transitionManager.getTransitionRecommendations(mainTaskId);

  console.log("Available transitions:", nextStates);
  console.log("Recommendations:", recommendations);

  // Fix the issue by completing child tasks first
  const childTasks = await taskManager.getChildTasks(mainTaskId);
  const incompleteChildTasks = childTasks.filter(
    (child) => child.status !== "completed" && child.status !== "cancelled",
  );

  if (incompleteChildTasks.length > 0) {
    console.log(
      `Need to complete ${incompleteChildTasks.length} child tasks first`,
    );

    // Complete them in batch
    await transitionManager.batchTransition(
      incompleteChildTasks.map((task) => task.id),
      "completed",
      { force: true },
    );

    // Now try completing the main task again
    await taskManager.completeTask(mainTaskId);
    console.log("Main task completed after fixing child tasks");
  }
}
```

## Integration with UI

### Task Status Indicators

```typescript
// Function to get status for UI display
function getTaskStatusIndicator(status) {
  switch (status) {
    case "planned":
      return { color: "gray", icon: "calendar", label: "Planned" };
    case "in_progress":
      return { color: "blue", icon: "spinner", label: "In Progress" };
    case "completed":
      return { color: "green", icon: "check", label: "Completed" };
    case "cancelled":
      return { color: "red", icon: "times", label: "Cancelled" };
    default:
      return { color: "gray", icon: "question", label: "Unknown" };
  }
}

// Display task status in UI
async function updateTaskStatusUI(taskId, element) {
  const task = await taskManager.getTask(taskId);
  const indicator = getTaskStatusIndicator(task.status);

  element.style.color = indicator.color;
  element.innerHTML = `<i class="fa fa-${indicator.icon}"></i> ${indicator.label}`;
}

// Display task hierarchy
async function renderTaskHierarchy(taskId, container) {
  // Clear container
  container.innerHTML = "";

  // Get the task
  const task = await taskManager.getTask(taskId);

  // Create task element
  const taskElement = document.createElement("div");
  taskElement.className = "task";
  taskElement.innerHTML = `
    <h3>${task.name}</h3>
    <p>${task.description}</p>
    <div class="status"></div>
  `;

  // Update status
  updateTaskStatusUI(taskId, taskElement.querySelector(".status"));

  // Add to container
  container.appendChild(taskElement);

  // Get child tasks
  const childTasks = await taskManager.getChildTasks(taskId);

  if (childTasks.length > 0) {
    const childrenContainer = document.createElement("div");
    childrenContainer.className = "child-tasks";
    taskElement.appendChild(childrenContainer);

    // Render each child task
    for (const childTask of childTasks) {
      await renderTaskHierarchy(childTask.id, childrenContainer);
    }
  }
}
```

### Task Transition UI

```typescript
// Create UI for task transitions
function createTaskTransitionUI(taskId, container) {
  // Add button container
  const buttonContainer = document.createElement("div");
  buttonContainer.className = "task-actions";
  container.appendChild(buttonContainer);

  // Function to update available actions
  async function updateAvailableActions() {
    buttonContainer.innerHTML = ""; // Clear buttons

    const task = await taskManager.getTask(taskId);
    const transitionManager = taskManager.getTransitionManager();
    const { nextStates } =
      await transitionManager.getTransitionRecommendations(taskId);

    // Create appropriate buttons based on possible transitions
    if (nextStates.includes("in_progress")) {
      const startButton = document.createElement("button");
      startButton.className = "btn btn-primary";
      startButton.innerText = "Start Task";
      startButton.onclick = async () => {
        try {
          await taskManager.startTask(taskId);
          updateAvailableActions(); // Update UI after transition
        } catch (error) {
          alert(`Error starting task: ${error.message}`);
        }
      };
      buttonContainer.appendChild(startButton);
    }

    if (nextStates.includes("completed")) {
      const completeButton = document.createElement("button");
      completeButton.className = "btn btn-success";
      completeButton.innerText = "Complete Task";
      completeButton.onclick = async () => {
        try {
          await taskManager.completeTask(taskId);
          updateAvailableActions(); // Update UI after transition
        } catch (error) {
          alert(`Error completing task: ${error.message}`);
        }
      };
      buttonContainer.appendChild(completeButton);
    }

    if (nextStates.includes("cancelled")) {
      const cancelButton = document.createElement("button");
      cancelButton.className = "btn btn-danger";
      cancelButton.innerText = "Cancel Task";
      cancelButton.onclick = async () => {
        if (confirm("Are you sure you want to cancel this task?")) {
          try {
            await taskManager.cancelTask(taskId);
            updateAvailableActions(); // Update UI after transition
          } catch (error) {
            alert(`Error cancelling task: ${error.message}`);
          }
        }
      };
      buttonContainer.appendChild(cancelButton);
    }

    // Add child task button if task is in progress
    if (task.status === "in_progress") {
      const addChildButton = document.createElement("button");
      addChildButton.className = "btn btn-secondary";
      addChildButton.innerText = "Add Subtask";
      addChildButton.onclick = () => {
        showAddSubtaskDialog(taskId);
      };
      buttonContainer.appendChild(addChildButton);
    }
  }

  // Initial update
  updateAvailableActions();

  return { updateAvailableActions };
}

// Dialog to add a subtask
function showAddSubtaskDialog(parentTaskId) {
  // Create dialog
  const dialog = document.createElement("div");
  dialog.className = "dialog";
  dialog.innerHTML = `
    <h2>Add Subtask</h2>
    <form id="subtask-form">
      <div class="form-group">
        <label for="task-name">Name</label>
        <input type="text" id="task-name" required>
      </div>
      <div class="form-group">
        <label for="task-description">Description</label>
        <textarea id="task-description" required></textarea>
      </div>
      <div class="form-group">
        <label for="task-priority">Priority</label>
        <select id="task-priority">
          <option value="low">Low</option>
          <option value="medium" selected>Medium</option>
          <option value="high">High</option>
        </select>
      </div>
      <div class="buttons">
        <button type="submit" class="btn btn-primary">Add Subtask</button>
        <button type="button" class="btn btn-secondary" id="cancel-btn">Cancel</button>
      </div>
    </form>
  `;

  document.body.appendChild(dialog);

  // Handle form submission
  const form = dialog.querySelector("#subtask-form");
  form.onsubmit = async (event) => {
    event.preventDefault();

    const name = form.querySelector("#task-name").value;
    const description = form.querySelector("#task-description").value;
    const priority = form.querySelector("#task-priority").value;

    try {
      const childTaskId = await taskManager.createChildTask(parentTaskId, {
        name,
        description,
        priority,
      });

      alert(`Subtask created with ID: ${childTaskId}`);
      dialog.remove();

      // Refresh UI
      renderTaskHierarchy(
        parentTaskId,
        document.getElementById("task-hierarchy"),
      );
    } catch (error) {
      alert(`Error creating subtask: ${error.message}`);
    }
  };

  // Handle cancel button
  dialog.querySelector("#cancel-btn").onclick = () => {
    dialog.remove();
  };
}
```
