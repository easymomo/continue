/**
 * Shared Memory System
 * 
 * This module provides a shared memory system for agents to store and retrieve
 * information that needs to be shared across the agent system.
 */

import { EventEmitter } from 'events';
import { v4 as uuidv4 } from 'uuid';
import { AgentType } from '../types';

/**
 * Memory item stored in the shared memory
 */
interface MemoryItem {
  id: string;
  key: string;
  value: any;
  metadata: {
    creator: AgentType;
    timestamp: number;
    ttl?: number; // Time to live in milliseconds
    tags?: string[];
  };
}

/**
 * Shared memory system for agents
 */
export class SharedMemory extends EventEmitter {
  private static instance: SharedMemory;
  private memory: Map<string, MemoryItem>;
  
  private constructor() {
    super();
    this.memory = new Map();
    
    // Set up periodic cleanup for TTL items
    setInterval(() => this.cleanupExpiredItems(), 60000); // Check every minute
  }
  
  /**
   * Get the singleton instance of the shared memory
   */
  public static getInstance(): SharedMemory {
    if (!SharedMemory.instance) {
      SharedMemory.instance = new SharedMemory();
    }
    return SharedMemory.instance;
  }
  
  /**
   * Set a value in the shared memory
   */
  public set(
    key: string, 
    value: any, 
    creator: AgentType, 
    metadata: { ttl?: number; tags?: string[] } = {}
  ): string {
    const id = uuidv4();
    const item: MemoryItem = {
      id,
      key,
      value,
      metadata: {
        creator,
        timestamp: Date.now(),
        ...metadata
      }
    };
    
    this.memory.set(key, item);
    
    // Emit an event for this update
    this.emit('set', { key, id, creator });
    
    return id;
  }
  
  /**
   * Get a value from the shared memory
   */
  public get(key: string): any {
    const item = this.memory.get(key);
    
    if (!item) {
      return undefined;
    }
    
    // Check if the item has expired
    if (item.metadata.ttl && Date.now() > item.metadata.timestamp + item.metadata.ttl) {
      this.memory.delete(key);
      return undefined;
    }
    
    return item.value;
  }
  
  /**
   * Delete a value from the shared memory
   */
  public delete(key: string): boolean {
    const deleted = this.memory.delete(key);
    
    if (deleted) {
      // Emit an event for this deletion
      this.emit('delete', { key });
    }
    
    return deleted;
  }
  
  /**
   * Check if a key exists in the shared memory
   */
  public has(key: string): boolean {
    const item = this.memory.get(key);
    
    if (!item) {
      return false;
    }
    
    // Check if the item has expired
    if (item.metadata.ttl && Date.now() > item.metadata.timestamp + item.metadata.ttl) {
      this.memory.delete(key);
      return false;
    }
    
    return true;
  }
  
  /**
   * Find items by tag
   */
  public findByTag(tag: string): any[] {
    const results: any[] = [];
    
    for (const [_, item] of this.memory.entries()) {
      // Skip expired items
      if (item.metadata.ttl && Date.now() > item.metadata.timestamp + item.metadata.ttl) {
        continue;
      }
      
      // Check if the item has the specified tag
      if (item.metadata.tags && item.metadata.tags.includes(tag)) {
        results.push(item.value);
      }
    }
    
    return results;
  }
  
  /**
   * Find items by creator
   */
  public findByCreator(creator: AgentType): any[] {
    const results: any[] = [];
    
    for (const [_, item] of this.memory.entries()) {
      // Skip expired items
      if (item.metadata.ttl && Date.now() > item.metadata.timestamp + item.metadata.ttl) {
        continue;
      }
      
      // Check if the item was created by the specified agent
      if (item.metadata.creator === creator) {
        results.push(item.value);
      }
    }
    
    return results;
  }
  
  /**
   * Get all items in the shared memory
   */
  public getAll(): Map<string, any> {
    const result = new Map<string, any>();
    
    for (const [key, item] of this.memory.entries()) {
      // Skip expired items
      if (item.metadata.ttl && Date.now() > item.metadata.timestamp + item.metadata.ttl) {
        continue;
      }
      
      result.set(key, item.value);
    }
    
    return result;
  }
  
  /**
   * Clear all items from the shared memory
   */
  public clear(): void {
    this.memory.clear();
    this.emit('clear');
  }
  
  /**
   * Clean up expired items
   */
  private cleanupExpiredItems(): void {
    const now = Date.now();
    let cleanedCount = 0;
    
    for (const [key, item] of this.memory.entries()) {
      if (item.metadata.ttl && now > item.metadata.timestamp + item.metadata.ttl) {
        this.memory.delete(key);
        cleanedCount++;
      }
    }
    
    if (cleanedCount > 0) {
      this.emit('cleanup', { count: cleanedCount });
    }
  }
} 