import { inject, injectable } from "inversify";
import { IViewerService, XeokitViewerService } from "../ViewerService";
import { TYPES } from "../../ioc/types";

export interface IObjectMetadata {
  id: string;
  name: string;
  type: string;
  externalMetadata?: Record<string, any>;
}

/**
 * Interface for the model metadata service.
 * 
 * This service allows access to the metadata of the loaded model.
 */
export abstract class IModelMetadataService {
  /**
   * Get the viewer metadata for a given object.
   * 
   * @param id - The id of the object.
   */
  abstract getMetaObject(id: string): IObjectMetadata|null;

  /**
   * Get the metadata for a given storey based on the name of the storey.
   * 
   * @param storeyName - The name of the storey.
   */
  abstract getStoreyMetadata(storeyName: string): Promise<IObjectMetadata|null>;
}

@injectable()
export class XeokitModelMetadataService implements IModelMetadataService {
  private viewerService: XeokitViewerService;

  constructor(
    @inject(TYPES.ViewerService) viewerService: IViewerService,
  ) {
    if (viewerService instanceof XeokitViewerService) {
      this.viewerService = viewerService;
    } else {
      throw new Error("viewerService is not an instance of XeokitViewerService");
    }
  }

  public getMetaObject(id: string): IObjectMetadata|null {
    const metaObject = this.viewerService.viewer!.metaScene.metaObjects[id];

    if (!metaObject) {
      return {
        id,
        name: 'unknown',
        type: 'unknown',
        externalMetadata: {},
      };
    }

    return {
      id: metaObject.id,
      name: metaObject.name,
      type: metaObject.type,
      externalMetadata: metaObject.external,
    };
  }

  public async getStoreyMetadata(storeyName: string): Promise<IObjectMetadata|null> {
    const storeys = this.viewerService.viewer!.metaScene.metaObjectsByType['IfcBuildingStorey'];

    const storey = Object.values(storeys).find(s => {
      return s.name === storeyName
    });

    if (!storey) {
        return null;
    }

    return this.getMetaObject(storey.id);
  }
}