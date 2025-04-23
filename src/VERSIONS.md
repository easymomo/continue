# AI Dev Agents - Library Versions and Best Practices

This document tracks the latest versions of all libraries used in the AI Dev Agents project as of April 2025.

## Core Libraries

| Library              | Version | Purpose                              |
| -------------------- | ------- | ------------------------------------ |
| LangChain            | 0.3.23  | Building LLM-powered applications    |
| @langchain/core      | 0.3.45  | Core LangChain abstractions          |
| @langchain/community | 0.3.41  | Community integrations for LangChain |
| UUID                 | 11.1.0  | Generating unique identifiers        |
| Redux                | 5.0.1   | State management                     |
| Redis                | 4.7.0   | In-memory data store                 |

## Development Tools

| Tool                | Version | Purpose                              |
| ------------------- | ------- | ------------------------------------ |
| TypeScript          | 5.8.3   | Type-safe JavaScript                 |
| Vitest              | 3.1.2   | Modern testing framework             |
| @vitest/coverage-v8 | 3.1.2   | Test coverage reporting              |
| @vitest/ui          | 3.1.1   | Visual UI for tests                  |
| Vite                | 6.0.0   | Build tool and dev server            |
| vite-tsconfig-paths | 5.1.4   | TypeScript path resolution           |
| Prettier            | 3.3.3   | Code formatting                      |
| ESLint              | 9.25.1  | Code linting                         |
| concurrently        | 9.1.2   | Run multiple commands simultaneously |

## Type Definitions

| Type Package  | Version  |
| ------------- | -------- |
| @types/node   | 20.11.25 |
| @types/uuid   | 10.0.0   |
| @types/redux  | 3.6.0    |
| @types/vscode | 1.99.1   |

## Best Practices

### Testing with Vitest

1. **Global Test Setup**: Use `setupFiles` in Vitest config to set up test environment
2. **Type Safety**: Include `vitest/globals` in tsconfig.json types
3. **Path Resolution**: Use vite-tsconfig-paths for proper module resolution
4. **Code Coverage**: Use @vitest/coverage-v8 for modern coverage reporting
5. **Watch Mode**: Use Vitest's built-in watch mode for development

### LangChain Best Practices

1. **Modular Imports**: Use specific imports from @langchain/\* packages
2. **Version Consistency**: Ensure compatible versions across all LangChain packages
3. **Typed Interfaces**: Leverage TypeScript for type safety with LLM responses
4. **Streaming Support**: Use streaming capabilities for better user experience

### TypeScript Configuration

1. **ESM Support**: Use "type": "module" in package.json for ES modules
2. **Path Aliases**: Configure path aliases in tsconfig.json for cleaner imports
3. **Strict Mode**: Enable TypeScript's strict mode for better type safety
4. **Modern Targets**: Target ES2020 or newer for modern JavaScript features

### Node.js Requirements

- Minimum Node.js version: 18.0.0

## Version Update Process

1. Check for updates quarterly using `npm outdated`
2. Research compatibility between interdependent packages
3. Update packages in small batches to test for regressions
4. Run comprehensive tests after updates
5. Document any breaking changes and update this file

## Security Considerations

1. Regularly update dependencies to patch security vulnerabilities
2. Use `npm audit` to check for known security issues
3. Pin exact versions in production environments for consistency
4. Consider using npm overrides for indirect dependency conflicts
