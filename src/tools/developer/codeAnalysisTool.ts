/**
 * CodeAnalysisTool - Analyzes code structure and complexity
 *
 * This tool helps the developer agent understand code structure,
 * measure complexity, and identify potential issues.
 */

import * as fs from "fs/promises";
import * as path from "path";
import { AgentType } from "../../agents/core/types.js";
import { BaseAgentTool } from "../core/baseTool.js";
import { ToolCategory, ToolPermission } from "../core/types.js";

/**
 * Simple representation of a function or method
 */
interface FunctionInfo {
  name: string;
  startLine: number;
  endLine: number;
  parameters: string[];
  complexity: number;
}

/**
 * Simple representation of a class or module
 */
interface ClassInfo {
  name: string;
  startLine: number;
  endLine: number;
  methods: FunctionInfo[];
}

/**
 * Tool for analyzing code structure and complexity
 */
export class CodeAnalysisTool extends BaseAgentTool {
  name = "analyze_code";
  description =
    "Analyze the structure and complexity of code files. Provide the file path relative to the workspace root.";

  constructor(private workspaceRoot: string = process.cwd()) {
    super();

    // Register this tool specifically for the developer agent
    this.register(
      [AgentType.DEVELOPER],
      ToolCategory.CODE_ANALYSIS,
      [ToolPermission.FS_READ],
      {
        example: "analyze_code path/to/file.js",
        returnFormat: "JSON object with code structure analysis",
      },
    );
  }

  /**
   * Execute the code analysis
   * @param filePath Path to the file to analyze
   * @returns Analysis results as JSON string
   */
  protected async execute(filePath: string): Promise<string> {
    try {
      // Sanitize and resolve the file path
      const sanitizedPath = filePath.trim();
      const resolvedPath = path.isAbsolute(sanitizedPath)
        ? sanitizedPath
        : path.join(this.workspaceRoot, sanitizedPath);

      // Verify path is within workspace
      const relativePath = path.relative(this.workspaceRoot, resolvedPath);
      if (relativePath.startsWith("..") || path.isAbsolute(relativePath)) {
        return `Error: Cannot access files outside the workspace. Path: ${filePath}`;
      }

      // Read the file
      const content = await fs.readFile(resolvedPath, "utf-8");

      // Analyze the code
      const analysis = this.analyzeCode(content, path.extname(resolvedPath));

      return JSON.stringify(analysis, null, 2);
    } catch (error) {
      if (
        error instanceof Error &&
        "code" in error &&
        error.code === "ENOENT"
      ) {
        return `Error: File not found - ${filePath}`;
      }
      throw error;
    }
  }

  /**
   * Perform code analysis based on file extension
   * @param content Code content
   * @param extension File extension
   * @returns Analysis results
   */
  private analyzeCode(content: string, extension: string): any {
    // Split into lines for analysis
    const lines = content.split("\n");

    // Basic metrics
    const metrics = {
      totalLines: lines.length,
      codeLines: 0,
      commentLines: 0,
      blankLines: 0,
      functions: [] as FunctionInfo[],
      classes: [] as ClassInfo[],
      complexity: 0,
    };

    // Count line types
    let inBlockComment = false;
    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === "") {
        metrics.blankLines++;
      } else if (inBlockComment) {
        metrics.commentLines++;
        if (trimmedLine.includes("*/")) {
          inBlockComment = false;
        }
      } else if (trimmedLine.startsWith("//")) {
        metrics.commentLines++;
      } else if (trimmedLine.startsWith("/*")) {
        metrics.commentLines++;
        if (!trimmedLine.includes("*/")) {
          inBlockComment = true;
        }
      } else {
        metrics.codeLines++;
      }
    }

    // Function and class detection is just a simple approximation
    // In a real implementation, we would use a proper parser for each language
    switch (extension) {
      case ".js":
      case ".ts":
      case ".jsx":
      case ".tsx":
        this.analyzeJavaScript(content, metrics);
        break;
      case ".py":
        this.analyzePython(content, metrics);
        break;
      // Add more language analyzers as needed
    }

    // Calculate overall complexity
    metrics.complexity = this.calculateComplexity(metrics);

    return {
      fileName: path.basename(extension),
      fileType: extension.substring(1),
      metrics,
    };
  }

  /**
   * Simple JavaScript/TypeScript analyzer
   * This is a very basic implementation that just looks for patterns
   * A real implementation would use a proper parser
   */
  private analyzeJavaScript(content: string, metrics: any): void {
    // Look for function declarations
    const functionRegex = /function\s+(\w+)\s*\(([^)]*)\)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const params = match[2]
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);

      metrics.functions.push({
        name: functionName,
        startLine: this.getLineNumber(content, match.index),
        endLine: -1, // Would require proper parsing
        parameters: params,
        complexity: params.length + 1, // Very simple complexity metric
      });
    }

    // Look for class declarations
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];

      metrics.classes.push({
        name: className,
        startLine: this.getLineNumber(content, match.index),
        endLine: -1, // Would require proper parsing
        methods: [], // Would require proper parsing
      });
    }
  }

  /**
   * Simple Python analyzer
   * This is a very basic implementation that just looks for patterns
   * A real implementation would use a proper parser
   */
  private analyzePython(content: string, metrics: any): void {
    // Look for function declarations
    const functionRegex = /def\s+(\w+)\s*\(([^)]*)\)/g;
    let match;

    while ((match = functionRegex.exec(content)) !== null) {
      const functionName = match[1];
      const params = match[2]
        .split(",")
        .map((p) => p.trim())
        .filter((p) => p);

      metrics.functions.push({
        name: functionName,
        startLine: this.getLineNumber(content, match.index),
        endLine: -1, // Would require proper parsing
        parameters: params,
        complexity: params.length + 1, // Very simple complexity metric
      });
    }

    // Look for class declarations
    const classRegex = /class\s+(\w+)/g;
    while ((match = classRegex.exec(content)) !== null) {
      const className = match[1];

      metrics.classes.push({
        name: className,
        startLine: this.getLineNumber(content, match.index),
        endLine: -1, // Would require proper parsing
        methods: [], // Would require proper parsing
      });
    }
  }

  /**
   * Get the line number for a given character index
   */
  private getLineNumber(content: string, index: number): number {
    return content.substring(0, index).split("\n").length;
  }

  /**
   * Calculate code complexity based on metrics
   * This is a very simple implementation
   */
  private calculateComplexity(metrics: any): number {
    // Very simple complexity calculation
    const functionComplexity = metrics.functions.reduce(
      (sum: number, fn: FunctionInfo) => sum + fn.complexity,
      0,
    );

    return Math.min(
      10,
      Math.max(
        1,
        metrics.codeLines / 100 + // Size factor
          functionComplexity / 10 + // Function complexity
          metrics.classes.length / 2, // Class complexity
      ),
    );
  }
}
