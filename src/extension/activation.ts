import * as vscode from "vscode";
import { ExtensionAdapter } from "../adapters/extensionAdapter";
import {
  activateMultiAgentSystem,
  deactivateMultiAgentSystem,
  handleAIgentsMessage,
} from "./handlers/aigentsMode";
import { updateChatViewForMode } from "./ui/chatView";
import { EditorMode, registerModes } from "./ui/modes";

// Extension adapter singleton
let extensionAdapter: ExtensionAdapter | null = null;

/**
 * Activate the extension
 * This is called when the extension is first loaded
 */
export async function activate(
  context: vscode.ExtensionContext,
): Promise<void> {
  console.log("Activating AI Dev Agents extension");

  try {
    // Initialize the extension adapter
    extensionAdapter = new ExtensionAdapter();
    await extensionAdapter.initialize(vscode, context);

    // Set AIgents mode context variable (for menu visibility)
    await vscode.commands.executeCommand(
      "setContext",
      "aiDevAgents.modeActive",
      false,
    );

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
        async (message: string, targetAgent?: string) => {
          try {
            return await handleAIgentsMessage(message, targetAgent);
          } catch (error) {
            const errorMessage =
              error instanceof Error ? error.message : String(error);
            vscode.window.showErrorMessage(`AIgents Error: ${errorMessage}`);
            return null;
          }
        },
      ),
    );

    // Add our extension to Continue's API surface
    // This registers our extension as a message handler
    registerMessageInterceptor();

    // Intercept the chat input based on current mode
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
      ),
    );

    // Register the original send message command with a different name
    // This is necessary to avoid losing the original functionality
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

    // Register all commands with handlers
    extensionAdapter.registerCommands({
      // Handler for activating AIgents mode
      activateHandler: async () => {
        await activateMultiAgentSystem();
        await vscode.commands.executeCommand(
          "setContext",
          "aiDevAgents.modeActive",
          true,
        );
        updateChatViewForMode(EditorMode.AIGENTS);
      },

      // Handler for deactivating AIgents mode
      deactivateHandler: async () => {
        deactivateMultiAgentSystem();
        await vscode.commands.executeCommand(
          "setContext",
          "aiDevAgents.modeActive",
          false,
        );
        updateChatViewForMode(EditorMode.CHAT);
      },

      // Handler for switching between modes
      switchModeHandler: async (mode: string) => {
        if (mode === EditorMode.AIGENTS) {
          await activateMultiAgentSystem();
          await vscode.commands.executeCommand(
            "setContext",
            "aiDevAgents.modeActive",
            true,
          );
        } else {
          deactivateMultiAgentSystem();
          await vscode.commands.executeCommand(
            "setContext",
            "aiDevAgents.modeActive",
            false,
          );
        }
        updateChatViewForMode(mode);
      },

      // Handler for sending messages to agents
      sendMessageHandler: async (message: string) => {
        return await handleAIgentsMessage(message);
      },

      // Handler for getting the current status of the agent system
      getStatusHandler: async () => {
        // Simple status check - we'll expand this later
        return {
          active:
            (await vscode.commands.executeCommand(
              "getContext",
              "aiDevAgents.modeActive",
            )) === true,
          mode: EditorMode.AIGENTS,
          availableAgents: ["master", "developer", "research", "security"],
        };
      },

      // Handler for resetting the agent system
      resetAgentsHandler: async () => {
        // Reset the agent system by deactivating and reactivating
        deactivateMultiAgentSystem();
        await activateMultiAgentSystem();
        vscode.window.showInformationMessage("Agent system reset successfully");
      },

      // Handler for executing specific agent actions
      executeAgentActionHandler: async (action: string, params: any) => {
        console.log(`Executing agent action: ${action}`, params);

        // Handle different action types
        switch (action) {
          case "searchDocumentation":
            return { success: true, results: ["Document 1", "Document 2"] };

          case "analyzeCode":
            return { success: true, analysis: "Code looks good!" };

          case "suggestFix":
            return { success: true, fix: "Add proper error handling" };

          default:
            throw new Error(`Unknown action: ${action}`);
        }
      },
    });

    // Register our contribution points in package.json
    console.log("AI Dev Agents extension activated");
  } catch (error) {
    console.error("Failed to activate AI Dev Agents extension:", error);
    vscode.window.showErrorMessage(
      `Failed to activate AI Dev Agents extension: ${error}`,
    );
  }
}

/**
 * Register our extension as a message interceptor for Continue
 */
function registerMessageInterceptor() {
  // We need to register our message interceptor with Continue's API
  // This should be done once Continue's API is available
  // For now, this is a placeholder
  try {
    // Check if Continue extension is available
    const continueExtension =
      vscode.extensions.getExtension("continue.continue");

    if (continueExtension) {
      console.log("Continue extension found, registering message interceptor");

      // This would be implemented based on Continue's actual API
      // For now, this is a placeholder that will be replaced with actual code
    } else {
      console.log(
        "Continue extension not found, skipping message interceptor registration",
      );
    }
  } catch (error) {
    console.error("Error registering message interceptor:", error);
  }
}

/**
 * Deactivate the extension
 * This is called when the extension is unloaded
 */
export function deactivate(): void {
  console.log("Deactivating AI Dev Agents extension");

  // Shut down the multi-agent system if it's active
  deactivateMultiAgentSystem();
}
