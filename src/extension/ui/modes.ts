import * as vscode from 'vscode';
import { activateMultiAgentSystem } from '../handlers/aigentsMode';

/**
 * Enum defining all available editor modes
 */
export enum EditorMode {
  AGENT = 'agent',
  CHAT = 'chat',
  EDIT = 'edit',
  AIGENTS = 'aigents' // Our custom mode
}

/**
 * Register mode-related commands and functionality
 */
export function registerModes(context: vscode.ExtensionContext) {
  // Register command to switch to AIgents mode
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevAgents.switchToAIgentsMode', () => {
      // Set the context variable used by VS Code for UI state
      vscode.commands.executeCommand('setContext', 'cursor.editorMode', 'aigents');
      // Activate our multi-agent system
      activateMultiAgentSystem();
      // Update UI to reflect mode change
      updateModeIndicator('aigents');
    })
  );
  
  // Register command to update the mode indicator in the UI
  context.subscriptions.push(
    vscode.commands.registerCommand('aiDevAgents.updateModeIndicator', (mode: string) => {
      updateModeIndicator(mode);
    })
  );
}

/**
 * Update the UI to reflect the current mode
 */
function updateModeIndicator(mode: string) {
  // This will need to be implemented with the appropriate UI framework used by the extension
  // For now, this is a placeholder that will be replaced with actual UI code
  console.log(`Mode changed to: ${mode}`);
  
  // We'll need to get access to the DOM element for the mode selector
  // and update it to show the current mode
  
  // Also need to update any mode-specific UI elements
  if (mode === 'aigents') {
    // Show AIgents-specific UI elements
    vscode.commands.executeCommand('aiDevAgents.updateChatViewForMode', 'aigents');
  } else {
    // Hide AIgents-specific UI elements
    vscode.commands.executeCommand('aiDevAgents.updateChatViewForMode', mode);
  }
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
    id: 'mode-selector',
    modes: Object.values(EditorMode),
    currentMode: EditorMode.AGENT
  };
}

/**
 * Get the current editor mode
 */
export function getCurrentMode(): EditorMode {
  // Get the current mode from VS Code configuration
  const currentMode = vscode.workspace.getConfiguration('cursor').get('editorMode');
  
  // Validate that it's a valid mode
  if (Object.values(EditorMode).includes(currentMode as EditorMode)) {
    return currentMode as EditorMode;
  }
  
  // Default to Agent mode if invalid
  return EditorMode.AGENT;
} 