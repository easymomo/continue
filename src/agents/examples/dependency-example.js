"use strict";
/**
 * Dependency Agent Example
 *
 * This file demonstrates how to use the AIgents framework with the dependency agent.
 */
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
var path = require("path");
var dependency_agent_1 = require("../dependency-agent");
var framework_1 = require("../framework");
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var projectRoot, dependencyAgent, checkTask, agents, agent, result, _i, _a, _b, name_1, info, auditTask, auditResult, error_1;
        return __generator(this, function (_c) {
            switch (_c.label) {
                case 0:
                    _c.trys.push([0, 10, , 12]);
                    console.log("Initializing AIgents framework...");
                    // Initialize the framework
                    return [4 /*yield*/, framework_1.framework.initialize()];
                case 1:
                    // Initialize the framework
                    _c.sent();
                    console.log("Framework initialized successfully");
                    projectRoot = path.resolve(process.cwd());
                    dependencyAgent = new dependency_agent_1.DependencyAgent(projectRoot);
                    console.log("Creating dependency agent for project at ".concat(projectRoot));
                    // Register the agent with the framework
                    return [4 /*yield*/, framework_1.framework.registerAgent(dependencyAgent)];
                case 2:
                    // Register the agent with the framework
                    _c.sent();
                    console.log("Dependency agent registered successfully");
                    return [4 /*yield*/, framework_1.framework.createTask({
                            type: "dependency-check",
                            priority: framework_1.TaskPriority.MEDIUM,
                            description: "Check for outdated dependencies",
                            data: {
                                generateReport: true,
                            },
                            context: {},
                        })];
                case 3:
                    checkTask = _c.sent();
                    console.log("Created task: ".concat(checkTask.id));
                    agents = framework_1.framework.findAgentsForTaskType("dependency-check");
                    console.log("Found ".concat(agents.length, " agents that can handle dependency-check tasks"));
                    if (!(agents.length === 0)) return [3 /*break*/, 5];
                    console.error("No agents found that can handle dependency-check tasks");
                    return [4 /*yield*/, framework_1.framework.shutdown()];
                case 4:
                    _c.sent();
                    return [2 /*return*/];
                case 5:
                    agent = agents[0].instance;
                    console.log("Assigning task to agent: ".concat(agent.name));
                    return [4 /*yield*/, agent.handleTask(checkTask)];
                case 6:
                    result = _c.sent();
                    // Print the result
                    if (result.status === framework_1.TaskStatus.COMPLETED) {
                        console.log("\nTask completed successfully");
                        console.log("Result:", result.result.message);
                        if (result.result.dependencies &&
                            Object.keys(result.result.dependencies).length > 0) {
                            console.log("\nOutdated dependencies:");
                            for (_i = 0, _a = Object.entries(result.result.dependencies); _i < _a.length; _i++) {
                                _b = _a[_i], name_1 = _b[0], info = _b[1];
                                console.log("  ".concat(name_1, ": ").concat(info.current, " -> ").concat(info.latest, " (").concat(info.type, ")"));
                            }
                            if (result.result.reportPath) {
                                console.log("\nReport generated at: ".concat(result.result.reportPath));
                            }
                        }
                    }
                    else {
                        console.error("\nTask failed:", result.error);
                    }
                    return [4 /*yield*/, framework_1.framework.createTask({
                            type: "security-audit",
                            priority: framework_1.TaskPriority.HIGH,
                            description: "Check for security vulnerabilities",
                            data: {
                                generateReport: true,
                            },
                            context: {},
                        })];
                case 7:
                    auditTask = _c.sent();
                    console.log("\nCreated task: ".concat(auditTask.id));
                    return [4 /*yield*/, agent.handleTask(auditTask)];
                case 8:
                    auditResult = _c.sent();
                    // Print the result
                    if (auditResult.status === framework_1.TaskStatus.COMPLETED) {
                        console.log("Task completed successfully");
                        console.log("Result:", auditResult.result.message);
                        if (auditResult.result.vulnerabilityCounts &&
                            auditResult.result.vulnerabilityCounts.total > 0) {
                            console.log("\nVulnerability summary:");
                            console.log("  Critical: ".concat(auditResult.result.vulnerabilityCounts.critical));
                            console.log("  High:     ".concat(auditResult.result.vulnerabilityCounts.high));
                            console.log("  Moderate: ".concat(auditResult.result.vulnerabilityCounts.moderate));
                            console.log("  Low:      ".concat(auditResult.result.vulnerabilityCounts.low));
                            console.log("  Info:     ".concat(auditResult.result.vulnerabilityCounts.info));
                            console.log("  Total:    ".concat(auditResult.result.vulnerabilityCounts.total));
                            if (auditResult.result.reportPath) {
                                console.log("\nReport generated at: ".concat(auditResult.result.reportPath));
                            }
                        }
                    }
                    else {
                        console.error("\nTask failed:", auditResult.error);
                    }
                    // Shutdown the framework
                    return [4 /*yield*/, framework_1.framework.shutdown()];
                case 9:
                    // Shutdown the framework
                    _c.sent();
                    console.log("\nFramework shutdown successfully");
                    return [3 /*break*/, 12];
                case 10:
                    error_1 = _c.sent();
                    console.error("Error:", error_1);
                    return [4 /*yield*/, framework_1.framework.shutdown()];
                case 11:
                    _c.sent();
                    process.exit(1);
                    return [3 /*break*/, 12];
                case 12: return [2 /*return*/];
            }
        });
    });
}
// Run the example
main();
