import { TYPES } from "../ioc/types";
import { Message } from "./Dto/Message";
import { AppState, IStateStoreService } from "./StoreService";
import { inject, injectable } from "inversify";

/**
 * Interface for a message manager service.
 * 
 * This service is used to store messages in the chat history.
 */
@injectable()
export abstract class IMessageManagerService {
  /**
   * Add a message to the chat history  .
   * 
   * @param message - The message to add.
   */
  abstract addMessage(message: Message): void;

  /**
   * Update the last message in the chat history.
   * 
   * @param content - The content to update the last message with.
   */
  abstract updateLastMessage(content: Partial<Message>): void;
}

const extractReasoningBlocksFromMessageText = (message: string) => {
  const lines = message.split('\n');

  let insideBlock = false;
  let tmpBlock = '';
  let simplifiedMessage = '';

  const reasoningBlocks: string[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (line.startsWith('```conclusion-reason')) {
      insideBlock = true;
    } else if (insideBlock && line.startsWith('```')) {
      reasoningBlocks.push(tmpBlock);
      insideBlock = false;
      tmpBlock = '';
    } else if (insideBlock) {
      tmpBlock += line + '\n';
    } else {
      simplifiedMessage += line + '\n';
    }
  }

  return { message: simplifiedMessage, reasoningBlocks };
}

export class MessageManagerService implements IMessageManagerService {
  constructor(
    @inject(TYPES.StateStoreService) private store: IStateStoreService<AppState>,
  ) {}

  addMessage(message: Message): void {
    this.store.update((state) => ({
      ...state,
      messages: [...state.messages, message],
    }));
  }

  updateLastMessage(content: Partial<Message>): void {
    let lastMessage! : Message | undefined;

    this.store.update((state) => {
      lastMessage = {
        ...state.messages[state.messages.length - 1],
        ...content,
      };

      return {
        ...state,
        messages: state.messages.map((msg, idx) =>
          idx === state.messages.length - 1 ? lastMessage! : msg
        ),
      }
    });

    if (lastMessage === undefined) {
      return;
    }
  }
}
