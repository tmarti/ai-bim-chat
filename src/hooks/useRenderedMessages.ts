import { useStoreValue } from "./useStoreValue";
import {
  RenderedMessage,
  renderMessagesIntoHtml,
} from "../markdown/render-messages";
import { useEffect, useRef, useState } from "react";
import markdownIt from "markdown-it";
import { resolve } from "../ioc/inversify.config";

export const useRenderedMessages = (md: markdownIt, markdownMode: boolean) => {
  const store = resolve('StateStoreService');
  const messages = useStoreValue(store, (value) => value.messages);
  const referenceManager = resolve('ReferenceManagerService');

  const [renderedMessages, setRenderedMessages] = useState<RenderedMessage[]>([]);

  const renderdMessageCache = useRef<Record<string, RenderedMessage>>({});

  useEffect(() => {
    const renderMessages = async () => {
      const rendered = await renderMessagesIntoHtml(
        messages,
        md,
        markdownMode,
        renderdMessageCache.current,
        referenceManager
      );

      setRenderedMessages(rendered);
    };

    renderMessages();
  }, [messages, markdownMode]);
  
  return renderedMessages;
};
