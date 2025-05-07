/**
 * Task Lifecycle Manager
 *
 * Provides lifecycle hook management for the task system.
 * Handles task state transitions and ensures proper context preservation.
 */

import { Task } from "../types";
import { TaskCreateData } from "./relationship";

/**
 * Lifecycle hook types
 */
type PreCreateHook = (taskData: TaskCreateData) => Promise<void>;
type PostCreateHook = (task: Task) => Promise<void>;
type PreStartHook = (taskId: string) => Promise<void>;
type PostStartHook = (task: Task) => Promise<void>;
type PreCompleteHook = (taskId: string) => Promise<void>;
type PostCompleteHook = (task: Task) => Promise<void>;
type PreCancelHook = (taskId: string) => Promise<void>;
type PostCancelHook = (task: Task) => Promise<void>;

/**
 * Task lifecycle manager
 */
export class TaskLifecycleManager {
  private preCreateHooks: PreCreateHook[] = [];
  private postCreateHooks: PostCreateHook[] = [];
  private preStartHooks: PreStartHook[] = [];
  private postStartHooks: PostStartHook[] = [];
  private preCompleteHooks: PreCompleteHook[] = [];
  private postCompleteHooks: PostCompleteHook[] = [];
  private preCancelHooks: PreCancelHook[] = [];
  private postCancelHooks: PostCancelHook[] = [];

  /**
   * Register a hook to be called before a task is created
   */
  public registerPreCreateHook(hook: PreCreateHook): void {
    this.preCreateHooks.push(hook);
  }

  /**
   * Register a hook to be called after a task is created
   */
  public registerPostCreateHook(hook: PostCreateHook): void {
    this.postCreateHooks.push(hook);
  }

  /**
   * Register a hook to be called before a task is started
   */
  public registerPreStartHook(hook: PreStartHook): void {
    this.preStartHooks.push(hook);
  }

  /**
   * Register a hook to be called after a task is started
   */
  public registerPostStartHook(hook: PostStartHook): void {
    this.postStartHooks.push(hook);
  }

  /**
   * Register a hook to be called before a task is completed
   */
  public registerPreCompleteHook(hook: PreCompleteHook): void {
    this.preCompleteHooks.push(hook);
  }

  /**
   * Register a hook to be called after a task is completed
   */
  public registerPostCompleteHook(hook: PostCompleteHook): void {
    this.postCompleteHooks.push(hook);
  }

  /**
   * Register a hook to be called before a task is cancelled
   */
  public registerPreCancelHook(hook: PreCancelHook): void {
    this.preCancelHooks.push(hook);
  }

  /**
   * Register a hook to be called after a task is cancelled
   */
  public registerPostCancelHook(hook: PostCancelHook): void {
    this.postCancelHooks.push(hook);
  }

  /**
   * Trigger all pre-create hooks
   */
  public async triggerPreCreateHook(taskData: TaskCreateData): Promise<void> {
    for (const hook of this.preCreateHooks) {
      await hook(taskData);
    }
  }

  /**
   * Trigger all post-create hooks
   */
  public async triggerPostCreateHook(task: Task): Promise<void> {
    for (const hook of this.postCreateHooks) {
      await hook(task);
    }
  }

  /**
   * Trigger all pre-start hooks
   */
  public async triggerPreStartHook(taskId: string): Promise<void> {
    for (const hook of this.preStartHooks) {
      await hook(taskId);
    }
  }

  /**
   * Trigger all post-start hooks
   */
  public async triggerPostStartHook(task: Task): Promise<void> {
    for (const hook of this.postStartHooks) {
      await hook(task);
    }
  }

  /**
   * Trigger all pre-complete hooks
   */
  public async triggerPreCompleteHook(taskId: string): Promise<void> {
    for (const hook of this.preCompleteHooks) {
      await hook(taskId);
    }
  }

  /**
   * Trigger all post-complete hooks
   */
  public async triggerPostCompleteHook(task: Task): Promise<void> {
    for (const hook of this.postCompleteHooks) {
      await hook(task);
    }
  }

  /**
   * Trigger all pre-cancel hooks
   */
  public async triggerPreCancelHook(taskId: string): Promise<void> {
    for (const hook of this.preCancelHooks) {
      await hook(taskId);
    }
  }

  /**
   * Trigger all post-cancel hooks
   */
  public async triggerPostCancelHook(task: Task): Promise<void> {
    for (const hook of this.postCancelHooks) {
      await hook(task);
    }
  }

  /**
   * Remove a pre-create hook
   */
  public removePreCreateHook(hook: PreCreateHook): boolean {
    const index = this.preCreateHooks.indexOf(hook);
    if (index !== -1) {
      this.preCreateHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a post-create hook
   */
  public removePostCreateHook(hook: PostCreateHook): boolean {
    const index = this.postCreateHooks.indexOf(hook);
    if (index !== -1) {
      this.postCreateHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a pre-start hook
   */
  public removePreStartHook(hook: PreStartHook): boolean {
    const index = this.preStartHooks.indexOf(hook);
    if (index !== -1) {
      this.preStartHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a post-start hook
   */
  public removePostStartHook(hook: PostStartHook): boolean {
    const index = this.postStartHooks.indexOf(hook);
    if (index !== -1) {
      this.postStartHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a pre-complete hook
   */
  public removePreCompleteHook(hook: PreCompleteHook): boolean {
    const index = this.preCompleteHooks.indexOf(hook);
    if (index !== -1) {
      this.preCompleteHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a post-complete hook
   */
  public removePostCompleteHook(hook: PostCompleteHook): boolean {
    const index = this.postCompleteHooks.indexOf(hook);
    if (index !== -1) {
      this.postCompleteHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a pre-cancel hook
   */
  public removePreCancelHook(hook: PreCancelHook): boolean {
    const index = this.preCancelHooks.indexOf(hook);
    if (index !== -1) {
      this.preCancelHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Remove a post-cancel hook
   */
  public removePostCancelHook(hook: PostCancelHook): boolean {
    const index = this.postCancelHooks.indexOf(hook);
    if (index !== -1) {
      this.postCancelHooks.splice(index, 1);
      return true;
    }
    return false;
  }

  /**
   * Check if a task can transition to a new status
   */
  public canTransitionTo(
    currentStatus: Task["status"],
    newStatus: Task["status"],
  ): boolean {
    // Define valid transitions
    const validTransitions: Record<Task["status"], Task["status"][]> = {
      planned: ["in_progress", "cancelled"],
      in_progress: ["completed", "cancelled"],
      completed: [],
      cancelled: [],
    };

    return validTransitions[currentStatus]?.includes(newStatus) || false;
  }

  /**
   * Get a description of a task lifecycle event
   */
  public getLifecycleEventDescription(
    event: "create" | "start" | "complete" | "cancel",
  ): string {
    const descriptions: Record<string, string> = {
      create: "Task creation - initial setup and registration",
      start: "Task start - from planned to in_progress status",
      complete: "Task completion - from in_progress to completed status",
      cancel: "Task cancellation - to cancelled status from any other status",
    };

    return descriptions[event] || "Unknown lifecycle event";
  }

  /**
   * Clear all hooks
   */
  public clearAllHooks(): void {
    this.preCreateHooks = [];
    this.postCreateHooks = [];
    this.preStartHooks = [];
    this.postStartHooks = [];
    this.preCompleteHooks = [];
    this.postCompleteHooks = [];
    this.preCancelHooks = [];
    this.postCancelHooks = [];
  }
}
