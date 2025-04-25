# AIgents Framework - Core Components

## Framework Architecture

The AIgents framework is built around several core components that work together to provide a robust multi-agent system with persistent memory and task management capabilities. Below is a detailed description of each component.

## 1. Agent Registry

**File:** `src/agents/framework/agent-registry.ts`

The Agent Registry serves as a central registration system for all agents in the framework. It maintains information about each agent's capabilities and the task types they can handle.

### Key Features:

- **Event-based architecture**: Extends EventEmitter to emit events when agents are registered/deregistered
- **Agent indexing**: Maintains indexes of agents by capabilities and task types for efficient lookup
- **Discovery system**: Provides methods to find agents based on required capabilities or task types

### Key Methods:

- `registerAgent(agent)`: Registers an agent with the framework
- `deregisterAgent(agentId)`: Removes an agent from the framework
- `getAllAgents()`: Returns all registered agents
- `getAgent(agentId)`: Retrieves a specific agent by ID
- `findAgentsByCapability(capability)`: Finds agents with a specific capability
- `findAgentsForTaskType(taskType)`: Finds agents that can handle a specific task type

## 2. Task Manager

**File:** `src/agents/framework/task-manager.ts`

The Task Manager handles the creation, assignment, and execution of tasks within the framework. It ensures that tasks are properly tracked and that their state is persisted.

### Key Features:

- **Task prioritization**: Maintains a priority queue of pending tasks
- **Persistent storage**: Saves tasks to disk for recovery
- **Agent assignment**: Manages assignment of tasks to agents
- **Event-based updates**: Emits events on task status changes

### Key Methods:

- `initialize()`: Sets up the task manager and loads existing tasks
- `createTask(task)`: Creates a new task and adds it to the queue
- `getTask(taskId)`: Retrieves a task by ID
- `updateTask(task)`: Updates an existing task
- `deleteTask(taskId)`: Removes a task
- `assignTask(taskId, agentId)`: Assigns a task to an agent
- `unassignTask(taskId)`: Removes a task assignment
- `completeTask(taskId, result)`: Marks a task as completed
- `failTask(taskId, error)`: Marks a task as failed

## 3. Memory System

**File:** `src/agents/framework/memory-system.ts`

The Memory System provides persistent storage and retrieval of agent state and knowledge. It allows agents to store and retrieve information across sessions.

### Key Features:

- **Type-based organization**: Organizes memory items by type
- **Metadata querying**: Supports querying memory items by metadata
- **Persistent storage**: Saves memory items to disk as JSON files
- **Event-based updates**: Emits events when memory items are stored, updated, or deleted

### Key Methods:

- `initialize()`: Sets up the memory system and loads existing memory items
- `storeMemory(type, content, metadata)`: Stores a new memory item
- `getMemory(id)`: Retrieves a memory item by ID
- `getAllMemories()`: Returns all memory items
- `getMemoriesByType(type)`: Returns memory items of a specific type
- `queryMemories(query)`: Queries memory items by metadata
- `updateMemory(id, updates)`: Updates a memory item
- `deleteMemory(id)`: Removes a memory item

## 4. Message Bus

**File:** `src/agents/framework/message-bus.ts`

The Message Bus facilitates communication between agents in the framework. It allows agents to send messages to each other and supports both direct and broadcast messages.

### Key Features:

- **Direct messaging**: Supports sending messages to specific agents
- **Broadcast messaging**: Allows sending messages to all agents
- **Message history**: Maintains a history of all messages
- **Event-based delivery**: Uses event emitters to deliver messages to agents

### Key Methods:

- `sendMessage(from, to, subject, content, type)`: Sends a message to a specific agent
- `broadcastMessage(from, subject, content, type)`: Sends a message to all agents
- `registerMessageHandler(agentId, handler)`: Registers a function to handle messages for an agent
- `getMessage(messageId)`: Retrieves a message by ID
- `getMessagesSentBy(agentId)`: Returns all messages sent by an agent
- `getMessagesReceivedBy(agentId)`: Returns all messages received by an agent
- `getMessagesByType(type)`: Returns all messages of a specific type
- `clearMessages()`: Clears all stored messages

## 5. Base Agent

**File:** `src/agents/framework/base-agent.ts`

The Base Agent provides a foundation for building specialized agents. It handles common functionality like task management, message handling, and memory access.

### Key Features:

- **Lifecycle management**: Handles initialization and shutdown of agents
- **Task handling**: Provides methods for handling assigned tasks
- **Message processing**: Processes incoming messages and sends outgoing messages
- **Memory access**: Provides access to the memory system
- **Event emission**: Emits events for important agent activities

### Key Methods:

- `initialize()`: Initializes the agent
- `shutdown()`: Shuts down the agent
- `handleTask(task)`: Handles an assigned task
- `cancelTask(taskId)`: Cancels a task
- `handleMessage(message)`: Processes an incoming message
- `sendMessage(to, subject, content, type)`: Sends a message to another agent
- `broadcastMessage(subject, content, type)`: Sends a message to all agents
- `storeMemory(type, content, metadata)`: Stores a memory item

## Component Integration

These components work together to provide a cohesive framework:

1. **Agent Registry** maintains a list of available agents and their capabilities
2. **Task Manager** creates and assigns tasks to appropriate agents
3. **Base Agent** implementations handle these tasks and communicate with other agents
4. **Message Bus** facilitates communication between agents
5. **Memory System** provides persistent storage for agent state and knowledge

Together, these components create a robust foundation for building a multi-agent system that can maintain context and state across interactions, addressing the core problem of context limitations in AI IDEs.
