import { generateThinkingHtmlBlock } from "./util";
import { MarkdownItEnv } from "../init-markdown-it";
import { TableReference } from "../../state/ReferenceManagerService";
import MarkdownIt from "markdown-it";
import { IFenceBlockProcessor, IFenceBlockProcessorResult } from "../IFenceBlockProcessor";

export class EmbeddedTableFenceBlockProcessor extends IFenceBlockProcessor {
    public process(_type: string, block: string, md: MarkdownIt, env: MarkdownItEnv): IFenceBlockProcessorResult {
        const tableId = block.trim().replace("```embedded-table\n", "").replace("\n```", "");
        const tableMarkdown = env.referenceManager.getTable(
            tableId as TableReference
        );
    
        if (!tableMarkdown) {
            return {
                async: false,
                content: generateThinkingHtmlBlock("Generating table...")
            };
        }

        return {
            async: false,
            content: md.render(`\n\n${tableMarkdown}\n`)
        };
    }
}
