/**
 * Shared Memory System
 *
 * This module provides a shared memory system for agents to store and retrieve
 * information that needs to be shared across the agent system.
 */
import { EventEmitter } from 'events';
import { AgentType } from '../types';
/**
 * Shared memory system for agents
 */
export declare class SharedMemory extends EventEmitter {
    private static instance;
    private memory;
    private constructor();
    /**
     * Get the singleton instance of the shared memory
     */
    static getInstance(): SharedMemory;
    /**
     * Set a value in the shared memory
     */
    set(key: string, value: any, creator: AgentType, metadata?: {
        ttl?: number;
        tags?: string[];
    }): string;
    /**
     * Get a value from the shared memory
     */
    get(key: string): any;
    /**
     * Delete a value from the shared memory
     */
    delete(key: string): boolean;
    /**
     * Check if a key exists in the shared memory
     */
    has(key: string): boolean;
    /**
     * Find items by tag
     */
    findByTag(tag: string): any[];
    /**
     * Find items by creator
     */
    findByCreator(creator: AgentType): any[];
    /**
     * Get all items in the shared memory
     */
    getAll(): Map<string, any>;
    /**
     * Clear all items from the shared memory
     */
    clear(): void;
    /**
     * Clean up expired items
     */
    private cleanupExpiredItems;
}
