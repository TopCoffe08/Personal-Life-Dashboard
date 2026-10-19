import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Habit, HabitLog, HabitLogStatus } from '../types';
import { calculateHabitStats } from '../utils/calculations';
import {
  Flame,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  Calendar,
  XCircle,
  Clock,
  Sparkles,
  ToggleLeft,
  ToggleRight,
  TrendingUp
} from 'lucide-react';

interface HabitsViewProps {
  currentDate: string;
}

export const HabitsView: React.FC<HabitsViewProps> = ({ currentDate }) => {
  const [habits, setHabits] = useState<Habit[]>([]);
  const [logs, setLogs] = useState<HabitLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingHabit, setEditingHabit] = useState<Habit | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    category: 'Kesehatan',
    frequency: 'Harian',
    weekly_target: 7,
    start_date: currentDate
  });

  // Calculate trailing 7 days relative to currentDate
  const getTrailing7Days = () => {
    const days: string[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(currentDate);
      d.setDate(d.getDate() - i);
      days.push(d.toISOString().slice(0, 10));
    }
    return days;
  };
  const trailing7Days = getTrailing7Days();

  const loadData = async () => {
    try {
      setLoading(true);
      const [habitsRes, logsRes] = await Promise.all([
        api.getHabits(),
        api.getHabitLogs({
          startDate: trailing7Days[0],
          endDate: trailing7Days[6]
        })
      ]);
      setHabits(habitsRes.habits || []);
      setLogs(logsRes.logs || []);
    } catch (err) {
      console.error('Error loading habits:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [currentDate]);

  const handleOpenCreate = () => {
    setEditingHabit(null);
    setFormData({
      name: '',
      category: 'Kesehatan',
      frequency: 'Harian',
      weekly_target: 7,
      start_date: currentDate
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (h: Habit) => {
    setEditingHabit(h);
    setFormData({
      name: h.name,
      category: h.category,
      frequency: h.frequency,
      weekly_target: h.weekly_target,
      start_date: h.start_date
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      alert('Nama kebiasaan wajib diisi.');
      return;
    }

    try {
      if (editingHabit) {
        await api.updateHabit(editingHabit.id, formData);
      } else {
        await api.createHabit(formData);
      }
      setIsModalOpen(false);
      loadData();
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleToggleActive = async (id: string) => {
    try {
      await api.toggleHabitActive(id);
      loadData();
    } catch (err: any) {
      alert(`Gagal mengubah status: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteHabit(id);
      setDeleteConfirmId(null);
      loadData();
    } catch (err: any) {
      alert(`Gagal menghapus kebiasaan: ${err.message}`);
    }
  };

  const handleToggleDayStatus = async (habitId: string, dateStr: string) => {
    const existing = logs.find((l) => l.habit_id === habitId && l.date === dateStr);
    let nextStatus: HabitLogStatus = 'Selesai';
    if (existing?.status === 'Selesai') nextStatus = 'Dilewati';
    else if (existing?.status === 'Dilewati') nextStatus = 'Belum';
    else nextStatus = 'Selesai';

    try {
      await api.setHabitLog({
        habit_id: habitId,
        date: dateStr,
        status: nextStatus
      });
      loadData();
    } catch (err: any) {
      alert(`Gagal mencatat: ${err.message}`);
    }
  };

  // Convert logs to map for quick lookup
  const logMap = new Map<string, HabitLogStatus>();
  for (const l of logs) {
    logMap.set(`${l.habit_id}_${l.date}`, l.status);
  }

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Flame className="w-6 h-6 text-orange-500" />
            Habit Tracker & Pemantau Konsistensi
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Bangun rutinitas positif secara konsisten melalui pemantauan streak harian dan mingguan.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kebiasaan</span>
        </button>
      </div>

      {/* 7-Day Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60 flex items-center justify-between flex-wrap gap-2">
          <div>
            <h2 className="font-bold text-slate-900 text-sm sm:text-base">
              Matriks Konsistensi 7 Hari Terakhir
            </h2>
            <p className="text-xs text-slate-500">
              Ketuk lingkaran untuk beralih status: Selesai (Hijau) → Dilewati (Merah) → Kosong
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-medium text-slate-600">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-emerald-500"></span> Selesai
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-rose-400"></span> Dilewati
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-slate-200"></span> Belum
            </span>
          </div>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Memuat kebiasaan...</div>
        ) : habits.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-500 mx-auto flex items-center justify-center mb-3">
              <Flame className="w-6 h-6" />
            </div>
            <p className="font-semibold text-slate-700 text-sm">Belum ada kebiasaan yang dibuat</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Mulai pantau kebiasaan positif seperti membaca, berolahraga, atau minum air 2 liter/hari.
            </p>
            <button
              onClick={handleOpenCreate}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
            >
              + Buat Kebiasaan Pertama
            </button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs sm:text-sm">
              <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4 min-w-[200px]">Nama Kebiasaan</th>
                  <th className="py-3 px-3 text-center">Streak</th>
                  <th className="py-3 px-3 text-center">Target</th>
                  {trailing7Days.map((dStr) => {
                    const isToday = dStr === currentDate;
                    const dateObj = new Date(dStr);
                    const dayName = dateObj.toLocaleDateString('id-ID', { weekday: 'short' });
                    const dayNum = dateObj.getDate();
                    return (
                      <th
                        key={dStr}
                        className={`py-2 px-2 text-center min-w-[50px] ${
                          isToday ? 'bg-blue-100/60 text-blue-900 font-extrabold' : ''
                        }`}
                      >
                        <div className="text-[10px] uppercase text-slate-400">{dayName}</div>
                        <div className="text-xs font-mono font-bold text-slate-800">{dayNum}</div>
                      </th>
                    );
                  })}
                  <th className="py-3 px-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {habits.map((h) => {
                  const isActive = Boolean(h.is_active);

                  // Calculate stats using pure function
                  const mappedLogs = logs.map((l) => ({
                    habitId: l.habit_id,
                    date: l.date,
                    status: l.status
                  }));
                  const stats = calculateHabitStats(h.id, h.start_date, currentDate, mappedLogs);

                  return (
                    <tr
                      key={h.id}
                      className={`hover:bg-slate-50/70 transition ${
                        !isActive ? 'opacity-50 bg-slate-50/40' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-slate-900">{h.name}</span>
                          {!isActive && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-200 text-slate-600 font-bold">
                              Nonaktif
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{h.category}</span>
                          <span>•</span>
                          <span>Mulai {h.start_date}</span>
                        </div>
                      </td>

                      {/* Current & Longest Streak */}
                      <td className="py-3 px-3 text-center font-mono">
                        <div className="inline-flex items-center gap-1 font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full text-xs">
                          <Flame className="w-3.5 h-3.5 fill-orange-500" />
                          <span>{stats.currentStreak} hari</span>
                        </div>
                        <div className="text-[10px] text-slate-400 mt-0.5">
                          Rekor: {stats.longestStreak}
                        </div>
                      </td>

                      <td className="py-3 px-3 text-center font-mono text-slate-600 text-xs">
                        {h.weekly_target}x / minggu
                      </td>

                      {/* 7 Trailing Days Checkboxes */}
                      {trailing7Days.map((dStr) => {
                        const isToday = dStr === currentDate;
                        const status = logMap.get(`${h.id}_${dStr}`);

                        let btnBg = 'bg-slate-100 text-transparent border-slate-200 hover:border-slate-300';
                        if (status === 'Selesai') {
                          btnBg = 'bg-emerald-500 text-white border-emerald-500 shadow-xs';
                        } else if (status === 'Dilewati') {
                          btnBg = 'bg-rose-400 text-white border-rose-400';
                        }

                        return (
                          <td
                            key={dStr}
                            className={`py-2 px-1 text-center ${
                              isToday ? 'bg-blue-50/30' : ''
                            }`}
                          >
                            <button
                              onClick={() => handleToggleDayStatus(h.id, dStr)}
                              className={`w-7 h-7 rounded-full border flex items-center justify-center mx-auto transition cursor-pointer ${btnBg}`}
                              aria-label={`Ubah status ${h.name} tanggal ${dStr}`}
                              title={`${h.name} (${dStr}): ${status || 'Belum diisi'}`}
                            >
                              {status === 'Selesai' ? (
                                <CheckCircle2 className="w-4 h-4" />
                              ) : status === 'Dilewati' ? (
                                <XCircle className="w-4 h-4" />
                              ) : (
                                <span className="w-1.5 h-1.5 rounded-full bg-slate-300"></span>
                              )}
                            </button>
                          </td>
                        );
                      })}

                      {/* Actions */}
                      <td className="py-3 px-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleToggleActive(h.id)}
                            className="p-1 text-slate-400 hover:text-slate-600 transition"
                            title={isActive ? 'Nonaktifkan Kebiasaan' : 'Aktifkan Kebiasaan'}
                          >
                            {isActive ? (
                              <ToggleRight className="w-5 h-5 text-emerald-600" />
                            ) : (
                              <ToggleLeft className="w-5 h-5 text-slate-400" />
                            )}
                          </button>
                          <button
                            onClick={() => handleOpenEdit(h)}
                            className="p-1 text-slate-400 hover:text-blue-600 transition"
                            title="Edit Kebiasaan"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => setDeleteConfirmId(h.id)}
                            className="p-1 text-slate-400 hover:text-rose-600 transition"
                            title="Hapus Kebiasaan"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ADD / EDIT HABIT MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingHabit ? 'Edit Kebiasaan' : 'Tambah Kebiasaan Baru'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama Kebiasaan <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Olahraga lari 30 menit"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Kesehatan">Kesehatan</option>
                    <option value="Pribadi">Pribadi</option>
                    <option value="Pengembangan Diri">Pengembangan Diri</option>
                    <option value="Pekerjaan">Pekerjaan</option>
                    <option value="Keuangan">Keuangan</option>
                    <option value="Keluarga dan Sosial">Keluarga dan Sosial</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Frekuensi</label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Hari Kerja (Senin-Jumat)">Hari Kerja (Senin-Jumat)</option>
                    <option value="Akhir Pekan">Akhir Pekan</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Target Mingguan (Hari)
                  </label>
                  <input
                    type="number"
                    min={1}
                    max={7}
                    value={formData.weekly_target}
                    onChange={(e) => setFormData({ ...formData, weekly_target: parseInt(e.target.value, 10) || 7 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Mulai Dari</label>
                  <input
                    type="date"
                    required
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs"
                >
                  {editingHabit ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {deleteConfirmId && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100 text-center">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Hapus Kebiasaan?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Seluruh riwayat log pencapaian dan streak dari kebiasaan ini akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
            </p>

            <div className="mt-5 flex items-center justify-center gap-3">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs transition"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
