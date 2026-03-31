import { describe, it, expect, vi, beforeEach } from 'vitest';
import { StateMachine } from '../src/core/StateMachine';

describe('StateMachine', () => {
  let sm: StateMachine;

  beforeEach(() => {
    sm = new StateMachine('menu');
  });

  describe('constructor and getState', () => {
    it('should initialise with the given state', () => {
      expect(sm.getState()).toBe('menu');
    });

    it('should support different initial states', () => {
      const sm2 = new StateMachine('playing');
      expect(sm2.getState()).toBe('playing');
    });
  });

  describe('is', () => {
    it('should return true for current state', () => {
      expect(sm.is('menu')).toBe(true);
    });

    it('should return false for non-current state', () => {
      expect(sm.is('playing')).toBe(false);
    });
  });

  describe('transition (no rules)', () => {
    it('should transition to a new state', () => {
      const result = sm.transition('playing');
      expect(result).toBe(true);
      expect(sm.getState()).toBe('playing');
    });

    it('should return false when transitioning to the same state', () => {
      const result = sm.transition('menu');
      expect(result).toBe(false);
      expect(sm.getState()).toBe('menu');
    });

    it('should support multiple transitions', () => {
      sm.transition('playing');
      sm.transition('paused');
      sm.transition('playing');
      expect(sm.getState()).toBe('playing');
    });
  });

  describe('addState with hooks', () => {
    it('should call onEnter when entering a state', () => {
      const onEnter = vi.fn();
      sm.addState('playing', { onEnter });
      sm.transition('playing');
      expect(onEnter).toHaveBeenCalledWith('menu', 'playing');
    });

    it('should call onExit when leaving a state', () => {
      const onExit = vi.fn();
      sm.addState('menu', { onExit });
      sm.transition('playing');
      expect(onExit).toHaveBeenCalledWith('menu', 'playing');
    });

    it('should call onExit before onEnter', () => {
      const order: string[] = [];
      sm.addState('menu', { onExit: () => order.push('exit-menu') });
      sm.addState('playing', { onEnter: () => order.push('enter-playing') });
      sm.transition('playing');
      expect(order).toEqual(['exit-menu', 'enter-playing']);
    });

    it('should not call hooks when transition is to same state', () => {
      const onEnter = vi.fn();
      const onExit = vi.fn();
      sm.addState('menu', { onEnter, onExit });
      sm.transition('menu');
      expect(onEnter).not.toHaveBeenCalled();
      expect(onExit).not.toHaveBeenCalled();
    });
  });

  describe('addTransition (allowed transitions)', () => {
    it('should allow registered transitions', () => {
      sm.addTransition('menu', 'playing');
      const result = sm.transition('playing');
      expect(result).toBe(true);
      expect(sm.getState()).toBe('playing');
    });

    it('should block unregistered transitions', () => {
      sm.addTransition('menu', 'playing');
      const result = sm.transition('gameover');
      expect(result).toBe(false);
      expect(sm.getState()).toBe('menu');
    });

    it('should support multiple transitions from one state', () => {
      sm.addTransition('menu', 'playing');
      sm.addTransition('menu', 'settings');
      expect(sm.transition('playing')).toBe(true);
    });

    it('should chain addTransition calls', () => {
      sm.addTransition('menu', 'playing').addTransition('playing', 'paused');
      sm.transition('playing');
      expect(sm.transition('paused')).toBe(true);
    });

    it('should allow free transitions from states with no rules', () => {
      sm.addTransition('menu', 'playing');
      sm.transition('playing');
      // 'playing' has no defined transitions, so any transition is allowed
      expect(sm.transition('gameover')).toBe(true);
    });
  });

  describe('canTransition', () => {
    it('should return true for allowed transitions', () => {
      sm.addTransition('menu', 'playing');
      expect(sm.canTransition('playing')).toBe(true);
    });

    it('should return false for disallowed transitions', () => {
      sm.addTransition('menu', 'playing');
      expect(sm.canTransition('gameover')).toBe(false);
    });

    it('should return true when no rules are defined', () => {
      expect(sm.canTransition('anything')).toBe(true);
    });
  });

  describe('guards', () => {
    it('should prevent transition when guard returns false', () => {
      sm.addGuard(() => false);
      const result = sm.transition('playing');
      expect(result).toBe(false);
      expect(sm.getState()).toBe('menu');
    });

    it('should allow transition when guard returns true', () => {
      sm.addGuard(() => true);
      const result = sm.transition('playing');
      expect(result).toBe(true);
    });

    it('should receive from and to states', () => {
      const guard = vi.fn().mockReturnValue(true);
      sm.addGuard(guard);
      sm.transition('playing');
      expect(guard).toHaveBeenCalledWith('menu', 'playing');
    });

    it('should block if any guard returns false', () => {
      sm.addGuard(() => true);
      sm.addGuard(() => false);
      expect(sm.transition('playing')).toBe(false);
    });

    it('should check guards after allowed transitions', () => {
      sm.addTransition('menu', 'playing');
      sm.addGuard((_from, to) => to !== 'playing');
      expect(sm.transition('playing')).toBe(false);
    });

    it('should not call hooks when guard blocks transition', () => {
      const onEnter = vi.fn();
      sm.addState('playing', { onEnter });
      sm.addGuard(() => false);
      sm.transition('playing');
      expect(onEnter).not.toHaveBeenCalled();
    });
  });

  describe('game state scenario', () => {
    it('should model the full game state lifecycle', () => {
      sm.addTransition('menu', 'playing')
        .addTransition('playing', 'paused')
        .addTransition('playing', 'levelup')
        .addTransition('playing', 'gameover')
        .addTransition('paused', 'playing')
        .addTransition('levelup', 'playing')
        .addTransition('gameover', 'menu');

      expect(sm.is('menu')).toBe(true);

      // Start game
      expect(sm.transition('playing')).toBe(true);
      expect(sm.is('playing')).toBe(true);

      // Level up
      expect(sm.transition('levelup')).toBe(true);
      expect(sm.is('levelup')).toBe(true);

      // Resume playing
      expect(sm.transition('playing')).toBe(true);

      // Pause
      expect(sm.transition('paused')).toBe(true);
      expect(sm.is('paused')).toBe(true);

      // Resume
      expect(sm.transition('playing')).toBe(true);

      // Game over
      expect(sm.transition('gameover')).toBe(true);
      expect(sm.is('gameover')).toBe(true);

      // Back to menu
      expect(sm.transition('menu')).toBe(true);

      // Cannot skip from menu to gameover
      expect(sm.transition('gameover')).toBe(false);
      expect(sm.is('menu')).toBe(true);
    });
  });
});
