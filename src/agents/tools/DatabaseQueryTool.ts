import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";
import { toolNames } from '../../services/ToolRegistryService';
import { resolve } from '../../ioc/inversify.config';

export interface DatabaseQueryToolProps {
    originalUserQuestion: string;
    modelDatabaseQuery: string;
    onlyNeedListOfIds?: boolean;
    involvesModelData?: boolean;
    willPassThruAsTable?: boolean;
    onlyNeedASingleValue?: boolean;
    wantHeatMap?: boolean;
}

export class DatabaseQueryTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'DatabaseQueryTool' satisfies toolNames,
            description: `Answers questions related to data aggregation or data search in the BIM model data store based in a natural language query.
Is specifically designed to answer questions through directed database queries.
These can be used to:
- obtain data from the model database
- obtain an id list to pass to the 3D viewer
- obtain a single value from the model database`,
            schema: z.object({
                originalUserQuestion: z.string().describe("The complete original question provided by the user"),
                modelDatabaseQuery: z.string().describe("The data to search in the BIM model data store, described in natural language. This reflects the user model database data needs from their orignal question plus any needed extra context to carry the database query."),
                onlyNeedListOfIds: z.boolean().optional().describe("If the tool invocation intention is to obtain just a list of object id's in order to pass it thru to other tools"),
                involvesModelData: z.boolean().optional().describe("If the tool invocation involves some way of matching or related concrete object properties in the model database"),
                willPassThruAsTable: z.boolean().optional().describe("If the tool invocation intention is to obtain just a table and show that table to the user"),
                onlyNeedASingleValue: z.boolean().optional().describe("If the tool invocation intention is to obtain just a single value."),
                wantHeatMap: z.boolean().optional().describe("If the tool invocation intention is to obtain a heat map (a two-dimensional chart where two parameters are analyzed and a value is displayed for each combination of the two parameters)."),
            }),
            func: async (cfg: DatabaseQueryToolProps) => {
                await new Promise(resolve => setTimeout(resolve, 20));
                const logger = resolve('LogService');
                logger.log("database-tool",JSON.stringify(cfg, null, 2));
                const queryProcessor = resolve('DatabaseQueryService');
                let retVal = await queryProcessor.executeQuery(cfg);
                if (retVal.startsWith("embedded-table-")) {
                    retVal = "Return this result as is:\n\n```embedded-table\n" + retVal + "\n```";
                }
                console.log("database-tool-result", retVal);
                return retVal;
            }
        });
    }
}
