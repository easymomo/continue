/**
 * Task Management System
 *
 * Provides a comprehensive task management system.
 * Integrates task verification, relationships, transitions, and context management.
 */
import { TaskContextManager, } from "./context";
import { TaskLifecycleManager } from "./lifecycle";
import { TaskRelationshipManager } from "./relationship";
import { TaskStateManager } from "./state";
import { TaskTransitionManager } from "./transition";
import { TaskVerifier } from "./verification";
/**
 * Integrated task manager
 */
export class TaskManager {
    constructor(transactionManager) {
        // Store transaction manager
        this.transactionManager = transactionManager;
        // Initialize all components
        this.lifecycleManager = new TaskLifecycleManager();
        this.verifier = new TaskVerifier(this.lifecycleManager);
        this.relationshipManager = new TaskRelationshipManager(transactionManager);
        this.contextManager = new TaskContextManager();
        this.stateManager = new TaskStateManager(transactionManager);
        this.transitionManager = new TaskTransitionManager(this.verifier, this.relationshipManager, this.lifecycleManager, this.contextManager, this.transactionManager, this.stateManager);
        // Register default lifecycle hooks that handle context preservation
        this.registerDefaultLifecycleHooks();
    }
    /**
     * Create a new task
     */
    async createTask(taskData, options) {
        // Verify task creation
        const verificationResult = await this.verifier.verifyTaskCreation(taskData, options?.verificationOptions);
        if (!verificationResult.verified) {
            throw new Error(`Task creation verification failed: ${verificationResult.errors.join(", ")}`);
        }
        // Use relationship manager to create the task
        const taskId = await this.relationshipManager.createChildTask(taskData.parentId || "root", taskData);
        // Capture initial context
        await this.contextManager.captureTaskContext(await this.getTask(taskId), options?.contextOptions);
        // Trigger lifecycle hooks
        await this.lifecycleManager.triggerPostCreateHook(await this.getTask(taskId));
        return taskId;
    }
    /**
     * Create a child task
     */
    async createChildTask(parentId, taskData, options) {
        // Add parent ID to task data
        const childTaskData = {
            ...taskData,
            parentId,
        };
        return this.createTask(childTaskData, options);
    }
    /**
     * Start a task
     */
    async startTask(taskId, options) {
        const result = await this.transitionManager.startTask(taskId, options?.transitionOptions);
        if (!result.success) {
            throw new Error(`Failed to start task: ${result.message}`);
        }
        // Capture context when starting
        await this.contextManager.captureTaskContext(await this.getTask(taskId), options?.contextOptions);
        return true;
    }
    /**
     * Complete a task
     */
    async completeTask(taskId, options) {
        const result = await this.transitionManager.completeTask(taskId, options?.transitionOptions);
        if (!result.success) {
            throw new Error(`Failed to complete task: ${result.message}`);
        }
        // Capture final context when completing
        await this.contextManager.captureTaskContext(await this.getTask(taskId), options?.contextOptions);
        return true;
    }
    /**
     * Cancel a task
     */
    async cancelTask(taskId, options) {
        const result = await this.transitionManager.cancelTask(taskId, options?.transitionOptions);
        if (!result.success) {
            throw new Error(`Failed to cancel task: ${result.message}`);
        }
        return true;
    }
    /**
     * Switch between tasks
     */
    async switchTasks(fromTaskId, toTaskId, options) {
        // Transition between tasks
        const result = await this.transitionManager.transitionBetweenTasks(fromTaskId, toTaskId, options?.transitionOptions);
        if (!result.success) {
            throw new Error(`Failed to switch tasks: ${result.message}`);
        }
        // Transfer context if requested
        if (options?.transferContext && fromTaskId) {
            await this.contextManager.transferContext(fromTaskId, toTaskId, {
                mergeStrategy: "merge",
                preserveHistory: true,
                ...options.contextOptions,
            });
        }
        return true;
    }
    /**
     * Get a task
     */
    async getTask(taskId) {
        return this.transactionManager.executeInTransaction(async (transaction) => {
            // Get the task from the storage via relationship manager
            const task = await this.relationshipManager["storageManager"].getTask(taskId, transaction);
            if (!task) {
                throw new Error(`Task with ID ${taskId} not found`);
            }
            return task;
        });
    }
    /**
     * Get child tasks
     */
    async getChildTasks(taskId) {
        return this.relationshipManager.getChildTasks(taskId);
    }
    /**
     * Get parent task
     */
    async getParentTask(taskId) {
        return this.relationshipManager.getParentTask(taskId);
    }
    /**
     * Get task lineage (ancestors)
     */
    async getTaskLineage(taskId) {
        return this.relationshipManager.getTaskLineage(taskId);
    }
    /**
     * Verify if a task operation is valid
     */
    async verifyTask(task, operation, options) {
        if (operation === "create") {
            const result = await this.verifier.verifyTaskCreation(task);
            return result.verified;
        }
        else if (operation === "transition" && options?.newStatus) {
            const result = await this.verifier.verifyTaskTransition(task, options.newStatus);
            return result.verified;
        }
        else if (operation === "boundary" && options?.nextTask) {
            const result = await this.verifier.verifyTaskBoundary(task, options.nextTask);
            return result.verified;
        }
        return false;
    }
    /**
     * Get task context
     */
    async getTaskContext(taskId) {
        return this.contextManager.getTaskContext(taskId);
    }
    /**
     * Compare task contexts
     */
    async compareTaskContexts(taskId1, taskId2) {
        return this.contextManager.getContextDiff(taskId1, taskId2);
    }
    /**
     * Update task progress
     */
    async updateTaskProgress(taskId, progress, options) {
        return this.stateManager.updateTaskProgress(taskId, progress, {
            incrementProgress: options?.incrementProgress,
            notifySubscribers: true,
            trackHistory: true,
        });
    }
    /**
     * Update task metadata
     */
    async updateTaskMetadata(taskId, metadata) {
        return this.stateManager.updateTaskMetadata(taskId, metadata, {
            notifySubscribers: true,
            trackHistory: true,
        });
    }
    /**
     * Get task state history
     */
    async getTaskStateHistory(taskId) {
        return this.stateManager.getTaskStateHistory(taskId);
    }
    /**
     * Find tasks by state
     */
    async findTasksByState(options) {
        return this.stateManager.findTasksByState(options);
    }
    /**
     * Get task transition history
     */
    async getTaskTransitionHistory(taskId) {
        return this.transitionManager.getTaskTransitionHistory(taskId);
    }
    /**
     * Restart a task (returning it to in_progress from completed/cancelled)
     */
    async restartTask(taskId, options) {
        const result = await this.transitionManager.restartTask(taskId, options?.transitionOptions);
        if (!result.success) {
            throw new Error(`Failed to restart task: ${result.message}`);
        }
        return true;
    }
    /**
     * Get transition recommendations for a task
     */
    async getTransitionRecommendations(taskId) {
        return this.transitionManager.getTransitionRecommendations(taskId);
    }
    /**
     * Check if a task is currently in transition
     */
    isTaskInTransition(taskId) {
        return this.transitionManager.isTaskInTransition(taskId);
    }
    /**
     * Register default lifecycle hooks
     */
    registerDefaultLifecycleHooks() {
        // Register a post-start hook for capturing context
        this.lifecycleManager.registerPostStartHook(async (task) => {
            await this.contextManager.captureTaskContext(task);
        });
        // Register a pre-complete hook for validating context
        this.lifecycleManager.registerPreCompleteHook(async (taskId) => {
            await this.contextManager.validateTaskContext(taskId);
        });
        // Register a post-complete hook for preserving context
        this.lifecycleManager.registerPostCompleteHook(async (task) => {
            await this.contextManager.captureTaskContext(task);
        });
    }
}
