import "reflect-metadata";
import './react/css/App.css'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import ChatApp from './react/ChatApp.tsx'
import './react/css/index.css'
import SnapshotApp from './react/SnapshotApp.tsx'
import { useSnapshotButtonVisibility } from './initialization/useSnapshotButtonVisibility.ts'
import { registerServices } from './initialization/registerServices.ts'
import { loadModelAndInitalizeChat } from './initialization/loadModelAndInitalizeChat.ts'
import { initAiMessageHandler } from './initialization/initAiMessageHandler.ts'

export type LoadAppProps = {
  /**
   * The id of the canvas element to load the 3d viewer into
   */
  canvasId: string;
  /**
   * The path to the XKT models to load
   */
  models: string[];
  /**
   * The path to the SQLite database to load
   */
  database: string;
};

export const loadApp = async ({ canvasId, models, database }: LoadAppProps) => {
  await registerServices(
    document.getElementById(canvasId) as HTMLCanvasElement
  );

  await loadModelAndInitalizeChat({
    models,
    database,
  });

  initAiMessageHandler();
};

const installAutoScrollController = async () => {
  let messageList = document.getElementById('bim-chat-message-list');

  while (!messageList) {
    await new Promise(resolve => setTimeout(resolve, 50));
    messageList = document.getElementById('bim-chat-message-list');
  }

  let autoScroll = true;
  let didWheel = false;

  messageList.addEventListener('wheel', (e) => {
    if (e.deltaY < 0) {
      didWheel = true;
      if (autoScroll) {
        console.log('disabled auto scroll');
      }
      autoScroll = false;
    }
  });

  setInterval(() => {
    if (!didWheel) {
      const isAtBottom = messageList.scrollHeight - messageList.scrollTop <= messageList.clientHeight + 10;

      if (isAtBottom) {
        if (!autoScroll) {
          console.log('enabled auto scroll');
        }
        autoScroll = true;
      }
    }

    didWheel = false;

    if (autoScroll) {
      messageList.scroll({ top: messageList.scrollHeight, behavior: 'smooth' });
    }
  }, 50);

  console.log('Auto scroll controller installed');
};

(async () => {
  await loadApp({
    canvasId: 'xeokit-canvas',    
    models: ['/Duplex.xkt' ],
    database: '/Duplex.sqlite',
  });

  useSnapshotButtonVisibility();

  document.getElementById('toggle-left-ui-column')!.addEventListener('click', function() {
    document.querySelector('.left-ui-column')!.classList.toggle('collapsed');
  });

  document.getElementById('toggle-right-ui-column')!.addEventListener('click', function() {
    document.querySelector('.right-ui-column')!.classList.toggle('collapsed');
  });

  createRoot(document.getElementById('react-root')!).render(
    <StrictMode>
      <ChatApp/>
    </StrictMode>,
  )

  createRoot(document.getElementById('react-root-2')!).render(
    <StrictMode>
      <SnapshotApp />
    </StrictMode>,
  )

  await installAutoScrollController();
})()