import MarkdownIt from "markdown-it";
import { IFenceBlockProcessor, IFenceBlockProcessorResult } from "../IFenceBlockProcessor";
import { MarkdownItEnv } from "../init-markdown-it";
import { ImageReference } from "../../state/ReferenceManagerService";
import { generateThinkingHtmlBlock } from "./util";

const generateCanvasWithImage = (uid: string, base64Image: string) => {
    return `
<img
    class="embedded-image"
    data-image-id="${uid}"
    src="${base64Image}"
></img>`;
}

export class EmbeddedImageBlockProcessor extends IFenceBlockProcessor {

    process(type: string, block: string, md: MarkdownIt, env: MarkdownItEnv): IFenceBlockProcessorResult {
        const imageId = block.trim().replace("```embedded-image\n", "").replace("\n```", "");

        const image = env.referenceManager.getImage(imageId as ImageReference);

        if (env.isStreaming) {
            return {
                async: false,
                content: generateThinkingHtmlBlock(`Generating image...`)
            };
        }

        if (!image) {
            return {
                async: false,
                content: '<p class="with-padding-top">An error occurred while generating the image.</p>'
            };
        }

        return {
            async: false,
            content: generateCanvasWithImage(imageId, image!)
        };
    }
}