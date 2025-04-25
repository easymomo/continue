# AIgents ES Module Migration Guide

This document outlines the process for standardizing the AIgents framework on TypeScript with ES Modules.

## Why ES Modules?

ES Modules are the official standard format to package JavaScript code for reuse. Benefits include:

- Static module structure allowing for better tree shaking
- Asynchronous module loading
- Better compatibility with modern JavaScript ecosystem
- Improved tooling support
- Simplified import/export syntax

## Migration Steps

### 1. TypeScript Configuration

Updated `src/agents/tsconfig.json` to use ES modules:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "NodeNext", // Changed from "commonjs"
    "moduleResolution": "NodeNext", // Added for Node.js ESM support
    "lib": ["ES2020"],
    "declaration": true,
    "outDir": "../../dist/agents",
    "rootDir": "./",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true
  },
  "include": ["**/*.ts"],
  "exclude": ["node_modules"]
}
```

### 2. Package.json Configuration

Ensured `src/package.json` includes `"type": "module"` to indicate ES module usage:

```json
{
  "name": "ai-dev-agents",
  "version": "0.1.0",
  "description": "Multi-agent system for AI-assisted software development",
  "main": "index.js",
  "type": "module"
  // ...rest of file
}
```

### 3. Removed JavaScript Files

Removed all JavaScript (.js) files that have TypeScript equivalents to avoid confusion and duplication.

### 4. Updated Build Scripts

Added clean build scripts in the root `package.json`:

```json
{
  "scripts": {
    // ... existing scripts
    "clean:agents": "rimraf dist/agents",
    "clean:build:agents": "npm run clean:agents && npm run build:agents",
    "agents:example:dependency": "node --experimental-specifier-resolution=node dist/agents/examples/dependency-example.js"
  }
}
```

### 5. Import/Export Formatting

All TypeScript files should use ES Module syntax:

```typescript
// Import syntax
import { EventEmitter } from "events";
import { v4 as uuidv4 } from "uuid";
import { memorySystem } from "./memory-system.js"; // Note .js extension

// Export syntax
export class MyClass {}
export const myInstance = new MyClass();
export default MyClass;
```

### 6. Runtime Node.js Configuration

When running the compiled code, use the `--experimental-specifier-resolution=node` flag to allow importing without file extensions:

```bash
node --experimental-specifier-resolution=node dist/agents/examples/dependency-example.js
```

## Using the Migration Script

A migration script is provided to help with the transition:

```bash
# Make the script executable
chmod +x scripts/update-to-esm.sh

# Run the script
./scripts/update-to-esm.sh
```

## Testing

After migration, thoroughly test all functionality:

1. Run unit tests: `npm test`
2. Test the agents example: `npm run agents:example:dependency`
3. Verify that all imports and exports are functioning correctly
4. Check for any runtime errors related to module resolution

## Troubleshooting

Common issues during ESM migration:

### Module Resolution Errors

**Problem**: `Error [ERR_MODULE_NOT_FOUND]: Cannot find module...`

**Solution**: Ensure all imports include the file extension (`.js`) when referring to local files.

### Type Definition Issues

**Problem**: TypeScript complaining about types even when imported properly

**Solution**: You may need to update your type definitions or ensure that `.d.ts` files are being generated correctly:

```bash
# Rebuild with declaration files
npm run build:agents
```

### Circular Dependencies

**Problem**: Circular dependencies causing issues with ESM

**Solution**: Refactor code to eliminate circular dependencies, or use dynamic imports.

## References

- [TypeScript ESM Support](https://www.typescriptlang.org/docs/handbook/esm-node.html)
- [Node.js ES Modules](https://nodejs.org/api/esm.html)
- [ES Modules: A Cartoon Deep-Dive](https://hacks.mozilla.org/2018/03/es-modules-a-cartoon-deep-dive/)
