import { AppState, IStateStoreService } from "../state/StoreService";
import { IDatabaseService } from "../services/DatabaseService";
import { IDatabaseQueryService } from "../services/DatabaseQueryService";
import { IFenceBlockProcessorRegistryService } from "../markdown/services/FenceBlockProcessorRegistryService";
import { ILogService } from "../services/LogService";
import { IMessageManagerService } from "../state/MessageManagerService";
import { IModelFloorplanService } from "../services/model-data/ModelFloorplanService";
import { IModelMetadataService } from "../services/model-data/ModelMetadataService";
import { IOpenaiLlmService } from "../services/OpenaiLlmService";
import { IReferenceManagerService } from "../state/ReferenceManagerService";
import { ISelectionManagerService } from "../state/SelectionManagerService";
import { ISnapshotManagerService } from "../state/SnapshotManagerService";
import { IThinkingIndicatorService } from "../state/ThinkingIndicatorService";
import { IToolRegistryService } from "../services/ToolRegistryService";
import { IViewerObjectStateService } from "../services/viewer-control/ViewerObjectStateService";
import { IViewerService } from "../services/ViewerService";
import { IViewerSnapshotService } from "../services/viewer-control/ViewerSnapshotService";
import { IViewerCameraControlService } from "../services/viewer-control/ViewerCameraControlService";

export type ServiceMap = {
  "DatabaseService": IDatabaseService,
  "ViewerService": IViewerService,
  "ToolRegistryService": IToolRegistryService,
  "SelectionManagerService": ISelectionManagerService,
  "SnapshotManagerService": ISnapshotManagerService,
  "MessageManagerService": IMessageManagerService,
  "StateStoreService": IStateStoreService<AppState>,
  "ThinkingIndicatorService": IThinkingIndicatorService,
  "ReferenceManagerService": IReferenceManagerService,
  "LogService": ILogService,
  "OpenaiLlmService": IOpenaiLlmService,
  "DatabaseQueryService": IDatabaseQueryService,
  "FenceBlockProcessorRegistryService": IFenceBlockProcessorRegistryService,
  "ModelMetadataService": IModelMetadataService,
  "ModelFloorplanService": IModelFloorplanService,
  "ViewerSnapshotService": IViewerSnapshotService,
  "ViewerObjectStateService": IViewerObjectStateService,
  "ViewerCameraControlService": IViewerCameraControlService,
};
