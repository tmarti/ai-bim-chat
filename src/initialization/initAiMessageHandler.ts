import { AiMessageHandler } from "../ai/AiMessageHandler";
import { resolve } from "../ioc/inversify.config";

export const initAiMessageHandler = () => {
  const store = resolve('StateStoreService');
  const messageManager = resolve('MessageManagerService');
  const thinkingManager = resolve('ThinkingIndicatorService');

  return new AiMessageHandler(store, messageManager, thinkingManager);
}