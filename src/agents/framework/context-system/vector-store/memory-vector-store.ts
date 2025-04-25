/**
 * Memory Vector Store
 *
 * An in-memory implementation of the vector store interface.
 * Useful for development, testing, and small-scale use.
 */

import { v4 as uuidv4 } from "uuid";
import {
  Vector,
  VectorMetadata,
  VectorMetadataFilter,
  VectorSearchOptions,
  VectorSearchResult,
  VectorStore,
} from "./types.js";

/**
 * Computes the cosine similarity between two vectors
 *
 * @param a First vector
 * @param b Second vector
 * @returns Cosine similarity score (0-1)
 */
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error("Vectors must have the same dimension");
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Check if a metadata object matches a filter
 *
 * @param metadata Metadata to check
 * @param filter Filter to match against
 * @returns Whether the metadata matches the filter
 */
function matchesFilter(
  metadata: VectorMetadata,
  filter: VectorMetadataFilter,
): boolean {
  for (const [key, value] of Object.entries(filter)) {
    if (value === undefined) {
      continue;
    }

    // Handle operator objects
    if (value !== null && typeof value === "object") {
      for (const [op, opValue] of Object.entries(value)) {
        if (opValue === undefined) {
          continue;
        }

        const metaValue = metadata[key];

        switch (op) {
          case "$eq":
            if (metaValue !== opValue) return false;
            break;
          case "$ne":
            if (metaValue === opValue) return false;
            break;
          case "$gt":
            if (
              typeof metaValue !== "number" ||
              typeof opValue !== "number" ||
              metaValue <= opValue
            )
              return false;
            break;
          case "$gte":
            if (
              typeof metaValue !== "number" ||
              typeof opValue !== "number" ||
              metaValue < opValue
            )
              return false;
            break;
          case "$lt":
            if (
              typeof metaValue !== "number" ||
              typeof opValue !== "number" ||
              metaValue >= opValue
            )
              return false;
            break;
          case "$lte":
            if (
              typeof metaValue !== "number" ||
              typeof opValue !== "number" ||
              metaValue > opValue
            )
              return false;
            break;
          case "$in":
            if (!Array.isArray(opValue) || !opValue.includes(metaValue))
              return false;
            break;
          case "$nin":
            if (!Array.isArray(opValue) || opValue.includes(metaValue))
              return false;
            break;
          case "$exists":
            if (
              opValue
                ? metadata[key] === undefined
                : metadata[key] !== undefined
            )
              return false;
            break;
          default:
            console.warn(`Unknown operator: ${op}`);
        }
      }
    } else {
      // Simple equality check
      if (metadata[key] !== value) {
        return false;
      }
    }
  }

  return true;
}

/**
 * In-memory implementation of the VectorStore interface
 */
export class MemoryVectorStore implements VectorStore {
  private vectors: Map<string, Vector> = new Map();
  private initialized = false;

  /**
   * Initialize the vector store
   */
  public async initialize(): Promise<void> {
    // Nothing to initialize for in-memory store
    this.initialized = true;
  }

  /**
   * Add a vector to the store
   *
   * @param vector Vector to add
   * @returns ID of the added vector
   */
  public async addVector(vector: Vector): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate ID if not provided
    if (!vector.metadata.id) {
      vector.metadata.id = uuidv4();
    }

    // Add creation timestamp if not provided
    if (!vector.metadata.createdAt) {
      vector.metadata.createdAt = new Date().toISOString();
    }

    // Store the vector
    this.vectors.set(vector.metadata.id, {
      embedding: [...vector.embedding], // Create a copy of the embedding
      metadata: { ...vector.metadata }, // Create a copy of the metadata
    });

    return vector.metadata.id;
  }

  /**
   * Add multiple vectors to the store
   *
   * @param vectors Vectors to add
   * @returns IDs of the added vectors
   */
  public async addVectors(vectors: Vector[]): Promise<string[]> {
    const ids: string[] = [];

    for (const vector of vectors) {
      const id = await this.addVector(vector);
      ids.push(id);
    }

    return ids;
  }

  /**
   * Search for similar vectors
   *
   * @param embedding Query embedding
   * @param options Search options
   * @returns Array of search results
   */
  public async searchVectors(
    embedding: number[],
    options: VectorSearchOptions = {},
  ): Promise<VectorSearchResult[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    const { limit = 10, minScore = 0, filter } = options;

    // Calculate similarity scores for all vectors
    const results: VectorSearchResult[] = [];

    for (const vector of this.vectors.values()) {
      // Skip if it doesn't match the filter
      if (filter && !matchesFilter(vector.metadata, filter)) {
        continue;
      }

      // Calculate similarity
      const score = cosineSimilarity(embedding, vector.embedding);

      // Skip if below minimum score
      if (score < minScore) {
        continue;
      }

      results.push({ vector, score });
    }

    // Sort by score (descending)
    results.sort((a, b) => b.score - a.score);

    // Apply limit
    return results.slice(0, limit);
  }

  /**
   * Get a vector by ID
   *
   * @param id ID of the vector to get
   * @returns Vector or null if not found
   */
  public async getVector(id: string): Promise<Vector | null> {
    if (!this.initialized) {
      await this.initialize();
    }

    const vector = this.vectors.get(id);

    if (!vector) {
      return null;
    }

    // Return a copy to prevent modification of internal state
    return {
      embedding: [...vector.embedding],
      metadata: { ...vector.metadata },
    };
  }

  /**
   * Delete a vector by ID
   *
   * @param id ID of the vector to delete
   * @returns Whether the deletion was successful
   */
  public async deleteVector(id: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.vectors.delete(id);
  }

  /**
   * Delete vectors matching a filter
   *
   * @param filter Metadata filter
   * @returns Number of vectors deleted
   */
  public async deleteVectors(filter: VectorMetadataFilter): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    let count = 0;

    // Find vectors matching the filter
    for (const [id, vector] of this.vectors.entries()) {
      if (matchesFilter(vector.metadata, filter)) {
        this.vectors.delete(id);
        count++;
      }
    }

    return count;
  }

  /**
   * Get vector count in the store
   *
   * @param filter Optional metadata filter
   * @returns Number of vectors
   */
  public async getVectorCount(filter?: VectorMetadataFilter): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    if (!filter) {
      return this.vectors.size;
    }

    // Count vectors matching the filter
    let count = 0;

    for (const vector of this.vectors.values()) {
      if (matchesFilter(vector.metadata, filter)) {
        count++;
      }
    }

    return count;
  }
}
