import { DynamicStructuredTool } from 'langchain/tools';
import { z } from "zod";
import { resolve } from '../../ioc/inversify.config';

export class ViewerSnapshotTool extends DynamicStructuredTool {
    constructor() {
        super({
            name: 'ViewerSnapshotTool',
            description: 'Takes a snapshot in the viewer.',
            schema: z.object({
            }),
            func: async ({}:{}) => {
                const viewerSnapshotService = resolve('ViewerSnapshotService');
                return viewerSnapshotService.takeSnapshot();
            }
        });
    }
}
