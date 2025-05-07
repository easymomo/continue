/**
 * CoordinatorIntegration - Integrates the workflow system with the CoordinatorAgent
 *
 * This class provides integration between the graph-based workflow engine and
 * the existing CoordinatorAgent, allowing workflow-based routing to be used
 * for agent coordination.
 */

import { AIMessage, BaseMessage } from "@langchain/core/messages";
import { Command } from "@langchain/langgraph";
import { v4 as uuidv4 } from "uuid";
import { AgentType } from "../../core/types.js";
import { WorkflowContext, WorkflowEngine, WorkflowGraph } from "./index.js";

/**
 * Options for initializing the coordinator integration
 */
export interface CoordinatorIntegrationOptions {
  /** Enable debug logging */
  debug?: boolean;

  /** Maximum history length to consider for cycle detection */
  maxHistoryLength?: number;

  /** Default weights for agent transitions */
  defaultWeights?: Record<string, number>;
}

/**
 * CoordinatorIntegration class for connecting workflow system to CoordinatorAgent
 */
export class CoordinatorIntegration {
  private readonly graph: WorkflowGraph;
  private readonly engine: WorkflowEngine;
  private readonly contexts: Map<string, WorkflowContext> = new Map();
  private readonly debug: boolean;

  /**
   * Create a new coordinator integration with default agent workflow
   */
  constructor(options: CoordinatorIntegrationOptions = {}) {
    this.debug = options.debug || false;

    // Create the workflow graph
    this.graph = this.createDefaultGraph(options.defaultWeights || {});

    // Create the workflow engine
    this.engine = new WorkflowEngine(this.graph);
  }

  /**
   * Create a default workflow graph for agent coordination
   */
  private createDefaultGraph(
    weights: Record<string, number> = {},
  ): WorkflowGraph {
    const graph = new WorkflowGraph();

    // Define default weights
    const defaultWeights = {
      // Coordinator to specialized agents
      [`${AgentType.COORDINATOR}-${AgentType.DEVELOPER}`]: 1.0,
      [`${AgentType.COORDINATOR}-${AgentType.RESEARCH}`]: 0.8,
      [`${AgentType.COORDINATOR}-${AgentType.SECURITY}`]: 0.6,

      // Developer to other agents
      [`${AgentType.DEVELOPER}-${AgentType.COORDINATOR}`]: 0.7,
      [`${AgentType.DEVELOPER}-${AgentType.SECURITY}`]: 0.5,

      // Research to other agents
      [`${AgentType.RESEARCH}-${AgentType.COORDINATOR}`]: 0.7,
      [`${AgentType.RESEARCH}-${AgentType.DEVELOPER}`]: 0.6,

      // Security to other agents
      [`${AgentType.SECURITY}-${AgentType.COORDINATOR}`]: 0.7,
      [`${AgentType.SECURITY}-${AgentType.DEVELOPER}`]: 0.5,

      // Override with provided weights
      ...weights,
    };

    // Add all agent types as nodes
    graph.addNode(AgentType.COORDINATOR, { isCoordinator: true });
    graph.addNode(AgentType.DEVELOPER, { specialty: "coding" });
    graph.addNode(AgentType.RESEARCH, { specialty: "information" });
    graph.addNode(AgentType.SECURITY, { specialty: "security" });

    // Add edges between agents
    // Coordinator to specialized agents
    graph.addEdge(
      AgentType.COORDINATOR,
      AgentType.DEVELOPER,
      defaultWeights[`${AgentType.COORDINATOR}-${AgentType.DEVELOPER}`],
      undefined,
      { reason: "Task involves development or coding" },
    );

    graph.addEdge(
      AgentType.COORDINATOR,
      AgentType.RESEARCH,
      defaultWeights[`${AgentType.COORDINATOR}-${AgentType.RESEARCH}`],
      undefined,
      { reason: "Task involves research or information gathering" },
    );

    graph.addEdge(
      AgentType.COORDINATOR,
      AgentType.SECURITY,
      defaultWeights[`${AgentType.COORDINATOR}-${AgentType.SECURITY}`],
      undefined,
      { reason: "Task involves security concerns" },
    );

    // Developer to other agents
    graph.addEdge(
      AgentType.DEVELOPER,
      AgentType.COORDINATOR,
      defaultWeights[`${AgentType.DEVELOPER}-${AgentType.COORDINATOR}`],
      undefined,
      { reason: "Development task complete or needs coordination" },
    );

    graph.addEdge(
      AgentType.DEVELOPER,
      AgentType.SECURITY,
      defaultWeights[`${AgentType.DEVELOPER}-${AgentType.SECURITY}`],
      undefined,
      { reason: "Development task requires security review" },
    );

    // Research to other agents
    graph.addEdge(
      AgentType.RESEARCH,
      AgentType.COORDINATOR,
      defaultWeights[`${AgentType.RESEARCH}-${AgentType.COORDINATOR}`],
      undefined,
      { reason: "Research task complete or needs coordination" },
    );

    graph.addEdge(
      AgentType.RESEARCH,
      AgentType.DEVELOPER,
      defaultWeights[`${AgentType.RESEARCH}-${AgentType.DEVELOPER}`],
      undefined,
      { reason: "Research results need implementation" },
    );

    // Security to other agents
    graph.addEdge(
      AgentType.SECURITY,
      AgentType.COORDINATOR,
      defaultWeights[`${AgentType.SECURITY}-${AgentType.COORDINATOR}`],
      undefined,
      { reason: "Security review complete or needs coordination" },
    );

    graph.addEdge(
      AgentType.SECURITY,
      AgentType.DEVELOPER,
      defaultWeights[`${AgentType.SECURITY}-${AgentType.DEVELOPER}`],
      undefined,
      { reason: "Security issues need to be addressed by developer" },
    );

    return graph;
  }

  /**
   * Initialize a new workflow context for a conversation
   */
  public initializeContext(
    messageId: string,
    startingAgentType: AgentType = AgentType.COORDINATOR,
    initialMessages: BaseMessage[] = [],
  ): WorkflowContext {
    // Create a new context
    const context = new WorkflowContext(messageId);

    // Add initial conversation turn if messages are provided
    if (initialMessages.length > 0) {
      context.addConversationTurn(startingAgentType, initialMessages);
    }

    // Store the context
    this.contexts.set(messageId, context);

    // Start the workflow execution
    this.engine.startExecution(messageId, startingAgentType);

    return context;
  }

  /**
   * Get a workflow context for a message ID
   */
  public getContext(messageId: string): WorkflowContext | undefined {
    return this.contexts.get(messageId);
  }

  /**
   * Determine the next agent based on the workflow graph
   */
  public async determineNextAgent(
    messageId: string,
    currentAgentType: AgentType,
    messages: BaseMessage[],
  ): Promise<AgentType> {
    // Get or create a context
    let context = this.contexts.get(messageId);
    if (!context) {
      context = this.initializeContext(messageId, currentAgentType, messages);
    } else {
      // Add the current conversation turn
      context.addConversationTurn(currentAgentType, messages);
    }

    // Extract text content from the last message
    const lastMessage = messages[messages.length - 1];
    const content =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    // Determine the next agent
    const nextAgent = await this.engine.transition(messageId, content, {
      currentAgent: currentAgentType,
      messageId,
    });

    if (this.debug) {
      console.log(
        `[CoordinatorIntegration] Agent transition: ${currentAgentType} -> ${nextAgent.nextAgentType} (confidence: ${nextAgent.confidence.toFixed(2)})`,
      );
      console.log(`[CoordinatorIntegration] Reason: ${nextAgent.reason}`);
    }

    return nextAgent.nextAgentType;
  }

  /**
   * Process the agent result and determine routing based on the workflow
   */
  public async processAgentResult(
    agentType: AgentType,
    state: { messages: BaseMessage[] },
    messageId: string = uuidv4(),
  ): Promise<Command | { messages: BaseMessage[] }> {
    // Get the last message content
    const lastMessage = state.messages[state.messages.length - 1];

    // Determine the next agent based on workflow
    const nextAgentType = await this.determineNextAgent(
      messageId,
      agentType,
      state.messages,
    );

    // If the next agent is different from current, transition
    if (nextAgentType !== agentType) {
      if (this.debug) {
        console.log(
          `[CoordinatorIntegration] Transitioning from ${agentType} to ${nextAgentType}`,
        );
      }

      // Get the workflow context
      const context = this.contexts.get(messageId);

      // Create a transition reason message if we have context
      let messages = [...state.messages];
      if (context) {
        const transitionReason = `[Workflow Engine] Transitioning from ${agentType} to ${nextAgentType}`;
        messages.push(new AIMessage({ content: transitionReason }));
      }

      // Return LangGraph command to transition to the next agent
      return new Command({
        goto: nextAgentType,
        update: {
          messages: messages,
        },
      });
    }

    // Otherwise, continue with the current agent
    return { messages: state.messages };
  }

  /**
   * Get the workflow graph for visualization
   */
  public getGraph(): WorkflowGraph {
    return this.graph;
  }

  /**
   * Get the workflow engine for direct access
   */
  public getEngine(): WorkflowEngine {
    return this.engine;
  }

  /**
   * Clear the context for a message ID
   */
  public clearContext(messageId: string): void {
    this.contexts.delete(messageId);
  }

  /**
   * Visualize the workflow graph for a specific execution
   */
  public visualizeExecution(messageId: string): string {
    try {
      return this.engine.visualizeExecution(messageId);
    } catch (error) {
      return this.graph.visualize();
    }
  }
}
