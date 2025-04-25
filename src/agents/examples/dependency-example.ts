/**
 * Dependency Agent Example
 *
 * This file demonstrates how to use the AIgents framework with the dependency agent.
 */

import * as path from "path";
import { DependencyAgent } from "../dependency-agent";
import { framework, TaskPriority, TaskStatus } from "../framework";

// Type for dependency info in dependency check result
interface DependencyInfo {
  current: string;
  latest: string;
  type: string;
}

async function main() {
  try {
    console.log("Initializing AIgents framework...");

    // Initialize the framework
    await framework.initialize();
    console.log("Framework initialized successfully");

    // Create a dependency agent for the current project
    const projectRoot = path.resolve(process.cwd());
    const dependencyAgent = new DependencyAgent(projectRoot);

    console.log(`Creating dependency agent for project at ${projectRoot}`);

    // Register the agent with the framework
    await framework.registerAgent(dependencyAgent);
    console.log("Dependency agent registered successfully");

    // Create a task to check for outdated dependencies
    const checkTask = await framework.createTask({
      type: "dependency-check",
      priority: TaskPriority.MEDIUM,
      description: "Check for outdated dependencies",
      data: {
        generateReport: true,
      },
      context: {},
    });

    console.log(`Created task: ${checkTask.id}`);

    // Find agents that can handle this task
    const agents = framework.findAgentsForTaskType("dependency-check");
    console.log(
      `Found ${agents.length} agents that can handle dependency-check tasks`,
    );

    if (agents.length === 0) {
      console.error("No agents found that can handle dependency-check tasks");
      await framework.shutdown();
      return;
    }

    // Assign the task to the first agent
    const agent = agents[0].instance;
    console.log(`Assigning task to agent: ${agent.name}`);

    // Handle the task
    const result = await agent.handleTask(checkTask);

    // Print the result
    if (result.status === TaskStatus.COMPLETED) {
      console.log("\nTask completed successfully");
      console.log("Result:", result.result.message);

      if (
        result.result.dependencies &&
        Object.keys(result.result.dependencies).length > 0
      ) {
        console.log("\nOutdated dependencies:");

        for (const [name, info] of Object.entries(
          result.result.dependencies,
        ) as [string, DependencyInfo][]) {
          console.log(
            `  ${name}: ${info.current} -> ${info.latest} (${info.type})`,
          );
        }

        if (result.result.reportPath) {
          console.log(`\nReport generated at: ${result.result.reportPath}`);
        }
      }
    } else {
      console.error("\nTask failed:", result.error);
    }

    // Create a security audit task
    const auditTask = await framework.createTask({
      type: "security-audit",
      priority: TaskPriority.HIGH,
      description: "Check for security vulnerabilities",
      data: {
        generateReport: true,
      },
      context: {},
    });

    console.log(`\nCreated task: ${auditTask.id}`);

    // Handle the task
    const auditResult = await agent.handleTask(auditTask);

    // Print the result
    if (auditResult.status === TaskStatus.COMPLETED) {
      console.log("Task completed successfully");
      console.log("Result:", auditResult.result.message);

      if (
        auditResult.result.vulnerabilityCounts &&
        auditResult.result.vulnerabilityCounts.total > 0
      ) {
        console.log("\nVulnerability summary:");
        console.log(
          `  Critical: ${auditResult.result.vulnerabilityCounts.critical}`,
        );
        console.log(
          `  High:     ${auditResult.result.vulnerabilityCounts.high}`,
        );
        console.log(
          `  Moderate: ${auditResult.result.vulnerabilityCounts.moderate}`,
        );
        console.log(
          `  Low:      ${auditResult.result.vulnerabilityCounts.low}`,
        );
        console.log(
          `  Info:     ${auditResult.result.vulnerabilityCounts.info}`,
        );
        console.log(
          `  Total:    ${auditResult.result.vulnerabilityCounts.total}`,
        );

        if (auditResult.result.reportPath) {
          console.log(
            `\nReport generated at: ${auditResult.result.reportPath}`,
          );
        }
      }
    } else {
      console.error("\nTask failed:", auditResult.error);
    }

    // Shutdown the framework
    await framework.shutdown();
    console.log("\nFramework shutdown successfully");
  } catch (error) {
    console.error("Error:", error);
    await framework.shutdown();
    process.exit(1);
  }
}

// Run the example
main();
