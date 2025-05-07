/**
 * WorkflowContext - Manages context during agent workflow execution
 *
 * This class is responsible for tracking execution paths, preserving context
 * between agent transitions, and detecting potential infinite loops in the workflow.
 */

import { BaseMessage } from "@langchain/core/messages";
import { v4 as uuidv4 } from "uuid";
import { AgentType } from "../../core/types.js";

/**
 * Conversation turn with agent
 */
export interface AgentConversationTurn {
  agentType: AgentType;
  messages: BaseMessage[];
  timestamp: number;
  metadata: Record<string, any>;
}

/**
 * WorkflowContext maintains state across agent transitions
 */
export class WorkflowContext {
  private readonly id: string;
  private readonly conversationHistory: AgentConversationTurn[] = [];
  private readonly agentVisits: Map<AgentType, number> = new Map();
  private readonly metadata: Map<string, any> = new Map();
  private readonly maxCycleDetectionLength: number = 5;

  // Properties used by workflow engine and graph
  public currentAgentType: AgentType;
  public previousAgentTypes: AgentType[] = [];
  public taskContent: string = "";
  public additionalData: Record<string, any> = {};

  /**
   * Create a new workflow context
   */
  constructor(id?: string, currentAgentType?: AgentType) {
    this.id = id || uuidv4();
    this.currentAgentType = currentAgentType || AgentType.COORDINATOR;
  }

  /**
   * Get the context ID
   */
  public getId(): string {
    return this.id;
  }

  /**
   * Add a conversation turn with an agent
   */
  public addConversationTurn(
    agentType: AgentType,
    messages: BaseMessage[],
    metadata: Record<string, any> = {},
  ): void {
    // Record the conversation turn
    this.conversationHistory.push({
      agentType,
      messages: [...messages], // Copy to prevent mutations
      timestamp: Date.now(),
      metadata: { ...metadata },
    });

    // Track agent visits for cycle detection
    const visits = this.agentVisits.get(agentType) || 0;
    this.agentVisits.set(agentType, visits + 1);
  }

  /**
   * Get the most recent agent that handled this context
   */
  public getCurrentAgent(): AgentType | undefined {
    if (this.conversationHistory.length === 0) {
      return undefined;
    }

    return this.conversationHistory[this.conversationHistory.length - 1]
      .agentType;
  }

  /**
   * Get the full conversation history
   */
  public getConversationHistory(): AgentConversationTurn[] {
    return [...this.conversationHistory];
  }

  /**
   * Get the conversation history for a specific agent
   */
  public getAgentConversation(agentType: AgentType): AgentConversationTurn[] {
    return this.conversationHistory.filter(
      (turn) => turn.agentType === agentType,
    );
  }

  /**
   * Get all messages in the conversation as a flat array
   */
  public getAllMessages(): BaseMessage[] {
    return this.conversationHistory.flatMap((turn) => turn.messages);
  }

  /**
   * Check if we might be in a cycle (repeated agent transitions)
   */
  public detectCycle(): { hasCycle: boolean; cyclePattern?: AgentType[] } {
    // Get the most recent agents in the conversation
    const recentAgents = this.conversationHistory
      .slice(-this.maxCycleDetectionLength * 2)
      .map((turn) => turn.agentType);

    if (recentAgents.length < 4) {
      return { hasCycle: false };
    }

    // Check for repeating patterns
    for (
      let patternLength = 2;
      patternLength <= Math.floor(recentAgents.length / 2);
      patternLength++
    ) {
      const potentialPattern = recentAgents.slice(-patternLength);
      const previousSection = recentAgents.slice(
        -2 * patternLength,
        -patternLength,
      );

      // Check if the pattern repeats
      let isPattern = true;
      for (let i = 0; i < patternLength; i++) {
        if (potentialPattern[i] !== previousSection[i]) {
          isPattern = false;
          break;
        }
      }

      if (isPattern) {
        return {
          hasCycle: true,
          cyclePattern: potentialPattern,
        };
      }
    }

    return { hasCycle: false };
  }

  /**
   * Store metadata in the context
   */
  public setMetadata(key: string, value: any): void {
    this.metadata.set(key, value);
  }

  /**
   * Get metadata from the context
   */
  public getMetadata(key: string): any {
    return this.metadata.get(key);
  }

  /**
   * Get all metadata
   */
  public getAllMetadata(): Record<string, any> {
    return Object.fromEntries(this.metadata.entries());
  }

  /**
   * Create a summary of the context for debugging or visualization
   */
  public summarize(): Record<string, any> {
    const agentCounts = Object.fromEntries(this.agentVisits.entries());
    const totalMessages = this.getAllMessages().length;

    const cycleDetection = this.detectCycle();

    return {
      id: this.id,
      conversationTurns: this.conversationHistory.length,
      totalMessages,
      agentCounts,
      currentAgent: this.getCurrentAgent(),
      cycleDetected: cycleDetection.hasCycle,
      cyclePattern: cycleDetection.cyclePattern,
      metadata: this.getAllMetadata(),
    };
  }

  /**
   * Serialize the context to JSON
   */
  public toJSON(): string {
    return JSON.stringify({
      id: this.id,
      conversationHistory: this.conversationHistory,
      agentVisits: Array.from(this.agentVisits.entries()),
      metadata: Array.from(this.metadata.entries()),
    });
  }

  /**
   * Create a context from JSON
   */
  public static fromJSON(json: string): WorkflowContext {
    const data = JSON.parse(json);
    const context = new WorkflowContext(data.id);

    // Restore conversation history
    data.conversationHistory.forEach((turn: AgentConversationTurn) => {
      context.conversationHistory.push(turn);
    });

    // Restore agent visits
    data.agentVisits.forEach(([agentType, count]: [AgentType, number]) => {
      context.agentVisits.set(agentType, count);
    });

    // Restore metadata
    data.metadata.forEach(([key, value]: [string, any]) => {
      context.metadata.set(key, value);
    });

    return context;
  }
}
