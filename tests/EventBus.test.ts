import { describe, it, expect, vi, beforeEach } from 'vitest';
import { EventBus } from '../src/core/EventBus';

describe('EventBus', () => {
  let bus: EventBus;

  beforeEach(() => {
    bus = new EventBus();
  });

  describe('on / emit', () => {
    it('should call listener when event is emitted', () => {
      const handler = vi.fn();
      bus.on('test', handler);
      bus.emit('test');
      expect(handler).toHaveBeenCalledOnce();
    });

    it('should pass arguments to listener', () => {
      const handler = vi.fn();
      bus.on('test', handler);
      bus.emit('test', 'arg1', 42);
      expect(handler).toHaveBeenCalledWith('arg1', 42);
    });

    it('should support multiple listeners on the same event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.emit('test');
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('should not call listeners for different events', () => {
      const handler = vi.fn();
      bus.on('eventA', handler);
      bus.emit('eventB');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should handle emitting event with no listeners', () => {
      expect(() => bus.emit('nonexistent')).not.toThrow();
    });

    it('should call listener each time event is emitted', () => {
      const handler = vi.fn();
      bus.on('test', handler);
      bus.emit('test');
      bus.emit('test');
      bus.emit('test');
      expect(handler).toHaveBeenCalledTimes(3);
    });
  });

  describe('off', () => {
    it('should remove a specific listener', () => {
      const handler = vi.fn();
      bus.on('test', handler);
      bus.off('test', handler);
      bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should only remove the specified listener', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.off('test', handler1);
      bus.emit('test');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('should handle removing listener for non-existent event', () => {
      const handler = vi.fn();
      expect(() => bus.off('nonexistent', handler)).not.toThrow();
    });

    it('should handle removing non-existent listener', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('test', handler1);
      bus.off('test', handler2);
      bus.emit('test');
      expect(handler1).toHaveBeenCalledOnce();
    });
  });

  describe('unsubscribe function (returned by on)', () => {
    it('should return an unsubscribe function', () => {
      const handler = vi.fn();
      const unsub = bus.on('test', handler);
      expect(typeof unsub).toBe('function');
    });

    it('should unsubscribe when called', () => {
      const handler = vi.fn();
      const unsub = bus.on('test', handler);
      unsub();
      bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });

    it('should be safe to call multiple times', () => {
      const handler = vi.fn();
      const unsub = bus.on('test', handler);
      unsub();
      unsub(); // second call should be safe
      bus.emit('test');
      expect(handler).not.toHaveBeenCalled();
    });
  });

  describe('clear', () => {
    it('should remove all listeners for a specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.clear('test');
      bus.emit('test');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should not affect other events when clearing a specific event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('eventA', handler1);
      bus.on('eventB', handler2);
      bus.clear('eventA');
      bus.emit('eventA');
      bus.emit('eventB');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('should remove all listeners when called without event', () => {
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      bus.on('eventA', handler1);
      bus.on('eventB', handler2);
      bus.clear();
      bus.emit('eventA');
      bus.emit('eventB');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });
  });

  describe('listenerCount', () => {
    it('should return 0 for events with no listeners', () => {
      expect(bus.listenerCount('test')).toBe(0);
    });

    it('should return correct count after adding listeners', () => {
      bus.on('test', vi.fn());
      bus.on('test', vi.fn());
      expect(bus.listenerCount('test')).toBe(2);
    });

    it('should decrease after removing a listener', () => {
      const handler = vi.fn();
      bus.on('test', handler);
      bus.on('test', vi.fn());
      bus.off('test', handler);
      expect(bus.listenerCount('test')).toBe(1);
    });

    it('should return 0 after clearing', () => {
      bus.on('test', vi.fn());
      bus.clear('test');
      expect(bus.listenerCount('test')).toBe(0);
    });
  });

  describe('edge cases', () => {
    it('should handle listener modifying listener list during emit', () => {
      const handler1 = vi.fn(() => {
        bus.off('test', handler2);
      });
      const handler2 = vi.fn();
      bus.on('test', handler1);
      bus.on('test', handler2);
      bus.emit('test');
      // Both should be called since we iterate over a copy
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).toHaveBeenCalledOnce();
    });

    it('should handle listener adding new listener during emit', () => {
      const handler2 = vi.fn();
      const handler1 = vi.fn(() => {
        bus.on('test', handler2);
      });
      bus.on('test', handler1);
      bus.emit('test');
      // handler2 was added during emit, should NOT be called this round
      expect(handler1).toHaveBeenCalledOnce();
      expect(handler2).not.toHaveBeenCalled();
      // But should be called on next emit
      bus.emit('test');
      expect(handler2).toHaveBeenCalledOnce();
    });
  });
});
