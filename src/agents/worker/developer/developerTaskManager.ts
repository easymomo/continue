/**
 * Developer Task Manager
 * Manages the lifecycle of development tasks
 */

import { TaskSystemAdapter } from "../../framework/task-system-adapter.js";
import {
  DeveloperArtifactType,
  DeveloperWorkflowStage,
} from "./developerWorkflowStages.js";

/**
 * Interface for development task metadata
 */
export interface DeveloperTaskMetadata {
  currentStage: DeveloperWorkflowStage;
  artifacts: DeveloperArtifact[];
  codeFiles: string[];
  testFiles: string[];
  requirements: string[];
  dependencies: string[];
  stageHistory: {
    stage: DeveloperWorkflowStage;
    timestamp: Date;
    note: string;
  }[];
}

/**
 * Interface for a development artifact
 */
export interface DeveloperArtifact {
  type: DeveloperArtifactType;
  content: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Manages development tasks, their lifecycle and transitions between workflow stages
 */
export class DeveloperTaskManager {
  private taskSystemAdapter: TaskSystemAdapter;

  constructor(taskSystemAdapter: TaskSystemAdapter) {
    this.taskSystemAdapter = taskSystemAdapter;
  }

  /**
   * Creates a new development task
   * @param title - The title of the development task
   * @param description - The description of the development task
   * @returns The ID of the created task
   */
  async createDevelopmentTask(
    title: string,
    description: string,
  ): Promise<string> {
    const initialMetadata: DeveloperTaskMetadata = {
      currentStage: DeveloperWorkflowStage.PLANNING,
      stageHistory: [
        {
          stage: DeveloperWorkflowStage.PLANNING,
          timestamp: new Date(),
          note: "Task created",
        },
      ],
      requirements: [],
      artifacts: [],
      codeFiles: [],
      testFiles: [],
    };

    const taskId = await this.taskSystemAdapter.createTask({
      title,
      description,
      type: "DEVELOPMENT",
      status: "IN_PROGRESS",
      metadata: initialMetadata,
    });

    return taskId;
  }

  /**
   * Gets a development task by ID
   * @param taskId - The ID of the task to retrieve
   * @returns The task metadata or null if not found
   */
  async getDevelopmentTask(
    taskId: string,
  ): Promise<DeveloperTaskMetadata | null> {
    const task = await this.taskSystemAdapter.getTask(taskId);
    if (!task) return null;
    return task.metadata as DeveloperTaskMetadata;
  }

  /**
   * Updates the progress of a development task
   * @param taskId - The ID of the task to update
   * @param updates - The updates to apply to the task metadata
   * @returns True if the update was successful, false otherwise
   */
  async updateDevelopmentTask(
    taskId: string,
    updates: Partial<DeveloperTaskMetadata>,
  ): Promise<boolean> {
    const task = await this.taskSystemAdapter.getTask(taskId);
    if (!task) return false;

    const currentMetadata = task.metadata as DeveloperTaskMetadata;
    const updatedMetadata = { ...currentMetadata, ...updates };

    return await this.taskSystemAdapter.updateTask(taskId, {
      metadata: updatedMetadata,
    });
  }

  /**
   * Transitions a development task to a new stage
   * @param taskId - The ID of the task to transition
   * @param newStage - The new stage for the task
   * @param note - Optional note about the transition
   * @returns True if the transition was successful, false otherwise
   */
  async transitionTaskStage(
    taskId: string,
    newStage: DeveloperWorkflowStage,
    note: string = "Stage transition",
  ): Promise<boolean> {
    const task = await this.taskSystemAdapter.getTask(taskId);
    if (!task) return false;

    const currentMetadata = task.metadata as DeveloperTaskMetadata;

    const updatedMetadata: DeveloperTaskMetadata = {
      ...currentMetadata,
      currentStage: newStage,
      stageHistory: [
        ...currentMetadata.stageHistory,
        {
          stage: newStage,
          timestamp: new Date(),
          note,
        },
      ],
    };

    return await this.taskSystemAdapter.updateTask(taskId, {
      metadata: updatedMetadata,
      status:
        newStage === DeveloperWorkflowStage.COMPLETED
          ? "COMPLETED"
          : "IN_PROGRESS",
    });
  }

  /**
   * Adds a requirement to a development task
   * @param taskId - The ID of the task
   * @param requirement - The requirement to add
   * @returns True if the requirement was added successfully, false otherwise
   */
  async addRequirement(taskId: string, requirement: string): Promise<boolean> {
    const task = await this.taskSystemAdapter.getTask(taskId);
    if (!task) return false;

    const currentMetadata = task.metadata as DeveloperTaskMetadata;
    const updatedMetadata: DeveloperTaskMetadata = {
      ...currentMetadata,
      requirements: [...currentMetadata.requirements, requirement],
    };

    return await this.taskSystemAdapter.updateTask(taskId, {
      metadata: updatedMetadata,
    });
  }

  /**
   * Adds an artifact to a development task
   * @param taskId - The ID of the task
   * @param artifactType - The type of artifact
   * @param content - The content of the artifact
   * @returns True if the artifact was added successfully, false otherwise
   */
  async addArtifact(
    taskId: string,
    artifactType: DeveloperArtifactType,
    content: string,
  ): Promise<boolean> {
    const task = await this.taskSystemAdapter.getTask(taskId);
    if (!task) return false;

    const currentMetadata = task.metadata as DeveloperTaskMetadata;
    const updatedMetadata: DeveloperTaskMetadata = {
      ...currentMetadata,
      artifacts: [
        ...currentMetadata.artifacts,
        {
          type: artifactType,
          content,
          timestamp: new Date(),
        },
      ],
    };

    return await this.taskSystemAdapter.updateTask(taskId, {
      metadata: updatedMetadata,
    });
  }

  /**
   * Adds a code file to a development task
   * @param taskId - The ID of the task
   * @param filePath - The path to the code file
   * @returns True if the code file was added successfully, false otherwise
   */
  async addCodeFile(taskId: string, filePath: string): Promise<boolean> {
    const task = await this.taskSystemAdapter.getTask(taskId);
    if (!task) return false;

    const currentMetadata = task.metadata as DeveloperTaskMetadata;
    if (currentMetadata.codeFiles.includes(filePath)) {
      return true; // File already tracked
    }

    const updatedMetadata: DeveloperTaskMetadata = {
      ...currentMetadata,
      codeFiles: [...currentMetadata.codeFiles, filePath],
    };

    return await this.taskSystemAdapter.updateTask(taskId, {
      metadata: updatedMetadata,
    });
  }

  /**
   * Adds a test file to a development task
   * @param taskId - The ID of the task
   * @param filePath - The path to the test file
   * @returns True if the test file was added successfully, false otherwise
   */
  async addTestFile(taskId: string, filePath: string): Promise<boolean> {
    const task = await this.taskSystemAdapter.getTask(taskId);
    if (!task) return false;

    const currentMetadata = task.metadata as DeveloperTaskMetadata;
    if (currentMetadata.testFiles.includes(filePath)) {
      return true; // File already tracked
    }

    const updatedMetadata: DeveloperTaskMetadata = {
      ...currentMetadata,
      testFiles: [...currentMetadata.testFiles, filePath],
    };

    return await this.taskSystemAdapter.updateTask(taskId, {
      metadata: updatedMetadata,
    });
  }

  /**
   * Completes a development task
   * @param taskId - The ID of the task to complete
   * @param summary - Optional summary of the completed task
   * @returns True if the task was completed successfully, false otherwise
   */
  async completeDevelopmentTask(
    taskId: string,
    summary: string = "",
  ): Promise<boolean> {
    return await this.transitionTaskStage(
      taskId,
      DeveloperWorkflowStage.COMPLETED,
      summary ? `Task completed: ${summary}` : "Task completed",
    );
  }
}
