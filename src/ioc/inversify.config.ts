import { AppState, IStateStoreService, StateStoreService } from "../state/StoreService";
import { Container } from "inversify";
import { DatabaseQueryService, IDatabaseQueryService } from "../services/DatabaseQueryService";
import { FenceBlockProcessorRegistryService, IFenceBlockProcessorRegistryService } from "../markdown/services/FenceBlockProcessorRegistryService";
import { IDatabaseService, SqliteDatabaseService } from "../services/DatabaseService";
import { ILogService, ConsoleLogService } from "../services/LogService";
import { IMessageManagerService, MessageManagerService } from "../state/MessageManagerService";
import { IModelFloorplanService, XeokitModelFloorplanService } from "../services/model-data/ModelFloorplanService";
import { IModelMetadataService, XeokitModelMetadataService } from "../services/model-data/ModelMetadataService";
import { IOpenaiLlmService, OpenaiLlmService } from "../services/OpenaiLlmService";
import { IReferenceManagerService, ReferenceManagerService } from "../state/ReferenceManagerService";
import { ISelectionManagerService, SelectionManagerService } from "../state/SelectionManagerService";
import { ISnapshotManagerService, SnapshotManagerService } from "../state/SnapshotManagerService";
import { IThinkingIndicatorService, ThinkingIndicatorService } from "../state/ThinkingIndicatorService";
import { IToolRegistryService, LangChainToolRegistryService } from "../services/ToolRegistryService";
import { IViewerObjectStateService, XeokitViewerObjectStateService } from "../services/viewer-control/ViewerObjectStateService";
import { IViewerService, XeokitViewerService } from "../services/ViewerService";
import { IViewerSnapshotService, XeokitViewerSnapshotService } from "../services/viewer-control/ViewerSnapshotService";
import { ServiceMap } from "./ServiceMap";
import { TYPES } from "./types";
import { IViewerCameraControlService, XeokitViewerCameraControlService } from "../services/viewer-control/ViewerCameraControlService";

const container = new Container({
    defaultScope: "Singleton",
});

container.bind<ILogService>(TYPES.LogService).to(ConsoleLogService);
container.bind<IDatabaseService>(TYPES.DatabaseService).to(SqliteDatabaseService);
container.bind<IViewerService>(TYPES.ViewerService).to(XeokitViewerService);
container.bind<IToolRegistryService>(TYPES.ToolRegistryService).to(LangChainToolRegistryService);
container.bind<ISelectionManagerService>(TYPES.SelectionManagerService).to(SelectionManagerService);
container.bind<ISnapshotManagerService>(TYPES.SnapshotManagerService).to(SnapshotManagerService);
container.bind<IMessageManagerService>(TYPES.MessageManagerService).to(MessageManagerService);
container.bind<IStateStoreService<AppState>>(TYPES.StateStoreService).to(StateStoreService<AppState>);
container.bind<IThinkingIndicatorService>(TYPES.ThinkingIndicatorService).to(ThinkingIndicatorService);
container.bind<IReferenceManagerService>(TYPES.ReferenceManagerService).to(ReferenceManagerService);
container.bind<IOpenaiLlmService>(TYPES.OpenaiLlmService).to(OpenaiLlmService);
container.bind<IDatabaseQueryService>(TYPES.DatabaseQueryService).to(DatabaseQueryService);
container.bind<IFenceBlockProcessorRegistryService>(TYPES.FenceBlockProcessorRegistryService).to(FenceBlockProcessorRegistryService);
container.bind<IModelMetadataService>(TYPES.ModelMetadataService).to(XeokitModelMetadataService);
container.bind<IModelFloorplanService>(TYPES.ModelFloorplanService).to(XeokitModelFloorplanService);
container.bind<IViewerSnapshotService>(TYPES.ViewerSnapshotService).to(XeokitViewerSnapshotService);
container.bind<IViewerObjectStateService>(TYPES.ViewerObjectStateService).to(XeokitViewerObjectStateService);
container.bind<IViewerCameraControlService>(TYPES.ViewerCameraControlService).to(XeokitViewerCameraControlService);

const resolve = <T extends keyof ServiceMap>(identifier: T): ServiceMap[T] => {
  return container.get<ServiceMap[T]>(identifier) as ServiceMap[T];
};

export { resolve };
