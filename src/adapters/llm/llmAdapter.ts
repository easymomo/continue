import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { HumanMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { ContinueLLMAdapter } from "./continueLLMAdapter";

/**
 * Options for LLM requests
 */
export interface LLMRequestOptions {
  model?: string;
  temperature?: number;
  maxTokens?: number;
  [key: string]: any;
}

/**
 * Base interface for LLM adapters
 */
export interface BaseLLMAdapter {
  /**
   * Send a message to the LLM
   */
  sendMessage(message: string, options?: LLMRequestOptions): Promise<string>;

  /**
   * Get a list of available models
   */
  getAvailableModels(): Promise<string[]>;

  /**
   * Get the current model
   */
  getCurrentModel(): Promise<string>;

  /**
   * Get the adapter type
   */
  type: string;
}

/**
 * Interface for LLM adapters that integrate with LangChain
 */
export interface LLMAdapter extends BaseLLMAdapter {
  /**
   * Get the LangChain model instance
   */
  getModel(): BaseChatModel;
}

/**
 * OpenAI LLM adapter implementation
 * This is a fallback adapter used when Continue integration is not available
 */
export class OpenAIAdapter implements LLMAdapter {
  private model: ChatOpenAI;
  private modelName: string;

  constructor(modelName: string = "gpt-4o", apiKey?: string) {
    this.modelName = modelName;
    this.model = new ChatOpenAI({
      modelName: this.modelName,
      temperature: 0.5,
      openAIApiKey: apiKey || process.env.OPENAI_API_KEY,
    });
  }

  /**
   * Send a message to OpenAI
   */
  public async sendMessage(
    message: string,
    options?: LLMRequestOptions,
  ): Promise<string> {
    try {
      const response = await this.model.invoke([new HumanMessage(message)]);
      return response.content.toString();
    } catch (error) {
      console.error("Error sending message to OpenAI:", error);
      throw error;
    }
  }

  /**
   * Get a list of available OpenAI models
   */
  public async getAvailableModels(): Promise<string[]> {
    // Hardcoded list of common OpenAI models
    // In a real implementation, this would call the OpenAI API to get the list
    return ["gpt-3.5-turbo", "gpt-4", "gpt-4o", "gpt-4-turbo"];
  }

  /**
   * Get the current OpenAI model
   */
  public async getCurrentModel(): Promise<string> {
    return this.modelName;
  }

  /**
   * Get the LangChain model instance
   */
  public getModel(): BaseChatModel {
    return this.model;
  }

  /**
   * Get the adapter type
   */
  public get type(): string {
    return "openai";
  }
}

/**
 * Factory for creating LLM adapters
 */
export class LLMAdapterFactory {
  // This will be set by the ExtensionAdapter
  private static continueIdeMessenger: any = null;
  private static continueAdapter: BaseLLMAdapter | null = null;
  private static isContinueAvailable: boolean = false;

  /**
   * Set the Continue ideMessenger for integration
   */
  public static setIdeMessenger(ideMessenger: any): void {
    this.continueIdeMessenger = ideMessenger;

    // Initialize the Continue adapter
    if (ideMessenger && ContinueLLMAdapter.canUse(ideMessenger)) {
      this.continueAdapter = new ContinueLLMAdapter(ideMessenger);
      this.isContinueAvailable = true;
      console.log("Continue integration enabled for LLM communication");
    }
  }

  /**
   * Create an LLM adapter instance
   * Prioritizes using Continue's LLM integration when available
   */
  public static createAdapter(
    type: string = "default",
    modelName?: string,
    apiKey?: string,
  ): BaseLLMAdapter {
    // Prioritize Continue integration if available and requested
    if (
      this.isContinueAvailable &&
      (type.toLowerCase() === "continue" || type.toLowerCase() === "default")
    ) {
      if (!this.continueAdapter) {
        throw new Error("Continue adapter not initialized");
      }
      return this.continueAdapter;
    }

    // Fallback to direct LLM providers if Continue is not available or a specific provider is requested
    switch (type.toLowerCase()) {
      case "openai":
        return new OpenAIAdapter(modelName, apiKey);
      // Add additional cases for other LLM providers
      default:
        // Default to OpenAI if provider is not supported and Continue is not available
        if (!this.isContinueAvailable) {
          console.warn(
            `Unsupported LLM provider: ${type}, falling back to OpenAI`,
          );
          return new OpenAIAdapter(modelName, apiKey);
        } else {
          // Default to Continue if it's available
          if (!this.continueAdapter) {
            throw new Error("Continue adapter not initialized");
          }
          return this.continueAdapter;
        }
    }
  }

  /**
   * Get the Continue adapter if available
   */
  public static getContinueAdapter(): BaseLLMAdapter | null {
    return this.continueAdapter;
  }

  /**
   * Check if Continue integration is available
   */
  public static isContinueIntegrationAvailable(): boolean {
    return this.isContinueAvailable;
  }
}
