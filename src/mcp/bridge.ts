import { MCPAdapter, MCPTool } from "./adapter";

/**
 * Interface for agent-compatible tools
 */
export interface AgentTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  execute: (args: any) => Promise<any>;
}

/**
 * Tool registry for agents
 */
export class AgentToolkit {
  private tools: Map<string, AgentTool> = new Map();

  /**
   * Register a tool with the toolkit
   */
  registerTool(tool: AgentTool): void {
    this.tools.set(tool.name, tool);
  }

  /**
   * Get a tool by name
   */
  getTool(name: string): AgentTool | undefined {
    return this.tools.get(name);
  }

  /**
   * Get all registered tools
   */
  getAllTools(): AgentTool[] {
    return Array.from(this.tools.values());
  }
}

/**
 * Bridge between agents and MCP tools
 * This converts MCP tools into agent-compatible tools
 */
export class AgentMCPBridge {
  private mcpAdapter: MCPAdapter;

  constructor() {
    this.mcpAdapter = new MCPAdapter();
  }

  /**
   * Create a toolkit of MCP tools that can be used by agents
   */
  public async createToolkit(): Promise<AgentToolkit> {
    const toolkit = new AgentToolkit();

    try {
      // Check if MCP is available in this VS Code instance
      const mcpAvailable = await this.mcpAdapter.isMCPAvailable();

      if (!mcpAvailable) {
        console.log("MCP not available, continuing without MCP tools");
        return toolkit;
      }

      // Get all available MCP tools
      const mcpTools = await this.mcpAdapter.getAvailableTools();
      console.log(
        `Found ${mcpTools.length} MCP tools to convert to agent tools`,
      );

      // Convert MCP tools into agent-compatible tools
      for (const mcpTool of mcpTools) {
        this.registerMCPToolAsAgentTool(toolkit, mcpTool);
      }
    } catch (error) {
      console.error("Error creating MCP toolkit:", error);
    }

    return toolkit;
  }

  /**
   * Register an MCP tool as an agent tool
   */
  private registerMCPToolAsAgentTool(
    toolkit: AgentToolkit,
    mcpTool: MCPTool,
  ): void {
    // Create an agent-compatible tool from the MCP tool
    const agentTool: AgentTool = {
      name: mcpTool.name,
      description: mcpTool.description || `MCP tool: ${mcpTool.name}`,
      parameters: mcpTool.parameters,
      execute: async (args: any) => {
        try {
          // Execute the MCP tool and return the result
          const result = await this.mcpAdapter.executeTool(
            mcpTool.serverId,
            mcpTool.name,
            args,
          );
          return result;
        } catch (error) {
          console.error(`Error executing MCP tool ${mcpTool.name}:`, error);
          throw error;
        }
      },
    };

    // Register the tool with the toolkit
    toolkit.registerTool(agentTool);
    console.log(`Registered MCP tool ${mcpTool.name} as agent tool`);
  }
}
