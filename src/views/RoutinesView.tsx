import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Activity, ActivityStatus, ActivityPriority } from '../types';
import {
  Plus,
  Trash2,
  Edit2,
  Filter,
  CheckCircle2,
  Clock,
  Sparkles,
  Search,
  Calendar as CalendarIcon
} from 'lucide-react';

interface RoutinesViewProps {
  currentDate: string;
  onDateChange: (date: string) => void;
  openCreateModalDirectly?: boolean;
}

export const STARTER_ROUTINES_CATALOG = [
  { title: 'Bangun tidur dan merapikan tempat tidur', startTime: '05:30', endTime: '06:00', category: 'Kesehatan', priority: 'Sedang', notes: 'Minum 2 gelas air putih' },
  { title: 'Olahraga atau aktivitas fisik pagi', startTime: '06:00', endTime: '06:45', category: 'Kesehatan', priority: 'Tinggi', notes: 'Jogging, peregangan, atau senam' },
  { title: 'Mandi, sarapan bernutrisi, dan persiapan', startTime: '06:45', endTime: '07:30', category: 'Pribadi', priority: 'Sedang', notes: 'Sarapan seimbang tinggi protein' },
  { title: 'Menyelesaikan tugas prioritas utama (Deep Work)', startTime: '08:30', endTime: '11:30', category: 'Pekerjaan', priority: 'Tinggi', notes: 'Fokus penuh tanpa gangguan notifikasi' },
  { title: 'Pekerjaan rutin dan administrasi', startTime: '11:30', endTime: '12:30', category: 'Pekerjaan', priority: 'Sedang', notes: 'Balas email penting dan koordinasi' },
  { title: 'Istirahat, ibadah, dan makan siang santai', startTime: '12:30', endTime: '13:30', category: 'Pribadi', priority: 'Sedang', notes: 'Hindari melihat layar terus menerus' },
  { title: 'Menyelesaikan tugas lanjutan & review progres', startTime: '13:30', endTime: '16:00', category: 'Pekerjaan', priority: 'Sedang', notes: 'Tindak lanjut deliverable harian' },
  { title: 'Belajar keterampilan baru atau membaca materi', startTime: '16:00', endTime: '17:00', category: 'Pengembangan Diri', priority: 'Sedang', notes: 'Kursus online / modul teknis' },
  { title: 'Aktivitas fisik sore / jalan santai', startTime: '17:00', endTime: '17:45', category: 'Kesehatan', priority: 'Rendah', notes: 'Peregangan setelah duduk seharian' },
  { title: 'Makan malam dan waktu berkualitas bersama keluarga', startTime: '19:00', endTime: '20:15', category: 'Keluarga dan Sosial', priority: 'Tinggi', notes: 'Diskusi hangat tanpa gadget' },
  { title: 'Membaca buku non-fiksi 20 halaman', startTime: '20:30', endTime: '21:15', category: 'Pengembangan Diri', priority: 'Sedang', notes: 'Meningkatkan pengetahuan dan mindset' },
  { title: 'Evaluasi hari ini dan rencana besok (Jurnal)', startTime: '21:15', endTime: '21:45', category: 'Evaluasi', priority: 'Tinggi', notes: 'Tulis rasa syukur dan prioritas esok hari' }
];

export const RoutinesView: React.FC<RoutinesViewProps> = ({
  currentDate,
  onDateChange,
  openCreateModalDirectly
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [categories, setCategories] = useState<string[]>([]);

  // Filter & Search states
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterPriority, setFilterPriority] = useState<string>('');
  const [filterStatus, setFilterStatus] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [sortBy, setSortBy] = useState<'time' | 'priority' | 'title'>('time');

  // Modal states
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [isTemplateModalOpen, setIsTemplateModalOpen] = useState<boolean>(false);
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    title: '',
    date: currentDate,
    start_time: '',
    end_time: '',
    category: 'Pekerjaan',
    priority: 'Sedang' as ActivityPriority,
    status: 'Belum Dimulai' as ActivityStatus,
    notes: ''
  });

  // Selected templates in starter modal
  const [selectedTemplateIndices, setSelectedTemplateIndices] = useState<number[]>([0, 1, 3, 5, 11]);

  const loadActivities = async () => {
    try {
      setLoading(true);
      const res = await api.getActivities({ date: currentDate });
      setActivities(res.activities);
    } catch (err: any) {
      console.error('Error loading activities:', err);
    } finally {
      setLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.getSettings();
      if (res.settings?.activity_categories) {
        setCategories(res.settings.activity_categories);
        if (!formData.category && res.settings.activity_categories.length > 0) {
          setFormData((prev) => ({ ...prev, category: res.settings.activity_categories[0] }));
        }
      }
    } catch (err) {
      // fallback
      setCategories(['Pribadi', 'Kesehatan', 'Pekerjaan', 'Pengembangan Diri', 'Keluarga dan Sosial', 'Keuangan', 'Evaluasi']);
    }
  };

  useEffect(() => {
    loadActivities();
  }, [currentDate]);

  useEffect(() => {
    loadSettings();
  }, []);

  useEffect(() => {
    if (openCreateModalDirectly) {
      handleOpenCreate();
    }
  }, [openCreateModalDirectly]);

  const handleOpenCreate = () => {
    setEditingActivity(null);
    setFormData({
      title: '',
      date: currentDate,
      start_time: '',
      end_time: '',
      category: categories[0] || 'Pribadi',
      priority: 'Sedang',
      status: 'Belum Dimulai',
      notes: ''
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (act: Activity) => {
    setEditingActivity(act);
    setFormData({
      title: act.title,
      date: act.date,
      start_time: act.start_time || '',
      end_time: act.end_time || '',
      category: act.category,
      priority: act.priority,
      status: act.status,
      notes: act.notes || ''
    });
    setIsModalOpen(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title.trim()) {
      alert('Judul aktivitas wajib diisi.');
      return;
    }

    try {
      if (editingActivity) {
        await api.updateActivity(editingActivity.id, formData);
      } else {
        await api.createActivity(formData);
      }
      setIsModalOpen(false);
      loadActivities();
    } catch (err: any) {
      alert(`Gagal menyimpan: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteActivity(id);
      setDeleteConfirmId(null);
      loadActivities();
    } catch (err: any) {
      alert(`Gagal menghapus: ${err.message}`);
    }
  };

  const handleQuickStatus = async (id: string, status: ActivityStatus) => {
    try {
      await api.updateActivityStatus(id, status);
      loadActivities();
    } catch (err: any) {
      alert(`Gagal memperbarui status: ${err.message}`);
    }
  };

  const handleApplyTemplates = async () => {
    const templatesToApply = selectedTemplateIndices.map((idx) => STARTER_ROUTINES_CATALOG[idx]);
    try {
      await api.applyTemplates(currentDate, templatesToApply);
      setIsTemplateModalOpen(false);
      loadActivities();
    } catch (err: any) {
      alert(`Gagal menerapkan template: ${err.message}`);
    }
  };

  // Filter & Sort
  const filteredActivities = activities
    .filter((a) => {
      if (filterCategory && a.category !== filterCategory) return false;
      if (filterPriority && a.priority !== filterPriority) return false;
      if (filterStatus && a.status !== filterStatus) return false;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        return a.title.toLowerCase().includes(q) || (a.notes && a.notes.toLowerCase().includes(q));
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'time') {
        const timeA = a.start_time || '99:99';
        const timeB = b.start_time || '99:99';
        return timeA.localeCompare(timeB);
      }
      if (sortBy === 'priority') {
        const pOrder: Record<string, number> = { Tinggi: 3, Sedang: 2, Rendah: 1 };
        return (pOrder[b.priority] || 0) - (pOrder[a.priority] || 0);
      }
      return a.title.localeCompare(b.title);
    });

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Manajemen Aktivitas & Rutinitas
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Daftar kegiatan terjadwal untuk tanggal{' '}
            <span className="font-semibold text-slate-700">{currentDate}</span>
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setIsTemplateModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded-lg text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <Sparkles className="w-4 h-4 text-amber-600" />
            <span>Terapkan Rutinitas Standar</span>
          </button>

          <button
            onClick={handleOpenCreate}
            className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Aktivitas</span>
          </button>
        </div>
      </div>

      {/* Filter and Control Bar */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs space-y-3">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            <input
              type="text"
              placeholder="Cari aktivitas..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              aria-label="Filter berdasarkan Kategori"
            >
              <option value="">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Priority Filter */}
          <div>
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              aria-label="Filter berdasarkan Prioritas"
            >
              <option value="">Semua Prioritas</option>
              <option value="Tinggi">Tinggi</option>
              <option value="Sedang">Sedang</option>
              <option value="Rendah">Rendah</option>
            </select>
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              aria-label="Filter berdasarkan Status"
            >
              <option value="">Semua Status</option>
              <option value="Belum Dimulai">Belum Dimulai</option>
              <option value="Sedang Berjalan">Sedang Berjalan</option>
              <option value="Selesai">Selesai</option>
              <option value="Dilewati">Dilewati</option>
            </select>
          </div>

          {/* Sort */}
          <div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-full py-2 px-3 text-xs sm:text-sm border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              aria-label="Urutkan Berdasarkan"
            >
              <option value="time">Urut: Jam Mulai</option>
              <option value="priority">Urut: Prioritas</option>
              <option value="title">Urut: Judul (A-Z)</option>
            </select>
          </div>
        </div>
      </div>

      {/* Activities Table / List */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-500 text-sm">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2">Memuat daftar aktivitas...</p>
          </div>
        ) : filteredActivities.length === 0 ? (
          <div className="py-16 px-4 text-center">
            <CalendarIcon className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-semibold text-slate-700 text-sm">Tidak ada aktivitas yang sesuai</p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Belum ada kegiatan untuk tanggal ini atau filter pencarian tidak menemukan hasil.
            </p>
            <div className="mt-4 flex items-center justify-center gap-2">
              <button
                onClick={handleOpenCreate}
                className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition"
              >
                + Tambah Aktivitas
              </button>
              <button
                onClick={() => setIsTemplateModalOpen(true)}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
              >
                Pilih Rutinitas Standar
              </button>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredActivities.map((act) => {
              const isDone = act.status === 'Selesai';
              const isSkipped = act.status === 'Dilewati';
              const isProgress = act.status === 'Sedang Berjalan';

              return (
                <div
                  key={act.id}
                  className={`p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-slate-50/80 transition ${
                    isDone ? 'bg-emerald-50/15' : ''
                  }`}
                >
                  <div className="space-y-1.5 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`font-semibold text-sm sm:text-base ${
                          isDone
                            ? 'line-through text-slate-400'
                            : isSkipped
                            ? 'text-slate-400 italic'
                            : 'text-slate-900'
                        }`}
                      >
                        {act.title}
                      </span>

                      <span className="text-xs px-2.5 py-0.5 rounded-full font-medium bg-slate-100 text-slate-700">
                        {act.category}
                      </span>

                      <span
                        className={`text-xs px-2 py-0.5 rounded-md font-semibold ${
                          act.priority === 'Tinggi'
                            ? 'bg-rose-100 text-rose-700'
                            : act.priority === 'Sedang'
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-slate-100 text-slate-600'
                        }`}
                      >
                        Prioritas {act.priority}
                      </span>

                      <span
                        className={`text-xs px-2.5 py-0.5 rounded-md font-bold ${
                          isDone
                            ? 'bg-emerald-100 text-emerald-800'
                            : isProgress
                            ? 'bg-amber-100 text-amber-800'
                            : isSkipped
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    <div className="flex items-center gap-4 text-xs text-slate-500 flex-wrap">
                      {(act.start_time || act.end_time) && (
                        <span className="flex items-center gap-1 font-mono font-medium text-slate-700">
                          <Clock className="w-3.5 h-3.5 text-slate-400" />
                          {act.start_time || '—'} {act.end_time ? `s.d. ${act.end_time}` : ''}
                        </span>
                      )}
                      {act.notes && (
                        <span className="text-slate-600 bg-slate-50 px-2 py-0.5 rounded border border-slate-100">
                          {act.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Right side: Quick Status Pills & Actions */}
                  <div className="flex items-center gap-2 shrink-0 self-end md:self-center flex-wrap">
                    {/* Status Toggle Buttons */}
                    <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-slate-50">
                      <button
                        onClick={() => handleQuickStatus(act.id, 'Selesai')}
                        className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                          isDone ? 'bg-emerald-600 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-emerald-700'
                        }`}
                        title="Tandai Selesai"
                      >
                        Selesai
                      </button>
                      <button
                        onClick={() => handleQuickStatus(act.id, 'Sedang Berjalan')}
                        className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                          isProgress ? 'bg-amber-500 text-white shadow-xs font-semibold' : 'text-slate-600 hover:text-amber-700'
                        }`}
                        title="Tandai Sedang Berjalan"
                      >
                        Berjalan
                      </button>
                      <button
                        onClick={() => handleQuickStatus(act.id, 'Belum Dimulai')}
                        className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                          act.status === 'Belum Dimulai' ? 'bg-slate-700 text-white shadow-xs font-semibold' : 'text-slate-600'
                        }`}
                        title="Tandai Belum Dimulai"
                      >
                        Belum
                      </button>
                      <button
                        onClick={() => handleQuickStatus(act.id, 'Dilewati')}
                        className={`px-2.5 py-1 text-xs rounded font-medium transition cursor-pointer ${
                          isSkipped ? 'bg-rose-500 text-white shadow-xs font-semibold' : 'text-slate-400 hover:text-rose-700'
                        }`}
                        title="Tandai Dilewati"
                      >
                        Lewati
                      </button>
                    </div>

                    {/* Edit & Delete Buttons */}
                    <button
                      onClick={() => handleOpenEdit(act)}
                      className="p-1.5 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition"
                      title="Edit Aktivitas"
                      aria-label="Edit Aktivitas"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>

                    <button
                      onClick={() => setDeleteConfirmId(act.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                      title="Hapus Aktivitas"
                      aria-label="Hapus Aktivitas"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* ADD / EDIT ACTIVITY MODAL */}
      {isModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold text-slate-900 mb-4">
              {editingActivity ? 'Edit Aktivitas' : 'Tambah Aktivitas Baru'}
            </h2>

            <form onSubmit={handleFormSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Judul Aktivitas <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Olahraga pagi 30 menit"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Tanggal</label>
                  <input
                    type="date"
                    required
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>

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
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Mulai</label>
                  <input
                    type="time"
                    value={formData.start_time}
                    onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Jam Selesai</label>
                  <input
                    type="time"
                    value={formData.end_time}
                    onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Prioritas</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Tinggi">Tinggi</option>
                    <option value="Sedang">Sedang</option>
                    <option value="Rendah">Rendah</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                    className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
                  >
                    <option value="Belum Dimulai">Belum Dimulai</option>
                    <option value="Sedang Berjalan">Sedang Berjalan</option>
                    <option value="Selesai">Selesai</option>
                    <option value="Dilewati">Dilewati</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Catatan Tambahan</label>
                <textarea
                  rows={2}
                  placeholder="Catatan atau rincian kegiatan..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
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
                  {editingActivity ? 'Simpan Perubahan' : 'Tambahkan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* STARTER ROUTINES CATALOG MODAL */}
      {isTemplateModalOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-slate-100 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-amber-500" />
                  Pilih Rekomendasi Rutinitas Standar
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Pilih kegiatan terstruktur untuk diterapkan langsung ke tanggal {currentDate}.
                </p>
              </div>
              <button
                onClick={() => {
                  if (selectedTemplateIndices.length === STARTER_ROUTINES_CATALOG.length) {
                    setSelectedTemplateIndices([]);
                  } else {
                    setSelectedTemplateIndices(STARTER_ROUTINES_CATALOG.map((_, i) => i));
                  }
                }}
                className="text-xs text-blue-600 hover:underline font-semibold"
              >
                {selectedTemplateIndices.length === STARTER_ROUTINES_CATALOG.length
                  ? 'Batal Pilih Semua'
                  : 'Pilih Semua (12)'}
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2 flex-1 pr-1">
              {STARTER_ROUTINES_CATALOG.map((item, idx) => {
                const isSelected = selectedTemplateIndices.includes(idx);
                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isSelected) {
                        setSelectedTemplateIndices(selectedTemplateIndices.filter((i) => i !== idx));
                      } else {
                        setSelectedTemplateIndices([...selectedTemplateIndices, idx]);
                      }
                    }}
                    className={`p-3 rounded-xl border text-xs sm:text-sm flex items-start gap-3 cursor-pointer transition ${
                      isSelected
                        ? 'bg-blue-50/60 border-blue-300'
                        : 'bg-white border-slate-200 hover:bg-slate-50'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={() => {}} // handled by div click
                      className="mt-1 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <span className="font-semibold text-slate-900">{item.title}</span>
                        <span className="text-xs font-mono font-medium text-slate-600">
                          {item.startTime} - {item.endTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-[11px] px-2 py-0.2 bg-slate-100 rounded text-slate-600">
                          {item.category}
                        </span>
                        <span className="text-[11px] text-slate-400">{item.notes}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {selectedTemplateIndices.length} rutinitas terpilih
              </span>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setIsTemplateModalOpen(false)}
                  className="px-4 py-2 text-sm font-semibold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="button"
                  disabled={selectedTemplateIndices.length === 0}
                  onClick={handleApplyTemplates}
                  className="px-5 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs disabled:opacity-50 transition"
                >
                  Terapkan ke {currentDate}
                </button>
              </div>
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
            <h3 className="font-bold text-slate-900 text-lg">Hapus Aktivitas?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Aktivitas ini akan dihapus secara permanen dari jadwal harian Anda. Tindakan ini tidak dapat dibatalkan.
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
