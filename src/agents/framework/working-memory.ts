/**
 * Working Memory Manager
 *
 * Provides short-term memory capabilities for agents to maintain
 * conversation context, task state, and recent interactions.
 */

import { v4 as uuidv4 } from "uuid";
import { ContextualMemory } from "./contextual-memory.js";

export interface WorkingMemoryOptions {
  /**
   * Maximum number of items to keep in recent memory
   * @default 50
   */
  maxItems?: number;

  /**
   * Time-to-live for memory items in milliseconds
   * Default is 1 hour (3600000ms)
   * @default 3600000
   */
  ttlMs?: number;

  /**
   * Whether to automatically prune expired items
   * @default true
   */
  autoPrune?: boolean;
}

export interface MemoryItem<T = any> {
  id: string;
  type: string;
  content: T;
  timestamp: string;
  expiresAt?: string;
  metadata: Record<string, any>;
}

export class WorkingMemory {
  private agentId: string;
  private contextualMemory: ContextualMemory;
  private options: Required<WorkingMemoryOptions>;

  // In-memory cache of working memory items
  private items: Map<string, MemoryItem> = new Map();
  private typeIndex: Map<string, Set<string>> = new Map();

  // Context name used for persistence
  private readonly CONTEXT_NAME = "working-memory";

  constructor(agentId: string, options: WorkingMemoryOptions = {}) {
    this.agentId = agentId;
    this.contextualMemory = new ContextualMemory(agentId);

    // Set default options
    this.options = {
      maxItems: options.maxItems || 50,
      ttlMs: options.ttlMs || 3600000, // 1 hour
      autoPrune: options.autoPrune !== undefined ? options.autoPrune : true,
    };
  }

  /**
   * Initialize working memory
   */
  public async initialize(): Promise<void> {
    // Initialize contextual memory
    await this.contextualMemory.initialize();

    // Load working memory from contextual memory
    await this.loadFromContext();

    // Prune expired items if auto-prune is enabled
    if (this.options.autoPrune) {
      await this.pruneExpiredItems();
    }
  }

  /**
   * Add an item to working memory
   *
   * @param type Type of memory item
   * @param content Content of the memory item
   * @param metadata Additional metadata
   * @param ttlMs Optional time-to-live in milliseconds (overrides default)
   * @returns ID of the added item
   */
  public async addItem<T>(
    type: string,
    content: T,
    metadata: Record<string, any> = {},
    ttlMs?: number,
  ): Promise<string> {
    // Prune expired items if auto-prune is enabled
    if (this.options.autoPrune) {
      await this.pruneExpiredItems();
    }

    // Check if we need to remove old items
    if (this.items.size >= this.options.maxItems) {
      await this.pruneOldestItems(Math.ceil(this.options.maxItems * 0.2)); // Remove 20% of oldest items
    }

    // Calculate expiration time
    const now = new Date();
    const expiresAt =
      ttlMs !== undefined
        ? new Date(now.getTime() + ttlMs)
        : new Date(now.getTime() + this.options.ttlMs);

    // Create memory item
    const item: MemoryItem<T> = {
      id: uuidv4(),
      type,
      content,
      timestamp: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
      metadata,
    };

    // Add to in-memory storage
    this.items.set(item.id, item);

    // Update type index
    let typeItems = this.typeIndex.get(type);
    if (!typeItems) {
      typeItems = new Set();
      this.typeIndex.set(type, typeItems);
    }
    typeItems.add(item.id);

    // Persist to contextual memory
    await this.persistItem(item);

    return item.id;
  }

  /**
   * Get an item by ID
   *
   * @param id ID of the item to retrieve
   * @returns The memory item or undefined if not found or expired
   */
  public async getItem<T>(id: string): Promise<MemoryItem<T> | undefined> {
    const item = this.items.get(id) as MemoryItem<T> | undefined;

    if (!item) {
      return undefined;
    }

    // Check if expired
    if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
      // Remove expired item
      if (this.options.autoPrune) {
        await this.removeItem(id);
      }
      return undefined;
    }

    return item;
  }

  /**
   * Get items by type
   *
   * @param type Type of items to retrieve
   * @param limit Maximum number of items to return
   * @param excludeExpired Whether to exclude expired items
   * @returns Array of memory items
   */
  public async getItemsByType<T>(
    type: string,
    limit?: number,
    excludeExpired: boolean = true,
  ): Promise<MemoryItem<T>[]> {
    const typeItems = this.typeIndex.get(type);

    if (!typeItems || typeItems.size === 0) {
      return [];
    }

    const now = new Date();
    const items: MemoryItem<T>[] = [];

    for (const id of typeItems) {
      const item = this.items.get(id) as MemoryItem<T>;

      if (!item) {
        continue;
      }

      // Skip expired items if requested
      if (excludeExpired && item.expiresAt && new Date(item.expiresAt) < now) {
        continue;
      }

      items.push(item);
    }

    // Sort by timestamp (newest first)
    items.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply limit
    if (limit !== undefined && limit > 0 && items.length > limit) {
      return items.slice(0, limit);
    }

    return items;
  }

  /**
   * Remove an item
   *
   * @param id ID of the item to remove
   * @returns Whether the removal was successful
   */
  public async removeItem(id: string): Promise<boolean> {
    const item = this.items.get(id);

    if (!item) {
      return false;
    }

    // Remove from type index
    const typeItems = this.typeIndex.get(item.type);
    if (typeItems) {
      typeItems.delete(id);
      if (typeItems.size === 0) {
        this.typeIndex.delete(item.type);
      }
    }

    // Remove from items map
    this.items.delete(id);

    // Remove from contextual memory
    await this.contextualMemory.removeContextBlock(
      this.CONTEXT_NAME,
      `item-${id}`,
    );

    return true;
  }

  /**
   * Update an item
   *
   * @param id ID of the item to update
   * @param updates Updates to apply to the item
   * @returns Whether the update was successful
   */
  public async updateItem<T>(
    id: string,
    updates: Partial<Omit<MemoryItem<T>, "id">>,
  ): Promise<boolean> {
    const item = this.items.get(id);

    if (!item) {
      return false;
    }

    // Apply updates
    Object.assign(item, updates);

    // Update timestamp
    item.timestamp = new Date().toISOString();

    // Persist update
    await this.persistItem(item);

    return true;
  }

  /**
   * Search for items by content
   *
   * @param query Search query
   * @param types Optional types to search within
   * @param limit Maximum number of results
   * @returns Matching memory items
   */
  public async searchItems<T>(
    query: string,
    types?: string[],
    limit?: number,
  ): Promise<MemoryItem<T>[]> {
    const now = new Date();
    const results: MemoryItem<T>[] = [];

    // Convert query to lowercase for case-insensitive search
    const lowerQuery = query.toLowerCase();

    // Determine which items to search
    let itemsToSearch: MemoryItem[];

    if (types && types.length > 0) {
      // Collect items of the specified types
      itemsToSearch = [];

      for (const type of types) {
        const typeItems = this.typeIndex.get(type);
        if (typeItems) {
          for (const id of typeItems) {
            const item = this.items.get(id);
            if (item && (!item.expiresAt || new Date(item.expiresAt) > now)) {
              itemsToSearch.push(item);
            }
          }
        }
      }
    } else {
      // Use all non-expired items
      itemsToSearch = [...this.items.values()].filter(
        (item) => !item.expiresAt || new Date(item.expiresAt) > now,
      );
    }

    // Perform search
    for (const item of itemsToSearch) {
      const contentStr = JSON.stringify(item.content).toLowerCase();
      const metadataStr = JSON.stringify(item.metadata).toLowerCase();

      if (contentStr.includes(lowerQuery) || metadataStr.includes(lowerQuery)) {
        results.push(item as MemoryItem<T>);
      }
    }

    // Sort by timestamp (newest first)
    results.sort(
      (a, b) =>
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
    );

    // Apply limit
    if (limit !== undefined && limit > 0 && results.length > limit) {
      return results.slice(0, limit);
    }

    return results;
  }

  /**
   * Prune expired items
   *
   * @returns Number of items pruned
   */
  public async pruneExpiredItems(): Promise<number> {
    const now = new Date();
    const expiredIds: string[] = [];

    // Find expired items
    for (const [id, item] of this.items.entries()) {
      if (item.expiresAt && new Date(item.expiresAt) < now) {
        expiredIds.push(id);
      }
    }

    // Remove expired items
    for (const id of expiredIds) {
      await this.removeItem(id);
    }

    return expiredIds.length;
  }

  /**
   * Reset working memory
   *
   * @returns Whether the reset was successful
   */
  public async reset(): Promise<boolean> {
    // Clear in-memory storage
    this.items.clear();
    this.typeIndex.clear();

    // Delete contextual memory
    await this.contextualMemory.deleteContext(this.CONTEXT_NAME);

    return true;
  }

  /**
   * Create a snapshot of the current working memory state
   *
   * @param name Name of the snapshot
   * @returns Number of items in the snapshot
   */
  public async createSnapshot(name: string): Promise<number> {
    const snapshot = [...this.items.values()];

    // Store snapshot in contextual memory
    await this.contextualMemory.createContext(`snapshot-${name}`, {
      created: new Date().toISOString(),
      itemCount: snapshot.length,
    });

    // Add each item as a context block
    for (const item of snapshot) {
      await this.contextualMemory.addContextBlock(`snapshot-${name}`, {
        type: item.type,
        content: item,
        source: "working-memory",
        metadata: {
          originalId: item.id,
          ...item.metadata,
        },
      });
    }

    return snapshot.length;
  }

  /**
   * Load a snapshot into working memory
   *
   * @param name Name of the snapshot to load
   * @param replace Whether to replace current items
   * @returns Number of items loaded
   */
  public async loadSnapshot(
    name: string,
    replace: boolean = false,
  ): Promise<number> {
    if (replace) {
      await this.reset();
    }

    // Get snapshot context
    const snapshot = await this.contextualMemory.getContext(`snapshot-${name}`);

    if (!snapshot) {
      return 0;
    }

    // Load items from snapshot
    let loadedCount = 0;

    for (const block of snapshot.blocks) {
      const item = block.content as MemoryItem;

      // Regenerate a new ID
      const newItem: MemoryItem = {
        ...item,
        id: uuidv4(),
        metadata: {
          ...item.metadata,
          snapshotSource: name,
        },
      };

      // Add to in-memory storage
      this.items.set(newItem.id, newItem);

      // Update type index
      let typeItems = this.typeIndex.get(newItem.type);
      if (!typeItems) {
        typeItems = new Set();
        this.typeIndex.set(newItem.type, typeItems);
      }
      typeItems.add(newItem.id);

      loadedCount++;
    }

    // Persist loaded items
    await this.saveToContext();

    return loadedCount;
  }

  /**
   * Prune oldest items to make room for new ones
   *
   * @param count Number of items to remove
   */
  private async pruneOldestItems(count: number): Promise<number> {
    if (count <= 0 || this.items.size === 0) {
      return 0;
    }

    // Convert to array and sort by timestamp (oldest first)
    const sortedItems = [...this.items.entries()].sort(
      ([, a], [, b]) =>
        new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime(),
    );

    // Limit count to available items
    const pruneCount = Math.min(count, sortedItems.length);
    const itemsToRemove = sortedItems.slice(0, pruneCount);

    // Remove items
    for (const [id] of itemsToRemove) {
      await this.removeItem(id);
    }

    return pruneCount;
  }

  /**
   * Load working memory from contextual memory
   */
  private async loadFromContext(): Promise<void> {
    // Get context
    const context = await this.contextualMemory.getContext(this.CONTEXT_NAME);

    if (!context) {
      // Create empty context if it doesn't exist
      await this.contextualMemory.createContext(this.CONTEXT_NAME);
      return;
    }

    // Load items from context blocks
    for (const block of context.blocks) {
      if (block.type === "memory-item") {
        const item = block.content as MemoryItem;

        // Skip expired items
        if (item.expiresAt && new Date(item.expiresAt) < new Date()) {
          continue;
        }

        // Add to in-memory storage
        this.items.set(item.id, item);

        // Update type index
        let typeItems = this.typeIndex.get(item.type);
        if (!typeItems) {
          typeItems = new Set();
          this.typeIndex.set(item.type, typeItems);
        }
        typeItems.add(item.id);
      }
    }

    console.log(
      `Loaded ${this.items.size} working memory items for agent ${this.agentId}`,
    );
  }

  /**
   * Persist all items to contextual memory
   */
  private async saveToContext(): Promise<void> {
    // Create or get context
    let context = await this.contextualMemory.getContext(this.CONTEXT_NAME);

    if (!context) {
      context = await this.contextualMemory.createContext(this.CONTEXT_NAME);
    }

    // Clear existing blocks
    const blockPromises = context.blocks.map((block) =>
      this.contextualMemory.removeContextBlock(this.CONTEXT_NAME, block.id),
    );

    await Promise.all(blockPromises);

    // Add current items as blocks
    for (const item of this.items.values()) {
      // The contextualMemory.addContextBlock method will generate an ID automatically
      await this.contextualMemory.addContextBlock(this.CONTEXT_NAME, {
        type: "memory-item",
        content: item,
        source: "working-memory",
        metadata: {
          itemType: item.type,
          itemId: item.id,
        },
      });
    }
  }

  /**
   * Persist a single item to contextual memory
   */
  private async persistItem(item: MemoryItem): Promise<void> {
    // Create context if it doesn't exist
    let context = await this.contextualMemory.getContext(this.CONTEXT_NAME);

    if (!context) {
      context = await this.contextualMemory.createContext(this.CONTEXT_NAME);
    }

    // Remove existing block for this item if it exists
    const blockId = `item-${item.id}`;
    await this.contextualMemory.removeContextBlock(this.CONTEXT_NAME, blockId);

    // Add new block with consistent ID
    await this.contextualMemory.addContextBlock(this.CONTEXT_NAME, {
      type: "memory-item",
      content: item,
      source: "working-memory",
      metadata: {
        itemType: item.type,
        itemId: item.id,
      },
    });
  }
}
