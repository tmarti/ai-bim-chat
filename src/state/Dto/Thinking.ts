import { toolNames } from "../../services/ToolRegistryService";

export type thinkingMessage = toolNames | 'Analyzing data insights...' | 'Coming up with some suggestions...';

export interface ThinkingState {
    busy: boolean;
    message?: thinkingMessage;
}
