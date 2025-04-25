/**
 * Memory Manager
 *
 * Provides a unified interface to manage different types of agent memory:
 * - Long-term memories via MemorySystem
 * - Contextual memories via ContextualMemory
 * - Short-term/working memories via WorkingMemory
 */

import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import {
  AgentContext,
  ContextBlock,
  ContextQuery,
  ContextualMemory,
} from "./contextual-memory.js";
import { Memory, MemoryQuery, memorySystem } from "./memory-system.js";
import {
  MemoryItem,
  WorkingMemory,
  WorkingMemoryOptions,
} from "./working-memory.js";

export interface MemoryManagerOptions {
  workingMemoryOptions?: WorkingMemoryOptions;
}

/**
 * Memory Manager provides unified access to different memory systems
 */
export class MemoryManager extends EventEmitter {
  private agentId: string;
  private memorySystem = memorySystem;
  private contextualMemory: ContextualMemory;
  private workingMemory: WorkingMemory;
  private initialized: boolean = false;

  constructor(agentId: string, options: MemoryManagerOptions = {}) {
    super();

    this.agentId = agentId;
    this.contextualMemory = new ContextualMemory(agentId);
    this.workingMemory = new WorkingMemory(
      agentId,
      options.workingMemoryOptions,
    );

    this.setMaxListeners(50);
  }

  /**
   * Initialize the memory manager
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log(`Initializing memory manager for agent: ${this.agentId}`);

    // Initialize all memory subsystems
    await this.memorySystem.initialize();
    await this.contextualMemory.initialize();
    await this.workingMemory.initialize();

    this.initialized = true;
    console.log(`Memory manager initialized for agent: ${this.agentId}`);
    this.emit("initialized");
  }

  /**
   * Store a memory in long-term storage
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
    if (!this.initialized) {
      await this.initialize();
    }

    const memoryId = await this.memorySystem.storeMemory({
      id: uuidv4(),
      agentId: this.agentId,
      type,
      content,
      metadata,
      timestamp: new Date().toISOString(),
    });

    this.emit("memory:stored", { memoryId, type });
    return memoryId;
  }

  /**
   * Get a memory by ID
   *
   * @param memoryId ID of the memory to retrieve
   * @returns Memory object or undefined if not found
   */
  public async getMemory(memoryId: string): Promise<Memory | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.memorySystem.getMemory(memoryId);
  }

  /**
   * Delete a memory
   *
   * @param memoryId ID of the memory to delete
   * @returns True if successfully deleted, false otherwise
   */
  public async deleteMemory(memoryId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const result = await this.memorySystem.deleteMemory(memoryId);

    if (result) {
      this.emit("memory:deleted", { memoryId });
    }

    return result;
  }

  /**
   * Query memories based on criteria
   *
   * @param query Query criteria
   * @returns Array of matching memories
   */
  public async queryMemories(query: MemoryQuery): Promise<Memory[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Ensure agent ID is set
    const fullQuery: MemoryQuery = {
      ...query,
      agentId: this.agentId,
    };

    return this.memorySystem.queryMemories(fullQuery);
  }

  /**
   * Create a new context
   *
   * @param name Name of the context
   * @param metadata Optional metadata
   * @returns The created context
   */
  public async createContext(
    name: string,
    metadata: Record<string, any> = {},
  ): Promise<AgentContext> {
    if (!this.initialized) {
      await this.initialize();
    }

    const context = await this.contextualMemory.createContext(name, metadata);
    this.emit("context:created", { contextName: name });
    return context;
  }

  /**
   * Get a context by name
   *
   * @param name Name of the context
   * @returns The context or undefined if not found
   */
  public async getContext(name: string): Promise<AgentContext | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.contextualMemory.getContext(name);
  }

  /**
   * Add a block to a context
   *
   * @param contextName Name of the context
   * @param block Context block to add
   * @returns ID of the added block
   */
  public async addContextBlock(
    contextName: string,
    block: Omit<ContextBlock, "id" | "timestamp">,
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const blockId = await this.contextualMemory.addContextBlock(
      contextName,
      block,
    );
    this.emit("context:block:added", { contextName, blockId });
    return blockId;
  }

  /**
   * Query context blocks
   *
   * @param contextName Name of the context
   * @param query Query parameters
   * @returns Matching context blocks
   */
  public async queryContext(
    contextName: string,
    query: ContextQuery,
  ): Promise<ContextBlock[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.contextualMemory.queryContext(contextName, query);
  }

  /**
   * Update a context block
   *
   * @param contextName Name of the context
   * @param blockId ID of the block to update
   * @param updates Updates to apply
   * @returns Whether the update was successful
   */
  public async updateContextBlock(
    contextName: string,
    blockId: string,
    updates: Partial<Omit<ContextBlock, "id">>,
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const result = await this.contextualMemory.updateContextBlock(
      contextName,
      blockId,
      updates,
    );

    if (result) {
      this.emit("context:block:updated", { contextName, blockId });
    }

    return result;
  }

  /**
   * Delete a context
   *
   * @param name Name of the context to delete
   * @returns Whether the deletion was successful
   */
  public async deleteContext(name: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const result = await this.contextualMemory.deleteContext(name);

    if (result) {
      this.emit("context:deleted", { contextName: name });
    }

    return result;
  }

  /**
   * Add an item to working memory
   *
   * @param type Type of memory item
   * @param content Content of the memory item
   * @param metadata Additional metadata
   * @param ttlMs Optional time-to-live in milliseconds
   * @returns ID of the added item
   */
  public async addWorkingMemoryItem<T>(
    type: string,
    content: T,
    metadata: Record<string, any> = {},
    ttlMs?: number,
  ): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    const itemId = await this.workingMemory.addItem(
      type,
      content,
      metadata,
      ttlMs,
    );
    this.emit("working-memory:item:added", { itemId, type });
    return itemId;
  }

  /**
   * Get a working memory item by ID
   *
   * @param id ID of the item to retrieve
   * @returns The memory item or undefined if not found or expired
   */
  public async getWorkingMemoryItem<T>(
    id: string,
  ): Promise<MemoryItem<T> | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.workingMemory.getItem<T>(id);
  }

  /**
   * Get working memory items by type
   *
   * @param type Type of items to retrieve
   * @param limit Maximum number of items to return
   * @param excludeExpired Whether to exclude expired items
   * @returns Array of memory items
   */
  public async getWorkingMemoryItemsByType<T>(
    type: string,
    limit?: number,
    excludeExpired: boolean = true,
  ): Promise<MemoryItem<T>[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.workingMemory.getItemsByType<T>(type, limit, excludeExpired);
  }

  /**
   * Search working memory items
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
  ): Promise<MemoryItem<T>[]> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.workingMemory.searchItems<T>(query, types, limit);
  }

  /**
   * Create a snapshot of working memory
   *
   * @param name Name of the snapshot
   * @returns Number of items in the snapshot
   */
  public async createWorkingMemorySnapshot(name: string): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    const count = await this.workingMemory.createSnapshot(name);
    this.emit("working-memory:snapshot:created", { name, itemCount: count });
    return count;
  }

  /**
   * Load a working memory snapshot
   *
   * @param name Name of the snapshot to load
   * @param replace Whether to replace current items
   * @returns Number of items loaded
   */
  public async loadWorkingMemorySnapshot(
    name: string,
    replace: boolean = false,
  ): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    const count = await this.workingMemory.loadSnapshot(name, replace);
    this.emit("working-memory:snapshot:loaded", { name, itemCount: count });
    return count;
  }

  /**
   * Reset working memory
   *
   * @returns Whether the reset was successful
   */
  public async resetWorkingMemory(): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    const result = await this.workingMemory.reset();

    if (result) {
      this.emit("working-memory:reset");
    }

    return result;
  }

  /**
   * Transfer items from working memory to long-term memory
   *
   * @param type Type of working memory items to transfer
   * @param memoryType Type to use for long-term memories
   * @param filter Optional filter function to select items
   * @returns Number of items transferred
   */
  public async transferWorkingToLongTerm(
    type: string,
    memoryType: string,
    filter?: (item: MemoryItem) => boolean,
  ): Promise<number> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Get items of the specified type
    const items = await this.workingMemory.getItemsByType(type);

    if (items.length === 0) {
      return 0;
    }

    // Apply filter if provided
    const filteredItems = filter ? items.filter(filter) : items;

    if (filteredItems.length === 0) {
      return 0;
    }

    // Store each item in long-term memory
    let transferCount = 0;

    for (const item of filteredItems) {
      await this.storeMemory(memoryType, item.content, {
        originalType: item.type,
        originalId: item.id,
        transferredAt: new Date().toISOString(),
        ...item.metadata,
      });

      transferCount++;
    }

    this.emit("memory:transferred", {
      count: transferCount,
      fromType: type,
      toType: memoryType,
    });

    return transferCount;
  }

  /**
   * Transfer a context to long-term memory
   *
   * @param contextName Name of the context to transfer
   * @param memoryType Type to use for long-term memory
   * @returns Whether the transfer was successful
   */
  public async transferContextToLongTerm(
    contextName: string,
    memoryType: string,
  ): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Get the context
    const context = await this.contextualMemory.getContext(contextName);

    if (!context) {
      return false;
    }

    // Store the entire context as a single memory
    await this.storeMemory(memoryType, context, {
      contextName,
      transferredAt: new Date().toISOString(),
    });

    this.emit("context:transferred", {
      contextName,
      toType: memoryType,
    });

    return true;
  }
}

// Create and export singleton function to get memory manager instances
const memoryManagers = new Map<string, MemoryManager>();

/**
 * Get a memory manager instance for an agent
 *
 * @param agentId ID of the agent
 * @param options Optional configuration options
 * @returns Memory manager instance
 */
export function getMemoryManager(
  agentId: string,
  options: MemoryManagerOptions = {},
): MemoryManager {
  let manager = memoryManagers.get(agentId);

  if (!manager) {
    manager = new MemoryManager(agentId, options);
    memoryManagers.set(agentId, manager);
  }

  return manager;
}
