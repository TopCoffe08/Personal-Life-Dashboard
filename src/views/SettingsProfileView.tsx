import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { api, getAuthToken } from '../services/api';
import { UserSettings } from '../types';
import {
  Settings,
  User as UserIcon,
  Lock,
  Download,
  Trash2,
  Plus,
  CheckCircle2,
  AlertTriangle,
  Globe,
  FileJson,
  FileSpreadsheet
} from 'lucide-react';

export const SettingsProfileView: React.FC = () => {
  const { user, updateProfile, changePassword, deleteAccount } = useAuth();

  const [settings, setSettings] = useState<UserSettings>({
    activity_categories: [],
    goal_categories: [],
    first_day_of_week: 'Senin',
    timezone: 'Asia/Makassar',
    theme: 'light'
  });

  const [loading, setLoading] = useState<boolean>(true);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Profile edit
  const [name, setName] = useState<string>(user?.name || '');
  const [timezone, setTimezone] = useState<string>(user?.timezone || 'Asia/Makassar');

  // Password change
  const [oldPassword, setOldPassword] = useState<string>('');
  const [newPassword, setNewPassword] = useState<string>('');
  const [confirmNewPassword, setConfirmNewPassword] = useState<string>('');
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Category management
  const [newActivityCat, setNewActivityCat] = useState<string>('');
  const [newGoalCat, setNewGoalCat] = useState<string>('');

  // Delete account modal
  const [showDeleteModal, setShowDeleteModal] = useState<boolean>(false);
  const [deletePassword, setDeletePassword] = useState<string>('');
  const [deleteError, setDeleteError] = useState<string | null>(null);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const res = await api.getSettings();
      if (res.settings) {
        setSettings(res.settings);
        setTimezone(res.settings.timezone || user?.timezone || 'Asia/Makassar');
      }
    } catch (err) {
      console.error('Error loading settings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
    if (user?.name) setName(user.name);
  }, [user]);

  const showNotification = (msg: string) => {
    setSuccessMsg(msg);
    setTimeout(() => setSuccessMsg(null), 3500);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await updateProfile(name, timezone);
      await api.updateSettings({
        ...settings,
        timezone
      });
      showNotification('Profil dan zona waktu berhasil diperbarui!');
    } catch (err: any) {
      alert(`Gagal memperbarui profil: ${err.message}`);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    if (newPassword !== confirmNewPassword) {
      setPasswordError('Konfirmasi kata sandi baru tidak cocok.');
      return;
    }
    if (newPassword.length < 8) {
      setPasswordError('Kata sandi baru minimal 8 karakter.');
      return;
    }

    try {
      await changePassword(oldPassword, newPassword);
      setOldPassword('');
      setNewPassword('');
      setConfirmNewPassword('');
      showNotification('Kata sandi berhasil diubah!');
    } catch (err: any) {
      setPasswordError(err.message || 'Gagal mengubah kata sandi.');
    }
  };

  const handleAddActivityCategory = async () => {
    if (!newActivityCat.trim()) return;
    const cat = newActivityCat.trim();
    if (settings.activity_categories.includes(cat)) {
      alert('Kategori ini sudah ada.');
      return;
    }

    const updated = [...settings.activity_categories, cat];
    try {
      await api.updateSettings({ ...settings, activity_categories: updated });
      setSettings({ ...settings, activity_categories: updated });
      setNewActivityCat('');
      showNotification('Kategori aktivitas baru ditambahkan!');
    } catch (err: any) {
      alert(`Gagal menambah kategori: ${err.message}`);
    }
  };

  const handleRemoveActivityCategory = async (catToRemove: string) => {
    if (settings.activity_categories.length <= 1) {
      alert('Minimal harus ada satu kategori aktivitas.');
      return;
    }
    const updated = settings.activity_categories.filter((c) => c !== catToRemove);
    try {
      await api.updateSettings({ ...settings, activity_categories: updated });
      setSettings({ ...settings, activity_categories: updated });
      showNotification(`Kategori "${catToRemove}" dihapus dari daftar pilihan.`);
    } catch (err: any) {
      alert(`Gagal menghapus kategori: ${err.message}`);
    }
  };

  const handleAddGoalCategory = async () => {
    if (!newGoalCat.trim()) return;
    const cat = newGoalCat.trim();
    if (settings.goal_categories.includes(cat)) {
      alert('Kategori ini sudah ada.');
      return;
    }

    const updated = [...settings.goal_categories, cat];
    try {
      await api.updateSettings({ ...settings, goal_categories: updated });
      setSettings({ ...settings, goal_categories: updated });
      setNewGoalCat('');
      showNotification('Kategori target baru ditambahkan!');
    } catch (err: any) {
      alert(`Gagal menambah kategori: ${err.message}`);
    }
  };

  const handleRemoveGoalCategory = async (catToRemove: string) => {
    if (settings.goal_categories.length <= 1) {
      alert('Minimal harus ada satu kategori target.');
      return;
    }
    const updated = settings.goal_categories.filter((c) => c !== catToRemove);
    try {
      await api.updateSettings({ ...settings, goal_categories: updated });
      setSettings({ ...settings, goal_categories: updated });
      showNotification(`Kategori target "${catToRemove}" dihapus dari daftar pilihan.`);
    } catch (err: any) {
      alert(`Gagal menghapus kategori: ${err.message}`);
    }
  };

  const handleDownloadExport = (format: 'json' | 'csv') => {
    const token = getAuthToken();
    const url = `/api/export?format=${format}`;
    // Fetch with authorization header and download
    fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((res) => res.blob())
      .then((blob) => {
        const downloadUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = downloadUrl;
        a.download = `pld_export_${new Date().toISOString().slice(0, 10)}.${format}`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        showNotification(`Ekspor data format ${format.toUpperCase()} berhasil diunduh!`);
      })
      .catch((err) => {
        alert(`Gagal mengunduh ekspor: ${err.message}`);
      });
  };

  const handleDeleteAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setDeleteError(null);
    if (!deletePassword) {
      setDeleteError('Silakan masukkan kata sandi Anda untuk konfirmasi.');
      return;
    }
    try {
      await deleteAccount(deletePassword);
    } catch (err: any) {
      setDeleteError(err.message || 'Gagal menghapus akun.');
    }
  };

  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      {/* Top Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="w-6 h-6 text-slate-700" />
          Pengaturan Aplikasi & Profil Akun
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Kelola informasi profil, preferensi zona waktu, kategori kustom, serta ekspor data pribadi Anda.
        </p>
      </div>

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-sm flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="w-5 h-5 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Profile & Timezone Form */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <UserIcon className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-base">Profil & Zona Waktu</h2>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Nama Tampilan</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Email Akun (Terkunci)</label>
              <input
                type="email"
                disabled
                value={user?.email || ''}
                className="w-full px-3 py-2 text-sm border border-slate-200 rounded-lg bg-slate-50 text-slate-500 cursor-not-allowed font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Zona Waktu Pilihan</label>
              <select
                value={timezone}
                onChange={(e) => setTimezone(e.target.value)}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="Asia/Makassar">Asia/Makassar (WITA, UTC+8) — Default</option>
                <option value="Asia/Jakarta">Asia/Jakarta (WIB, UTC+7)</option>
                <option value="Asia/Jayapura">Asia/Jayapura (WIT, UTC+9)</option>
                <option value="UTC">UTC (Universal Coordinated Time)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Hari Pertama Minggu</label>
              <select
                value={settings.first_day_of_week}
                onChange={(e) => setSettings({ ...settings, first_day_of_week: e.target.value })}
                className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600 bg-white"
              >
                <option value="Senin">Senin (Standar Indonesia)</option>
                <option value="Minggu">Minggu</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex justify-end">
            <button
              type="submit"
              className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-lg shadow-xs transition cursor-pointer"
            >
              Simpan Profil
            </button>
          </div>
        </form>
      </div>

      {/* Category Management */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-5">
        <h2 className="font-bold text-slate-900 text-base">Kelola Kategori Kustom</h2>
        <p className="text-xs text-slate-500">
          Penambahan atau penghapusan kategori tidak akan merusak data historis kegiatan yang sudah tercatat.
        </p>

        {/* Activity Categories */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Kategori Aktivitas & Rutinitas
          </label>
          <div className="flex flex-wrap gap-2">
            {settings.activity_categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700 border border-slate-200"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveActivityCategory(cat)}
                  className="text-slate-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                  title={`Hapus kategori ${cat}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm pt-2">
            <input
              type="text"
              placeholder="Nama kategori baru..."
              value={newActivityCat}
              onChange={(e) => setNewActivityCat(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg flex-1"
            />
            <button
              type="button"
              onClick={handleAddActivityCategory}
              className="px-3 py-1.5 bg-slate-800 text-white text-xs font-semibold rounded-lg hover:bg-slate-900 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
        </div>

        {/* Goal Categories */}
        <div className="space-y-2 pt-3 border-t border-slate-100">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Kategori Target & Sasaran
          </label>
          <div className="flex flex-wrap gap-2">
            {settings.goal_categories.map((cat) => (
              <span
                key={cat}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200"
              >
                {cat}
                <button
                  type="button"
                  onClick={() => handleRemoveGoalCategory(cat)}
                  className="text-purple-400 hover:text-rose-600 font-bold ml-1 cursor-pointer"
                  title={`Hapus kategori ${cat}`}
                >
                  ×
                </button>
              </span>
            ))}
          </div>

          <div className="flex gap-2 max-w-sm pt-2">
            <input
              type="text"
              placeholder="Nama kategori target baru..."
              value={newGoalCat}
              onChange={(e) => setNewGoalCat(e.target.value)}
              className="px-3 py-1.5 text-xs border border-slate-300 rounded-lg flex-1"
            />
            <button
              type="button"
              onClick={handleAddGoalCategory}
              className="px-3 py-1.5 bg-purple-700 text-white text-xs font-semibold rounded-lg hover:bg-purple-800 transition flex items-center gap-1"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Lock className="w-5 h-5 text-amber-600" />
          <h2 className="font-bold text-slate-900 text-base">Ubah Kata Sandi</h2>
        </div>

        {passwordError && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs">
            {passwordError}
          </div>
        )}

        <form onSubmit={handleChangePassword} className="space-y-3 max-w-md">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi Saat Ini
            </label>
            <input
              type="password"
              required
              value={oldPassword}
              onChange={(e) => setOldPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Kata Sandi Baru (Min. 8 Karakter)
            </label>
            <input
              type="password"
              required
              minLength={8}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Ulangi Kata Sandi Baru
            </label>
            <input
              type="password"
              required
              value={confirmNewPassword}
              onChange={(e) => setConfirmNewPassword(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-blue-600"
            />
          </div>

          <button
            type="submit"
            className="px-5 py-2 text-xs sm:text-sm font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition cursor-pointer"
          >
            Perbarui Kata Sandi
          </button>
        </form>
      </div>

      {/* Export Data */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
          <Download className="w-5 h-5 text-blue-600" />
          <h2 className="font-bold text-slate-900 text-base">Ekspor Data Pribadi (Portabilitas)</h2>
        </div>
        <p className="text-xs text-slate-500">
          Unduh seluruh data Anda secara aman termasuk seluruh aktivitas, kebiasaan, target, jurnal, dan preferensi akun. Ekspor hanya memuat data milik akun Anda.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => handleDownloadExport('json')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <FileJson className="w-4 h-4 text-amber-400" />
            <span>Unduh Arsip JSON Lengkap</span>
          </button>

          <button
            type="button"
            onClick={() => handleDownloadExport('csv')}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs sm:text-sm font-semibold transition cursor-pointer"
          >
            <FileSpreadsheet className="w-4 h-4 text-emerald-200" />
            <span>Unduh Aktivitas (CSV)</span>
          </button>
        </div>
      </div>

      {/* Danger Zone: Delete Account */}
      <div className="bg-rose-50/60 p-6 rounded-2xl border border-rose-200 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-rose-800">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <h2 className="font-bold text-base">Area Berbahaya (Zona Kritis)</h2>
        </div>
        <p className="text-xs text-rose-700">
          Menghapus akun akan memusnahkan seluruh jadwal, riwayat kebiasaan, target, dan jurnal Anda secara permanen dari server database.
        </p>

        <button
          type="button"
          onClick={() => setShowDeleteModal(true)}
          className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-xs transition cursor-pointer"
        >
          Hapus Akun Saya Secara Permanen
        </button>
      </div>

      {/* DELETE ACCOUNT MODAL */}
      {showDeleteModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 mx-auto flex items-center justify-center mb-3">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg text-center">Konfirmasi Penghapusan Akun</h3>
            <p className="text-xs text-slate-500 mt-1 text-center">
              Masukkan kata sandi Anda saat ini untuk mengonfirmasi bahwa Anda benar-benar pemilik sah akun ini.
            </p>

            {deleteError && (
              <div className="p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-lg mt-3">
                {deleteError}
              </div>
            )}

            <form onSubmit={handleDeleteAccountSubmit} className="mt-4 space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Kata Sandi Anda</label>
                <input
                  type="password"
                  required
                  placeholder="Masukkan kata sandi untuk verifikasi"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-slate-300 rounded-lg focus:outline-none focus:border-rose-600"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowDeleteModal(false);
                    setDeletePassword('');
                    setDeleteError(null);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-rose-600 hover:bg-rose-700 rounded-lg shadow-xs"
                >
                  Konfirmasi & Hapus Permanen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
