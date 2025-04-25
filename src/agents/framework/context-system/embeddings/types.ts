/**
 * Embeddings Types
 *
 * Core interfaces and types for the embedding system.
 * Adapted from Continue's context system.
 */

/**
 * Configuration for an embeddings provider
 */
export interface EmbeddingsProviderConfig {
  /**
   * The type of embeddings provider
   */
  provider: string;

  /**
   * The embedding model to use (when applicable)
   */
  model?: string;

  /**
   * API key or other authentication information (when applicable)
   */
  apiKey?: string;

  /**
   * Additional request options for the provider
   */
  requestOptions?: Record<string, any>;

  /**
   * Endpoint URL override (when applicable)
   */
  endpoint?: string;
}

/**
 * Interface for embedding generation providers
 */
export interface EmbeddingsProvider {
  /**
   * Gets the provider name
   */
  getName(): string;

  /**
   * Generate embeddings for a list of texts
   *
   * @param texts List of texts to embed
   * @returns Promise of embedding vectors
   */
  embedMany(texts: string[]): Promise<number[][]>;

  /**
   * Generate embedding for a single text
   *
   * @param text Text to embed
   * @returns Promise of embedding vector
   */
  embedOne(text: string): Promise<number[]>;

  /**
   * Get the dimension of the embeddings
   */
  getDimension(): number;

  /**
   * Initialize the provider
   */
  initialize(): Promise<void>;

  /**
   * Check if the provider requires batching
   */
  requiresBatching(): boolean;

  /**
   * Get the optimal batch size for this provider
   */
  getBatchSize(): number;
}

/**
 * Factory for creating embedding providers
 */
export interface EmbeddingsProviderFactory {
  /**
   * Create an embedding provider from configuration
   */
  createProvider(config: EmbeddingsProviderConfig): Promise<EmbeddingsProvider>;
}

/**
 * Options for embedding queue
 */
export interface EmbeddingQueueOptions {
  /**
   * Maximum batch size
   */
  maxBatchSize?: number;

  /**
   * Time to wait before processing a batch (ms)
   */
  batchWaitTimeMs?: number;

  /**
   * Maximum number of concurrent batches
   */
  maxConcurrentBatches?: number;
}

/**
 * Queue item for embedding processing
 */
export interface EmbeddingQueueItem {
  /**
   * Text to embed
   */
  text: string;

  /**
   * Resolve function for the promise
   */
  resolve: (embedding: number[]) => void;

  /**
   * Reject function for the promise
   */
  reject: (error: Error) => void;
}
