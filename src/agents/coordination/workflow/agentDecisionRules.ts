/**
 * Agent Decision Rules - Defines reusable rules for agent transitions in workflow
 *
 * This module provides a set of predefined rules that can be used to determine when
 * a task should transition from one agent to another in the graph-based coordination system.
 */

import { AgentType } from "../../core/types.js";
import { WorkflowContext } from "./workflowContext.js";

/**
 * Decision rule function signature
 */
export type DecisionRuleFunction = (
  context: WorkflowContext,
  taskContent: string,
  additionalData?: Record<string, any>,
) => Promise<number> | number;

/**
 * Collection of decision rules
 */
export class AgentDecisionRules {
  /**
   * Rules for determining when to transition to the Developer agent
   */
  public static developerRules: Record<string, DecisionRuleFunction> = {
    /**
     * Detect code-related tasks
     */
    codeRelatedTask: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      const codeIndicators = [
        "code",
        "implement",
        "debug",
        "fix",
        "write",
        "function",
        "class",
        "method",
        "variable",
        "const",
        "let",
        "function",
        "interface",
        "type",
        "enum",
        "programming",
        "syntax",
        "compiler",
        "runtime",
        "library",
        "framework",
        "api",
        "component",
        "module",
      ];

      const taskLower = taskContent.toLowerCase();
      const matchCount = codeIndicators.filter((term) =>
        taskLower.includes(term),
      ).length;

      // Calculate confidence based on number of matched terms
      return Math.min(0.1 + matchCount * 0.1, 1.0);
    },

    /**
     * Detect when code examples or snippets are present
     */
    containsCodeSnippets: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      // Look for code fence markers or language identifiers
      const hasCodeFence = /```[\w]*\n[\s\S]*?\n```/.test(taskContent);
      const hasInlineCode = /`[^`]+`/.test(taskContent);
      const hasCodePatterns =
        /\b(function|class|const|let|var|import|export|return)\b/.test(
          taskContent,
        );

      if (hasCodeFence) return 0.9;
      if (hasCodePatterns) return 0.7;
      if (hasInlineCode) return 0.5;

      return 0;
    },

    /**
     * Detect follow-up tasks after research is complete
     */
    researchToImplementation: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      // Check if this is a follow-up after research agent was involved
      const recentAgents = context
        .getConversationHistory()
        .slice(-3)
        .map((turn) => turn.agentType);

      const hasRecentResearch = recentAgents.includes(AgentType.RESEARCH);

      if (!hasRecentResearch) return 0;

      // Look for implementation indicators after research
      const implementationIndicators = [
        "implement",
        "code",
        "create",
        "build",
        "develop",
        "write",
        "based on",
        "using",
        "with",
        "now",
        "next",
      ];

      const taskLower = taskContent.toLowerCase();
      const hasImplementationTerms = implementationIndicators.some((term) =>
        taskLower.includes(term),
      );

      return hasImplementationTerms ? 0.8 : 0.3;
    },
  };

  /**
   * Rules for determining when to transition to the Research agent
   */
  public static researchRules: Record<string, DecisionRuleFunction> = {
    /**
     * Detect information-seeking tasks
     */
    informationSeekingTask: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      const researchIndicators = [
        "research",
        "find",
        "search",
        "look up",
        "investigate",
        "explore",
        "learn about",
        "information on",
        "information about",
        "details on",
        "tell me about",
        "what is",
        "how does",
        "explain",
        "why is",
      ];

      const taskLower = taskContent.toLowerCase();
      const matchCount = researchIndicators.filter((term) =>
        taskLower.includes(term),
      ).length;

      return Math.min(0.1 + matchCount * 0.1, 1.0);
    },

    /**
     * Detect unfamiliar topics or technologies
     */
    unfamiliarTopics: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      // This is a simplified example - in practice, you'd want to compare
      // against a known list of technologies or use embeddings
      const taskTokens = taskContent.toLowerCase().split(/\s+/);
      const allMessages = context.getAllMessages();
      const allMessagesText = allMessages
        .map((msg) =>
          typeof msg.content === "string"
            ? msg.content
            : JSON.stringify(msg.content),
        )
        .join(" ")
        .toLowerCase();

      // Count tokens that appear in the task but haven't appeared much in conversation
      let unfamiliarCount = 0;

      for (const token of taskTokens) {
        if (token.length > 4) {
          // Only check substantive tokens
          const tokenRegex = new RegExp(`\\b${token}\\b`, "g");
          const previousMentions = (allMessagesText.match(tokenRegex) || [])
            .length;

          if (previousMentions <= 1) {
            unfamiliarCount++;
          }
        }
      }

      return Math.min(unfamiliarCount * 0.1, 0.9);
    },

    /**
     * Detect tasks requiring library/API research
     */
    libraryApiResearch: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      const apiIndicators = [
        "api",
        "library",
        "package",
        "module",
        "framework",
        "sdk",
        "documentation",
        "docs",
        "reference",
        "examples",
      ];

      const taskLower = taskContent.toLowerCase();
      const hasApiTerms = apiIndicators.some((term) =>
        taskLower.includes(term),
      );

      if (!hasApiTerms) return 0;

      // Look for question patterns about how to use something
      const questionPatterns = [
        "how to",
        "how do i",
        "can i",
        "is there a way",
        "what's the best way",
      ];

      const hasQuestionPattern = questionPatterns.some((pattern) =>
        taskLower.includes(pattern),
      );

      return hasQuestionPattern ? 0.85 : 0.6;
    },
  };

  /**
   * Rules for determining when to transition to the Security agent
   */
  public static securityRules: Record<string, DecisionRuleFunction> = {
    /**
     * Detect security-related concerns
     */
    securityRelatedTask: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      const securityIndicators = [
        "security",
        "vulnerability",
        "exploit",
        "attack",
        "threat",
        "risk",
        "breach",
        "hack",
        "malicious",
        "injection",
        "xss",
        "csrf",
        "sql injection",
        "authentication",
        "authorization",
        "encrypt",
        "decrypt",
        "hash",
        "salt",
        "password",
        "credentials",
        "token",
        "jwt",
        "oauth",
        "permission",
      ];

      const taskLower = taskContent.toLowerCase();
      const matchCount = securityIndicators.filter((term) =>
        taskLower.includes(term),
      ).length;

      return Math.min(0.2 + matchCount * 0.15, 1.0);
    },

    /**
     * Detect code review requests with security implications
     */
    securityCodeReview: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      const reviewIndicators = [
        "review",
        "check",
        "audit",
        "look at",
        "analyze",
        "validate",
        "verify",
        "assess",
        "evaluate",
      ];

      const securityContextIndicators = [
        "security",
        "auth",
        "user",
        "input",
        "validation",
        "credential",
        "sensitive",
        "data",
        "private",
        "secret",
        "key",
      ];

      const taskLower = taskContent.toLowerCase();

      const hasReviewTerm = reviewIndicators.some((term) =>
        taskLower.includes(term),
      );
      if (!hasReviewTerm) return 0;

      const securityContextCount = securityContextIndicators.filter((term) =>
        taskLower.includes(term),
      ).length;

      return securityContextCount > 0
        ? Math.min(0.4 + securityContextCount * 0.1, 0.9)
        : 0;
    },

    /**
     * Detect when security verification is needed after implementation
     */
    implementationVerification: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      // Check if this comes after developer agent
      const recentAgents = context
        .getConversationHistory()
        .slice(-3)
        .map((turn) => turn.agentType);

      const hasRecentDeveloper = recentAgents.includes(AgentType.DEVELOPER);
      if (!hasRecentDeveloper) return 0;

      // Look for verification or complete indicators
      const verificationIndicators = [
        "complete",
        "finished",
        "implemented",
        "done",
        "created",
        "verify",
        "check",
        "review",
        "secure",
        "validate",
      ];

      const taskLower = taskContent.toLowerCase();
      const hasVerificationTerms = verificationIndicators.some((term) =>
        taskLower.includes(term),
      );

      // If task mentions authentication, user data, etc. increase confidence
      const securityContextIndicators = [
        "auth",
        "login",
        "user",
        "password",
        "credential",
        "token",
        "sensitive",
        "private",
        "data",
        "input",
      ];

      const securityContextCount = securityContextIndicators.filter((term) =>
        taskLower.includes(term),
      ).length;

      return hasVerificationTerms
        ? Math.min(0.3 + securityContextCount * 0.1, 0.7)
        : 0;
    },
  };

  /**
   * Rules for determining when to transition to the Coordinator agent
   */
  public static coordinatorRules: Record<string, DecisionRuleFunction> = {
    /**
     * Detect task completion
     */
    taskCompletion: (context: WorkflowContext, taskContent: string): number => {
      const completionIndicators = [
        "complete",
        "finished",
        "done",
        "implemented",
        "resolved",
        "fixed",
        "created",
        "added",
        "updated",
        "accomplished",
        "task complete",
        "here's the result",
        "here is the result",
        "the solution is",
      ];

      const taskLower = taskContent.toLowerCase();
      const hasCompletionTerm = completionIndicators.some((term) =>
        taskLower.includes(term),
      );

      return hasCompletionTerm ? 0.8 : 0;
    },

    /**
     * Detect questions or task clarification needs
     */
    needsClarification: (
      context: WorkflowContext,
      taskContent: string,
    ): number => {
      const clarificationIndicators = [
        "unclear",
        "ambiguous",
        "not sure",
        "clarify",
        "clarification",
        "what do you mean",
        "please explain",
        "could you provide more details",
        "need more information",
        "not enough context",
        "specify",
        "which",
        "what",
        "how",
        "when",
        "where",
        "why",
        "?",
      ];

      const taskLower = taskContent.toLowerCase();
      const matchCount = clarificationIndicators.filter((term) =>
        taskLower.includes(term),
      ).length;

      return matchCount > 0 ? Math.min(0.5 + matchCount * 0.1, 0.9) : 0;
    },

    /**
     * Detect when a task requires coordinating multiple agents
     */
    multiAgentTask: (context: WorkflowContext, taskContent: string): number => {
      // Define indicators for tasks that might need multiple agents
      const multiAgentIndicators = [
        "both",
        "and",
        "then",
        "multiple",
        "steps",
        "process",
        "workflow",
        "first",
        "next",
        "after",
        "finally",
        "followed by",
      ];

      const taskLower = taskContent.toLowerCase();
      const matchCount = multiAgentIndicators.filter((term) =>
        taskLower.includes(term),
      ).length;

      // Tasks with multiple steps or dependencies often need coordination
      return matchCount >= 3 ? 0.7 : matchCount > 0 ? 0.4 : 0.1;
    },
  };

  /**
   * Apply a set of rules and return the highest confidence score
   */
  public static async applyRules(
    rules: Record<string, DecisionRuleFunction>,
    context: WorkflowContext,
    taskContent: string,
    additionalData?: Record<string, any>,
  ): Promise<{ confidence: number; ruleApplied: string }> {
    let highestConfidence = 0;
    let appliedRule = "default";

    // Apply each rule and track the highest confidence score
    for (const [ruleName, ruleFunction] of Object.entries(rules)) {
      const confidence = await Promise.resolve(
        ruleFunction(context, taskContent, additionalData),
      );

      if (confidence > highestConfidence) {
        highestConfidence = confidence;
        appliedRule = ruleName;
      }
    }

    return { confidence: highestConfidence, ruleApplied: appliedRule };
  }
}
