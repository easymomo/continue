"use strict";
/**
 * Dependency Agent
 *
 * Monitors project dependencies and provides updates and security information.
 */
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.DependencyAgent = void 0;
var child_process_1 = require("child_process");
var fs_1 = require("fs");
var path = require("path");
var base_agent_1 = require("./framework/base-agent");
var types_1 = require("./framework/types");
var DependencyAgent = /** @class */ (function (_super) {
    __extends(DependencyAgent, _super);
    function DependencyAgent(projectRoot) {
        var _this = _super.call(this, {
            name: "Dependency Agent",
            description: "Monitors project dependencies and provides updates and security information",
            version: "1.0.0",
            capabilities: {
                dependencyCheck: true,
                securityAudit: true,
                dependencyUpdate: true,
            },
            supportedTaskTypes: [
                "dependency-check",
                "security-audit",
                "dependency-update",
                "generate-dependency-report",
            ],
        }) || this;
        _this.projectRoot = projectRoot;
        _this.reportDir = path.join(_this.projectRoot, "reports");
        return _this;
    }
    /**
     * Initialize the agent
     */
    DependencyAgent.prototype.onInitialize = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: 
                    // Create reports directory if it doesn't exist
                    return [4 /*yield*/, fs_1.promises.mkdir(this.reportDir, { recursive: true })];
                    case 1:
                        // Create reports directory if it doesn't exist
                        _a.sent();
                        // Store initial dependency state
                        return [4 /*yield*/, this.storeDependencyState()];
                    case 2:
                        // Store initial dependency state
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Shutdown the agent
     */
    DependencyAgent.prototype.onShutdown = function () {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                return [2 /*return*/];
            });
        });
    };
    /**
     * Handle a task assigned to the agent
     *
     * @param task Task to handle
     * @returns The updated task
     */
    DependencyAgent.prototype.onHandleTask = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = task.type;
                        switch (_a) {
                            case "dependency-check": return [3 /*break*/, 1];
                            case "security-audit": return [3 /*break*/, 3];
                            case "dependency-update": return [3 /*break*/, 5];
                            case "generate-dependency-report": return [3 /*break*/, 7];
                        }
                        return [3 /*break*/, 9];
                    case 1: return [4 /*yield*/, this.handleDependencyCheck(task)];
                    case 2: return [2 /*return*/, _b.sent()];
                    case 3: return [4 /*yield*/, this.handleSecurityAudit(task)];
                    case 4: return [2 /*return*/, _b.sent()];
                    case 5: return [4 /*yield*/, this.handleDependencyUpdate(task)];
                    case 6: return [2 /*return*/, _b.sent()];
                    case 7: return [4 /*yield*/, this.handleGenerateReport(task)];
                    case 8: return [2 /*return*/, _b.sent()];
                    case 9:
                        task.status = types_1.TaskStatus.FAILED;
                        task.error = "Unsupported task type: ".concat(task.type);
                        return [2 /*return*/, task];
                }
            });
        });
    };
    /**
     * Cancel a task
     *
     * @param taskId ID of the task to cancel
     */
    DependencyAgent.prototype.onCancelTask = function (taskId) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                // Tasks are currently synchronous, so we can't cancel them
                return [2 /*return*/, false];
            });
        });
    };
    /**
     * Handle a message sent to the agent
     *
     * @param message Message to handle
     */
    DependencyAgent.prototype.onHandleMessage = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var _a;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        _a = message.subject;
                        switch (_a) {
                            case "dependency-status-request": return [3 /*break*/, 1];
                            case "security-status-request": return [3 /*break*/, 3];
                        }
                        return [3 /*break*/, 5];
                    case 1: return [4 /*yield*/, this.handleDependencyStatusRequest(message)];
                    case 2:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 3: return [4 /*yield*/, this.handleSecurityStatusRequest(message)];
                    case 4:
                        _b.sent();
                        return [3 /*break*/, 6];
                    case 5: 
                    // Ignore messages we don't understand
                    return [3 /*break*/, 6];
                    case 6: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check outdated dependencies
     *
     * @returns Object mapping dependency names to info
     */
    DependencyAgent.prototype.checkOutdatedDependencies = function () {
        return __awaiter(this, void 0, void 0, function () {
            var output;
            return __generator(this, function (_a) {
                try {
                    output = (0, child_process_1.execSync)("npm outdated --json", {
                        cwd: this.projectRoot,
                        encoding: "utf8",
                    });
                    return [2 /*return*/, JSON.parse(output)];
                }
                catch (error) {
                    // npm outdated returns a non-zero exit code when outdated packages are found
                    if (error instanceof Error && "stdout" in error) {
                        try {
                            return [2 /*return*/, JSON.parse(error.stdout)];
                        }
                        catch (_b) {
                            // If we can't parse the output, return an empty object
                            return [2 /*return*/, {}];
                        }
                    }
                    // If there was some other error, return an empty object
                    return [2 /*return*/, {}];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Check for security vulnerabilities
     *
     * @returns Object with vulnerability info
     */
    DependencyAgent.prototype.checkSecurityVulnerabilities = function () {
        return __awaiter(this, void 0, void 0, function () {
            var output;
            return __generator(this, function (_a) {
                try {
                    output = (0, child_process_1.execSync)("npm audit --json", {
                        cwd: this.projectRoot,
                        encoding: "utf8",
                    });
                    return [2 /*return*/, JSON.parse(output)];
                }
                catch (error) {
                    // npm audit returns a non-zero exit code when vulnerabilities are found
                    if (error instanceof Error && "stdout" in error) {
                        try {
                            return [2 /*return*/, JSON.parse(error.stdout)];
                        }
                        catch (_b) {
                            // If we can't parse the output, return a default object
                            return [2 /*return*/, {
                                    vulnerabilities: {},
                                    metadata: {
                                        vulnerabilities: {
                                            info: 0,
                                            low: 0,
                                            moderate: 0,
                                            high: 0,
                                            critical: 0,
                                            total: 0,
                                        },
                                        dependencies: 0,
                                        devDependencies: 0,
                                        totalDependencies: 0,
                                    },
                                }];
                        }
                    }
                    // If there was some other error, return a default object
                    return [2 /*return*/, {
                            vulnerabilities: {},
                            metadata: {
                                vulnerabilities: {
                                    info: 0,
                                    low: 0,
                                    moderate: 0,
                                    high: 0,
                                    critical: 0,
                                    total: 0,
                                },
                                dependencies: 0,
                                devDependencies: 0,
                                totalDependencies: 0,
                            },
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Update a dependency
     *
     * @param name Dependency name
     * @param version Version to update to
     */
    DependencyAgent.prototype.updateDependency = function (name, version) {
        return __awaiter(this, void 0, void 0, function () {
            var output;
            return __generator(this, function (_a) {
                try {
                    output = (0, child_process_1.execSync)("npm install ".concat(name, "@").concat(version), {
                        cwd: this.projectRoot,
                        encoding: "utf8",
                    });
                    return [2 /*return*/, {
                            success: true,
                            output: output,
                        }];
                }
                catch (error) {
                    return [2 /*return*/, {
                            success: false,
                            output: "",
                            error: error instanceof Error ? error.message : String(error),
                        }];
                }
                return [2 /*return*/];
            });
        });
    };
    /**
     * Store the current dependency state in memory
     */
    DependencyAgent.prototype.storeDependencyState = function () {
        return __awaiter(this, void 0, void 0, function () {
            var outdatedDeps, securityResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkOutdatedDependencies()];
                    case 1:
                        outdatedDeps = _a.sent();
                        return [4 /*yield*/, this.checkSecurityVulnerabilities()];
                    case 2:
                        securityResults = _a.sent();
                        return [4 /*yield*/, this.storeMemory("dependency-state", {
                                outdatedDependencies: outdatedDeps,
                                securityVulnerabilities: securityResults,
                                timestamp: new Date().toISOString(),
                            })];
                    case 3:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle a dependency check task
     *
     * @param task Task to handle
     * @returns Updated task
     */
    DependencyAgent.prototype.handleDependencyCheck = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var outdatedDeps, outdatedCount, reportPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkOutdatedDependencies()];
                    case 1:
                        outdatedDeps = _a.sent();
                        outdatedCount = Object.keys(outdatedDeps).length;
                        if (!(outdatedCount === 0)) return [3 /*break*/, 2];
                        task.result = {
                            message: "All dependencies are up to date",
                            dependencies: {},
                        };
                        return [3 /*break*/, 4];
                    case 2:
                        task.result = {
                            message: "Found ".concat(outdatedCount, " outdated ").concat(outdatedCount === 1 ? "dependency" : "dependencies"),
                            dependencies: outdatedDeps,
                        };
                        if (!task.data.generateReport) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.generateDependencyReport(outdatedDeps)];
                    case 3:
                        reportPath = _a.sent();
                        task.result.reportPath = reportPath;
                        _a.label = 4;
                    case 4: 
                    // Store the updated dependency state
                    return [4 /*yield*/, this.storeDependencyState()];
                    case 5:
                        // Store the updated dependency state
                        _a.sent();
                        task.status = types_1.TaskStatus.COMPLETED;
                        return [2 /*return*/, task];
                }
            });
        });
    };
    /**
     * Handle a security audit task
     *
     * @param task Task to handle
     * @returns Updated task
     */
    DependencyAgent.prototype.handleSecurityAudit = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var securityResults, vulnTotal, reportPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkSecurityVulnerabilities()];
                    case 1:
                        securityResults = _a.sent();
                        vulnTotal = securityResults.metadata.vulnerabilities.total;
                        if (!(vulnTotal === 0)) return [3 /*break*/, 2];
                        task.result = {
                            message: "No security vulnerabilities found",
                            vulnerabilities: {},
                        };
                        return [3 /*break*/, 4];
                    case 2:
                        task.result = {
                            message: "Found ".concat(vulnTotal, " security ").concat(vulnTotal === 1 ? "vulnerability" : "vulnerabilities"),
                            vulnerabilityCounts: securityResults.metadata.vulnerabilities,
                            vulnerabilities: securityResults.vulnerabilities,
                        };
                        if (!task.data.generateReport) return [3 /*break*/, 4];
                        return [4 /*yield*/, this.generateSecurityReport(securityResults)];
                    case 3:
                        reportPath = _a.sent();
                        task.result.reportPath = reportPath;
                        _a.label = 4;
                    case 4: 
                    // Store the updated security state
                    return [4 /*yield*/, this.storeDependencyState()];
                    case 5:
                        // Store the updated security state
                        _a.sent();
                        task.status = types_1.TaskStatus.COMPLETED;
                        return [2 /*return*/, task];
                }
            });
        });
    };
    /**
     * Handle a dependency update task
     *
     * @param task Task to handle
     * @returns Updated task
     */
    DependencyAgent.prototype.handleDependencyUpdate = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var updateResults, _i, _a, dep, name_1, version, result, hasFailures;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        if (!task.data.dependencies || !Array.isArray(task.data.dependencies)) {
                            task.status = types_1.TaskStatus.FAILED;
                            task.error = "No dependencies specified for update";
                            return [2 /*return*/, task];
                        }
                        updateResults = {};
                        _i = 0, _a = task.data.dependencies;
                        _b.label = 1;
                    case 1:
                        if (!(_i < _a.length)) return [3 /*break*/, 4];
                        dep = _a[_i];
                        name_1 = dep.name, version = dep.version;
                        if (!name_1) {
                            updateResults[name_1 || "unknown"] = {
                                success: false,
                                targetVersion: version || "latest",
                                error: "No dependency name specified",
                            };
                            return [3 /*break*/, 3];
                        }
                        return [4 /*yield*/, this.updateDependency(name_1, version || "latest")];
                    case 2:
                        result = _b.sent();
                        updateResults[name_1] = {
                            success: result.success,
                            targetVersion: version || "latest",
                            error: result.error,
                        };
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4:
                        task.result = {
                            message: "Dependency update completed",
                            results: updateResults,
                        };
                        // Store the updated dependency state
                        return [4 /*yield*/, this.storeDependencyState()];
                    case 5:
                        // Store the updated dependency state
                        _b.sent();
                        hasFailures = Object.values(updateResults).some(function (r) { return !r.success; });
                        task.status = hasFailures
                            ? types_1.TaskStatus.COMPLETED // Still mark as completed even with some failures
                            : types_1.TaskStatus.COMPLETED;
                        return [2 /*return*/, task];
                }
            });
        });
    };
    /**
     * Handle a generate report task
     *
     * @param task Task to handle
     * @returns Updated task
     */
    DependencyAgent.prototype.handleGenerateReport = function (task) {
        return __awaiter(this, void 0, void 0, function () {
            var outdatedDeps, securityResults, depReportPath, secReportPath;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkOutdatedDependencies()];
                    case 1:
                        outdatedDeps = _a.sent();
                        return [4 /*yield*/, this.checkSecurityVulnerabilities()];
                    case 2:
                        securityResults = _a.sent();
                        return [4 /*yield*/, this.generateDependencyReport(outdatedDeps)];
                    case 3:
                        depReportPath = _a.sent();
                        return [4 /*yield*/, this.generateSecurityReport(securityResults)];
                    case 4:
                        secReportPath = _a.sent();
                        task.result = {
                            message: "Reports generated successfully",
                            dependencyReportPath: depReportPath,
                            securityReportPath: secReportPath,
                        };
                        task.status = types_1.TaskStatus.COMPLETED;
                        return [2 /*return*/, task];
                }
            });
        });
    };
    /**
     * Handle a dependency status request message
     *
     * @param message Message to handle
     */
    DependencyAgent.prototype.handleDependencyStatusRequest = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var outdatedDeps, outdatedCount;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkOutdatedDependencies()];
                    case 1:
                        outdatedDeps = _a.sent();
                        outdatedCount = Object.keys(outdatedDeps).length;
                        return [4 /*yield*/, this.sendMessage(message.sender, "dependency-status-response", {
                                outdatedCount: outdatedCount,
                                dependencies: outdatedDeps,
                            }, types_1.MessageType.RESPONSE, {}, message.id)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Handle a security status request message
     *
     * @param message Message to handle
     */
    DependencyAgent.prototype.handleSecurityStatusRequest = function (message) {
        return __awaiter(this, void 0, void 0, function () {
            var securityResults;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0: return [4 /*yield*/, this.checkSecurityVulnerabilities()];
                    case 1:
                        securityResults = _a.sent();
                        return [4 /*yield*/, this.sendMessage(message.sender, "security-status-response", {
                                vulnerabilityCounts: securityResults.metadata.vulnerabilities,
                                vulnerabilities: securityResults.vulnerabilities,
                            }, types_1.MessageType.RESPONSE, {}, message.id)];
                    case 2:
                        _a.sent();
                        return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Generate a dependency report
     *
     * @param outdatedDeps Outdated dependencies
     * @returns Path to the generated report
     */
    DependencyAgent.prototype.generateDependencyReport = function (outdatedDeps) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, reportPath, outdatedCount, reportContent, _i, _a, _b, name_2, info, _c, _d, _e, name_3, info;
            return __generator(this, function (_f) {
                switch (_f.label) {
                    case 0:
                        timestamp = new Date().toISOString().slice(0, 10);
                        reportPath = path.join(this.reportDir, "dependency-update-".concat(timestamp, ".md"));
                        outdatedCount = Object.keys(outdatedDeps).length;
                        reportContent = "# Dependency Update Report\n\n";
                        reportContent += "Generated: ".concat(new Date().toISOString(), "\n\n");
                        if (outdatedCount === 0) {
                            reportContent += "## Status\n\n";
                            reportContent += "All dependencies are up to date.\n\n";
                        }
                        else {
                            reportContent += "## Status\n\n";
                            reportContent += "Found ".concat(outdatedCount, " outdated ").concat(outdatedCount === 1 ? "dependency" : "dependencies", ".\n\n");
                            reportContent += "## Outdated Dependencies\n\n";
                            reportContent += "| Package | Current | Wanted | Latest | Type |\n";
                            reportContent += "|---------|---------|--------|--------|------|\n";
                            for (_i = 0, _a = Object.entries(outdatedDeps); _i < _a.length; _i++) {
                                _b = _a[_i], name_2 = _b[0], info = _b[1];
                                reportContent += "| ".concat(name_2, " | ").concat(info.current, " | ").concat(info.wanted, " | ").concat(info.latest, " | ").concat(info.type, " |\n");
                            }
                            reportContent += "\n## Update Commands\n\n";
                            reportContent += "```bash\n";
                            for (_c = 0, _d = Object.entries(outdatedDeps); _c < _d.length; _c++) {
                                _e = _d[_c], name_3 = _e[0], info = _e[1];
                                reportContent += "npm install ".concat(name_3, "@").concat(info.latest, " # Update to latest\n");
                            }
                            reportContent += "```\n\n";
                            reportContent += "## Notes\n\n";
                            reportContent +=
                                "- Before updating, make sure to review the changelog for each package to check for breaking changes.\n";
                            reportContent +=
                                "- Consider running tests after updating to ensure everything works as expected.\n";
                            reportContent +=
                                "- For major version updates, review the migration guides if available.\n";
                        }
                        return [4 /*yield*/, fs_1.promises.writeFile(reportPath, reportContent)];
                    case 1:
                        _f.sent();
                        return [2 /*return*/, reportPath];
                }
            });
        });
    };
    /**
     * Generate a security report
     *
     * @param securityResults Security audit results
     * @returns Path to the generated report
     */
    DependencyAgent.prototype.generateSecurityReport = function (securityResults) {
        return __awaiter(this, void 0, void 0, function () {
            var timestamp, reportPath, vulnTotal, reportContent, _i, _a, _b, name_4, vuln, _c, _d, via, _e, _f, effect;
            return __generator(this, function (_g) {
                switch (_g.label) {
                    case 0:
                        timestamp = new Date().toISOString().slice(0, 10);
                        reportPath = path.join(this.reportDir, "security-audit-".concat(timestamp, ".md"));
                        vulnTotal = securityResults.metadata.vulnerabilities.total;
                        reportContent = "# Security Audit Report\n\n";
                        reportContent += "Generated: ".concat(new Date().toISOString(), "\n\n");
                        if (vulnTotal === 0) {
                            reportContent += "## Status\n\n";
                            reportContent += "No security vulnerabilities found.\n\n";
                        }
                        else {
                            reportContent += "## Status\n\n";
                            reportContent += "Found ".concat(vulnTotal, " security ").concat(vulnTotal === 1 ? "vulnerability" : "vulnerabilities", ".\n\n");
                            reportContent += "## Vulnerability Summary\n\n";
                            reportContent += "| Severity | Count |\n";
                            reportContent += "|----------|-------|\n";
                            reportContent += "| Critical | ".concat(securityResults.metadata.vulnerabilities.critical, " |\n");
                            reportContent += "| High     | ".concat(securityResults.metadata.vulnerabilities.high, " |\n");
                            reportContent += "| Moderate | ".concat(securityResults.metadata.vulnerabilities.moderate, " |\n");
                            reportContent += "| Low      | ".concat(securityResults.metadata.vulnerabilities.low, " |\n");
                            reportContent += "| Info     | ".concat(securityResults.metadata.vulnerabilities.info, " |\n");
                            reportContent += "| **Total**    | **".concat(vulnTotal, "** |\n\n");
                            reportContent += "## Vulnerability Details\n\n";
                            for (_i = 0, _a = Object.entries(securityResults.vulnerabilities); _i < _a.length; _i++) {
                                _b = _a[_i], name_4 = _b[0], vuln = _b[1];
                                reportContent += "### ".concat(name_4, "\n\n");
                                reportContent += "**Severity:** ".concat(vuln.severity, "\n\n");
                                reportContent += "**Vulnerable Versions:** ".concat(vuln.range, "\n\n");
                                if (vuln.via && vuln.via.length > 0) {
                                    reportContent += "**Via:**\n\n";
                                    for (_c = 0, _d = vuln.via; _c < _d.length; _c++) {
                                        via = _d[_c];
                                        reportContent += "- ".concat(typeof via === "string" ? via : JSON.stringify(via), "\n");
                                    }
                                    reportContent += "\n";
                                }
                                if (vuln.effects && vuln.effects.length > 0) {
                                    reportContent += "**Effects:**\n\n";
                                    for (_e = 0, _f = vuln.effects; _e < _f.length; _e++) {
                                        effect = _f[_e];
                                        reportContent += "- ".concat(effect, "\n");
                                    }
                                    reportContent += "\n";
                                }
                                reportContent += "**Fix Available:** ".concat(vuln.fixAvailable ? "Yes" : "No", "\n\n");
                                reportContent += "---\n\n";
                            }
                            reportContent += "## Mitigation\n\n";
                            reportContent += "To fix these vulnerabilities, run:\n\n";
                            reportContent += "```bash\n";
                            reportContent += "npm audit fix\n";
                            reportContent += "\n";
                            reportContent += "# If the above command does not fix all issues:\n";
                            reportContent +=
                                "npm audit fix --force  # Note: This may update packages to major versions, introducing breaking changes\n";
                            reportContent += "```\n\n";
                            reportContent += "## Notes\n\n";
                            reportContent +=
                                "- Before applying fixes, make sure to test your application thoroughly.\n";
                            reportContent +=
                                "- Using `--force` can introduce breaking changes, so use with caution.\n";
                            reportContent +=
                                "- For more detailed information, run `npm audit --json` for a full report.\n";
                        }
                        return [4 /*yield*/, fs_1.promises.writeFile(reportPath, reportContent)];
                    case 1:
                        _g.sent();
                        return [2 /*return*/, reportPath];
                }
            });
        });
    };
    return DependencyAgent;
}(base_agent_1.BaseAgent));
exports.DependencyAgent = DependencyAgent;
