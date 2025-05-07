/**
 * Task Management System
 *
 * Provides a comprehensive task management system.
 * Integrates task verification, relationships, transitions, and context management.
 */
import { TransactionManager } from "../persistence/transaction";
import { Task } from "../types";
import { TaskContextOptions } from "./context";
import { TaskTransitionOptions } from "./transition";
import { TaskVerificationOptions } from "./verification";
/**
 * Integrated task manager options
 */
export interface TaskManagerOptions {
    verificationOptions?: TaskVerificationOptions;
    transitionOptions?: TaskTransitionOptions;
    contextOptions?: TaskContextOptions;
}
/**
 * Integrated task manager
 */
export declare class TaskManager {
    private verifier;
    private relationshipManager;
    private transitionManager;
    private contextManager;
    private stateManager;
    private lifecycleManager;
    private transactionManager;
    constructor(transactionManager: TransactionManager);
    /**
     * Create a new task
     */
    createTask(taskData: any, options?: TaskManagerOptions): Promise<string>;
    /**
     * Create a child task
     */
    createChildTask(parentId: string, taskData: any, options?: TaskManagerOptions): Promise<string>;
    /**
     * Start a task
     */
    startTask(taskId: string, options?: TaskManagerOptions): Promise<boolean>;
    /**
     * Complete a task
     */
    completeTask(taskId: string, options?: TaskManagerOptions): Promise<boolean>;
    /**
     * Cancel a task
     */
    cancelTask(taskId: string, options?: TaskManagerOptions): Promise<boolean>;
    /**
     * Switch between tasks
     */
    switchTasks(fromTaskId: string | null, toTaskId: string, options?: TaskManagerOptions & {
        transferContext?: boolean;
    }): Promise<boolean>;
    /**
     * Get a task
     */
    getTask(taskId: string): Promise<Task>;
    /**
     * Get child tasks
     */
    getChildTasks(taskId: string): Promise<Task[]>;
    /**
     * Get parent task
     */
    getParentTask(taskId: string): Promise<Task | undefined>;
    /**
     * Get task lineage (ancestors)
     */
    getTaskLineage(taskId: string): Promise<Task[]>;
    /**
     * Verify if a task operation is valid
     */
    verifyTask(task: Task, operation: "create" | "transition" | "boundary", options?: {
        newStatus?: Task["status"];
        nextTask?: Task;
    }): Promise<boolean>;
    /**
     * Get task context
     */
    getTaskContext(taskId: string): Promise<any>;
    /**
     * Compare task contexts
     */
    compareTaskContexts(taskId1: string, taskId2: string): Promise<any>;
    /**
     * Update task progress
     */
    updateTaskProgress(taskId: string, progress: number, options?: {
        incrementProgress?: boolean;
    }): Promise<boolean>;
    /**
     * Update task metadata
     */
    updateTaskMetadata(taskId: string, metadata: Record<string, any>): Promise<boolean>;
    /**
     * Get task state history
     */
    getTaskStateHistory(taskId: string): Promise<any>;
    /**
     * Find tasks by state
     */
    findTasksByState(options: any): Promise<Task[]>;
    /**
     * Get task transition history
     */
    getTaskTransitionHistory(taskId: string): Promise<any>;
    /**
     * Restart a task (returning it to in_progress from completed/cancelled)
     */
    restartTask(taskId: string, options?: TaskManagerOptions): Promise<boolean>;
    /**
     * Get transition recommendations for a task
     */
    getTransitionRecommendations(taskId: string): Promise<{
        nextStates: Task["status"][];
        recommendations: string[];
    }>;
    /**
     * Check if a task is currently in transition
     */
    isTaskInTransition(taskId: string): boolean;
    /**
     * Register default lifecycle hooks
     */
    private registerDefaultLifecycleHooks;
}
