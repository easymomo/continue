import * as vscode from "vscode";
import {
  activateMultiAgentSystem,
  deactivateMultiAgentSystem,
} from "../handlers/aigentsMode";

/**
 * Enum defining all available editor modes
 */
export enum EditorMode {
  AGENT = "agent",
  CHAT = "chat",
  EDIT = "edit",
  AIGENTS = "aigents", // Our custom mode
}

/**
 * Register mode-related commands and functionality
 */
export function registerModes(context: vscode.ExtensionContext) {
  // Register command to switch to AIgents mode
  context.subscriptions.push(
    vscode.commands.registerCommand("aiDevAgents.switchToAIgentsMode", () => {
      // Set the context variable used by VS Code for UI state
      vscode.commands.executeCommand(
        "setContext",
        "cursor.editorMode",
        EditorMode.AIGENTS,
      );
      // Activate our multi-agent system
      activateMultiAgentSystem();
      // Update UI to reflect mode change
      updateModeIndicator(EditorMode.AIGENTS);
    }),
  );

  // Register command to handle mode changes from the dropdown
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "aiDevAgents.handleModeChange",
      (newMode: string) => {
        const oldMode = getCurrentMode();

        // First handle deactivation of the old mode
        if (oldMode === EditorMode.AIGENTS && newMode !== EditorMode.AIGENTS) {
          deactivateMultiAgentSystem();
        }

        // Then handle activation of the new mode
        if (newMode === EditorMode.AIGENTS) {
          activateMultiAgentSystem();
        }

        // Update the mode in VS Code configuration
        vscode.workspace
          .getConfiguration("cursor")
          .update("editorMode", newMode, true);

        // Update the UI for the new mode
        updateModeIndicator(newMode);

        // Update the chat view for the new mode
        vscode.commands.executeCommand(
          "aiDevAgents.updateChatViewForMode",
          newMode,
        );
      },
    ),
  );
}

/**
 * Update the mode indicator in the UI
 */
export function updateModeIndicator(mode: string) {
  console.log(`Updating mode indicator to: ${mode}`);

  // In the actual implementation, this would update visual indicators
  // in the VS Code UI to show which mode is active

  // Set a VS Code context variable that can be used for menu visibility and UI updates
  vscode.commands.executeCommand("setContext", "cursor.editorMode", mode);
}

/**
 * Create and return a mode selector button element
 * This would be called during the webview creation
 */
export function createModeSelectorButton() {
  // This is a placeholder function that would need to be implemented
  // with the actual UI framework used by the extension

  // The implementation would create a dropdown button with options for
  // Agent, Chat, Edit, and AIgents modes

  // It would also attach event handlers to switch modes when an option is selected

  // Return a placeholder for now
  return {
    id: "mode-selector",
    modes: Object.values(EditorMode),
    currentMode: getCurrentMode(),
  };
}

/**
 * Get the current editor mode
 */
export function getCurrentMode(): EditorMode {
  // Get the current mode from VS Code configuration
  const currentMode = vscode.workspace
    .getConfiguration("cursor")
    .get("editorMode");

  // Validate that it's a valid mode
  if (Object.values(EditorMode).includes(currentMode as EditorMode)) {
    return currentMode as EditorMode;
  }

  // Default to Agent mode if invalid
  return EditorMode.AGENT;
}
