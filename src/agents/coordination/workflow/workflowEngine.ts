/**
 * WorkflowEngine - Executes agent workflows using the graph-based coordination system
 *
 * This engine is responsible for managing state transitions between agents and tracking
 * workflow execution history. It uses the WorkflowGraph to determine routing decisions
 * and prevents infinite loops through cycle detection.
 */

import { AgentType } from "../../core/types.js";
import { WorkflowContext } from "./workflowContext.js";
import { NextAgentResult, WorkflowGraph } from "./workflowGraph.js";

/**
 * Workflow execution event for logging and monitoring
 */
export interface WorkflowEvent {
  timestamp: number;
  eventType: "transition" | "start" | "complete" | "error" | "cycle-detected";
  fromAgent?: AgentType;
  toAgent?: AgentType;
  reason?: string;
  metadata?: Record<string, any>;
}

/**
 * Track a workflow execution state
 */
export interface WorkflowExecution {
  id: string;
  startTime: number;
  currentAgentType: AgentType;
  agentHistory: AgentType[];
  events: WorkflowEvent[];
  context: Record<string, any>;
  isCompleted: boolean;
}

/**
 * WorkflowEngine to manage agent workflow execution
 */
export class WorkflowEngine {
  private graph: WorkflowGraph;
  private executions: Map<string, WorkflowExecution> = new Map();
  private maxHistoryLength: number = 10; // Prevent infinite loops

  /**
   * Initialize the workflow engine with a graph
   */
  constructor(graph: WorkflowGraph) {
    this.graph = graph;
  }

  /**
   * Start a new workflow execution
   */
  public startExecution(
    executionId: string,
    startingAgentType: AgentType,
    initialContext: Record<string, any> = {},
  ): WorkflowExecution {
    const execution: WorkflowExecution = {
      id: executionId,
      startTime: Date.now(),
      currentAgentType: startingAgentType,
      agentHistory: [startingAgentType],
      events: [
        {
          timestamp: Date.now(),
          eventType: "start",
          toAgent: startingAgentType,
          metadata: { initialContext },
        },
      ],
      context: { ...initialContext },
      isCompleted: false,
    };

    this.executions.set(executionId, execution);
    return execution;
  }

  /**
   * Get an existing workflow execution
   */
  public getExecution(executionId: string): WorkflowExecution | undefined {
    return this.executions.get(executionId);
  }

  /**
   * Check if an agent transition would create a cycle/loop
   */
  private wouldCreateCycle(
    execution: WorkflowExecution,
    nextAgentType: AgentType,
  ): boolean {
    // Simple cycle detection - if we've visited this agent type twice recently
    const recentHistory = execution.agentHistory.slice(-this.maxHistoryLength);
    const visitCount = recentHistory.filter(
      (type) => type === nextAgentType,
    ).length;

    // If we've visited this agent 3+ times in recent history, likely a cycle
    return visitCount >= 2;
  }

  /**
   * Transition to the next agent in the workflow
   */
  public async transition(
    executionId: string,
    taskContent: string,
    additionalData: Record<string, any> = {},
  ): Promise<NextAgentResult> {
    const execution = this.executions.get(executionId);

    if (!execution) {
      throw new Error(`No workflow execution found with ID: ${executionId}`);
    }

    if (execution.isCompleted) {
      throw new Error(`Workflow execution ${executionId} is already completed`);
    }

    // Build the context for the graph to determine next agent
    const context = new WorkflowContext(
      executionId,
      execution.currentAgentType,
    );
    context.previousAgentTypes = execution.agentHistory.slice(0, -1); // All except current
    context.taskContent = taskContent;
    context.additionalData = {
      ...execution.context,
      ...additionalData,
    };

    // Determine the next agent from the graph
    const nextAgent = await this.graph.determineNextAgent(context);

    // Check if this would create a cycle/loop
    if (this.wouldCreateCycle(execution, nextAgent.nextAgentType)) {
      // Log the cycle detection
      execution.events.push({
        timestamp: Date.now(),
        eventType: "cycle-detected",
        fromAgent: execution.currentAgentType,
        toAgent: nextAgent.nextAgentType,
        reason:
          "Potential workflow cycle detected, forcing coordinator intervention",
      });

      // Force transition to coordinator if not already there
      if (nextAgent.nextAgentType !== AgentType.COORDINATOR) {
        nextAgent.nextAgentType = AgentType.COORDINATOR;
        nextAgent.reason =
          "Coordinator intervention due to potential workflow cycle";
        nextAgent.confidence = 1.0;
      }
    }

    // Record the transition
    execution.events.push({
      timestamp: Date.now(),
      eventType: "transition",
      fromAgent: execution.currentAgentType,
      toAgent: nextAgent.nextAgentType,
      reason: nextAgent.reason,
      metadata: {
        confidence: nextAgent.confidence,
        taskSnapshot:
          taskContent.substring(0, 100) +
          (taskContent.length > 100 ? "..." : ""),
      },
    });

    // Update the execution state
    execution.currentAgentType = nextAgent.nextAgentType;
    execution.agentHistory.push(nextAgent.nextAgentType);
    execution.context = {
      ...execution.context,
      ...additionalData,
    };

    // Save the updated execution
    this.executions.set(executionId, execution);

    return nextAgent;
  }

  /**
   * Mark a workflow execution as completed
   */
  public completeExecution(
    executionId: string,
    finalContext: Record<string, any> = {},
  ): void {
    const execution = this.executions.get(executionId);

    if (!execution) {
      throw new Error(`No workflow execution found with ID: ${executionId}`);
    }

    execution.isCompleted = true;
    execution.context = {
      ...execution.context,
      ...finalContext,
    };

    execution.events.push({
      timestamp: Date.now(),
      eventType: "complete",
      fromAgent: execution.currentAgentType,
      metadata: { finalContext },
    });

    this.executions.set(executionId, execution);
  }

  /**
   * Record an error in a workflow execution
   */
  public recordError(
    executionId: string,
    error: Error,
    metadata: Record<string, any> = {},
  ): void {
    const execution = this.executions.get(executionId);

    if (!execution) {
      throw new Error(`No workflow execution found with ID: ${executionId}`);
    }

    execution.events.push({
      timestamp: Date.now(),
      eventType: "error",
      fromAgent: execution.currentAgentType,
      reason: error.message,
      metadata: {
        error: error.toString(),
        stack: error.stack,
        ...metadata,
      },
    });

    this.executions.set(executionId, execution);
  }

  /**
   * Get the execution history for a workflow
   */
  public getExecutionHistory(executionId: string): WorkflowEvent[] {
    const execution = this.executions.get(executionId);

    if (!execution) {
      throw new Error(`No workflow execution found with ID: ${executionId}`);
    }

    return [...execution.events];
  }

  /**
   * Visualize the current state of the workflow execution
   */
  public visualizeExecution(executionId: string): string {
    const execution = this.executions.get(executionId);

    if (!execution) {
      throw new Error(`No workflow execution found with ID: ${executionId}`);
    }

    // Get the base graph visualization
    let dot = this.graph.visualize();

    // Remove the closing bracket to add our execution path
    dot = dot.substring(0, dot.length - 2);

    // Add a subgraph for the execution path
    dot += "\n  subgraph cluster_execution {\n";
    dot += '    label="Execution Path";\n';
    dot += "    style=filled;\n";
    dot += "    color=lightgrey;\n";

    // Add the execution path edges with special styling
    for (let i = 0; i < execution.agentHistory.length - 1; i++) {
      const fromAgent = execution.agentHistory[i];
      const toAgent = execution.agentHistory[i + 1];

      dot += `    "${fromAgent}" -> "${toAgent}" [color=red, penwidth=3.0];\n`;
    }

    // Close the subgraph and main graph
    dot += "  }\n}\n";

    return dot;
  }
}
