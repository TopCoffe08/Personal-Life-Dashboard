import React from 'react';
import {
  HelpCircle,
  CheckCircle2,
  Calendar,
  Flame,
  Target,
  BookOpen,
  Download,
  ShieldCheck,
  Calculator,
  Compass
} from 'lucide-react';

export const UserGuideView: React.FC = () => {
  return (
    <div className="space-y-6 pb-16 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <HelpCircle className="w-6 h-6 text-blue-600" />
          Panduan Pengguna & Dokumentasi Teknis
        </h1>
        <p className="text-slate-500 text-sm mt-0.5">
          Petunjuk komprehensif penggunaan seluruh modul, aturan perhitungan metrik, dan proteksi privasi.
        </p>
      </div>

      {/* Guide Cards */}
      <div className="space-y-4">
        {/* Section 1: Cara Memulai */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
            <Compass className="w-5 h-5" />
            <h2>1. Panduan Mulai Cepat (Quick Start)</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Personal Life Dashboard dirancang untuk menyederhanakan perencanaan hidup pribadi Anda tanpa kerumitan rumus spreadsheet.
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-1.5">
            <li>
              <strong>Pilih Tanggal:</strong> Gunakan kontrol navigasi tanggal di bilah atas untuk berpindah antara kemarin, hari ini, besok, atau memilih tanggal spesifik.
            </li>
            <li>
              <strong>Dashboard:</strong> Menampilkan ringkasan instan aktivitas terjadwal hari ini, status kebiasaan, target prioritas, dan refleksi jurnal.
            </li>
            <li>
              <strong>Terapkan Rutinitas Standar:</strong> Di modul <em>Rutinitas</em>, Anda dapat menekan tombol "Terapkan Rutinitas Standar" untuk memilih 12 template rutinitas teruji dengan 1 klik.
            </li>
          </ul>
        </div>

        {/* Section 2: Modul Rutinitas */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-emerald-700 font-bold text-base">
            <CheckCircle2 className="w-5 h-5" />
            <h2>2. Modul Rutinitas & Manajemen Aktivitas</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Setiap aktivitas menyimpan jam mulai, jam selesai, judul, kategori, prioritas (Tinggi, Sedang, Rendah), status, dan catatan.
          </p>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs pt-1">
            <div className="p-2.5 rounded-lg bg-emerald-50 text-emerald-800 border border-emerald-200">
              <span className="font-bold block">Selesai:</span> Menambah persentase capaian.
            </div>
            <div className="p-2.5 rounded-lg bg-amber-50 text-amber-800 border border-amber-200">
              <span className="font-bold block">Sedang Berjalan:</span> Dalam proses pengerjaan.
            </div>
            <div className="p-2.5 rounded-lg bg-slate-100 text-slate-700 border border-slate-200">
              <span className="font-bold block">Belum Dimulai:</span> Masuk dalam penyebut total.
            </div>
            <div className="p-2.5 rounded-lg bg-rose-50 text-rose-800 border border-rose-200">
              <span className="font-bold block">Dilewati:</span> Tidak dihitung selesai, tidak dihitung berhasil.
            </div>
          </div>
        </div>

        {/* Section 3: Kalender & Aturan Warna */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-indigo-700 font-bold text-base">
            <Calendar className="w-5 h-5" />
            <h2>3. Kalender Bulanan & Standar Warna</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Kalender menggunakan 7 kolom (Senin sampai Minggu) dan mendukung penuh tahun kabisat (misalnya 29 Februari 2028).
          </p>
          <div className="space-y-1.5 text-xs text-slate-600">
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 shrink-0"></span>
              <span><strong>Hijau:</strong> Seluruh aktivitas terjadwal pada hari tersebut telah selesai (100%).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-amber-400 shrink-0"></span>
              <span><strong>Kuning:</strong> Sebagian aktivitas selesai (&gt; 0% dan &lt; 100%).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-rose-500 shrink-0"></span>
              <span><strong>Merah:</strong> Terdapat aktivitas terjadwal namun belum ada yang selesai (0%).</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3.5 h-3.5 rounded-full bg-slate-200 shrink-0"></span>
              <span><strong>Abu-abu:</strong> Tidak ada kegiatan terjadwal pada tanggal tersebut.</span>
            </div>
          </div>
        </div>

        {/* Section 4: Habit Tracker */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-orange-600 font-bold text-base">
            <Flame className="w-5 h-5" />
            <h2>4. Habit Tracker & Perhitungan Streak</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Memantau konsistensi pembentukan kebiasaan harian dan mingguan tanpa duplikasi pencatatan.
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li><strong>Current Streak:</strong> Dihitung mundur dari hari ini atau kemarin berdasarkan hari-hari sukses berturut-turut.</li>
            <li><strong>Longest Streak:</strong> Rekor rekor hari berturut-turut terpanjang yang pernah Anda capai.</li>
            <li><strong>Tanpa Penalti Beban:</strong> Hari di mana kebiasaan memang tidak dijadwalkan tidak dihitung sebagai kegagalan.</li>
          </ul>
        </div>

        {/* Section 5: Target Pribadi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-purple-700 font-bold text-base">
            <Target className="w-5 h-5" />
            <h2>5. Target Kuantitatif vs Kualitatif</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sistem mendukung dua jenis target:
          </p>
          <ul className="list-disc pl-5 text-xs sm:text-sm text-slate-600 space-y-1">
            <li><strong>Target Kuantitatif:</strong> Memiliki nilai target dan satuan (misal: 12 Buku, 50 Juta Rupiah). Progres dihitung otomatis <code>(Nilai Aktual / Nilai Target) × 100%</code>.</li>
            <li><strong>Target Kualitatif:</strong> Progres ditentukan melalui slider / persentase manual (misal: 75% selesai).</li>
            <li><strong>Peringatan Tenggat:</strong> Ditandai dengan warna khusus bila tenggat waktu tersisa kurang dari 7 hari atau sudah terlampaui.</li>
          </ul>
        </div>

        {/* Section 6: Jurnal & Refleksi */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-blue-700 font-bold text-base">
            <BookOpen className="w-5 h-5" />
            <h2>6. Jurnal Refleksi & Privasi Data</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Setiap hari Anda dapat mencatat skala mood (1-5), rasa syukur (gratitude), pencapaian hari ini (wins), kendala, pelajaran hidup, dan fokus esok hari.
            Catatan jurnal merupakan data pribadi yang dilindungi dengan isolasi ketat antar pengguna di database server.
          </p>
        </div>

        {/* Section 7: Aturan Perhitungan Matematika */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-800 font-bold text-base">
            <Calculator className="w-5 h-5 text-slate-600" />
            <h2>7. Definisi & Aturan Perhitungan Metrik</h2>
          </div>
          <div className="space-y-2 text-xs sm:text-sm text-slate-600">
            <p>
              <strong>Aturan Pembagian Nol:</strong> Jika tidak ada kegiatan terjadwal, sistem menampilkan tanda <code>—</code> bukan 0% yang menyesatkan.
            </p>
            <p>
              <strong>Rata-rata Hari Aktif:</strong> Dihitung hanya dari hari-hari yang memiliki setidaknya 1 kegiatan terjadwal, sehingga hari libur tanpa jadwal tidak merusak rata-rata capaian Anda.
            </p>
          </div>
        </div>

        {/* Section 8: Keamanan & Ekspor */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-xs space-y-3">
          <div className="flex items-center gap-2 text-slate-900 font-bold text-base">
            <ShieldCheck className="w-5 h-5 text-emerald-600" />
            <h2>8. Keamanan Akun & Portabilitas Data</h2>
          </div>
          <p className="text-sm text-slate-600 leading-relaxed">
            Sistem menerapkan password hashing berbasis Scrypt dengan salt acak 16-byte, proteksi timing-safe attack, dan otorisasi ketat di setiap query database. Anda dapat mengekspor seluruh arsip data pribadi Anda kapan saja dalam format <strong>JSON</strong> atau <strong>CSV</strong> di menu Pengaturan.
          </p>
        </div>
      </div>
    </div>
  );
};
