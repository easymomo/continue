"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
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
exports.MCPAdapter = void 0;
var vscode = require("vscode");
/**
 * Adapter for VS Code's MCP system
 * This discovers and interacts with registered MCP servers
 */
var MCPAdapter = /** @class */ (function () {
    function MCPAdapter() {
        var _this = this;
        // Track available MCP servers and their tools
        this.servers = new Map();
        // Initialize and register for MCP events
        this.discoverServers();
        // Listen for changes in MCP server registrations
        vscode.workspace.onDidChangeConfiguration(function (e) {
            if (e.affectsConfiguration("mcp")) {
                _this.discoverServers();
            }
        });
    }
    /**
     * Discover available MCP servers registered in VS Code
     */
    MCPAdapter.prototype.discoverServers = function () {
        return __awaiter(this, void 0, void 0, function () {
            var servers, _i, servers_1, server, error_1;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Discovering MCP servers...");
                        return [4 /*yield*/, vscode.commands.executeCommand("mcp.listServers")];
                    case 1:
                        servers = (_a.sent());
                        if (!servers || !Array.isArray(servers)) {
                            console.log("No MCP servers found or MCP API not available");
                            return [2 /*return*/];
                        }
                        this.servers.clear();
                        for (_i = 0, servers_1 = servers; _i < servers_1.length; _i++) {
                            server = servers_1[_i];
                            this.servers.set(server.id, server);
                        }
                        console.log("Discovered ".concat(this.servers.size, " MCP servers"));
                        return [3 /*break*/, 3];
                    case 2:
                        error_1 = _a.sent();
                        console.error("Failed to discover MCP servers:", error_1);
                        return [3 /*break*/, 3];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Get all available MCP tools across all servers
     */
    MCPAdapter.prototype.getAvailableTools = function () {
        return __awaiter(this, void 0, void 0, function () {
            var tools, serverEntries, _loop_1, _i, serverEntries_1, _a, serverId, server;
            return __generator(this, function (_b) {
                switch (_b.label) {
                    case 0:
                        tools = [];
                        serverEntries = Array.from(this.servers.entries());
                        _loop_1 = function (serverId, server) {
                            var serverTools, error_2;
                            return __generator(this, function (_c) {
                                switch (_c.label) {
                                    case 0:
                                        _c.trys.push([0, 2, , 3]);
                                        console.log("Getting tools for server ".concat(serverId, "..."));
                                        return [4 /*yield*/, vscode.commands.executeCommand("mcp.listTools", serverId)];
                                    case 1:
                                        serverTools = (_c.sent());
                                        if (!serverTools || !Array.isArray(serverTools)) {
                                            console.log("No tools found for server ".concat(serverId));
                                            return [2 /*return*/, "continue"];
                                        }
                                        tools.push.apply(tools, serverTools.map(function (tool) { return (__assign(__assign({}, tool), { serverId: serverId })); }));
                                        console.log("Found ".concat(serverTools.length, " tools for server ").concat(serverId));
                                        return [3 /*break*/, 3];
                                    case 2:
                                        error_2 = _c.sent();
                                        console.error("Failed to get tools for server ".concat(serverId, ":"), error_2);
                                        return [3 /*break*/, 3];
                                    case 3: return [2 /*return*/];
                                }
                            });
                        };
                        _i = 0, serverEntries_1 = serverEntries;
                        _b.label = 1;
                    case 1:
                        if (!(_i < serverEntries_1.length)) return [3 /*break*/, 4];
                        _a = serverEntries_1[_i], serverId = _a[0], server = _a[1];
                        return [5 /*yield**/, _loop_1(serverId, server)];
                    case 2:
                        _b.sent();
                        _b.label = 3;
                    case 3:
                        _i++;
                        return [3 /*break*/, 1];
                    case 4: return [2 /*return*/, tools];
                }
            });
        });
    };
    /**
     * Execute an MCP tool
     */
    MCPAdapter.prototype.executeTool = function (serverId, toolName, args) {
        return __awaiter(this, void 0, void 0, function () {
            var error_3;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        console.log("Executing tool ".concat(toolName, " on server ").concat(serverId, " with args:"), args);
                        return [4 /*yield*/, vscode.commands.executeCommand("mcp.executeTool", serverId, toolName, args)];
                    case 1: 
                    // This is placeholder code - the actual API will need to be determined
                    // from VS Code's MCP documentation when it becomes available
                    return [2 /*return*/, _a.sent()];
                    case 2:
                        error_3 = _a.sent();
                        console.error("Failed to execute tool ".concat(toolName, " on server ").concat(serverId, ":"), error_3);
                        throw error_3;
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    /**
     * Check if MCP is available in this VS Code instance
     */
    MCPAdapter.prototype.isMCPAvailable = function () {
        return __awaiter(this, void 0, void 0, function () {
            var error_4;
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        _a.trys.push([0, 2, , 3]);
                        // Try to execute a harmless MCP command to see if the API is available
                        return [4 /*yield*/, vscode.commands.executeCommand("mcp.listServers")];
                    case 1:
                        // Try to execute a harmless MCP command to see if the API is available
                        _a.sent();
                        return [2 /*return*/, true];
                    case 2:
                        error_4 = _a.sent();
                        console.log("MCP API not available:", error_4);
                        return [2 /*return*/, false];
                    case 3: return [2 /*return*/];
                }
            });
        });
    };
    return MCPAdapter;
}());
exports.MCPAdapter = MCPAdapter;
