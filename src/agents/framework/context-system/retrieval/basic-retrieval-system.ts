/**
 * Basic Retrieval System
 *
 * Implements the retrieval system using embeddings and vector storage.
 */

import { v4 as uuidv4 } from "uuid";
import { EmbeddingQueue } from "../embeddings/embedding-queue.js";
import { EmbeddingsProvider } from "../embeddings/types.js";
import {
  VectorMetadataFilter,
  VectorSearchOptions,
  VectorStore,
} from "../vector-store/types.js";
import {
  ContentItem,
  RetrievalOptions,
  RetrievalSystem,
  RetrievedItem,
} from "./types.js";

/**
 * Basic implementation of the retrieval system
 */
export class BasicRetrievalSystem implements RetrievalSystem {
  private embeddingQueue: EmbeddingQueue;
  private vectorStore: VectorStore;
  private initialized = false;

  constructor(embeddingProvider: EmbeddingsProvider, vectorStore: VectorStore) {
    this.embeddingQueue = new EmbeddingQueue(embeddingProvider);
    this.vectorStore = vectorStore;
  }

  /**
   * Initialize the retrieval system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    await this.embeddingQueue.initialize();
    await this.vectorStore.initialize();

    this.initialized = true;
  }

  /**
   * Store content for later retrieval
   *
   * @param item Content item to store
   * @returns ID of the stored item
   */
  public async storeContent(item: ContentItem): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate ID if not provided
    const id = item.id || uuidv4();

    // Generate embedding for the content
    const embedding = await this.embeddingQueue.embedText(item.content);

    // Create vector metadata
    const metadata = {
      id,
      content: item.content,
      contentType: item.contentType,
      source: item.source,
      ...(item.metadata || {}),
    };

    // Store in vector store
    await this.vectorStore.addVector({
      embedding,
      metadata,
    });

    return id;
  }

  /**
   * Store multiple content items
   *
   * @param items Content items to store
   * @returns IDs of the stored items
   */
  public async storeContents(items: ContentItem[]): Promise<string[]> {
    const ids: string[] = [];

    for (const item of items) {
      const id = await this.storeContent(item);
      ids.push(id);
    }

    return ids;
  }

  /**
   * Retrieve content similar to the query
   *
   * @param query Query text
   * @param options Retrieval options
   * @returns Array of retrieved items
   */
  public async retrieveSimilar(
    query: string,
    options: RetrievalOptions = {},
  ): Promise<RetrievedItem[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate embedding for the query
    const queryEmbedding = await this.embeddingQueue.embedText(query);

    // Prepare search options for vector store
    const searchOptions: VectorSearchOptions = {
      limit: options.limit,
      minScore: options.minScore,
    };

    // Build filter from options
    if (
      options.contentTypes?.length ||
      options.sources?.length ||
      options.filter
    ) {
      searchOptions.filter = { ...(options.filter || {}) };

      if (options.contentTypes?.length) {
        searchOptions.filter.contentType = { $in: options.contentTypes };
      }

      if (options.sources?.length) {
        searchOptions.filter.source = { $in: options.sources };
      }
    }

    // Search vector store
    const results = await this.vectorStore.searchVectors(
      queryEmbedding,
      searchOptions,
    );

    // Transform results to RetrievedItem format
    return results.map((result) => {
      const { metadata } = result.vector;

      return {
        id: metadata.id,
        content: metadata.content || "",
        contentType: metadata.contentType || "unknown",
        source: metadata.source || "unknown",
        score: result.score,
        createdAt: metadata.createdAt || new Date().toISOString(),
        metadata: Object.entries(metadata)
          .filter(
            ([key]) =>
              !["id", "content", "contentType", "source", "createdAt"].includes(
                key,
              ),
          )
          .reduce((obj, [key, value]) => ({ ...obj, [key]: value }), {}),
      };
    });
  }

  /**
   * Delete content by ID
   *
   * @param id ID of content to delete
   * @returns Whether deletion was successful
   */
  public async deleteContent(id: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.vectorStore.deleteVector(id);
  }

  /**
   * Delete content matching a filter
   *
   * @param filter Metadata filter
   * @returns Number of items deleted
   */
  public async deleteContents(filter: VectorMetadataFilter): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.vectorStore.deleteVectors(filter);
  }

  /**
   * Get the underlying vector store
   */
  public getVectorStore(): VectorStore {
    return this.vectorStore;
  }

  /**
   * Get the embedding queue
   */
  public getEmbeddingQueue(): EmbeddingQueue {
    return this.embeddingQueue;
  }
}
