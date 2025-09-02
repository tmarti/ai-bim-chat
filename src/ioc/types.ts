import { ServiceMap } from "./ServiceMap";

export const TYPES : {[key: string]: keyof ServiceMap} = {
  DatabaseService: "DatabaseService",
  ViewerService: "ViewerService",
  ToolRegistryService: "ToolRegistryService",
  SelectionManagerService: "SelectionManagerService",
  SnapshotManagerService: "SnapshotManagerService",
  MessageManagerService: "MessageManagerService",
  StateStoreService: "StateStoreService",
  ThinkingIndicatorService: "ThinkingIndicatorService",
  ReferenceManagerService: "ReferenceManagerService",
  LogService: "LogService",
  OpenaiLlmService: "OpenaiLlmService",
  DatabaseQueryService: "DatabaseQueryService",
  FenceBlockProcessorRegistryService: "FenceBlockProcessorRegistryService",
  ModelMetadataService: "ModelMetadataService",
  ModelFloorplanService: "ModelFloorplanService",
  ViewerSnapshotService: "ViewerSnapshotService",
  ViewerObjectStateService: "ViewerObjectStateService",
  ViewerCameraControlService: "ViewerCameraControlService",
};
