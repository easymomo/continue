/**
 * Task System Types
 *
 * This module defines all the types and interfaces used by the task system.
 */
/**
 * Configuration for the task system
 */
export interface TaskSystemConfig {
    /**
     * Storage configuration
     */
    storage: StorageConfig;
    /**
     * Recovery configuration
     */
    recovery: RecoveryConfig;
    /**
     * Context configuration
     */
    context: ContextConfig;
}
/**
 * Configuration for the storage system
 */
export interface StorageConfig {
    /**
     * Type of storage backend
     */
    type: "sqlite" | "leveldb" | "memory";
    /**
     * Path to the storage directory
     */
    path: string;
    /**
     * Connection options for the storage backend
     */
    options?: Record<string, any>;
}
/**
 * Configuration for the recovery system
 */
export interface RecoveryConfig {
    /**
     * Enable automatic recovery on startup
     */
    autoRecover: boolean;
    /**
     * Number of checkpoints to keep
     */
    checkpointCount: number;
    /**
     * Path to store recovery logs
     */
    logPath: string;
}
/**
 * Configuration for the context system
 */
export interface ContextConfig {
    /**
     * Maximum context size to maintain
     */
    maxContextSize: number;
    /**
     * Whether to validate context on transitions
     */
    validateOnTransition: boolean;
    /**
     * Continuity marker configuration
     */
    continuityMarkers: {
        enabled: boolean;
        frequency: number;
    };
}
/**
 * Transaction object for atomic operations
 */
export interface Transaction {
    id: string;
    startTime: number;
    status: "active" | "committed" | "rolled_back";
}
/**
 * Task data model
 */
export interface Task {
    id: string;
    parentId?: string;
    name: string;
    description: string;
    status: "planned" | "in_progress" | "completed" | "cancelled";
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
    planReference: {
        elementId: string;
        version: number;
    };
    priority: "low" | "medium" | "high";
    metadata: Record<string, any>;
    steps: TaskStep[];
    contextMarkers: ContextMarker[];
}
/**
 * Task step
 */
export interface TaskStep {
    id: string;
    name: string;
    description?: string;
    status: "pending" | "in_progress" | "completed" | "skipped";
    createdAt: number;
    updatedAt: number;
    completedAt?: number;
}
/**
 * Context marker for verification
 */
export interface ContextMarker {
    id: string;
    location: string;
    data: any;
    timestamp: number;
    verified: boolean;
    verifiedAt?: number;
}
/**
 * Plan data model
 */
export interface Plan {
    id: string;
    version: number;
    elements: PlanElement[];
    history: PlanModification[];
    metadata: Record<string, any>;
}
/**
 * Plan element
 */
export interface PlanElement {
    id: string;
    type: "milestone" | "task" | "feature" | "component";
    name: string;
    description: string;
    status: "planned" | "in_progress" | "completed" | "cancelled";
    priority: "low" | "medium" | "high";
    dependencies: string[];
    metadata: Record<string, any>;
}
/**
 * Plan modification record
 */
export interface PlanModification {
    id: string;
    timestamp: number;
    type: "add" | "update" | "remove" | "reorder";
    elements: string[];
    reason: string;
    taskId?: string;
    metadata: Record<string, any>;
}
/**
 * Context data model
 */
export interface Context {
    id: string;
    taskId: string;
    timestamp: number;
    codebaseState: string;
    components: ContextComponent[];
    validationResult?: ContextValidationResult;
    metadata?: Record<string, any>;
}
/**
 * Context component
 */
export interface ContextComponent {
    id: string;
    type: string;
    content: any;
    metadata: Record<string, any>;
}
/**
 * Context validation result
 */
export interface ContextValidationResult {
    valid: boolean;
    completeness: number;
    timestamp: number;
    issues: ContextValidationIssue[];
}
/**
 * Context validation issue
 */
export interface ContextValidationIssue {
    id: string;
    severity: "info" | "warning" | "error";
    message: string;
    component?: string;
    metadata: Record<string, any>;
}
/**
 * Task relationship
 */
export interface TaskRelationship {
    parentId: string;
    childId: string;
    type: "subtask" | "followup" | "dependency";
    metadata: Record<string, any>;
}
/**
 * Verification result
 */
export interface VerificationResult {
    valid: boolean;
    reason?: string;
    details?: Record<string, any>;
}
/**
 * Dependency type
 */
export type DependencyType = "code" | "data" | "config" | "resource" | "task";
/**
 * Dependency model
 */
export interface Dependency {
    fromId: string;
    toId: string;
    type: DependencyType;
    metadata: Record<string, any>;
}
/**
 * Dependency graph
 */
export interface DependencyGraph {
    nodes: {
        id: string;
        type: string;
        data: any;
    }[];
    edges: {
        source: string;
        target: string;
        type: DependencyType;
    }[];
}
