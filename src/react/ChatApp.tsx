import { useEffect, useRef, useState } from 'react'
import { ChatComponent } from './ChatComponent'
import { handleSuggestionLink, SuggestionLink } from '../utils/handleSuggestionLink'
import { createMarkdownIt } from '../markdown/init-markdown-it'
import objectSuggestion from '../prompts/objectSuggestions.md?raw';
import { useStoreValue } from '../hooks/useStoreValue'
import { resolve } from '../ioc/inversify.config'
import { generateMessageId } from '../utils/getMessageId'

function ChatApp() {

  const messageManager = resolve('MessageManagerService');
  const markdownModeValue = useRef(false);
  const [markdownMode, setMarkdownMode] = useState(false);

  const toggleMarkdownMode = () => {
    document.getElementById('toggle-markdown')!.classList.toggle('toggled');
    markdownModeValue.current = !markdownModeValue.current;
    setMarkdownMode(markdownModeValue.current);
  }

  useEffect(() => {
    document.getElementById('toggle-markdown')!.addEventListener('click', toggleMarkdownMode);

    return () => {
      document.getElementById('toggle-markdown')!.removeEventListener('click', toggleMarkdownMode);
    }
  }, []);

  useEffect(() => {
    // Event handler function
    function handleLinkClick(event: MouseEvent) {
      const target = event.target as HTMLLinkElement;
      if (target && target.tagName === 'A' && target.getAttribute('href')?.startsWith('#')) {
        event.preventDefault();

        handleSuggestionLink(target.getAttribute('href')! as SuggestionLink, messageManager);
      }
    }

    // Attach the event listener
    document.addEventListener('click', handleLinkClick);

    // Cleanup the event listener on component unmount
    return () => {
      document.removeEventListener('click', handleLinkClick);
    };
  }, []);

  const md = useRef(createMarkdownIt());

  const store = resolve('StateStoreService');
  const metadataService = resolve('ModelMetadataService');

  const selectedObjectId = useStoreValue(store, (value) => Array.from(value.selection.ids).join(" ,"));

  useEffect(() => {
    if (!selectedObjectId) {
      return;
    }

    const meta = metadataService.getMetaObject(selectedObjectId);

    if (!meta) {
      return;
    }

    messageManager.addMessage({
      id: generateMessageId(),
      text: `You have selected the \`${meta.type}\` with ID \`${meta.id}\``,
      who: "system",
    });

    messageManager.addMessage({
      id: generateMessageId(),
      text: objectSuggestion,
      who: "suggestion",
    });

  }, [selectedObjectId]);
  
  return (
    <>
      <ChatComponent md={md.current} markdownMode={markdownMode}></ChatComponent>
    </>
  )
}

export default ChatApp
