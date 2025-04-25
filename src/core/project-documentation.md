# AIgents Framework Documentation

## Project Purpose

AIgents is a multi-agent framework built to address the primary limitation of AI IDEs like Cursor and Windsurf: the limited context window that causes LLMs to "forget" ongoing tasks after several interactions. This project is forking a VSCode extension called Continue and enhancing it with a multi-agent architecture.

## Core Problem

The biggest flaw of AI IDEs and tools like Cursor and Windsurf is their memory and continuity limitations when running tasks with LLMs. After a few messages, LLMs "forget" what they were doing due to limited context windows, requiring users to reprompt them to resume tasks.

## Key Requirements

1. **Persistent Memory**

   - The system should NEVER FORGET where we are, what we are doing, why, and how
   - At all times, the codebase (Master Agent), plan, current task, current state, and desired state must be in context
   - Context window is systematically rebuilt when necessary with all relevant information

2. **Task-Based Architecture**

   - NO WORK CAN BE DONE OUTSIDE OF A TASK
   - All activities must be tracked within tasks until marked complete
   - Task stack management: newer tasks can be stacked on top of current ones
   - When a stacked task is completed, it's archived and removed from the stack
   - Previous task is then resumed

3. **Multi-Agent System**

   - Replace single agent with a sophisticated multi-agent system
   - Dropdown option in the UI to select multi-agent mode
   - Specialized agents with distinct responsibilities

4. **Structured Approach**

   - Plan-driven development (nothing done without a plan)
   - For new projects: architecture design followed by detailed planning
   - For existing projects: code analysis, architecture improvement, detailed planning
   - Production-ready, secure, and testable code

5. **Dependency Management**

   - Check for latest versions of libraries in the tech stack
   - Download documentation in vector DB with timestamps
   - Create migration plans for outdated dependencies
   - Option to use current versions with appropriate documentation if updates aren't feasible

6. **Storage System**
   - Text files for configuration and system memory
   - Vector DB for search results and documentation
   - Possible SQLite for other data if needed

## Message Processing Flow

Every user message is analyzed for:

1. **Simple Actions**

   - Requests that don't affect the plan (e.g., creating a file)
   - Create a task to execute it
   - Call MCP tool if necessary

2. **Plan-Affecting Actions**
   - Requests about the plan or that affect it
   - Send for analysis
   - Gather context, data, and current task (or create new task)
   - Complete the work

## Core Framework Components

### 1. Agent Registry

- Manages agent registration and discovery
- Maintains indexes for capabilities and task types
- Allows finding agents by capabilities or task types

### 2. Task Manager

- Handles task creation, assignment, and execution
- Maintains task queue prioritized by importance
- Tracks task status and manages task lifecycle
- Provides persistent storage for tasks

### 3. Memory System

- Provides storage and retrieval of agent state and knowledge
- Stores memory items with type, content, and metadata
- Supports querying by type or metadata
- Persists memory to disk as JSON files

### 4. Message Bus

- Facilitates communication between agents
- Supports direct messages and broadcast messages
- Maintains message history
- Provides message filtering by type, sender, recipient

## Development Guidelines

1. All code must be:

   - Production ready
   - Secure
   - Testable
   - Well-documented

2. Follow a task-based workflow where:

   - Every change is associated with a specific task
   - Tasks are tracked from creation to completion
   - Context is maintained throughout task execution

3. Memory management must ensure:
   - No context loss between interactions
   - Efficient rebuilding of context when needed
   - Persistent storage of important information
