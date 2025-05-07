/**
 * Security Task Manager
 * Manages the lifecycle of security tasks
 */

import { TaskSystemAdapter } from "../../framework/task-system-adapter.js";
import {
  SecurityArtifactType,
  SecurityTaskMetadata,
  SecurityWorkflowStage,
  VALID_STAGE_TRANSITIONS,
} from "./securityWorkflowStages.js";

/**
 * Interface for a security artifact
 */
export interface SecurityArtifact {
  type: SecurityArtifactType;
  content: string;
  severity?: "low" | "medium" | "high" | "critical";
  cvss?: number;
  cve?: string;
  metadata?: Record<string, any>;
  timestamp: Date;
}

/**
 * Type for memory metadata
 */
interface MemoryMetadata {
  taskId?: string;
  status?: string;
  timestamp?: number;
  metadata?: Record<string, any>;
  [key: string]: any;
}

/**
 * Manages security tasks, their lifecycle and transitions between workflow stages
 */
export class SecurityTaskManager {
  private taskSystemAdapter: TaskSystemAdapter;

  constructor(taskSystemAdapter: TaskSystemAdapter) {
    this.taskSystemAdapter = taskSystemAdapter;
  }

  /**
   * Creates a new security task
   * @param title - The title of the security task
   * @param description - The description of the security task
   * @returns The ID of the created task
   */
  async createSecurityTask(
    title: string,
    description: string,
  ): Promise<string> {
    try {
      const initialMetadata: SecurityTaskMetadata = {
        currentStage: SecurityWorkflowStage.ASSESSMENT,
        stageHistory: [
          {
            stage: SecurityWorkflowStage.ASSESSMENT,
            timestamp: new Date(),
            note: "Security task created",
          },
        ],
        securityRequirements: [],
        artifacts: [],
        affectedFiles: [],
        vulnerableComponents: [],
      };

      // Store task in memory context
      await this.taskSystemAdapter.storeDocument(
        title,
        description,
        "security_task",
        {
          status: "created",
          timestamp: Date.now(),
          metadata: initialMetadata,
        },
      );

      // Use title as task ID for simplicity
      const taskId = this.normalizeTaskId(title);

      // Store decision about task creation
      await this.taskSystemAdapter.storeDecision(
        "Security Task Created",
        `Created new security task: ${title}`,
        {
          taskId,
          stage: SecurityWorkflowStage.ASSESSMENT,
          timestamp: Date.now(),
        },
      );

      return taskId;
    } catch (error) {
      console.error("Error creating security task:", error);
      throw error;
    }
  }

  /**
   * Gets a security task by ID
   * @param taskId - The ID of the task to retrieve
   * @returns The task metadata or null if not found
   */
  async getSecurityTask(taskId: string): Promise<SecurityTaskMetadata | null> {
    try {
      const normalizedTaskId = this.normalizeTaskId(taskId);
      const agentMemory = this.taskSystemAdapter.getAgentMemory();

      // Query for task by ID
      const memories = await agentMemory.queryMemories({
        type: "document",
        documentType: "security_task",
        metadataFilter: (metadata: MemoryMetadata) =>
          metadata?.taskId === normalizedTaskId,
      });

      if (memories.length === 0) return null;

      // Sort by timestamp descending to get the latest version
      memories.sort(
        (a, b) => (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0),
      );

      return memories[0].metadata?.metadata as SecurityTaskMetadata;
    } catch (error) {
      console.error("Error retrieving security task:", error);
      return null;
    }
  }

  /**
   * Get the current active security task
   * @returns The current task metadata or null if no active task
   */
  async getCurrentTask(): Promise<SecurityTaskMetadata | null> {
    try {
      const agentMemory = this.taskSystemAdapter.getAgentMemory();

      // Query for active tasks
      const memories = await agentMemory.queryMemories({
        type: "document",
        documentType: "security_task",
        metadataFilter: (metadata: MemoryMetadata) =>
          metadata?.status !== "completed",
      });

      if (memories.length === 0) return null;

      // Sort by timestamp descending to get the latest
      memories.sort(
        (a, b) => (b.metadata?.timestamp || 0) - (a.metadata?.timestamp || 0),
      );

      return memories[0].metadata?.metadata as SecurityTaskMetadata;
    } catch (error) {
      console.error("Error retrieving current security task:", error);
      return null;
    }
  }

  /**
   * Updates a security task
   * @param taskId - The ID of the task to update
   * @param updates - The updates to apply to the task metadata
   * @returns True if the update was successful, false otherwise
   */
  async updateSecurityTask(
    taskId: string,
    updates: Partial<SecurityTaskMetadata>,
  ): Promise<boolean> {
    try {
      const normalizedTaskId = this.normalizeTaskId(taskId);
      const currentTask = await this.getSecurityTask(normalizedTaskId);

      if (!currentTask) return false;

      const updatedMetadata = { ...currentTask, ...updates };

      // Store updated task
      await this.taskSystemAdapter.storeDocument(
        `Security Task: ${normalizedTaskId}`,
        `Updated security task: ${normalizedTaskId}`,
        "security_task",
        {
          taskId: normalizedTaskId,
          status:
            updatedMetadata.currentStage === SecurityWorkflowStage.COMPLETED
              ? "completed"
              : "in_progress",
          timestamp: Date.now(),
          metadata: updatedMetadata,
        },
      );

      return true;
    } catch (error) {
      console.error("Error updating security task:", error);
      return false;
    }
  }

  /**
   * Transitions a security task to a new stage
   * @param taskId - The ID of the task to transition
   * @param newStage - The new stage for the task
   * @param note - Optional note about the transition
   * @returns True if the transition was successful, false otherwise
   */
  async transitionTaskStage(
    taskId: string,
    newStage: SecurityWorkflowStage,
    note: string = "Stage transition",
  ): Promise<boolean> {
    try {
      const normalizedTaskId = this.normalizeTaskId(taskId);
      const currentTask = await this.getSecurityTask(normalizedTaskId);

      if (!currentTask) return false;

      // Validate the transition
      const currentStage = currentTask.currentStage;
      const validTransitions = VALID_STAGE_TRANSITIONS[currentStage] || [];

      if (!validTransitions.includes(newStage)) {
        console.warn(
          `Invalid stage transition from ${currentStage} to ${newStage}`,
        );
        return false;
      }

      // Update the task with the new stage
      const updatedMetadata: SecurityTaskMetadata = {
        ...currentTask,
        currentStage: newStage,
        stageHistory: [
          ...currentTask.stageHistory,
          {
            stage: newStage,
            timestamp: new Date(),
            note,
          },
        ],
      };

      // Store the updated task
      await this.updateSecurityTask(normalizedTaskId, updatedMetadata);

      // Store the decision about stage transition
      await this.taskSystemAdapter.storeDecision(
        "Security Stage Transition",
        `Transitioned from ${currentStage} to ${newStage}: ${note}`,
        {
          taskId: normalizedTaskId,
          previousStage: currentStage,
          newStage: newStage,
          timestamp: Date.now(),
        },
      );

      return true;
    } catch (error) {
      console.error("Error transitioning security task stage:", error);
      return false;
    }
  }

  /**
   * Adds a security requirement to a task
   * @param taskId - The ID of the task
   * @param requirement - The security requirement to add
   * @returns True if the requirement was added successfully, false otherwise
   */
  async addSecurityRequirement(
    taskId: string,
    requirement: string,
  ): Promise<boolean> {
    try {
      const normalizedTaskId = this.normalizeTaskId(taskId);
      const currentTask = await this.getSecurityTask(normalizedTaskId);

      if (!currentTask) return false;

      // Update requirements, avoiding duplicates
      if (!currentTask.securityRequirements.includes(requirement)) {
        const updatedMetadata: SecurityTaskMetadata = {
          ...currentTask,
          securityRequirements: [
            ...currentTask.securityRequirements,
            requirement,
          ],
        };

        return await this.updateSecurityTask(normalizedTaskId, updatedMetadata);
      }

      return true;
    } catch (error) {
      console.error("Error adding security requirement:", error);
      return false;
    }
  }

  /**
   * Adds a security artifact to a task
   * @param taskId - The ID of the task
   * @param artifact - The security artifact to add
   * @returns True if the artifact was added successfully, false otherwise
   */
  async addSecurityArtifact(
    taskId: string,
    artifact: SecurityArtifact,
  ): Promise<boolean> {
    try {
      const normalizedTaskId = this.normalizeTaskId(taskId);
      const currentTask = await this.getSecurityTask(normalizedTaskId);

      if (!currentTask) return false;

      // Update with new artifact
      const updatedMetadata: SecurityTaskMetadata = {
        ...currentTask,
        artifacts: [
          ...currentTask.artifacts,
          {
            type: artifact.type,
            content: artifact.content,
            severity: artifact.severity,
            cvss: artifact.cvss,
            cve: artifact.cve,
            timestamp: artifact.timestamp || new Date(),
          },
        ],
      };

      const result = await this.updateSecurityTask(
        normalizedTaskId,
        updatedMetadata,
      );

      // Also store as a document for easier retrieval
      if (result) {
        await this.taskSystemAdapter.storeDocument(
          `Security ${artifact.type}`,
          artifact.content,
          `security_${artifact.type.toLowerCase()}`,
          {
            taskId: normalizedTaskId,
            type: artifact.type,
            severity: artifact.severity,
            cvss: artifact.cvss,
            cve: artifact.cve,
            ...artifact.metadata,
            timestamp: artifact.timestamp?.getTime() || Date.now(),
          },
        );
      }

      return result;
    } catch (error) {
      console.error("Error adding security artifact:", error);
      return false;
    }
  }

  /**
   * Adds an affected file to a security task
   * @param taskId - The ID of the task
   * @param filePath - The path to the affected file
   * @returns True if the file was added successfully, false otherwise
   */
  async addAffectedFile(taskId: string, filePath: string): Promise<boolean> {
    try {
      const normalizedTaskId = this.normalizeTaskId(taskId);
      const currentTask = await this.getSecurityTask(normalizedTaskId);

      if (!currentTask) return false;

      // Avoid duplicates
      if (currentTask.affectedFiles.includes(filePath)) {
        return true;
      }

      const updatedMetadata: SecurityTaskMetadata = {
        ...currentTask,
        affectedFiles: [...currentTask.affectedFiles, filePath],
      };

      return await this.updateSecurityTask(normalizedTaskId, updatedMetadata);
    } catch (error) {
      console.error("Error adding affected file:", error);
      return false;
    }
  }

  /**
   * Adds a vulnerable component to a security task
   * @param taskId - The ID of the task
   * @param component - The vulnerable component
   * @returns True if the component was added successfully, false otherwise
   */
  async addVulnerableComponent(
    taskId: string,
    component: string,
  ): Promise<boolean> {
    try {
      const normalizedTaskId = this.normalizeTaskId(taskId);
      const currentTask = await this.getSecurityTask(normalizedTaskId);

      if (!currentTask) return false;

      // Avoid duplicates
      if (currentTask.vulnerableComponents.includes(component)) {
        return true;
      }

      const updatedMetadata: SecurityTaskMetadata = {
        ...currentTask,
        vulnerableComponents: [...currentTask.vulnerableComponents, component],
      };

      return await this.updateSecurityTask(normalizedTaskId, updatedMetadata);
    } catch (error) {
      console.error("Error adding vulnerable component:", error);
      return false;
    }
  }

  /**
   * Completes a security task
   * @param taskId - The ID of the task to complete
   * @param summary - Optional summary of the completed task
   * @returns True if the task was completed successfully, false otherwise
   */
  async completeSecurityTask(
    taskId: string,
    summary: string = "",
  ): Promise<boolean> {
    return await this.transitionTaskStage(
      taskId,
      SecurityWorkflowStage.COMPLETED,
      summary ? `Task completed: ${summary}` : "Security assessment completed",
    );
  }

  /**
   * Normalize task ID to ensure consistent format
   * @param taskId - The task ID to normalize
   * @returns Normalized task ID
   */
  private normalizeTaskId(taskId: string): string {
    return taskId.toLowerCase().replace(/\s+/g, "_");
  }
}
