import { AnnotationsPlugin, Viewer, XKTLoaderPlugin } from "@xeokit/xeokit-sdk";
import { ISelectionManagerService } from "../state/SelectionManagerService";
import { inject, injectable } from "inversify";
import { TYPES } from "../ioc/types";

/**
 * Interface for the ViewerService.
 * This interface is used to interact with the 3D viewer.
 */
@injectable()
export abstract class IViewerService {
  /**
   * Initialize the viewer service.
   * 
   * @param canvasElement - The canvas element to initialize the viewer in.
   */
  abstract initialize(canvasElement: HTMLCanvasElement): Promise<void>;

  /**
   * Load a model into the viewer.
   * 
   * @param id - The id of the model.
   * @param src - The source of the model.
   */
  abstract loadModel(id: string, src: string): Promise<void>;
}

export class XeokitViewerService implements IViewerService {
  public viewer: Viewer | null = null;
  public annotations: AnnotationsPlugin | null = null;
  private loader: XKTLoaderPlugin | null = null;
  public lastPickPos: number[] = [0, 0, 0];

  constructor(
    @inject(TYPES.SelectionManagerService) private selectionManager: ISelectionManagerService,
  ) {}

  async initialize(canvasElement: HTMLCanvasElement): Promise<void> {
    const viewer = new Viewer({
      canvasElement,
      transparent: true,
      antialias: true,
    });

    window.viewer = viewer;
    this.viewer = viewer;

    const annotations = new AnnotationsPlugin(this.viewer!, {
      markerHTML:
        "<div class='annotation-marker' style='background-color: {{markerBGColor}};'>{{glyph}}</div>",
      labelHTML:
        "<div class='annotation-label' style='background-color: {{labelBGColor}};'>\
              <div class='annotation-title'>{{title}}</div>\
              <div class='annotation-desc'>{{description}}</div>\
              </div>",
      container: document.getElementById("xeokit-root")!,
      values: {
        markerBGColor: "red",
        labelBGColor: "white",
        glyph: "X",
        title: "Untitled",
        description: "No description",
      },
    });

    this.annotations = annotations;

    const loader = new XKTLoaderPlugin(viewer, {
      objectDefaults: {
        // @ts-expect-error Allow to define null properties as default
        DEFAULT: null,
        IfcSpace: {
          pickable: false,
          visible: true,
        },
      },
    });

    this.loader = loader;

    let canvasPos = [0, 0];

    canvasElement.addEventListener('mousedown', ev => {
      canvasPos = [ev.clientX, ev.clientY];
    });
  
    canvasElement.addEventListener('mouseup', ev => {
      if (Math.abs(ev.clientX - canvasPos[0]) > 10) return;
      if (Math.abs(ev.clientY - canvasPos[1]) > 10) return;
  
      Object.values(this.viewer!.scene.objects).forEach (o => o.highlighted = false);
  
      const rect = canvasElement.getBoundingClientRect();
  
      const hit = viewer.scene.pick({
        canvasPos: [
          canvasPos[0] - rect.left,
          canvasPos[1] - rect.top,
        ],
        pickSurface: true,
      });
  
      const entity = hit?.entity ?? null;
      this.lastPickPos = hit?.worldPos || [0, 0, 0];
  
      if (entity) {
        entity.highlighted = true;
        this.selectionManager.select([entity.id.toString()], "user");
      } else {
        this.selectionManager.select([], "user");
      }
    });
  }

  loadModel(id: string, src: string): Promise<void> {
    return new Promise<void>((resolve) => {
      const model = this.loader!.load({
        id,
        src,
        edges: true,
      });

      model.on("loaded", () => {
        this.viewer!.camera.eye = [ 1, 1, 1 ];
        this.viewer!.camera.look = [ 0, 0, 0 ];
        this.viewer!.cameraFlight.flyTo();
        resolve();
      });
    });
  }
}
