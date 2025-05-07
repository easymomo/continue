/**
 * Security Agent Helper Functions
 * Support utilities for the SecurityAgent's operations
 */

import { Task } from "../../../memory/types.js";
import {
  SecurityTaskMetadata,
  SecurityWorkflowStage,
} from "./securityWorkflowStages.js";

/**
 * Extract the security request from a message
 * @param message User message content
 * @returns The extracted security request description
 */
export function extractSecurityRequest(message: string): string {
  // Simple implementation - in a real system we might use NLP or regex patterns
  const lines = message.split("\n");

  // Check for explicit security mentions
  for (const line of lines) {
    if (
      line.toLowerCase().includes("security review") ||
      line.toLowerCase().includes("security check") ||
      line.toLowerCase().includes("vulnerability assessment") ||
      line.toLowerCase().includes("security audit") ||
      line.toLowerCase().includes("penetration test")
    ) {
      return line.trim();
    }
  }

  // If no explicit mention, use the first sentence or line
  if (message.includes(".")) {
    return message.split(".")[0].trim();
  }

  // Fallback to the first line or a portion of it
  return lines[0].length > 10
    ? lines[0].trim()
    : message.substring(0, 50).trim();
}

/**
 * Determine if this is a new security request
 * @param messages Array of message contents
 * @param currentTask Current active task, if any
 * @returns True if this appears to be a new security request
 */
export function isNewSecurityRequest(
  messages: { content: string | any }[],
  currentTask: SecurityTaskMetadata | Task | null,
): boolean {
  // If no current task, then it's a new request
  if (!currentTask) {
    return true;
  }

  // Get the last message
  const lastMessage = messages[messages.length - 1];
  const content =
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

  // Check for explicit mentions of new tasks
  const newTaskIndicators = [
    "new security review",
    "new assessment",
    "different project",
    "new audit",
    "another security check",
    "start a new security",
  ];

  for (const indicator of newTaskIndicators) {
    if (content.toLowerCase().includes(indicator)) {
      return true;
    }
  }

  // If task is completed, treat as new request
  if (
    "metadata" in currentTask &&
    currentTask.metadata?.stage === SecurityWorkflowStage.COMPLETED
  ) {
    return true;
  } else if (
    "currentStage" in currentTask &&
    currentTask.currentStage === SecurityWorkflowStage.COMPLETED
  ) {
    return true;
  }

  return false;
}

/**
 * Extract security requirements from a message
 * @param message The message to extract from
 * @returns An array of security requirements
 */
export function extractSecurityRequirements(message: string): string[] {
  const requirements: string[] = [];
  const lines = message.split("\n");

  // Look for requirement patterns
  let inRequirementsList = false;

  for (const line of lines) {
    const trimmedLine = line.trim();

    // Check for section headers
    if (
      trimmedLine.toLowerCase().includes("security requirements") ||
      trimmedLine.toLowerCase().includes("security needs") ||
      trimmedLine.toLowerCase().includes("security concerns")
    ) {
      inRequirementsList = true;
      continue;
    }

    // Check for end of requirements section
    if (
      inRequirementsList &&
      (trimmedLine === "" ||
        trimmedLine.toLowerCase().includes("additional information"))
    ) {
      inRequirementsList = false;
      continue;
    }

    // Collect requirements
    if (inRequirementsList && trimmedLine.length > 0) {
      // Remove bullet points or numbering
      const cleanedLine = trimmedLine.replace(/^[-*•]|\d+\.\s*/, "").trim();
      if (cleanedLine.length > 0) {
        requirements.push(cleanedLine);
      }
    }

    // Look for inline requirements with key phrases
    if (
      !inRequirementsList &&
      (trimmedLine.toLowerCase().includes("need to ensure") ||
        trimmedLine.toLowerCase().includes("must be secure") ||
        trimmedLine.toLowerCase().includes("security requirement") ||
        trimmedLine.toLowerCase().includes("important to secure"))
    ) {
      requirements.push(trimmedLine);
    }
  }

  // If we didn't find explicit requirements, try to infer them
  if (requirements.length === 0) {
    const securityPhrases = [
      "authentication",
      "authorization",
      "encryption",
      "data protection",
      "input validation",
      "access control",
      "secure communication",
    ];

    for (const line of lines) {
      for (const phrase of securityPhrases) {
        if (line.toLowerCase().includes(phrase)) {
          requirements.push(line.trim());
          break;
        }
      }
    }
  }

  return requirements;
}

/**
 * Determine the next security stage based on current task and message
 * @param task Current task
 * @param message User message
 * @returns The next stage or null if no transition needed
 */
export function determineNextSecurityStage(
  task: SecurityTaskMetadata | Task,
  message: string,
): SecurityWorkflowStage | null {
  // Get current stage
  let currentStage: SecurityWorkflowStage;

  if ("currentStage" in task) {
    currentStage = task.currentStage;
  } else if ("metadata" in task && task.metadata?.stage) {
    currentStage = task.metadata.stage as SecurityWorkflowStage;
  } else {
    return SecurityWorkflowStage.ASSESSMENT;
  }

  if (!currentStage) {
    return SecurityWorkflowStage.ASSESSMENT;
  }

  // Natural stage progression keywords
  const stageKeywords: Record<string, string[]> = {
    [SecurityWorkflowStage.ASSESSMENT]: [
      "analyze",
      "analysis",
      "evaluate",
      "examine",
      "examine the code",
      "analyze the system",
      "start analysis",
    ],
    [SecurityWorkflowStage.ANALYSIS]: [
      "scan",
      "vulnerability scan",
      "find vulnerabilities",
      "identify issues",
      "check for vulnerabilities",
      "start scanning",
    ],
    [SecurityWorkflowStage.VULNERABILITY_SCAN]: [
      "remediate",
      "fix",
      "solution",
      "recommendation",
      "address vulnerability",
      "suggest fixes",
      "how to fix",
    ],
    [SecurityWorkflowStage.REMEDIATION]: [
      "verify",
      "validation",
      "check fix",
      "verify solution",
      "test the fix",
      "validate changes",
    ],
    [SecurityWorkflowStage.VERIFICATION]: [
      "complete",
      "finish",
      "conclude",
      "finalize",
      "report",
      "final report",
    ],
  };

  // Check for explicit stage requests
  const lowerMessage = message.toLowerCase();

  // Handle explicit stage changes
  if (
    lowerMessage.includes("move to assessment") ||
    lowerMessage.includes("start assessment")
  ) {
    return SecurityWorkflowStage.ASSESSMENT;
  } else if (
    lowerMessage.includes("move to analysis") ||
    lowerMessage.includes("start analysis")
  ) {
    return SecurityWorkflowStage.ANALYSIS;
  } else if (
    lowerMessage.includes("start vulnerability scan") ||
    lowerMessage.includes("scan for vulnerabilities")
  ) {
    return SecurityWorkflowStage.VULNERABILITY_SCAN;
  } else if (
    lowerMessage.includes("move to remediation") ||
    lowerMessage.includes("recommend solutions")
  ) {
    return SecurityWorkflowStage.REMEDIATION;
  } else if (
    lowerMessage.includes("verify the changes") ||
    lowerMessage.includes("validate solutions")
  ) {
    return SecurityWorkflowStage.VERIFICATION;
  } else if (
    lowerMessage.includes("complete assessment") ||
    lowerMessage.includes("finalize report")
  ) {
    return SecurityWorkflowStage.COMPLETED;
  }

  // Natural progression based on keywords
  const nextStageMap: Record<SecurityWorkflowStage, SecurityWorkflowStage> = {
    [SecurityWorkflowStage.ASSESSMENT]: SecurityWorkflowStage.ANALYSIS,
    [SecurityWorkflowStage.ANALYSIS]: SecurityWorkflowStage.VULNERABILITY_SCAN,
    [SecurityWorkflowStage.VULNERABILITY_SCAN]:
      SecurityWorkflowStage.REMEDIATION,
    [SecurityWorkflowStage.REMEDIATION]: SecurityWorkflowStage.VERIFICATION,
    [SecurityWorkflowStage.VERIFICATION]: SecurityWorkflowStage.COMPLETED,
    [SecurityWorkflowStage.COMPLETED]: SecurityWorkflowStage.COMPLETED,
  };

  // Check if message contains keywords for the next natural stage
  const nextStage = nextStageMap[currentStage];
  const keywordsForNextStage = stageKeywords[nextStage] || [];

  for (const keyword of keywordsForNextStage) {
    if (lowerMessage.includes(keyword)) {
      return nextStage;
    }
  }

  // No transition needed
  return null;
}

/**
 * Detect the severity of a security issue from a message
 * @param message The message content
 * @returns The severity level or undefined if not found
 */
export function detectSecuritySeverity(
  message: string,
): "low" | "medium" | "high" | "critical" | undefined {
  const lowerMessage = message.toLowerCase();

  // Check for explicit severity mentions
  if (
    lowerMessage.includes("critical severity") ||
    lowerMessage.includes("critical vulnerability") ||
    lowerMessage.includes("urgent security issue")
  ) {
    return "critical";
  } else if (
    lowerMessage.includes("high severity") ||
    lowerMessage.includes("major security issue") ||
    lowerMessage.includes("serious vulnerability")
  ) {
    return "high";
  } else if (
    lowerMessage.includes("medium severity") ||
    lowerMessage.includes("moderate security issue") ||
    lowerMessage.includes("moderate vulnerability")
  ) {
    return "medium";
  } else if (
    lowerMessage.includes("low severity") ||
    lowerMessage.includes("minor security issue") ||
    lowerMessage.includes("minor vulnerability")
  ) {
    return "low";
  }

  // Try to infer severity based on content
  const criticalIndicators = [
    "remote code execution",
    "authentication bypass",
    "sql injection",
    "critical data exposure",
    "full system access",
    "zero-day",
    "privilege escalation",
  ];

  const highIndicators = [
    "cross-site scripting",
    "xss",
    "csrf",
    "authorization bypass",
    "information disclosure",
    "denial of service",
    "insecure direct object",
  ];

  const mediumIndicators = [
    "clickjacking",
    "session fixation",
    "missing encryption",
    "weak configuration",
    "improper validation",
    "insecure defaults",
  ];

  const lowIndicators = [
    "information leakage",
    "outdated library",
    "best practice violation",
    "minor configuration issue",
    "http headers missing",
  ];

  // Check for indicators by severity
  for (const indicator of criticalIndicators) {
    if (lowerMessage.includes(indicator)) {
      return "critical";
    }
  }

  for (const indicator of highIndicators) {
    if (lowerMessage.includes(indicator)) {
      return "high";
    }
  }

  for (const indicator of mediumIndicators) {
    if (lowerMessage.includes(indicator)) {
      return "medium";
    }
  }

  for (const indicator of lowIndicators) {
    if (lowerMessage.includes(indicator)) {
      return "low";
    }
  }

  // Default to undefined if we can't determine
  return undefined;
}

/**
 * Extract potential CVE IDs from a message
 * @param message The message content
 * @returns Array of CVE IDs found in the message
 */
export function extractCVEIds(message: string): string[] {
  const cvePattern = /CVE-\d{4}-\d{4,}/gi;
  const matches = message.match(cvePattern);
  return matches ? [...new Set(matches)] : []; // Remove duplicates
}

/**
 * Extract CVSS score from a message
 * @param message The message content
 * @returns CVSS score as a number or undefined if not found
 */
export function extractCVSSScore(message: string): number | undefined {
  // Look for CVSS score patterns
  const cvssPattern = /CVSS(?:v\d)?\s*(?:score)?[:=]?\s*(\d+(?:\.\d+)?)/i;
  const match = message.match(cvssPattern);

  if (match && match[1]) {
    const score = parseFloat(match[1]);
    // CVSS scores are between 0 and 10
    if (score >= 0 && score <= 10) {
      return score;
    }
  }

  return undefined;
}

/**
 * Extract affected files from a message
 * @param message The message content
 * @returns Array of file paths mentioned
 */
export function extractAffectedFiles(message: string): string[] {
  const affectedFiles: string[] = [];

  // Common file extensions
  const fileExtensions = [
    "js",
    "ts",
    "jsx",
    "tsx",
    "html",
    "css",
    "py",
    "java",
    "php",
    "rb",
    "go",
    "rs",
    "c",
    "cpp",
    "h",
    "cs",
    "swift",
    "kt",
    "json",
    "xml",
    "yaml",
    "yml",
  ];

  // Look for file paths (simple approach)
  const lines = message.split("\n");

  for (const line of lines) {
    // Look for direct file mentions
    if (line.includes("/") || line.includes("\\")) {
      // Extract potential file paths
      const words = line.split(/\s+/);
      for (const word of words) {
        // Remove punctuation that might appear at end of the word
        const cleanWord = word.replace(/[.,;:'"`!?()]$/, "");

        // Check if it looks like a file path with extension
        if (
          (cleanWord.includes("/") || cleanWord.includes("\\")) &&
          fileExtensions.some((ext) => cleanWord.endsWith(`.${ext}`))
        ) {
          affectedFiles.push(cleanWord);
        }
      }
    } else {
      // Look for filenames with extensions
      const fileRegex = new RegExp(
        `\\b[\\w-]+\\.(${fileExtensions.join("|")})\\b`,
        "g",
      );
      const matches = line.match(fileRegex);
      if (matches) {
        affectedFiles.push(...matches);
      }
    }
  }

  // Remove duplicates
  return [...new Set(affectedFiles)];
}
