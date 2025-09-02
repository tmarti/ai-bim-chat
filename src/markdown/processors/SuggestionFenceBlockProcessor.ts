import { IFenceBlockProcessor, IFenceBlockProcessorResult } from "../IFenceBlockProcessor";
import { MarkdownItEnv } from "../init-markdown-it";
import MarkdownIt from "markdown-it";

export class SuggestionFenceBlockProcessor implements IFenceBlockProcessor {
  public process(_type: string, block: string, md: MarkdownIt, _env: MarkdownItEnv): IFenceBlockProcessorResult {
    return {
      async: false,
      content: `<button class="suggestion-box">${md.render(block)}</button>`
    };
  }
}