/**
 * AI Dev Agents - Multi-Agent System
 *
 * Main entry point for the agent system that replaces the single agent
 * in the VS Code extension with a team of specialized agents.
 */

import { AgentSystem } from "./core/agentSystem";
import { SystemFactory } from "./core/systemFactory";
import { MessageType } from "./messaging/messageRouter";

/**
 * AIgents - Multi-agent system for AI-assisted software development
 */
class AIgents {
  private system: AgentSystem | null = null;

  /**
   * Initialize the AIgents system
   */
  public async initialize(apiKey?: string): Promise<void> {
    console.log("Initializing AIgents system...");
    try {
      this.system = await SystemFactory.createDefaultSystem(apiKey);
      console.log("AIgents system initialized successfully");
    } catch (error) {
      console.error("Failed to initialize AIgents system:", error);
      throw error;
    }
  }

  /**
   * Process a user message through the agent system
   */
  public async processMessage(message: string): Promise<any> {
    if (!this.system) {
      throw new Error("AIgents system not initialized");
    }

    try {
      // Create a message for the coordinator agent
      const router = this.system.getMessageRouter();
      const agentMessage = router.createMessage(
        MessageType.QUERY,
        "user", // The message is from the user
        message,
      );

      // Process the message through the agent system
      const response = await this.system.processMessage(agentMessage);
      return response;
    } catch (error) {
      console.error("Error processing message:", error);
      throw error;
    }
  }

  /**
   * Get the agent system instance
   */
  public getSystem(): AgentSystem | null {
    return this.system;
  }
}

// Export the AIgents class
export default AIgents;

// Create and export a singleton instance
export const aigents = new AIgents();

// Export other key components for direct access
export { AgentType } from "./agents/core/types";
export { AgentSystem } from "./core/agentSystem";
export { SystemFactory } from "./core/systemFactory";
export { AgentMessage, MessageType } from "./messaging/messageRouter";

// For testing or direct usage
if (require.main === module) {
  (async () => {
    try {
      await aigents.initialize();
      const response = await aigents.processMessage(
        "Hello, I need help with implementing a React component.",
      );
      console.log("Response:", response);
    } catch (error) {
      console.error("Error:", error);
    }
  })();
}
