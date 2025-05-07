import { BaseLLMAdapter, LLMRequestOptions } from "./llmAdapter";

/**
 * Adapter for integrating with Continue's LLM infrastructure
 * This allows AIgents to use the Continue extension's LLM selections and providers
 */
export class ContinueLLMAdapter implements BaseLLMAdapter {
  private ideMessenger: any;
  private cachedModels: string[] = [];
  private cachedCurrentModel: string = "continue-default";

  /**
   * Create a new adapter with Continue's ideMessenger
   */
  constructor(ideMessenger: any) {
    this.ideMessenger = ideMessenger;
  }

  /**
   * Check if this adapter can be used with the given ideMessenger
   */
  public static canUse(ideMessenger: any): boolean {
    return ideMessenger && typeof ideMessenger.llmStreamChat === "function";
  }

  /**
   * Send a message to Continue's LLM infrastructure
   */
  public async sendMessage(
    message: string,
    options?: LLMRequestOptions,
  ): Promise<string> {
    if (!this.ideMessenger) {
      throw new Error("Continue integration not initialized");
    }

    try {
      // Prepare the options
      const requestOptions = {
        model: options?.model,
        temperature: options?.temperature || 0.5,
        maxTokens: options?.maxTokens,
        ...options,
      };

      // Stream is false to get the full response at once
      const response = await this.ideMessenger.llmStreamChat({
        message,
        stream: false,
        ...requestOptions,
      });

      if (!response || typeof response !== "string") {
        throw new Error("Invalid response from Continue LLM");
      }

      return response;
    } catch (error) {
      console.error("Error sending message via Continue:", error);
      throw new Error(`Failed to send message via Continue: ${error}`);
    }
  }

  /**
   * Get the current model from Continue
   */
  public async getCurrentModel(): Promise<string> {
    if (this.cachedCurrentModel !== "continue-default") {
      return this.cachedCurrentModel;
    }

    try {
      // If the messenger has a getCurrentModel method, use it
      if (typeof this.ideMessenger.getCurrentModel === "function") {
        const model = await this.ideMessenger.getCurrentModel();
        this.cachedCurrentModel = model || "continue-default";
        return this.cachedCurrentModel;
      }

      // Otherwise, try to get it from the settings
      if (typeof this.ideMessenger.getSettings === "function") {
        const settings = await this.ideMessenger.getSettings();
        if (settings && settings.llm && settings.llm.model) {
          this.cachedCurrentModel = settings.llm.model;
          return this.cachedCurrentModel;
        }
      }

      // Default fallback
      this.cachedCurrentModel = "continue-default";
      return "continue-default";
    } catch (error) {
      console.error("Error fetching current model from Continue:", error);
      this.cachedCurrentModel = "continue-default";
      return "continue-default";
    }
  }

  /**
   * Get available models from Continue
   */
  public async getAvailableModels(): Promise<string[]> {
    if (this.cachedModels.length > 0) {
      return this.cachedModels;
    }

    try {
      // If the messenger has a getAvailableModels method, use it
      if (typeof this.ideMessenger.getAvailableModels === "function") {
        const models = await this.ideMessenger.getAvailableModels();
        if (Array.isArray(models) && models.length > 0) {
          this.cachedModels = models;
          return models;
        }
      }

      // If we can't get the models, return a default list
      this.cachedModels = ["continue-default"];
      return this.cachedModels;
    } catch (error) {
      console.error("Error fetching available models from Continue:", error);
      this.cachedModels = ["continue-default"];
      return this.cachedModels;
    }
  }

  /**
   * Refresh model information
   */
  public async refreshModelInfo(): Promise<void> {
    this.cachedModels = [];
    this.cachedCurrentModel = "continue-default";
    await this.getAvailableModels();
    await this.getCurrentModel();
  }

  /**
   * Get the adapter type
   */
  public get type(): string {
    return "continue";
  }

  /**
   * Get the langchain model (not used in this adapter)
   */
  public getLangChainModel(): any {
    throw new Error("LangChain model not available in Continue adapter");
  }
}
