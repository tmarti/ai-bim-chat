import { inject, injectable } from "inversify";
import { TYPES } from "../../ioc/types";
import { ILogService } from "../LogService";
import { IViewerService, XeokitViewerService } from "../ViewerService";
import { IdListReference, IReferenceManagerService } from "../../state/ReferenceManagerService";

export abstract class IViewerObjectStateService {
  /**
   * Highlight objects in the viewer.
   * 
   * @param ids - The ids of the objects to highlight.
   */
  abstract highlightObjects(ids: string[]): string;

  /**
   * Hide objects in the viewer.
   * 
   * @param ids - The ids of the objects to hide.
   */
  abstract hideObjects(ids: string[]): string;

  /**
   * Isolate objects in the viewer.
   * 
   * @param ids - The ids of the objects to isolate.
   * @param navigateToThem - Whether to navigate to the objects after isolating them.
   */
  abstract isolateObjects(ids: string[], navigateToThem: boolean): string;

  /**
   * Colorize objects in the viewer.
   * 
   * @param ids - The ids of the objects to colorize.
   * @param colorName - The name of the color to use.
   * @param colorComponents - The RGB components of the color to use, in the decimalrange [0-1].
   */
  abstract colorizeObjects(ids: string[], colorName: string, colorComponents: number[]): string;
}

@injectable()
export class XeokitViewerObjectStateService implements IViewerObjectStateService {
    private viewerService: XeokitViewerService;

    constructor(
      @inject(TYPES.ViewerService) viewerService: IViewerService,
      @inject(TYPES.LogService) private logger: ILogService,
      @inject(TYPES.ReferenceManagerService) private referenceManager: IReferenceManagerService,
    ) {
      if (viewerService instanceof XeokitViewerService) {
        this.viewerService = viewerService;
      } else {
        throw new Error("viewerService is not an instance of XeokitViewerService");
      }
    }

    highlightObjects(ids: string[]) {
        if (ids.length === 1) {
          const storedIds = this.referenceManager.getIdList(ids[0] as IdListReference);
    
          if (storedIds) {
            ids = storedIds;
          }
        }
        this.logger.log("viewer-service",`{ natigateTo: ${ids.join(",")} }`);
        const xeokit = this.viewerService.viewer!;
        Object.values(xeokit!.scene.objects).forEach(
          (o) => (o.highlighted = false)
        );
        ids.forEach((objectId) => {
          if (objectId in xeokit!.scene.objects) {
            xeokit!.scene.objects[objectId].highlighted = true;
          }
        });
    
        return `
Tell the user ${ids.length} objects were highlighted in the 3D viewer.
    `;
      }
    
      hideObjects(ids: string[]) {
        if (ids.length === 1) {
          const storedIds = this.referenceManager.getIdList(ids[0] as IdListReference);
    
          if (storedIds) {
            ids = storedIds;
          }
        }
        const xeokit = this.viewerService.viewer!;
        let count = 0;
        ids.forEach((objectId) => {
          if (objectId in xeokit!.scene.objects) {
            if (xeokit!.scene.objects[objectId].visible) {
              xeokit!.scene.objects[objectId].visible = false;
              count++;
            }
          }
        });
    
        return `
Tell the user ${count} objects were hidden in the 3D viewer.
    `;
      }
    
      isolateObjects(ids: string[], navigateToThem: boolean) {

        console.log("isolateObjects", ids, navigateToThem);
        if (ids.length === 1) {
          const storedIds = this.referenceManager.getIdList(ids[0] as IdListReference);
    
          if (storedIds) {
            ids = storedIds;
          }
        }
        this.logger.log("viewer-service",`{ isolate: ${ids.join(",")} }`);
        const xeokit = this.viewerService.viewer!;
        Object.values(xeokit!.scene.objects).forEach((o) => (o.visible = false));
        ids.forEach((objectId) => {
          if (objectId in xeokit!.scene.objects) {
            xeokit!.scene.objects[objectId].visible = true;
          }
        });

        const aabb = [
          9999999999,
          9999999999,
          9999999999,
          -9999999999,
          -9999999999,
          -9999999999,
        ];

        if (navigateToThem) {
          console.log('aabb1', JSON.stringify(aabb, null, 2));

          try {
            ids.forEach((objectId) => {
              const objAabb = xeokit!.scene.objects[objectId]?.aabb;

              if (objAabb) {
                aabb[0] = Math.min(aabb[0], objAabb[0]);
                aabb[1] = Math.min(aabb[1], objAabb[1]);
                aabb[2] = Math.min(aabb[2], objAabb[2]);
                aabb[3] = Math.max(aabb[3], objAabb[3]);
                aabb[4] = Math.max(aabb[4], objAabb[4]);
                aabb[5] = Math.max(aabb[5], objAabb[5]);
              }
            });

            console.log('aabb2', JSON.stringify(aabb, null, 2));

            xeokit!.cameraFlight.flyTo({aabb});
          } catch (e) {
            debugger;
          }
        }

        return `
Tell the user ${ids.length} objects were isolated in the 3D viewer.
    `;
    }

    colorizeObjects(ids: string[], colorName: string, colorComponents: number[]) {
      if (ids.length === 1) {
        const storedIds = this.referenceManager.getIdList(ids[0] as IdListReference);
  
        if (storedIds) {
          ids = storedIds;
        }
      }
      this.logger.log("viewer-service",`{ colorizer: ${ids.join(",")} }`);
      const xeokit = this.viewerService.viewer!;
      ids.forEach((objectId) => {
        if (objectId in xeokit!.scene.objects) {
          xeokit!.scene.objects[objectId].colorize = colorComponents;
        }
      });

      return `
Tell the user ${ids.length} objects were colorized to ${colorName} in the 3D viewer.
  `;
  }
}
