import { inject, injectable } from "inversify";
import { IViewerService, XeokitViewerService } from "../ViewerService";
import { TYPES } from "../../ioc/types";
import { ILogService } from "../LogService";
import { ISnapshotManagerService } from "../../state/SnapshotManagerService";
import { IReferenceManagerService } from "../../state/ReferenceManagerService";

export abstract class IViewerSnapshotService {
  /**
   * Take a snapshot of the viewer.
   * 
   * This will create an annotation in the viewer and store it in the snapshot manager.
   */
  abstract takeSnapshot(): Promise<string>;
}

@injectable()
export class XeokitViewerSnapshotService implements IViewerSnapshotService {
    private viewerService: XeokitViewerService;

    constructor(
      @inject(TYPES.ViewerService) viewerService: IViewerService,
      @inject(TYPES.LogService) private logger: ILogService,
      @inject(TYPES.SnapshotManagerService) private snapshotManager: ISnapshotManagerService,
      @inject(TYPES.ReferenceManagerService) private referenceManager: IReferenceManagerService,
    ) {
      if (viewerService instanceof XeokitViewerService) {
        this.viewerService = viewerService;
      } else {
        throw new Error("viewerService is not an instance of XeokitViewerService");
      }
    }
  
    async takeSnapshot(): Promise<string> {
        try {
          this.logger.log("viewer-snapshot-service","Will take a snapshot");
    
          const xeokit = this.viewerService.viewer!;
    
          const imageData = xeokit.getSnapshot({
            width: 250,
            format: "png",
          });
    
          this.logger.log("viewer-snapshot-service","Snapshot taken");
    
          const uid = this.referenceManager.storeImage(imageData);
    
          const id = this.snapshotManager.getNextId();
    
          this.logger.log("viewer-snapshot-service","Adding snapshot to the list");
    
          const selectedObjectId = xeokit.scene.highlightedObjectIds[0].toString();
          const objectType = xeokit.metaScene.metaObjects[selectedObjectId].type;
          const worldPos = Array.from(this.viewerService.lastPickPos);
    
          this.logger.log("viewer-snapshot-service",`{ worldPos: ${worldPos.join(",")} }`);
    
          const annotation = this.viewerService.annotations!.createAnnotation({
            id: uid,
    
            entity: xeokit.scene.objects[selectedObjectId],
    
            worldPos,
    
            occludable: false,
            markerShown: true,
            labelShown: false,
    
            values: {
              glyph: id.toString(),
              title: objectType,
              description: "",
              markerBGColor: "orange",
            },
          });
    
          this.snapshotManager.addSnapshot({
            id,
            imageReference: uid,
            viewpoint: {
              eye: Array.from(xeokit.camera.eye),
              look: Array.from(xeokit.camera.look),
              up: Array.from(xeokit.camera.up),
            },
            selectedObjectId,
            objectType,
            annotation,
          });
    
          return `
    Tell the user that the snapshot with id = ${id} has been added to the list for the object of type ${objectType}.
    
    Show the object type in a friendly name, avoid 'Ifc*' prefxes.
    `;
        } catch (error) {
          this.logger.error("viewer-snapshot-service",(error as Error)?.toString());
          return `
    Tell the user a problem happened while taking the snapshot.
    
    Remind the user that an object must be selected in the 3D viewer before taking a snapshot.
    `;
        }
    
    //     return `
    // This is the generated snapshot image:
    // ![Alt Text](${uid})`;
      }
    }