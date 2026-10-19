import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import {
  Calendar as CalendarIcon,
  ChevronLeft,
  ChevronRight,
  User as UserIcon,
  LogOut,
  Settings,
  HelpCircle,
  Menu,
  X,
  Compass
} from 'lucide-react';

interface HeaderProps {
  currentDate: string; // YYYY-MM-DD
  onDateChange: (newDate: string) => void;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentDate,
  onDateChange,
  activeTab,
  onTabChange
}) => {
  const { user, logout } = useAuth();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handlePrevDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - 1);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const handleNextDay = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + 1);
    onDateChange(d.toISOString().slice(0, 10));
  };

  const handleToday = () => {
    const today = new Date().toISOString().slice(0, 10);
    onDateChange(today);
  };

  // Format date display in Indonesian (e.g., "Senin, 19 Oktober 2026")
  const formatDateDisplay = (dateStr: string) => {
    try {
      const parts = dateStr.split('-');
      const d = new Date(parseInt(parts[0], 10), parseInt(parts[1], 10) - 1, parseInt(parts[2], 10));
      return d.toLocaleDateString('id-ID', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateStr;
    }
  };

  const currentYear = currentDate.slice(0, 4);

  return (
    <header className="bg-[#14213D] text-white border-b border-slate-700 sticky top-0 z-40 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Brand & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => onTabChange('dashboard')}
              className="flex items-center gap-2.5 text-left focus:outline-none group cursor-pointer"
              aria-label="Kembali ke Dashboard Utama"
            >
              <div className="w-10 h-10 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white shadow group-hover:bg-blue-500 transition">
                <Compass className="w-6 h-6" />
              </div>
              <div>
                <span className="font-bold text-lg sm:text-xl tracking-tight text-white block leading-tight">
                  Personal Life Dashboard
                </span>
                <span className="text-xs text-slate-400 font-medium hidden sm:inline-block">
                  Kelola Rutinitas & Produktivitas
                </span>
              </div>
            </button>
          </div>

          {/* Center: Date Selector Controller */}
          <div className="hidden md:flex items-center gap-1.5 bg-slate-800/90 rounded-lg px-2.5 py-1.5 border border-slate-700 shadow-inner">
            <button
              onClick={handlePrevDay}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Hari Sebelumnya"
              aria-label="Hari Sebelumnya"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <button
              onClick={handleToday}
              className="px-2.5 py-1 text-xs font-semibold rounded bg-blue-600/30 text-blue-300 hover:bg-blue-600 hover:text-white transition"
              aria-label="Kembali ke Hari Ini"
            >
              Hari Ini
            </button>

            <div className="flex items-center gap-1.5 px-2">
              <CalendarIcon className="w-4 h-4 text-blue-400" />
              <input
                type="date"
                value={currentDate}
                onChange={(e) => e.target.value && onDateChange(e.target.value)}
                className="bg-transparent text-sm font-medium text-white focus:outline-none cursor-pointer"
                aria-label="Pilih Tanggal Pemantauan"
              />
            </div>

            <button
              onClick={handleNextDay}
              className="p-1 rounded text-slate-300 hover:text-white hover:bg-slate-700 transition"
              title="Hari Berikutnya"
              aria-label="Hari Berikutnya"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            <span className="text-xs bg-slate-700 text-slate-300 px-2 py-0.5 rounded font-mono ml-1">
              {currentYear}
            </span>
          </div>

          {/* Right: User Menu & Mobile Toggle */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:block text-right">
              <div className="text-xs text-slate-400 font-medium">Masuk sebagai:</div>
              <div className="text-sm font-semibold text-slate-100 max-w-[140px] truncate">
                {user?.name || user?.email}
              </div>
            </div>

            {/* Profile Menu Dropdown */}
            <div className="relative">
              <button
                onClick={() => setUserMenuOpen(!userMenuOpen)}
                className="w-9 h-9 rounded-full bg-blue-500/20 text-blue-400 border border-blue-400/30 flex items-center justify-center hover:bg-blue-500/30 transition focus:outline-none"
                aria-label="Menu Pengguna"
                aria-expanded={userMenuOpen}
              >
                <UserIcon className="w-5 h-5" />
              </button>

              {userMenuOpen && (
                <div
                  className="absolute right-0 mt-2 w-56 rounded-lg bg-slate-900 border border-slate-700 shadow-xl py-1 text-sm z-50 animate-in fade-in slide-in-from-top-2"
                  role="menu"
                >
                  <div className="px-4 py-2 border-b border-slate-800">
                    <p className="font-semibold text-white truncate">{user?.name}</p>
                    <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                    <p className="text-xs text-blue-400 mt-1 font-mono">{user?.timezone || 'Asia/Makassar'}</p>
                  </div>

                  <button
                    onClick={() => {
                      onTabChange('settings');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    role="menuitem"
                  >
                    <Settings className="w-4 h-4 text-slate-400" />
                    Pengaturan & Profil
                  </button>

                  <button
                    onClick={() => {
                      onTabChange('guide');
                      setUserMenuOpen(false);
                    }}
                    className="w-full text-left px-4 py-2 text-slate-300 hover:bg-slate-800 hover:text-white flex items-center gap-2"
                    role="menuitem"
                  >
                    <HelpCircle className="w-4 h-4 text-slate-400" />
                    Panduan Pengguna
                  </button>

                  <div className="border-t border-slate-800 my-1"></div>

                  <button
                    onClick={() => {
                      setUserMenuOpen(false);
                      logout();
                    }}
                    className="w-full text-left px-4 py-2 text-red-400 hover:bg-red-950/40 hover:text-red-300 flex items-center gap-2"
                    role="menuitem"
                  >
                    <LogOut className="w-4 h-4" />
                    Keluar (Logout)
                  </button>
                </div>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 rounded-lg text-slate-300 hover:text-white hover:bg-slate-800 focus:outline-none"
              aria-label="Buka Menu Navigasi"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Date Controller Banner */}
        <div className="md:hidden py-2 border-t border-slate-800 flex items-center justify-between text-xs">
          <button
            onClick={handlePrevDay}
            className="p-1 rounded bg-slate-800 text-slate-300"
            aria-label="Kemarin"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-1 font-medium">
            <span className="text-slate-200">{formatDateDisplay(currentDate)}</span>
          </div>
          <button
            onClick={handleNextDay}
            className="p-1 rounded bg-slate-800 text-slate-300"
            aria-label="Besok"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>

        {/* Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="md:hidden py-3 border-t border-slate-800 space-y-1">
            {[
              { id: 'dashboard', label: 'Dashboard' },
              { id: 'routines', label: 'Rutinitas' },
              { id: 'calendar', label: 'Kalender Bulanan' },
              { id: 'annual', label: 'Ringkasan Tahunan' },
              { id: 'habits', label: 'Habit Tracker' },
              { id: 'goals', label: 'Target Pribadi' },
              { id: 'journal', label: 'Jurnal Refleksi' },
              { id: 'settings', label: 'Pengaturan & Profil' },
              { id: 'guide', label: 'Panduan Pengguna' }
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  onTabChange(item.id);
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2 rounded-md font-medium text-sm transition ${
                  activeTab === item.id
                    ? 'bg-blue-600 text-white font-semibold'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {item.label}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
};
