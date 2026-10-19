import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { MonthlyDayData, INDONESIAN_MONTH_NAMES, INDONESIAN_DAY_NAMES } from '../utils/calculations';
import { Activity } from '../types';
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  Clock,
  Calendar as CalendarIcon,
  Plus,
  ArrowRight
} from 'lucide-react';

interface CalendarViewProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  onOpenAddActivity: () => void;
}

export const CalendarView: React.FC<CalendarViewProps> = ({
  currentDate,
  onSelectDate,
  onOpenAddActivity
}) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const yr = parseInt(currentDate.slice(0, 4), 10);
    return isNaN(yr) ? 2026 : yr;
  });
  const [selectedMonth, setSelectedMonth] = useState<number>(() => {
    const mo = parseInt(currentDate.slice(5, 7), 10);
    return isNaN(mo) ? 10 : mo;
  });

  const [calendarGrid, setCalendarGrid] = useState<MonthlyDayData[]>([]);
  const [kpi, setKpi] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Selected date modal state
  const [modalDate, setModalDate] = useState<string | null>(null);
  const [modalActivities, setModalActivities] = useState<Activity[]>([]);
  const [modalLoading, setModalLoading] = useState<boolean>(false);

  const loadCalendarData = async () => {
    try {
      setLoading(true);
      const res = await api.getMonthlyAnalytics(selectedYear, selectedMonth);
      setCalendarGrid(res.calendarGrid || []);
      setKpi(res.kpi || null);
    } catch (err) {
      console.error('Error loading calendar data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCalendarData();
  }, [selectedYear, selectedMonth]);

  const handlePrevMonth = () => {
    if (selectedMonth === 1) {
      setSelectedMonth(12);
      setSelectedYear((prev) => prev - 1);
    } else {
      setSelectedMonth((prev) => prev - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 12) {
      setSelectedMonth(1);
      setSelectedYear((prev) => prev + 1);
    } else {
      setSelectedMonth((prev) => prev + 1);
    }
  };

  const handleDateClick = async (dateStr: string) => {
    setModalDate(dateStr);
    try {
      setModalLoading(true);
      const res = await api.getActivities({ date: dateStr });
      setModalActivities(res.activities || []);
    } catch (err) {
      console.error('Error loading day activities:', err);
    } finally {
      setModalLoading(false);
    }
  };

  const handleUpdateModalStatus = async (activityId: string, status: string) => {
    try {
      await api.updateActivityStatus(activityId, status);
      // Reload modal list and calendar
      const res = await api.getActivities({ date: modalDate! });
      setModalActivities(res.activities || []);
      loadCalendarData();
    } catch (err: any) {
      alert(`Gagal memperbarui status: ${err.message}`);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Controller */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Kalender Aktivitas Bulanan</h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Tinjauan performa dan status penyelesaian kegiatan harian Anda sepanjang bulan.
          </p>
        </div>

        {/* Month & Year Selectors */}
        <div className="flex items-center gap-2 bg-white p-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <button
            onClick={handlePrevMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Bulan Sebelumnya"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(parseInt(e.target.value, 10))}
            className="px-2 py-1 font-bold text-slate-800 text-sm border-0 focus:outline-none cursor-pointer bg-transparent"
            aria-label="Pilih Bulan"
          >
            {INDONESIAN_MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>
                {name}
              </option>
            ))}
          </select>

          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="px-2 py-1 font-bold text-slate-800 text-sm border-0 focus:outline-none cursor-pointer bg-transparent font-mono"
            aria-label="Pilih Tahun"
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
              <option key={yr} value={yr}>
                {yr} {yr === 2028 ? '(Kabisat)' : ''}
              </option>
            ))}
          </select>

          <button
            onClick={handleNextMonth}
            className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
            aria-label="Bulan Berikutnya"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Monthly KPIs */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Total Aktivitas</span>
            <span className="text-2xl font-extrabold text-slate-900 font-mono mt-1 block">
              {kpi.totalScheduled}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 block">Total Selesai</span>
            <span className="text-2xl font-extrabold text-emerald-600 font-mono mt-1 block">
              {kpi.completed}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-blue-200 bg-blue-50/30 shadow-xs">
            <span className="text-xs font-semibold text-blue-700 block">% Capaian Bulan</span>
            <span className="text-2xl font-extrabold text-blue-700 font-mono mt-1 block">
              {kpi.percentageDisplay}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-600 block">Rata-rata Hari Aktif</span>
            <span className="text-2xl font-extrabold text-indigo-600 font-mono mt-1 block">
              {kpi.averageDailyProgressDisplay}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block">Hari Ada Kegiatan</span>
            <span className="text-2xl font-extrabold text-slate-800 font-mono mt-1 block">
              {kpi.activeDaysCount}
            </span>
          </div>

          <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-400 block">Hari Kosong</span>
            <span className="text-2xl font-extrabold text-slate-500 font-mono mt-1 block">
              {kpi.inactiveDaysCount}
            </span>
          </div>
        </div>
      )}

      {/* Color Code Legend */}
      <div className="flex items-center gap-4 text-xs font-medium text-slate-600 flex-wrap bg-white p-3 rounded-xl border border-slate-200">
        <span className="font-bold text-slate-700">Keterangan Status:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block"></span>
          <span>Hijau: Selesai 100%</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-amber-400 inline-block"></span>
          <span>Kuning: Selesai Sebagian</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-rose-500 inline-block"></span>
          <span>Merah: Terjadwal Belum Ada Selesai (0%)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-3 h-3 rounded-full bg-slate-200 inline-block"></span>
          <span>Abu-abu: Tidak Ada Aktivitas</span>
        </div>
      </div>

      {/* 7-Column Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Day Header Row */}
        <div className="grid grid-cols-7 border-b border-slate-200 bg-slate-50/80 text-center font-bold text-xs sm:text-sm text-slate-700 py-3">
          {INDONESIAN_DAY_NAMES.map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>

        {/* Days Matrix */}
        {loading ? (
          <div className="py-24 text-center text-slate-400 text-sm">
            <div className="inline-block w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-2 font-medium">Menyusun kalender...</p>
          </div>
        ) : (
          <div className="grid grid-cols-7 divide-x divide-y divide-slate-100">
            {calendarGrid.map((dayData, index) => {
              const isToday = dayData.date === new Date().toISOString().slice(0, 10);
              const isSelected = dayData.date === currentDate;

              // Color classes
              let badgeColor = 'bg-slate-100 text-slate-400';
              let borderColor = '';
              if (dayData.statusColor === 'green') {
                badgeColor = 'bg-emerald-100 text-emerald-800 font-semibold';
                borderColor = 'border-l-4 border-l-emerald-500';
              } else if (dayData.statusColor === 'yellow') {
                badgeColor = 'bg-amber-100 text-amber-800 font-semibold';
                borderColor = 'border-l-4 border-l-amber-400';
              } else if (dayData.statusColor === 'red') {
                badgeColor = 'bg-rose-100 text-rose-800 font-semibold';
                borderColor = 'border-l-4 border-l-rose-500';
              }

              return (
                <div
                  key={`${dayData.date}-${index}`}
                  onClick={() => handleDateClick(dayData.date)}
                  className={`min-h-[90px] sm:min-h-[110px] p-2 sm:p-2.5 transition cursor-pointer flex flex-col justify-between ${borderColor} ${
                    !dayData.isCurrentMonth
                      ? 'bg-slate-50/50 text-slate-400 opacity-60'
                      : 'hover:bg-blue-50/40 bg-white'
                  } ${isSelected ? 'ring-2 ring-blue-600 ring-inset' : ''}`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`text-xs sm:text-sm font-bold w-6 h-6 rounded-full flex items-center justify-center ${
                        isToday
                          ? 'bg-blue-600 text-white'
                          : dayData.isCurrentMonth
                          ? 'text-slate-800'
                          : 'text-slate-400'
                      }`}
                    >
                      {dayData.dayNumber}
                    </span>

                    {dayData.totalScheduled > 0 && (
                      <span className="text-[10px] sm:text-xs font-mono font-bold text-slate-500">
                        {dayData.completed}/{dayData.totalScheduled}
                      </span>
                    )}
                  </div>

                  {/* Status Indicator */}
                  <div className="mt-2">
                    {dayData.totalScheduled > 0 ? (
                      <div className={`text-[10px] sm:text-xs px-1.5 py-0.5 rounded text-center truncate ${badgeColor}`}>
                        {dayData.completed === dayData.totalScheduled
                          ? '100% Selesai'
                          : `${Math.round((dayData.completed / dayData.totalScheduled) * 100)}%`}
                      </div>
                    ) : (
                      <div className="text-[10px] text-slate-300 text-center py-0.5 font-medium">
                        Kosong
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DATE DETAILS MODAL */}
      {modalDate && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 animate-in fade-in"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 max-h-[85vh] flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <CalendarIcon className="w-5 h-5 text-blue-600" />
                  Rincian Aktivitas: {modalDate}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  {modalActivities.length} kegiatan tercatat pada tanggal ini.
                </p>
              </div>
              <button
                onClick={() => setModalDate(null)}
                className="text-slate-400 hover:text-slate-600 text-sm font-semibold p-1"
                aria-label="Tutup Modal"
              >
                ✕
              </button>
            </div>

            <div className="overflow-y-auto py-3 space-y-2.5 flex-1 pr-1">
              {modalLoading ? (
                <div className="py-8 text-center text-slate-400 text-xs">Memuat aktivitas...</div>
              ) : modalActivities.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-xs text-slate-500 font-medium">
                    Tidak ada kegiatan terjadwal di tanggal {modalDate}.
                  </p>
                </div>
              ) : (
                modalActivities.map((act) => (
                  <div
                    key={act.id}
                    className="p-3 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col gap-2"
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <span
                          className={`font-semibold text-sm ${
                            act.status === 'Selesai' ? 'line-through text-slate-400' : 'text-slate-900'
                          }`}
                        >
                          {act.title}
                        </span>
                        <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5">
                          <span>{act.category}</span>
                          {act.start_time && (
                            <span className="font-mono">
                              • {act.start_time} {act.end_time ? `- ${act.end_time}` : ''}
                            </span>
                          )}
                        </div>
                      </div>

                      <span
                        className={`text-xs px-2 py-0.5 rounded font-bold ${
                          act.status === 'Selesai'
                            ? 'bg-emerald-100 text-emerald-800'
                            : act.status === 'Sedang Berjalan'
                            ? 'bg-amber-100 text-amber-800'
                            : act.status === 'Dilewati'
                            ? 'bg-rose-100 text-rose-800'
                            : 'bg-slate-200 text-slate-700'
                        }`}
                      >
                        {act.status}
                      </span>
                    </div>

                    {/* Quick status buttons */}
                    <div className="flex items-center gap-1.5 pt-1 border-t border-slate-200/60 justify-end">
                      <button
                        onClick={() => handleUpdateModalStatus(act.id, 'Selesai')}
                        className="px-2 py-0.5 text-xs rounded bg-white border border-slate-200 text-emerald-700 hover:bg-emerald-50 font-medium"
                      >
                        Selesai
                      </button>
                      <button
                        onClick={() => handleUpdateModalStatus(act.id, 'Sedang Berjalan')}
                        className="px-2 py-0.5 text-xs rounded bg-white border border-slate-200 text-amber-700 hover:bg-amber-50 font-medium"
                      >
                        Berjalan
                      </button>
                      <button
                        onClick={() => handleUpdateModalStatus(act.id, 'Belum Dimulai')}
                        className="px-2 py-0.5 text-xs rounded bg-white border border-slate-200 text-slate-600 hover:bg-slate-100 font-medium"
                      >
                        Belum
                      </button>
                      <button
                        onClick={() => handleUpdateModalStatus(act.id, 'Dilewati')}
                        className="px-2 py-0.5 text-xs rounded bg-white border border-slate-200 text-rose-600 hover:bg-rose-50 font-medium"
                      >
                        Lewati
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={() => {
                  onSelectDate(modalDate);
                  setModalDate(null);
                  onOpenAddActivity();
                }}
                className="px-3.5 py-2 bg-blue-600 text-white rounded-lg text-xs font-semibold hover:bg-blue-700 transition flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Tambah Aktivitas di Tanggal Ini
              </button>

              <button
                onClick={() => {
                  onSelectDate(modalDate);
                  setModalDate(null);
                }}
                className="px-3.5 py-2 bg-slate-100 text-slate-700 rounded-lg text-xs font-semibold hover:bg-slate-200 transition"
              >
                Pilih Jadi Tanggal Aktif
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
