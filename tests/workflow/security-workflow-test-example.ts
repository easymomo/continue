/**
 * Example Security Workflow Test
 *
 * This file demonstrates how to use the BaseMockTaskAdapter for testing
 * a security workflow with different stages and transitions.
 */

import {
  BaseMockTaskAdapter,
  GenericTask,
} from "../../docs/workflow/mock-adapter-template";

// Define the workflow stages
enum SecurityWorkflowStage {
  ASSESSMENT = "ASSESSMENT",
  ANALYSIS = "ANALYSIS",
  VULNERABILITY_SCAN = "VULNERABILITY_SCAN",
  REMEDIATION = "REMEDIATION",
  VERIFICATION = "VERIFICATION",
  COMPLETED = "COMPLETED",
}

// Define the task structure
interface SecurityTask extends GenericTask {
  currentStage: SecurityWorkflowStage;
  vulnerabilities: Array<{
    id: string;
    severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
    description: string;
    status?: "OPEN" | "IN_PROGRESS" | "RESOLVED";
    remediation?: string;
  }>;
  artifacts: Array<{
    type: string;
    content: string;
    timestamp: Date;
  }>;
}

// Create a mock adapter for security tasks
class MockSecurityTaskAdapter extends BaseMockTaskAdapter<SecurityTask> {
  protected isValidTransition(
    from: SecurityWorkflowStage,
    to: SecurityWorkflowStage,
  ): boolean {
    const validTransitions: Record<
      SecurityWorkflowStage,
      SecurityWorkflowStage[]
    > = {
      [SecurityWorkflowStage.ASSESSMENT]: [SecurityWorkflowStage.ANALYSIS],
      [SecurityWorkflowStage.ANALYSIS]: [
        SecurityWorkflowStage.VULNERABILITY_SCAN,
      ],
      [SecurityWorkflowStage.VULNERABILITY_SCAN]: [
        SecurityWorkflowStage.REMEDIATION,
        SecurityWorkflowStage.VERIFICATION, // Skip remediation if no vulnerabilities
      ],
      [SecurityWorkflowStage.REMEDIATION]: [SecurityWorkflowStage.VERIFICATION],
      [SecurityWorkflowStage.VERIFICATION]: [SecurityWorkflowStage.COMPLETED],
      [SecurityWorkflowStage.COMPLETED]: [],
    };

    return validTransitions[from]?.includes(to) || false;
  }

  // Helper method to create a security task with default values
  async createSecurityTask(data: Partial<SecurityTask> = {}): Promise<string> {
    return this.createTask({
      currentStage: SecurityWorkflowStage.ASSESSMENT,
      vulnerabilities: [],
      artifacts: [],
      ...data,
    });
  }

  // Helper method to add a vulnerability to a task
  async addVulnerability(
    taskId: string,
    vulnerability: Omit<SecurityTask["vulnerabilities"][0], "id">,
  ): Promise<string> {
    const task = await this.getTask(taskId);
    const vulnId = `vuln-${task.vulnerabilities.length + 1}`;

    await this.updateTask(taskId, {
      vulnerabilities: [
        ...task.vulnerabilities,
        {
          id: vulnId,
          ...vulnerability,
        },
      ],
    });

    return vulnId;
  }

  // Helper method to add an artifact to a task
  async addArtifact(
    taskId: string,
    type: string,
    content: string,
  ): Promise<void> {
    const task = await this.getTask(taskId);

    await this.updateTask(taskId, {
      artifacts: [
        ...task.artifacts,
        {
          type,
          content,
          timestamp: new Date(),
        },
      ],
    });
  }
}

// Example test function
async function testSecurityWorkflow() {
  console.log("🔍 Starting Security Workflow Test");

  const adapter = new MockSecurityTaskAdapter();

  try {
    // Create a new security task
    console.log("\n📋 Creating security task...");
    const taskId = await adapter.createSecurityTask();
    const initialTask = await adapter.getTask(taskId);
    console.log(`✅ Task created: ${taskId}`);
    console.log(`   Current stage: ${initialTask.currentStage}`);

    // Add initial assessment artifact
    await adapter.addArtifact(
      taskId,
      "ASSESSMENT_SCOPE",
      "Security assessment of payment processing module",
    );

    // Move to ANALYSIS stage
    console.log("\n📊 Moving to ANALYSIS stage...");
    await adapter.updateTask(taskId, {
      currentStage: SecurityWorkflowStage.ANALYSIS,
    });

    const analysisTask = await adapter.getTask(taskId);
    console.log(`✅ Task updated: ${taskId}`);
    console.log(`   Current stage: ${analysisTask.currentStage}`);

    // Add analysis artifacts
    await adapter.addArtifact(
      taskId,
      "THREAT_MODEL",
      "Payment processing threat model with identified attack vectors",
    );

    // Move to VULNERABILITY_SCAN stage
    console.log("\n🔍 Moving to VULNERABILITY_SCAN stage...");
    await adapter.updateTask(taskId, {
      currentStage: SecurityWorkflowStage.VULNERABILITY_SCAN,
    });

    const scanTask = await adapter.getTask(taskId);
    console.log(`✅ Task updated: ${taskId}`);
    console.log(`   Current stage: ${scanTask.currentStage}`);

    // Add vulnerabilities
    console.log("\n⚠️ Adding vulnerabilities...");
    const vuln1Id = await adapter.addVulnerability(taskId, {
      severity: "HIGH",
      description: "SQL Injection in payment processing endpoint",
    });

    const vuln2Id = await adapter.addVulnerability(taskId, {
      severity: "MEDIUM",
      description: "Insecure direct object reference in user profile",
    });

    // Add scan report artifact
    await adapter.addArtifact(
      taskId,
      "VULNERABILITY_REPORT",
      "Detailed vulnerability scan results with 2 issues found",
    );

    // Get updated task
    const withVulnsTask = await adapter.getTask(taskId);
    console.log(
      `✅ Added ${withVulnsTask.vulnerabilities.length} vulnerabilities`,
    );

    // Move to REMEDIATION stage
    console.log("\n🛠️ Moving to REMEDIATION stage...");
    await adapter.updateTask(taskId, {
      currentStage: SecurityWorkflowStage.REMEDIATION,
    });

    const remediationTask = await adapter.getTask(taskId);
    console.log(`✅ Task updated: ${taskId}`);
    console.log(`   Current stage: ${remediationTask.currentStage}`);

    // Remediate vulnerabilities
    console.log("\n🔧 Remediating vulnerabilities...");

    // Get current vulnerabilities
    const vulnerabilities = [...remediationTask.vulnerabilities];

    // Update first vulnerability
    const updatedVulns = vulnerabilities.map((vuln) =>
      vuln.id === vuln1Id
        ? {
            ...vuln,
            status: "RESOLVED" as const,
            remediation: "Implemented prepared statements and input validation",
          }
        : vuln,
    );

    // Update second vulnerability
    const finalVulns = updatedVulns.map((vuln) =>
      vuln.id === vuln2Id
        ? {
            ...vuln,
            status: "RESOLVED" as const,
            remediation: "Implemented proper access control checks",
          }
        : vuln,
    );

    // Update the task with remediated vulnerabilities
    await adapter.updateTask(taskId, {
      vulnerabilities: finalVulns,
    });

    // Add remediation artifact
    await adapter.addArtifact(
      taskId,
      "REMEDIATION_PLAN",
      "Fixes implemented for SQL injection and access control issues",
    );

    // Move to VERIFICATION stage
    console.log("\n✅ Moving to VERIFICATION stage...");
    await adapter.updateTask(taskId, {
      currentStage: SecurityWorkflowStage.VERIFICATION,
    });

    const verificationTask = await adapter.getTask(taskId);
    console.log(`✅ Task updated: ${taskId}`);
    console.log(`   Current stage: ${verificationTask.currentStage}`);

    // Add verification artifact
    await adapter.addArtifact(
      taskId,
      "VERIFICATION_REPORT",
      "Verified that all security issues have been properly addressed",
    );

    // Move to COMPLETED stage
    console.log("\n🏁 Moving to COMPLETED stage...");
    await adapter.updateTask(taskId, {
      currentStage: SecurityWorkflowStage.COMPLETED,
    });

    const completedTask = await adapter.getTask(taskId);
    console.log(`✅ Task updated: ${taskId}`);
    console.log(`   Current stage: ${completedTask.currentStage}`);

    // Print final task state
    console.log("\n📝 Final Task State:");
    console.log(`   ID: ${completedTask.id}`);
    console.log(`   Stage: ${completedTask.currentStage}`);
    console.log(`   Vulnerabilities: ${completedTask.vulnerabilities.length}`);
    console.log(`   Artifacts: ${completedTask.artifacts.length}`);

    // Check transition log
    const log = adapter.getTransitionLog();
    console.log("\n📊 Stage Transition Log:");
    log.forEach((entry, index) => {
      console.log(`   ${index + 1}. ${entry.from} → ${entry.to}`);
    });

    console.log("\n✅ Security Workflow Test Completed Successfully");

    return {
      success: true,
      taskId,
      task: completedTask,
      transitionLog: log,
    };
  } catch (error) {
    console.error("\n❌ Security Workflow Test Failed:", error);
    return {
      success: false,
      error,
    };
  }
}

// Run the test
testSecurityWorkflow().then((result) => {
  if (result.success) {
    console.log(
      "\n🎉 Workflow test completed successfully with proper transitions!",
    );
  } else {
    console.error("\n💥 Workflow test failed!");
  }
});

// Example invalid transition test
async function testInvalidTransition() {
  console.log("\n🧪 Testing Invalid Transition");

  const adapter = new MockSecurityTaskAdapter();
  const taskId = await adapter.createSecurityTask();

  try {
    // Try to skip directly to REMEDIATION (should fail)
    await adapter.updateTask(taskId, {
      currentStage: SecurityWorkflowStage.REMEDIATION,
    });

    console.error("❌ Test failed: Invalid transition was allowed!");
  } catch (error) {
    console.log("✅ Test passed: Invalid transition was rejected as expected");
    console.log(`   Error: ${error.message}`);
  }
}

// Run the invalid transition test
testInvalidTransition();
