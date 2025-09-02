import MarkdownIt from "markdown-it";
import { IFenceBlockProcessor, IFenceBlockProcessorResult } from "../IFenceBlockProcessor";
import { MarkdownItEnv } from "../init-markdown-it";
import { generateMessageId } from "../../utils/getMessageId";
import { resolve } from "../../ioc/inversify.config";

// @ts-ignore
window.onClickConclusionReason = async (element: HTMLElement) => {
    console.log('onClickConclusionReason');
    element = element.parentElement!;
    await new Promise(resolve => setTimeout(resolve, 200));
    const reference = atob(element.getAttribute('data-reference')!);
    const messageManager = resolve('MessageManagerService');
    messageManager.addMessage({
        id: generateMessageId(),
        text: reference,
        who: 'user',
    });
    const messageList = document.getElementById('bim-chat-message-list');
    setTimeout(() => {
        messageList!.scroll({ top: messageList!.scrollHeight, behavior: 'smooth' });
    }, 200);
}

export class ConclusionReasonFenceBlockProcessor extends IFenceBlockProcessor {

    process(type: string, block: string, md: MarkdownIt, env: MarkdownItEnv): IFenceBlockProcessorResult {

        const generateHtml = (addClass: boolean) => `
<div id="wrapper-${env.tokenCacheKey}" class="conclusion-reason in-progress ${addClass ? 'newly-created' : ''}">
    <div class="conclusion-reason-icon">💡</div>
    <div class="conclusion-reason-content">
        <div id="${env.tokenCacheKey}">
            <span class="thinking-message"><em>Examining...</em></span>
        </div>
    </div>
</div>
`;
//         const generateHtml = (addClass: boolean) => `
// <div id="wrapper-${env.tokenCacheKey}" class="conclusion-reason ${addClass ? 'newly-created' : ''}">
//     <div class="conclusion-reason-icon">${addClass ? '⏳' : '💡'}</div>
//     <div class="conclusion-reason-content">
//         <!--<img
//             src="/spinner.gif"
//             width="32"
//             height="32"
//             style="transform: scale(2) translateY(6px); filter: saturate(0.7);"
//         />-->
//         <div id="${env.tokenCacheKey}">
//             <span class="thinking-message"><em>Examining...</em></span>
//         </div>
//     </div>
// </div>
// `;

        if (env.isStreaming) {
            return {
                async: false,
                content: generateHtml(true)
            };
        }

        // console.error(env.tokenCacheKey);

        // return {
        //     async: false,
        //     content: generateHtml(false),
        // };
        
        return {
            async: false,
            content: generateHtml(false),
            afterProcessing: async () => {
                let el = document.getElementById(env.tokenCacheKey);

                while (!el) {
                    await new Promise(resolve => setTimeout(resolve, 20));
                    el = document.getElementById(env.tokenCacheKey);
                }

                el.innerHTML = '<span class="thinking-message"><em>Crafting suggestion...</em></span>';

                const llmService = resolve('OpenaiLlmService');

                const stream = await llmService.getSimpleResponseStreamFromText(`
You are a BIM assistant expert.

---

You are given the following BIM data insight:

${block}

---

You are tasked with designing the best possible next step the user can choose
to get a better understanding of the BIM data based on the insight.

Please consider carefully the BIM data insight and return a markdown formatted response.

In your response, you should include a description of the next most plausible next action to 
to get a better understanding of the BIM data based on the insight.

You have the option to propose actions based on the following tools:

Avoid mentioning the tools in your response but instead propose actions based on their description and capabilities.

You can propose actions based on compositions of the tools, in the way that a human would do: 1st do this, then do that, then do the other.

---

Avoid to phrase your response in this style:

    Obtain a general overview of the BIM data contained in the model database. This will help you understand the active model development indicated by the high frequency of "Edited by" (3,464 times), "Workset" 'ARK (rvt)' (3,213 times), and "Phase Created" 'New Construction' (2,960 times). The overview will provide insights into the model type, potential issues, and recommended actions for further exploration.

And instead phrase your response in this style:

    Obtain a general overview of the BIM data contained in the model database and analyze the high frequency of "Edited by" (3,464 times), "Workset" 'ARK (rvt)' (3,213 times), and "Phase Created" 'New Construction' (2,960 times). Then provide insights into the model type, potential issues, and recommended actions for further exploration.

---

The tools are:

${
    // @ts-ignore
    window.toolsDescription
}

---

Formulate the next step in a way that is easy to understand and clearly explained.

Include any relevant data reference from the insight that you think are relevant to carry out the next step.

Try to generalize the next step to apply beyond the concrete data in the insight. For example, if the insight
is about a specific room, the next step could be to generalize the next step to apply to all rooms in the building.

Don't use more than 100 words in your answer.

Use imperative language, and avoid any introductory text or concluding text but focus only on the next step.

Avoid any title or subtitle in your answer.
`);

                let content = '';
                for await (const chunk of stream) {
                    content += chunk.content.toString();
                }

                el.setAttribute('data-reference', btoa(content));

                // console.log('suggestion-next-step-content', content);

                const prompt2 = `
In the role of a BIM assistant expert, you are given the following description of the next step to take:

---

${content}

---

Please return a short and synthetic phrase summarising it.

Don't use more than 10 to 15 words in your answer.

Avoid to reveal concrete data entity names but instead refer to the concepts in an abstracted way.
`;

                // console.error('prompt2', prompt2);

                const stream2 = await llmService.getSimpleResponseStreamFromText(prompt2);

                let content2 = '';
                
                for await (const chunk of stream2) {
                    content2 += chunk.content.toString();
                    const html = md.render(content2, {...env, isStreaming: false});
                    el.innerHTML = `<span class="suggestion-action" onclick="onClickConclusionReason(this)">${html}</span>`;
                }

                const html = md.render(content2, {...env, isStreaming: false});
                el.innerHTML = `<span class="suggestion-action" onclick="onClickConclusionReason(this)">${html}</span>`;

                el.parentElement!.parentElement!.classList.remove('in-progress');
                
                // console.log('suggestion-next-step-title', content2);
            }
        };
    }
}