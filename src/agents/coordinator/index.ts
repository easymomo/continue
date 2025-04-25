/**
 * AgentCoordinator
 *
 * This is the Master Agent that coordinates all other agents in the system.
 * It's responsible for distributing tasks, managing communication between
 * agents, and aggregating results.
 */

import { v4 as uuidv4 } from "uuid";

// Define types inline to avoid rootDir issues
enum AgentType {
  COORDINATOR = "coordinator",
  PROJECT_MANAGER = "project_manager",
  SECURITY = "security",
  SEARCH = "search",
  DOCUMENTATION = "documentation",
  DEVELOPER = "developer",
}

interface ContextItem {
  id: string;
  type: string;
  content: string;
  title?: string;
  metadata?: Record<string, any>;
}

interface Message {
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  name?: string;
  toolCallId?: string;
  toolCalls?: ToolCall[];
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

interface Tool {
  function: {
    name: string;
    description: string;
    parameters: {
      type: string;
      properties: Record<string, any>;
      required?: string[];
    };
  };
  display?: {
    icon?: string;
    group?: string;
  };
}

// Define the AgentMessage type inline
interface AgentMessage {
  id: string;
  from: AgentType;
  to: AgentType | "all";
  type: "request" | "response" | "notification";
  content: any;
  replyTo?: string;
  timestamp: number;
}

// Import BaseAgent
import { BaseAgent } from "../base/index.js";

// Define a minimal AgentTool interface to replace the imported one
interface AgentTool {
  name: string;
  description: string;
  parameters: any;
  execute: (args: any) => Promise<any>;
}

// Define a minimal AgentToolkit interface to replace the imported one
interface AgentToolkit {
  getAllTools: () => AgentTool[];
  getTool: (toolName: string) => AgentTool | undefined;
  tools: Map<string, AgentTool>;
  registerTool: (tool: AgentTool) => void;
}

/**
 * Interface for BaseAgent properties and methods required by MasterAgent
 */
export interface IBaseAgent {
  getName(): string;
  getDescription(): string;
  handleMessage(message: string): Promise<string>;
}

/**
 * Master Agent that coordinates all other agents
 */
export class MasterAgent {
  private name: string;
  private description: string;
  private specializedAgents: Map<string, IBaseAgent> = new Map();

  constructor() {
    this.name = "Master Agent";
    this.description =
      "Coordinates specialized agents and routes tasks to the appropriate agent";
  }

  /**
   * Get the agent's name
   */
  getName(): string {
    return this.name;
  }

  /**
   * Get the agent's description
   */
  getDescription(): string {
    return this.description;
  }

  /**
   * Register a specialized agent with the Master Agent
   */
  registerAgent(agent: IBaseAgent): void {
    this.specializedAgents.set(agent.getName(), agent);
    console.log(`Registered agent: ${agent.getName()}`);
  }

  /**
   * Get a registered agent by name
   */
  getAgent(agentName: string): IBaseAgent | undefined {
    return this.specializedAgents.get(agentName);
  }

  /**
   * Get all registered agents
   */
  getAllAgents(): IBaseAgent[] {
    return Array.from(this.specializedAgents.values());
  }

  /**
   * Handle a message and route it to the appropriate agent
   */
  async handleMessage(message: string, targetAgent?: string): Promise<string> {
    console.log(`Master Agent handling message: ${message}`);

    try {
      // If a target agent is specified, route the message directly to that agent
      if (targetAgent && this.specializedAgents.has(targetAgent)) {
        console.log(`Routing message to ${targetAgent} agent`);
        const agent = this.specializedAgents.get(targetAgent)!;
        return await agent.handleMessage(message);
      }

      // Otherwise, determine which agent should handle the message
      // For now, we'll just handle it with the Master Agent
      // Later, we'll implement logic to analyze the message and route it
      console.log("Master Agent processing message directly");

      // Placeholder for actual LLM-based processing
      return `Master Agent processed: "${message}"`;
    } catch (error) {
      console.error("Error handling message:", error);
      return `Error: ${error instanceof Error ? error.message : String(error)}`;
    }
  }
}

export class AgentCoordinator extends BaseAgent {
  private workerAgents: Map<AgentType, BaseAgent>;
  private activeToolCalls: Map<string, { toolCall: ToolCall; context: any }>;

  constructor() {
    // Fix: Call super with all required arguments and bypass strict type checking for now
    super(
      AgentType.COORDINATOR,
      "Coordinator Agent",
      "Coordinates and routes tasks between specialized agents",
      {
        tools: new Map() as any, // Bypass strict type checking
        getAllTools: () => [],
        getTool: () => undefined,
        registerTool: () => {},
      },
    );
    this.workerAgents = new Map();
    this.activeToolCalls = new Map();

    // Initialize worker agents (to be implemented)
    this.initializeWorkerAgents();
  }

  /**
   * Implement the required handleMessage method
   */
  async handleMessage(message: string): Promise<string> {
    console.log(`Coordinator handling message: ${message}`);
    return `Coordinator processed: "${message}"`;
  }

  /**
   * Process a message from another agent
   */
  async processMessage(message: AgentMessage): Promise<AgentMessage | null> {
    // Log received message
    this.logMessage(message);

    // Handle different message types
    if (message.type === "request") {
      // Process request from another agent
      return this.processRequestMessage(message);
    } else if (message.type === "response") {
      // Handle response to previous request
      return this.processResponseMessage(message);
    } else {
      // Handle notification
      return null;
    }
  }

  /**
   * Process messages for the LLM
   *
   * This is the main entry point for the agent system from the adapter.
   * It receives the original messages and tools, routes them through
   * appropriate worker agents, and returns the processed messages.
   */
  async processMessages(
    messages: Message[],
    tools?: Tool[],
    options?: any,
  ): Promise<Message[]> {
    console.log("Coordinator processing messages:", messages.length);

    // For now, just add our system message and return
    // This will be expanded with actual agent coordination

    // Add or replace system message
    const systemMessage: Message = {
      role: "system",
      content: `${this.systemPrompt}\n\nYou have access to a team of specialized agents that can help you with different tasks.`,
    };

    // Check if there's already a system message
    const existingSystemIndex = messages.findIndex((m) => m.role === "system");
    if (existingSystemIndex >= 0) {
      messages[existingSystemIndex] = systemMessage;
    } else {
      messages.unshift(systemMessage);
    }

    return messages;
  }

  /**
   * Fix: Update the executeTool method to match the BaseAgent signature
   */
  async executeTool(toolName: string, args: any): Promise<any> {
    console.log(`Coordinator executing tool: ${toolName}`);

    // Convert to the format expected by the specialized executeTool implementation
    const toolCall: ToolCall = {
      id: uuidv4(),
      function: {
        name: toolName,
        arguments: JSON.stringify(args),
      },
      type: "function",
    };

    return this.executeToolCall(toolCall, args);
  }

  /**
   * Specialized method for executing tool calls
   */
  async executeToolCall(
    toolCall: ToolCall,
    context: any,
  ): Promise<ContextItem[]> {
    console.log("Coordinator executing tool call:", toolCall.function.name);

    // Store the active tool call
    this.activeToolCalls.set(toolCall.id, { toolCall, context });

    // Determine which agent should handle this tool
    const agentType = this.determineToolAgent(toolCall.function.name);
    const agent = this.workerAgents.get(agentType);

    if (!agent) {
      console.warn(`No agent available for tool ${toolCall.function.name}`);
      return [
        {
          id: uuidv4(),
          type: "error",
          content: `No agent available to handle tool: ${toolCall.function.name}`,
        },
      ];
    }

    try {
      // Create a message to the worker agent
      const message: AgentMessage = {
        id: uuidv4(),
        from: this.type,
        to: agentType,
        type: "request",
        content: {
          toolCall,
          context,
        },
        timestamp: Date.now(),
      };

      // For now, directly call the method on the agent
      // In the future, this will be handled by the communication system
      const response = await agent.processMessage(message);

      if (
        response &&
        typeof response.content === "object" &&
        "result" in response.content
      ) {
        return response.content.result as ContextItem[];
      }

      return [
        {
          id: uuidv4(),
          type: "error",
          content: "Agent returned invalid response",
        },
      ];
    } catch (error: any) {
      console.error(`Error executing tool ${toolCall.function.name}:`, error);
      return [
        {
          id: uuidv4(),
          type: "error",
          content: `Error executing tool: ${error.message}`,
        },
      ];
    } finally {
      // Clean up
      this.activeToolCalls.delete(toolCall.id);
    }
  }

  /**
   * Process the results of a tool call
   */
  async processToolResults(
    toolCallId: string,
    toolOutput: ContextItem[],
  ): Promise<ContextItem[]> {
    console.log("Coordinator processing tool results for:", toolCallId);

    // For now, just return the results unchanged
    // In the future, this will allow agents to enhance the results
    return toolOutput;
  }

  /**
   * Register a worker agent
   */
  registerAgent(agent: BaseAgent): void {
    const info = agent.getInfo();
    this.workerAgents.set(info.type, agent);
  }

  /**
   * Initialize worker agents
   */
  private initializeWorkerAgents(): void {
    // To be implemented
    // This will create and register each worker agent type
  }

  /**
   * Process a request message from another agent
   */
  private async processRequestMessage(
    message: AgentMessage,
  ): Promise<AgentMessage | null> {
    // Will be implemented to handle requests from worker agents
    // For now, just send a basic response
    return {
      id: uuidv4(),
      from: this.type,
      to: message.from,
      type: "response",
      content: { status: "acknowledged" },
      replyTo: message.id,
      timestamp: Date.now(),
    };
  }

  /**
   * Process a response message from another agent
   */
  private async processResponseMessage(
    message: AgentMessage,
  ): Promise<AgentMessage | null> {
    // Will be implemented to handle responses from worker agents
    return null;
  }

  /**
   * Determine which agent should handle a specific tool
   */
  private determineToolAgent(toolName: string): AgentType {
    // Logic to map tools to appropriate agents
    // This will be expanded as we implement more agents and tools

    if (toolName.startsWith("search")) {
      return AgentType.SEARCH;
    } else if (toolName.startsWith("security")) {
      return AgentType.SECURITY;
    } else if (toolName.startsWith("documentation")) {
      return AgentType.DOCUMENTATION;
    } else if (toolName.startsWith("project")) {
      return AgentType.PROJECT_MANAGER;
    } else {
      // Default to developer agent
      return AgentType.DEVELOPER;
    }
  }

  /**
   * Get the default system prompt for the coordinator
   */
  protected getDefaultSystemPrompt(): string {
    return `You are the Coordinator Agent, responsible for managing a team of specialized AI agents.
Your role is to oversee the execution of tasks, coordinate between agents, and ensure that user requests are handled efficiently.
You have access to several specialized agents:
- Project Manager Agent: Handles project organization and tracking
- Security Agent: Performs security audits and checks
- Search Agent: Finds relevant information from various sources
- Documentation Agent: Manages and retrieves documentation
- Developer Agents: Implement code and solve technical problems

As the coordinator, you should:
1. Analyze user requests and break them down into subtasks
2. Assign subtasks to appropriate specialized agents
3. Monitor task execution and provide updates
4. Aggregate results from different agents
5. Present final solutions to the user`;
  }
}
