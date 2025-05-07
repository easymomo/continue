/**
 * Task Context Manager
 *
 * Manages context preservation and transfer during task transitions.
 * Ensures that task context is properly maintained across task boundaries.
 */

import { Context, ContextComponent, Task } from "../types";

/**
 * Task context preservation options
 */
export interface TaskContextOptions {
  captureEnvironment?: boolean; // Capture environment variables and settings
  captureCodeState?: boolean; // Capture code state (e.g., open files, changes)
  captureTaskState?: boolean; // Capture task state (e.g., progress, notes)
  deepCopy?: boolean; // If true, creates a deep copy of context data
}

/**
 * Context transfer options
 */
export interface ContextTransferOptions extends TaskContextOptions {
  mergeStrategy?: "replace" | "merge" | "append"; // How to handle existing context
  preserveHistory?: boolean; // If true, preserves context history
}

/**
 * Task context manager
 */
export class TaskContextManager {
  private contextStore: Map<string, Context> = new Map();

  /**
   * Capture context for a task
   */
  public async captureTaskContext(
    task: Task,
    options: TaskContextOptions = {},
  ): Promise<Context> {
    const taskId = task.id;

    // Default options
    const opts = {
      captureEnvironment: true,
      captureCodeState: true,
      captureTaskState: true,
      deepCopy: false,
      ...options,
    };

    // Create the context object
    const context: Context = {
      id: `context-${taskId}-${Date.now()}`,
      taskId,
      timestamp: Date.now(),
      codebaseState: await this.captureCodebaseState(),
      components: [],
    };

    // Capture environment context if requested
    if (opts.captureEnvironment) {
      context.components.push(await this.captureEnvironmentContext());
    }

    // Capture code state if requested
    if (opts.captureCodeState) {
      context.components.push(await this.captureCodeStateContext());
    }

    // Capture task state if requested
    if (opts.captureTaskState) {
      context.components.push(await this.captureTaskStateContext(task));
    }

    // Store the context
    this.contextStore.set(
      taskId,
      opts.deepCopy ? this.deepCopyContext(context) : context,
    );

    return context;
  }

  /**
   * Retrieve context for a task
   */
  public async getTaskContext(taskId: string): Promise<Context | undefined> {
    return this.contextStore.get(taskId);
  }

  /**
   * Transfer context between tasks
   */
  public async transferContext(
    sourceTaskId: string,
    targetTaskId: string,
    options: ContextTransferOptions = {},
  ): Promise<boolean> {
    // Get source context
    const sourceContext = this.contextStore.get(sourceTaskId);
    if (!sourceContext) {
      return false;
    }

    // Default options
    const opts = {
      mergeStrategy: "merge",
      preserveHistory: true,
      deepCopy: true,
      ...options,
    };

    // Check if target already has context
    const targetContext = this.contextStore.get(targetTaskId);

    if (!targetContext) {
      // No existing context, just create a new one
      const newContext: Context = {
        ...this.deepCopyContext(sourceContext),
        id: `context-${targetTaskId}-${Date.now()}`,
        taskId: targetTaskId,
        timestamp: Date.now(),
      };

      this.contextStore.set(targetTaskId, newContext);
    } else {
      // Merge according to strategy
      if (opts.mergeStrategy === "replace") {
        const newContext = {
          ...this.deepCopyContext(sourceContext),
          id: targetContext.id,
          taskId: targetTaskId,
        };

        if (opts.preserveHistory) {
          newContext.metadata = {
            ...newContext.metadata,
            previousContexts: [
              ...(newContext.metadata?.previousContexts || []),
              targetContext.id,
            ],
          };
        }

        this.contextStore.set(targetTaskId, newContext);
      } else if (opts.mergeStrategy === "merge") {
        // Merge components by type
        const componentsByType = new Map<string, ContextComponent>();

        // First add target components
        for (const component of targetContext.components) {
          componentsByType.set(component.type, component);
        }

        // Then merge in source components (overwriting by type)
        for (const component of sourceContext.components) {
          const existingComponent = componentsByType.get(component.type);

          if (existingComponent) {
            // Merge the component data
            componentsByType.set(component.type, {
              ...existingComponent,
              content: {
                ...existingComponent.content,
                ...component.content,
              },
              metadata: {
                ...existingComponent.metadata,
                ...component.metadata,
                merged: true,
                mergedAt: Date.now(),
              },
            });
          } else {
            // Add the new component
            componentsByType.set(
              component.type,
              opts.deepCopy ? this.deepCopyComponent(component) : component,
            );
          }
        }

        // Update the context with merged components
        targetContext.components = Array.from(componentsByType.values());
        targetContext.timestamp = Date.now();
        targetContext.metadata = {
          ...targetContext.metadata,
          mergedFromTask: sourceTaskId,
          mergedAt: Date.now(),
        };

        this.contextStore.set(targetTaskId, targetContext);
      } else if (opts.mergeStrategy === "append") {
        // Just add new components while keeping old ones
        const existingTypes = new Set(
          targetContext.components.map((comp) => comp.type),
        );
        const newComponents = sourceContext.components
          .filter((comp) => !existingTypes.has(comp.type))
          .map((comp) => (opts.deepCopy ? this.deepCopyComponent(comp) : comp));

        targetContext.components = [
          ...targetContext.components,
          ...newComponents,
        ];
        targetContext.timestamp = Date.now();
        targetContext.metadata = {
          ...targetContext.metadata,
          appendedFromTask: sourceTaskId,
          appendedAt: Date.now(),
        };

        this.contextStore.set(targetTaskId, targetContext);
      }
    }

    return true;
  }

  /**
   * Validate the context for a task against its requirements
   */
  public async validateTaskContext(taskId: string): Promise<{
    valid: boolean;
    message?: string;
    missingComponents?: string[];
  }> {
    const context = this.contextStore.get(taskId);
    if (!context) {
      return { valid: false, message: "No context found for task" };
    }

    // This is a placeholder for a real validation implementation
    // In a real system this would check against required context types

    // For now we'll assume all contexts are valid
    return { valid: true };
  }

  /**
   * Clear context for a task
   */
  public clearTaskContext(taskId: string): boolean {
    return this.contextStore.delete(taskId);
  }

  /**
   * Get context differences between tasks
   */
  public async getContextDiff(
    taskId1: string,
    taskId2: string,
  ): Promise<{
    added: ContextComponent[];
    removed: ContextComponent[];
    modified: ContextComponent[];
  }> {
    const context1 = this.contextStore.get(taskId1);
    const context2 = this.contextStore.get(taskId2);

    if (!context1 || !context2) {
      return { added: [], removed: [], modified: [] };
    }

    // Get components by type for easy comparison
    const components1ByType = new Map(
      context1.components.map((comp) => [comp.type, comp]),
    );
    const components2ByType = new Map(
      context2.components.map((comp) => [comp.type, comp]),
    );

    const added: ContextComponent[] = [];
    const removed: ContextComponent[] = [];
    const modified: ContextComponent[] = [];

    // Find added components (in context2 but not in context1)
    for (const [type, component] of components2ByType) {
      if (!components1ByType.has(type)) {
        added.push(component);
      }
    }

    // Find removed components (in context1 but not in context2)
    for (const [type, component] of components1ByType) {
      if (!components2ByType.has(type)) {
        removed.push(component);
      }
    }

    // Find modified components (in both but with differences)
    for (const [type, component1] of components1ByType) {
      const component2 = components2ByType.get(type);
      if (
        component2 &&
        JSON.stringify(component1.content) !==
          JSON.stringify(component2.content)
      ) {
        modified.push(component2);
      }
    }

    return { added, removed, modified };
  }

  /**
   * Get context history for a task
   */
  public async getContextHistory(taskId: string): Promise<{
    contexts: Context[];
    transitions: Array<{ from: string; to: string; timestamp: number }>;
  }> {
    // This would normally query a history store
    // For now, we just return the current context
    const context = this.contextStore.get(taskId);

    return {
      contexts: context ? [context] : [],
      transitions: [],
    };
  }

  // Private methods

  /**
   * Create a deep copy of a context object
   */
  private deepCopyContext(context: Context): Context {
    return {
      ...context,
      components: context.components.map((comp) =>
        this.deepCopyComponent(comp),
      ),
      metadata: context.metadata ? { ...context.metadata } : undefined,
    };
  }

  /**
   * Create a deep copy of a context component
   */
  private deepCopyComponent(component: ContextComponent): ContextComponent {
    return {
      ...component,
      content: JSON.parse(JSON.stringify(component.content)),
      metadata: { ...component.metadata },
    };
  }

  /**
   * Capture the current codebase state
   */
  private async captureCodebaseState(): Promise<string> {
    // In a real implementation, this would calculate a hash or identifier
    // for the current codebase state
    return `codebase-state-${Date.now()}`;
  }

  /**
   * Capture environment context
   */
  private async captureEnvironmentContext(): Promise<ContextComponent> {
    // In a real implementation, this would capture environment variables,
    // system settings, etc.
    return {
      id: `env-${Date.now()}`,
      type: "environment",
      content: {
        timestamp: Date.now(),
        environment: process.env.NODE_ENV || "development",
      },
      metadata: {
        capturedAt: Date.now(),
      },
    };
  }

  /**
   * Capture code state context
   */
  private async captureCodeStateContext(): Promise<ContextComponent> {
    // In a real implementation, this would capture open files,
    // unsaved changes, etc.
    return {
      id: `code-${Date.now()}`,
      type: "codeState",
      content: {
        timestamp: Date.now(),
        openFiles: [],
      },
      metadata: {
        capturedAt: Date.now(),
      },
    };
  }

  /**
   * Capture task state context
   */
  private async captureTaskStateContext(task: Task): Promise<ContextComponent> {
    // Capture the current state of the task
    return {
      id: `task-state-${Date.now()}`,
      type: "taskState",
      content: {
        timestamp: Date.now(),
        status: task.status,
        progress:
          task.steps?.filter((step) => step.status === "completed").length /
          (task.steps?.length || 1),
        completedSteps:
          task.steps
            ?.filter((step) => step.status === "completed")
            .map((step) => step.id) || [],
      },
      metadata: {
        capturedAt: Date.now(),
        taskId: task.id,
      },
    };
  }
}
