import * as vscode from "vscode";
import { updateAIgentsUI } from "../handlers/aigentsMode.js";
import { EditorMode } from "./modes";

/**
 * Update the chat view based on the current editor mode
 * This is called when the mode changes in the dropdown
 */
export function updateChatViewForMode(mode: string) {
  console.log(`Updating chat view for mode: ${mode}`);

  // Handle different modes
  switch (mode) {
    case EditorMode.AIGENTS:
      // Update the UI for AIgents mode
      updateAIgentsUI(true);
      break;
    case EditorMode.AGENT:
    case EditorMode.CHAT:
    case EditorMode.EDIT:
      // Hide AIgents-specific UI elements
      updateAIgentsUI(false);
      break;
    default:
      console.warn(`Unknown editor mode: ${mode}`);
  }

  // Set a VS Code context variable that can be used for menu visibility conditions
  vscode.commands.executeCommand("setContext", "aiDevAgents.currentMode", mode);
}

/**
 * Show or hide the agent status indicator
 */
function showAgentStatusIndicator(show: boolean) {
  console.log(`${show ? "Showing" : "Hiding"} agent status indicator`);

  // In the actual implementation, this would:
  // 1. Create the status indicator if it doesn't exist
  // 2. Show or hide the indicator based on the 'show' parameter
  // 3. Update the indicator to show which agent is active
}

/**
 * Format message for AIgents mode
 * This adds agent-specific styling and information to messages
 */
export function formatAIgentsMessage(
  message: string,
  agentId: string,
  isResponse: boolean,
) {
  // Add agent identifier and styling to the message
  return {
    text: message,
    agentId,
    isResponse,
    formatted: `[${agentId}] ${message}`,
  };
}
