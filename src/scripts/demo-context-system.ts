/**
 * Demo Context System
 *
 * This script demonstrates the use of the context system in a standalone way.
 * It shows how to use the context system to store and retrieve information.
 */

import { createContextSystem } from "../agents/framework/context-system/index.js";
import { runContextSystemExample } from "./context-system-example.js";

/**
 * Run demo of the context system
 */
async function runDemo() {
  console.log("==========================================");
  console.log("   Context System Integration Demo");
  console.log("==========================================\n");

  // First, run the example from the examples directory
  console.log("Running the basic usage example:");
  console.log("------------------------------------------");
  await runContextSystemExample();

  // Now demonstrate some additional features
  console.log("\n\nRunning custom demo with advanced features:");
  console.log("------------------------------------------");

  // Create context system for a specific agent
  const contextSystem = await createContextSystem("demo-agent");

  // Store some developer knowledge
  const knowledge = [
    {
      content:
        "When writing TypeScript, always explicitly type function parameters and return values.",
      contentType: "best-practice",
      source: "typescript-guidelines",
      metadata: { category: "typescript", importance: "high" },
    },
    {
      content:
        "React components should be pure. They should return the same output given the same props and state.",
      contentType: "best-practice",
      source: "react-guidelines",
      metadata: { category: "react", importance: "medium" },
    },
    {
      content:
        "Use Promise.all() to handle multiple promises concurrently for better performance.",
      contentType: "best-practice",
      source: "javascript-guidelines",
      metadata: { category: "javascript", importance: "medium" },
    },
    {
      content:
        "Always use semantic HTML elements (like <nav>, <article>, <section>) instead of generic <div> elements.",
      contentType: "best-practice",
      source: "html-guidelines",
      metadata: { category: "html", importance: "medium" },
    },
  ];

  console.log(`Storing ${knowledge.length} developer knowledge items...`);
  await Promise.all(knowledge.map((item) => contextSystem.storeContent(item)));

  // Demonstrate filtering by metadata
  console.log("\nSearching for TypeScript best practices:");
  const typescriptResults = await contextSystem.search("typescript", {
    filter: {
      category: "typescript",
    },
  });

  console.log(`Found ${typescriptResults.length} TypeScript-related results:`);
  for (const result of typescriptResults) {
    console.log(`- [${result.score.toFixed(2)}] ${result.content}`);
  }

  // Demonstrate semantic search capabilities
  console.log("\nSearching for performance optimization advice:");
  const performanceResults = await contextSystem.search(
    "how to make code faster",
  );

  console.log(
    `Found ${performanceResults.length} performance-related results:`,
  );
  for (const result of performanceResults) {
    console.log(`- [${result.score.toFixed(2)}] ${result.content}`);
  }

  console.log("\nSearching for web development best practices:");
  const webResults = await contextSystem.search("web development");

  console.log(`Found ${webResults.length} web development results:`);
  for (const result of webResults) {
    console.log(`- [${result.score.toFixed(2)}] ${result.content}`);
  }

  console.log("\n==========================================");
  console.log("   Demo completed!");
  console.log("==========================================");
}

// Run the demo
runDemo().catch((error) => {
  console.error("Error in demo:", error);
  process.exit(1);
});
