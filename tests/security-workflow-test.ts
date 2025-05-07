/**
 * Test script for SecurityTaskManager
 *
 * This script verifies the security workflow implementation by
 * directly testing the SecurityTaskManager functionality.
 */
import { AgentMemory } from "../src/agents/framework/memory-integration.js";
import { TaskSystemAdapter } from "../src/agents/framework/task-system-adapter.js";
import { SecurityTaskManager } from "../src/agents/worker/security/securityTaskManager.js";
import {
  SecurityArtifactType,
  SecurityWorkflowStage,
} from "../src/agents/worker/security/securityWorkflowStages.js";

// Create a minimal mock TaskSystemAdapter for testing
const mockAdapter: TaskSystemAdapter = {
  storeMessage: async () => Promise.resolve(),
  storeDecision: async () => Promise.resolve(),
  storeDocument: async () => Promise.resolve(),
  findOrCreateAgentContext: async () => "test-context",
  getAgentId: () => "security-test-agent",
  getCurrentTask: async () => null,
  getAgentMemory: () => {
    // Create a stripped down version of AgentMemory for testing
    const agentMemoryMethods = {
      initialize: async () => Promise.resolve(),
      storeMemory: async () => "memory-id-123",
      getMemory: async () => null,
      queryMemories: async () => [],
      createContext: async () => ({ id: "context-id-123" }),
      getContext: async () => undefined,
      addToContext: async () => "context-update-id-123",
      queryContext: async () => [],
      rememberTemporarily: async () => "temp-id-123",
      getWorkingMemory: async () => null,
      getWorkingMemoriesByType: async () => [],
      searchWorkingMemory: async () => [],
      createMemorySnapshot: async () => 0,
      loadMemorySnapshot: async () => 0,
      consolidateMemories: async () => 0,
      resetWorkingMemory: async () => true,
      deleteContext: async () => true,
    };

    // Use unknown as intermediate step to safely cast to AgentMemory
    return agentMemoryMethods as unknown as AgentMemory;
  },
};

// Main test function
async function testSecurityWorkflow() {
  console.log("Starting Security Workflow Test");

  // Create a SecurityTaskManager with our mock adapter
  const taskManager = new SecurityTaskManager(mockAdapter);

  // 1. Create a security task
  console.log("Creating a security task...");
  const taskId = await taskManager.createSecurityTask(
    "Test security assessment",
    "Perform security analysis on a sample codebase",
  );
  console.log(`Created task with ID: ${taskId}`);

  // 2. Add security requirements
  console.log("Adding security requirements...");
  await taskManager.addSecurityRequirement(taskId, "Ensure input validation");
  await taskManager.addSecurityRequirement(
    taskId,
    "Check for authentication vulnerabilities",
  );
  await taskManager.addSecurityRequirement(
    taskId,
    "Verify secure data handling",
  );

  // 3. Get the task
  const task = await taskManager.getSecurityTask(taskId);
  console.log(`Initial task stage: ${task?.currentStage}`);

  // 4. Transition through workflow stages
  console.log("Transitioning through workflow stages...");

  // 4.1 Transition to ANALYSIS
  await taskManager.transitionTaskStage(
    taskId,
    SecurityWorkflowStage.ANALYSIS,
    "Beginning security analysis phase",
  );
  console.log(`Transitioned to ANALYSIS stage`);

  // Add an analysis artifact
  await taskManager.addSecurityArtifact(taskId, {
    type: SecurityArtifactType.SECURITY_REPORT,
    content:
      "Initial security analysis: Found potential issues in authentication flow",
    timestamp: new Date(),
  });

  // 4.2 Transition to VULNERABILITY_SCAN
  await taskManager.transitionTaskStage(
    taskId,
    SecurityWorkflowStage.VULNERABILITY_SCAN,
    "Starting automated vulnerability scanning",
  );
  console.log(`Transitioned to VULNERABILITY_SCAN stage`);

  // Add a vulnerability report
  await taskManager.addSecurityArtifact(taskId, {
    type: SecurityArtifactType.VULNERABILITY,
    content: "Vulnerability scan results: Identified 3 medium severity issues",
    severity: "medium",
    timestamp: new Date(),
  });

  // 4.3 Transition to REMEDIATION
  await taskManager.transitionTaskStage(
    taskId,
    SecurityWorkflowStage.REMEDIATION,
    "Starting remediation phase",
  );
  console.log(`Transitioned to REMEDIATION stage`);

  // Add a remediation plan
  await taskManager.addSecurityArtifact(taskId, {
    type: SecurityArtifactType.REMEDIATION,
    content: "Security fixes: Proposed fixes for identified vulnerabilities",
    timestamp: new Date(),
  });

  // 4.4 Transition to VERIFICATION
  await taskManager.transitionTaskStage(
    taskId,
    SecurityWorkflowStage.VERIFICATION,
    "Verifying security fixes",
  );
  console.log(`Transitioned to VERIFICATION stage`);

  // Add a verification report
  await taskManager.addSecurityArtifact(taskId, {
    type: SecurityArtifactType.VERIFICATION,
    content:
      "Verification results: All issues have been successfully remediated",
    timestamp: new Date(),
  });

  // 4.5 Complete the task
  await taskManager.completeSecurityTask(
    taskId,
    "Security assessment completed successfully",
  );
  console.log(`Completed security task`);

  // 5. Verify final state
  const finalTask = await taskManager.getSecurityTask(taskId);
  console.log(`Final task stage: ${finalTask?.currentStage}`);
  console.log(`Number of artifacts: ${finalTask?.artifacts.length}`);

  console.log("Security Workflow Test Completed");
}

// Run the test
testSecurityWorkflow().catch((error) => {
  console.error("Error in security workflow test:", error);
});
