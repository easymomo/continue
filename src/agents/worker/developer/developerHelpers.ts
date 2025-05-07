import { Task } from "../../../memory/types.js";
import { DeveloperWorkflowStage } from "./developerWorkflowStages.js";

/**
 * Extract the feature request from a message
 * @param message User message content
 * @returns The extracted feature name/description
 */
export function extractFeatureRequest(message: string): string {
  // Simple implementation - in a real system we might use NLP or regex patterns
  const lines = message.split("\n");

  // Check for explicit feature mentions
  for (const line of lines) {
    if (
      line.toLowerCase().includes("feature:") ||
      line.toLowerCase().includes("implement") ||
      line.toLowerCase().includes("create") ||
      line.toLowerCase().includes("build")
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
 * Determine if this is a new development request
 * @param messages Array of message contents
 * @param currentTask Current active task, if any
 * @returns True if this appears to be a new development request
 */
export function isNewDevelopmentRequest(
  messages: { content: string | any }[],
  currentTask: Task | null,
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
    "new feature",
    "new task",
    "start over",
    "different project",
    "new project",
    "another task",
  ];

  for (const indicator of newTaskIndicators) {
    if (content.toLowerCase().includes(indicator)) {
      return true;
    }
  }

  // If task is completed, treat as new request
  if (currentTask.metadata?.stage === DeveloperWorkflowStage.COMPLETED) {
    return true;
  }

  return false;
}

/**
 * Determine the next development stage based on current task and message
 * @param task Current task
 * @param message User message
 * @returns The next stage or null if no transition needed
 */
export function determineNextDevelopmentStage(
  task: Task,
  message: string,
): DeveloperWorkflowStage | null {
  // Get current stage
  const currentStage = task.metadata?.stage as DeveloperWorkflowStage;

  if (!currentStage) {
    return DeveloperWorkflowStage.PLANNING;
  }

  // Natural stage progression keywords
  const stageKeywords: Record<string, string[]> = {
    [DeveloperWorkflowStage.PLANNING]: [
      "design",
      "architect",
      "structure",
      "plan",
      "diagram",
      "sketch",
      "ready to design",
    ],
    [DeveloperWorkflowStage.DESIGNING]: [
      "code",
      "implement",
      "write",
      "coding",
      "start coding",
      "start implementing",
    ],
    [DeveloperWorkflowStage.CODING]: [
      "test",
      "testing",
      "debug",
      "verify",
      "check",
      "validate",
      "ready to test",
    ],
    [DeveloperWorkflowStage.TESTING]: [
      "refactor",
      "optimize",
      "improve",
      "clean",
      "refine",
      "ready to refactor",
    ],
    [DeveloperWorkflowStage.REFACTORING]: [
      "document",
      "documentation",
      "readme",
      "comments",
      "ready for documentation",
    ],
    [DeveloperWorkflowStage.DOCUMENTING]: [
      "complete",
      "finish",
      "done",
      "completed",
      "finalize",
      "deliver",
    ],
  };

  // Check for explicit stage requests
  const lowerMessage = message.toLowerCase();

  // Handle explicit stage changes
  if (
    lowerMessage.includes("move to planning stage") ||
    lowerMessage.includes("go back to planning")
  ) {
    return DeveloperWorkflowStage.PLANNING;
  } else if (
    lowerMessage.includes("move to design") ||
    lowerMessage.includes("start designing")
  ) {
    return DeveloperWorkflowStage.DESIGNING;
  } else if (
    lowerMessage.includes("move to coding") ||
    lowerMessage.includes("start coding")
  ) {
    return DeveloperWorkflowStage.CODING;
  } else if (
    lowerMessage.includes("move to testing") ||
    lowerMessage.includes("start testing")
  ) {
    return DeveloperWorkflowStage.TESTING;
  } else if (
    lowerMessage.includes("move to refactoring") ||
    lowerMessage.includes("start refactoring")
  ) {
    return DeveloperWorkflowStage.REFACTORING;
  } else if (
    lowerMessage.includes("move to documentation") ||
    lowerMessage.includes("start documenting")
  ) {
    return DeveloperWorkflowStage.DOCUMENTING;
  } else if (
    lowerMessage.includes("complete") ||
    lowerMessage.includes("task is done")
  ) {
    return DeveloperWorkflowStage.COMPLETED;
  }

  // Natural progression based on keywords
  const nextStageMap: Record<DeveloperWorkflowStage, DeveloperWorkflowStage> = {
    [DeveloperWorkflowStage.PLANNING]: DeveloperWorkflowStage.DESIGNING,
    [DeveloperWorkflowStage.DESIGNING]: DeveloperWorkflowStage.CODING,
    [DeveloperWorkflowStage.CODING]: DeveloperWorkflowStage.TESTING,
    [DeveloperWorkflowStage.TESTING]: DeveloperWorkflowStage.REFACTORING,
    [DeveloperWorkflowStage.REFACTORING]: DeveloperWorkflowStage.DOCUMENTING,
    [DeveloperWorkflowStage.DOCUMENTING]: DeveloperWorkflowStage.COMPLETED,
    [DeveloperWorkflowStage.COMPLETED]: DeveloperWorkflowStage.COMPLETED,
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
 * Check if the agent should return to the coordinator
 * @param message The message to check
 * @returns True if the agent should return to coordinator
 */
export function shouldReturnToCoordinator(message: string): boolean {
  const coordinationTriggers = [
    "need security review",
    "security check",
    "research",
    "need more information",
    "refer to coordinator",
    "hand off to",
    "back to coordinator",
    "handoff",
    "hand this off",
    "need research on",
    "outside my scope",
    "need security agent",
    "need research agent",
  ];

  const lowerMessage = message.toLowerCase();

  for (const trigger of coordinationTriggers) {
    if (lowerMessage.includes(trigger)) {
      return true;
    }
  }

  return false;
}

/**
 * Get the reason for coordinating with other agents
 * @param message The message to extract reason from
 * @returns The coordination reason
 */
export function getCoordinationReason(message: string): string {
  const lowerMessage = message.toLowerCase();

  if (lowerMessage.includes("security")) {
    return "Needs security review or assessment";
  } else if (lowerMessage.includes("research")) {
    return "Needs additional research or information";
  } else if (
    lowerMessage.includes("outside my scope") ||
    lowerMessage.includes("beyond my capabilities")
  ) {
    return "Task outside developer agent capabilities";
  }

  // Default reason
  return "Task requires coordination with other agents";
}
