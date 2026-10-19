import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { AnnualMonthSummary, AnnualKPI } from '../utils/calculations';
import {
  BarChart3,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Layers,
  TrendingUp
} from 'lucide-react';

interface AnnualSummaryViewProps {
  currentDate: string;
}

export const AnnualSummaryView: React.FC<AnnualSummaryViewProps> = ({ currentDate }) => {
  const [selectedYear, setSelectedYear] = useState<number>(() => {
    const yr = parseInt(currentDate.slice(0, 4), 10);
    return isNaN(yr) ? 2026 : yr;
  });

  const [monthlyBreakdown, setMonthlyBreakdown] = useState<AnnualMonthSummary[]>([]);
  const [kpi, setKpi] = useState<AnnualKPI | null>(null);
  const [categoryCounts, setCategoryCounts] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const loadAnnualData = async () => {
    try {
      setLoading(true);
      const res = await api.getAnnualAnalytics(selectedYear);
      setMonthlyBreakdown(res.monthlyBreakdown || []);
      setKpi(res.kpi || null);
      setCategoryCounts(res.categoryCounts || []);
    } catch (err) {
      console.error('Error loading annual summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAnnualData();
  }, [selectedYear]);

  return (
    <div className="space-y-6 pb-12">
      {/* Header & Year Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
            Ringkasan & Analisis Tahunan
          </h1>
          <p className="text-slate-500 text-sm mt-0.5">
            Evaluasi menyeluruh performa pelaksanaan rutinitas dan aktivitas Anda sepanjang tahun{' '}
            <span className="font-semibold text-slate-800">{selectedYear}</span>.
          </p>
        </div>

        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-xl border border-slate-200 shadow-xs self-start sm:self-auto">
          <Calendar className="w-4 h-4 text-blue-600" />
          <span className="text-xs font-semibold text-slate-600">Tahun Analisis:</span>
          <select
            value={selectedYear}
            onChange={(e) => setSelectedYear(parseInt(e.target.value, 10))}
            className="font-bold text-sm text-slate-800 bg-transparent border-0 focus:outline-none cursor-pointer font-mono"
            aria-label="Pilih Tahun Analisis"
          >
            {[2024, 2025, 2026, 2027, 2028, 2029, 2030].map((yr) => (
              <option key={yr} value={yr}>
                {yr}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* KPI Highlight Cards */}
      {kpi && (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 sm:gap-4">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-500 block uppercase tracking-wider">
              Total Tercatat
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-mono mt-1 block">
              {kpi.totalScheduled}
            </span>
            <span className="text-[11px] text-slate-400">selama {selectedYear}</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-emerald-600 block uppercase tracking-wider">
              Total Selesai
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-emerald-600 font-mono mt-1 block">
              {kpi.completed}
            </span>
            <span className="text-[11px] text-slate-400">kegiatan tuntas</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-blue-200 bg-blue-50/40 shadow-xs">
            <span className="text-xs font-semibold text-blue-700 block uppercase tracking-wider">
              % Capaian Tahunan
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-blue-700 font-mono mt-1 block">
              {kpi.percentageDisplay}
            </span>
            <span className="text-[11px] text-blue-600/80">sepanjang tahun</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <span className="text-xs font-semibold text-slate-600 block uppercase tracking-wider">
              Rata-rata Hari Aktif
            </span>
            <span className="text-2xl sm:text-3xl font-extrabold text-indigo-600 font-mono mt-1 block">
              {kpi.averageDailyProgressDisplay}
            </span>
            <span className="text-[11px] text-slate-400">pada hari tercatat</span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1 text-xs font-semibold text-amber-600 uppercase tracking-wider">
              <Trophy className="w-3.5 h-3.5" />
              <span>Bulan Terbaik</span>
            </div>
            <span className="text-lg font-bold text-slate-800 mt-1 block truncate">
              {kpi.bestMonth ? kpi.bestMonth.monthName : '—'}
            </span>
            <span className="text-xs font-mono font-bold text-emerald-600">
              {kpi.bestMonth ? `${kpi.bestMonth.percentage}%` : '—'}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-xs">
            <div className="flex items-center gap-1 text-xs font-semibold text-slate-500 uppercase tracking-wider">
              <AlertTriangle className="w-3.5 h-3.5 text-rose-500" />
              <span>Bulan Terendah</span>
            </div>
            <span className="text-lg font-bold text-slate-800 mt-1 block truncate">
              {kpi.worstMonth ? kpi.worstMonth.monthName : '—'}
            </span>
            <span className="text-xs font-mono font-bold text-rose-600">
              {kpi.worstMonth ? `${kpi.worstMonth.percentage}%` : '—'}
            </span>
          </div>
        </div>
      )}

      {/* Visual Chart: Monthly Completion Bars */}
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-blue-600" />
            <h2 className="font-bold text-slate-900 text-base">
              Grafik Persentase Capaian per Bulan ({selectedYear})
            </h2>
          </div>
          <span className="text-xs text-slate-500">Januari - Desember</span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-slate-400 text-sm">Menyiapkan grafik...</div>
        ) : (
          <div className="pt-6 pb-2">
            <div className="grid grid-cols-12 gap-2 sm:gap-4 items-end h-48 border-b border-slate-200 pb-2">
              {monthlyBreakdown.map((m) => {
                const heightPercent = m.percentage !== null ? m.percentage : 0;
                const isBest = kpi?.bestMonth?.monthName === m.monthName && heightPercent > 0;
                return (
                  <div key={m.month} className="flex flex-col items-center h-full justify-end group">
                    <span className="text-[10px] font-mono text-slate-500 mb-1 opacity-0 group-hover:opacity-100 transition">
                      {m.percentageDisplay}
                    </span>
                    <div
                      className={`w-full max-w-[28px] rounded-t-md transition-all duration-500 ${
                        isBest
                          ? 'bg-emerald-500'
                          : heightPercent >= 75
                          ? 'bg-blue-600'
                          : heightPercent >= 40
                          ? 'bg-indigo-500'
                          : heightPercent > 0
                          ? 'bg-amber-400'
                          : 'bg-slate-200'
                      }`}
                      style={{ height: `${Math.max(4, (heightPercent / 100) * 160)}px` }}
                      title={`${m.monthName}: ${m.percentageDisplay} (${m.completed}/${m.totalScheduled})`}
                    ></div>
                    <span className="text-[11px] font-semibold text-slate-600 mt-2 truncate w-full text-center">
                      {m.monthName.slice(0, 3)}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex justify-between items-center text-xs text-slate-400 mt-2 font-mono">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>
        )}
      </div>

      {/* Comprehensive Table: Januari - Desember */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-slate-200 bg-slate-50/60">
          <h2 className="font-bold text-slate-900 text-sm">Tabel Rincian Aktivitas Bulanan</h2>
          <p className="text-xs text-slate-500">
            Perbandingan total terjadwal, selesai, sedang berjalan, belum dimulai, dan dilewati.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs sm:text-sm">
            <thead className="bg-slate-100/80 text-slate-700 font-bold uppercase text-[11px] tracking-wider border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Bulan</th>
                <th className="py-3 px-3 text-right">Total Aktivitas</th>
                <th className="py-3 px-3 text-right text-emerald-700">Selesai</th>
                <th className="py-3 px-3 text-right text-amber-700">Berjalan</th>
                <th className="py-3 px-3 text-right text-slate-700">Belum</th>
                <th className="py-3 px-3 text-right text-rose-700">Dilewati</th>
                <th className="py-3 px-4 text-right text-blue-700 font-extrabold">% Capaian</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {monthlyBreakdown.map((row) => (
                <tr key={row.month} className="hover:bg-slate-50/70 transition">
                  <td className="py-3 px-4 font-semibold text-slate-900">{row.monthName}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-700">{row.totalScheduled}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600 font-semibold">{row.completed}</td>
                  <td className="py-3 px-3 text-right font-mono text-amber-600">{row.inProgress}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-500">{row.notStarted}</td>
                  <td className="py-3 px-3 text-right font-mono text-rose-500">{row.skipped}</td>
                  <td className="py-3 px-4 text-right font-mono font-bold text-blue-700">
                    {row.percentageDisplay}
                  </td>
                </tr>
              ))}
            </tbody>
            {kpi && (
              <tfoot className="bg-slate-50 font-bold border-t-2 border-slate-200 text-slate-900">
                <tr>
                  <td className="py-3 px-4">TOTAL TAHUNAN</td>
                  <td className="py-3 px-3 text-right font-mono">{kpi.totalScheduled}</td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-600">{kpi.completed}</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                  <td className="py-3 px-3 text-right font-mono text-slate-400">—</td>
                  <td className="py-3 px-4 text-right font-mono text-blue-700">{kpi.percentageDisplay}</td>
                </tr>
              </tfoot>
            )}
          </table>
        </div>
      </div>

      {/* Category breakdown for the year */}
      {categoryCounts.length > 0 && (
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-xs">
          <div className="flex items-center gap-2 mb-4">
            <Layers className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-base">Rekap Aktivitas Berdasarkan Kategori</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryCounts.map((cat: any) => {
              const catPercent = cat.total > 0 ? Math.round((cat.completed / cat.total) * 100) : 0;
              return (
                <div key={cat.category} className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                  <div className="flex justify-between items-center text-xs">
                    <span className="font-bold text-slate-800">{cat.category}</span>
                    <span className="font-mono text-slate-600">
                      {cat.completed}/{cat.total}
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-slate-200 rounded-full h-2 overflow-hidden">
                    <div
                      className="bg-indigo-600 h-full rounded-full transition-all"
                      style={{ width: `${catPercent}%` }}
                    ></div>
                  </div>
                  <div className="mt-1 text-[11px] text-right text-slate-500 font-mono font-medium">
                    {catPercent}% selesai
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
