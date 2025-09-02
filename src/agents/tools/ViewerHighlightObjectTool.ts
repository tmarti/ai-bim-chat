// NavigateToObjectTool.ts

import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";
import { toolNames } from '../../services/ToolRegistryService';
import { resolve } from '../../ioc/inversify.config';

export class ViewerHighlightObjectTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'ViewerHighlightObjectTool' satisfies toolNames,
            description: 'Highlights a set of specified objects in the 3D/BIM viewer by their IDs.',
            schema: z.object({
              objectIds: z.array(z.string()).describe("The set of object IDs"),
            }),
            func: async ({objectIds}:{objectIds:string[]}) => {
              const viewerObjectStateService = resolve('ViewerObjectStateService');
              return viewerObjectStateService.highlightObjects(objectIds);
            }
        });
    }
}
