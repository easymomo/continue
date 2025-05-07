/**
 * Core type definitions for the agent tool system
 *
 * This file defines the fundamental interfaces and types used throughout
 * the tool system, including metadata, categories, and permissions.
 */
/**
 * Categories for agent tools based on functionality
 */
export var ToolCategory;
(function (ToolCategory) {
    // File and filesystem operations
    ToolCategory["FILESYSTEM"] = "filesystem";
    // Code manipulation and analysis
    ToolCategory["CODE_ANALYSIS"] = "code_analysis";
    ToolCategory["CODE_GENERATION"] = "code_generation";
    // Information retrieval
    ToolCategory["WEB_SEARCH"] = "web_search";
    ToolCategory["DOCUMENTATION"] = "documentation";
    // Security tools
    ToolCategory["SECURITY_SCAN"] = "security_scan";
    ToolCategory["DEPENDENCY_AUDIT"] = "dependency_audit";
    // Database operations
    ToolCategory["DATABASE"] = "database";
    // Testing tools
    ToolCategory["TESTING"] = "testing";
    // Version control
    ToolCategory["VERSION_CONTROL"] = "version_control";
    // Utility tools
    ToolCategory["UTILITY"] = "utility";
})(ToolCategory || (ToolCategory = {}));
/**
 * Permission levels for tools
 */
export var ToolPermission;
(function (ToolPermission) {
    // No special permissions required
    ToolPermission["NONE"] = "none";
    // Read-only filesystem access
    ToolPermission["FS_READ"] = "filesystem_read";
    // Write access to filesystem
    ToolPermission["FS_WRITE"] = "filesystem_write";
    // Network access
    ToolPermission["NETWORK"] = "network";
    // Execute commands
    ToolPermission["EXECUTE"] = "execute";
    // Database access
    ToolPermission["DATABASE"] = "database";
})(ToolPermission || (ToolPermission = {}));
