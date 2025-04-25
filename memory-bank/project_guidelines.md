# AIgents Project Guidelines

## Project Boundaries and Structure

### Critical Distinction: AIgents vs. Continue

**AIgents** is our project that builds upon the Continue VSCode extension framework. It is imperative to maintain a clear separation between our implementation and the Continue codebase:

1. **AIgents Implementation**:

   - Contained exclusively within the `/src` folder
   - Represents our agent-based enhancement to the Continue extension
   - Any new features, components, or systems we develop belong here
   - When discussing implementation details, we reference only files within the `/src` directory

2. **Continue Framework**:
   - The existing VSCode extension we're building upon
   - Considered external to our direct development scope
   - Used as a platform and integration point, not for direct modification
   - We reference Continue's code only to understand integration points

### Integration Approach

When integrating AIgents with Continue:

1. **Use adapter patterns** to connect AIgents to Continue's systems
2. **Create clear boundaries** between our code and Continue's code
3. **Implement via extension points** rather than modifying Continue's core
4. **Prefer composition over inheritance** when extending Continue's functionality

### Implementation Guidelines

1. **Focus Development in `/src`**:

   - All AIgents code should reside within the `/src` directory
   - Organize features into appropriate subdirectories within `/src`

2. **Integration Only at Defined Points**:

   - Identify specific integration points with Continue
   - Document these integration points clearly
   - Create well-defined interfaces at these boundaries

3. **Avoid Direct Modifications**:

   - Never modify Continue's core code directly
   - If Continue needs enhancement, implement it via our adapter layer

4. **Testing Isolation**:
   - Test AIgents components in isolation from Continue when possible
   - Use mocks for Continue's interfaces during testing

### Documentation Standards

1. **Clear Attribution**:

   - Always specify whether a component belongs to AIgents or Continue
   - Use "AIgents:" and "Continue:" prefixes in documentation when needed

2. **Path References**:

   - Use absolute paths when referencing AIgents code: `/src/...`
   - Use distinct notation when referencing Continue code: `Continue: [path]`

3. **Architecture Documentation**:
   - Clearly delineate AIgents architecture from Continue's architecture
   - Document integration points explicitly

## Enforcement

This separation must be strictly maintained throughout development. Any mixing of AIgents and Continue architecture in implementation is considered a serious issue to be corrected immediately.

Before implementing any feature:

1. Identify which system (AIgents or Continue) the component belongs to
2. Determine appropriate integration points if needed
3. Confirm the implementation approach maintains proper separation

This document serves as the definitive guide for maintaining proper boundaries between AIgents and Continue. All development and documentation must adhere to these guidelines.
