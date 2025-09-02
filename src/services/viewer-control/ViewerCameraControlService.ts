import { inject, injectable } from "inversify";
import { TYPES } from "../../ioc/types";
import { IViewerService, XeokitViewerService } from "../ViewerService";

export abstract class IViewerCameraControlService {
  /**
   * Set the camera to a given viewpoint.
   * 
   * @param viewpoint - The viewpoint to fly to.
   */
  abstract flyTo(viewpoint: { eye: number[]; look: number[]; up: number[] }): void;
}

@injectable()
export class XeokitViewerCameraControlService implements IViewerCameraControlService {
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

    flyTo(viewpoint: { eye: number[]; look: number[]; up: number[] }): void {
        this.viewerService.viewer!.cameraFlight.flyTo(viewpoint);
    }
}