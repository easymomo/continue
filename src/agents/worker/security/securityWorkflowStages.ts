/**
 * Security Agent Workflow Stages
 * Defines the valid stages and transitions for security tasks
 */

/**
 * Defines the workflow stages for the security agent
 */
export enum SecurityWorkflowStage {
  // Initial security assessment and requirement gathering
  ASSESSMENT = "ASSESSMENT",

  // Detailed analysis of code or system security
  ANALYSIS = "ANALYSIS",

  // Active scanning for vulnerabilities
  VULNERABILITY_SCAN = "VULNERABILITY_SCAN",

  // Recommendations for fixing identified issues
  REMEDIATION = "REMEDIATION",

  // Verifying fixes and implementation
  VERIFICATION = "VERIFICATION",

  // Security audit completed
  COMPLETED = "COMPLETED",
}

/**
 * Enum representing the types of artifacts that can be created during security tasks
 */
export enum SecurityArtifactType {
  // Security requirements and scope
  REQUIREMENTS = "REQUIREMENTS",

  // Security findings and vulnerabilities
  VULNERABILITY = "VULNERABILITY",

  // Detailed security analysis report
  SECURITY_REPORT = "SECURITY_REPORT",

  // Remediation recommendations
  REMEDIATION = "REMEDIATION",

  // Verification results
  VERIFICATION = "VERIFICATION",
}

/**
 * Interface representing the metadata for a security task
 */
export interface SecurityTaskMetadata {
  currentStage: SecurityWorkflowStage;
  stageHistory: Array<{
    stage: SecurityWorkflowStage;
    timestamp: Date;
    note: string;
  }>;
  securityRequirements: string[];
  artifacts: Array<{
    type: SecurityArtifactType;
    content: string;
    severity?: "low" | "medium" | "high" | "critical";
    cvss?: number;
    cve?: string;
    timestamp: Date;
  }>;
  affectedFiles: string[];
  vulnerableComponents: string[];
}

/**
 * Valid workflow stage transitions
 * Defines which stages can transition to which other stages
 */
export const VALID_STAGE_TRANSITIONS: Record<
  SecurityWorkflowStage,
  SecurityWorkflowStage[]
> = {
  [SecurityWorkflowStage.ASSESSMENT]: [
    SecurityWorkflowStage.ANALYSIS,
    SecurityWorkflowStage.VULNERABILITY_SCAN,
  ],

  [SecurityWorkflowStage.ANALYSIS]: [
    SecurityWorkflowStage.VULNERABILITY_SCAN,
    SecurityWorkflowStage.REMEDIATION,
    SecurityWorkflowStage.ASSESSMENT, // Return to assessment if more information needed
  ],

  [SecurityWorkflowStage.VULNERABILITY_SCAN]: [
    SecurityWorkflowStage.REMEDIATION,
    SecurityWorkflowStage.ANALYSIS, // Return to analysis if more detailed analysis needed
  ],

  [SecurityWorkflowStage.REMEDIATION]: [
    SecurityWorkflowStage.VERIFICATION,
    SecurityWorkflowStage.VULNERABILITY_SCAN, // Return to scanning if more issues need to be found
  ],

  [SecurityWorkflowStage.VERIFICATION]: [
    SecurityWorkflowStage.COMPLETED,
    SecurityWorkflowStage.REMEDIATION, // Return to remediation if verification fails
  ],

  [SecurityWorkflowStage.COMPLETED]: [
    SecurityWorkflowStage.ASSESSMENT, // Start a new security assessment
  ],
};

/**
 * Stage-specific system prompts for the security agent
 */
export const SECURITY_STAGE_PROMPTS: Record<SecurityWorkflowStage, string> = {
  [SecurityWorkflowStage.ASSESSMENT]: `
You are in the ASSESSMENT stage.
Focus on understanding security requirements, defining the scope of security assessment,
and identifying potential security concerns. Ask clarifying questions about the codebase,
technology stack, and security goals.
`,

  [SecurityWorkflowStage.ANALYSIS]: `
You are in the ANALYSIS stage.
Focus on detailed analysis of code and architecture from a security perspective.
Look for security anti-patterns, potential vulnerabilities in the design,
and areas that require deeper investigation.
`,

  [SecurityWorkflowStage.VULNERABILITY_SCAN]: `
You are in the VULNERABILITY_SCAN stage.
Focus on actively scanning for known vulnerabilities such as:
- Injection flaws (SQL, NoSQL, command injection)
- Cross-site scripting (XSS)
- Broken authentication
- Sensitive data exposure
- Security misconfigurations
- Broken access control
- Using components with known vulnerabilities
Identify specific issues with severity ratings and detailed explanations.
`,

  [SecurityWorkflowStage.REMEDIATION]: `
You are in the REMEDIATION stage.
Focus on providing specific, actionable recommendations to address
identified security vulnerabilities. Include code examples, configuration changes,
and best practices for implementation. Prioritize recommendations based on severity.
`,

  [SecurityWorkflowStage.VERIFICATION]: `
You are in the VERIFICATION stage.
Focus on verifying that security issues have been properly addressed.
Review implemented fixes, test for regressions, and ensure that remediation
efforts have successfully resolved the identified vulnerabilities.
`,

  [SecurityWorkflowStage.COMPLETED]: `
You are in the COMPLETED stage.
The security assessment is complete. You can provide a summary of findings,
answer follow-up questions, or start a new security assessment if requested.
`,
};
