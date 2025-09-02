// IsolateObjectTool.ts

import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";
import { toolNames } from '../../services/ToolRegistryService';
import { resolve } from '../../ioc/inversify.config';

export class ViewerIsolateObjectTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'ViewerIsolateObjectTool' satisfies toolNames,
            description: 'Shows or isolates a set of specified objects in the 3D/BIM viewer by their IDs.',
            schema: z.object({
              objectIds: z.array(z.string()).describe("The set of object IDs"),
              navigateToThem: z.boolean().describe("Whether to navigate to the objects after isolating them"),
            }),
            func: async ({objectIds, navigateToThem}:{objectIds:string[], navigateToThem:boolean}) => {
              const viewerObjectStateService = resolve('ViewerObjectStateService');
              return viewerObjectStateService.isolateObjects(objectIds, navigateToThem);
            }
        });
    }
}
