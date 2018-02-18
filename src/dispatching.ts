import { ISubscribable } from "./definitions/subscribables";
import { Subscription } from "./subscription";

/**
 * Hides the implementation of the event dispatcher. Will expose methods that
 * are relevent to the event.
 */
export class DispatcherWrapper<THandler> implements ISubscribable<THandler> {
  private _subscribe: (fn: THandler) => () => void;
  private _unsubscribe: (fn: THandler) => void;
  private _one: (fn: THandler) => () => void;
  private _has: (fn: THandler) => boolean;
  private _clear: () => void;

  /**
   * Creates a new EventDispatcherWrapper instance.
   * @param dispatcher The dispatcher.
   */
  constructor(dispatcher: ISubscribable<THandler>) {
    this._subscribe = (fn: THandler) => dispatcher.subscribe(fn);
    this._unsubscribe = (fn: THandler) => dispatcher.unsubscribe(fn);
    this._one = (fn: THandler) => dispatcher.one(fn);
    this._has = (fn: THandler) => dispatcher.has(fn);
    this._clear = () => dispatcher.clear();
  }

  /**
   * Subscribe to the event dispatcher.
   * @param fn The event handler that is called when the event is dispatched.
   * @returns A function that unsubscribes the event handler from the event.
   */
  public subscribe(fn: THandler): () => void {
    return this._subscribe(fn);
  }

  /**
   * Subscribe to the event dispatcher.
   * @param fn The event handler that is called when the event is dispatched.
   * @returns A function that unsubscribes the event handler from the event.
   */
  public sub(fn: THandler): () => void {
    return this.subscribe(fn);
  }

  /**
   * Unsubscribe from the event dispatcher.
   * @param fn The event handler that is called when the event is dispatched.
   */
  public unsubscribe(fn: THandler): void {
    this._unsubscribe(fn);
  }

  /**
   * Unsubscribe from the event dispatcher.
   * @param fn The event handler that is called when the event is dispatched.
   */
  public unsub(fn: THandler): void {
    this.unsubscribe(fn);
  }

  /**
   * Subscribe once to the event with the specified name.
   * @param fn The event handler that is called when the event is dispatched.
   */
  public one(fn: THandler): () => void {
    return this._one(fn);
  }

  /**
   * Checks it the event has a subscription for the specified handler.
   * @param fn The event handler.
   */
  public has(fn: THandler): boolean {
    return this._has(fn);
  }

  /**
   * Clears all the subscriptions.
   */
  public clear(): void {
    this._clear();
  }
}

/**
 * Base class for implementation of the dispatcher. It facilitates the subscribe
 * and unsubscribe methods based on generic handlers. The TEventType specifies
 * the type of event that should be exposed. Use the asEvent to expose the
 * dispatcher as event.
 */
export abstract class DispatcherBase<TEventHandler>
  implements ISubscribable<TEventHandler> {
  private _wrap = new DispatcherWrapper(this);
  private _subscriptions = new Array<Subscription<TEventHandler>>();

  /**
   * Subscribe to the event dispatcher.
   * @param fn The event handler that is called when the event is dispatched.
   * @returns A function that unsubscribes the event handler from the event.
   */
  public subscribe(fn: TEventHandler): () => void {
    if (fn) {
      this._subscriptions.push(new Subscription<TEventHandler>(fn, false));
    }
    return () => {
      this.unsubscribe(fn);
    };
  }

  /**
   * Subscribe to the event dispatcher.
   * @param fn The event handler that is called when the event is dispatched.
   * @returns A function that unsubscribes the event handler from the event.
   */
  public sub(fn: TEventHandler): () => void {
    return this.subscribe(fn);
  }

  /**
   * Subscribe once to the event with the specified name.
   * @param fn The event handler that is called when the event is dispatched.
   * @returns A function that unsubscribes the event handler from the event.
   */
  public one(fn: TEventHandler): () => void {
    if (fn) {
      this._subscriptions.push(new Subscription<TEventHandler>(fn, true));
    }
    return () => {
      this.unsubscribe(fn);
    };
  }

  /**
   * Checks it the event has a subscription for the specified handler.
   * @param fn The event handler.
   */
  public has(fn: TEventHandler): boolean {
    if (fn) {
      for (let sub of this._subscriptions) {
        if (sub.handler == fn) {
          return true;
        }
      }
    }

    return false;
  }

  /**
   * Unsubscribes the handler from the dispatcher.
   * @param fn The event handler.
   */
  public unsubscribe(fn: TEventHandler): void {
    if (fn) {
      for (let i = 0; i < this._subscriptions.length; i++) {
        let sub = this._subscriptions[i];
        if (sub.handler == fn) {
          this._subscriptions.splice(i, 1);
          break;
        }
      }
    }
  }

  /**
   * Unsubscribes the handler from the dispatcher.
   * @param fn The event handler.
   */
  public unsub(fn: TEventHandler): void {
    this.unsubscribe(fn);
  }

  /**
   * Generic dispatch will dispatch the handlers with the given arguments.
   *
   * @protected
   * @param {boolean} executeAsync True if the even should be executed async.
   * @param {*} The scope the scope of the event.
   * @param {IArguments} args The arguments for the event.
   */
  protected _dispatch(
    executeAsync: boolean,
    scope: any,
    args: IArguments
  ): void {
    for (let i = 0; i < this._subscriptions.length; i++) {
      let sub = this._subscriptions[i];

      if (sub.isOnce) {
        if (sub.isExecuted === true) {
          continue;
        }

        this._subscriptions.splice(i, 1);
        i--;
      }

      sub.execute(executeAsync, scope, args);
    }
  }

  /**
   * Creates an event from the dispatcher. Will return the dispatcher
   * in a wrapper. This will prevent exposure of any dispatcher methods.
   */
  public asEvent(): ISubscribable<TEventHandler> {
    return this._wrap;
  }

  /**
   * Clears all the subscriptions.
   */
  public clear(): void {
    this._subscriptions.splice(0, this._subscriptions.length);
  }
}

/**
 * Base class for event lists classes. Implements the get and remove.
 */
export abstract class EventListBase<TEventDispatcher> {
  private _events: { [name: string]: TEventDispatcher } = {};

  /**
   * Gets the dispatcher associated with the name.
   * @param name The name of the event.
   */
  get(name: string): TEventDispatcher {
    let event = this._events[name];

    if (event) {
      return event;
    }

    event = this.createDispatcher();
    this._events[name] = event;
    return event;
  }

  /**
   * Removes the dispatcher associated with the name.
   * @param name The name of the event.
   */
  remove(name: string): void {
    this._events[name] = null;
  }

  /**
   * Creates a new dispatcher instance.
   */
  protected abstract createDispatcher(): TEventDispatcher;
}
