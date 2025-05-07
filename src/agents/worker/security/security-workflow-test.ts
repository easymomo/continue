import { TaskSystemAdapter } from "../../framework/task-system-adapter.js";
import { SecurityTaskManager } from "./securityTaskManager.js";
import { SecurityWorkflowStage } from "./securityWorkflowStages.js";

// Mock implementation of TaskSystemAdapter for testing
class MockTaskSystemAdapter {
  tasks: Map<string, any> = new Map();
  documents: Map<string, any> = new Map();
  memories: any[] = [];

  // Memory-related methods
  getAgentMemory() {
    return {
      queryMemories: async (query: any) => {
        if (query.documentType === "security_task") {
          return this.documents.size > 0
            ? Array.from(this.documents.values()).filter((doc) =>
                query.metadataFilter
                  ? query.metadataFilter(doc.metadata)
                  : true,
              )
            : [];
        }
        return [];
      },
    };
  }

  async storeDocument(
    title: string,
    content: string,
    type: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const id = `doc-${Date.now()}`;
    this.documents.set(id, {
      id,
      title,
      content,
      type,
      metadata: metadata || {},
    });
  }

  async storeDecision(
    title: string,
    description: string,
    metadata?: Record<string, any>,
  ): Promise<void> {
    const id = `decision-${Date.now()}`;
    this.documents.set(id, {
      id,
      title,
      content: description,
      type: "decision",
      metadata: metadata || {},
    });
  }
}

async function testSecurityWorkflow() {
  console.log("Starting Security Workflow Test");

  // Initialize adapter and task manager
  const adapter = new MockTaskSystemAdapter() as unknown as TaskSystemAdapter;
  const taskManager = new SecurityTaskManager(adapter);

  try {
    // Create a new security task
    console.log("Creating security task...");
    const taskId = await taskManager.createSecurityTask(
      "Test Security Review",
      "Review test codebase for security issues",
    );
    console.log(`Created task with ID: ${taskId}`);

    // Get the task and verify its initial state
    const task = await taskManager.getSecurityTask(taskId);
    if (!task) {
      throw new Error("Failed to retrieve task");
    }
    console.log(`Initial task stage: ${task.currentStage}`);

    if (task.currentStage !== SecurityWorkflowStage.ASSESSMENT) {
      throw new Error("Task not in expected initial stage");
    }

    // Transition to ANALYSIS stage
    console.log("Transitioning to ANALYSIS stage...");
    await taskManager.transitionTaskStage(
      taskId,
      SecurityWorkflowStage.ANALYSIS,
      "Completed initial assessment",
    );

    // Verify transition
    const updatedTask = await taskManager.getSecurityTask(taskId);
    if (!updatedTask) {
      throw new Error("Failed to retrieve updated task");
    }
    console.log(`Updated task stage: ${updatedTask.currentStage}`);

    if (updatedTask.currentStage !== SecurityWorkflowStage.ANALYSIS) {
      throw new Error("Task transition failed");
    }

    // Add a vulnerable component
    console.log("Adding vulnerable component...");
    await taskManager.addVulnerableComponent(taskId, "user-input-handler");

    // Transition to REMEDIATION stage
    console.log("Transitioning to REMEDIATION stage...");
    await taskManager.transitionTaskStage(
      taskId,
      SecurityWorkflowStage.REMEDIATION,
      "Analysis complete, ready for remediation",
    );

    // Verify final state
    const finalTask = await taskManager.getSecurityTask(taskId);
    if (!finalTask) {
      throw new Error("Failed to retrieve final task");
    }
    console.log(`Final task stage: ${finalTask.currentStage}`);
    console.log(
      `Found ${finalTask.vulnerableComponents?.length || 0} vulnerable components`,
    );

    if (finalTask.currentStage !== SecurityWorkflowStage.REMEDIATION) {
      throw new Error("Final task transition failed");
    }

    console.log("Security Workflow Test completed successfully!");
    return true;
  } catch (error) {
    console.error("Test failed:", error);
    return false;
  }
}

// Run the test
testSecurityWorkflow().then((success) => {
  console.log(`Test ${success ? "PASSED" : "FAILED"}`);
});
