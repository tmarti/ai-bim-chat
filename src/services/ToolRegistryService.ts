import { DynamicStructuredTool } from "langchain/tools";
import { injectable } from "inversify";

export type toolNames =
  'BimFloorplanTool' |
  'DatabaseOverviewTool' |
  'DatabaseQueryTool' |
  'ViewerColorizeObjectTool' |
  'ViewerHideObjectTool' |
  'ViewerHighlightObjectTool' |
  'ViewerIsolateObjectTool' |
  'ViewerSnapshotTool';

/**
 * Interface for an AI agent tool registry service.
 * 
 * This service is used to register tools with the AI agent,
 * and make them available to the agent.
 */
@injectable()
export abstract class IToolRegistryService {
  /**
   * Register a tool with the AI agent.
   * 
   * @param tool - The tool to register.
   */
  abstract registerTool(tool: DynamicStructuredTool): void;

  /**
   * Get all registered tools.
   * 
   * @returns An array of all registered tools.
   */
  abstract getRegisteredTools(): DynamicStructuredTool[];
}

export class LangChainToolRegistryService implements IToolRegistryService {
  private tools = new Map<string, DynamicStructuredTool>();

  registerTool(tool: DynamicStructuredTool): void {
    this.tools.set(tool.name, tool);
  }

  getRegisteredTools(): DynamicStructuredTool[] {
    return Array.from(this.tools.values());
  }
}
