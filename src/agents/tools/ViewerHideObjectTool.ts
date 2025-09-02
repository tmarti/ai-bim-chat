// HideObjectTool.ts

import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";
import { toolNames } from '../../services/ToolRegistryService';
import { resolve } from '../../ioc/inversify.config';

export class ViewerHideObjectTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'ViewerHideObjectTool' satisfies toolNames,
            description: 'Hides a set of specified objects in the 3D/BIM viewer by their IDs.',
            schema: z.object({
              objectIds: z.array(z.string()).describe("The set of object IDs"),
            }),
            func: async ({objectIds}:{objectIds:string[]}) => {
              const viewerObjectStateService = resolve('ViewerObjectStateService');
              return viewerObjectStateService.hideObjects(objectIds);
            }
        });
    }
}
