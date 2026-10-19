import React, { useEffect, useState } from 'react';
import { api } from '../services/api';
import { DailyAnalytics, Activity, HabitLogStatus, GoalPeriod } from '../types';
import {
  CheckCircle2,
  Clock,
  CircleAlert,
  FastForward,
  Plus,
  Flame,
  Target,
  BookOpen,
  ArrowRight,
  TrendingUp,
  Smile,
  X
} from 'lucide-react';

interface DashboardViewProps {
  currentDate: string;
  onNavigateTab: (tab: string) => void;
  onOpenAddActivity: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  currentDate,
  onNavigateTab,
  onOpenAddActivity
}) => {
  const [data, setData] = useState<DailyAnalytics | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Quick Add modal states
  const [isQuickHabitModalOpen, setIsQuickHabitModalOpen] = useState<boolean>(false);
  const [isQuickGoalModalOpen, setIsQuickGoalModalOpen] = useState<boolean>(false);

  // Categories
  const [activityCategories, setActivityCategories] = useState<string[]>([
    'Kesehatan', 'Pribadi', 'Pengembangan Diri', 'Pekerjaan', 'Keuangan', 'Keluarga dan Sosial'
  ]);
  const [goalCategories, setGoalCategories] = useState<string[]>([
    'Karir & Pekerjaan', 'Kesehatan & Kebugaran', 'Keuangan', 'Pendidikan & Skill', 'Keluarga & Relasi', 'Spiritual & Mindset'
  ]);

  // Quick Habit Form
  const [quickHabitForm, setQuickHabitForm] = useState({
    name: '',
    category: 'Kesehatan',
    frequency: 'Harian',
    weekly_target: 7,
    markDoneToday: true
  });

  // Quick Goal Form
  const [quickGoalForm, setQuickGoalForm] = useState({
    title: '',
    category: 'Karir & Pekerjaan',
    period: 'Bulanan' as GoalPeriod,
    target_metric: '',
    target_value: 0,
    current_value: 0,
    deadline: ''
  });

  const loadDailyData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.getDailyAnalytics(currentDate);
      setData(res);
    } catch (err: any) {
      setError(err.message || 'Gagal memuat data harian.');
    } finally {
      setLoading(false);
    }
  };

  const loadCategories = async () => {
    try {
      const res = await api.getSettings();
      if (res.settings?.activity_categories) {
        setActivityCategories(res.settings.activity_categories);
      }
      if (res.settings?.goal_categories) {
        setGoalCategories(res.settings.goal_categories);
      }
    } catch (e) {
      // ignore, fallback used
    }
  };

  useEffect(() => {
    loadDailyData();
    loadCategories();
  }, [currentDate]);

  const handleUpdateStatus = async (activityId: string, nextStatus: string) => {
    try {
      await api.updateActivityStatus(activityId, nextStatus);
      loadDailyData();
    } catch (err: any) {
      alert(`Gagal memperbarui status: ${err.message}`);
    }
  };

  const handleToggleHabit = async (habitId: string, currentStatus: HabitLogStatus) => {
    const nextStatus = currentStatus === 'Selesai' ? 'Belum' : 'Selesai';
    try {
      await api.setHabitLog({
        habit_id: habitId,
        date: currentDate,
        status: nextStatus
      });
      loadDailyData();
    } catch (err: any) {
      alert(`Gagal mencatat kebiasaan: ${err.message}`);
    }
  };

  const handleOpenQuickHabit = () => {
    setQuickHabitForm({
      name: '',
      category: activityCategories[0] || 'Kesehatan',
      frequency: 'Harian',
      weekly_target: 7,
      markDoneToday: true
    });
    setIsQuickHabitModalOpen(true);
  };

  const handleSaveQuickHabit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickHabitForm.name.trim()) {
      alert('Nama kebiasaan wajib diisi.');
      return;
    }
    try {
      const res = await api.createHabit({
        name: quickHabitForm.name.trim(),
        category: quickHabitForm.category,
        frequency: quickHabitForm.frequency,
        weekly_target: quickHabitForm.weekly_target,
        start_date: currentDate
      });
      if (quickHabitForm.markDoneToday && res.habit?.id) {
        await api.setHabitLog({
          habit_id: res.habit.id,
          date: currentDate,
          status: 'Selesai'
        });
      }
      setIsQuickHabitModalOpen(false);
      loadDailyData();
    } catch (err: any) {
      alert(`Gagal menambah kebiasaan: ${err.message}`);
    }
  };

  const handleOpenQuickGoal = () => {
    setQuickGoalForm({
      title: '',
      category: goalCategories[0] || 'Karir & Pekerjaan',
      period: 'Bulanan',
      target_metric: '',
      target_value: 0,
      current_value: 0,
      deadline: ''
    });
    setIsQuickGoalModalOpen(true);
  };

  const handleSaveQuickGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickGoalForm.title.trim()) {
      alert('Judul target wajib diisi.');
      return;
    }
    try {
      await api.createGoal({
        title: quickGoalForm.title.trim(),
        category: quickGoalForm.category,
        period: quickGoalForm.period,
        start_date: currentDate,
        deadline: quickGoalForm.deadline,
        target_metric: quickGoalForm.target_metric,
        target_value: Number(quickGoalForm.target_value) || 0,
        current_value: Number(quickGoalForm.current_value) || 0,
        status: 'Berjalan'
      });
      setIsQuickGoalModalOpen(false);
      loadDailyData();
    } catch (err: any) {
      alert(`Gagal menambah target: ${err.message}`);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center">
        <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-3 text-slate-500 font-medium text-sm">Memuat dashboard harian...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 bg-red-50 rounded-xl border border-red-200 text-red-700 my-6">
        <p className="font-semibold">Terjadi kendala saat memuat data:</p>
        <p className="text-sm mt-1">{error}</p>
        <button
          onClick={loadDailyData}
          className="mt-3 px-4 py-2 bg-red-600 text-white text-xs font-semibold rounded-lg hover:bg-red-700 transition"
        >
          Coba Lagi
        </button>
      </div>
    );
  }

  const { kpi, activities, habits, urgentGoals, journal } = data;
  const percentage = kpi.percentage;

  // Category counts
  const categoryCounts: Record<string, { total: number; completed: number }> = {};
  for (const act of activities) {
    const cat = act.category || 'Pribadi';
    if (!categoryCounts[cat]) {
      categoryCounts[cat] = { total: 0, completed: 0 };
    }
    categoryCounts[cat].total++;
    if (act.status === 'Selesai') categoryCounts[cat].completed++;
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Banner & KPI Cards */}
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
              Dashboard Ringkasan Harian
            </h1>
            <p className="text-slate-500 text-sm mt-0.5">
              Pantau kemajuan rutinitas, kebiasaan, dan target Anda untuk tanggal{' '}
              <span className="font-semibold text-slate-700">{currentDate}</span>.
            </p>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
            <button
              onClick={handleOpenQuickHabit}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-orange-50 hover:bg-orange-100 text-orange-800 border border-orange-200 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs"
              title="Catat Kebiasaan Baru Hari Ini"
            >
              <Flame className="w-4 h-4 text-orange-600" />
              <span>+ Quick Habit</span>
            </button>

            <button
              onClick={handleOpenQuickGoal}
              className="inline-flex items-center gap-1.5 px-3 py-2 bg-purple-50 hover:bg-purple-100 text-purple-800 border border-purple-200 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer shadow-2xs"
              title="Catat Target Baru"
            >
              <Target className="w-4 h-4 text-purple-600" />
              <span>+ Quick Target</span>
            </button>

            <button
              onClick={onOpenAddActivity}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Aktivitas</span>
            </button>
          </div>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider block">
              Total Terjadwal
            </span>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono">
                {kpi.totalScheduled}
              </span>
              <span className="text-xs text-slate-400 font-medium">kegiatan</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-600 uppercase tracking-wider">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>Selesai</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono">
                {kpi.completed}
              </span>
              <span className="text-xs text-slate-400 font-medium">kegiatan</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-amber-600 uppercase tracking-wider">
              <Clock className="w-3.5 h-3.5" />
              <span>Berjalan</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-600 font-mono">
                {kpi.inProgress}
              </span>
              <span className="text-xs text-slate-400 font-medium">kegiatan</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-600 uppercase tracking-wider">
              <CircleAlert className="w-3.5 h-3.5" />
              <span>Belum Dimulai</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-700 font-mono">
                {kpi.notStarted}
              </span>
              <span className="text-xs text-slate-400 font-medium">kegiatan</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-500 uppercase tracking-wider">
              <FastForward className="w-3.5 h-3.5" />
              <span>Dilewati</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-rose-500 font-mono">
                {kpi.skipped}
              </span>
              <span className="text-xs text-slate-400 font-medium">kegiatan</span>
            </div>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-xs">
            <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-700 uppercase tracking-wider">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Progres Harian</span>
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono">
                {kpi.percentageDisplay}
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {kpi.totalScheduled === 0 ? 'kosong' : 'capaian'}
              </span>
            </div>
          </div>
        </div>

        {/* Visual Progress Bar */}
        <div className="mt-4 bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-600 mb-2">
            <span>Tingkat Penyelesaian Hari Ini</span>
            <span>
              {percentage !== null ? `${percentage}% Tercapai (${kpi.completed}/${kpi.totalScheduled})` : 'Belum Ada Kegiatan'}
            </span>
          </div>
          <div
            className="w-full bg-slate-100 rounded-full h-3 overflow-hidden border border-slate-200"
            role="progressbar"
            aria-valuenow={percentage || 0}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label="Progres Penyelesaian Harian"
          >
            <div
              className={`h-full transition-all duration-500 ${
                percentage === 100
                  ? 'bg-emerald-500'
                  : percentage && percentage >= 50
                  ? 'bg-blue-600'
                  : percentage && percentage > 0
                  ? 'bg-amber-500'
                  : 'bg-slate-300'
              }`}
              style={{ width: `${percentage || 0}%` }}
            ></div>
          </div>
        </div>
      </div>

      {/* Main 2-Column Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Routine List */}
        <div className="lg:col-span-2 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <div>
                <h2 className="font-bold text-slate-900 text-base">Aktivitas & Rutinitas Hari Ini</h2>
                <p className="text-xs text-slate-500">
                  Ubah status langsung dengan mengklik tombol status di setiap aktivitas
                </p>
              </div>
              <button
                onClick={() => onNavigateTab('routines')}
                className="text-xs text-blue-600 hover:text-blue-700 font-semibold flex items-center gap-1"
              >
                Lihat Semua <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {activities.length === 0 ? (
              <div className="py-12 px-4 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
                  <Clock className="w-6 h-6" />
                </div>
                <p className="text-slate-700 font-medium text-sm">Belum ada aktivitas untuk tanggal ini</p>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                  Tambahkan agenda mandiri atau terapkan rekomendasi rutinitas harian standar dengan satu klik.
                </p>
                <div className="mt-4 flex items-center justify-center gap-3">
                  <button
                    onClick={onOpenAddActivity}
                    className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold transition"
                  >
                    + Buat Aktivitas
                  </button>
                  <button
                    onClick={() => onNavigateTab('routines')}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold transition"
                  >
                    Template Rutinitas
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activities.map((act) => {
                  const isDone = act.status === 'Selesai';
                  const isSkipped = act.status === 'Dilewati';
                  const isProgress = act.status === 'Sedang Berjalan';

                  return (
                    <div
                      key={act.id}
                      className={`p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/80 transition ${
                        isDone ? 'bg-emerald-50/20' : ''
                      }`}
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span
                            className={`font-semibold text-sm ${
                              isDone
                                ? 'line-through text-slate-400'
                                : isSkipped
                                ? 'text-slate-400 italic'
                                : 'text-slate-900'
                            }`}
                          >
                            {act.title}
                          </span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-medium bg-slate-100 text-slate-600">
                            {act.category}
                          </span>
                          {act.priority === 'Tinggi' && (
                            <span className="text-[10px] px-2 py-0.5 rounded-full font-semibold bg-rose-100 text-rose-700">
                              Prioritas Tinggi
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500">
                          {act.start_time && (
                            <span className="font-mono">
                              {act.start_time} {act.end_time ? `- ${act.end_time}` : ''}
                            </span>
                          )}
                          {act.notes && (
                            <span className="text-slate-400 truncate max-w-xs">{act.notes}</span>
                          )}
                        </div>
                      </div>

                      {/* Status Selector Pills */}
                      <div className="flex items-center gap-1.5 shrink-0 self-end sm:self-center">
                        <button
                          onClick={() => handleUpdateStatus(act.id, 'Selesai')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                            isDone
                              ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-100 hover:text-emerald-800'
                          }`}
                          aria-label={`Tandai selesai ${act.title}`}
                        >
                          Selesai
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(act.id, 'Sedang Berjalan')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                            isProgress
                              ? 'bg-amber-500 text-white font-semibold shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-100 hover:text-amber-800'
                          }`}
                          aria-label={`Tandai sedang berjalan ${act.title}`}
                        >
                          Berjalan
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(act.id, 'Belum Dimulai')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                            act.status === 'Belum Dimulai'
                              ? 'bg-slate-700 text-white font-semibold shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          }`}
                          aria-label={`Tandai belum dimulai ${act.title}`}
                        >
                          Belum
                        </button>

                        <button
                          onClick={() => handleUpdateStatus(act.id, 'Dilewati')}
                          className={`px-2.5 py-1 text-xs font-medium rounded-md transition ${
                            isSkipped
                              ? 'bg-rose-500 text-white font-semibold shadow-xs'
                              : 'bg-slate-100 text-slate-400 hover:bg-rose-100 hover:text-rose-700'
                          }`}
                          aria-label={`Tandai dilewati ${act.title}`}
                        >
                          Lewati
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Category Progress Breakdown */}
          {Object.keys(categoryCounts).length > 0 && (
            <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
              <h3 className="font-bold text-slate-900 text-sm mb-3">Distribusi per Kategori</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {Object.entries(categoryCounts).map(([catName, stat]) => {
                  const catPercent = Math.round((stat.completed / stat.total) * 100);
                  return (
                    <div key={catName} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                      <div className="flex justify-between items-center text-xs">
                        <span className="font-semibold text-slate-700 truncate">{catName}</span>
                        <span className="font-mono text-slate-500">
                          {stat.completed}/{stat.total}
                        </span>
                      </div>
                      <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                        <div
                          className="bg-blue-600 h-full rounded-full transition-all"
                          style={{ width: `${catPercent}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Right Column (1 Col): Habits, Urgent Goals, Journal Snippet */}
        <div className="space-y-4">
          {/* Habits Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-100 text-orange-600">
                  <Flame className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Habit Tracker Hari Ini</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenQuickHabit}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-lg transition cursor-pointer"
                  title="Quick Add Kebiasaan"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Habit</span>
                </button>
                <button
                  onClick={() => onNavigateTab('habits')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Kelola
                </button>
              </div>
            </div>

            {habits.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada kebiasaan aktif. Buka modul Habit Tracker untuk menambahkan.
              </p>
            ) : (
              <div className="space-y-2">
                {habits.map((h) => {
                  const isDone = h.todayStatus === 'Selesai';
                  return (
                    <div
                      key={h.id}
                      onClick={() => handleToggleHabit(h.id, h.todayStatus)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition ${
                        isDone
                          ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                          : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                      }`}
                    >
                      <div className="flex items-center gap-2 font-medium">
                        <div
                          className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                            isDone ? 'bg-emerald-500 border-emerald-500 text-white' : 'border-slate-300'
                          }`}
                        >
                          {isDone && <CheckCircle2 className="w-3.5 h-3.5" />}
                        </div>
                        <span className={isDone ? 'line-through opacity-80' : ''}>{h.name}</span>
                      </div>
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-white/80 border">
                        {isDone ? 'Tercapai' : 'Ketuk untuk ceklis'}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Urgent Goals Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 text-purple-600">
                  <Target className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Target Prioritas</h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={handleOpenQuickGoal}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 rounded-lg transition cursor-pointer"
                  title="Quick Add Target"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Target</span>
                </button>
                <button
                  onClick={() => onNavigateTab('goals')}
                  className="text-xs text-blue-600 hover:text-blue-700 font-semibold cursor-pointer"
                >
                  Lihat Semua
                </button>
              </div>
            </div>

            {urgentGoals.length === 0 ? (
              <p className="text-xs text-slate-400 py-3 text-center">
                Belum ada target aktif yang mendekati tenggat.
              </p>
            ) : (
              <div className="space-y-3">
                {urgentGoals.map((g) => (
                  <div key={g.id} className="p-3 rounded-lg bg-slate-50 border border-slate-100">
                    <div className="flex justify-between items-start text-xs">
                      <span className="font-semibold text-slate-800">{g.title}</span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-50 text-purple-700 font-semibold">
                        {g.progress}%
                      </span>
                    </div>
                    {g.deadline && (
                      <div className="text-[11px] text-slate-500 mt-1">
                        Tenggat: <span className="font-medium text-slate-700">{g.deadline}</span>
                      </div>
                    )}
                    <div className="mt-2 w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-purple-600 h-full rounded-full transition-all"
                        style={{ width: `${g.progress}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Journal Reflection Status Card */}
          <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-blue-100 text-blue-600">
                  <BookOpen className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Jurnal & Refleksi Hari Ini</h3>
              </div>
            </div>

            {journal ? (
              <div className="mt-2 p-3 rounded-lg bg-blue-50/50 border border-blue-100 text-xs text-slate-700 space-y-1.5">
                <div className="flex items-center gap-1.5 font-semibold text-blue-900">
                  <Smile className="w-4 h-4 text-amber-500" />
                  <span>Mood Nilai: {journal.mood} / 5</span>
                </div>
                {journal.achievements && (
                  <p className="line-clamp-2">
                    <strong className="text-slate-900">Pencapaian:</strong> {journal.achievements}
                  </p>
                )}
                {journal.gratitude && (
                  <p className="line-clamp-2 text-slate-600">
                    <strong className="text-slate-900">Rasa Syukur:</strong> {journal.gratitude}
                  </p>
                )}
                <button
                  onClick={() => onNavigateTab('journal')}
                  className="mt-2 text-xs font-semibold text-blue-600 hover:text-blue-800 block"
                >
                  Edit Catatan Jurnal Lengkap →
                </button>
              </div>
            ) : (
              <div className="mt-2 text-center py-4 border border-dashed border-slate-200 rounded-lg">
                <p className="text-xs text-slate-500">Refleksi harian belum diisi hari ini.</p>
                <button
                  onClick={() => onNavigateTab('journal')}
                  className="mt-2 px-3 py-1.5 bg-blue-50 text-blue-600 hover:bg-blue-100 text-xs font-semibold rounded-lg transition"
                >
                  Tulis Jurnal Hari Ini
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* QUICK ADD HABIT MODAL */}
      {isQuickHabitModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-100 text-orange-600">
                  <Flame className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Quick Add: Kebiasaan Hari Ini</h2>
                  <p className="text-xs text-slate-500">Mulai kebiasaan baru langsung dari dashboard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickHabitModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickHabit} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kebiasaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Jalan Kaki 5.000 Langkah / Minum Air 2L"
                  value={quickHabitForm.name}
                  onChange={(e) => setQuickHabitForm({ ...quickHabitForm, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={quickHabitForm.category}
                    onChange={(e) => setQuickHabitForm({ ...quickHabitForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                  >
                    {activityCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frekuensi</label>
                  <select
                    value={quickHabitForm.frequency}
                    onChange={(e) => setQuickHabitForm({ ...quickHabitForm, frequency: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 bg-white"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Hari Kerja (Senin-Jumat)">Hari Kerja</option>
                    <option value="Akhir Pekan">Akhir Pekan</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target Mingguan (Hari)
                </label>
                <input
                  type="number"
                  min={1}
                  max={7}
                  value={quickHabitForm.weekly_target}
                  onChange={(e) =>
                    setQuickHabitForm({ ...quickHabitForm, weekly_target: parseInt(e.target.value, 10) || 7 })
                  }
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div className="p-3 bg-orange-50/70 border border-orange-200/60 rounded-xl">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-orange-950">
                  <input
                    type="checkbox"
                    checked={quickHabitForm.markDoneToday}
                    onChange={(e) => setQuickHabitForm({ ...quickHabitForm, markDoneToday: e.target.checked })}
                    className="rounded text-orange-600 focus:ring-orange-500 cursor-pointer"
                  />
                  <span>Langsung tandai selesai untuk hari ini ({currentDate})</span>
                </label>
                <p className="text-[11px] text-orange-800/80 mt-1 pl-6">
                  Kebiasaan ini akan otomatis terceklist hijau dan memulai streak 1 hari Anda.
                </p>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickHabitModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg shadow-xs transition"
                >
                  Simpan Kebiasaan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK ADD GOAL MODAL */}
      {isQuickGoalModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-purple-100 text-purple-600">
                  <Target className="w-5 h-5" />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-slate-900">Quick Add: Target Baru</h2>
                  <p className="text-xs text-slate-500">Catat target penting langsung ke dashboard</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsQuickGoalModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
                aria-label="Tutup modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveQuickGoal} className="mt-4 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama / Sasaran Target <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Menabung 10 Juta Rupiah / Membaca 5 Buku"
                  value={quickGoalForm.title}
                  onChange={(e) => setQuickGoalForm({ ...quickGoalForm, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={quickGoalForm.category}
                    onChange={(e) => setQuickGoalForm({ ...quickGoalForm, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 bg-white"
                  >
                    {goalCategories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Periode</label>
                  <select
                    value={quickGoalForm.period}
                    onChange={(e) => setQuickGoalForm({ ...quickGoalForm, period: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600 bg-white"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Tahunan">Tahunan</option>
                    <option value="Jangka Panjang">Jangka Panjang</option>
                  </select>
                </div>
              </div>

              {/* Quantitative values */}
              <div className="p-3 bg-purple-50/50 rounded-xl border border-purple-100 space-y-2">
                <span className="text-xs font-bold text-purple-900 block">Indikator Terukur (Opsional)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Satuan/Metrik</label>
                    <input
                      type="text"
                      placeholder="Buku / Juta Rp / Sesi"
                      value={quickGoalForm.target_metric}
                      onChange={(e) => setQuickGoalForm({ ...quickGoalForm, target_metric: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Nilai Target</label>
                    <input
                      type="number"
                      value={quickGoalForm.target_value}
                      onChange={(e) =>
                        setQuickGoalForm({ ...quickGoalForm, target_value: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-600 mb-0.5">Nilai Saat Ini</label>
                    <input
                      type="number"
                      value={quickGoalForm.current_value}
                      onChange={(e) =>
                        setQuickGoalForm({ ...quickGoalForm, current_value: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Tenggat Waktu</label>
                <input
                  type="date"
                  value={quickGoalForm.deadline}
                  onChange={(e) => setQuickGoalForm({ ...quickGoalForm, deadline: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-purple-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsQuickGoalModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs transition"
                >
                  Simpan Target
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
