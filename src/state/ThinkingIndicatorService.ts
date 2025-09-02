import { TYPES } from "../ioc/types";
import { ThinkingState } from "./Dto/Thinking";
import { AppState, IStateStoreService } from "./StoreService";
import { inject, injectable } from "inversify";

/**
 * Interface for a thinking indicator service.
 * 
 * This service is used to display a thinking indicator in the UI.
 * 
 * It is used by the different processing stages of the application
 * to give visual feedback to the user.
 */
@injectable()
export abstract class IThinkingIndicatorService {
  /**
   * Set the thinking state.
   * 
   * @param thinking - The thinking state to set.
   */
  abstract setThinking(thinking: Partial<ThinkingState>): void;

  /**
   * Map the thinking state to a friendly message text.
   * 
   * @param thinking - The thinking state to map.
   * @returns The message.
   */
  abstract mapThinkingToMessage(thinking: ThinkingState): string;
}

export class ThinkingIndicatorService implements IThinkingIndicatorService {
  constructor(@inject(TYPES.StateStoreService) private store: IStateStoreService<AppState>) {}

  setThinking(thinking: Partial<ThinkingState>) {
    this.store.update((state) => ({
      ...state,
      thinking: {
        ...state.thinking,
        ...thinking,
      },
    }));
  }

  mapThinkingToMessage(thinking: ThinkingState): string {
    switch (thinking.message) {
      case "DatabaseQueryTool":
        return "Finding details...";
      case "DatabaseOverviewTool":
        return "Planning model analysis...";
      case "ViewerIsolateObjectTool":
      case "ViewerHideObjectTool":
      case "ViewerHighlightObjectTool":
      case "ViewerColorizeObjectTool":
        return "Updating view...";
      case "BimFloorplanTool":
        return "Preparing floorplan...";
      case "ViewerSnapshotTool":
        return "Capturing view...";
      case "Analyzing data insights...":
        return "Refining conclusions...";
      case undefined:
        return "Thinking...";
      case "Coming up with some suggestions...":
        return "Crafting suggestions...";
      default:
        thinking.message satisfies never;
        return "Thinking...";
    }
  }
}
