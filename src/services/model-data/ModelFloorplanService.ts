import { TYPES } from "../../ioc/types";
import { IReferenceManagerService } from "../../state/ReferenceManagerService";
import { IModelMetadataService } from "./ModelMetadataService";
import { inject, injectable } from "inversify";

export abstract class IModelFloorplanService {
  /**
   * Get a floorplan reference for a given level.
   * 
   * @param levelName - The name of the level as requested by the user.
   * @param modelLevelName - The name of the level as it exists in the model.
   */
  abstract getFloorplanReference(levelName: string, modelLevelName: string): Promise<string>;
}

@injectable()
export class XeokitModelFloorplanService implements IModelFloorplanService {
  constructor(
    @inject(TYPES.ModelMetadataService) private modelMetadataService: IModelMetadataService,
    @inject(TYPES.ReferenceManagerService) private referenceManager: IReferenceManagerService,
  ) {
  }

  async getFloorplanReference(levelName: string, modelLevelName: string): Promise<string> {

    const meta = await this.modelMetadataService.getStoreyMetadata(modelLevelName);

    if (!meta) {
      return Promise.resolve(`
Tell the user that the floorplan for level ${levelName} has not been found.
`);
    }

    console.log({meta});
    console.log({base64: meta.externalMetadata?.floorPlan?.base64ImageDataUrl});

    const base64Floorplan = meta.externalMetadata?.floorPlan?.base64ImageDataUrl;

    if (!base64Floorplan) {
      return Promise.resolve(`
Tell the user that the floorplan for level ${levelName} has not been found.
`);
    }

    const uid = this.referenceManager.storeImage(base64Floorplan);

    return uid;
  }
}