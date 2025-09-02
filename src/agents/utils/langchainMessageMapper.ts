import { HumanMessage, SystemMessage } from "@langchain/core/messages";
import { Message } from "../../state/Dto/Message";

export function mapMessagesToLangchain(messages: Message[]) {
    let m = messages;
  
    /**
     * In case the last message is an isolate message,
     * only include this message in the conversation to the LLM.
     */
    if (m.at(-1)?.isolatedMessage) {
      m = m.slice(-1);
    }
  
    return [
        // new HumanMessage({
        //     content: [
        //       { type: "text", text: "You can use the screenshot below to understand the model and the data it contains, and it can be used to guess the model type and discipline." },
        //     ],
        // }),
        // new HumanMessage({
        //     content: [
        //       {
        //         type: "image_url",
        //         image_url: {
        //             // @ts-ignore
        //           url: window._3dModelSnapshot
        //         }
        //       },
        //     ],
        // }),
        ...m.map(message => {
            if (message.who === 'system') {
                return new SystemMessage(message.text);
            } else {
                return new HumanMessage(message.text);
            }
        })
    ];
  }
  