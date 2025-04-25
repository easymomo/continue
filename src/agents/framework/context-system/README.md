# Context System for AIgents

The Context System provides semantic search and context management capabilities for the AIgents framework. It is adapted from Continue's context system and integrated with the agent memory framework.

## Features

- **Vector Embeddings**: Generate vector embeddings for text content
- **Semantic Search**: Find semantically similar content
- **Memory Integration**: Connects with agent memory
- **Context Management**: Organize and retrieve related information

## Architecture

The Context System is composed of the following components:

### 1. Embeddings

- `EmbeddingsProvider`: Interface for generating embeddings
- `BasicEmbeddingsProvider`: Simple implementation using basic text processing
- `EmbeddingQueue`: Manages batching and processing of embedding requests

### 2. Vector Storage

- `VectorStore`: Interface for storing and querying vectors
- `MemoryVectorStore`: In-memory implementation of the vector store

### 3. Retrieval System

- `RetrievalSystem`: Interface for content storage and retrieval
- `BasicRetrievalSystem`: Implementation connecting embeddings and vector storage

### 4. Agent Integration

- `AgentMemoryAdapter`: Adapts the context system to work with agent memory

## Usage

### Basic Usage

```typescript
import { createContextSystem } from "./agents/framework/context-system";

// Create the context system for an agent
const contextSystem = await createContextSystem("agent-id");

// Store content for retrieval
await contextSystem.storeContent({
  content: "Text to be indexed for semantic search",
  contentType: "documentation",
  source: "example",
});

// Retrieve similar content
const results = await contextSystem.search("What content is similar to this?");

// Search within specific contexts
const contextResults = await contextSystem.searchContext("Query text", [
  "context-name",
]);
```

### Advanced Usage

```typescript
import {
  createContextSystem,
  BasicEmbeddingsProvider,
  MemoryVectorStore,
} from "./agents/framework/context-system";

// Create custom components
const embeddingsProvider = new BasicEmbeddingsProvider(128);
const vectorStore = new MemoryVectorStore();

// Create the context system with custom components
const contextSystem = await createContextSystem("agent-id", {
  embeddingsProvider,
  vectorStore,
  defaultLimit: 20,
});

// Index existing agent memories for semantic search
await contextSystem.indexAgentMemory("conversation", "message", {
  important: true,
});

// Create and use contexts
await memoryManager.createContext("task-context");

await contextSystem.addContextBlock(
  "task-context",
  "code",
  "function example() { return true; }",
  "example.js",
);

// Search for content within the context
const results = await contextSystem.searchContext(
  "Query text",
  ["task-context"],
  {
    limit: 5,
    minScore: 0.7,
    contentTypes: ["code"],
  },
);
```

## Integration with Agent Memory

The Context System is integrated with the agent memory framework via the `AgentMemoryAdapter`. This adapter allows:

1. Storing content in both the vector store and agent memory
2. Adding context blocks with semantic search capabilities
3. Searching for relevant content across all memories
4. Organizing and retrieving context-specific information

## Extending the System

### Custom Embeddings Provider

You can create a custom embeddings provider by implementing the `EmbeddingsProvider` interface. This allows you to use different embedding models like OpenAI, HuggingFace, or others.

```typescript
class CustomEmbeddingsProvider implements EmbeddingsProvider {
  // Implement required methods
}
```

### Custom Vector Store

You can create a custom vector store by implementing the `VectorStore` interface. This allows you to use different vector databases like Pinecone, Chroma, or others.

```typescript
class CustomVectorStore implements VectorStore {
  // Implement required methods
}
```

## Example

See the `examples/usage-example.ts` file for a complete usage example.

## Similarities with Continue's Context System

This context system is inspired by Continue's implementation, with the following adaptations:

1. Decoupled from VSCode-specific APIs
2. Integrated with the AIgents memory framework
3. Provides a simplified embedding generation system
4. Offers a clean adapter interface for agent integration
