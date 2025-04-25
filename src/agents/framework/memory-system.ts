/**
 * Memory System Implementation
 *
 * Provides a centralized system for storing and retrieving memories for agents.
 * Supports basic querying and will be extended with vector storage capabilities.
 */

import { EventEmitter } from "events";
import * as fs from "fs";
import * as path from "path";
import { v4 as uuidv4 } from "uuid";

// Types
export interface Memory {
  id: string;
  agentId: string;
  type: string;
  content: any;
  metadata: Record<string, any>;
  timestamp: string;
}

export interface MemoryQuery {
  agentId?: string;
  type?: string;
  metadata?: Record<string, any>;
  before?: string;
  after?: string;
  limit?: number;
}

export class MemorySystem extends EventEmitter {
  private memories: Map<string, Memory> = new Map();
  private agentMemoryIndex: Map<string, Set<string>> = new Map();
  private typeMemoryIndex: Map<string, Set<string>> = new Map();
  private storageDir: string;
  private initialized: boolean = false;

  constructor(storageDir: string = "src/agents/memories") {
    super();
    this.storageDir = storageDir;
    this.setMaxListeners(50);
  }

  /**
   * Initialize the memory system
   */
  public async initialize(): Promise<void> {
    if (this.initialized) {
      return;
    }

    console.log("Initializing memory system...");

    // Create storage directory if it doesn't exist
    if (!fs.existsSync(this.storageDir)) {
      fs.mkdirSync(this.storageDir, { recursive: true });
    }

    // Load existing memories
    await this.loadMemories();

    this.initialized = true;
    console.log("Memory system initialized");
    this.emit("initialized");
  }

  /**
   * Store a memory
   *
   * @param memory Memory to store
   * @returns ID of the stored memory
   */
  public async storeMemory(memory: Memory): Promise<string> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Generate ID if not provided
    if (!memory.id) {
      memory.id = uuidv4();
    }

    // Ensure timestamp
    if (!memory.timestamp) {
      memory.timestamp = new Date().toISOString();
    }

    // Store memory
    this.memories.set(memory.id, memory);

    // Update indices
    this.updateIndices(memory);

    // Persist memory
    await this.persistMemory(memory);

    // Emit event
    this.emit("memory:stored", {
      memoryId: memory.id,
      agentId: memory.agentId,
    });

    return memory.id;
  }

  /**
   * Get a memory by ID
   *
   * @param memoryId ID of memory to retrieve
   * @returns Memory object or undefined if not found
   */
  public async getMemory(memoryId: string): Promise<Memory | undefined> {
    if (!this.initialized) {
      await this.initialize();
    }

    return this.memories.get(memoryId);
  }

  /**
   * Delete a memory
   *
   * @param memoryId ID of memory to delete
   * @returns True if memory was deleted, false if not found
   */
  public async deleteMemory(memoryId: string): Promise<boolean> {
    if (!this.initialized) {
      await this.initialize();
    }

    // Check if memory exists
    const memory = this.memories.get(memoryId);
    if (!memory) {
      return false;
    }

    // Remove from indices
    this.removeFromIndices(memory);

    // Remove from memory store
    this.memories.delete(memoryId);

    // Delete persisted file
    await this.deletePersistedMemory(memoryId);

    // Emit event
    this.emit("memory:deleted", { memoryId, agentId: memory.agentId });

    return true;
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

    let candidateIds: Set<string> | null = null;

    // Start with agent-specific memories if specified
    if (query.agentId) {
      const agentMemories = this.agentMemoryIndex.get(query.agentId);
      if (!agentMemories || agentMemories.size === 0) {
        return []; // No memories for this agent
      }
      candidateIds = new Set(agentMemories);
    }

    // Filter by type if specified
    if (query.type && candidateIds) {
      const typeMemories = this.typeMemoryIndex.get(query.type);
      if (!typeMemories || typeMemories.size === 0) {
        return []; // No memories of this type
      }

      // Intersect with agent memories
      candidateIds = new Set(
        [...candidateIds].filter((id) => typeMemories.has(id)),
      );
    } else if (query.type) {
      // Just use type memories
      const typeMemories = this.typeMemoryIndex.get(query.type);
      if (!typeMemories || typeMemories.size === 0) {
        return []; // No memories of this type
      }
      candidateIds = new Set(typeMemories);
    }

    // Get candidate memories
    let candidates: Memory[];
    if (candidateIds) {
      candidates = [...candidateIds].map((id) => this.memories.get(id)!);
    } else {
      candidates = [...this.memories.values()];
    }

    // Apply additional filters
    const filteredMemories = candidates.filter((memory) => {
      // Filter by timestamp
      if (query.before && memory.timestamp >= query.before) {
        return false;
      }
      if (query.after && memory.timestamp <= query.after) {
        return false;
      }

      // Filter by metadata
      if (query.metadata) {
        for (const [key, value] of Object.entries(query.metadata)) {
          if (memory.metadata[key] !== value) {
            return false;
          }
        }
      }

      return true;
    });

    // Sort by timestamp (newest first)
    const sortedMemories = filteredMemories.sort((a, b) => {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    });

    // Apply limit
    if (query.limit && query.limit > 0) {
      return sortedMemories.slice(0, query.limit);
    }

    return sortedMemories;
  }

  /**
   * Get all memories for an agent
   *
   * @param agentId Agent ID
   * @returns Array of memories
   */
  public async getAgentMemories(agentId: string): Promise<Memory[]> {
    return this.queryMemories({ agentId });
  }

  /**
   * Update memory indices
   *
   * @param memory Memory to update indices for
   */
  private updateIndices(memory: Memory): void {
    // Update agent index
    if (memory.agentId) {
      let agentMemories = this.agentMemoryIndex.get(memory.agentId);
      if (!agentMemories) {
        agentMemories = new Set();
        this.agentMemoryIndex.set(memory.agentId, agentMemories);
      }
      agentMemories.add(memory.id);
    }

    // Update type index
    if (memory.type) {
      let typeMemories = this.typeMemoryIndex.get(memory.type);
      if (!typeMemories) {
        typeMemories = new Set();
        this.typeMemoryIndex.set(memory.type, typeMemories);
      }
      typeMemories.add(memory.id);
    }
  }

  /**
   * Remove memory from indices
   *
   * @param memory Memory to remove from indices
   */
  private removeFromIndices(memory: Memory): void {
    // Remove from agent index
    if (memory.agentId) {
      const agentMemories = this.agentMemoryIndex.get(memory.agentId);
      if (agentMemories) {
        agentMemories.delete(memory.id);
        if (agentMemories.size === 0) {
          this.agentMemoryIndex.delete(memory.agentId);
        }
      }
    }

    // Remove from type index
    if (memory.type) {
      const typeMemories = this.typeMemoryIndex.get(memory.type);
      if (typeMemories) {
        typeMemories.delete(memory.id);
        if (typeMemories.size === 0) {
          this.typeMemoryIndex.delete(memory.type);
        }
      }
    }
  }

  /**
   * Persist memory to disk
   *
   * @param memory Memory to persist
   */
  private async persistMemory(memory: Memory): Promise<void> {
    const filePath = path.join(this.storageDir, `${memory.id}.json`);
    await fs.promises.writeFile(
      filePath,
      JSON.stringify(memory, null, 2),
      "utf8",
    );
  }

  /**
   * Delete persisted memory file
   *
   * @param memoryId ID of memory to delete
   */
  private async deletePersistedMemory(memoryId: string): Promise<void> {
    const filePath = path.join(this.storageDir, `${memoryId}.json`);
    if (fs.existsSync(filePath)) {
      await fs.promises.unlink(filePath);
    }
  }

  /**
   * Load memories from disk
   */
  private async loadMemories(): Promise<void> {
    if (!fs.existsSync(this.storageDir)) {
      return;
    }

    const files = await fs.promises.readdir(this.storageDir);
    const jsonFiles = files.filter((file) => file.endsWith(".json"));

    for (const file of jsonFiles) {
      try {
        const filePath = path.join(this.storageDir, file);
        const data = await fs.promises.readFile(filePath, "utf8");
        const memory = JSON.parse(data) as Memory;

        // Store in memory
        this.memories.set(memory.id, memory);

        // Update indices
        this.updateIndices(memory);
      } catch (error) {
        console.error(`Error loading memory from ${file}:`, error);
      }
    }

    console.log(`Loaded ${this.memories.size} memories`);
  }
}

// Create and export a singleton instance
export const memorySystem = new MemorySystem();

// For testing and direct imports
export default MemorySystem;
