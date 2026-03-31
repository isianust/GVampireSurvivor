/** Lightweight publish/subscribe event bus for decoupled communication. */

type EventCallback = (...args: unknown[]) => void;

export class EventBus {
  private listeners: Map<string, EventCallback[]> = new Map();

  /** Subscribe to an event. Returns an unsubscribe function. */
  on(event: string, callback: EventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(callback);

    return () => this.off(event, callback);
  }

  /** Unsubscribe from an event. */
  off(event: string, callback: EventCallback): void {
    const cbs = this.listeners.get(event);
    if (!cbs) return;
    const idx = cbs.indexOf(callback);
    if (idx >= 0) cbs.splice(idx, 1);
    if (cbs.length === 0) this.listeners.delete(event);
  }

  /** Emit an event with optional data. */
  emit(event: string, ...args: unknown[]): void {
    const cbs = this.listeners.get(event);
    if (!cbs) return;
    // Iterate over a copy in case a handler modifies the list
    const copy = [...cbs];
    for (const cb of copy) {
      cb(...args);
    }
  }

  /** Remove all listeners, optionally only for a specific event. */
  clear(event?: string): void {
    if (event) {
      this.listeners.delete(event);
    } else {
      this.listeners.clear();
    }
  }

  /** Return listener count for a given event (useful for testing). */
  listenerCount(event: string): number {
    return this.listeners.get(event)?.length ?? 0;
  }
}

/** Singleton event bus instance for the game. */
export const eventBus = new EventBus();
