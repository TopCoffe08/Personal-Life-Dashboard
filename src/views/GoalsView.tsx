import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Goal, GoalPeriod, GoalStatus } from '../types';
import {
  Target,
  Plus,
  Trash2,
  Edit2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Clock,
  Layers,
  Sliders,
  TrendingUp
} from 'lucide-react';

interface GoalsViewProps {
  currentDate: string;
}

export const GoalsView: React.FC<GoalsViewProps> = ({ currentDate }) => {
  const [goals, setGoals] = useState<Goal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Filter states
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [filterPeriod, setFilterPeriod] = useState<string>('');
  const [filterCategory, setFilterCategory] = useState<string>('');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [editingGoal, setEditingGoal] = useState<Goal | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [progressUpdateGoal, setProgressUpdateGoal] = useState<Goal | null>(null);
  const [newActualValue, setNewActualValue] = useState<number>(0);
  const [newManualProgress, setNewManualProgress] = useState<number>(0);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: 'Karir & Pekerjaan',
    period: 'Tahunan' as GoalPeriod,
    start_date: currentDate,
    deadline: '',
    target_metric: '',
    target_value: 0,
    current_value: 0,
    progress: 0,
    status: 'Berjalan' as GoalStatus,
    evaluation_notes: ''
  });

  const loadGoals = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (filterStatus) params.status = filterStatus;
      if (filterPeriod) params.period = filterPeriod;
      if (filterCategory) params.category = filterCategory;

      const res = await api.getGoals(params);
      setGoals(res.goals || []);
    } catch (err) {
      console.error('Error loading goals:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.settings?.goal_categories) {
        setCategories(res.settings.goal_categories);
      }
    } catch (err) {
      setCategories(['Karir & Pekerjaan', 'Kesehatan & Kebugaran', 'Keuangan', 'Pendidikan & Skill', 'Keluarga & Relasi', 'Spiritual & Mindset']);
    }
  };

  useEffect(() => {
    loadGoals();
  }, [filterStatus, filterPeriod, filterCategory]);

  useEffect(() => {
    loadSettings();
  }, []);

  const handleOpenCreate = () => {
    setEditingGoal(null);
    setFormData({
      title: '',
      description: '',
      category: categories[0] || 'Karir & Pekerjaan',
      period: 'Tahunan',
      start_date: currentDate,
      deadline: '',
      target_metric: 'Item',
      target_value: 10,
      current_value: 0,
      progress: 0,
      status: 'Berjalan',
      evaluation_notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (g: Goal) => {
    setEditingGoal(g);
    setFormData({
      title: g.title,
      description: g.description || '',
      category: g.category,
      period: g.period,
      start_date: g.start_date || '',
      deadline: g.deadline || '',
      target_metric: g.target_metric || '',
      target_value: g.target_value || 0,
      current_value: g.current_value || 0,
      progress: g.progress || 0,
      status: g.status,
      evaluation_notes: g.evaluation_notes || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Judul target wajib diisi.');
      return;
    }

    try {
      if (editingGoal) {
        await api.updateGoal(editingGoal.id, formData);
      } else {
        await api.createGoal(formData);
      }
      setIsModalOpen(false);
      loadGoals();
    } catch (err: any) {
      alert(`Gagal menyimpan target: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteGoal(id);
      setDeleteConfirmId(null);
      loadGoals();
    } catch (err: any) {
      alert(`Gagal menghapus target: ${err.message}`);
    }
  };

  const handleOpenProgressModal = (g: Goal) => {
    setProgressUpdateGoal(g);
    setNewActualValue(g.current_value);
    setNewManualProgress(g.progress);
  };

  const handleSaveProgress = async () => {
    if (!progressUpdateGoal) return;
    try {
      let payload: any = {};
      if (progressUpdateGoal.target_value > 0) {
        payload.current_value = newActualValue;
      } else {
        payload.progress = newManualProgress;
      }
      await api.updateGoalProgress(progressUpdateGoal.id, payload);
      setProgressUpdateGoal(null);
      loadGoals();
    } catch (err: any) {
      alert(`Gagal memperbarui progres: ${err.message}`);
    }
  };

  // Helper for deadline status
  const getDeadlineStatus = (deadlineStr: string) => {
    if (!deadlineStr) return null;
    const today = new Date(currentDate).getTime();
    const deadline = new Date(deadlineStr).getTime();
    const diffDays = Math.ceil((deadline - today) / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { text: `Lewat ${Math.abs(diffDays)} hari`, color: 'text-rose-600 bg-rose-50 border-rose-200' };
    }
    if (diffDays === 0) {
      return { text: 'Jatuh tempo hari ini!', color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    if (diffDays <= 7) {
      return { text: `Sisa ${diffDays} hari lagi`, color: 'text-amber-700 bg-amber-50 border-amber-200' };
    }
    return { text: `Tersisa ${diffDays} hari`, color: 'text-slate-600 bg-slate-50 border-slate-200' };
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <Target className="w-6 h-6 text-purple-600" />
            Target & Sasaran Pribadi
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Kelola target kuantitatif dan kualitatif untuk jangka pendek hingga jangka panjang.
          </p>
        </div>

        <button
          onClick={handleOpenCreate}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold shadow-xs transition cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Target Baru</span>
        </button>
      </div>

      {/* Filter Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs flex flex-wrap gap-3">
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="py-1.5 px-3 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          aria-label="Filter Status Target"
        >
          <option value="">Semua Status</option>
          <option value="Berjalan">Berjalan</option>
          <option value="Selesai">Selesai</option>
          <option value="Belum Dimulai">Belum Dimulai</option>
          <option value="Ditunda">Ditunda</option>
          <option value="Dibatalkan">Dibatalkan</option>
        </select>

        <select
          value={filterPeriod}
          onChange={(e) => setFilterPeriod(e.target.value)}
          className="py-1.5 px-3 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          aria-label="Filter Periode Target"
        >
          <option value="">Semua Periode</option>
          <option value="Harian">Harian</option>
          <option value="Mingguan">Mingguan</option>
          <option value="Bulanan">Bulanan</option>
          <option value="Tahunan">Tahunan</option>
          <option value="Jangka Panjang">Jangka Panjang</option>
        </select>

        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="py-1.5 px-3 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
          aria-label="Filter Kategori Target"
        >
          <option value="">Semua Kategori</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {/* Goal Cards Grid */}
      {loading ? (
        <div className="py-20 text-center text-slate-400 text-sm">Memuat target...</div>
      ) : goals.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center">
          <Target className="w-12 h-12 text-purple-300 mx-auto mb-3" />
          <h3 className="font-bold text-slate-800 text-base">Belum Ada Target</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Tetapkan sasaran terukur untuk keuangan, karir, kebugaran, atau pembelajaran Anda.
          </p>
          <button
            onClick={handleOpenCreate}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
          >
            + Buat Target Pertama
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {goals.map((g) => {
            const isCompleted = g.status === 'Selesai' || g.progress >= 100;
            const deadlineInfo = getDeadlineStatus(g.deadline);

            return (
              <div
                key={g.id}
                className={`bg-white rounded-2xl border p-5 shadow-xs flex flex-col justify-between hover:shadow-md transition ${
                  isCompleted ? 'border-emerald-200 bg-emerald-50/10' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="text-[11px] font-semibold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700">
                      {g.category}
                    </span>

                    <span
                      className={`text-xs px-2.5 py-0.5 rounded-full font-bold ${
                        isCompleted
                          ? 'bg-emerald-100 text-emerald-800'
                          : g.status === 'Berjalan'
                          ? 'bg-blue-100 text-blue-800'
                          : g.status === 'Ditunda'
                          ? 'bg-amber-100 text-amber-800'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {g.status}
                    </span>
                  </div>

                  <h3 className="font-bold text-slate-900 text-base mt-2.5 leading-snug">{g.title}</h3>
                  {g.description && (
                    <p className="text-xs text-slate-500 mt-1 line-clamp-2">{g.description}</p>
                  )}

                  {/* Quantitative or Qualitative Info */}
                  <div className="mt-3 py-2 px-3 bg-slate-50 rounded-xl border border-slate-100 text-xs">
                    {g.target_value > 0 ? (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Pencapaian:</span>
                        <span className="font-mono font-bold text-slate-800">
                          {g.current_value} / {g.target_value} {g.target_metric}
                        </span>
                      </div>
                    ) : (
                      <div className="flex justify-between items-center">
                        <span className="text-slate-500">Target Kualitatif</span>
                        <span className="font-mono font-bold text-slate-800">{g.progress}% Selesai</span>
                      </div>
                    )}

                    {g.deadline && deadlineInfo && (
                      <div className="flex justify-between items-center mt-1.5 pt-1.5 border-t border-slate-200/50">
                        <span className="text-slate-500">Tenggat:</span>
                        <span className={`px-2 py-0.2 rounded font-semibold text-[11px] border ${deadlineInfo.color}`}>
                          {g.deadline} ({deadlineInfo.text})
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Visual Progress Bar */}
                  <div className="mt-4">
                    <div className="flex justify-between text-xs font-semibold mb-1">
                      <span className="text-slate-600">Progres</span>
                      <span className="font-mono text-purple-700 font-bold">{g.progress}%</span>
                    </div>
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isCompleted
                            ? 'bg-emerald-500'
                            : g.progress >= 50
                            ? 'bg-purple-600'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(100, g.progress)}%` }}
                      ></div>
                    </div>
                  </div>

                  {g.evaluation_notes && (
                    <div className="mt-3 text-[11px] text-slate-600 italic bg-amber-50/50 p-2 rounded border border-amber-100">
                      <strong>Evaluasi:</strong> {g.evaluation_notes}
                    </div>
                  )}
                </div>

                {/* Card Actions Footer */}
                <div className="pt-4 mt-4 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenProgressModal(g)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-purple-50 text-purple-700 hover:bg-purple-100 rounded-lg transition"
                  >
                    <Sliders className="w-3.5 h-3.5" />
                    <span>Update Nilai / Progres</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(g)}
                      className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition"
                      title="Edit Target"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(g.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-slate-100 rounded-lg transition"
                      title="Hapus Target"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ADD / EDIT GOAL MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingGoal ? 'Edit Target' : 'Tambah Target Baru'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Nama / Judul Target <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Membaca 12 Buku Pengembangan Diri"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Deskripsi Singkat</label>
                <textarea
                  rows={2}
                  placeholder="Rincian tujuan atau indikator keberhasilan..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Periode</label>
                  <select
                    value={formData.period}
                    onChange={(e) => setFormData({ ...formData, period: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Harian">Harian</option>
                    <option value="Mingguan">Mingguan</option>
                    <option value="Bulanan">Bulanan</option>
                    <option value="Tahunan">Tahunan</option>
                    <option value="Jangka Panjang">Jangka Panjang</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal Mulai</label>
                  <input
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tenggat Waktu</label>
                  <input
                    type="date"
                    value={formData.deadline}
                    onChange={(e) => setFormData({ ...formData, deadline: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              {/* Target Metric & Values */}
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
                <span className="text-xs font-bold text-slate-800 block">Indikator Kuantitatif (Opsional)</span>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Satuan/Metrik</label>
                    <input
                      type="text"
                      placeholder="Buku / Juta Rp / Jam"
                      value={formData.target_metric}
                      onChange={(e) => setFormData({ ...formData, target_metric: e.target.value })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Nilai Target</label>
                    <input
                      type="number"
                      value={formData.target_value}
                      onChange={(e) => setFormData({ ...formData, target_value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-slate-500 mb-0.5">Nilai Saat Ini</label>
                    <input
                      type="number"
                      value={formData.current_value}
                      onChange={(e) => setFormData({ ...formData, current_value: parseFloat(e.target.value) || 0 })}
                      className="w-full px-2 py-1.5 text-xs border border-slate-300 rounded bg-white font-mono"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status Target</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Berjalan">Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Belum Dimulai">Belum Dimulai</option>
                    <option value="Ditunda">Ditunda</option>
                    <option value="Dibatalkan">Dibatalkan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Progres Manual (%)</label>
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={formData.progress}
                    onChange={(e) => setFormData({ ...formData, progress: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Evaluasi</label>
                <textarea
                  rows={2}
                  placeholder="Catatan perkembangan atau hambatan yang dihadapi..."
                  value={formData.evaluation_notes}
                  onChange={(e) => setFormData({ ...formData, evaluation_notes: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                ></textarea>
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
                  {editingGoal ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QUICK UPDATE PROGRESS MODAL */}
      {progressUpdateGoal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-100">
            <h3 className="font-bold text-slate-900 text-lg">Update Progres Target</h3>
            <p className="text-xs text-slate-500 mt-0.5">{progressUpdateGoal.title}</p>

            <div className="my-5 space-y-4">
              {progressUpdateGoal.target_value > 0 ? (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nilai Terkini (Target: {progressUpdateGoal.target_value} {progressUpdateGoal.target_metric})
                  </label>
                  <input
                    type="number"
                    value={newActualValue}
                    onChange={(e) => setNewActualValue(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 text-base font-bold font-mono border border-slate-300 rounded-lg focus:border-purple-600"
                  />
                  <div className="mt-2 text-xs text-slate-500">
                    Progres otomatis terhitung:{' '}
                    <strong className="font-mono text-purple-700">
                      {Math.min(100, Math.round((newActualValue / progressUpdateGoal.target_value) * 100))}%
                    </strong>
                  </div>
                </div>
              ) : (
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Persentase Progres Manual ({newManualProgress}%)
                  </label>
                  <input
                    type="range"
                    min={0}
                    max={100}
                    value={newManualProgress}
                    onChange={(e) => setNewManualProgress(parseInt(e.target.value, 10))}
                    className="w-full accent-purple-600 cursor-pointer"
                  />
                  <input
                    type="number"
                    min={0}
                    max={100}
                    value={newManualProgress}
                    onChange={(e) => setNewManualProgress(parseInt(e.target.value, 10) || 0)}
                    className="mt-2 w-full px-3 py-1.5 text-sm font-mono border border-slate-300 rounded-lg"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setProgressUpdateGoal(null)}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-slate-600 hover:text-slate-800"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={handleSaveProgress}
                className="px-4 py-2 text-xs sm:text-sm font-semibold text-white bg-purple-600 hover:bg-purple-700 rounded-lg shadow-xs"
              >
                Simpan Progres
              </button>
            </div>
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
            <h3 className="font-bold text-slate-900 text-lg">Hapus Target?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Target ini beserta seluruh catatan evaluasinya akan dihapus secara permanen.
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
