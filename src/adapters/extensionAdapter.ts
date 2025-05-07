import { LLMAdapterFactory } from "./llm/llmAdapter";

/**
 * Command identifiers for AIgents extension
 */
export enum AIgentsCommands {
  ACTIVATE = "aiDevAgents.activate",
  DEACTIVATE = "aiDevAgents.deactivate",
  SWITCH_MODE = "aiDevAgents.switchMode",
  SEND_MESSAGE = "aiDevAgents.sendMessage",
  GET_STATUS = "aiDevAgents.getStatus",
  RESET_AGENTS = "aiDevAgents.resetAgents",
  EXECUTE_AGENT_ACTION = "aiDevAgents.executeAgentAction",
}

/**
 * Adapter for interfacing with the VS Code extension
 */
export class ExtensionAdapter {
  private initialized: boolean = false;
  private continueApi: any = null;
  private vscode: any = null;
  private extensionContext: any = null;

  /**
   * Initialize the adapter
   * @param vscodeApi The VS Code API
   * @param context The extension context
   */
  public async initialize(vscodeApi?: any, context?: any): Promise<void> {
    if (this.initialized) {
      return;
    }

    try {
      // Store VS Code API and context if provided
      this.vscode = vscodeApi;
      this.extensionContext = context;

      // In a real implementation, we would get the Continue APIs from the VS Code extension
      // For now, we'll set up a mock structure to test the integration
      this.setupMockContinueApi();

      // Initialize the Continue integration
      LLMAdapterFactory.setIdeMessenger(this.continueApi?.ideMessenger);

      this.initialized = true;
      console.log("Extension adapter initialized");
    } catch (error) {
      console.error("Failed to initialize extension adapter", error);
    }
  }

  /**
   * Set up a mock Continue API for testing
   * In a real implementation, this would get the actual Continue APIs from the extension
   */
  private setupMockContinueApi(): void {
    this.continueApi = {
      ideMessenger: {
        llmStreamChat: async (
          message: string,
          options: any,
        ): Promise<string> => {
          console.log(
            "Mock Continue ideMessenger.llmStreamChat called with:",
            message,
          );
          return "This is a mock response from Continue's LLM integration";
        },
        getAvailableModels: async (): Promise<string[]> => {
          return [
            "gpt-3.5-turbo",
            "gpt-4",
            "claude-3-opus",
            "local-llama2",
            "local-mistral",
          ];
        },
        getCurrentModel: async (): Promise<string> => {
          return "local-llama2";
        },
      },
      // Add other Continue APIs as needed
    };
  }

  /**
   * Register commands with VS Code
   */
  public registerCommands(handlers?: {
    activateHandler?: () => Promise<void>;
    deactivateHandler?: () => Promise<void>;
    switchModeHandler?: (mode: string) => Promise<void>;
    sendMessageHandler?: (message: string) => Promise<string>;
    getStatusHandler?: () => Promise<any>;
    resetAgentsHandler?: () => Promise<void>;
    executeAgentActionHandler?: (action: string, params: any) => Promise<any>;
  }): void {
    if (!this.initialized) {
      throw new Error("Extension adapter not initialized");
    }

    if (!this.vscode || !this.extensionContext) {
      console.log("Mock command registration (VS Code API not provided)");
      return;
    }

    const { commands, window } = this.vscode;
    const subscriptions = this.extensionContext.subscriptions;

    // Register the activate command
    subscriptions.push(
      commands.registerCommand(AIgentsCommands.ACTIVATE, async () => {
        try {
          if (handlers?.activateHandler) {
            await handlers.activateHandler();
          } else {
            window.showInformationMessage("AIgents mode activated");
          }
        } catch (error) {
          window.showErrorMessage(`Failed to activate AIgents: ${error}`);
        }
      }),
    );

    // Register the deactivate command
    subscriptions.push(
      commands.registerCommand(AIgentsCommands.DEACTIVATE, async () => {
        try {
          if (handlers?.deactivateHandler) {
            await handlers.deactivateHandler();
          } else {
            window.showInformationMessage("AIgents mode deactivated");
          }
        } catch (error) {
          window.showErrorMessage(`Failed to deactivate AIgents: ${error}`);
        }
      }),
    );

    // Register the switch mode command
    subscriptions.push(
      commands.registerCommand(
        AIgentsCommands.SWITCH_MODE,
        async (mode: string) => {
          try {
            if (handlers?.switchModeHandler) {
              await handlers.switchModeHandler(mode);
            } else {
              window.showInformationMessage(`Switched to mode: ${mode}`);
            }
          } catch (error) {
            window.showErrorMessage(`Failed to switch mode: ${error}`);
          }
        },
      ),
    );

    // Register the send message command
    subscriptions.push(
      commands.registerCommand(
        AIgentsCommands.SEND_MESSAGE,
        async (message: string) => {
          try {
            if (handlers?.sendMessageHandler) {
              return await handlers.sendMessageHandler(message);
            } else {
              window.showInformationMessage(`Message sent: ${message}`);
              return `Mock response to: ${message}`;
            }
          } catch (error) {
            window.showErrorMessage(`Failed to send message: ${error}`);
            throw error;
          }
        },
      ),
    );

    // Register the get status command
    subscriptions.push(
      commands.registerCommand(AIgentsCommands.GET_STATUS, async () => {
        try {
          if (handlers?.getStatusHandler) {
            return await handlers.getStatusHandler();
          } else {
            return { status: "active", mode: "AIgents" };
          }
        } catch (error) {
          window.showErrorMessage(`Failed to get status: ${error}`);
          throw error;
        }
      }),
    );

    // Register the reset agents command
    subscriptions.push(
      commands.registerCommand(AIgentsCommands.RESET_AGENTS, async () => {
        try {
          if (handlers?.resetAgentsHandler) {
            await handlers.resetAgentsHandler();
          } else {
            window.showInformationMessage("Agent system reset");
          }
        } catch (error) {
          window.showErrorMessage(`Failed to reset agents: ${error}`);
        }
      }),
    );

    // Register the execute agent action command
    subscriptions.push(
      commands.registerCommand(
        AIgentsCommands.EXECUTE_AGENT_ACTION,
        async (action: string, params: any) => {
          try {
            if (handlers?.executeAgentActionHandler) {
              return await handlers.executeAgentActionHandler(action, params);
            } else {
              window.showInformationMessage(`Executing action: ${action}`);
              return { success: true, action, result: "Mock action executed" };
            }
          } catch (error) {
            window.showErrorMessage(`Failed to execute action: ${error}`);
            throw error;
          }
        },
      ),
    );

    console.log("AIgents commands registered with VS Code");
  }

  /**
   * Send a message to the VS Code extension
   */
  public async sendMessage(message: any): Promise<any> {
    if (!this.initialized) {
      throw new Error("Extension adapter not initialized");
    }

    // Here we would send a message to the VS Code extension
    console.log("Message sent to VS Code extension", message);
    return { success: true };
  }

  /**
   * Get the selected LLM model from the VS Code extension
   */
  public async getSelectedModel(): Promise<string> {
    if (!this.initialized) {
      throw new Error("Extension adapter not initialized");
    }

    if (this.continueApi?.ideMessenger) {
      return this.continueApi.ideMessenger.getCurrentModel();
    }

    return "gpt-4";
  }

  /**
   * Get available models from the VS Code extension
   */
  public async getAvailableModels(): Promise<string[]> {
    if (!this.initialized) {
      throw new Error("Extension adapter not initialized");
    }

    if (this.continueApi?.ideMessenger) {
      return this.continueApi.ideMessenger.getAvailableModels();
    }

    return ["gpt-3.5-turbo", "gpt-4", "claude-3-opus", "claude-3-sonnet"];
  }

  /**
   * Get the Continue API
   */
  public getContinueApi(): any {
    return this.continueApi;
  }
}
