import test from 'node:test';
import assert from 'node:assert/strict';
import {
  isLeapYear,
  getDaysInMonth,
  calculateDailyKPI,
  getCalendarStatusColor,
  generateCalendarGrid,
  calculateMonthlyKPI,
  calculateAnnualSummary,
  calculateHabitStats,
  calculateGoalProgress,
  type ActivityItem,
  type HabitLogItem
} from './calculations.ts';

test('isLeapYear accurately checks standard and leap years', () => {
  assert.equal(isLeapYear(2026), false);
  assert.equal(isLeapYear(2028), true); // 2028 leap year
  assert.equal(isLeapYear(2000), true); // divisible by 400
  assert.equal(isLeapYear(1900), false); // divisible by 100 but not 400
});

test('getDaysInMonth returns 29 for February in leap year 2028 and 28 in 2026', () => {
  assert.equal(getDaysInMonth(2028, 2), 29);
  assert.equal(getDaysInMonth(2026, 2), 28);
  assert.equal(getDaysInMonth(2026, 1), 31);
  assert.equal(getDaysInMonth(2026, 4), 30);
});

test('calculateDailyKPI handles empty activities with null percentage and dash display', () => {
  const kpi = calculateDailyKPI([]);
  assert.equal(kpi.totalScheduled, 0);
  assert.equal(kpi.completed, 0);
  assert.equal(kpi.percentage, null);
  assert.equal(kpi.percentageDisplay, '—');
});

test('calculateDailyKPI calculates percentage correctly and includes skipped in total', () => {
  const activities: ActivityItem[] = [
    { id: '1', date: '2026-10-19', status: 'Selesai' },
    { id: '2', date: '2026-10-19', status: 'Selesai' },
    { id: '3', date: '2026-10-19', status: 'Sedang Berjalan' },
    { id: '4', date: '2026-10-19', status: 'Dilewati' }
  ];
  const kpi = calculateDailyKPI(activities);
  assert.equal(kpi.totalScheduled, 4);
  assert.equal(kpi.completed, 2);
  assert.equal(kpi.inProgress, 1);
  assert.equal(kpi.skipped, 1);
  assert.equal(kpi.percentage, 50);
  assert.equal(kpi.percentageDisplay, '50%');
});

test('getCalendarStatusColor matches business rules strictly', () => {
  assert.deepEqual(getCalendarStatusColor(0, 0), { color: 'gray', label: 'Tidak ada aktivitas' });
  assert.deepEqual(getCalendarStatusColor(3, 3), { color: 'green', label: 'Selesai semua' });
  assert.deepEqual(getCalendarStatusColor(4, 2), { color: 'yellow', label: 'Selesai sebagian' });
  assert.deepEqual(getCalendarStatusColor(5, 0), { color: 'red', label: 'Belum ada yang selesai' });
});

test('generateCalendarGrid generates 7-column calendar starting Monday', () => {
  // February 2026: Feb 1 is Sunday. In Monday-start, Sunday is 7th col (index 6),
  // so there should be 6 leading days from Jan.
  const grid = generateCalendarGrid(2026, 2);
  assert.equal(grid.length % 7, 0);
  const currentMonthDays = grid.filter(g => g.isCurrentMonth);
  assert.equal(currentMonthDays.length, 28);
  assert.equal(currentMonthDays[0].dayNumber, 1);
  assert.equal(currentMonthDays[27].dayNumber, 28);
});

test('calculateMonthlyKPI computes monthly percentage and average active day progress', () => {
  const activitiesByDate: Record<string, ActivityItem[]> = {
    '2026-02-01': [
      { id: '1', date: '2026-02-01', status: 'Selesai' },
      { id: '2', date: '2026-02-01', status: 'Selesai' }
    ], // 100%
    '2026-02-02': [
      { id: '3', date: '2026-02-02', status: 'Selesai' },
      { id: '4', date: '2026-02-02', status: 'Belum Dimulai' }
    ] // 50%
  };
  const kpi = calculateMonthlyKPI(2026, 2, activitiesByDate);
  assert.equal(kpi.totalScheduled, 4);
  assert.equal(kpi.completed, 3);
  assert.equal(kpi.percentage, 75);
  assert.equal(kpi.activeDaysCount, 2);
  assert.equal(kpi.inactiveDaysCount, 26);
  // Avg daily active: (100 + 50) / 2 = 75%
  assert.equal(kpi.averageDailyProgressOnActiveDays, 75);
});

test('calculateAnnualSummary identifies best and worst months', () => {
  const activitiesByDate: Record<string, ActivityItem[]> = {
    '2026-01-10': [{ id: '1', date: '2026-01-10', status: 'Selesai' }], // Jan: 100%
    '2026-02-10': [{ id: '2', date: '2026-02-10', status: 'Belum Dimulai' }] // Feb: 0%
  };
  const summary = calculateAnnualSummary(2026, activitiesByDate);
  assert.equal(summary.monthlyBreakdown.length, 12);
  assert.equal(summary.kpi.totalScheduled, 2);
  assert.equal(summary.kpi.completed, 1);
  assert.equal(summary.kpi.percentage, 50);
  assert.equal(summary.kpi.bestMonth?.monthName, 'Januari');
  assert.equal(summary.kpi.bestMonth?.percentage, 100);
  assert.equal(summary.kpi.worstMonth?.monthName, 'Februari');
  assert.equal(summary.kpi.worstMonth?.percentage, 0);
});

test('calculateHabitStats computes streaks and consistency', () => {
  const logs: HabitLogItem[] = [
    { habitId: 'h1', date: '2026-10-17', status: 'Selesai' },
    { habitId: 'h1', date: '2026-10-18', status: 'Selesai' },
    { habitId: 'h1', date: '2026-10-19', status: 'Selesai' }
  ];
  const stats = calculateHabitStats('h1', '2026-10-15', '2026-10-19', logs);
  assert.equal(stats.currentStreak, 3);
  assert.equal(stats.longestStreak, 3);
  assert.equal(stats.totalCompleted, 3);
});

test('calculateGoalProgress handles quantitative target and manual percentage', () => {
  assert.equal(calculateGoalProgress(12, 6, false, 0), 50);
  assert.equal(calculateGoalProgress(10, 3, false, 0), 30);
  assert.equal(calculateGoalProgress(0, 0, true, 85), 85);
});
