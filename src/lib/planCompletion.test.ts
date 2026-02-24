import { describe, it, expect } from 'vitest';
import {
  isPlanCompleted,
  checkAllTasksCompleted,
  calculateCompletionAnalytics,
  buildPlanMemory,
} from './planCompletion';

const makePlan = (overrides: any = {}) => ({
  completed_at: '2026-02-20T00:00:00Z',
  weeks: [
    {
      tasks: [
        { title: 'Task A', completed: true, completed_at: '2026-02-15T10:00:00Z', time_spent_seconds: 3600 },
        { title: 'Task B', completed: true, completed_at: '2026-02-16T10:00:00Z', time_spent_seconds: 1800 },
      ],
    },
    {
      tasks: [
        { title: 'Task C', completed: true, completed_at: '2026-02-17T10:00:00Z', time_spent_seconds: 900 },
      ],
    },
  ],
  ...overrides,
});

describe('isPlanCompleted', () => {
  it('returns true when completed_at is set', () => {
    expect(isPlanCompleted({ completed_at: '2026-02-20T00:00:00Z' })).toBe(true);
  });
  it('returns false when completed_at is null', () => {
    expect(isPlanCompleted({ completed_at: null })).toBe(false);
  });
  it('returns false for undefined plan', () => {
    expect(isPlanCompleted(undefined)).toBe(false);
  });
});

describe('checkAllTasksCompleted', () => {
  it('returns true when all tasks are completed', () => {
    expect(checkAllTasksCompleted(makePlan())).toBe(true);
  });
  it('returns false when one task is incomplete', () => {
    const plan = makePlan();
    plan.weeks[0].tasks[0].completed = false;
    expect(checkAllTasksCompleted(plan)).toBe(false);
  });
  it('returns true for empty weeks (vacuous truth — no incomplete tasks)', () => {
    expect(checkAllTasksCompleted({ weeks: [] })).toBe(true);
  });
  it('returns false for null plan', () => {
    expect(checkAllTasksCompleted(null)).toBe(false);
  });
});

describe('calculateCompletionAnalytics', () => {
  it('calculates total time spent', () => {
    const analytics = calculateCompletionAnalytics(makePlan(), '2026-02-10T00:00:00Z');
    expect(analytics.totalTimeSpentSeconds).toBe(6300); // 3600 + 1800 + 900
  });
  it('counts total tasks', () => {
    const analytics = calculateCompletionAnalytics(makePlan(), '2026-02-10T00:00:00Z');
    expect(analytics.totalTasks).toBe(3);
  });
  it('returns 100% completion rate', () => {
    const analytics = calculateCompletionAnalytics(makePlan(), '2026-02-10T00:00:00Z');
    expect(analytics.completionRate).toBe(100);
  });
  it('identifies most worked task', () => {
    const analytics = calculateCompletionAnalytics(makePlan(), '2026-02-10T00:00:00Z');
    expect(analytics.mostWorkedTask?.taskTitle).toBe('Task A');
    expect(analytics.mostWorkedTask?.seconds).toBe(3600);
  });
});

describe('buildPlanMemory', () => {
  it('builds memory with correct fields', () => {
    const memory = buildPlanMemory(makePlan(), '2026-02-10T00:00:00Z', 'plan-123');
    expect(memory.plan_id).toBe('plan-123');
    expect(memory.total_time_spent).toBe(6300);
    expect(memory.most_worked_task).toBe('Task A');
    expect(memory.completed_at).toBe('2026-02-20T00:00:00Z');
  });

  // Change 2: Deterministic completion_speed
  describe('completion_speed logic', () => {
    it('returns "faster" when days < planned duration', () => {
      // total_weeks=2 → planned=14 days, actual=10 days
      const plan = makePlan({ total_weeks: 2 });
      const memory = buildPlanMemory(plan, '2026-02-10T00:00:00Z', 'p1');
      expect(memory.completion_speed).toBe('faster');
    });
    it('returns "on_time" when days === planned duration', () => {
      // total_weeks=2 → planned=14 days, created Feb 6 → completed Feb 20 = 14 days
      const plan = makePlan({ total_weeks: 2 });
      const memory = buildPlanMemory(plan, '2026-02-06T00:00:00Z', 'p2');
      expect(memory.completion_speed).toBe('on_time');
    });
    it('returns "slower" when days > planned duration', () => {
      // total_weeks=1 → planned=7 days, actual=10 days
      const plan = makePlan({ total_weeks: 1 });
      const memory = buildPlanMemory(plan, '2026-02-10T00:00:00Z', 'p3');
      expect(memory.completion_speed).toBe('slower');
    });
    it('omits completion_speed for open-ended plans', () => {
      const plan = makePlan({ total_weeks: 2, is_open_ended: true });
      const memory = buildPlanMemory(plan, '2026-02-10T00:00:00Z', 'p4');
      expect(memory.completion_speed).toBeUndefined();
    });
    it('omits completion_speed when no total_weeks', () => {
      const plan = makePlan();
      const memory = buildPlanMemory(plan, '2026-02-10T00:00:00Z', 'p5');
      expect(memory.completion_speed).toBeUndefined();
    });
  });

  // Change 3: Execution consistency formula
  describe('execution_consistency_score', () => {
    it('calculates based on unique active dates / total days', () => {
      // 3 unique dates (Feb 15, 16, 17), 10 total days → 30%
      const memory = buildPlanMemory(makePlan(), '2026-02-10T00:00:00Z', 'p6');
      expect(memory.execution_consistency_score).toBe(30);
    });
    it('caps at 100 when more active days than total', () => {
      // 3 unique dates, 1 total day → capped at 100
      const memory = buildPlanMemory(makePlan(), '2026-02-19T00:00:00Z', 'p7');
      expect(memory.execution_consistency_score).toBeLessThanOrEqual(100);
    });
  });
});
