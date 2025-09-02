import { AppState, IStateStoreService } from '../state/StoreService';
import { IMessageManagerService } from '../state/MessageManagerService';
import { Message } from '../state/Dto/Message';
import { talkToToolsBasedAgent } from '../agents/toolsBasedAgent';
import { IThinkingIndicatorService } from '../state/ThinkingIndicatorService';
import { generateMessageId } from '../utils/getMessageId';

export class AiMessageHandler {
    private unsubscribeFromStore: () => void;
    private lastProcessedMessage: Message | null = null;

    constructor(
        private store: IStateStoreService<AppState>,
        private messageManager: IMessageManagerService,
        private thinkingManager: IThinkingIndicatorService,
    ) {
        this.unsubscribeFromStore = this.store.subscribe(this.handleNewMessage.bind(this));
    }

    private shouldProcessMessage(state: AppState) {
        if (this.lastProcessedMessage?.id !== state.messages[state.messages.length - 1].id) {
            this.lastProcessedMessage = state.messages[state.messages.length - 1];
            return true;
        }
        return false;
    }

    private getMessageToProcess(state: AppState) {
        if (!this.shouldProcessMessage(state)) {
            return null;
        }

        const lastMessage = state.messages[state.messages.length - 1];

        if (lastMessage?.who !== 'user') {
            return null;
        }

        return lastMessage;
    }

    // Handle new messages from the message list
    private async handleNewMessage(state: AppState) {
        const lastMessage = this.getMessageToProcess(state);

        // If the last message is from the user, initiate AI response
        if (!lastMessage) {
            return;
        }

        this.thinkingManager.setThinking({ busy: true });

        this.injectEmptySystemMessage(); // Insert a placeholder message for AI response
        await this.handleAiResponse(); // Talk to AI and stream the response

        this.thinkingManager.setThinking({ busy: false });
    }

    // Inject an empty message to indicate the AI is "thinking"
    private injectEmptySystemMessage() {
        this.messageManager.addMessage({
            id: generateMessageId(),
            text: '',
            who: 'system',
        });
    }

    // Handle the AI response, streaming it to the MessageList
    private async handleAiResponse() {
        const messages = this.store.value.messages.slice(0, -1).filter(m => m.who !== 'suggestion');

        await talkToToolsBasedAgent(
            messages,
            this.updateLastMessageWhileStreaming.bind(this)
        );

        console.log(this.store.value.messages.at(-1)?.text);

        this.messageManager.updateLastMessage({ isStreaming: false });
    }

    private updateLastMessageWhileStreaming(text: string) {
        this.messageManager.updateLastMessage({ text, isStreaming: true });
    }

    // Clean up subscriptions when necessary
    public cleanup() {
        this.unsubscribeFromStore();
    }
}
