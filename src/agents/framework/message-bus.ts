/**
 * Message Bus
 *
 * Facilitates communication between agents in the AIgents framework.
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { agentRegistry } from "./agent-registry.js";
import { Message, MessageType } from "./types.js";

class MessageBus extends EventEmitter {
  // Map of message ID to message
  private messages: Map<string, Message> = new Map();

  // Map of agent ID to event emitter instance for that agent
  private agentEmitters: Map<string, EventEmitter> = new Map();

  /**
   * Create a new MessageBus
   */
  constructor() {
    super();

    // Listen for agent registration/deregistration to set up emitters
    agentRegistry.on("agent:registered", (data) => {
      this.createAgentEmitter(data.id);
    });

    agentRegistry.on("agent:deregistered", (data) => {
      this.removeAgentEmitter(data.id);
    });
  }

  /**
   * Send a message to a specific agent
   *
   * @param from Sender agent ID
   * @param to Recipient agent ID
   * @param type Message type
   * @param content Message content
   * @returns Message ID
   */
  public async sendMessage(
    from: string,
    to: string,
    subject: string,
    content: any,
    type: MessageType = MessageType.REQUEST,
  ): Promise<string> {
    // Create message
    const message: Message = {
      id: uuidv4(),
      type,
      sender: from,
      recipients: [to],
      subject,
      content,
      timestamp: new Date().toISOString(),
    };

    // Store message
    this.messages.set(message.id, message);

    // Emit global message sent event
    this.emit("message:sent", {
      messageId: message.id,
      from,
      to,
      type,
    });

    // Emit message event to recipient
    const recipientEmitter = this.agentEmitters.get(to);
    if (recipientEmitter) {
      recipientEmitter.emit("message", message);
    }

    return message.id;
  }

  /**
   * Broadcast a message to all agents
   *
   * @param from Sender agent ID
   * @param type Message type
   * @param content Message content
   * @returns Message ID
   */
  public async broadcastMessage(
    from: string,
    subject: string,
    content: any,
    type: MessageType = MessageType.EVENT,
  ): Promise<string> {
    // Create message
    const message: Message = {
      id: uuidv4(),
      type,
      sender: from,
      recipients: "broadcast",
      subject,
      content,
      timestamp: new Date().toISOString(),
    };

    // Store message
    this.messages.set(message.id, message);

    // Emit global message broadcast event
    this.emit("message:broadcast", {
      messageId: message.id,
      from,
      type,
    });

    // Emit message event to all agents
    const agentIds = Array.from(this.agentEmitters.keys());
    for (const agentId of agentIds) {
      if (agentId !== from) {
        // Don't send to sender
        const emitter = this.agentEmitters.get(agentId);
        if (emitter) {
          emitter.emit("message", message);
        }
      }
    }

    return message.id;
  }

  /**
   * Register an agent to receive messages
   *
   * @param agentId Agent ID
   * @param handler Message handler function
   * @returns Unsubscribe function
   */
  public registerMessageHandler(
    agentId: string,
    handler: (message: Message) => void,
  ): () => void {
    // Get or create agent emitter
    const emitter = this.getAgentEmitter(agentId);

    // Add message handler
    emitter.on("message", handler);

    // Return unsubscribe function
    return () => {
      emitter.off("message", handler);
    };
  }

  /**
   * Get a message by ID
   *
   * @param messageId Message ID
   * @returns Message or undefined
   */
  public getMessage(messageId: string): Message | undefined {
    return this.messages.get(messageId);
  }

  /**
   * Get all messages sent by an agent
   *
   * @param agentId Agent ID
   * @returns Array of messages
   */
  public getMessagesSentBy(agentId: string): Message[] {
    return Array.from(this.messages.values()).filter(
      (message) => message.sender === agentId,
    );
  }

  /**
   * Get all messages received by an agent
   *
   * @param agentId Agent ID
   * @returns Array of messages
   */
  public getMessagesReceivedBy(agentId: string): Message[] {
    return Array.from(this.messages.values()).filter(
      (message) =>
        (Array.isArray(message.recipients) &&
          message.recipients.includes(agentId)) ||
        message.recipients === "broadcast",
    );
  }

  /**
   * Get all messages of a specific type
   *
   * @param type Message type
   * @returns Array of messages
   */
  public getMessagesByType(type: MessageType): Message[] {
    return Array.from(this.messages.values()).filter(
      (message) => message.type === type,
    );
  }

  /**
   * Clear all stored messages
   */
  public clearMessages(): void {
    this.messages.clear();
    this.emit("messages:cleared");
  }

  /**
   * Get or create an event emitter for an agent
   *
   * @param agentId Agent ID
   * @returns EventEmitter instance
   */
  private getAgentEmitter(agentId: string): EventEmitter {
    if (!this.agentEmitters.has(agentId)) {
      this.createAgentEmitter(agentId);
    }

    return this.agentEmitters.get(agentId)!;
  }

  /**
   * Create an event emitter for an agent
   *
   * @param agentId Agent ID
   */
  private createAgentEmitter(agentId: string): void {
    const emitter = new EventEmitter();
    this.agentEmitters.set(agentId, emitter);
  }

  /**
   * Remove an agent's event emitter
   *
   * @param agentId Agent ID
   */
  private removeAgentEmitter(agentId: string): void {
    this.agentEmitters.delete(agentId);
  }
}

// Export singleton instance
export const messageBus = new MessageBus();

// Also export the class for testing/mocking
export { MessageBus };
