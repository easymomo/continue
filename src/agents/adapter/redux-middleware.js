"use strict";
/**
 * Redux Middleware for Agent System
 *
 * This middleware intercepts relevant Redux actions and routes them
 * through our agent system. It specifically targets the thunks that
 * handle LLM communication.
 */
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
exports.applyAgentPatches = exports.patchCallToolThunk = exports.patchStreamNormalInputThunk = exports.patchStreamResponseThunk = exports.createAgentMiddleware = void 0;
/**
 * Create a middleware that intercepts relevant Redux actions
 */
var createAgentMiddleware = function (agentAdapter) {
    return function (store) { return function (next) { return function (action) {
        // Check the action type
        if (action.type === "chat/streamResponse/pending") {
            // Intercept the streamResponseThunk action
            console.log("Agent middleware intercepted streamResponse action");
            // The actual interception will happen in the thunks
            // This is just for demonstration/logging
        }
        else if (action.type === "chat/callTool/pending") {
            // Intercept the callTool action
            console.log("Agent middleware intercepted callTool action");
            // The actual interception will happen in the thunks
        }
        else if (action.type === "chat/streamAfterToolCall/pending") {
            // Intercept the streamResponseAfterToolCall action
            console.log("Agent middleware intercepted streamAfterToolCall action");
            // The actual interception will happen in the thunks
        }
        // Continue to the next middleware
        return next(action);
    }; }; };
};
exports.createAgentMiddleware = createAgentMiddleware;
/**
 * Monkey patch the thunk functions to intercept their flow
 * Note: This is a more invasive approach and should be used carefully
 */
var patchStreamResponseThunk = function (originalThunk, agentAdapter) {
    return function patchedStreamResponseThunk(payload, thunkAPI) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Patched streamResponseThunk called");
                        return [4 /*yield*/, originalThunk(payload, thunkAPI)];
                    case 1: 
                    // Call the original thunk
                    // In a real implementation, we would intercept before the LLM call
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
};
exports.patchStreamResponseThunk = patchStreamResponseThunk;
/**
 * Patch the streamNormalInput thunk
 */
var patchStreamNormalInputThunk = function (originalThunk, agentAdapter) {
    return function patchedStreamNormalInputThunk(payload, thunkAPI) {
        return __awaiter(this, void 0, void 0, function () {
            var tools, processedMessages, error_1;
            var _a, _b;
            return __generator(this, function (_c) {
                switch (_c.label) {
                    case 0:
                        console.log("Patched streamNormalInput called");
                        if (!(payload.messages && Array.isArray(payload.messages))) return [3 /*break*/, 4];
                        _c.label = 1;
                    case 1:
                        _c.trys.push([1, 3, , 4]);
                        tools = ((_b = (_a = thunkAPI.getState().config) === null || _a === void 0 ? void 0 : _a.config) === null || _b === void 0 ? void 0 : _b.tools) || [];
                        return [4 /*yield*/, agentAdapter.interceptMessages(payload.messages, tools, payload.legacySlashCommandData)];
                    case 2:
                        processedMessages = _c.sent();
                        // Update the payload with processed messages
                        payload = __assign(__assign({}, payload), { messages: processedMessages });
                        return [3 /*break*/, 4];
                    case 3:
                        error_1 = _c.sent();
                        console.error("Error in agent processing:", error_1);
                        return [3 /*break*/, 4];
                    case 4: return [4 /*yield*/, originalThunk(payload, thunkAPI)];
                    case 5: 
                    // Call the original thunk with (potentially) modified payload
                    return [2 /*return*/, _c.sent()];
                }
            });
        });
    };
};
exports.patchStreamNormalInputThunk = patchStreamNormalInputThunk;
/**
 * Patch the callTool thunk
 */
var patchCallToolThunk = function (originalThunk, agentAdapter) {
    return function patchedCallToolThunk(payload, thunkAPI) {
        return __awaiter(this, void 0, void 0, function () {
            return __generator(this, function (_a) {
                switch (_a.label) {
                    case 0:
                        console.log("Patched callTool called");
                        return [4 /*yield*/, originalThunk(payload, thunkAPI)];
                    case 1: 
                    // Call the original thunk
                    // We could intercept here to route tool calls through specialized agents
                    return [2 /*return*/, _a.sent()];
                }
            });
        });
    };
};
exports.patchCallToolThunk = patchCallToolThunk;
/**
 * Apply all patches
 */
var applyAgentPatches = function (thunks, agentAdapter) {
    return __assign(__assign({}, thunks), { streamResponseThunk: (0, exports.patchStreamResponseThunk)(thunks.streamResponseThunk, agentAdapter), streamNormalInput: (0, exports.patchStreamNormalInputThunk)(thunks.streamNormalInput, agentAdapter), callTool: (0, exports.patchCallToolThunk)(thunks.callTool, agentAdapter) });
};
exports.applyAgentPatches = applyAgentPatches;
