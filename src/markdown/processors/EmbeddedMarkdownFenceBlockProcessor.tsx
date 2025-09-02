import MarkdownIt from "markdown-it";
import { IFenceBlockProcessor, IFenceBlockProcessorResult } from "../IFenceBlockProcessor";
import { MarkdownItEnv } from "../init-markdown-it";
import { OverviewReference } from "../../state/ReferenceManagerService";
import { Message } from "../../state/Dto/Message";

export class EmbeddedMarkdownFenceBlockProcessor extends IFenceBlockProcessor {

    process(type: string, block: string, md: MarkdownIt, env: MarkdownItEnv): IFenceBlockProcessorResult {

        if (env.isStreaming) {
            return {
                async: false,
                content: ''
            };
        }

        const reference = block.trim().replace("```embedded-markdown\n", "").replace("\n```", "") as OverviewReference;

        const data = env.referenceManager.getOverview(reference);

        if (!data) {
            return {
                async: false,
                content: ''
            };
        }

        const wrapperMessage : Message = {
            id: 'embedded-' + env.message.id + '-' + reference,
            text: data.text,
            who: env.message.who,
            hidden: env.message.hidden,
            isolatedMessage: env.message.isolatedMessage,
        };

        return {
            async: false,
            content: md.render(
                data.text, {
                    ...env,
                    message: wrapperMessage,
                }
            ),
        };
    }
}