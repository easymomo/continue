/**
 * Developer Agent Workflow Stages
 * Defines the valid stages and transitions for development tasks
 */

/**
 * Defines the workflow stages for the developer agent
 */
export enum DeveloperWorkflowStage {
  // Initial planning and requirements gathering
  PLANNING = "PLANNING",

  // Architecture and system design
  DESIGNING = "DESIGNING",

  // Active implementation of code
  IMPLEMENTING = "IMPLEMENTING",

  // Testing and debugging
  TESTING = "TESTING",

  // Code review and refinement
  REVIEWING = "REVIEWING",

  // Refactoring and optimization
  REFACTORING = "REFACTORING",

  // Documentation and cleanup
  DOCUMENTING = "DOCUMENTING",

  // Task completion
  COMPLETED = "COMPLETED",
}

/**
 * Enum representing the types of artifacts that can be created during development
 */
export enum DeveloperArtifactType {
  // Requirements and constraints
  REQUIREMENTS = "REQUIREMENTS",

  // Architecture and design decisions
  DESIGN_DOC = "DESIGN_DOC",

  // Implementation plans and approaches
  IMPLEMENTATION_PLAN = "IMPLEMENTATION_PLAN",

  // Code snippets and implementations
  CODE = "CODE",

  // Test cases and test results
  TEST_CASE = "TEST_CASE",

  // Review notes and feedback
  REVIEW_NOTES = "REVIEW_NOTES",

  // Documentation and comments
  DOCUMENTATION = "DOCUMENTATION",

  // Bug report
  BUG_REPORT = "BUG_REPORT",

  // Release notes
  RELEASE_NOTES = "RELEASE_NOTES",
}

/**
 * Interface representing the metadata for a development task
 */
export interface DeveloperTaskMetadata {
  currentStage: DeveloperWorkflowStage;
  stageHistory: Array<{
    stage: DeveloperWorkflowStage;
    timestamp: Date;
    note: string;
  }>;
  requirements: string[];
  artifacts: Array<{
    type: DeveloperArtifactType;
    content: string;
    timestamp: Date;
  }>;
  codeFiles: string[];
  testFiles: string[];
}

/**
 * Valid workflow stage transitions
 * Defines which stages can transition to which other stages
 */
export const VALID_STAGE_TRANSITIONS: Record<
  DeveloperWorkflowStage,
  DeveloperWorkflowStage[]
> = {
  [DeveloperWorkflowStage.PLANNING]: [
    DeveloperWorkflowStage.DESIGNING,
    DeveloperWorkflowStage.IMPLEMENTING, // Simple tasks might skip design
  ],

  [DeveloperWorkflowStage.DESIGNING]: [
    DeveloperWorkflowStage.IMPLEMENTING,
    DeveloperWorkflowStage.PLANNING, // Go back to planning if design reveals issues
  ],

  [DeveloperWorkflowStage.IMPLEMENTING]: [
    DeveloperWorkflowStage.TESTING,
    DeveloperWorkflowStage.DESIGNING, // Return to design if implementation reveals flaws
    DeveloperWorkflowStage.PLANNING, // Return to planning if implementation reveals requirements issues
  ],

  [DeveloperWorkflowStage.TESTING]: [
    DeveloperWorkflowStage.REVIEWING,
    DeveloperWorkflowStage.IMPLEMENTING, // Return to implementation if tests fail
    DeveloperWorkflowStage.REFACTORING, // Direct to refactoring if needed
  ],

  [DeveloperWorkflowStage.REVIEWING]: [
    DeveloperWorkflowStage.REFACTORING,
    DeveloperWorkflowStage.DOCUMENTING,
    DeveloperWorkflowStage.IMPLEMENTING, // Return to implementation if review finds issues
    DeveloperWorkflowStage.COMPLETED, // Small changes might skip refactoring/documentation
  ],

  [DeveloperWorkflowStage.REFACTORING]: [
    DeveloperWorkflowStage.TESTING, // Verify refactoring with tests
    DeveloperWorkflowStage.DOCUMENTING,
    DeveloperWorkflowStage.REVIEWING, // Return to review after refactoring
  ],

  [DeveloperWorkflowStage.DOCUMENTING]: [
    DeveloperWorkflowStage.COMPLETED,
    DeveloperWorkflowStage.REVIEWING, // Final review before completion
  ],

  [DeveloperWorkflowStage.COMPLETED]: [
    DeveloperWorkflowStage.PLANNING, // Start a new development cycle/iteration
  ],
};
