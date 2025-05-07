import { HumanMessage } from "@langchain/core/messages";
import { AgentFactory } from "../core/agentFactory.js";

/**
 * Example demonstrating how to use the specialized agents
 */
async function runAgentExample() {
  try {
    console.log("Initializing agent system...");

    // Initialize the agent system with all specialized agents
    const agentSystem = await AgentFactory.initializeAgentSystem();

    console.log("Agent system initialized with the following agents:");
    agentSystem.getAllAgents().forEach((agent) => {
      console.log(`- ${agent.name} (${agent.id}): ${agent.description}`);
    });

    // Example queries to test different agent specializations
    const exampleQueries = [
      // Developer agent query
      "I need to implement a function that converts a string to camelCase in JavaScript",

      // Security agent query
      "Can you review this code for security vulnerabilities? function login(username, password) { return db.query('SELECT * FROM users WHERE username = \"' + username + '\" AND password = \"' + password + '\"'); }",

      // Research agent query
      "What are the best practices for implementing authentication in a Node.js application?",
    ];

    // Process each query
    for (const query of exampleQueries) {
      console.log("\n\n=================================================");
      console.log(`Processing query: ${query}`);
      console.log("=================================================");

      // Create a human message from the query
      const message = new HumanMessage(query);

      // Process the message through the agent system
      const result = await agentSystem.processMessage(message);

      console.log("\nResult:");
      console.log(result);
    }
  } catch (error) {
    console.error("Error running agent example:", error);
  }
}

// Run the example
runAgentExample()
  .then(() => console.log("\nAgent example completed."))
  .catch((error) => console.error("Error in agent example:", error));
