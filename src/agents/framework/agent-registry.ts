/**
 * Agent Registry
 *
 * Manages registration and discovery of agents in the AIgents framework.
 */

import { EventEmitter } from "events";
import { AgentRegistration } from "./types.js";

class AgentRegistry extends EventEmitter {
  // Map of agent ID to registration information
  private agents: Map<string, AgentRegistration> = new Map();

  // Index of capabilities to agent IDs
  private capabilityIndex: Map<string, Set<string>> = new Map();

  // Index of task types to agent IDs
  private taskTypeIndex: Map<string, Set<string>> = new Map();

  /**
   * Register an agent with the registry
   *
   * @param registration Agent registration information
   * @returns True if registration was successful, false if agent ID already exists
   */
  public registerAgent(registration: AgentRegistration): boolean {
    // Check if agent is already registered
    if (this.agents.has(registration.id)) {
      return false;
    }

    // Register the agent
    this.agents.set(registration.id, registration);

    // Index the agent's capabilities
    Object.keys(registration.capabilities).forEach((capabilityName) => {
      // Add to capability index
      if (!this.capabilityIndex.has(capabilityName)) {
        this.capabilityIndex.set(capabilityName, new Set());
      }
      this.capabilityIndex.get(capabilityName)?.add(registration.id);
    });

    // Add to task type index
    for (const taskType of registration.supportedTaskTypes) {
      if (!this.taskTypeIndex.has(taskType)) {
        this.taskTypeIndex.set(taskType, new Set());
      }
      this.taskTypeIndex.get(taskType)?.add(registration.id);
    }

    // Emit registration event
    this.emit("agent:registered", {
      id: registration.id,
      capabilities: Object.keys(registration.capabilities),
    });

    return true;
  }

  /**
   * Deregister an agent from the registry
   *
   * @param agentId ID of the agent to deregister
   * @returns True if deregistration was successful, false if agent wasn't registered
   */
  public deregisterAgent(agentId: string): boolean {
    // Check if agent is registered
    if (!this.agents.has(agentId)) {
      return false;
    }

    // Get agent registration
    const registration = this.agents.get(agentId);

    // Remove from indexes
    if (registration) {
      // Remove from capability index
      Object.keys(registration.capabilities).forEach((capabilityName) => {
        this.capabilityIndex.get(capabilityName)?.delete(agentId);
        if (this.capabilityIndex.get(capabilityName)?.size === 0) {
          this.capabilityIndex.delete(capabilityName);
        }
      });

      // Remove from task type index
      for (const taskType of registration.supportedTaskTypes) {
        this.taskTypeIndex.get(taskType)?.delete(agentId);
        if (this.taskTypeIndex.get(taskType)?.size === 0) {
          this.taskTypeIndex.delete(taskType);
        }
      }
    }

    // Remove agent registration
    this.agents.delete(agentId);

    // Emit deregistration event
    this.emit("agent:deregistered", { id: agentId });

    return true;
  }

  /**
   * Get all registered agents
   *
   * @returns Array of agent registrations
   */
  public getAllAgents(): AgentRegistration[] {
    return Array.from(this.agents.values());
  }

  /**
   * Get a specific agent by ID
   *
   * @param agentId Agent ID
   * @returns Agent registration or undefined if not found
   */
  public getAgent(agentId: string): AgentRegistration | undefined {
    return this.agents.get(agentId);
  }

  /**
   * Find agents that have a specific capability
   *
   * @param capabilityName Name of the capability
   * @returns Array of agent registrations with the capability
   */
  public findAgentsByCapability(capabilityName: string): AgentRegistration[] {
    const agentIds = this.capabilityIndex.get(capabilityName);

    if (!agentIds) {
      return [];
    }

    return Array.from(agentIds)
      .map((id) => this.agents.get(id))
      .filter((reg): reg is AgentRegistration => reg !== undefined);
  }

  /**
   * Find agents that can handle a specific task type
   *
   * @param taskType Type of task
   * @returns Array of agent registrations that can handle the task
   */
  public findAgentsForTaskType(taskType: string): AgentRegistration[] {
    const agentIds = this.taskTypeIndex.get(taskType);

    if (!agentIds) {
      return [];
    }

    return Array.from(agentIds)
      .map((id) => this.agents.get(id))
      .filter((reg): reg is AgentRegistration => reg !== undefined);
  }

  /**
   * Check if a specific capability is available in the system
   *
   * @param capabilityName Name of the capability
   * @returns True if capability is available
   */
  public hasCapability(capabilityName: string): boolean {
    return this.capabilityIndex.has(capabilityName);
  }

  /**
   * Check if a specific task type can be handled by any agent
   *
   * @param taskType Type of task
   * @returns True if task type can be handled
   */
  public canHandleTaskType(taskType: string): boolean {
    return this.taskTypeIndex.has(taskType);
  }

  /**
   * Get all available capabilities in the system
   *
   * @returns Array of capability names
   */
  public getAllCapabilities(): string[] {
    return Array.from(this.capabilityIndex.keys());
  }

  /**
   * Get all task types that can be handled by the system
   *
   * @returns Array of unique task types
   */
  public getAllTaskTypes(): string[] {
    return Array.from(this.taskTypeIndex.keys());
  }
}

// Export singleton instance
export const agentRegistry = new AgentRegistry();

// Also export the class for testing/mocking
export { AgentRegistry };
