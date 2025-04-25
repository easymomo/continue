/**
 * Retrieval System Types
 *
 * Core interfaces and types for the retrieval system.
 * Adapted from Continue's context system.
 */

import { VectorMetadataFilter } from "../vector-store/types.js";

/**
 * A content item for retrieval/storage
 */
export interface ContentItem {
  /**
   * Unique ID for the content item (optional, will be generated if not provided)
   */
  id?: string;

  /**
   * The content text that will be embedded
   */
  content: string;

  /**
   * Type of the content (e.g., 'code', 'documentation', 'message')
   */
  contentType: string;

  /**
   * Source of the content (e.g., file path, agent name)
   */
  source: string;

  /**
   * Additional metadata for the content
   */
  metadata?: Record<string, any>;
}

/**
 * A retrieved item with similarity information
 */
export interface RetrievedItem extends ContentItem {
  /**
   * Similarity score (0-1)
   */
  score: number;

  /**
   * Timestamp when the item was originally stored
   */
  createdAt: string;
}

/**
 * Options for retrieval
 */
export interface RetrievalOptions {
  /**
   * Maximum number of items to retrieve
   */
  limit?: number;

  /**
   * Minimum similarity score (0-1)
   */
  minScore?: number;

  /**
   * Metadata filters to apply
   */
  filter?: VectorMetadataFilter;

  /**
   * Content types to retrieve
   */
  contentTypes?: string[];

  /**
   * Sources to retrieve from
   */
  sources?: string[];
}

/**
 * Types of retrieval strategies
 */
export enum RetrievalStrategy {
  /**
   * Semantic search using embeddings
   */
  SEMANTIC = "semantic",

  /**
   * Keyword-based search
   */
  KEYWORD = "keyword",

  /**
   * Hybrid search (combining semantic and keyword)
   */
  HYBRID = "hybrid",
}

/**
 * Options for hybrid retrieval
 */
export interface HybridRetrievalOptions extends RetrievalOptions {
  /**
   * Weight for semantic search results (0-1)
   */
  semanticWeight?: number;

  /**
   * Weight for keyword search results (0-1)
   */
  keywordWeight?: number;
}

/**
 * Interface for a retrieval system
 */
export interface RetrievalSystem {
  /**
   * Initialize the retrieval system
   */
  initialize(): Promise<void>;

  /**
   * Store content for later retrieval
   *
   * @param item Content item to store
   * @returns ID of the stored item
   */
  storeContent(item: ContentItem): Promise<string>;

  /**
   * Store multiple content items
   *
   * @param items Content items to store
   * @returns IDs of the stored items
   */
  storeContents(items: ContentItem[]): Promise<string[]>;

  /**
   * Retrieve content similar to the query
   *
   * @param query Query text
   * @param options Retrieval options
   * @returns Array of retrieved items
   */
  retrieveSimilar(
    query: string,
    options?: RetrievalOptions,
  ): Promise<RetrievedItem[]>;

  /**
   * Delete content by ID
   *
   * @param id ID of content to delete
   * @returns Whether deletion was successful
   */
  deleteContent(id: string): Promise<boolean>;

  /**
   * Delete content matching a filter
   *
   * @param filter Metadata filter
   * @returns Number of items deleted
   */
  deleteContents(filter: VectorMetadataFilter): Promise<number>;
}
