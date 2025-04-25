/**
 * Context System
 *
 * Provides semantic search and context management capabilities for the agent framework.
 * Adapted from Continue's context system.
 */

// Embeddings
export * from "./embeddings/basic-embeddings-provider.js";
export * from "./embeddings/embedding-queue.js";
export * from "./embeddings/types.js";

// Vector Store
export * from "./vector-store/memory-vector-store.js";
export * from "./vector-store/types.js";

// Retrieval
export * from "./retrieval/basic-retrieval-system.js";
export * from "./retrieval/types.js";

// Adapters
export * from "./adapters/agent-memory-adapter.js";

// Example
export * from "./examples/usage-example.js";

// Factory function to create a complete context system
import { getMemoryManager } from "../memory-manager.js";
import { AgentMemoryAdapter } from "./adapters/agent-memory-adapter.js";
import { BasicEmbeddingsProvider } from "./embeddings/basic-embeddings-provider.js";
import { EmbeddingsProvider } from "./embeddings/types.js";
import { MemoryVectorStore } from "./vector-store/memory-vector-store.js";
import { VectorStore } from "./vector-store/types.js";

/**
 * Options for creating a context system
 */
export interface CreateContextSystemOptions {
  /**
   * Custom embeddings provider
   */
  embeddingsProvider?: EmbeddingsProvider;

  /**
   * Custom vector store
   */
  vectorStore?: VectorStore;

  /**
   * Number of dimensions for embeddings (when using default provider)
   */
  embeddingDimension?: number;

  /**
   * Default search result limit
   */
  defaultLimit?: number;
}

/**
 * Create a complete context system for an agent
 *
 * @param agentId ID of the agent
 * @param options Configuration options
 * @returns Initialized agent memory adapter
 */
export async function createContextSystem(
  agentId: string,
  options: CreateContextSystemOptions = {},
): Promise<AgentMemoryAdapter> {
  // Get memory manager
  const memoryManager = getMemoryManager(agentId);

  // Create embeddings provider if not provided
  const embeddingsProvider =
    options.embeddingsProvider ||
    new BasicEmbeddingsProvider(options.embeddingDimension || 100);

  // Create vector store if not provided
  const vectorStore = options.vectorStore || new MemoryVectorStore();

  // Create and initialize the adapter
  const adapter = new AgentMemoryAdapter(agentId, memoryManager, {
    embeddingsProvider,
    vectorStore,
    embeddingDimension: options.embeddingDimension,
    defaultLimit: options.defaultLimit,
  });

  // Initialize the adapter
  await adapter.initialize();

  return adapter;
}
