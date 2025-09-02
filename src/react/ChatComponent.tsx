import "./css/Chat.css";
import { useEffect } from "react";
import { useGridJsTableConverter } from "../markdown/gridjs-tables";
import { useRenderedMessages } from "../hooks/useRenderedMessages";
import { useStoreValue } from "../hooks/useStoreValue";
import markdownIt from "markdown-it";
import { resolve } from "../ioc/inversify.config";
import { generateMessageId } from "../utils/getMessageId";
import HeatMap, { HeatMapCell } from "./components/HeatMap";
import { StreamingMessage } from "./StreamingMessage";

export const ChatComponent: React.FC<{ md: markdownIt, markdownMode: boolean }> = ({ md, markdownMode }) => {
  const store = resolve('StateStoreService');
  const messageManager = resolve('MessageManagerService');
  const thinkingManager = resolve('ThinkingIndicatorService');

  const thinking = useStoreValue(store, (value) => value.thinking);

  const renderedMessages = useRenderedMessages(md, markdownMode);

  // Install GridJs table converter observer
  useEffect(() => {
    return useGridJsTableConverter();
  });

  const handleSend = async (text: string) => {
    messageManager.addMessage({
      id: generateMessageId(),
      text,
      who: "user",
    });
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const input = e.currentTarget.querySelector("input") as HTMLInputElement;
    const text = input.value.trim();
    if (text) {
      handleSend(text);
      input.value = "";
    }
  };

  // Some data for the heatmap with 3 values h axis and 3 values v axis, a total of 9 cells
  const getVoewl = (i: number) => {
    return ["A", "E", "I", "O", "U"][i % 5];
  };

  const myData: HeatMapCell[] = [
    {
      x: '',
      y: 'Object Type A',
      value: 100,
    },
    {
      x: 'Level 0 ',
      y: '',
      value: 200,
    },
    {
      x: '',
      y: '',
      value: 500,
    },
    ...Array.from({ length: 16 }, (_, i) => ({
      x: `Level ${Math.floor(Math.random() * 5)}`,
      y: `Object Type ${getVoewl(Math.floor(Math.random() * 5))}`,
      value: Math.floor(Math.random() * 999),
    }))
  ];

  return (
    <div className="chat-component">
      <div className="chat-container">
        <div id="bim-chat-message-list"className="message-list">
          {renderedMessages.map((msg) => {
            return (
              <StreamingMessage
                key={msg.id}
                fullHTML={msg.html}
                className={`message ${msg.who === "user" ? "message-outgoing" : "message-incoming"}`}
              />
            );
          })}
          {/* <div className="message-incoming">
            <div className="message-content">
              <HeatMap
                title="Objects per level"
                values={myData}
                labels={{
                  x: "Level",
                  y: "Object Type",
                  value: "Count"
                }}
                emptyCellColor="rgb(235, 237, 240)"
                minValueColor="#bbffbb"
                maxValueColor="#007700"
                cellSize={32}
                maxDigitsInValues={2}
              />
            </div>
          </div> */}
        </div>

        {thinking.busy && (
          <>
            <div className="typing-indicator">
              <img
                src="/spinner.gif"
                width="32"
                height="32"
                style={{
                  transform: "scale(2) translateY(6px)",
                  filter: "saturate(0.7)",
                }}
              />
              <span className="thinking-message">
                {thinkingManager.mapThinkingToMessage(thinking)}
              </span>
            </div>
          </>
        )}

        <form className="message-input" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Type message here"
            className="message-input-field"
          />
        </form>
      </div>
    </div>
  );
};
