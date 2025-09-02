export type MessageWho = 'system' | 'user' | 'suggestion' ;

export type Message = {
    id: string;
    text: string;
    who: MessageWho;
    hidden?: boolean;
    isStreaming?: boolean;
    isolatedMessage?: boolean;
};