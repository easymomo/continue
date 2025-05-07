/**
 * Standalone Security Workflow Test
 * This file tests the security workflow functionality without external dependencies
 */

// Define the workflow stages using object literals instead of enums
const SecurityWorkflowStage = {
  ASSESSMENT: "ASSESSMENT",
  ANALYSIS: "ANALYSIS",
  VULNERABILITY_SCAN: "VULNERABILITY_SCAN",
  REMEDIATION: "REMEDIATION",
  VERIFICATION: "VERIFICATION",
  COMPLETED: "COMPLETED",
} as const;

type SecurityWorkflowStageType =
  (typeof SecurityWorkflowStage)[keyof typeof SecurityWorkflowStage];

// Define the artifact types using object literals instead of enums
const SecurityArtifactType = {
  SCAN_REPORT: "SCAN_REPORT",
  VULNERABILITY_REPORT: "VULNERABILITY_REPORT",
  REMEDIATION_PLAN: "REMEDIATION_PLAN",
  VERIFICATION_REPORT: "VERIFICATION_REPORT",
  SECURITY_ASSESSMENT: "SECURITY_ASSESSMENT",
} as const;

type SecurityArtifactTypeType =
  (typeof SecurityArtifactType)[keyof typeof SecurityArtifactType];

// Define the valid stage transitions
const VALID_STAGE_TRANSITIONS: Record<
  SecurityWorkflowStageType,
  SecurityWorkflowStageType[]
> = {
  [SecurityWorkflowStage.ASSESSMENT]: [
    SecurityWorkflowStage.ANALYSIS,
    SecurityWorkflowStage.VULNERABILITY_SCAN,
  ],
  [SecurityWorkflowStage.ANALYSIS]: [
    SecurityWorkflowStage.VULNERABILITY_SCAN,
    SecurityWorkflowStage.REMEDIATION,
  ],
  [SecurityWorkflowStage.VULNERABILITY_SCAN]: [
    SecurityWorkflowStage.REMEDIATION,
    SecurityWorkflowStage.ANALYSIS,
  ],
  [SecurityWorkflowStage.REMEDIATION]: [
    SecurityWorkflowStage.VERIFICATION,
    SecurityWorkflowStage.ANALYSIS,
    SecurityWorkflowStage.COMPLETED,
  ],
  [SecurityWorkflowStage.VERIFICATION]: [
    SecurityWorkflowStage.COMPLETED,
    SecurityWorkflowStage.REMEDIATION,
  ],
  [SecurityWorkflowStage.COMPLETED]: [],
};

// Define the interfaces
interface SecurityArtifact {
  type: SecurityArtifactTypeType;
  content: string;
  severity?: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  timestamp: Date;
}

interface SecurityVulnerability {
  name: string;
  severity: string;
  location: string;
  description: string;
}

interface SecurityTaskMetadata {
  currentStage: SecurityWorkflowStageType;
  stageHistory: {
    stage: SecurityWorkflowStageType;
    timestamp: Date;
    note: string;
  }[];
  securityRequirements: string[];
  artifacts: SecurityArtifact[];
  affectedFiles: string[];
  vulnerableComponents: string[];
  vulnerabilities?: SecurityVulnerability[];
}

// Mock storage system
class MockStorage {
  private tasks: Map<string, SecurityTaskMetadata> = new Map();

  createTask(taskId: string, metadata: SecurityTaskMetadata): void {
    this.tasks.set(taskId, metadata);
  }

  getTask(taskId: string): SecurityTaskMetadata | null {
    return this.tasks.get(taskId) || null;
  }

  updateTask(taskId: string, metadata: Partial<SecurityTaskMetadata>): void {
    const task = this.tasks.get(taskId);
    if (task) {
      this.tasks.set(taskId, { ...task, ...metadata });
    }
  }
}

// Security Task Manager
class SecurityTaskManager {
  private storage: MockStorage;

  constructor(storage: MockStorage) {
    this.storage = storage;
  }

  async createSecurityTask(
    title: string,
    description: string,
  ): Promise<string> {
    const taskId = `task-${Date.now()}`;

    const initialMetadata: SecurityTaskMetadata = {
      currentStage: SecurityWorkflowStage.ASSESSMENT,
      stageHistory: [
        {
          stage: SecurityWorkflowStage.ASSESSMENT,
          timestamp: new Date(),
          note: "Security task created",
        },
      ],
      securityRequirements: [],
      artifacts: [],
      affectedFiles: [],
      vulnerableComponents: [],
    };

    this.storage.createTask(taskId, initialMetadata);
    console.log(`Created security task: ${title} - ${description}`);
    return taskId;
  }

  async getSecurityTask(taskId: string): Promise<SecurityTaskMetadata | null> {
    return this.storage.getTask(taskId);
  }

  async updateSecurityTask(
    taskId: string,
    updates: Partial<SecurityTaskMetadata>,
  ): Promise<boolean> {
    const task = this.storage.getTask(taskId);
    if (!task) return false;

    this.storage.updateTask(taskId, updates);
    return true;
  }

  async transitionTaskStage(
    taskId: string,
    newStage: SecurityWorkflowStageType,
    note: string = "Stage transition",
  ): Promise<boolean> {
    const task = this.storage.getTask(taskId);
    if (!task) return false;

    // Validate the transition
    const currentStage = task.currentStage;
    const validTransitions = VALID_STAGE_TRANSITIONS[currentStage] || [];

    if (!validTransitions.includes(newStage)) {
      console.warn(
        `Invalid stage transition from ${currentStage} to ${newStage}`,
      );
      return false;
    }

    // Update the task with the new stage
    const updatedTask: SecurityTaskMetadata = {
      ...task,
      currentStage: newStage,
      stageHistory: [
        ...task.stageHistory,
        {
          stage: newStage,
          timestamp: new Date(),
          note,
        },
      ],
    };

    this.storage.updateTask(taskId, updatedTask);
    return true;
  }

  async addSecurityRequirement(
    taskId: string,
    requirement: string,
  ): Promise<boolean> {
    const task = this.storage.getTask(taskId);
    if (!task) return false;

    const updatedTask: SecurityTaskMetadata = {
      ...task,
      securityRequirements: [...task.securityRequirements, requirement],
    };

    this.storage.updateTask(taskId, updatedTask);
    return true;
  }

  async addSecurityArtifact(
    taskId: string,
    artifact: SecurityArtifact,
  ): Promise<boolean> {
    const task = this.storage.getTask(taskId);
    if (!task) return false;

    const updatedTask: SecurityTaskMetadata = {
      ...task,
      artifacts: [...task.artifacts, artifact],
    };

    this.storage.updateTask(taskId, updatedTask);
    return true;
  }

  async addVulnerableComponent(
    taskId: string,
    component: string,
  ): Promise<boolean> {
    const task = this.storage.getTask(taskId);
    if (!task) return false;

    const updatedTask: SecurityTaskMetadata = {
      ...task,
      vulnerableComponents: [...task.vulnerableComponents, component],
    };

    this.storage.updateTask(taskId, updatedTask);
    return true;
  }

  async addAffectedFile(taskId: string, filePath: string): Promise<boolean> {
    const task = this.storage.getTask(taskId);
    if (!task) return false;

    const updatedTask: SecurityTaskMetadata = {
      ...task,
      affectedFiles: [...task.affectedFiles, filePath],
    };

    this.storage.updateTask(taskId, updatedTask);
    return true;
  }

  async completeSecurityTask(
    taskId: string,
    summary: string = "",
  ): Promise<boolean> {
    return this.transitionTaskStage(
      taskId,
      SecurityWorkflowStage.COMPLETED,
      summary || "Task completed",
    );
  }
}

// Test function
async function testSecurityWorkflow() {
  console.log("Starting Security Workflow Test");

  // Initialize storage and task manager
  const storage = new MockStorage();
  const taskManager = new SecurityTaskManager(storage);

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

    // Add security requirements
    await taskManager.addSecurityRequirement(taskId, "Input validation");
    await taskManager.addSecurityRequirement(taskId, "Authentication");

    // Add a security artifact
    await taskManager.addSecurityArtifact(taskId, {
      type: SecurityArtifactType.SCAN_REPORT,
      content: "Initial security scan complete",
      timestamp: new Date(),
    });

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

    // Add vulnerable components and affected files
    console.log("Adding vulnerable component...");
    await taskManager.addVulnerableComponent(taskId, "user-input-handler");
    await taskManager.addAffectedFile(taskId, "src/controllers/auth.js");

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
      `Found ${finalTask.vulnerableComponents.length} vulnerable components`,
    );
    console.log(
      `Security requirements: ${finalTask.securityRequirements.join(", ")}`,
    );
    console.log(`Affected files: ${finalTask.affectedFiles.join(", ")}`);
    console.log(`Artifacts: ${finalTask.artifacts.length}`);

    if (finalTask.currentStage !== SecurityWorkflowStage.REMEDIATION) {
      throw new Error("Final task transition failed");
    }

    // Complete the task
    console.log("Completing security task...");
    await taskManager.completeSecurityTask(
      taskId,
      "All security issues addressed",
    );

    const completedTask = await taskManager.getSecurityTask(taskId);
    if (completedTask?.currentStage !== SecurityWorkflowStage.COMPLETED) {
      throw new Error("Task completion failed");
    }
    console.log("Task completed successfully");

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
