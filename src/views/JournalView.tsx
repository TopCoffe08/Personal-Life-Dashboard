import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { Journal } from '../types';
import {
  BookOpen,
  Calendar,
  Save,
  Trash2,
  Search,
  Sparkles,
  Heart,
  Lightbulb,
  Target,
  Smile,
  Meh,
  Frown,
  CheckCircle2
} from 'lucide-react';

interface JournalViewProps {
  currentDate: string;
  onDateChange: (date: string) => void;
}

export const JournalView: React.FC<JournalViewProps> = ({ currentDate, onDateChange }) => {
  const [journals, setJournals] = useState<Journal[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  // Today's entry form state
  const [formData, setFormData] = useState({
    date: currentDate,
    mood: 4,
    achievements: '',
    gratitude: '',
    obstacles: '',
    lessons: '',
    tomorrow_focus: '',
    notes: ''
  });

  const loadJournals = async () => {
    try {
      setLoading(true);
      const res = await api.getJournals({ search: searchQuery });
      setJournals(res.journals || []);

      // Check if there is an entry for currentDate
      const currentEntry = (res.journals || []).find((j: Journal) => j.date === currentDate);
      if (currentEntry) {
        setFormData({
          date: currentEntry.date,
          mood: currentEntry.mood || 3,
          achievements: currentEntry.achievements || '',
          gratitude: currentEntry.gratitude || '',
          obstacles: currentEntry.obstacles || '',
          lessons: currentEntry.lessons || '',
          tomorrow_focus: currentEntry.tomorrow_focus || '',
          notes: currentEntry.notes || ''
        });
      } else {
        setFormData({
          date: currentDate,
          mood: 3,
          achievements: '',
          gratitude: '',
          obstacles: '',
          lessons: '',
          tomorrow_focus: '',
          notes: ''
        });
      }
    } catch (err) {
      console.error('Error loading journals:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJournals();
  }, [currentDate, searchQuery]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await api.saveJournal(formData);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
      loadJournals();
    } catch (err: any) {
      alert(`Gagal menyimpan jurnal: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.deleteJournal(id);
      setDeleteConfirmId(null);
      loadJournals();
    } catch (err: any) {
      alert(`Gagal menghapus entri jurnal: ${err.message}`);
    }
  };

  const moodLevels = [
    { value: 1, label: 'Sangat Buruk', icon: Frown, color: 'text-rose-500 bg-rose-50 border-rose-200' },
    { value: 2, label: 'Kurang Baik', icon: Frown, color: 'text-amber-500 bg-amber-50 border-amber-200' },
    { value: 3, label: 'Netral / Cukup', icon: Meh, color: 'text-slate-600 bg-slate-50 border-slate-200' },
    { value: 4, label: 'Baik & Tenang', icon: Smile, color: 'text-blue-600 bg-blue-50 border-blue-200' },
    { value: 5, label: 'Sangat Bahagia', icon: Smile, color: 'text-emerald-600 bg-emerald-50 border-emerald-200' }
  ];

  return (
    <div className="space-y-6 pb-12">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-600" />
            Jurnal & Refleksi Harian
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Dokumentasikan pencapaian, rasa syukur, evaluasi kendala, dan pelajaran penting setiap hari.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-600">Tanggal Jurnal:</span>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => {
              if (e.target.value) {
                onDateChange(e.target.value);
              }
            }}
            className="text-xs font-bold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
          />
        </div>
      </div>

      {saveSuccess && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>Jurnal refleksi untuk tanggal {formData.date} berhasil disimpan dengan aman!</span>
        </div>
      )}

      {/* Main Grid: Left is Form for Selected Date, Right is History */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Active Date Journal Editor */}
        <div className="lg:col-span-2">
          <form onSubmit={handleSave} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
            {/* Mood Picker */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
                Bagaimana Mood & Kondisi Anda Hari Ini?
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                {moodLevels.map((lvl) => {
                  const Icon = lvl.icon;
                  const isSelected = formData.mood === lvl.value;
                  return (
                    <button
                      type="button"
                      key={lvl.value}
                      onClick={() => setFormData({ ...formData, mood: lvl.value })}
                      className={`p-2.5 rounded-xl border text-center transition flex flex-col items-center gap-1 cursor-pointer ${
                        isSelected
                          ? 'border-blue-600 bg-blue-50/70 shadow-xs ring-2 ring-blue-500/20'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <Icon className={`w-5 h-5 ${isSelected ? 'text-blue-600' : 'text-slate-400'}`} />
                      <span className="text-[11px] font-semibold text-slate-800">{lvl.label}</span>
                      <span className="text-[10px] text-slate-400 font-mono">Skala {lvl.value}/5</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Achievements */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                Pencapaian & Kemenangan Hari Ini (Wins)
              </label>
              <textarea
                rows={2}
                placeholder="Apa yang berhasil Anda selesaikan hari ini? Sekecil apa pun..."
                value={formData.achievements}
                onChange={(e) => setFormData({ ...formData, achievements: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            {/* Gratitude */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-rose-500" />
                Rasa Syukur Hari Ini (Gratitude)
              </label>
              <textarea
                rows={2}
                placeholder="Tiga hal yang Anda syukuri hari ini..."
                value={formData.gratitude}
                onChange={(e) => setFormData({ ...formData, gratitude: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            {/* Obstacles & Lessons */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kendala & Hambatan
                </label>
                <textarea
                  rows={2}
                  placeholder="Hambatan yang Anda temui..."
                  value={formData.obstacles}
                  onChange={(e) => setFormData({ ...formData, obstacles: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
                  Pelajaran yang Dipetik (Insights)
                </label>
                <textarea
                  rows={2}
                  placeholder="Hal berharga yang Anda pelajari..."
                  value={formData.lessons}
                  onChange={(e) => setFormData({ ...formData, lessons: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
                ></textarea>
              </div>
            </div>

            {/* Tomorrow's Focus */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5 text-purple-600" />
                Fokus Utama Hari Esok
              </label>
              <input
                type="text"
                placeholder="1-2 prioritas terpenting yang ingin diselesaikan besok..."
                value={formData.tomorrow_focus}
                onChange={(e) => setFormData({ ...formData, tomorrow_focus: e.target.value })}
                className="w-full px-3.5 py-2 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              />
            </div>

            {/* Free Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                Catatan Bebas & Refleksi Diri
              </label>
              <textarea
                rows={3}
                placeholder="Tuliskan pikiran, ide, atau unek-unek Anda secara bebas..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3.5 py-2.5 text-sm border border-slate-200 rounded-xl focus:outline-none focus:border-blue-600"
              ></textarea>
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <span className="text-xs text-slate-400">
                Data jurnal tersimpan secara privat khusus untuk akun Anda.
              </span>
              <button
                type="submit"
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-xs transition cursor-pointer"
              >
                <Save className="w-4 h-4" />
                <span>Simpan Jurnal</span>
              </button>
            </div>
          </form>
        </div>

        {/* Right Column (1 Col): History & Search */}
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs space-y-3">
            <h2 className="font-bold text-slate-900 text-sm">Riwayat & Pencarian Jurnal</h2>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Cari kata kunci dalam jurnal..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-xs border border-slate-200 rounded-lg focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="divide-y divide-slate-100 max-h-[500px] overflow-y-auto pr-1">
              {loading ? (
                <div className="py-8 text-center text-xs text-slate-400">Memuat riwayat...</div>
              ) : journals.length === 0 ? (
                <div className="py-8 text-center text-xs text-slate-400">
                  Belum ada entri jurnal yang cocok.
                </div>
              ) : (
                journals.map((j) => (
                  <div key={j.id} className="py-3 space-y-1.5 group">
                    <div className="flex items-center justify-between">
                      <button
                        onClick={() => onDateChange(j.date)}
                        className="text-xs font-bold text-blue-700 hover:underline flex items-center gap-1.5"
                      >
                        <Calendar className="w-3.5 h-3.5" />
                        {j.date}
                      </button>
                      <div className="flex items-center gap-1">
                        <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                          Mood: {j.mood}/5
                        </span>
                        <button
                          onClick={() => setDeleteConfirmId(j.id)}
                          className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-600 transition"
                          title="Hapus Jurnal"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    {j.achievements && (
                      <p className="text-xs text-slate-700 line-clamp-1">
                        <strong>Wins:</strong> {j.achievements}
                      </p>
                    )}
                    {j.gratitude && (
                      <p className="text-xs text-slate-500 line-clamp-1">
                        <strong>Syukur:</strong> {j.gratitude}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

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
            <h3 className="font-bold text-slate-900 text-lg">Hapus Entri Jurnal?</h3>
            <p className="text-xs text-slate-500 mt-1">
              Catatan refleksi ini akan dihapus secara permanen.
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
