/**
 * AI Dev Agents - Multi-Agent System
 *
 * Main entry point for the agent system that replaces the single agent
 * in the VS Code extension with a team of specialized agents.
 */

import { AgentAdapter } from "./agents/adapter";
import { AgentCommunicationBus } from "./communication/protocol";
import { SharedMemory } from "./memory/shared";

/**
 * Initialize the agent system
 */
export function initializeAgentSystem() {
  console.log("Initializing AI Dev Agents system...");

  // Initialize the agent adapter
  const agentAdapter = new AgentAdapter();

  // Initialize shared systems
  const communicationBus = AgentCommunicationBus.getInstance();
  const sharedMemory = SharedMemory.getInstance();

  console.log("Agent system initialized successfully");

  return {
    adapter: agentAdapter,
    communicationBus,
    sharedMemory,
  };
}

/**
 * Export all components
 */
export * from "./agents/adapter";
export * from "./agents/adapter/redux-middleware";
export * from "./agents/base";
export * from "./agents/coordinator";
export * from "./communication/protocol";
export * from "./memory/shared";
export * from "./types";
