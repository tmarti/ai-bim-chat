import initialSuggestion from '../prompts/initialSuggestions.md?raw';
import { resolve } from "../ioc/inversify.config";
import { generateMessageId } from '../utils/getMessageId';
import { env } from './env';

export type InitAppProps = {
  models: string[];
  database: string;
}

export const loadModelAndInitalizeChat = async ({ models, database }: InitAppProps) => {
  for (let i = 0; i < models.length; i++) {
    await resolve('ViewerService').loadModel(`model-${i}`, models[i]);
  }
  await resolve('DatabaseService').loadDatabase(database);

  const messageManager = resolve('MessageManagerService');  

  messageManager.addMessage({
    id: generateMessageId(),
    text: `How can I assist you?`,
    who: 'system',
  });

  if (env.showInitialSuggestions) {
    messageManager.addMessage({
      id: generateMessageId(),
      text: initialSuggestion,
      who: 'suggestion',
      // hidden: true,
    });
  }
}
