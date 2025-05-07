import { BaseChatModel } from "@langchain/core/language_models/chat_models";
import { AIMessage, BaseMessage, HumanMessage } from "@langchain/core/messages";
import { Tool } from "@langchain/core/tools";
import { Command } from "@langchain/langgraph";
import { TaskManager } from "../../memory/tasks/index.js";
import {
  AgentCommunicationProtocol,
  MessagePriority,
} from "../communication/index.js";
import { AgentType, BaseAgent } from "../core/types.js";
import {
  TaskSystemAdapter,
  createTaskSystemAdapter,
} from "../framework/task-system-adapter.js";
import {
  determineNextResearchStage,
  extractResearchTopic,
  getCoordinationReason,
  isNewResearchRequest,
  shouldReturnToCoordinator,
} from "./research/researchHelpers.js";
import {
  ResearchTaskManager,
  ResearchWorkflowStage,
} from "./research/researchTaskManager.js";

/**
 * Configuration for the ResearchAgent
 */
export interface ResearchAgentConfig {
  id: string;
  name: string;
  description: string;
  model: BaseChatModel;
  tools?: Tool[];
  communicationProtocol?: AgentCommunicationProtocol;
  useTaskMemory?: boolean;
}

/**
 * Research agent - specializes in data gathering, analysis, and information synthesis
 */
export class ResearchAgent extends BaseAgent {
  private systemPrompt: string;
  private communicationProtocol?: AgentCommunicationProtocol;
  private researchTaskManager?: ResearchTaskManager;
  private taskManager: TaskManager;
  private taskSystemAdapter?: TaskSystemAdapter;
  private useTaskMemory: boolean;

  constructor(config: ResearchAgentConfig) {
    super(
      config.id,
      AgentType.RESEARCH,
      config.name,
      config.description,
      config.model,
      config.tools || [],
    );

    this.useTaskMemory = config.useTaskMemory || false;

    // Initialize task manager
    this.taskManager = new TaskManager(this.getTransactionManager());

    // Store the communication protocol if provided
    this.communicationProtocol = config.communicationProtocol;

    // Initialize the task system adapter if using task memory
    if (this.useTaskMemory) {
      // This will be properly initialized in the initialize() method
      this.initializeTaskSystem();
    }

    this.systemPrompt = `You are the Research Agent - an expert in finding, analyzing, and synthesizing information.
Your role is to gather data, research topics, and provide well-sourced information.

Your responsibilities:
1. Search for and collect information from various sources
2. Analyze documentation and technical materials
3. Synthesize complex information into clear summaries
4. Provide factual, accurate information with proper citations
5. Conduct research to fill knowledge gaps

You should:
- Use search tools effectively to find relevant information
- Analyze and summarize complex technical information
- Cite sources when providing information
- Ask clarifying questions when research goals are unclear
- Provide comprehensive but concise research results

Current research workflow stage: PLANNING`;
  }

  /**
   * Initialize the task system for this agent
   */
  private async initializeTaskSystem(): Promise<void> {
    if (this.useTaskMemory) {
      try {
        // Create task system adapter
        this.taskSystemAdapter = await createTaskSystemAdapter(this);

        // Initialize research task manager
        this.researchTaskManager = new ResearchTaskManager(
          this.taskManager,
          this.id,
        );

        console.log(`Task system initialized for research agent: ${this.name}`);
      } catch (error) {
        console.error("Error initializing task system:", error);
      }
    }
  }

  /**
   * Process a message
   */
  public async process(state: {
    messages: BaseMessage[];
  }): Promise<Command | { messages: BaseMessage[] }> {
    // Get the last message
    const lastMessage = state.messages[state.messages.length - 1];
    const lastMessageContent =
      typeof lastMessage.content === "string"
        ? lastMessage.content
        : JSON.stringify(lastMessage.content);

    try {
      // If using task memory, manage the research task
      if (
        this.useTaskMemory &&
        this.researchTaskManager &&
        this.taskSystemAdapter
      ) {
        // Get current task if any
        const currentTask = await this.researchTaskManager.getCurrentTask();

        // Determine if this is a new research request or continuing an existing one
        const isNewResearch = isNewResearchRequest(state.messages, currentTask);

        if (isNewResearch) {
          // Extract research topic
          const topic = extractResearchTopic(lastMessageContent);

          // Create and start new research task
          const taskId = await this.researchTaskManager.createResearchTask(
            topic,
            lastMessageContent,
          );

          await this.researchTaskManager.startResearchTask(taskId);

          // Create research context
          await this.taskSystemAdapter.findOrCreateAgentContext(
            "research_context",
            `Research context for: ${topic}`,
          );

          // Store that we're starting a new research task
          await this.taskSystemAdapter.storeDecision(
            "Start new research task",
            `Creating research task for topic: ${topic}`,
            {
              taskId,
              topic,
              stage: ResearchWorkflowStage.PLANNING,
              timestamp: Date.now(),
            },
          );
        } else if (currentTask) {
          // Update existing task with new information
          await this.researchTaskManager.updateResearchTaskProgress(
            currentTask.id,
            lastMessageContent,
          );

          // Determine if we need to transition to a new stage
          const nextStage = determineNextResearchStage(
            currentTask,
            lastMessageContent,
          );

          if (nextStage) {
            await this.researchTaskManager.transitionResearchStage(
              currentTask.id,
              nextStage,
            );

            // Store the stage transition
            await this.taskSystemAdapter.storeDecision(
              `Transition to ${nextStage} stage`,
              `Moving research to ${nextStage} stage based on user input`,
              {
                taskId: currentTask.id,
                previousStage: currentTask.metadata?.stage,
                newStage: nextStage,
                timestamp: Date.now(),
              },
            );
          }
        }

        // Store the received message
        await this.taskSystemAdapter.storeMessage("user", lastMessageContent, {
          type: "research_request",
          timestamp: Date.now(),
        });
      }

      // Update system prompt with current research stage
      const updatedSystemPrompt = await this.getUpdatedSystemPrompt();

      // Prepare the full context with system prompt
      const fullContext = [
        new HumanMessage(updatedSystemPrompt),
        ...state.messages,
      ];

      // Process the message with the LLM
      const response = await this.model.invoke(fullContext);

      // Get the response content as string to check for coordination phrases
      const responseContent =
        typeof response.content === "string"
          ? response.content
          : JSON.stringify(response.content);

      // Store the response in task memory if enabled
      if (this.useTaskMemory && this.taskSystemAdapter) {
        try {
          // Store the agent's response
          await this.taskSystemAdapter.storeMessage("agent", responseContent, {
            type: "research_response",
            timestamp: Date.now(),
          });

          // Store any key research findings as documents
          if (
            responseContent.includes("key finding") ||
            responseContent.includes("research result")
          ) {
            await this.taskSystemAdapter.storeDocument(
              "Research Findings",
              responseContent,
              "research",
              {
                importance: "high",
                timestamp: Date.now(),
              },
            );

            // If using task manager, store findings with the task
            if (this.researchTaskManager) {
              const currentTask =
                await this.researchTaskManager.getCurrentTask();
              if (currentTask) {
                await this.researchTaskManager.addResearchFinding(
                  currentTask.id,
                  {
                    content: responseContent,
                    source: "agent_analysis",
                    timestamp: Date.now(),
                  },
                );
              }
            }
          }
        } catch (error) {
          console.error("Error storing response in ResearchAgent:", error);
        }
      }

      // After processing, determine if we need to return to the coordinator
      if (shouldReturnToCoordinator(responseContent)) {
        const reason = getCoordinationReason(responseContent);

        // If using task memory, store the handoff decision
        if (this.useTaskMemory && this.taskSystemAdapter) {
          await this.taskSystemAdapter.storeDecision(
            "Handoff to coordinator",
            reason,
            {
              handoffReason: reason,
              timestamp: Date.now(),
            },
          );
        }

        // If we have a communication protocol, use it to create a handoff message
        if (this.communicationProtocol) {
          // Create a context with conversation history
          const agentContext = this.communicationProtocol.createAgentContext(
            [...state.messages, response],
            { handoffReason: reason },
          );

          // Log the handoff through the protocol
          this.communicationProtocol.logMessage(
            this.communicationProtocol.createHandoffMessage(
              this.id,
              "coordinator", // Assuming the coordinator ID is "coordinator"
              reason,
              [...state.messages, response],
              { handoffReason: reason },
              undefined,
              MessagePriority.HIGH,
            ),
          );
        }

        return new Command({
          goto: "coordinator", // Assuming the coordinator's ID is "coordinator"
          update: {
            messages: [
              ...state.messages,
              new AIMessage({
                content: response.content,
              }),
            ],
          },
        });
      }

      // Otherwise, just return the response
      return {
        messages: [...state.messages, response],
      };
    } catch (error) {
      console.error("Error processing message in ResearchAgent:", error);

      // Store the error in task memory if enabled
      if (this.useTaskMemory && this.taskSystemAdapter) {
        try {
          await this.taskSystemAdapter.storeMessage(
            "system",
            `Error processing message: ${error}`,
            {
              error: true,
              timestamp: Date.now(),
            },
          );
        } catch (memoryError) {
          console.error("Error storing error in task memory:", memoryError);
        }
      }

      return {
        messages: [
          ...state.messages,
          new AIMessage({
            content:
              "I encountered an error while processing your research request. Please try again.",
          }),
        ],
      };
    }
  }

  /**
   * Get transaction manager (helper method for initialization)
   */
  private getTransactionManager() {
    // This is a placeholder - in real implementation, this would retrieve
    // the actual transaction manager from a global store or service registry
    return {};
  }

  /**
   * Get the current research stage from the active task
   */
  private async getCurrentResearchStage(): Promise<string | null> {
    if (!this.useTaskMemory || !this.researchTaskManager) {
      return null;
    }

    try {
      const currentTask = await this.researchTaskManager.getCurrentTask();
      if (currentTask && currentTask.metadata?.stage) {
        return currentTask.metadata.stage as string;
      }
    } catch (error) {
      console.error("Error getting current research stage:", error);
    }

    return null;
  }

  /**
   * Get updated system prompt with current research stage
   */
  private async getUpdatedSystemPrompt(): Promise<string> {
    let prompt = this.systemPrompt;

    // Add task-specific information if available
    if (this.useTaskMemory && this.researchTaskManager) {
      const stagePrompts: Record<string, string> = {
        [ResearchWorkflowStage.PLANNING]:
          "\n\nYou are in the PLANNING stage. Focus on understanding the research request, clarifying objectives, and outlining an approach.",
        [ResearchWorkflowStage.GATHERING]:
          "\n\nYou are in the GATHERING stage. Focus on collecting information from various sources, documenting your findings, and citing sources.",
        [ResearchWorkflowStage.ANALYZING]:
          "\n\nYou are in the ANALYZING stage. Focus on examining the information you've gathered, evaluating sources, and identifying patterns and insights.",
        [ResearchWorkflowStage.SYNTHESIZING]:
          "\n\nYou are in the SYNTHESIZING stage. Focus on combining findings into a cohesive narrative, connecting related information, and preparing for the final report.",
        [ResearchWorkflowStage.REPORTING]:
          "\n\nYou are in the REPORTING stage. Focus on creating a clear, well-structured research report with key findings, implications, and citations.",
        [ResearchWorkflowStage.COMPLETED]:
          "\n\nYou are in the COMPLETED stage. The research is complete, you should summarize the outcomes or handle follow-up questions.",
      };

      try {
        // Get current stage and add appropriate guidance
        const currentTask = await this.researchTaskManager.getCurrentTask();
        if (currentTask && currentTask.metadata?.stage) {
          const stage = currentTask.metadata.stage as string;
          if (stagePrompts[stage]) {
            prompt += stagePrompts[stage];
          }
        }
      } catch (err) {
        console.error("Error updating prompt with stage information:", err);
      }
    }

    return prompt;
  }
}
