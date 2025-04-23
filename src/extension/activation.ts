import * as vscode from "vscode";
import {
  deactivateMultiAgentSystem,
  handleAIgentsMessage,
} from "./handlers/aigentsMode";
import { updateChatViewForMode } from "./ui/chatView";
import { registerModes } from "./ui/modes";

/**
 * Activate the extension
 * This is called when the extension is first loaded
 */
export function activate(context: vscode.ExtensionContext) {
  console.log("Activating AI Dev Agents extension");

  // Register mode-related commands
  registerModes(context);

  // Register command to update chat view for different modes
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "aiDevAgents.updateChatViewForMode",
      (mode: string) => updateChatViewForMode(mode),
    ),
  );

  // Register command to handle messages in AIgents mode
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "aiDevAgents.sendAIgentsMessage",
      async (message: string) => {
        try {
          return await handleAIgentsMessage(message);
        } catch (error) {
          vscode.window.showErrorMessage(`Error: ${error.message}`);
          return null;
        }
      },
    ),
  );

  // Intercept the chat input based on current mode
  // Note: This is a placeholder and would need to be implemented
  // based on how the extension's message handling works
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor.chat.sendMessage",
      async (args) => {
        // Get the current mode
        const currentMode = vscode.workspace
          .getConfiguration("cursor")
          .get("editorMode");

        if (currentMode === "aigents") {
          // Redirect to our AIgents mode handler
          return await vscode.commands.executeCommand(
            "aiDevAgents.sendAIgentsMessage",
            args.message,
          );
        } else {
          // Let the default handler process other modes
          // We're using a different command name to avoid infinite recursion
          return await vscode.commands.executeCommand(
            "cursor.chat.sendMessageOriginal",
            args,
          );
        }
      },
      null,
      true,
    ), // true to override existing command
  );

  // Register the original send message command with a different name
  // This is necessary to avoid losing the original functionality
  // Note: This is a placeholder and would need to be implemented
  // based on how the extension's message handling works
  context.subscriptions.push(
    vscode.commands.registerCommand(
      "cursor.chat.sendMessageOriginal",
      async (args) => {
        // Call the original implementation
        // This is just a placeholder - in reality, we would need to
        // preserve the original implementation
        console.log("Original message handler called", args);
        return `Original response for: ${args.message}`;
      },
    ),
  );

  console.log("AI Dev Agents extension activated");
}

/**
 * Deactivate the extension
 * This is called when the extension is unloaded
 */
export function deactivate() {
  console.log("Deactivating AI Dev Agents extension");

  // Shut down the multi-agent system if it's active
  deactivateMultiAgentSystem();
}
