/**
 * DocumentationTool - Fetches API documentation for libraries and frameworks
 *
 * This tool allows the research agent to retrieve documentation
 * for various libraries, frameworks, and APIs to assist with technical tasks.
 */

import { AgentType } from "../../agents/core/types.js";
import { NetworkTool } from "../core/baseTool.js";
import { ToolCategory } from "../core/types.js";

/**
 * Interface for documentation sections
 */
interface DocumentationSection {
  title: string;
  content: string;
  examples?: string[];
}

/**
 * Interface for documentation result
 */
interface DocumentationResult {
  library: string;
  version: string;
  timestamp: string;
  mainDescription: string;
  sections: DocumentationSection[];
  url?: string;
}

/**
 * Tool for fetching API documentation
 */
export class DocumentationTool extends NetworkTool {
  name = "fetch_documentation";
  description =
    "Fetch documentation for a library, framework, or API. Provide the name of the library and optionally a specific method or feature.";

  // Map of supported libraries for documentation
  private supportedLibraries = new Set([
    "react",
    "typescript",
    "node",
    "express",
    "langchain",
    "javascript",
    "python",
    "vscode",
  ]);

  constructor() {
    super();

    // Register this tool for the research agent
    this.registerNetworkTool(
      [AgentType.RESEARCH, AgentType.DEVELOPER],
      ToolCategory.DOCUMENTATION,
      {
        example: "fetch_documentation react hooks",
        returnFormat: "JSON object with documentation sections and examples",
      },
    );
  }

  /**
   * Execute the documentation fetch
   * @param input Library name and optional feature
   * @returns Documentation as JSON string
   */
  protected async execute(input: string): Promise<string> {
    try {
      // Parse input to get library name and optional feature
      const parts = input.trim().toLowerCase().split(" ");
      const library = parts[0];
      const feature = parts.length > 1 ? parts.slice(1).join(" ") : undefined;

      // Check if the library is supported
      if (!this.supportedLibraries.has(library)) {
        return JSON.stringify({
          error: `Documentation for ${library} is not available.`,
          supportedLibraries: Array.from(this.supportedLibraries),
          message: "Please specify one of the supported libraries.",
        });
      }

      // Generate mock documentation
      const documentation = await this.mockDocumentation(library, feature);
      return JSON.stringify(documentation, null, 2);
    } catch (error) {
      throw new Error(
        `Failed to fetch documentation: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  /**
   * Generate mock documentation
   * This is a placeholder for actual API integration
   * @param library Library name
   * @param feature Optional feature name
   * @returns Mock documentation
   */
  private async mockDocumentation(
    library: string,
    feature?: string,
  ): Promise<DocumentationResult> {
    // Simulate network delay
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Create base documentation object
    const result: DocumentationResult = {
      library,
      version: "latest",
      timestamp: new Date().toISOString(),
      mainDescription: "",
      sections: [],
    };

    // Fill with library-specific content
    switch (library) {
      case "react":
        result.mainDescription =
          "React is a JavaScript library for building user interfaces. It is maintained by Facebook and a community of individual developers and companies.";
        result.version = "18.2.0";
        result.url = "https://react.dev/docs";

        if (feature === "hooks") {
          result.sections.push({
            title: "Introduction to Hooks",
            content:
              'Hooks are functions that let you "hook into" React state and lifecycle features from function components.',
            examples: [
              "import React, { useState } from 'react';\n\nfunction Example() {\n  const [count, setCount] = useState(0);\n  return (\n    <div>\n      <p>You clicked {count} times</p>\n      <button onClick={() => setCount(count + 1)}>Click me</button>\n    </div>\n  );\n}",
            ],
          });

          result.sections.push({
            title: "Rules of Hooks",
            content:
              "Hooks are JavaScript functions, but they impose two additional rules: Only call Hooks at the top level, and only call Hooks from React functions.",
          });
        } else {
          result.sections.push({
            title: "Getting Started",
            content:
              "To create a new React app, you can use Create React App, which sets up your development environment with a modern build setup with no configuration.",
            examples: ["npx create-react-app my-app\ncd my-app\nnpm start"],
          });

          result.sections.push({
            title: "Components and Props",
            content:
              "Components let you split the UI into independent, reusable pieces, and think about each piece in isolation.",
            examples: [
              "function Welcome(props) {\n  return <h1>Hello, {props.name}</h1>;\n}",
            ],
          });
        }
        break;

      case "typescript":
        result.mainDescription =
          "TypeScript is a strongly typed programming language that builds on JavaScript, giving you better tooling at any scale.";
        result.version = "5.0.4";
        result.url = "https://www.typescriptlang.org/docs";

        result.sections.push({
          title: "Basic Types",
          content:
            "TypeScript supports several basic types including boolean, number, string, array, tuple, enum, any, void, null, undefined, never, and object.",
          examples: [
            'let isDone: boolean = false;\nlet decimal: number = 6;\nlet color: string = "blue";\nlet list: number[] = [1, 2, 3];\nlet x: [string, number] = ["hello", 10];',
          ],
        });

        result.sections.push({
          title: "Interfaces",
          content:
            "Interfaces are a powerful way of defining contracts within your code as well as contracts with code outside of your project.",
          examples: [
            'interface LabeledValue {\n  label: string;\n}\n\nfunction printLabel(labeledObj: LabeledValue) {\n  console.log(labeledObj.label);\n}\n\nlet myObj = {size: 10, label: "Size 10 Object"};\nprintLabel(myObj);',
          ],
        });
        break;

      // Add other libraries as needed
      default:
        result.mainDescription = `Documentation for ${library} is available but not detailed in this mock implementation.`;
        result.sections.push({
          title: "General Information",
          content: `This is a placeholder for ${library} documentation. In a real implementation, this would contain actual documentation content.`,
        });
    }

    return result;
  }
}
