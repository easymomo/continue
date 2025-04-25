/**
 * Memory Integration
 *
 * Provides a composition-based approach for integrating memory systems
 * with agents. This avoids inheritance issues and allows agents to benefit
 * from memory capabilities without complex inheritance trees.
 */

import { BaseAgent } from "./base-agent.js";
import { getMemoryManager, MemoryManager } from "./memory-manager.js";

/**
 * Initialize memory for an agent
 *
 * @param agent Agent instance
 * @returns Initialized memory manager for the agent
 */
export async function initializeAgentMemory(
  agent: BaseAgent,
): Promise<MemoryManager> {
  const memoryManager = getMemoryManager(agent.id);
  await memoryManager.initialize();
  return memoryManager;
}

/**
 * Get the memory manager for an agent
 *
 * @param agentId ID of the agent
 * @returns Memory manager for the agent
 */
export function getAgentMemoryManager(agentId: string): MemoryManager {
  return getMemoryManager(agentId);
}

/**
 * Convenience class to provide typed memory access for agents
 * Can be used as a delegation target in agent implementations
 */
export class AgentMemory {
  private readonly memoryManager: MemoryManager;

  constructor(private readonly agentId: string) {
    this.memoryManager = getMemoryManager(agentId);
  }

  /**
   * Initialize the memory system
   */
  public async initialize(): Promise<void> {
    await this.memoryManager.initialize();
  }

  /**
   * Store a memory item in long-term storage
   *
   * @param type Type of memory
   * @param content Content to store
   * @param metadata Additional metadata
   * @returns ID of the stored memory
   */
  public async storeMemory(
    type: string,
    content: any,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    return this.memoryManager.storeMemory(type, content, metadata);
  }

  /**
   * Get a memory item by ID
   *
   * @param memoryId ID of the memory to retrieve
   * @returns Memory item or undefined if not found
   */
  public async getMemory(memoryId: string): Promise<any> {
    return this.memoryManager.getMemory(memoryId);
  }

  /**
   * Query memories based on criteria
   *
   * @param criteria Search criteria
   * @returns Array of matching memory items
   */
  public async queryMemories(criteria: any): Promise<any[]> {
    return this.memoryManager.queryMemories(criteria);
  }

  /**
   * Create a new context
   *
   * @param name Context name
   * @param metadata Optional metadata
   */
  public async createContext(
    name: string,
    metadata: Record<string, any> = {},
  ): Promise<any> {
    return this.memoryManager.createContext(name, metadata);
  }

  /**
   * Get a context by name
   *
   * @param name Name of the context
   */
  public async getContext(name: string): Promise<any | undefined> {
    return this.memoryManager.getContext(name);
  }

  /**
   * Add a block to a context
   *
   * @param contextName Name of the context
   * @param type Type of the context block
   * @param content Content of the block
   * @param source Source of the information
   * @param metadata Additional metadata
   * @returns ID of the added block
   */
  public async addToContext(
    contextName: string,
    type: string,
    content: any,
    source: string,
    metadata: Record<string, any> = {},
  ): Promise<string> {
    return this.memoryManager.addContextBlock(contextName, {
      type,
      content,
      source,
      metadata,
    });
  }

  /**
   * Query context blocks
   *
   * @param contextName Name of the context
   * @param query Query parameters
   * @returns Matching context blocks
   */
  public async queryContext(contextName: string, query: any): Promise<any[]> {
    return this.memoryManager.queryContext(contextName, query);
  }

  /**
   * Store an item in working memory
   *
   * @param type Type of memory item
   * @param content Content of the memory item
   * @param metadata Additional metadata
   * @param ttlMs Optional time-to-live in milliseconds
   * @returns ID of the added item
   */
  public async rememberTemporarily<T>(
    type: string,
    content: T,
    metadata: Record<string, any> = {},
    ttlMs?: number,
  ): Promise<string> {
    return this.memoryManager.addWorkingMemoryItem(
      type,
      content,
      metadata,
      ttlMs,
    );
  }

  /**
   * Get a working memory item by ID
   *
   * @param id ID of the item to retrieve
   * @returns The memory item or undefined if not found or expired
   */
  public async getWorkingMemory<T>(id: string): Promise<any> {
    return this.memoryManager.getWorkingMemoryItem<T>(id);
  }

  /**
   * Get working memory items by type
   *
   * @param type Type of items to retrieve
   * @param limit Maximum number of items to return
   * @returns Array of memory items
   */
  public async getWorkingMemoriesByType<T>(
    type: string,
    limit?: number,
  ): Promise<any[]> {
    return this.memoryManager.getWorkingMemoryItemsByType<T>(type, limit);
  }

  /**
   * Search working memory
   *
   * @param query Search query
   * @param types Optional types to search within
   * @param limit Maximum number of results
   * @returns Matching memory items
   */
  public async searchWorkingMemory<T>(
    query: string,
    types?: string[],
    limit?: number,
  ): Promise<any[]> {
    return this.memoryManager.searchWorkingMemory<T>(query, types, limit);
  }

  /**
   * Create a snapshot of working memory
   *
   * @param name Name of the snapshot
   * @returns Number of items in the snapshot
   */
  public async createMemorySnapshot(name: string): Promise<number> {
    return this.memoryManager.createWorkingMemorySnapshot(name);
  }

  /**
   * Load a working memory snapshot
   *
   * @param name Name of the snapshot to load
   * @param replace Whether to replace current items
   * @returns Number of items loaded
   */
  public async loadMemorySnapshot(
    name: string,
    replace: boolean = false,
  ): Promise<number> {
    return this.memoryManager.loadWorkingMemorySnapshot(name, replace);
  }

  /**
   * Transfer working memory items to long-term memory
   *
   * @param type Type of working memory items to transfer
   * @param memoryType Type to use for long-term memories
   * @returns Number of items transferred
   */
  public async consolidateMemories(
    type: string,
    memoryType: string,
  ): Promise<number> {
    return this.memoryManager.transferWorkingToLongTerm(type, memoryType);
  }

  /**
   * Reset working memory
   */
  public async resetWorkingMemory(): Promise<boolean> {
    return this.memoryManager.resetWorkingMemory();
  }

  /**
   * Delete a context
   */
  public async deleteContext(name: string): Promise<boolean> {
    return this.memoryManager.deleteContext(name);
  }
}
