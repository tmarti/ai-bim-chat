import { AIMessageChunk, HumanMessage, SystemMessage } from "@langchain/core/messages";
import { ChatOpenAI } from "@langchain/openai";
import { env } from "../initialization/env";
import { injectable } from "inversify";
import { IterableReadableStream } from "@langchain/core/utils/stream";

/**
 * Interface for an OpenAI LLM service.
 * 
 * This service is used to interact with the AI model.
 */
@injectable()
export abstract class IOpenaiLlmService {
  abstract getModel(): ChatOpenAI;
  abstract getResponse(prompt: string): Promise<AIMessageChunk>;
  abstract getSimpleResponse(messages: (SystemMessage | HumanMessage)[]): Promise<string>;
  abstract getSimpleResponseFromText(text: string): Promise<string>;
  abstract getSimpleResponseStreamFromText(text: string): Promise<IterableReadableStream<AIMessageChunk>>;
  abstract getAdvancedResponse(prompt: string): Promise<IterableReadableStream<AIMessageChunk>>;
  abstract getSimpleResponseFromTextPromiseFriendly(text: string): Promise<string>;
}

export class OpenaiLlmService implements IOpenaiLlmService {
  private llm: ChatOpenAI;
  private advancedLlm: ChatOpenAI;
  private simpleLlm: ChatOpenAI;

  constructor() {
    this.llm = new ChatOpenAI({
      apiKey: env.openAIApiKey,
      temperature: 0,
      streaming: true,
      model: "gpt-4o",
    });

    this.advancedLlm = new ChatOpenAI({
      apiKey: env.openAIApiKey,
      temperature: 0,
      streaming: true,
      model: "gpt-4o",
    });
    
    this.simpleLlm = new ChatOpenAI({
      apiKey: env.openAIApiKey,
      temperature: 0,
      streaming: false,
      model: "gpt-4o-mini",
    })
  }

  getModel(): ChatOpenAI {
    return this.llm;
  }

  async getResponse(prompt: string): Promise<AIMessageChunk> {
    return this.llm.invoke(prompt);
  }

  async getAdvancedResponse(prompt: string): Promise<IterableReadableStream<AIMessageChunk>> {
    const retVal = await this.advancedLlm.stream(prompt);
    return retVal;
  }

  async getSimpleResponse(messages: (SystemMessage | HumanMessage)[]): Promise<string> {
      const retVal = await this.simpleLlm.invoke(messages);
      return retVal.content.toString();
  }

  async getSimpleResponseFromText(text: string): Promise<string> {
    const simpleLlm = new ChatOpenAI({
      apiKey: env.openAIApiKey,
      temperature: 0,
      streaming: false,
      model: "gpt-4o-mini",
    });

    const retVal = await simpleLlm.invoke(text);
    return retVal.content.toString();
  }

  async getSimpleResponseStreamFromText(text: string): Promise<IterableReadableStream<AIMessageChunk>> {
    const simpleLlm = new ChatOpenAI({
      apiKey: env.openAIApiKey,
      temperature: 0,
      streaming: false,
      model: "gpt-4o-mini",
    });
    const retVal = await simpleLlm.stream(text);
    return retVal;
  }

  async getSimpleResponseFromTextPromiseFriendly(text: string): Promise<string> {
    const response = await this.getSimpleResponseStreamFromText(text);

    let retVal = '';

    for await (const chunk of response) {
      retVal += chunk.content;
    }

    return retVal;
  }
}

