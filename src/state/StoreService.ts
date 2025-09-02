import { Snapshot } from "./Dto/Snapshot";
import { Message } from "./Dto/Message";
import { ISelection } from "./Dto/Selection";
import { ThinkingState } from "./Dto/Thinking";
import { injectable } from "inversify";
type Subscriber<T> = (state: T) => void;

/**
 * Interface for a state store service.
 * This service is used to store the global application state.
 */
@injectable()
export abstract class IStateStoreService<T> {
  /**
   * The current state of the application.
   */
  abstract value: T;

  /**
   * Update the state of the application.
   * 
   * @param updateFn - The function to update the state.
   */
  abstract update(updateFn: (current: T) => T): void;

  /**
   * Subscribe to state changes.
   * 
   * @param subscriber - The subscriber to add.
   * @returns A function to unsubscribe from state changes.
   */
  abstract subscribe(subscriber: Subscriber<T>): () => void;

  /**
   * Load the inital state of the application.
   * 
   * @param state - The state to load.
   */
  abstract loadState(state: T): void;
}

// Application state types
export interface AppState {
  messages: Message[];
  selection: ISelection;
  snapshots: Map<string, Snapshot>;
  thinking: ThinkingState;
}

export class StateStoreService<T> implements IStateStoreService<T> {
  private subscribers = new Set<Subscriber<T>>();

  private state: T = {} as T;

  constructor() {}

  loadState(state: T) {
    this.state = state;
    this.subscribers.forEach((sub) => sub(this.state));
  }

  get value(): T {
    return this.state;
  }

  update(updateFn: (current: T) => T): void {
    const newState = updateFn(this.state);
    if (newState === this.state) return;

    this.state = newState;
    this.subscribers.forEach((sub) => sub(this.state));
  }

  subscribe(subscriber: Subscriber<T>): () => void {
    this.subscribers.add(subscriber);
    return () => this.subscribers.delete(subscriber);
  }
}
