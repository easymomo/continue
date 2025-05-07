/**
 * Research Agent Helper Functions
 *
 * Provides utility functions for research operations, including topic extraction,
 * stage transition detection, and research request analysis.
 */

import { BaseMessage } from "@langchain/core/messages";
import { Task } from "../../../memory/types.js";
import { ResearchWorkflowStage } from "./researchTaskManager.js";

/**
 * Determine if this is a new research request
 */
export function isNewResearchRequest(
  messages: BaseMessage[],
  currentTask?: Task,
): boolean {
  // If there's only one message, it's definitely a new request
  if (messages.length <= 1) return true;

  // If we don't have a current task, it's a new request
  if (!currentTask) return true;

  // Check message content for indicators of a new topic
  const lastMessage = messages[messages.length - 1];
  const content =
    typeof lastMessage.content === "string"
      ? lastMessage.content
      : JSON.stringify(lastMessage.content);

  // Look for phrases indicating a new research topic
  const newTopicIndicators = [
    "new research",
    "different topic",
    "another subject",
    "instead, research",
    "new topic",
    "switch to researching",
  ];

  return newTopicIndicators.some((indicator) =>
    content.toLowerCase().includes(indicator.toLowerCase()),
  );
}

/**
 * Extract research topic from message
 */
export function extractResearchTopic(message: string): string {
  // Basic implementation - extract first sentence or phrase
  // A more sophisticated implementation would use NLP techniques

  // Try to find common research request patterns
  const researchPatterns = [
    /research(?:\s+about)?(?:\s+on)?(?:\s+the)?(?:\s+topic(?:\s+of)?)?(?::|\s+)\s*"?([^".!?]+)"?/i,
    /find(?:\s+information)?(?:\s+about)?(?:\s+on)?(?:\s+the)?(?:\s+topic(?:\s+of)?)?(?::|\s+)\s*"?([^".!?]+)"?/i,
    /gather(?:\s+information)?(?:\s+about)?(?:\s+on)?(?:\s+the)?(?:\s+topic(?:\s+of)?)?(?::|\s+)\s*"?([^".!?]+)"?/i,
    /learn(?:\s+about)?(?:\s+on)?(?:\s+the)?(?:\s+topic(?:\s+of)?)?(?::|\s+)\s*"?([^".!?]+)"?/i,
  ];

  // Try each pattern
  for (const pattern of researchPatterns) {
    const match = message.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  // Fallback: just get the first sentence or a portion of it
  const firstSentence = message.split(/[.!?]/).shift() || message;
  if (firstSentence.length > 30) {
    return firstSentence.substring(0, 30) + "...";
  }
  return firstSentence;
}

/**
 * Determine the next research stage
 */
export function determineNextResearchStage(
  currentTask: Task,
  message: string,
): ResearchWorkflowStage | null {
  // Get current stage
  const currentStage =
    currentTask.metadata?.stage || ResearchWorkflowStage.PLANNING;

  // Check message for stage transition indicators
  const lowerMessage = message.toLowerCase();

  // Define transition indicators for each stage
  const stageIndicators: Record<string, string[]> = {
    [ResearchWorkflowStage.PLANNING]: [
      "start gathering",
      "begin research",
      "collect information",
      "find sources",
      "search for",
    ],
    [ResearchWorkflowStage.GATHERING]: [
      "analyze findings",
      "process the information",
      "examine the data",
      "evaluate sources",
      "analyze what you found",
    ],
    [ResearchWorkflowStage.ANALYZING]: [
      "synthesize results",
      "combine findings",
      "create summary",
      "put together",
      "integrate the analysis",
    ],
    [ResearchWorkflowStage.SYNTHESIZING]: [
      "prepare report",
      "create final output",
      "generate research report",
      "present findings",
      "report on your research",
    ],
    [ResearchWorkflowStage.REPORTING]: [
      "complete research",
      "finalize",
      "finish report",
      "research complete",
      "task completed",
    ],
  };

  // Determine the next stage based on the current stage
  const nextStageMap: Record<string, ResearchWorkflowStage> = {
    [ResearchWorkflowStage.PLANNING]: ResearchWorkflowStage.GATHERING,
    [ResearchWorkflowStage.GATHERING]: ResearchWorkflowStage.ANALYZING,
    [ResearchWorkflowStage.ANALYZING]: ResearchWorkflowStage.SYNTHESIZING,
    [ResearchWorkflowStage.SYNTHESIZING]: ResearchWorkflowStage.REPORTING,
    [ResearchWorkflowStage.REPORTING]: ResearchWorkflowStage.COMPLETED,
  };

  // If indicators for the next stage are present, transition
  const nextStage = nextStageMap[currentStage];
  const indicators = stageIndicators[currentStage] || [];

  if (indicators.some((indicator) => lowerMessage.includes(indicator))) {
    return nextStage;
  }

  // Check for explicit stage requests (e.g., "move to analysis stage")
  for (const [stage, indicators] of Object.entries(stageIndicators)) {
    // Only consider future stages
    const stageOrder = Object.values(ResearchWorkflowStage);
    const currentIndex = stageOrder.indexOf(
      currentStage as ResearchWorkflowStage,
    );
    const stageIndex = stageOrder.indexOf(stage as ResearchWorkflowStage);

    if (
      stageIndex > currentIndex &&
      indicators.some((indicator) => lowerMessage.includes(indicator))
    ) {
      return stage as ResearchWorkflowStage;
    }
  }

  // No stage transition needed
  return null;
}

/**
 * Check if the content indicates the need to return to coordinator
 */
export function shouldReturnToCoordinator(content: string): boolean {
  // Logic to determine if we should return control to the coordinator
  // Check if the content contains phrases suggesting coordination
  const coordinationPhrases = [
    "need development expertise",
    "need code implementation",
    "technical implementation required",
    "need security review",
    "needs to be implemented",
    "code development required",
    "should be built by developer",
    "consult with developer",
    "development needed",
    "requires actual implementation",
  ];

  return coordinationPhrases.some((phrase) =>
    content.toLowerCase().includes(phrase.toLowerCase()),
  );
}

/**
 * Extract the reason for coordination from the content
 */
export function getCoordinationReason(content: string): string {
  // Extract a reason for coordination based on the content
  const coordinationPhrases = [
    "need development expertise",
    "need code implementation",
    "technical implementation required",
    "need security review",
    "needs to be implemented",
    "code development required",
    "should be built by developer",
    "consult with developer",
    "development needed",
    "requires actual implementation",
  ];

  // Find the first matching phrase
  const matchedPhrase = coordinationPhrases.find((phrase) =>
    content.toLowerCase().includes(phrase.toLowerCase()),
  );

  if (matchedPhrase) {
    // Extract a sentence containing the phrase
    const sentences = content.split(/[.!?]+/);
    const relevantSentence = sentences.find((sentence) =>
      sentence.toLowerCase().includes(matchedPhrase.toLowerCase()),
    );

    if (relevantSentence) {
      return relevantSentence.trim();
    }
  }

  // Fallback
  return "Research complete, needs coordination with other agents";
}
