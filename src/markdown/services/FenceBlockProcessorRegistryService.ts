import { IFenceBlockProcessor } from "../IFenceBlockProcessor";
import { injectable } from "inversify";

/**
 * Interface for a fence block processor registry service.
 * 
 * This service is used to register and retrieve fence block processors.
 */
@injectable()
export abstract class IFenceBlockProcessorRegistryService {
  /**
   * Register a fence block processor.
   * 
   * @param type - The fence block type.
   * @param processor - The fence block processor to register.
   */
  abstract register(type: string, processor: IFenceBlockProcessor): void;

  /**
   * Get a fence block processor.
   * 
   * @param type - The fence block type.
   * @returns The fence block processor.
   */
  abstract get(type: string): IFenceBlockProcessor;

  /**
   * Whether a fence block processor is registered.
   * 
   * @param type - The fence block type.
   * @returns Whether the fence block processor is registered.
   */
  abstract has(type: string): boolean;
}

export class FenceBlockProcessorRegistryService implements IFenceBlockProcessorRegistryService {
  private processors: Record<string, IFenceBlockProcessor> = {};

  public register(type: string, processor: IFenceBlockProcessor) {
    if (this.processors[type]) {
      throw new Error(`Processor for type ${type} already registered!`);
    }
    
    this.processors[type] = processor;
  }

  public get(type: string) {
    if (!this.processors[type]) {
      throw new Error(`No processor registered for type ${type}!`);
    }

    return this.processors[type];
  }

  public has(type: string) {
    return type in this.processors;
  }
}

