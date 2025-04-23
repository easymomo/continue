import * as vscode from "vscode";

/**
 * Interface for MCP tool definitions
 */
export interface MCPTool {
  name: string;
  description: string;
  parameters: Record<string, any>;
  serverId: string;
}

/**
 * Interface for MCP server definitions
 */
export interface MCPServer {
  id: string;
  name: string;
  [key: string]: any;
}

/**
 * Adapter for VS Code's MCP system
 * This discovers and interacts with registered MCP servers
 */
export class MCPAdapter {
  // Track available MCP servers and their tools
  private servers: Map<string, MCPServer> = new Map();

  constructor() {
    // Initialize and register for MCP events
    this.discoverServers();

    // Listen for changes in MCP server registrations
    vscode.workspace.onDidChangeConfiguration((e) => {
      if (e.affectsConfiguration("mcp")) {
        this.discoverServers();
      }
    });
  }

  /**
   * Discover available MCP servers registered in VS Code
   */
  private async discoverServers(): Promise<void> {
    try {
      console.log("Discovering MCP servers...");

      // This is placeholder code - the actual API will need to be determined
      // from VS Code's MCP documentation when it becomes available
      const servers = (await vscode.commands.executeCommand(
        "mcp.listServers",
      )) as MCPServer[] | undefined;

      if (!servers || !Array.isArray(servers)) {
        console.log("No MCP servers found or MCP API not available");
        return;
      }

      this.servers.clear();
      for (const server of servers) {
        this.servers.set(server.id, server);
      }

      console.log(`Discovered ${this.servers.size} MCP servers`);
    } catch (error) {
      console.error("Failed to discover MCP servers:", error);
    }
  }

  /**
   * Get all available MCP tools across all servers
   */
  public async getAvailableTools(): Promise<MCPTool[]> {
    const tools: MCPTool[] = [];

    // Convert Map.entries() to array for iteration
    const serverEntries = Array.from(this.servers.entries());

    for (const [serverId, server] of serverEntries) {
      try {
        console.log(`Getting tools for server ${serverId}...`);

        // This is placeholder code - the actual API will need to be determined
        // from VS Code's MCP documentation when it becomes available
        const serverTools = (await vscode.commands.executeCommand(
          "mcp.listTools",
          serverId,
        )) as any[] | undefined;

        if (!serverTools || !Array.isArray(serverTools)) {
          console.log(`No tools found for server ${serverId}`);
          continue;
        }

        tools.push(
          ...serverTools.map((tool: any) => ({
            ...tool,
            serverId,
          })),
        );

        console.log(`Found ${serverTools.length} tools for server ${serverId}`);
      } catch (error) {
        console.error(`Failed to get tools for server ${serverId}:`, error);
      }
    }

    return tools;
  }

  /**
   * Execute an MCP tool
   */
  public async executeTool(
    serverId: string,
    toolName: string,
    args: any,
  ): Promise<any> {
    try {
      console.log(
        `Executing tool ${toolName} on server ${serverId} with args:`,
        args,
      );

      // This is placeholder code - the actual API will need to be determined
      // from VS Code's MCP documentation when it becomes available
      return await vscode.commands.executeCommand(
        "mcp.executeTool",
        serverId,
        toolName,
        args,
      );
    } catch (error) {
      console.error(
        `Failed to execute tool ${toolName} on server ${serverId}:`,
        error,
      );
      throw error;
    }
  }

  /**
   * Check if MCP is available in this VS Code instance
   */
  public async isMCPAvailable(): Promise<boolean> {
    try {
      // Try to execute a harmless MCP command to see if the API is available
      await vscode.commands.executeCommand("mcp.listServers");
      return true;
    } catch (error) {
      console.log("MCP API not available:", error);
      return false;
    }
  }
}
