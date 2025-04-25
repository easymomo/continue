/**
 * Basic Embeddings Provider
 *
 * A simple, lightweight embedding provider that works without external dependencies.
 * This is a fallback option that uses basic text processing techniques.
 * Not intended for production use - only for testing, development, and fallback.
 */

import { EmbeddingsProvider } from "./types.js";

/**
 * Very simple tokenization function
 */
function tokenize(text: string): string[] {
  // Normalize text: lowercase, replace punctuation with spaces
  const normalized = text.toLowerCase().replace(/[^\w\s]/g, " ");

  // Split by whitespace and filter out empty tokens
  return normalized.split(/\s+/).filter((token) => token.length > 0);
}

/**
 * Basic Embeddings Provider
 * Creates very simple embeddings using a bag-of-words approach with some normalization.
 * This is a fallback that doesn't require external dependencies or API keys.
 */
export class BasicEmbeddingsProvider implements EmbeddingsProvider {
  private dimension: number;
  private vocabulary: Map<string, number> = new Map();
  private initialized = false;
  private commonWords = new Set([
    "the",
    "and",
    "a",
    "an",
    "in",
    "on",
    "at",
    "to",
    "for",
    "with",
    "of",
    "by",
    "as",
    "is",
    "are",
    "was",
    "were",
    "be",
    "been",
    "being",
    "this",
    "that",
    "these",
    "those",
    "it",
    "its",
  ]);

  constructor(dimension: number = 100) {
    this.dimension = dimension;
  }

  public getName(): string {
    return "basic-embeddings";
  }

  public async initialize(): Promise<void> {
    // Nothing to initialize for this provider
    this.initialized = true;
  }

  public getDimension(): number {
    return this.dimension;
  }

  public requiresBatching(): boolean {
    return false; // No need for batching with this simple provider
  }

  public getBatchSize(): number {
    return 1; // No batching needed
  }

  public async embedOne(text: string): Promise<number[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Tokenize the text
    const tokens = tokenize(text);

    // Create embedding vector (initialized to zeros)
    const embedding = new Array(this.dimension).fill(0);

    // Simple hashing approach to map tokens to vector dimensions
    for (const token of tokens) {
      // Skip common words for a more meaningful embedding
      if (this.commonWords.has(token)) {
        continue;
      }

      // Get the index in the embedding vector
      let index = this.getTokenIndex(token);

      // Increment the value at that index
      embedding[index] += 1;
    }

    // Normalize the vector (L2 norm)
    return this.normalizeVector(embedding);
  }

  public async embedMany(texts: string[]): Promise<number[][]> {
    return Promise.all(texts.map((text) => this.embedOne(text)));
  }

  /**
   * Get or create index for a token
   */
  private getTokenIndex(token: string): number {
    if (!this.vocabulary.has(token)) {
      this.vocabulary.set(token, this.vocabulary.size % this.dimension);
    }
    return this.vocabulary.get(token)!;
  }

  /**
   * Normalize a vector to unit length (L2 norm)
   */
  private normalizeVector(vector: number[]): number[] {
    // Calculate L2 norm (Euclidean length)
    const norm = Math.sqrt(vector.reduce((sum, val) => sum + val * val, 0));

    // Avoid division by zero
    if (norm === 0) {
      return vector;
    }

    // Normalize
    return vector.map((val) => val / norm);
  }
}
