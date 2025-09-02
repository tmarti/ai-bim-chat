import { AppState, IStateStoreService } from "./StoreService";
import { inject, injectable } from "inversify";
import { TYPES } from "../ioc/types";

/**
 * Interface for a selection manager service.
 * This service is used to manage the selection of objects in the viewer.
 */
@injectable()
export abstract class ISelectionManagerService {        
  /**
   * Select a set of objects in the viewer.
   * 
   * @param ids - The ids of the objects to select.
   * @param source - Who triggered the selection.
   */
  abstract select(ids: string[], source: "user" | "system"): void;

  /**
   * Clear the selection.
   */
  abstract clear(): void;
}

export class SelectionManagerService implements ISelectionManagerService {
  constructor(
    @inject(TYPES.StateStoreService) private store: IStateStoreService<AppState>
  ) {}

  select(ids: string[], source: "user" | "system"): void {
    this.store.update((state) => ({
      ...state,
      selection: {
        ids: new Set(ids),
        source,
      },
    }));
  }

  clear(): void {
    this.store.update((state) => ({
      ...state,
      selection: {
        ids: new Set(),
        source: "system",
      },
    }));
  }
}
