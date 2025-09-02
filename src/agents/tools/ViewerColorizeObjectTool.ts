// HideObjectTool.ts

import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";
import { toolNames } from '../../services/ToolRegistryService';
import { resolve } from '../../ioc/inversify.config';

export class ViewerColorizeObjectTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'ViewerColorizeObjectTool' satisfies toolNames,
            description: 'Colorizes a set of specified objects in the 3D/BIM viewer by their IDs with a specified color.',
            schema: z.object({
              objectIds: z.array(z.string()).describe("The set of object IDs"),
              colorName: z.string().describe("The name of the color to use"),
              colorComponents: z.array(z.number()).describe("The RGB components of the color to use, in the decimal range [0-1]"),
            }),
            func: async ({objectIds, colorName, colorComponents}:{objectIds:string[], colorName:string, colorComponents:number[]}) => {
              const logger = resolve('LogService');
              logger.log("viewer-service",`Colorize ${objectIds.length} objects with ${colorName} color`);
              logger.log("viewer-service",`Color components: ${colorComponents.join(", ")}`);
              const viewerObjectStateService = resolve('ViewerObjectStateService');
              return viewerObjectStateService.colorizeObjects(objectIds, colorName, colorComponents);
            }
        });
    }
}
