# AIgents Framework - Specialized Agents

## Overview

The AIgents framework features various specialized agents that handle specific aspects of the development process. Each agent has distinct responsibilities and capabilities, working together to create a comprehensive multi-agent system.

## Implemented Agents

### Dependency Agent

**File:** `src/agents/dependency-agent.ts`

The Dependency Agent monitors project dependencies and provides updates and security information. It is responsible for checking outdated dependencies, auditing for security vulnerabilities, and updating dependencies when needed.

#### Key Features:

- **Dependency monitoring**: Checks for outdated dependencies using npm
- **Security auditing**: Performs security vulnerability checks using npm audit
- **Dependency updates**: Updates specified dependencies to newer versions
- **Report generation**: Creates detailed reports on dependencies and security issues

#### Capabilities:

- `dependencyCheck`: Ability to check for outdated dependencies
- `securityAudit`: Ability to check for security vulnerabilities
- `dependencyUpdate`: Ability to update dependencies

#### Supported Task Types:

- `dependency-check`: Check for outdated dependencies
- `security-audit`: Perform a security audit
- `dependency-update`: Update specified dependencies
- `generate-dependency-report`: Generate comprehensive reports

#### Key Methods:

- `handleDependencyCheck()`: Checks for outdated dependencies and generates a report
- `handleSecurityAudit()`: Performs a security audit and generates a report
- `handleDependencyUpdate()`: Updates specified dependencies
- `handleGenerateReport()`: Generates comprehensive dependency and security reports

#### Example Usage:

See `src/agents/examples/dependency-example.ts` for a complete example of using the Dependency Agent.

## Planned Agents

### Master Agent

- Central coordinator that maintains the overall project concept and vision
- Orchestrates communication between specialized worker agents
- Makes high-level decisions about task allocation and project direction

### Project Manager Agent

- Handles project breakdown and planning
- Creates and maintains project and product files
- Tracks project progress
- Provides status updates on demand

### Security Agent

- Performs live code audits
- Reviews implementation plans for security considerations
- Integrates production-ready security measures
- Implements best practices, OWASP guidelines, and security strategies
- Handles security aspects: middleware, tokens, cookies, encryption

### Search Agent

- Searches the web for solutions and references
- Activates automatically when errors occur
- Accesses and analyzes logs to diagnose issues

### Documentation Agent

- Downloads up-to-date documentation from official sources
- Maintains a knowledge base of technologies used in the project
- Ensures code follows latest best practices and patterns

### Developer Agents (Hierarchical)

- Primary developers receive features from Project Manager
- Break down complex tasks into subtasks
- Create and manage child Developer Agents for subtasks
- Ensure coherence across implementations
- Each agent works with specific inputs and expected outputs
- Can further create sub-agents for more complex tasks

## Agent Communication Model

Agents communicate with each other through the Message Bus, which facilitates both direct and broadcast messages. This allows agents to:

1. Request information or services from other agents
2. Notify other agents of important events
3. Coordinate activities across multiple agents
4. Share context and knowledge between agents

## Agent Registration Process

1. Agents are instantiated with specific capabilities and supported task types
2. Agents register themselves with the Agent Registry
3. The Agent Registry indexes the agent's capabilities and task types
4. Other components can discover agents based on required capabilities or task types

## Task Assignment Flow

1. A task is created through the Task Manager
2. The Task Manager finds agents that can handle the task type
3. The task is assigned to an appropriate agent
4. The agent processes the task and returns a result
5. The Task Manager updates the task status and stores the result
