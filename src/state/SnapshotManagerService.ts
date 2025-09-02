import { TYPES } from "../ioc/types";
import { Snapshot } from "./Dto/Snapshot";
import { AppState, IStateStoreService } from "./StoreService";
import { inject, injectable } from "inversify";

/**
 * Interface for a snapshot manager service.
 * This service is used to store the snapshots taken from the viewer.
 */
@injectable()
export abstract class ISnapshotManagerService {
  /**
   * Add a snapshot to the manager.
   * 
   * @param snapshot - The snapshot to add.
   */
  abstract addSnapshot(snapshot: Snapshot): void;

  /**
   * Remove a snapshot from the manager.
   * 
   * @param id - The id of the snapshot to remove.
   */
  abstract removeSnapshot(id: string): void;

  /**
   * Get the next id for a snapshot.
   * 
   * @returns The next id.
   */
  abstract getNextId(): string;
}

export class SnapshotManagerService implements ISnapshotManagerService {
  constructor(@inject(TYPES.StateStoreService) private store: IStateStoreService<AppState>) {}

  addSnapshot(snapshot: Snapshot): void {
    this.store.update((state) => ({
      ...state,
      snapshots: new Map(state.snapshots).set(snapshot.id, snapshot),
    }));
  }

  getNextId(): string {
    return (this.store.value.snapshots.size + 1).toString();
  }

  removeSnapshot(id: string): void {
    this.store.update((state) => {
      const newSnapshots = new Map(state.snapshots);
      newSnapshots.delete(id);
      return {
        ...state,
        snapshots: newSnapshots,
      };
    });
  }
}
