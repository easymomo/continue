/**
 * Embedding Queue
 *
 * Manages batching and processing of embedding requests
 * for efficient use of embedding APIs.
 */

import { EventEmitter } from "events";
import {
  EmbeddingQueueItem,
  EmbeddingQueueOptions,
  EmbeddingsProvider,
} from "./types.js";

const DEFAULT_OPTIONS: EmbeddingQueueOptions = {
  maxBatchSize: 20,
  batchWaitTimeMs: 100,
  maxConcurrentBatches: 2,
};

/**
 * Manages queuing and batching of embedding requests
 */
export class EmbeddingQueue extends EventEmitter {
  private queue: EmbeddingQueueItem[] = [];
  private processingBatches = 0;
  private processingTimer: NodeJS.Timeout | null = null;
  private provider: EmbeddingsProvider;
  private options: Required<EmbeddingQueueOptions>;
  private initialized = false;

  constructor(provider: EmbeddingsProvider, options?: EmbeddingQueueOptions) {
    super();
    this.provider = provider;
    this.options = {
      ...DEFAULT_OPTIONS,
      ...options,
    } as Required<EmbeddingQueueOptions>;
    this.setMaxListeners(100); // Allow many listeners
  }

  /**
   * Initialize the queue and underlying provider
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.provider.initialize();
    this.initialized = true;
    this.emit("initialized");
  }

  /**
   * Add a text to the embedding queue
   *
   * @param text Text to embed
   * @returns Promise of embedding vector
   */
  public async embedText(text: string): Promise<number[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // If the provider doesn't require batching, bypass the queue
    if (!this.provider.requiresBatching()) {
      return this.provider.embedOne(text);
    }

    return new Promise<number[]>((resolve, reject) => {
      // Add to queue
      this.queue.push({ text, resolve, reject });

      // Schedule processing if not already scheduled
      if (
        !this.processingTimer &&
        this.processingBatches < this.options.maxConcurrentBatches
      ) {
        this.scheduleProcessing();
      }

      // Process immediately if we have enough items
      if (this.queue.length >= this.options.maxBatchSize) {
        this.processNextBatch();
      }
    });
  }

  /**
   * Schedule processing of the queue
   */
  private scheduleProcessing(): void {
    if (this.processingTimer) {
      clearTimeout(this.processingTimer);
    }

    this.processingTimer = setTimeout(() => {
      this.processingTimer = null;
      this.processNextBatch();
    }, this.options.batchWaitTimeMs);
  }

  /**
   * Process the next batch of embedding requests
   */
  private async processNextBatch(): Promise<void> {
    if (
      this.queue.length === 0 ||
      this.processingBatches >= this.options.maxConcurrentBatches
    ) {
      return;
    }

    // Get batch size based on queue length and max batch size
    const batchSize = Math.min(
      this.queue.length,
      this.provider.getBatchSize() || this.options.maxBatchSize,
    );

    // Get items to process
    const batch = this.queue.splice(0, batchSize);
    const texts = batch.map((item) => item.text);

    this.processingBatches++;
    this.emit("batchStarted", { batchSize, queueLength: this.queue.length });

    try {
      // Process the batch
      const embeddings = await this.provider.embedMany(texts);

      // Resolve promises for each item
      batch.forEach((item, i) => {
        try {
          item.resolve(embeddings[i]);
        } catch (error) {
          console.error("Error resolving embedding:", error);
        }
      });

      this.emit("batchCompleted", { successful: batch.length });
    } catch (error) {
      console.error("Error processing embedding batch:", error);

      // Reject all promises in the batch
      batch.forEach((item) => {
        try {
          item.reject(
            error instanceof Error ? error : new Error(String(error)),
          );
        } catch (rejectError) {
          console.error("Error rejecting embedding promise:", rejectError);
        }
      });

      this.emit("batchError", { error, count: batch.length });
    } finally {
      this.processingBatches--;

      // Process next batch if items are available
      if (
        this.queue.length > 0 &&
        this.processingBatches < this.options.maxConcurrentBatches
      ) {
        this.processNextBatch();
      }
    }
  }

  /**
   * Get the current queue length
   */
  public getQueueLength(): number {
    return this.queue.length;
  }

  /**
   * Get the number of batches currently being processed
   */
  public getProcessingBatches(): number {
    return this.processingBatches;
  }

  /**
   * Get the underlying provider
   */
  public getProvider(): EmbeddingsProvider {
    return this.provider;
  }
}
