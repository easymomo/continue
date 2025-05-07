/**
 * DependencyScanTool - Scans project dependencies for security vulnerabilities
 *
 * This tool allows the security agent to analyze project dependencies
 * and identify potential security vulnerabilities.
 */

import fs from "fs/promises";
import path from "path";
import { AgentType } from "../../agents/core/types.js";
import { BaseAgentTool } from "../core/baseTool.js";
import { ToolCategory, ToolPermission } from "../core/types.js";

/**
 * Interface for dependency vulnerability information
 */
interface Vulnerability {
  id: string;
  severity: "low" | "medium" | "high" | "critical";
  package: string;
  description: string;
  recommendedVersion?: string;
}

/**
 * Interface for scan results
 */
interface ScanResult {
  scannedAt: string;
  dependencyFile: string;
  vulnerabilitiesFound: number;
  vulnerabilities: Vulnerability[];
}

/**
 * Tool for scanning dependencies for security vulnerabilities
 */
export class DependencyScanTool extends BaseAgentTool {
  name = "dependency_scan";
  description =
    "Scan project dependencies for security vulnerabilities. Provide the path to the dependency file (e.g., package.json, requirements.txt).";

  constructor() {
    super();

    // Register this tool for the security agent
    this.register(
      [AgentType.SECURITY],
      ToolCategory.DEPENDENCY_AUDIT,
      [ToolPermission.FS_READ],
      {
        example: "dependency_scan package.json",
        returnFormat:
          "JSON object with scan results including vulnerabilities found",
      },
    );
  }

  /**
   * Execute the dependency scan
   * @param filePath Path to the dependency file
   * @returns Scan results as JSON string
   */
  protected async execute(filePath: string): Promise<string> {
    try {
      // Sanitize and resolve the file path
      const sanitizedPath = filePath.replace(/\.\.+/g, ".").trim();
      const resolvedPath = path.resolve(process.cwd(), sanitizedPath);

      // Verify the file exists
      try {
        await fs.access(resolvedPath);
      } catch {
        return JSON.stringify({
          error: `File not found: ${sanitizedPath}`,
          message: "Please provide a valid path to a dependency file.",
        });
      }

      // Read the file content
      const fileContent = await fs.readFile(resolvedPath, "utf-8");

      // Determine file type based on extension
      const fileExt = path.extname(resolvedPath).toLowerCase();

      // Analyze dependencies based on file type
      const scanResult = await this.analyzeDependencies(
        fileContent,
        fileExt,
        sanitizedPath,
      );

      return JSON.stringify(scanResult, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to scan dependencies: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Analyze dependencies for vulnerabilities
   * @param content Content of the dependency file
   * @param fileExt File extension
   * @param filePath Original file path
   * @returns Scan results
   */
  private async analyzeDependencies(
    content: string,
    fileExt: string,
    filePath: string,
  ): Promise<ScanResult> {
    // In a real implementation, this would call a vulnerability database
    // For this example, we'll return mock data based on the file type

    let vulnerabilities: Vulnerability[] = [];

    if (fileExt === ".json") {
      // Assumed to be package.json
      try {
        const packageJson = JSON.parse(content);
        const dependencies = {
          ...packageJson.dependencies,
          ...packageJson.devDependencies,
        };

        // Mock vulnerabilities for certain common packages
        for (const [pkg, version] of Object.entries(dependencies)) {
          if (
            pkg === "lodash" &&
            typeof version === "string" &&
            version.startsWith("4.17.1")
          ) {
            vulnerabilities.push({
              id: "CVE-2021-XXXXX",
              severity: "high",
              package: pkg,
              description:
                "Prototype pollution vulnerability in lodash before 4.17.21",
              recommendedVersion: "4.17.21",
            });
          }

          if (
            pkg === "express" &&
            typeof version === "string" &&
            version.startsWith("4.16")
          ) {
            vulnerabilities.push({
              id: "CVE-2022-XXXXX",
              severity: "medium",
              package: pkg,
              description:
                "Potential ReDoS vulnerability in path-to-regexp package, which is a dependency of express",
              recommendedVersion: "4.17.3",
            });
          }
        }
      } catch (error) {
        // Invalid JSON file
        return {
          scannedAt: new Date().toISOString(),
          dependencyFile: filePath,
          vulnerabilitiesFound: 0,
          vulnerabilities: [
            {
              id: "SCAN-ERROR",
              severity: "high",
              package: "N/A",
              description:
                "Failed to parse package.json file: " +
                (error instanceof Error ? error.message : String(error)),
            },
          ],
        };
      }
    } else if (fileExt === ".txt" && filePath.includes("requirements")) {
      // Assumed to be requirements.txt
      const lines = content.split("\n");

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith("#")) continue;

        // Extract package name and version
        const match = trimmed.match(
          /^([a-zA-Z0-9_-]+)(?:[=<>]=|==|@)([a-zA-Z0-9_.-]+)/,
        );
        if (match) {
          const [, pkg, version] = match;

          if (pkg === "flask" && version.startsWith("0.12")) {
            vulnerabilities.push({
              id: "CVE-2019-XXXXX",
              severity: "critical",
              package: pkg,
              description:
                "Flask before 1.0 has a potential security vulnerability related to user sessions",
              recommendedVersion: "2.0.1",
            });
          }

          if (pkg === "django" && version.startsWith("2.")) {
            vulnerabilities.push({
              id: "CVE-2021-YYYYY",
              severity: "medium",
              package: pkg,
              description:
                "Potential SQL injection vulnerability in Django 2.x",
              recommendedVersion: "3.2.5",
            });
          }
        }
      }
    }

    return {
      scannedAt: new Date().toISOString(),
      dependencyFile: filePath,
      vulnerabilitiesFound: vulnerabilities.length,
      vulnerabilities,
    };
  }
}
