/**
 * Enhanced Workflow Graph Implementation
 *
 * This class provides a robust implementation of a graph for agent workflow,
 * supporting both static and dynamic edge weights based on context-aware rules.
 */

import { AgentType } from "../../core/types.js";
import {
  AgentDecisionRules,
  DecisionRuleFunction,
} from "./agentDecisionRules.js";
import { WorkflowContext } from "./workflowContext.js";

// Define a simple logger interface if the actual one isn't available
interface ILogger {
  debug(message: string): void;
  warn(message: string): void;
  error(message: string): void;
  info(message: string): void;
}

/**
 * Result of determining the next agent
 */
export interface NextAgentResult {
  nextAgentType: AgentType;
  confidence: number;
  reason: string; // Explanation for this routing decision
}

/**
 * Edge in the workflow graph connecting agent nodes
 */
export interface WorkflowGraphEdge {
  from: AgentType;
  to: AgentType;
  weight: number;
  rules?: Record<string, DecisionRuleFunction>;
  metadata?: Record<string, any>; // Optional metadata for backward compatibility
}

/**
 * Node in the workflow graph representing an agent
 */
interface WorkflowGraphNode {
  type: AgentType;
  outgoingEdges: Map<AgentType, WorkflowGraphEdge>;
  metadata?: Record<string, any>; // Optional metadata for backward compatibility
}

/**
 * Enhanced workflow graph with rule-based dynamic edge weights
 */
export class WorkflowGraph {
  private nodes: Map<AgentType, WorkflowGraphNode> = new Map();
  private visitedPaths: Map<string, number> = new Map(); // Track path frequency
  private defaultWeight: number = 0.5;
  private logger?: ILogger;

  /**
   * Create a new workflow graph
   * @param logger Optional logger for debugging
   */
  constructor(logger?: ILogger) {
    this.logger = logger;
  }

  /**
   * Add a node to the graph if it doesn't already exist
   * @param agentType The type of agent node to add
   * @param metadata Optional metadata to associate with the node
   */
  public addNode(agentType: AgentType, metadata?: Record<string, any>): void {
    if (!this.nodes.has(agentType)) {
      this.nodes.set(agentType, {
        type: agentType,
        outgoingEdges: new Map(),
        metadata,
      });
      this.logger?.debug(`[WorkflowGraph] Added node: ${agentType}`);
    } else if (metadata) {
      // Update existing node metadata
      const node = this.nodes.get(agentType)!;
      node.metadata = { ...(node.metadata || {}), ...metadata };
    }
  }

  /**
   * Add an edge between two agent nodes with a static weight
   * @param from Source agent type
   * @param to Target agent type
   * @param weight Edge weight (higher = more likely transition)
   * @param rules Optional decision rules to dynamically adjust weight
   * @param metadata Optional metadata to associate with the edge
   */
  public addEdge(
    from: AgentType,
    to: AgentType,
    weight: number,
    rules?: Record<string, DecisionRuleFunction>,
    metadata?: Record<string, any>,
  ): void {
    // Ensure both nodes exist
    this.addNode(from);
    this.addNode(to);

    // Create the edge
    const edge: WorkflowGraphEdge = { from, to, weight, rules, metadata };
    this.nodes.get(from)!.outgoingEdges.set(to, edge);

    this.logger?.debug(
      `[WorkflowGraph] Added edge: ${from} -> ${to} (weight: ${weight})`,
    );
  }

  /**
   * Get all possible next agent types from the current agent
   * @param currentAgentType The current agent type
   * @returns Array of possible next agent types
   */
  public getNextAgentTypes(currentAgentType: AgentType): AgentType[] {
    const node = this.nodes.get(currentAgentType);
    if (!node) {
      this.logger?.warn(
        `[WorkflowGraph] No node found for agent type: ${currentAgentType}`,
      );
      return [];
    }

    return [...node.outgoingEdges.keys()];
  }

  /**
   * Get the static edge weight between two agent types
   * @param from Source agent type
   * @param to Target agent type
   * @returns The edge weight or defaultWeight if edge doesn't exist
   */
  public getEdgeWeight(from: AgentType, to: AgentType): number {
    const fromNode = this.nodes.get(from);
    if (!fromNode) return this.defaultWeight;

    const edge = fromNode.outgoingEdges.get(to);
    return edge ? edge.weight : this.defaultWeight;
  }

  /**
   * Determine the next agent based on context
   * @param context Current workflow context
   * @returns Best next agent and confidence score
   */
  public async determineNextAgent(
    context: WorkflowContext,
  ): Promise<NextAgentResult> {
    const currentAgentType = context.currentAgentType;
    const taskContent = context.taskContent;

    const currentNode = this.nodes.get(currentAgentType);
    if (!currentNode) {
      this.logger?.warn(
        `[WorkflowGraph] No node found for agent type: ${currentAgentType}`,
      );
      return {
        nextAgentType: AgentType.COORDINATOR,
        confidence: 1.0,
        reason: "Default to coordinator: no node found for current agent type",
      };
    }

    // Get all possible transitions
    const possibleTransitions = [...currentNode.outgoingEdges.entries()];

    // Initialize variables to track best next agent
    let bestNextAgentType: AgentType = currentAgentType;
    let highestConfidence: number = 0;
    let appliedRule: string | undefined;

    // Evaluate each possible transition
    for (const [toAgent, edge] of possibleTransitions) {
      let baseWeight = edge.weight;
      let dynamicWeight = baseWeight;
      let ruleApplied: string | undefined;

      // Apply edge-specific rules if defined
      if (edge.rules && Object.keys(edge.rules).length > 0) {
        const result = await AgentDecisionRules.applyRules(
          edge.rules,
          context,
          taskContent,
        );
        dynamicWeight = baseWeight * (0.3 + result.confidence * 0.7);
        ruleApplied = result.ruleApplied;
      }
      // Otherwise, apply default rules for the agent type
      else {
        let result;

        switch (toAgent) {
          case AgentType.DEVELOPER:
            result = await AgentDecisionRules.applyRules(
              AgentDecisionRules.developerRules,
              context,
              taskContent,
            );
            break;
          case AgentType.RESEARCH:
            result = await AgentDecisionRules.applyRules(
              AgentDecisionRules.researchRules,
              context,
              taskContent,
            );
            break;
          case AgentType.SECURITY:
            result = await AgentDecisionRules.applyRules(
              AgentDecisionRules.securityRules,
              context,
              taskContent,
            );
            break;
          case AgentType.COORDINATOR:
            result = await AgentDecisionRules.applyRules(
              AgentDecisionRules.coordinatorRules,
              context,
              taskContent,
            );
            break;
          default:
            result = { confidence: 0, ruleApplied: "none" };
        }

        dynamicWeight = baseWeight * (0.3 + result.confidence * 0.7);
        ruleApplied = result.ruleApplied;
      }

      this.logger?.debug(
        `[WorkflowGraph] Transition ${currentAgentType} -> ${toAgent}: ` +
          `baseWeight=${baseWeight}, dynamicWeight=${dynamicWeight}, rule=${ruleApplied}`,
      );

      // Update best agent if this transition has higher confidence
      if (dynamicWeight > highestConfidence) {
        highestConfidence = dynamicWeight;
        bestNextAgentType = toAgent;
        appliedRule = ruleApplied;
      }
    }

    // If no good transition was found, stay with current agent
    if (highestConfidence < 0.3 && currentAgentType !== AgentType.COORDINATOR) {
      this.logger?.debug(
        `[WorkflowGraph] No confident transition found, defaulting to COORDINATOR`,
      );
      return {
        nextAgentType: AgentType.COORDINATOR,
        confidence: 1.0,
        reason: "No confident transition found, defaulting to coordinator",
      };
    }

    // If confidence is low but we need to transition, use modest confidence value
    const reportedConfidence =
      highestConfidence < 0.3 ? 0.5 : highestConfidence;

    this.logger?.debug(
      `[WorkflowGraph] Selected transition: ${currentAgentType} -> ${bestNextAgentType} ` +
        `(confidence: ${reportedConfidence}, rule: ${appliedRule || "none"})`,
    );

    return {
      nextAgentType: bestNextAgentType,
      confidence: reportedConfidence,
      reason: `Selected based on rule: ${appliedRule || "none"}`,
    };
  }

  /**
   * Create a default workflow graph with predefined transitions
   * @param logger Optional logger for debugging
   * @returns A new workflow graph with default transitions
   */
  public static createDefault(logger?: ILogger): WorkflowGraph {
    const graph = new WorkflowGraph(logger);

    // Add all agent types as nodes
    graph.addNode(AgentType.COORDINATOR);
    graph.addNode(AgentType.DEVELOPER);
    graph.addNode(AgentType.RESEARCH);
    graph.addNode(AgentType.SECURITY);

    // Coordinator transitions
    graph.addEdge(AgentType.COORDINATOR, AgentType.DEVELOPER, 0.7);
    graph.addEdge(AgentType.COORDINATOR, AgentType.RESEARCH, 0.7);
    graph.addEdge(AgentType.COORDINATOR, AgentType.SECURITY, 0.6);
    graph.addEdge(AgentType.COORDINATOR, AgentType.COORDINATOR, 0.8);

    // Developer transitions
    graph.addEdge(AgentType.DEVELOPER, AgentType.COORDINATOR, 0.8);
    graph.addEdge(AgentType.DEVELOPER, AgentType.RESEARCH, 0.6);
    graph.addEdge(AgentType.DEVELOPER, AgentType.SECURITY, 0.6);
    graph.addEdge(AgentType.DEVELOPER, AgentType.DEVELOPER, 0.7);

    // Research transitions
    graph.addEdge(AgentType.RESEARCH, AgentType.COORDINATOR, 0.8);
    graph.addEdge(AgentType.RESEARCH, AgentType.DEVELOPER, 0.7);
    graph.addEdge(AgentType.RESEARCH, AgentType.RESEARCH, 0.6);
    graph.addEdge(AgentType.RESEARCH, AgentType.SECURITY, 0.4);

    // Security transitions
    graph.addEdge(AgentType.SECURITY, AgentType.COORDINATOR, 0.8);
    graph.addEdge(AgentType.SECURITY, AgentType.DEVELOPER, 0.7);
    graph.addEdge(AgentType.SECURITY, AgentType.RESEARCH, 0.5);
    graph.addEdge(AgentType.SECURITY, AgentType.SECURITY, 0.5);

    return graph;
  }

  /**
   * Check if the graph contains a cycle
   * @returns True if the graph contains a cycle, false otherwise
   */
  public hasCycle(): boolean {
    const visited = new Set<AgentType>();
    const recStack = new Set<AgentType>();

    // Helper function to check for cycles using DFS
    const checkCycle = (node: AgentType): boolean => {
      if (!visited.has(node)) {
        visited.add(node);
        recStack.add(node);

        const outgoingEdges = this.getNextAgentTypes(node);
        for (const edge of outgoingEdges) {
          if (!visited.has(edge) && checkCycle(edge)) {
            return true;
          } else if (recStack.has(edge)) {
            return true;
          }
        }
      }

      recStack.delete(node);
      return false;
    };

    // Check from each node
    for (const node of this.nodes.keys()) {
      if (checkCycle(node)) {
        return true;
      }
    }

    return false;
  }

  /**
   * Visualize the graph in DOT format for Graphviz rendering
   */
  public visualize(): string {
    let dot = "digraph WorkflowGraph {\n";
    dot += "  rankdir=LR;\n";
    dot += "  node [shape=box, style=filled, fillcolor=lightblue];\n\n";

    // Add all nodes
    for (const [agentType, _] of this.nodes) {
      dot += `  "${agentType}";\n`;
    }

    dot += "\n";

    // Add all edges with weights
    for (const [fromType, node] of this.nodes) {
      for (const [toType, edge] of node.outgoingEdges) {
        // Adjust pen width based on weight (thickness represents likelihood)
        const penWidth = 1 + 2 * edge.weight;
        dot += `  "${fromType}" -> "${toType}" [label="${edge.weight.toFixed(2)}", penwidth=${penWidth}];\n`;
      }
    }

    dot += "}\n";
    return dot;
  }
}
