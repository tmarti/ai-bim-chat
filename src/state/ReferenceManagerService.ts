import { AppState, IStateStoreService } from "./StoreService";
import { v4 as uuid } from "uuid";
import { inject, injectable } from "inversify";
import { TYPES } from "../ioc/types";

// Define the types for clarity and safety
export type IdListReference = `id-list-${string}`;
export type ImageReference = `image-${string}`;
export type TableReference = `embedded-table-${string}`;
export type HeatMapReference = `heat-map-${string}`;
export type OverviewReference = `overview-${string}`;

// Union type for all possible references
export type Reference = IdListReference | ImageReference | TableReference | HeatMapReference | OverviewReference;

export type OverviewDetails = {
  text: string;
  finished: boolean;
}

/**
 * This service is used to store and retrieve references to different types of data.
 * 
 * These references are used for fast-track data passing between different processing stages of the application.
 * 
 * Its primary purpose is to avoid the need for thest data pieces to be handled through LLM prompts, which can be a bottleneck.
 */
@injectable()
export abstract class IReferenceManagerService {
  abstract storeIdList(ids: string[]): IdListReference;
  abstract getIdList(reference: IdListReference): string[] | null;
  abstract storeImage(base64Image: string): ImageReference;
  abstract getImage(reference: ImageReference): string | null;
  abstract storeTable(tableMarkdown: string): TableReference;
  abstract getTable(reference: TableReference): string | null;
  abstract storeHeatMap(values: string): HeatMapReference;
  abstract getHeatMap(reference: HeatMapReference): string | null;
  abstract storeOverview(values: OverviewDetails): OverviewReference;
  abstract updateOverview(reference: OverviewReference, values: OverviewDetails): void;
  abstract getOverview(reference: OverviewReference): OverviewDetails | null;
  abstract clear(): void;
}

// Implementation class
export class ReferenceManagerService implements IReferenceManagerService {
  private idLists = new Map<IdListReference, string[]>();
  private images = new Map<ImageReference, string>();
  private tables = new Map<TableReference, string>();
  private heatMaps = new Map<HeatMapReference, string>();
  private overviews = new Map<OverviewReference, OverviewDetails>();

  constructor(@inject(TYPES.StateStoreService) private store: IStateStoreService<AppState>) {}

  storeIdList(ids: string[]): IdListReference {
    const reference: IdListReference = `id-list-${uuid()}`;
    this.idLists.set(reference, ids);
    return reference;
  }

  getIdList(reference: IdListReference): string[] | null {
    return this.idLists.get(reference) || null;
  }

  storeImage(base64Image: string): ImageReference {
    const reference: ImageReference = `image-${uuid()}`;
    this.images.set(reference, base64Image);
    return reference;
  }

  getImage(reference: ImageReference): string | null {
    return this.images.get(reference) || null;
  }

  storeTable(tableMarkdown: string): TableReference {
    const reference: TableReference = `embedded-table-${uuid()}`;
    this.tables.set(reference, tableMarkdown);
    return reference;
  }

  getTable(reference: TableReference): string | null {
    return this.tables.get(reference) || null;
  }

  storeHeatMap(values: string): HeatMapReference {
    const reference: HeatMapReference = `heat-map-${uuid()}`;
    this.heatMaps.set(reference, values);
    return reference;
  }

  getHeatMap(reference: HeatMapReference): string | null {
    return this.heatMaps.get(reference) || null;
  }

  storeOverview(values: OverviewDetails): OverviewReference {
    const reference: OverviewReference = `overview-${uuid()}`;
    this.overviews.set(reference, values);
    return reference;
  }

  getOverview(reference: OverviewReference): OverviewDetails | null {
    const overview = this.overviews.get(reference) || null;
    if (!overview) {
      return null;
    }

    return overview;
  }

  updateOverview(reference: OverviewReference, values: OverviewDetails): void {
    this.overviews.set(reference, values);
  }

  clear() {
    this.idLists.clear();
    this.images.clear();
    this.tables.clear();
  }
}
