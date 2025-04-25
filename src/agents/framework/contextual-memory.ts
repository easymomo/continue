/**
 * Contextual Memory Manager
 *
 * Extends the memory system with capabilities specifically designed for maintaining
 * contextual information and knowledge continuity for agents.
 */

import { v4 as uuidv4 } from "uuid";
import { memorySystem } from "./memory-system.js";

export interface ContextBlock {
  id: string;
  type: string;
  content: any;
  source: string;
  timestamp: string;
  relevance?: number;
  metadata: Record<string, any>;
}

export interface AgentContext {
  id: string;
  name: string;
  blocks: ContextBlock[];
  lastUpdated: string;
  metadata: Record<string, any>;
}

export interface ContextQuery {
  types?: string[];
  sources?: string[];
  minRelevance?: number;
  keywords?: string[];
  limit?: number;
  sortBy?: "timestamp" | "relevance";
}

export class ContextualMemory {
  private agentId: string;
  private contextCache: Map<string, AgentContext> = new Map();

  constructor(agentId: string) {
    this.agentId = agentId;
  }

  /**
   * Initialize the contextual memory subsystem
   */
  public async initialize(): Promise<void> {
    // Load existing contexts from memory system
    await this.loadContexts();
  }

  /**
   * Add a block to agent context
   * @param contextName Name of the context to add to
   * @param block The context block to add
   * @returns The ID of the added block
   */
  public async addContextBlock(
    contextName: string,
    block: Omit<ContextBlock, "id" | "timestamp">,
  ): Promise<string> {
    // Get or create context
    let context = await this.getContext(contextName);

    if (!context) {
      context = await this.createContext(contextName);
    }

    // Create complete block
    const fullBlock: ContextBlock = {
      ...block,
      id: uuidv4(),
      timestamp: new Date().toISOString(),
    };

    // Add block to context
    context.blocks.push(fullBlock);
    context.lastUpdated = new Date().toISOString();

    // Save to memory system
    await this.saveContext(context);

    return fullBlock.id;
  }

  /**
   * Create a new context
   * @param name Name of the context
   * @param metadata Optional metadata for the context
   * @returns The created context
   */
  public async createContext(
    name: string,
    metadata: Record<string, any> = {},
  ): Promise<AgentContext> {
    const context: AgentContext = {
      id: uuidv4(),
      name,
      blocks: [],
      lastUpdated: new Date().toISOString(),
      metadata,
    };

    // Save to memory
    await this.saveContext(context);

    return context;
  }

  /**
   * Get a context by name
   * @param name Name of the context to retrieve
   * @returns The context or undefined if not found
   */
  public async getContext(name: string): Promise<AgentContext | undefined> {
    // Check cache first
    if (this.contextCache.has(name)) {
      return this.contextCache.get(name);
    }

    // Query memory system
    const memories = await memorySystem.queryMemories({
      agentId: this.agentId,
      type: "context",
      metadata: { contextName: name },
    });

    if (memories.length === 0) {
      return undefined;
    }

    // Use the most recent context memory
    const contextMemory = memories[0];
    const context = contextMemory.content as AgentContext;

    // Cache it
    this.contextCache.set(name, context);

    return context;
  }

  /**
   * Query context blocks based on criteria
   * @param contextName Name of the context to query
   * @param query Query parameters
   * @returns Matching context blocks
   */
  public async queryContext(
    contextName: string,
    query: ContextQuery,
  ): Promise<ContextBlock[]> {
    const context = await this.getContext(contextName);

    if (!context) {
      return [];
    }

    // Filter blocks
    let blocks = [...context.blocks];

    if (query.types && query.types.length > 0) {
      blocks = blocks.filter((block) => query.types!.includes(block.type));
    }

    if (query.sources && query.sources.length > 0) {
      blocks = blocks.filter((block) => query.sources!.includes(block.source));
    }

    if (query.minRelevance !== undefined) {
      blocks = blocks.filter(
        (block) =>
          block.relevance === undefined ||
          block.relevance >= query.minRelevance!,
      );
    }

    if (query.keywords && query.keywords.length > 0) {
      blocks = blocks.filter((block) => {
        const content = JSON.stringify(block.content).toLowerCase();
        return query.keywords!.some((keyword) =>
          content.includes(keyword.toLowerCase()),
        );
      });
    }

    // Sort by requested parameter
    if (query.sortBy === "relevance") {
      blocks.sort(
        (a, b) =>
          (b.relevance !== undefined ? b.relevance : 0) -
          (a.relevance !== undefined ? a.relevance : 0),
      );
    } else {
      // Default sort by timestamp, newest first
      blocks.sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );
    }

    // Apply limit
    if (query.limit !== undefined && query.limit > 0) {
      blocks = blocks.slice(0, query.limit);
    }

    return blocks;
  }

  /**
   * Update a context block
   * @param contextName Name of the context containing the block
   * @param blockId ID of the block to update
   * @param updates Updates to apply to the block
   * @returns Whether the update was successful
   */
  public async updateContextBlock(
    contextName: string,
    blockId: string,
    updates: Partial<Omit<ContextBlock, "id">>,
  ): Promise<boolean> {
    const context = await this.getContext(contextName);

    if (!context) {
      return false;
    }

    // Find block
    const blockIndex = context.blocks.findIndex((b) => b.id === blockId);
    if (blockIndex === -1) {
      return false;
    }

    // Apply updates
    context.blocks[blockIndex] = {
      ...context.blocks[blockIndex],
      ...updates,
    };

    context.lastUpdated = new Date().toISOString();

    // Save context
    await this.saveContext(context);

    return true;
  }

  /**
   * Remove a block from context
   * @param contextName Name of the context
   * @param blockId ID of the block to remove
   * @returns Whether the removal was successful
   */
  public async removeContextBlock(
    contextName: string,
    blockId: string,
  ): Promise<boolean> {
    const context = await this.getContext(contextName);

    if (!context) {
      return false;
    }

    // Check if block exists
    const initialLength = context.blocks.length;
    context.blocks = context.blocks.filter((b) => b.id !== blockId);

    if (context.blocks.length === initialLength) {
      return false; // Block wasn't found
    }

    context.lastUpdated = new Date().toISOString();

    // Save context
    await this.saveContext(context);

    return true;
  }

  /**
   * Delete an entire context
   * @param name Name of the context to delete
   * @returns Whether the deletion was successful
   */
  public async deleteContext(name: string): Promise<boolean> {
    // Remove from cache
    this.contextCache.delete(name);

    // Find the memory ID
    const memories = await memorySystem.queryMemories({
      agentId: this.agentId,
      type: "context",
      metadata: { contextName: name },
    });

    if (memories.length === 0) {
      return false;
    }

    // Delete all context memories
    let success = true;
    for (const memory of memories) {
      const result = await memorySystem.deleteMemory(memory.id);
      if (!result) {
        success = false;
      }
    }

    return success;
  }

  /**
   * Merge information from one context into another
   * @param sourceContextName Source context name
   * @param targetContextName Target context name
   * @param query Optional query to filter which blocks to merge
   * @returns Number of blocks merged
   */
  public async mergeContexts(
    sourceContextName: string,
    targetContextName: string,
    query?: ContextQuery,
  ): Promise<number> {
    const sourceContext = await this.getContext(sourceContextName);
    if (!sourceContext) {
      return 0;
    }

    let targetContext = await this.getContext(targetContextName);
    if (!targetContext) {
      targetContext = await this.createContext(targetContextName);
    }

    // Get blocks to merge
    let blocksToMerge = sourceContext.blocks;
    if (query) {
      blocksToMerge = await this.queryContext(sourceContextName, query);
    }

    if (blocksToMerge.length === 0) {
      return 0;
    }

    // Add blocks to target context with new IDs
    for (const block of blocksToMerge) {
      const newBlock: ContextBlock = {
        ...block,
        id: uuidv4(),
        metadata: {
          ...block.metadata,
          mergedFrom: sourceContextName,
          originalBlockId: block.id,
        },
      };

      targetContext.blocks.push(newBlock);
    }

    targetContext.lastUpdated = new Date().toISOString();

    // Save updated context
    await this.saveContext(targetContext);

    return blocksToMerge.length;
  }

  /**
   * Load all agent contexts from memory
   */
  private async loadContexts(): Promise<void> {
    const memories = await memorySystem.queryMemories({
      agentId: this.agentId,
      type: "context",
    });

    for (const memory of memories) {
      const context = memory.content as AgentContext;
      this.contextCache.set(context.name, context);
    }

    console.log(
      `Loaded ${this.contextCache.size} contexts for agent ${this.agentId}`,
    );
  }

  /**
   * Save context to memory system
   */
  private async saveContext(context: AgentContext): Promise<void> {
    // Update cache
    this.contextCache.set(context.name, context);

    // Store in memory system
    await memorySystem.storeMemory({
      id: uuidv4(),
      agentId: this.agentId,
      type: "context",
      content: context,
      metadata: {
        contextName: context.name,
        lastUpdated: context.lastUpdated,
      },
      timestamp: context.lastUpdated,
    });
  }
}
