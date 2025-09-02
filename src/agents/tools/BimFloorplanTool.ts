import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";
import { toolNames } from '../../services/ToolRegistryService';
import { resolve } from '../../ioc/inversify.config';

export class BimFloorplanTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'BimFloorplanTool' satisfies toolNames,
            description: `Obtains the floorplan of a model given the level name.`,
            schema: z.object({
                levelName: z.string().describe("The name of the level to obtain the floorplan for"),
            }),
            func: async ({levelName}:{levelName:string}) => {
                const logger = resolve('LogService');
                logger.log("floorplan-tool",JSON.stringify({levelName}, null, 2));
                const queryProcessor = resolve('DatabaseQueryService');
                const modelLevelName = await queryProcessor.executeQuery({
                    originalUserQuestion: `
Among the storeys/levels in the model, find the name of the one that matches the
user-provided level name: ${levelName} and return its name in the model.
`,
                    modelDatabaseQuery: "",
                    onlyNeedASingleValue: true
                });

                logger.log('floorplan-tool', `modelLevelName: ${modelLevelName}`);
                const floorplanService = resolve('ModelFloorplanService');
                let uid = await floorplanService.getFloorplanReference(levelName, modelLevelName);
                console.log("floorplan-tool-result", uid);
                return `
Return this fence block as is to the user:

\`\`\`embedded-image
${uid}
\`\`\`
`;
            }
        });
    }
}
