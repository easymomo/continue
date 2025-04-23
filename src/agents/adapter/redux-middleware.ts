/**
 * Redux Middleware for Agent System
 *
 * This middleware intercepts relevant Redux actions and routes them
 * through our agent system. It specifically targets the thunks that
 * handle LLM communication.
 */

import { Middleware } from "redux";
import { AgentAdapter } from "./index";

/**
 * Create a middleware that intercepts relevant Redux actions
 */
export const createAgentMiddleware = (
  agentAdapter: AgentAdapter,
): Middleware => {
  return (store) => (next) => (action) => {
    // Check the action type
    if (action.type === "chat/streamResponse/pending") {
      // Intercept the streamResponseThunk action
      console.log("Agent middleware intercepted streamResponse action");

      // The actual interception will happen in the thunks
      // This is just for demonstration/logging
    } else if (action.type === "chat/callTool/pending") {
      // Intercept the callTool action
      console.log("Agent middleware intercepted callTool action");

      // The actual interception will happen in the thunks
    } else if (action.type === "chat/streamAfterToolCall/pending") {
      // Intercept the streamResponseAfterToolCall action
      console.log("Agent middleware intercepted streamAfterToolCall action");

      // The actual interception will happen in the thunks
    }

    // Continue to the next middleware
    return next(action);
  };
};

/**
 * Monkey patch the thunk functions to intercept their flow
 * Note: This is a more invasive approach and should be used carefully
 */
export const patchStreamResponseThunk = (
  originalThunk: Function,
  agentAdapter: AgentAdapter,
): Function => {
  return async function patchedStreamResponseThunk(
    payload: any,
    thunkAPI: any,
  ) {
    console.log("Patched streamResponseThunk called");

    // Call the original thunk
    // In a real implementation, we would intercept before the LLM call
    return await originalThunk(payload, thunkAPI);
  };
};

/**
 * Patch the streamNormalInput thunk
 */
export const patchStreamNormalInputThunk = (
  originalThunk: Function,
  agentAdapter: AgentAdapter,
): Function => {
  return async function patchedStreamNormalInputThunk(
    payload: any,
    thunkAPI: any,
  ) {
    console.log("Patched streamNormalInput called");

    // This is where we would intercept the messages before they go to the LLM
    if (payload.messages && Array.isArray(payload.messages)) {
      // Process messages through our agent system
      try {
        const tools = thunkAPI.getState().config?.config?.tools || [];
        const processedMessages = await agentAdapter.interceptMessages(
          payload.messages,
          tools,
          payload.legacySlashCommandData,
        );

        // Update the payload with processed messages
        payload = {
          ...payload,
          messages: processedMessages,
        };
      } catch (error) {
        console.error("Error in agent processing:", error);
        // Continue with original messages if there's an error
      }
    }

    // Call the original thunk with (potentially) modified payload
    return await originalThunk(payload, thunkAPI);
  };
};

/**
 * Patch the callTool thunk
 */
export const patchCallToolThunk = (
  originalThunk: Function,
  agentAdapter: AgentAdapter,
): Function => {
  return async function patchedCallToolThunk(payload: any, thunkAPI: any) {
    console.log("Patched callTool called");

    // Call the original thunk
    // We could intercept here to route tool calls through specialized agents
    return await originalThunk(payload, thunkAPI);
  };
};

/**
 * Apply all patches
 */
export const applyAgentPatches = (
  thunks: Record<string, Function>,
  agentAdapter: AgentAdapter,
): Record<string, Function> => {
  return {
    ...thunks,
    streamResponseThunk: patchStreamResponseThunk(
      thunks.streamResponseThunk,
      agentAdapter,
    ),
    streamNormalInput: patchStreamNormalInputThunk(
      thunks.streamNormalInput,
      agentAdapter,
    ),
    callTool: patchCallToolThunk(thunks.callTool, agentAdapter),
  };
};
