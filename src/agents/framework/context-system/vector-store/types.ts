/**
 * Vector Store Types
 *
 * Core interfaces and types for vector storage.
 * Adapted from Continue's context system.
 */

/**
 * Metadata for a stored vector
 */
export interface VectorMetadata {
  /**
   * Unique ID for the vector
   */
  id: string;

  /**
   * Original content that was embedded
   */
  content?: string;

  /**
   * Type of the content (e.g., 'code', 'documentation', 'message')
   */
  contentType?: string;

  /**
   * Source of the content (e.g., file path, agent name)
   */
  source?: string;

  /**
   * Creation timestamp
   */
  createdAt?: string;

  /**
   * Additional metadata properties
   */
  [key: string]: any;
}

/**
 * Vector with metadata
 */
export interface Vector {
  /**
   * Embedding vector
   */
  embedding: number[];

  /**
   * Metadata about the vector
   */
  metadata: VectorMetadata;
}

/**
 * Search result from vector store
 */
export interface VectorSearchResult {
  /**
   * Vector that matched the search
   */
  vector: Vector;

  /**
   * Similarity score (higher means more similar)
   */
  score: number;
}

/**
 * Options for vector search
 */
export interface VectorSearchOptions {
  /**
   * Maximum number of results to return
   */
  limit?: number;

  /**
   * Minimum similarity score threshold
   */
  minScore?: number;

  /**
   * Metadata filters to apply
   */
  filter?: VectorMetadataFilter;
}

/**
 * Filter for vector metadata
 */
export interface VectorMetadataFilter {
  /**
   * Metadata field to filter on
   */
  [key: string]: any | FilterOperator;
}

/**
 * Operator for metadata filtering
 */
export interface FilterOperator {
  /**
   * Operator type (e.g., $eq, $gt, $in)
   */
  [operator: string]: any;
}

/**
 * Interface for vector storage
 */
export interface VectorStore {
  /**
   * Initialize the vector store
   */
  initialize(): Promise<void>;

  /**
   * Add a vector to the store
   *
   * @param vector Vector to add
   * @returns ID of the added vector
   */
  addVector(vector: Vector): Promise<string>;

  /**
   * Add multiple vectors to the store
   *
   * @param vectors Vectors to add
   * @returns IDs of the added vectors
   */
  addVectors(vectors: Vector[]): Promise<string[]>;

  /**
   * Search for similar vectors
   *
   * @param embedding Query embedding
   * @param options Search options
   * @returns Array of search results
   */
  searchVectors(
    embedding: number[],
    options?: VectorSearchOptions,
  ): Promise<VectorSearchResult[]>;

  /**
   * Get a vector by ID
   *
   * @param id ID of the vector to get
   * @returns Vector or null if not found
   */
  getVector(id: string): Promise<Vector | null>;

  /**
   * Delete a vector by ID
   *
   * @param id ID of the vector to delete
   * @returns Whether the deletion was successful
   */
  deleteVector(id: string): Promise<boolean>;

  /**
   * Delete vectors matching a filter
   *
   * @param filter Metadata filter
   * @returns Number of vectors deleted
   */
  deleteVectors(filter: VectorMetadataFilter): Promise<number>;

  /**
   * Get vector count in the store
   *
   * @param filter Optional metadata filter
   * @returns Number of vectors
   */
  getVectorCount(filter?: VectorMetadataFilter): Promise<number>;
}
