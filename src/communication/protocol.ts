/**
 * Agent Communication Protocol
 *
 * This module handles message passing between agents in our system.
 * It provides a central communication bus, message validation,
 * and routing services.
 */

import { EventEmitter } from "events";
import { AgentMessage, AgentType } from "../types";

/**
 * Communication Bus that handles message passing between agents
 */
export class AgentCommunicationBus extends EventEmitter {
  private static instance: AgentCommunicationBus;
  private subscribers: Map<
    AgentType | "all",
    Set<(message: AgentMessage) => void>
  >;
  private messageLog: AgentMessage[];

  private constructor() {
    super();
    this.subscribers = new Map();
    this.messageLog = [];
  }

  /**
   * Get the singleton instance of the communication bus
   */
  public static getInstance(): AgentCommunicationBus {
    if (!AgentCommunicationBus.instance) {
      AgentCommunicationBus.instance = new AgentCommunicationBus();
    }
    return AgentCommunicationBus.instance;
  }

  /**
   * Send a message to the specified recipient
   */
  public async sendMessage(message: AgentMessage): Promise<void> {
    // Validate message
    if (!this.validateMessage(message)) {
      throw new Error("Invalid message format");
    }

    // Log the message
    this.logMessage(message);

    // Emit an event for this message
    this.emit("message", message);

    // Notify subscribers
    this.notifySubscribers(message);
  }

  /**
   * Subscribe to messages for a specific agent type
   */
  public subscribe(
    agentType: AgentType | "all",
    callback: (message: AgentMessage) => void,
  ): () => void {
    // Get or create the set of subscribers for this agent type
    let subscribers = this.subscribers.get(agentType);
    if (!subscribers) {
      subscribers = new Set();
      this.subscribers.set(agentType, subscribers);
    }

    // Add the callback to the subscribers
    subscribers.add(callback);

    // Return a function to unsubscribe
    return () => {
      const subscribersSet = this.subscribers.get(agentType);
      if (subscribersSet) {
        subscribersSet.delete(callback);
      }
    };
  }

  /**
   * Get the message log
   */
  public getMessageLog(): AgentMessage[] {
    return [...this.messageLog];
  }

  /**
   * Clear the message log
   */
  public clearMessageLog(): void {
    this.messageLog = [];
  }

  /**
   * Validate a message
   */
  private validateMessage(message: AgentMessage): boolean {
    // Basic validation
    if (!message || typeof message !== "object") {
      return false;
    }

    // Check required fields
    if (
      !message.id ||
      !message.from ||
      !message.to ||
      !message.type ||
      !message.timestamp
    ) {
      return false;
    }

    // Check that content exists
    if (message.content === undefined) {
      return false;
    }

    return true;
  }

  /**
   * Log a message
   */
  private logMessage(message: AgentMessage): void {
    this.messageLog.push(message);

    // Limit log size
    if (this.messageLog.length > 1000) {
      this.messageLog = this.messageLog.slice(-1000);
    }
  }

  /**
   * Notify subscribers of a message
   */
  private notifySubscribers(message: AgentMessage): void {
    // Notify all subscribers
    const allSubscribers = this.subscribers.get("all");
    if (allSubscribers) {
      allSubscribers.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
    }

    // Notify specific agent subscribers
    const agentSubscribers = this.subscribers.get(message.to as AgentType);
    if (agentSubscribers) {
      agentSubscribers.forEach((callback) => {
        try {
          callback(message);
        } catch (error) {
          console.error("Error in subscriber callback:", error);
        }
      });
    }
  }
}
