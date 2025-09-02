import { AppState } from "../state/StoreService";
import { BimFloorplanTool } from "../agents/tools/BimFloorplanTool";
import { ChartJsFenceBlockProcessor } from "../markdown/processors/ChartJsFenceBlockProcessor";
import { DatabaseOverviewTool } from "../agents/tools/DatabaseOverviewTool";
import { DatabaseQueryTool } from "../agents/tools/DatabaseQueryTool";
import { EmbeddedImageBlockProcessor } from "../markdown/processors/EmbeddedImageBlockProcessor";
import { EmbeddedMarkdownFenceBlockProcessor } from "../markdown/processors/EmbeddedMarkdownFenceBlockProcessor";
import { EmbeddedTableFenceBlockProcessor } from "../markdown/processors/EmbedddTableFenceBlockProcessor";
import { HeatMapFenceBlockProcessor } from "../markdown/processors/HeatMapFenceBlockProcessor";
import { resolve } from "../ioc/inversify.config";
import { Snapshot } from "../state/Dto/Snapshot";
import { SuggestionFenceBlockProcessor } from "../markdown/processors/SuggestionFenceBlockProcessor";
import { ViewerColorizeObjectTool } from "../agents/tools/ViewerColorizeObjectTool";
import { ViewerHideObjectTool } from "../agents/tools/ViewerHideObjectTool";
import { ViewerHighlightObjectTool } from "../agents/tools/ViewerHighlightObjectTool";
import { ViewerIsolateObjectTool } from "../agents/tools/ViewerIsolateObjectTool";
import { ViewerSnapshotTool } from "../agents/tools/ViewerSnapshotTool";
import { ConclusionReasonFenceBlockProcessor } from "../markdown/processors/ConclusionReasonFenceBlockProcessor";

export const registerServices = async (canvasElement: HTMLCanvasElement) => {
  const initialState: AppState = {
    messages: [],
    selection: {
      ids: new Set(),
      source: "system",
    },
    snapshots: new Map<string, Snapshot>(),
    thinking: {
      busy: false,
    },
  };

  // Initialize State
  const store = resolve('StateStoreService');
  store.loadState(initialState);

  // Initialize Viewer
  const viewerService = resolve('ViewerService');
  await viewerService.initialize(canvasElement);

  // Initialize Database
  const databaseService = resolve('DatabaseService');
  await databaseService.initialize();

  // Register AI Tools
  const toolRegistry = resolve('ToolRegistryService');

  toolRegistry.registerTool(new BimFloorplanTool());
  toolRegistry.registerTool(new DatabaseOverviewTool());
  toolRegistry.registerTool(new DatabaseQueryTool());
  toolRegistry.registerTool(new ViewerColorizeObjectTool());
  toolRegistry.registerTool(new ViewerHideObjectTool());
  toolRegistry.registerTool(new ViewerHighlightObjectTool());
  toolRegistry.registerTool(new ViewerIsolateObjectTool());
  toolRegistry.registerTool(new ViewerSnapshotTool());

  // Register Fence Block Processors
  const fenceBlockProcessorRegistry = resolve('FenceBlockProcessorRegistryService');

  fenceBlockProcessorRegistry.register("embedded-chart", new ChartJsFenceBlockProcessor());
  fenceBlockProcessorRegistry.register("suggestion", new SuggestionFenceBlockProcessor());
  fenceBlockProcessorRegistry.register("embedded-table", new EmbeddedTableFenceBlockProcessor());
  fenceBlockProcessorRegistry.register("embedded-image", new EmbeddedImageBlockProcessor());
  fenceBlockProcessorRegistry.register("heat-map", new HeatMapFenceBlockProcessor());
  // fenceBlockProcessorRegistry.register("embedded-markdown", new EmbeddedMarkdownFenceBlockProcessor());
  fenceBlockProcessorRegistry.register("conclusion-reason", new ConclusionReasonFenceBlockProcessor());
};
