/**
 * Finite state machine for managing game states.
 * Supports enter/exit hooks and transition guards.
 */

export type StateHook = (from: string, to: string) => void;
export type TransitionGuard = (from: string, to: string) => boolean;

export interface StateConfig {
  onEnter?: StateHook;
  onExit?: StateHook;
}

export class StateMachine {
  private current: string;
  private readonly states: Map<string, StateConfig> = new Map();
  private readonly allowedTransitions: Map<string, Set<string>> = new Map();
  private readonly guards: TransitionGuard[] = [];

  constructor(initial: string) {
    this.current = initial;
  }

  /** Register a state with optional enter/exit hooks. */
  addState(name: string, config: StateConfig = {}): this {
    this.states.set(name, config);
    return this;
  }

  /** Define which transitions are allowed. */
  addTransition(from: string, to: string): this {
    if (!this.allowedTransitions.has(from)) {
      this.allowedTransitions.set(from, new Set());
    }
    this.allowedTransitions.get(from)!.add(to);
    return this;
  }

  /** Add a guard that can prevent transitions. */
  addGuard(guard: TransitionGuard): this {
    this.guards.push(guard);
    return this;
  }

  /** Get the current state. */
  getState(): string {
    return this.current;
  }

  /** Check if a transition is allowed. */
  canTransition(to: string): boolean {
    const allowed = this.allowedTransitions.get(this.current);
    if (allowed && !allowed.has(to)) return false;
    return this.guards.every((g) => g(this.current, to));
  }

  /**
   * Transition to a new state.
   * Returns true if the transition was successful, false otherwise.
   */
  transition(to: string): boolean {
    if (to === this.current) return false;

    // Check allowed transitions (if any are defined for this state)
    const allowed = this.allowedTransitions.get(this.current);
    if (allowed && !allowed.has(to)) return false;

    // Run guards
    for (const guard of this.guards) {
      if (!guard(this.current, to)) return false;
    }

    const from = this.current;

    // Exit current state
    const exitConfig = this.states.get(from);
    if (exitConfig?.onExit) {
      exitConfig.onExit(from, to);
    }

    this.current = to;

    // Enter new state
    const enterConfig = this.states.get(to);
    if (enterConfig?.onEnter) {
      enterConfig.onEnter(from, to);
    }

    return true;
  }

  /** Check if the machine is in a specific state. */
  is(state: string): boolean {
    return this.current === state;
  }
}
