/**
 * Pure calculation utilities and business logic for Personal Life Dashboard.
 * Decoupled from UI to ensure accurate metrics and high-speed unit testing.
 */

export interface ActivityItem {
  id: string;
  date: string; // YYYY-MM-DD
  status: 'Belum Dimulai' | 'Sedang Berjalan' | 'Selesai' | 'Dilewati';
  category?: string;
  priority?: 'Tinggi' | 'Sedang' | 'Rendah';
}

export interface DailyKPI {
  totalScheduled: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  skipped: number;
  percentage: number | null; // null if totalScheduled === 0 (shows '—')
  percentageDisplay: string;
}

export interface MonthlyDayData {
  date: string; // YYYY-MM-DD
  dayNumber: number;
  isCurrentMonth: boolean;
  totalScheduled: number;
  completed: number;
  statusColor: 'green' | 'yellow' | 'red' | 'gray';
  statusLabel: string;
}

export interface MonthlyKPI {
  totalScheduled: number;
  completed: number;
  percentage: number | null;
  percentageDisplay: string;
  activeDaysCount: number;
  inactiveDaysCount: number;
  averageDailyProgressOnActiveDays: number | null;
  averageDailyProgressDisplay: string;
}

export interface AnnualMonthSummary {
  month: number; // 1 - 12
  monthName: string;
  totalScheduled: number;
  completed: number;
  inProgress: number;
  notStarted: number;
  skipped: number;
  percentage: number | null;
  percentageDisplay: string;
}

export interface AnnualKPI {
  totalScheduled: number;
  completed: number;
  percentage: number | null;
  percentageDisplay: string;
  averageDailyProgressOnActiveDays: number | null;
  averageDailyProgressDisplay: string;
  bestMonth: { monthName: string; percentage: number } | null;
  worstMonth: { monthName: string; percentage: number } | null;
}

export const INDONESIAN_MONTH_NAMES = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export const INDONESIAN_DAY_NAMES = [
  'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu'
];

/**
 * Check if a given year is a leap year (tahun kabisat).
 * Divisible by 4, not by 100 unless divisible by 400.
 */
export function isLeapYear(year: number): boolean {
  if (year % 400 === 0) return true;
  if (year % 100 === 0) return false;
  return year % 4 === 0;
}

/**
 * Get number of days in a month (1-indexed month: 1=Jan, 2=Feb, etc.)
 */
export function getDaysInMonth(year: number, month: number): number {
  if (month === 2) {
    return isLeapYear(year) ? 29 : 28;
  }
  if ([4, 6, 9, 11].includes(month)) {
    return 30;
  }
  return 31;
}

/**
 * Format date string to YYYY-MM-DD
 */
export function formatDate(year: number, month: number, day: number): string {
  const m = String(month).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  return `${year}-${m}-${d}`;
}

/**
 * Calculate Daily KPI according to the specification:
 * - Total scheduled includes: Selesai, Sedang Berjalan, Belum Dimulai, Dilewati
 * - Selesai is numerator
 * - Percentage = (completed / totalScheduled) * 100
 * - If totalScheduled === 0, percentage is null (displayed as '—')
 */
export function calculateDailyKPI(activities: ActivityItem[]): DailyKPI {
  const totalScheduled = activities.length;
  let completed = 0;
  let inProgress = 0;
  let notStarted = 0;
  let skipped = 0;

  for (const act of activities) {
    if (act.status === 'Selesai') completed++;
    else if (act.status === 'Sedang Berjalan') inProgress++;
    else if (act.status === 'Belum Dimulai') notStarted++;
    else if (act.status === 'Dilewati') skipped++;
  }

  if (totalScheduled === 0) {
    return {
      totalScheduled: 0,
      completed: 0,
      inProgress: 0,
      notStarted: 0,
      skipped: 0,
      percentage: null,
      percentageDisplay: '—'
    };
  }

  const rawPercent = (completed / totalScheduled) * 100;
  const percentage = Math.round(rawPercent * 10) / 10;

  return {
    totalScheduled,
    completed,
    inProgress,
    notStarted,
    skipped,
    percentage,
    percentageDisplay: `${percentage}%`
  };
}

/**
 * Determine calendar color indicator according to rules:
 * - Green: all scheduled activities completed (100%)
 * - Yellow: partially completed (>0% and <100%)
 * - Red: activities scheduled but none completed (0%)
 * - Gray: no scheduled activities
 */
export function getCalendarStatusColor(total: number, completed: number): {
  color: 'green' | 'yellow' | 'red' | 'gray';
  label: string;
} {
  if (total === 0) {
    return { color: 'gray', label: 'Tidak ada aktivitas' };
  }
  if (completed === total) {
    return { color: 'green', label: 'Selesai semua' };
  }
  if (completed > 0) {
    return { color: 'yellow', label: 'Selesai sebagian' };
  }
  return { color: 'red', label: 'Belum ada yang selesai' };
}

/**
 * Generate 7-column calendar matrix (Senin to Minggu) for a given month and year.
 */
export function generateCalendarGrid(
  year: number,
  month: number, // 1 - 12
  activitiesByDate: Record<string, ActivityItem[]> = {}
): MonthlyDayData[] {
  const daysInCurrentMonth = getDaysInMonth(year, month);

  // Day of week for 1st of month: 0=Sunday, 1=Monday...
  // In Indonesian specification, Monday is column 0, Sunday is column 6.
  const firstDay = new Date(Date.UTC(year, month - 1, 1));
  let startCol = firstDay.getUTCDay() - 1;
  if (startCol === -1) startCol = 6; // Sunday becomes index 6

  const prevMonth = month === 1 ? 12 : month - 1;
  const prevYear = month === 1 ? year - 1 : year;
  const daysInPrevMonth = getDaysInMonth(prevYear, prevMonth);

  const grid: MonthlyDayData[] = [];

  // Previous month trailing days
  for (let i = startCol - 1; i >= 0; i--) {
    const day = daysInPrevMonth - i;
    const dateStr = formatDate(prevYear, prevMonth, day);
    const acts = activitiesByDate[dateStr] || [];
    const completed = acts.filter(a => a.status === 'Selesai').length;
    const { color, label } = getCalendarStatusColor(acts.length, completed);

    grid.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      totalScheduled: acts.length,
      completed,
      statusColor: color,
      statusLabel: label
    });
  }

  // Current month days
  for (let day = 1; day <= daysInCurrentMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const acts = activitiesByDate[dateStr] || [];
    const completed = acts.filter(a => a.status === 'Selesai').length;
    const { color, label } = getCalendarStatusColor(acts.length, completed);

    grid.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: true,
      totalScheduled: acts.length,
      completed,
      statusColor: color,
      statusLabel: label
    });
  }

  // Next month leading days to complete grid rows (multiples of 7: 28, 35, or 42)
  const remaining = (7 - (grid.length % 7)) % 7;
  const nextMonth = month === 12 ? 1 : month + 1;
  const nextYear = month === 12 ? year + 1 : year;

  for (let day = 1; day <= remaining; day++) {
    const dateStr = formatDate(nextYear, nextMonth, day);
    const acts = activitiesByDate[dateStr] || [];
    const completed = acts.filter(a => a.status === 'Selesai').length;
    const { color, label } = getCalendarStatusColor(acts.length, completed);

    grid.push({
      date: dateStr,
      dayNumber: day,
      isCurrentMonth: false,
      totalScheduled: acts.length,
      completed,
      statusColor: color,
      statusLabel: label
    });
  }

  return grid;
}

/**
 * Calculate Monthly KPI:
 * - totalScheduled, completed, overall percentage
 * - activeDaysCount (days with at least 1 activity)
 * - inactiveDaysCount
 * - averageDailyProgressOnActiveDays: sum of daily progress / activeDaysCount
 */
export function calculateMonthlyKPI(
  year: number,
  month: number,
  activitiesByDate: Record<string, ActivityItem[]>
): MonthlyKPI {
  const daysInMonth = getDaysInMonth(year, month);
  let totalScheduled = 0;
  let completed = 0;
  let activeDaysCount = 0;
  let sumDailyProgress = 0;

  for (let day = 1; day <= daysInMonth; day++) {
    const dateStr = formatDate(year, month, day);
    const dayActs = activitiesByDate[dateStr] || [];
    if (dayActs.length > 0) {
      activeDaysCount++;
      totalScheduled += dayActs.length;
      const dayCompleted = dayActs.filter(a => a.status === 'Selesai').length;
      completed += dayCompleted;
      sumDailyProgress += (dayCompleted / dayActs.length) * 100;
    }
  }

  const inactiveDaysCount = daysInMonth - activeDaysCount;
  const percentage = totalScheduled === 0 ? null : Math.round((completed / totalScheduled) * 1000) / 10;
  const averageDailyProgressOnActiveDays = activeDaysCount === 0 
    ? null 
    : Math.round((sumDailyProgress / activeDaysCount) * 10) / 10;

  return {
    totalScheduled,
    completed,
    percentage,
    percentageDisplay: percentage === null ? '—' : `${percentage}%`,
    activeDaysCount,
    inactiveDaysCount,
    averageDailyProgressOnActiveDays,
    averageDailyProgressDisplay: averageDailyProgressOnActiveDays === null ? '—' : `${averageDailyProgressOnActiveDays}%`
  };
}

/**
 * Calculate Annual Summary and KPIs for all 12 months.
 */
export function calculateAnnualSummary(
  year: number,
  activitiesByDate: Record<string, ActivityItem[]>
): {
  monthlyBreakdown: AnnualMonthSummary[];
  kpi: AnnualKPI;
} {
  const monthlyBreakdown: AnnualMonthSummary[] = [];
  let totalYearScheduled = 0;
  let totalYearCompleted = 0;
  let totalActiveDays = 0;
  let sumDailyProgress = 0;

  let bestMonth: { monthName: string; percentage: number } | null = null;
  let worstMonth: { monthName: string; percentage: number } | null = null;

  for (let m = 1; m <= 12; m++) {
    const monthName = INDONESIAN_MONTH_NAMES[m - 1];
    const daysInMonth = getDaysInMonth(year, m);
    let mTotal = 0;
    let mCompleted = 0;
    let mInProgress = 0;
    let mNotStarted = 0;
    let mSkipped = 0;

    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(year, m, d);
      const dayActs = activitiesByDate[dateStr] || [];
      if (dayActs.length > 0) {
        totalActiveDays++;
        const dComp = dayActs.filter(a => a.status === 'Selesai').length;
        sumDailyProgress += (dComp / dayActs.length) * 100;
      }
      for (const a of dayActs) {
        mTotal++;
        if (a.status === 'Selesai') mCompleted++;
        else if (a.status === 'Sedang Berjalan') mInProgress++;
        else if (a.status === 'Belum Dimulai') mNotStarted++;
        else if (a.status === 'Dilewati') mSkipped++;
      }
    }

    totalYearScheduled += mTotal;
    totalYearCompleted += mCompleted;

    const mPercent = mTotal === 0 ? null : Math.round((mCompleted / mTotal) * 1000) / 10;

    if (mPercent !== null) {
      if (!bestMonth || mPercent > bestMonth.percentage) {
        bestMonth = { monthName, percentage: mPercent };
      }
      if (!worstMonth || mPercent < worstMonth.percentage) {
        worstMonth = { monthName, percentage: mPercent };
      }
    }

    monthlyBreakdown.push({
      month: m,
      monthName,
      totalScheduled: mTotal,
      completed: mCompleted,
      inProgress: mInProgress,
      notStarted: mNotStarted,
      skipped: mSkipped,
      percentage: mPercent,
      percentageDisplay: mPercent === null ? '—' : `${mPercent}%`
    });
  }

  const yearPercent = totalYearScheduled === 0 
    ? null 
    : Math.round((totalYearCompleted / totalYearScheduled) * 1000) / 10;

  const avgDailyActive = totalActiveDays === 0
    ? null
    : Math.round((sumDailyProgress / totalActiveDays) * 10) / 10;

  return {
    monthlyBreakdown,
    kpi: {
      totalScheduled: totalYearScheduled,
      completed: totalYearCompleted,
      percentage: yearPercent,
      percentageDisplay: yearPercent === null ? '—' : `${yearPercent}%`,
      averageDailyProgressOnActiveDays: avgDailyActive,
      averageDailyProgressDisplay: avgDailyActive === null ? '—' : `${avgDailyActive}%`,
      bestMonth,
      worstMonth
    }
  };
}

/**
 * Habit streak & consistency calculation
 */
export interface HabitLogItem {
  habitId: string;
  date: string; // YYYY-MM-DD
  status: 'Selesai' | 'Dilewati' | 'Belum';
}

export function calculateHabitStats(
  habitId: string,
  startDateStr: string,
  todayStr: string,
  logs: HabitLogItem[]
): {
  currentStreak: number;
  longestStreak: number;
  totalCompleted: number;
  consistencyPercentage: number;
} {
  const logMap = new Map<string, string>();
  for (const log of logs) {
    if (log.habitId === habitId) {
      logMap.set(log.date, log.status);
    }
  }

  // Count total completed
  let totalCompleted = 0;
  for (const status of logMap.values()) {
    if (status === 'Selesai') totalCompleted++;
  }

  // Calculate current streak backwards from today
  let currentStreak = 0;
  let checkDate = new Date(todayStr);
  const startDate = new Date(startDateStr);

  // If today is completed, streak includes today; otherwise check yesterday
  const todayStatus = logMap.get(todayStr);
  if (todayStatus === 'Selesai') {
    currentStreak++;
    checkDate.setDate(checkDate.getDate() - 1);
  } else {
    // If today is not yet done or skipped, start check from yesterday
    checkDate.setDate(checkDate.getDate() - 1);
  }

  while (checkDate >= startDate) {
    const dStr = checkDate.toISOString().slice(0, 10);
    const status = logMap.get(dStr);
    if (status === 'Selesai') {
      currentStreak++;
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }

  // Calculate longest streak by iterating all dates from startDate to today
  let longestStreak = 0;
  let runningStreak = 0;
  const iterDate = new Date(startDateStr);
  const endIterDate = new Date(todayStr);

  while (iterDate <= endIterDate) {
    const dStr = iterDate.toISOString().slice(0, 10);
    const status = logMap.get(dStr);
    if (status === 'Selesai') {
      runningStreak++;
      if (runningStreak > longestStreak) {
        longestStreak = runningStreak;
      }
    } else {
      runningStreak = 0;
    }
    iterDate.setDate(iterDate.getDate() + 1);
  }

  if (currentStreak > longestStreak) {
    longestStreak = currentStreak;
  }

  // Calculate total days elapsed from startDate to today
  const msDiff = Math.max(0, new Date(todayStr).getTime() - startDate.getTime());
  const daysTotal = Math.floor(msDiff / (1000 * 60 * 60 * 24)) + 1;
  const consistencyPercentage = daysTotal > 0
    ? Math.min(100, Math.round((totalCompleted / daysTotal) * 1000) / 10)
    : 0;

  return {
    currentStreak,
    longestStreak,
    totalCompleted,
    consistencyPercentage
  };
}

/**
 * Goal progress calculation
 */
export function calculateGoalProgress(
  targetValue: number,
  currentValue: number,
  isManualPercentage: boolean,
  manualPercentage: number
): number {
  if (isManualPercentage) {
    return Math.max(0, Math.min(100, manualPercentage));
  }
  if (!targetValue || targetValue <= 0) {
    return 0;
  }
  const ratio = (currentValue / targetValue) * 100;
  return Math.max(0, Math.round(ratio * 10) / 10);
}
