/**
 * Agent Memory Adapter
 *
 * Adapts the context system to work with the agent memory framework.
 * Provides seamless integration between AIgents memory and the Continue context system.
 */

import { MemoryManager } from "../../memory-manager.js";
import { BasicEmbeddingsProvider } from "../embeddings/basic-embeddings-provider.js";
import { EmbeddingsProvider } from "../embeddings/types.js";
import { BasicRetrievalSystem } from "../retrieval/basic-retrieval-system.js";
import {
  ContentItem,
  RetrievalOptions,
  RetrievedItem,
} from "../retrieval/types.js";
import { MemoryVectorStore } from "../vector-store/memory-vector-store.js";
import { VectorStore } from "../vector-store/types.js";

/**
 * Configuration for the agent memory adapter
 */
export interface AgentMemoryAdapterConfig {
  /**
   * Custom embeddings provider (optional)
   */
  embeddingsProvider?: EmbeddingsProvider;

  /**
   * Custom vector store (optional)
   */
  vectorStore?: VectorStore;

  /**
   * Number of dimensions for embeddings (when using default provider)
   */
  embeddingDimension?: number;

  /**
   * Maximum number of results to return by default
   */
  defaultLimit?: number;
}

/**
 * Default configuration
 */
const DEFAULT_CONFIG: AgentMemoryAdapterConfig = {
  embeddingDimension: 100,
  defaultLimit: 10,
};

/**
 * Adapter to integrate the context system with agent memory
 */
export class AgentMemoryAdapter {
  private agentId: string;
  private memoryManager: MemoryManager;
  private retrievalSystem: BasicRetrievalSystem;
  private config: Required<AgentMemoryAdapterConfig>;
  private initialized = false;

  constructor(
    agentId: string,
    memoryManager: MemoryManager,
    config: AgentMemoryAdapterConfig = {},
  ) {
    this.agentId = agentId;
    this.memoryManager = memoryManager;

    // Merge with default config
    this.config = {
      ...DEFAULT_CONFIG,
      ...config,
    } as Required<AgentMemoryAdapterConfig>;

    // Create or use provided components
    const embeddingsProvider =
      config.embeddingsProvider ||
      new BasicEmbeddingsProvider(this.config.embeddingDimension);

    const vectorStore = config.vectorStore || new MemoryVectorStore();

    // Create retrieval system
    this.retrievalSystem = new BasicRetrievalSystem(
      embeddingsProvider,
      vectorStore,
    );
  }

  /**
   * Initialize the adapter
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    // Initialize memory manager if needed
    if (!this.memoryManager.isInitialized()) {
      await this.memoryManager.initialize();
    }

    // Initialize retrieval system
    await this.retrievalSystem.initialize();

    this.initialized = true;
  }

  /**
   * Store content in the vector store and optionally in agent memory
   *
   * @param item Content item
   * @param storeInAgentMemory Whether to also store in agent memory
   * @returns ID of the stored content
   */
  public async storeContent(
    item: ContentItem,
    storeInAgentMemory: boolean = true,
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Store in retrieval system
    const id = await this.retrievalSystem.storeContent(item);

    // Optionally store in agent memory
    if (storeInAgentMemory) {
      await this.memoryManager.storeMemory(
        "semantic_content",
        {
          id,
          content: item.content,
          contentType: item.contentType,
          source: item.source,
        },
        {
          ...item.metadata,
          vectorStoreId: id,
        },
      );
    }

    return id;
  }

  /**
   * Store agent memory in the vector store for semantic retrieval
   *
   * @param memoryType Type of memory to store
   * @param contentType Content type for the vector store
   * @param filter Memory filter
   * @returns Number of items stored
   */
  public async indexAgentMemory(
    memoryType: string,
    contentType: string,
    filter: Record<string, any> = {},
  ): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Query memories of the specified type
    const memories = await this.memoryManager.queryMemories({
      agentId: this.agentId,
      type: memoryType,
      metadata: filter,
    });

    if (memories.length === 0) {
      return 0;
    }

    // Convert memories to content items
    const contentItems: ContentItem[] = memories.map((memory) => ({
      id: memory.id,
      content:
        typeof memory.content === "string"
          ? memory.content
          : JSON.stringify(memory.content),
      contentType,
      source: `agent:${this.agentId}:${memoryType}`,
      metadata: {
        ...memory.metadata,
        memoryId: memory.id,
        memoryType,
        timestamp: memory.timestamp,
      },
    }));

    // Store in retrieval system
    await this.retrievalSystem.storeContents(contentItems);

    return contentItems.length;
  }

  /**
   * Search for content related to a query
   *
   * @param query Query text
   * @param options Retrieval options
   * @returns Array of retrieved items
   */
  public async search(
    query: string,
    options: RetrievalOptions = {},
  ): Promise<RetrievedItem[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Apply default limit if not specified
    const searchOptions = {
      limit: this.config.defaultLimit,
      ...options,
    };

    return this.retrievalSystem.retrieveSimilar(query, searchOptions);
  }

  /**
   * Add context block with semantic search capabilities
   *
   * @param contextName Name of the context
   * @param type Type of context block
   * @param content Content of the block
   * @param source Source of the information
   * @param metadata Additional metadata
   * @returns ID of the added block
   */
  public async addContextBlock(
    contextName: string,
    type: string,
    content: string,
    source: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Add block to contextual memory
    const blockId = await this.memoryManager.addContextBlock(contextName, {
      type,
      content,
      source,
      metadata,
    });

    // Also store in vector store for semantic retrieval
    await this.storeContent(
      {
        id: blockId,
        content,
        contentType: type,
        source,
        metadata: {
          ...metadata,
          contextName,
          contextBlockId: blockId,
        },
      },
      false,
    ); // Don't duplicate in agent memory

    return blockId;
  }

  /**
   * Search for relevant context blocks
   *
   * @param query Query text
   * @param contextNames Context names to search in (optional)
   * @param options Retrieval options
   * @returns Array of retrieved items
   */
  public async searchContext(
    query: string,
    contextNames?: string[],
    options: RetrievalOptions = {},
  ): Promise<RetrievedItem[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Apply default limit if not specified
    const searchOptions: RetrievalOptions = {
      limit: this.config.defaultLimit,
      ...options,
    };

    // Limit to specified contexts if provided
    if (contextNames && contextNames.length > 0) {
      searchOptions.filter = {
        ...(searchOptions.filter || {}),
        contextName: { $in: contextNames },
      };
    }

    return this.retrievalSystem.retrieveSimilar(query, searchOptions);
  }

  /**
   * Get the underlying retrieval system
   */
  public getRetrievalSystem(): BasicRetrievalSystem {
    return this.retrievalSystem;
  }

  /**
   * Check if the adapter is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
}
