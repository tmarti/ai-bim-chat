import markdownIt from "markdown-it";
import { Message, MessageWho } from "../state/Dto/Message";
import { IReferenceManagerService, OverviewReference } from "../state/ReferenceManagerService";
import { MarkdownItEnv } from "./init-markdown-it";

export interface RenderedMessage {
  id: string;
  html: string;
  who: MessageWho;
}

export const renderMessagesIntoHtml = async (
  messages: Message[],
  md: markdownIt,
  markdownMode: boolean,
  renderdMessageCache: Record<string, RenderedMessage>,
  referenceManager: IReferenceManagerService
) => {
  const renderMessage = (msg: Message, msgIndex: number) => {
    const env: MarkdownItEnv = {
      isStreaming: !!msg.isStreaming,
      msgIndex,
      referenceManager,
      message: msg,
    };

    let html: string;

    if (markdownMode) {
      html = `<pre style="white-space: pre-wrap;">${msg.text}</pre>`;
    } else {
      html = md.render(msg.text, env);
    }

    // html = DOMPurify.sanitize(html, { SAFE_FOR_TEMPLATES: true });

    return { id: msg.id, html, who: msg.who };
  };

  const renderMessageUsingCache = (msg: Message, msgIndex: number) => {
    const useCache = !markdownMode && msgIndex !== mesagesToConsider.length - 1;
    const id = msg.id;

    if (id in renderdMessageCache && useCache) {
      return renderdMessageCache[id];
    }

    const rendered = renderMessage(msg, msgIndex);

    if (useCache) {
      renderdMessageCache[id] = rendered;
    }

    return rendered;
  };

  const mesagesToConsider = messages
    .filter((m) => !m.hidden)
    .filter((m, index) => m.who !== "suggestion" || index === messages.length - 1);

  return mesagesToConsider.map(renderMessageUsingCache);
};
