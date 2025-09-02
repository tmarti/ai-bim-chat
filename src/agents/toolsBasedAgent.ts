import { AgentExecutor, createOpenAIFunctionsAgent } from "langchain/agents";
import { pull } from "langchain/hub";
import { ChatPromptTemplate } from "@langchain/core/prompts";
import systemPrompt from "../prompts/systemPrompt.md?raw";
import {
  BaseCallbackHandler,
  CallbackHandlerMethods,
} from "@langchain/core/callbacks/base";
import { Message } from "../state/Dto/Message";
import { mapMessagesToLangchain } from "./utils/langchainMessageMapper";
import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { resolve } from "../ioc/inversify.config";
import { toolNames } from "../services/ToolRegistryService";
import { renderTextDescriptionAndArgs } from "langchain/tools/render";
import { IReferenceManagerService, OverviewReference } from "../state/ReferenceManagerService";

let cached: { agentExecutor: AgentExecutor } | undefined;

const initializeIfNeeded = async () => {
  if (cached) {
    return cached;
  }

  // Available AI tools
  const llm = resolve('OpenaiLlmService').getModel();
  const tools = resolve('ToolRegistryService').getRegisteredTools();

  // Get the prompt to use - you can modify this!
  // If you want to see the prompt in full, you can at:
  // https://smith.langchain.com/hub/hwchase17/openai-functions-agent
  const prompt = await pull<ChatPromptTemplate>(
    "hwchase17/openai-functions-agent"
  );

  const agent = await createOpenAIFunctionsAgent({
    llm,
    tools,
    prompt,
  });

  // Initialize the agent executor
  const agentExecutor = new AgentExecutor({
    agent,
    tools,
  });

  // @ts-ignore
  window.toolsDescription = renderTextDescriptionAndArgs(tools);

  cached = { agentExecutor };

  return cached;
};

// Function to handle user input
async function invokeAgent(messages: (SystemMessage | HumanMessage)[]) {
  const { agentExecutor } = await initializeIfNeeded();
  const thinkingManager = resolve('ThinkingIndicatorService');
  const logger = resolve('LogService');
  let tToolStart = -1;
  let tToolEnd = performance.now();
  // Create an async generator function to stream the response
  async function* streamResponse() {
    const queue: string[] = [];
    let isDone = false;

    // Callback handlers to process streaming tokens
    const callbacks: BaseCallbackHandler | CallbackHandlerMethods = {
      // handleChainStart(chain, inputs, runId, parentRunId, tags, metadata, runType, runName) {
      //   logger.log("agent", `⏳ chain-start: ${runName}`);
      // },
      handleLLMNewToken: (token: string) => {
        if (token != '') {
          // logger.log("agent", `⏳ llm-token: ${token}`);
          queue.push(token);
        }
      },
      // handleLLMStart: () => {
      //   logger.log("agent", `⚙️ llm-start`);
      // },
      handleAgentEnd: () => {
        logger.log("agent", `🛑 agent-end`);
        isDone = true;
      },
      // handleAgentAction: (action) => {
      //   logger.log("agent", `agent-action: ${action.log}`);
      // },
      handleToolStart(
        tool,
        _input,
        _runId,
        _envparentRunId,
        _tags,
        _metadata,
        runName
      ) {
        tToolStart = performance.now();
        logger.log("agent", `⏳ tool-start: ${tool.id} - ${(tToolStart - tToolEnd).toFixed(2)}ms to invoke`);
        thinkingManager.setThinking({
          // busy: true,
          message: runName as toolNames,
        });
      },
      handleToolEnd: () => {
        tToolEnd = performance.now(); 
        logger.log("agent", `⏳ tool-end: ${(tToolEnd - tToolStart).toFixed(2)}ms to run`);
        thinkingManager.setThinking({ 
          message: undefined,
        });
      },
    };

    agentExecutor.invoke(
      {
        input: messages.at(-1)?.content,
        chat_history: [new SystemMessage(systemPrompt), ...messages.slice(0, -1)],
      },
      {
        callbacks: [callbacks],
      }
    );

    // Yield tokens as they become available
    while (!isDone || queue.length > 0) {
      if (queue.length > 0) {
        const tata = queue.shift();
        yield tata;
      } else {
        // Wait briefly before checking the queue again
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }
  }

  return streamResponse();
}

const getEmbeddedMarkdownReference = (text: string, referenceManager: IReferenceManagerService) => {
  if (!text.startsWith('```embedded-markdown')) {
    return null;
  }

  if (text.endsWith('```') && text.split('\n').length == 3) {
    const referenceId = text.split('\n')[1].trim() as OverviewReference;
    const reference = referenceManager.getOverview(referenceId);
    if (reference) {
      return referenceId;
    }
  }

  return null;
}

const suppressEmbeddedMarkdownFenceBlock = (text: string) => {
  if (text.startsWith('```embedded-markdown')) {
    return '';
  }

  return text;
}

export async function talkToToolsBasedAgent(messages: Message[], onUpdate: (respnseSoFar: string) => void) {
  const langchainMessages = mapMessagesToLangchain(messages);

  const responseStream = await invokeAgent(langchainMessages)

  let response = '';
  let markdownReference: OverviewReference | null = null;

  const referenceManager = resolve('ReferenceManagerService');
  
  for await (const chunk of responseStream) {
      response += chunk;

      markdownReference = getEmbeddedMarkdownReference(response, referenceManager);

      if (markdownReference) {
        break;
      }

      onUpdate(
        suppressEmbeddedMarkdownFenceBlock(response)
      );
  }

  if (markdownReference) {
    let lastMarkdown = '';

    let overview = referenceManager.getOverview(markdownReference)!;
    
    while (!overview?.finished) {
      overview = referenceManager.getOverview(markdownReference)!;
      if (overview.text != lastMarkdown) {
        lastMarkdown = overview.text;
        onUpdate(lastMarkdown);
      } else {
        await new Promise((resolve) => setTimeout(resolve, 10));
      }
    }

    overview = referenceManager.getOverview(markdownReference)!;
    onUpdate(overview.text);
  }
}