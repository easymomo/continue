# AI Dev Agents - Source Code

This directory contains the source code for the AI Dev Agents system, a multi-agent system for AI-assisted software development.

## Getting Started

### Installation

```bash
# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test
```

## Project Structure

The project is organized as follows:

- `agents/` - AI agent implementations
- `models/` - Data models and schemas
- `utils/` - Utility functions
- `types/` - TypeScript type definitions
- `config/` - Configuration files
- `communication/` - Inter-agent communication systems
- `memory/` - Memory management for agents
- `test/` - Test setup and configuration

## Testing

We use [Vitest](https://vitest.dev/) as our testing framework. Tests can be run with:

```bash
# Run tests once
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage
npm run test:coverage
```

### Test File Naming Convention

- Test files should be named `*.test.ts` or `*.spec.ts`
- Test files should be placed adjacent to the implementation files they test

## Dependency Management

We use [LangChain.js](https://js.langchain.com/) for building LLM-powered applications. See [VERSIONS.md](./VERSIONS.md) for a list of all dependencies and their versions.

### Updating Dependencies

To check for outdated dependencies:

```bash
npm outdated
```

To update all dependencies to their latest versions:

```bash
npm update
```

For major version updates, review the library's migration guides before updating.

## Best Practices

- Use TypeScript types for all functions and variables
- Follow ESLint guidelines for code style
- Write comprehensive tests for all new functionality
- Keep dependencies up to date for security and new features

## Node.js Requirements

This project requires Node.js version 18.0.0 or higher.
