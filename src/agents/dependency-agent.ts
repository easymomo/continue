/**
 * Dependency Agent
 *
 * Monitors project dependencies and provides updates and security information.
 */

import { execSync } from "child_process";
import { promises as fs } from "fs";
import * as path from "path";
import { BaseAgent } from "./framework/base-agent";
import { Message, MessageType, Task, TaskStatus } from "./framework/types";

interface DependencyInfo {
  name: string;
  current: string;
  wanted: string;
  latest: string;
  type: string;
  location: string;
}

interface SecurityVulnerability {
  name: string;
  severity: "info" | "low" | "moderate" | "high" | "critical";
  via: string[];
  effects: string[];
  range: string;
  nodes: string[];
  fixAvailable: boolean;
}

export class DependencyAgent extends BaseAgent {
  private projectRoot: string;
  private reportDir: string;

  constructor(projectRoot: string) {
    super({
      name: "Dependency Agent",
      description:
        "Monitors project dependencies and provides updates and security information",
      version: "1.0.0",
      capabilities: {
        dependencyCheck: true,
        securityAudit: true,
        dependencyUpdate: true,
      },
      supportedTaskTypes: [
        "dependency-check",
        "security-audit",
        "dependency-update",
        "generate-dependency-report",
      ],
    });

    this.projectRoot = projectRoot;
    this.reportDir = path.join(this.projectRoot, "reports");
  }

  /**
   * Initialize the agent
   */
  protected async onInitialize(): Promise<void> {
    // Create reports directory if it doesn't exist
    await fs.mkdir(this.reportDir, { recursive: true });

    // Store initial dependency state
    await this.storeDependencyState();
  }

  /**
   * Shutdown the agent
   */
  protected async onShutdown(): Promise<void> {
    // Nothing specific to do on shutdown
  }

  /**
   * Handle a task assigned to the agent
   *
   * @param task Task to handle
   * @returns The updated task
   */
  protected async onHandleTask(task: Task): Promise<Task> {
    switch (task.type) {
      case "dependency-check":
        return await this.handleDependencyCheck(task);

      case "security-audit":
        return await this.handleSecurityAudit(task);

      case "dependency-update":
        return await this.handleDependencyUpdate(task);

      case "generate-dependency-report":
        return await this.handleGenerateReport(task);

      default:
        task.status = TaskStatus.FAILED;
        task.error = `Unsupported task type: ${task.type}`;
        return task;
    }
  }

  /**
   * Cancel a task
   *
   * @param taskId ID of the task to cancel
   */
  protected async onCancelTask(taskId: string): Promise<boolean> {
    // Tasks are currently synchronous, so we can't cancel them
    return false;
  }

  /**
   * Handle a message sent to the agent
   *
   * @param message Message to handle
   */
  protected async onHandleMessage(message: Message): Promise<void> {
    switch (message.subject) {
      case "dependency-status-request":
        await this.handleDependencyStatusRequest(message);
        break;

      case "security-status-request":
        await this.handleSecurityStatusRequest(message);
        break;

      default:
        // Ignore messages we don't understand
        break;
    }
  }

  /**
   * Check outdated dependencies
   *
   * @returns Object mapping dependency names to info
   */
  private async checkOutdatedDependencies(): Promise<
    Record<string, DependencyInfo>
  > {
    try {
      const output = execSync("npm outdated --json", {
        cwd: this.projectRoot,
        encoding: "utf8",
      });

      return JSON.parse(output);
    } catch (error) {
      // npm outdated returns a non-zero exit code when outdated packages are found
      if (error instanceof Error && "stdout" in error) {
        try {
          return JSON.parse(error.stdout as string);
        } catch {
          // If we can't parse the output, return an empty object
          return {};
        }
      }

      // If there was some other error, return an empty object
      return {};
    }
  }

  /**
   * Check for security vulnerabilities
   *
   * @returns Object with vulnerability info
   */
  private async checkSecurityVulnerabilities(): Promise<{
    vulnerabilities: Record<string, SecurityVulnerability>;
    metadata: {
      vulnerabilities: {
        info: number;
        low: number;
        moderate: number;
        high: number;
        critical: number;
        total: number;
      };
      dependencies: number;
      devDependencies: number;
      totalDependencies: number;
    };
  }> {
    try {
      const output = execSync("npm audit --json", {
        cwd: this.projectRoot,
        encoding: "utf8",
      });

      return JSON.parse(output);
    } catch (error) {
      // npm audit returns a non-zero exit code when vulnerabilities are found
      if (error instanceof Error && "stdout" in error) {
        try {
          return JSON.parse(error.stdout as string);
        } catch {
          // If we can't parse the output, return a default object
          return {
            vulnerabilities: {},
            metadata: {
              vulnerabilities: {
                info: 0,
                low: 0,
                moderate: 0,
                high: 0,
                critical: 0,
                total: 0,
              },
              dependencies: 0,
              devDependencies: 0,
              totalDependencies: 0,
            },
          };
        }
      }

      // If there was some other error, return a default object
      return {
        vulnerabilities: {},
        metadata: {
          vulnerabilities: {
            info: 0,
            low: 0,
            moderate: 0,
            high: 0,
            critical: 0,
            total: 0,
          },
          dependencies: 0,
          devDependencies: 0,
          totalDependencies: 0,
        },
      };
    }
  }

  /**
   * Update a dependency
   *
   * @param name Dependency name
   * @param version Version to update to
   */
  private async updateDependency(
    name: string,
    version: string,
  ): Promise<{
    success: boolean;
    output: string;
    error?: string;
  }> {
    try {
      const output = execSync(`npm install ${name}@${version}`, {
        cwd: this.projectRoot,
        encoding: "utf8",
      });

      return {
        success: true,
        output,
      };
    } catch (error) {
      return {
        success: false,
        output: "",
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  /**
   * Store the current dependency state in memory
   */
  private async storeDependencyState(): Promise<void> {
    const outdatedDeps = await this.checkOutdatedDependencies();
    const securityResults = await this.checkSecurityVulnerabilities();

    await this.storeMemory("dependency-state", {
      outdatedDependencies: outdatedDeps,
      securityVulnerabilities: securityResults,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Handle a dependency check task
   *
   * @param task Task to handle
   * @returns Updated task
   */
  private async handleDependencyCheck(task: Task): Promise<Task> {
    const outdatedDeps = await this.checkOutdatedDependencies();
    const outdatedCount = Object.keys(outdatedDeps).length;

    if (outdatedCount === 0) {
      task.result = {
        message: "All dependencies are up to date",
        dependencies: {},
      };
    } else {
      task.result = {
        message: `Found ${outdatedCount} outdated ${outdatedCount === 1 ? "dependency" : "dependencies"}`,
        dependencies: outdatedDeps,
      };

      // Generate report if requested
      if (task.data.generateReport) {
        const reportPath = await this.generateDependencyReport(outdatedDeps);
        task.result.reportPath = reportPath;
      }
    }

    // Store the updated dependency state
    await this.storeDependencyState();

    task.status = TaskStatus.COMPLETED;
    return task;
  }

  /**
   * Handle a security audit task
   *
   * @param task Task to handle
   * @returns Updated task
   */
  private async handleSecurityAudit(task: Task): Promise<Task> {
    const securityResults = await this.checkSecurityVulnerabilities();
    const vulnTotal = securityResults.metadata.vulnerabilities.total;

    if (vulnTotal === 0) {
      task.result = {
        message: "No security vulnerabilities found",
        vulnerabilities: {},
      };
    } else {
      task.result = {
        message: `Found ${vulnTotal} security ${vulnTotal === 1 ? "vulnerability" : "vulnerabilities"}`,
        vulnerabilityCounts: securityResults.metadata.vulnerabilities,
        vulnerabilities: securityResults.vulnerabilities,
      };

      // Generate report if requested
      if (task.data.generateReport) {
        const reportPath = await this.generateSecurityReport(securityResults);
        task.result.reportPath = reportPath;
      }
    }

    // Store the updated security state
    await this.storeDependencyState();

    task.status = TaskStatus.COMPLETED;
    return task;
  }

  /**
   * Handle a dependency update task
   *
   * @param task Task to handle
   * @returns Updated task
   */
  private async handleDependencyUpdate(task: Task): Promise<Task> {
    if (!task.data.dependencies || !Array.isArray(task.data.dependencies)) {
      task.status = TaskStatus.FAILED;
      task.error = "No dependencies specified for update";
      return task;
    }

    const updateResults: Record<
      string,
      {
        success: boolean;
        targetVersion: string;
        error?: string;
      }
    > = {};

    for (const dep of task.data.dependencies) {
      const { name, version } = dep;

      if (!name) {
        updateResults[name || "unknown"] = {
          success: false,
          targetVersion: version || "latest",
          error: "No dependency name specified",
        };
        continue;
      }

      const result = await this.updateDependency(name, version || "latest");

      updateResults[name] = {
        success: result.success,
        targetVersion: version || "latest",
        error: result.error,
      };
    }

    task.result = {
      message: "Dependency update completed",
      results: updateResults,
    };

    // Store the updated dependency state
    await this.storeDependencyState();

    // Check if any updates failed
    const hasFailures = Object.values(updateResults).some((r) => !r.success);

    task.status = hasFailures
      ? TaskStatus.COMPLETED // Still mark as completed even with some failures
      : TaskStatus.COMPLETED;

    return task;
  }

  /**
   * Handle a generate report task
   *
   * @param task Task to handle
   * @returns Updated task
   */
  private async handleGenerateReport(task: Task): Promise<Task> {
    const outdatedDeps = await this.checkOutdatedDependencies();
    const securityResults = await this.checkSecurityVulnerabilities();

    const depReportPath = await this.generateDependencyReport(outdatedDeps);
    const secReportPath = await this.generateSecurityReport(securityResults);

    task.result = {
      message: "Reports generated successfully",
      dependencyReportPath: depReportPath,
      securityReportPath: secReportPath,
    };

    task.status = TaskStatus.COMPLETED;
    return task;
  }

  /**
   * Handle a dependency status request message
   *
   * @param message Message to handle
   */
  private async handleDependencyStatusRequest(message: Message): Promise<void> {
    const outdatedDeps = await this.checkOutdatedDependencies();
    const outdatedCount = Object.keys(outdatedDeps).length;

    await this.sendMessage(
      message.sender,
      "dependency-status-response",
      {
        outdatedCount,
        dependencies: outdatedDeps,
      },
      MessageType.RESPONSE,
      {},
      message.id,
    );
  }

  /**
   * Handle a security status request message
   *
   * @param message Message to handle
   */
  private async handleSecurityStatusRequest(message: Message): Promise<void> {
    const securityResults = await this.checkSecurityVulnerabilities();

    await this.sendMessage(
      message.sender,
      "security-status-response",
      {
        vulnerabilityCounts: securityResults.metadata.vulnerabilities,
        vulnerabilities: securityResults.vulnerabilities,
      },
      MessageType.RESPONSE,
      {},
      message.id,
    );
  }

  /**
   * Generate a dependency report
   *
   * @param outdatedDeps Outdated dependencies
   * @returns Path to the generated report
   */
  private async generateDependencyReport(
    outdatedDeps: Record<string, DependencyInfo>,
  ): Promise<string> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const reportPath = path.join(
      this.reportDir,
      `dependency-update-${timestamp}.md`,
    );

    const outdatedCount = Object.keys(outdatedDeps).length;

    let reportContent = "# Dependency Update Report\n\n";
    reportContent += `Generated: ${new Date().toISOString()}\n\n`;

    if (outdatedCount === 0) {
      reportContent += "## Status\n\n";
      reportContent += "All dependencies are up to date.\n\n";
    } else {
      reportContent += "## Status\n\n";
      reportContent += `Found ${outdatedCount} outdated ${outdatedCount === 1 ? "dependency" : "dependencies"}.\n\n`;

      reportContent += "## Outdated Dependencies\n\n";
      reportContent += "| Package | Current | Wanted | Latest | Type |\n";
      reportContent += "|---------|---------|--------|--------|------|\n";

      for (const [name, info] of Object.entries(outdatedDeps)) {
        reportContent += `| ${name} | ${info.current} | ${info.wanted} | ${info.latest} | ${info.type} |\n`;
      }

      reportContent += "\n## Update Commands\n\n";
      reportContent += "```bash\n";

      for (const [name, info] of Object.entries(outdatedDeps)) {
        reportContent += `npm install ${name}@${info.latest} # Update to latest\n`;
      }

      reportContent += "```\n\n";

      reportContent += "## Notes\n\n";
      reportContent +=
        "- Before updating, make sure to review the changelog for each package to check for breaking changes.\n";
      reportContent +=
        "- Consider running tests after updating to ensure everything works as expected.\n";
      reportContent +=
        "- For major version updates, review the migration guides if available.\n";
    }

    await fs.writeFile(reportPath, reportContent);

    return reportPath;
  }

  /**
   * Generate a security report
   *
   * @param securityResults Security audit results
   * @returns Path to the generated report
   */
  private async generateSecurityReport(securityResults: {
    vulnerabilities: Record<string, SecurityVulnerability>;
    metadata: any;
  }): Promise<string> {
    const timestamp = new Date().toISOString().slice(0, 10);
    const reportPath = path.join(
      this.reportDir,
      `security-audit-${timestamp}.md`,
    );

    const vulnTotal = securityResults.metadata.vulnerabilities.total;

    let reportContent = "# Security Audit Report\n\n";
    reportContent += `Generated: ${new Date().toISOString()}\n\n`;

    if (vulnTotal === 0) {
      reportContent += "## Status\n\n";
      reportContent += "No security vulnerabilities found.\n\n";
    } else {
      reportContent += "## Status\n\n";
      reportContent += `Found ${vulnTotal} security ${vulnTotal === 1 ? "vulnerability" : "vulnerabilities"}.\n\n`;

      reportContent += "## Vulnerability Summary\n\n";
      reportContent += "| Severity | Count |\n";
      reportContent += "|----------|-------|\n";
      reportContent += `| Critical | ${securityResults.metadata.vulnerabilities.critical} |\n`;
      reportContent += `| High     | ${securityResults.metadata.vulnerabilities.high} |\n`;
      reportContent += `| Moderate | ${securityResults.metadata.vulnerabilities.moderate} |\n`;
      reportContent += `| Low      | ${securityResults.metadata.vulnerabilities.low} |\n`;
      reportContent += `| Info     | ${securityResults.metadata.vulnerabilities.info} |\n`;
      reportContent += `| **Total**    | **${vulnTotal}** |\n\n`;

      reportContent += "## Vulnerability Details\n\n";

      for (const [name, vuln] of Object.entries(
        securityResults.vulnerabilities,
      )) {
        reportContent += `### ${name}\n\n`;
        reportContent += `**Severity:** ${vuln.severity}\n\n`;
        reportContent += `**Vulnerable Versions:** ${vuln.range}\n\n`;

        if (vuln.via && vuln.via.length > 0) {
          reportContent += "**Via:**\n\n";
          for (const via of vuln.via) {
            reportContent += `- ${typeof via === "string" ? via : JSON.stringify(via)}\n`;
          }
          reportContent += "\n";
        }

        if (vuln.effects && vuln.effects.length > 0) {
          reportContent += "**Effects:**\n\n";
          for (const effect of vuln.effects) {
            reportContent += `- ${effect}\n`;
          }
          reportContent += "\n";
        }

        reportContent += `**Fix Available:** ${vuln.fixAvailable ? "Yes" : "No"}\n\n`;
        reportContent += "---\n\n";
      }

      reportContent += "## Mitigation\n\n";
      reportContent += "To fix these vulnerabilities, run:\n\n";
      reportContent += "```bash\n";
      reportContent += "npm audit fix\n";
      reportContent += "\n";
      reportContent += "# If the above command does not fix all issues:\n";
      reportContent +=
        "npm audit fix --force  # Note: This may update packages to major versions, introducing breaking changes\n";
      reportContent += "```\n\n";

      reportContent += "## Notes\n\n";
      reportContent +=
        "- Before applying fixes, make sure to test your application thoroughly.\n";
      reportContent +=
        "- Using `--force` can introduce breaking changes, so use with caution.\n";
      reportContent +=
        "- For more detailed information, run `npm audit --json` for a full report.\n";
    }

    await fs.writeFile(reportPath, reportContent);

    return reportPath;
  }
}
