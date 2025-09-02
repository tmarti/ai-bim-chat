import MarkdownIt from "markdown-it";
import { MarkdownItEnv } from "./init-markdown-it";

export type IFenceBlockProcessorResult = {
    /**
     * Whether the fence block is asynchronous.
     */
    async: true,
    /**
     * A promise that resolves to the HTML content of processed fence block.
     */
    content: Promise<string>;
    /**
     * A promise to be resolved after the fence block is processed.
     */
    afterProcessing?: () => Promise<void>;
} | {
    /**
     * Whether the fence block is synchronous.
     */
    async: false,
    /**
     * The HTML content with the result of processing the fence block.
     */
    content: string;
    /**
     * A promise to be resolved after the fence block is processed.
     */
    afterProcessing?: () => Promise<void>;
};

/**
 * Interface for a fence block processor.
 * 
 * This processor is used to process fence blocks in the markdown
 * into HTML format.
 * 
 * The intention is to allow for custom embedded content to be displayed
 * via the usage of custom triple-backtick fence blocks.
 */
export abstract class IFenceBlockProcessor {
  /**
   * Process a fence block.
   * 
   * @param type - The fence block type.
   * @param block - The fence block content.
   * @param md - The markdown-it instance.
   * @param env - The markdown-it environment.
   * @returns The processed fence block.
   */
  public abstract process(type: string, block: string, md: MarkdownIt, env: MarkdownItEnv): IFenceBlockProcessorResult;
}
