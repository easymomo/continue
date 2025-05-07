import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { TaskManager } from "../../memory/tasks/index.js";
import { AgentType, BaseAgent } from "../core/types.js";
import {
  TaskSystemAdapter,
  createTaskSystemAdapter,
} from "../framework/task-system-adapter.js";
import {
  determineNextSecurityStage,
  extractSecurityRequest,
  extractSecurityRequirements,
  isNewSecurityRequest,
} from "./security/securityHelpers.js";
import { SecurityTaskManager } from "./security/securityTaskManager.js";
import { SECURITY_STAGE_PROMPTS } from "./security/securityWorkflowStages.js";

/**
 * Configuration for the SecurityAgent
 */
export interface SecurityAgentConfig {
  id: string;
  name: string;
  description: string;
  model: BaseChatModel;
  tools?: Tool[];
  useTaskMemory?: boolean;
}

/**
 * Security agent - specializes in code security, vulnerability assessment, and security best practices
 */
export class SecurityAgent extends BaseAgent {
  private systemPrompt: string;
  private taskManager: TaskManager;
  private taskSystemAdapter?: TaskSystemAdapter;
  private useTaskMemory: boolean;
  private securityTaskManager?: SecurityTaskManager;
  private currentTaskId?: string;

  constructor(config: SecurityAgentConfig) {
    super(
      config.id,
      AgentType.SECURITY,
      config.name,
      config.description,
      config.model,
      config.tools || [],
    );

    this.useTaskMemory = config.useTaskMemory || false;

    // Initialize task manager
    this.taskManager = new TaskManager(this.getTransactionManager());

    // Initialize the task system adapter if using task memory
    if (this.useTaskMemory) {
      // This will be properly initialized in the initializeTaskSystem method
      this.initializeTaskSystem();
    }

    this.systemPrompt = `You are the Security Agent - an expert in secure coding practices, vulnerability assessment, and security best practices.
Your role is to identify security issues, recommend fixes, and ensure the codebase follows security best practices.

Your responsibilities:
1. Identify security vulnerabilities in code and dependencies
2. Recommend secure coding patterns and fixes
3. Assess code for common security issues like:
   - Injection flaws (SQL, NoSQL, command injection, etc.)
   - Authentication and session management issues
   - Cross-site scripting (XSS)
   - Cross-site request forgery (CSRF)
   - Insecure direct object references
   - Security misconfigurations
   - Sensitive data exposure
   - Broken access control
   - Using components with known vulnerabilities
   - Insufficient logging and monitoring
4. Suggest security testing approaches
5. Provide clear explanations of identified issues and their potential impact

You should:
- Prioritize security issues based on severity and potential impact
- Provide specific, actionable recommendations for remediation
- Consider the context and constraints of the codebase
- Follow security best practices specific to the technologies in use
- Reference industry standards (OWASP, CWE, etc.) when appropriate

Always provide complete, clear explanations and solutions with references to security standards where applicable.`;
  }

  /**
   * Initialize the task system for this agent
   */
  private async initializeTaskSystem(): Promise<void> {
    if (this.useTaskMemory) {
      try {
        // Create task system adapter
        this.taskSystemAdapter = await createTaskSystemAdapter(this);

        // Initialize security context
        await this.taskSystemAdapter.findOrCreateAgentContext(
          "security_context",
          "Default security assessment context",
        );

        // Initialize the security task manager
        if (this.taskSystemAdapter) {
          this.securityTaskManager = new SecurityTaskManager(
            this.taskSystemAdapter,
          );
        }

        console.log(`Task system initialized for security agent: ${this.name}`);
      } catch (error) {
        console.error("Error initializing task system:", error);
      }
    }
  }

  /**
   * Process a message
   */
  public async process(state: {
    messages: BaseMessage[];
  }): Promise<Command | { messages: BaseMessage[] }> {
    // Initialize task system if not already initialized
    if (this.useTaskMemory && !this.taskSystemAdapter) {
      await this.initializeTaskSystem();
    }

    // Get the last message
    const lastMessage = state.messages[state.messages.length - 1];
    const lastMessageContent =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    // Store the incoming message in memory if task memory is enabled
    if (this.useTaskMemory && this.taskSystemAdapter) {
      await this.taskSystemAdapter.storeMessage(
        lastMessage instanceof HumanMessage ? "user" : "system",
        lastMessageContent,
      );

      // Handle security task workflow if task memory is enabled
      if (this.securityTaskManager) {
        await this.handleSecurityTaskWorkflow(state.messages);
      }
    }

    // Get the current workflow stage for system prompt enhancement
    let enhancedSystemPrompt = this.systemPrompt;

    if (this.useTaskMemory && this.securityTaskManager && this.currentTaskId) {
      const currentTask = await this.securityTaskManager.getSecurityTask(
        this.currentTaskId,
      );
      if (currentTask) {
        const stagePrompt = SECURITY_STAGE_PROMPTS[currentTask.currentStage];
        if (stagePrompt) {
          enhancedSystemPrompt = `${this.systemPrompt}\n\n${stagePrompt}`;
        }
      }
    }

    // Prepare the full context with system prompt
    const fullContext = [
      new HumanMessage(enhancedSystemPrompt),
      ...state.messages,
    ];

    try {
      // Process the message with the LLM
      const response = await this.getModel().invoke(fullContext);
      const responseContent = String(response.content);

      // Store the agent's response in memory if task memory is enabled
      if (this.useTaskMemory && this.taskSystemAdapter) {
        await this.taskSystemAdapter.storeMessage("agent", responseContent);

        // If there's a security finding, store it as a document
        if (this.containsSecurityFinding(responseContent)) {
          await this.taskSystemAdapter.storeDocument(
            "Security Finding",
            responseContent,
            "security_finding",
            {
              severity: this.determineSeverity(responseContent),
              timestamp: Date.now(),
            },
          );
        }
      }

      // After processing, determine if we need to return to the coordinator
      if (this.shouldReturnToCoordinator(responseContent)) {
        // Store decision about returning to coordinator
        if (this.useTaskMemory && this.taskSystemAdapter) {
          await this.taskSystemAdapter.storeDecision(
            "Return to Coordinator",
            `Returning to coordinator for further assistance: ${this.getCoordinationReason(responseContent)}`,
            {
              reason: this.getCoordinationReason(responseContent),
              timestamp: Date.now(),
            },
          );
        }

        return new Command({
          goto: "coordinator", // Return to the coordinator
          update: {
            messages: [
              ...state.messages,
              new AIMessage({
                content: response.content,
              }),
            ],
          },
        });
      }

      // Otherwise, just return the response
      return {
        messages: [...state.messages, response],
      };
    } catch (error) {
      console.error("Error processing message in SecurityAgent:", error);

      return {
        messages: [
          ...state.messages,
          new AIMessage({
            content:
              "I encountered an error while processing your security request. Please try again.",
          }),
        ],
      };
    }
  }

  /**
   * Handle security task workflow management
   */
  private async handleSecurityTaskWorkflow(
    messages: BaseMessage[],
  ): Promise<void> {
    if (!this.securityTaskManager || !this.taskSystemAdapter) return;

    try {
      // Get the current task if any
      const currentTask = await this.securityTaskManager.getCurrentTask();

      // Get the latest message content
      const lastMessage = messages[messages.length - 1];
      const content =
        typeof lastMessage.content === "string"
          ? lastMessage.content
          : JSON.stringify(lastMessage.content);

      // Check if this is a new security request
      const messagesContent = messages.map((m) => ({
        content:
          typeof m.content === "string" ? m.content : JSON.stringify(m.content),
      }));

      // Call isNewSecurityRequest with the correct type
      const isNewRequest = isNewSecurityRequest(messagesContent, currentTask);

      if (isNewRequest || !this.currentTaskId) {
        // Extract the security request from the message
        const securityRequest = extractSecurityRequest(content);

        // Create a new security task
        this.currentTaskId = await this.securityTaskManager.createSecurityTask(
          securityRequest,
          content,
        );

        // Extract and add security requirements
        const requirements = extractSecurityRequirements(content);
        for (const req of requirements) {
          await this.securityTaskManager.addSecurityRequirement(
            this.currentTaskId,
            req,
          );
        }

        // Store decision about new task
        await this.taskSystemAdapter.storeDecision(
          "New Security Task",
          `Created new security task: ${securityRequest}`,
          {
            taskId: this.currentTaskId,
            timestamp: Date.now(),
          },
        );

        return;
      }

      // If we have a current task, check if we need to transition stage
      if (this.currentTaskId && currentTask) {
        // Call determineNextSecurityStage with the correct type
        const nextStage = determineNextSecurityStage(currentTask, content);

        if (nextStage && nextStage !== currentTask.currentStage) {
          await this.securityTaskManager.transitionTaskStage(
            this.currentTaskId,
            nextStage,
            `Transitioning based on conversation flow`,
          );

          // Store decision about stage transition
          await this.taskSystemAdapter.storeDecision(
            "Security Stage Transition",
            `Transitioned from ${currentTask.currentStage} to ${nextStage}`,
            {
              previousStage: currentTask.currentStage,
              newStage: nextStage,
              timestamp: Date.now(),
            },
          );
        }
      }
    } catch (error) {
      console.error("Error handling security task workflow:", error);
    }
  }

  /**
   * Determine if the message contains a security finding
   */
  private containsSecurityFinding(content: string): boolean {
    const securityFindingIndicators = [
      "vulnerability",
      "security issue",
      "security risk",
      "CVE-",
      "OWASP",
      "injection",
      "XSS",
      "CSRF",
      "authentication issue",
      "authorization issue",
      "data exposure",
      "insecure",
    ];

    return securityFindingIndicators.some((indicator) =>
      content.toLowerCase().includes(indicator.toLowerCase()),
    );
  }

  /**
   * Determine the severity of a security finding
   */
  private determineSeverity(content: string): string {
    const lowSeverityIndicators = [
      "low severity",
      "minor issue",
      "informational",
    ];
    const mediumSeverityIndicators = ["medium severity", "moderate issue"];
    const highSeverityIndicators = [
      "high severity",
      "critical issue",
      "urgent",
      "immediate attention",
    ];

    if (
      highSeverityIndicators.some((indicator) =>
        content.toLowerCase().includes(indicator.toLowerCase()),
      )
    ) {
      return "high";
    } else if (
      mediumSeverityIndicators.some((indicator) =>
        content.toLowerCase().includes(indicator.toLowerCase()),
      )
    ) {
      return "medium";
    } else {
      return "low";
    }
  }

  /**
   * Get the reason for returning to the coordinator
   */
  private getCoordinationReason(content: string): string {
    const coordinationPhrases = [
      {
        phrase: "need development assistance",
        reason: "Development assistance required",
      },
      { phrase: "need developer input", reason: "Developer input needed" },
      { phrase: "needs to be implemented", reason: "Implementation required" },
      { phrase: "needs code changes", reason: "Code changes needed" },
      { phrase: "implementation required", reason: "Implementation required" },
      { phrase: "code refactoring needed", reason: "Code refactoring needed" },
      {
        phrase: "need technical documentation",
        reason: "Technical documentation needed",
      },
      { phrase: "needs testing", reason: "Testing required" },
      {
        phrase: "should be reviewed by developer",
        reason: "Developer review needed",
      },
      {
        phrase: "consult with developer",
        reason: "Developer consultation needed",
      },
    ];

    for (const { phrase, reason } of coordinationPhrases) {
      if (content.toLowerCase().includes(phrase.toLowerCase())) {
        return reason;
      }
    }

    return "Other agent assistance required";
  }

  /**
   * Determine if we should return to the coordinator
   */
  private shouldReturnToCoordinator(content: string): boolean {
    // Logic to determine if we should return control to the coordinator
    // Look for phrases suggesting other agent involvement is needed
    const coordinationPhrases = [
      "need development assistance",
      "need developer input",
      "needs to be implemented",
      "needs code changes",
      "implementation required",
      "code refactoring needed",
      "need technical documentation",
      "needs testing",
      "should be reviewed by developer",
      "consult with developer",
    ];

    return coordinationPhrases.some((phrase) =>
      content.toLowerCase().includes(phrase.toLowerCase()),
    );
  }

  /**
   * Get the transaction manager for the task manager
   */
  private getTransactionManager() {
    return {
      beginTransaction: async () => {},
      commitTransaction: async () => {},
      rollbackTransaction: async () => {},
    };
  }
}
