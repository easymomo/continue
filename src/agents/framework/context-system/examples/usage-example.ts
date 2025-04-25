/**
 * Context System Usage Example
 *
 * Demonstrates how to use the context system in the agent framework.
 */

import { v4 as uuidv4 } from "uuid";
import { getMemoryManager } from "../../memory-manager.js";
import { AgentMemoryAdapter } from "../adapters/agent-memory-adapter.js";
import { BasicEmbeddingsProvider } from "../embeddings/basic-embeddings-provider.js";
import { BasicRetrievalSystem } from "../retrieval/basic-retrieval-system.js";
import { ContentItem } from "../retrieval/types.js";
import { MemoryVectorStore } from "../vector-store/memory-vector-store.js";

/**
 * Example of using the context system
 */
async function runContextSystemExample() {
  console.log("Running Context System Example");

  // Create a unique agent ID for this example
  const agentId = `example-agent-${uuidv4()}`;

  // Get the memory manager for this agent
  const memoryManager = getMemoryManager(agentId);

  // Initialize components individually
  console.log("Initializing components...");

  // 1. Create an embeddings provider
  const embeddingsProvider = new BasicEmbeddingsProvider(100);
  await embeddingsProvider.initialize();

  // 2. Create a vector store
  const vectorStore = new MemoryVectorStore();
  await vectorStore.initialize();

  // 3. Create a retrieval system
  const retrievalSystem = new BasicRetrievalSystem(
    embeddingsProvider,
    vectorStore,
  );
  await retrievalSystem.initialize();

  // 4. Create the adapter to connect with agent memory
  const memoryAdapter = new AgentMemoryAdapter(agentId, memoryManager, {
    embeddingsProvider,
    vectorStore,
  });
  await memoryAdapter.initialize();

  console.log("All components initialized!");

  // Example content to store
  const documentationItems: ContentItem[] = [
    {
      content:
        "TypeScript is a strongly typed programming language that builds on JavaScript.",
      contentType: "documentation",
      source: "typescript-docs",
    },
    {
      content:
        "React is a JavaScript library for building user interfaces, particularly single-page applications.",
      contentType: "documentation",
      source: "react-docs",
    },
    {
      content:
        "Node.js is a JavaScript runtime built on Chrome's V8 JavaScript engine.",
      contentType: "documentation",
      source: "nodejs-docs",
    },
  ];

  // Store documentation in vector store and agent memory
  console.log("Storing documentation...");
  const docIds = await Promise.all(
    documentationItems.map((item) => memoryAdapter.storeContent(item)),
  );
  console.log(`Stored ${docIds.length} documentation items`);

  // Create a context for a task
  console.log("Creating task context...");
  await memoryManager.createContext("code-review-task", {
    taskType: "code-review",
    createdAt: new Date().toISOString(),
  });

  // Add context blocks with semantic search capability
  console.log("Adding context blocks...");
  await memoryAdapter.addContextBlock(
    "code-review-task",
    "code",
    "function calculateSum(a: number, b: number): number { return a + b; }",
    "example.ts",
    { lineNumbers: "1-3" },
  );

  await memoryAdapter.addContextBlock(
    "code-review-task",
    "comment",
    "We need to ensure proper type checking for all function parameters",
    "user",
    { priority: "high" },
  );

  // Perform semantic search across all content
  console.log("\nPerforming semantic search...");
  const searchResults = await memoryAdapter.search(
    "JavaScript programming language",
  );

  console.log(`Found ${searchResults.length} results:`);
  for (const result of searchResults) {
    console.log(
      `- [${result.score.toFixed(2)}] ${result.content} (${result.source})`,
    );
  }

  // Search specifically in the task context
  console.log("\nSearching in task context...");
  const contextResults = await memoryAdapter.searchContext(
    "type checking function parameters",
    ["code-review-task"],
  );

  console.log(`Found ${contextResults.length} context matches:`);
  for (const result of contextResults) {
    console.log(
      `- [${result.score.toFixed(2)}] ${result.content} (${result.contentType})`,
    );
  }

  console.log("\nExample completed!");
}

// Only run if this file is executed directly
if (require.main === module) {
  runContextSystemExample().catch((error) => {
    console.error("Error in example:", error);
  });
}

// Export the example function
export { runContextSystemExample };
