import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const DATA_DIR = path.resolve(process.cwd(), 'data');
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

const DB_PATH = path.join(DATA_DIR, 'dashboard.sqlite');
export const db = new DatabaseSync(DB_PATH);

// Enable WAL mode for high concurrency & reliability
db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');

export function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      salt TEXT NOT NULL,
      reset_token TEXT,
      reset_expires INTEGER,
      timezone TEXT DEFAULT 'Asia/Makassar',
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sessions (
      token TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS activities (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      start_time TEXT,
      end_time TEXT,
      title TEXT NOT NULL,
      category TEXT NOT NULL,
      priority TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      recurrence_group TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_activities_user_date ON activities (user_id, date);

    CREATE TABLE IF NOT EXISTS habits (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      frequency TEXT NOT NULL,
      weekly_target INTEGER DEFAULT 7,
      start_date TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_habits_user ON habits (user_id);

    CREATE TABLE IF NOT EXISTS habit_logs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      habit_id TEXT NOT NULL,
      date TEXT NOT NULL,
      status TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, habit_id, date),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
      FOREIGN KEY (habit_id) REFERENCES habits (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_habit_logs_lookup ON habit_logs (user_id, date);

    CREATE TABLE IF NOT EXISTS goals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      category TEXT NOT NULL,
      period TEXT NOT NULL,
      start_date TEXT,
      deadline TEXT,
      target_metric TEXT,
      target_value REAL DEFAULT 0,
      current_value REAL DEFAULT 0,
      progress REAL DEFAULT 0,
      status TEXT NOT NULL,
      evaluation_notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_goals_user ON goals (user_id);

    CREATE TABLE IF NOT EXISTS journals (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      date TEXT NOT NULL,
      mood INTEGER DEFAULT 3,
      achievements TEXT,
      gratitude TEXT,
      obstacles TEXT,
      lessons TEXT,
      tomorrow_focus TEXT,
      notes TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      UNIQUE(user_id, date),
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
    CREATE INDEX IF NOT EXISTS idx_journals_user_date ON journals (user_id, date);

    CREATE TABLE IF NOT EXISTS user_settings (
      user_id TEXT PRIMARY KEY,
      activity_categories TEXT NOT NULL,
      goal_categories TEXT NOT NULL,
      first_day_of_week TEXT DEFAULT 'Senin',
      timezone TEXT DEFAULT 'Asia/Makassar',
      theme TEXT DEFAULT 'light',
      updated_at TEXT NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
    );
  `);

  seedDemoUserIfMissing();
}

export function hashPassword(password: string): { salt: string; hash: string } {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.scryptSync(password, salt, 64).toString('hex');
  return { salt, hash };
}

export function verifyPassword(password: string, expectedHash: string, salt: string): boolean {
  const derived = crypto.scryptSync(password, salt, 64);
  const expectedBuf = Buffer.from(expectedHash, 'hex');
  if (derived.length !== expectedBuf.length) return false;
  return crypto.timingSafeEqual(derived, expectedBuf);
}

export const DEFAULT_ACTIVITY_CATEGORIES = [
  'Pribadi',
  'Kesehatan',
  'Pekerjaan',
  'Pengembangan Diri',
  'Keluarga dan Sosial',
  'Keuangan',
  'Evaluasi'
];

export const DEFAULT_GOAL_CATEGORIES = [
  'Karir & Pekerjaan',
  'Kesehatan & Kebugaran',
  'Keuangan',
  'Pendidikan & Skill',
  'Keluarga & Relasi',
  'Spiritual & Mindset'
];

function seedDemoUserIfMissing() {
  const checkStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const existing = checkStmt.get('demo@example.com') as { id: string } | undefined;
  if (existing) return;

  const now = new Date().toISOString();
  const userId = 'usr_demo_001';
  const { salt, hash } = hashPassword('Password123!');

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, salt, timezone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertUser.run(userId, 'Pengguna Demo', 'demo@example.com', hash, salt, 'Asia/Makassar', now, now);

  const insertSettings = db.prepare(`
    INSERT INTO user_settings (user_id, activity_categories, goal_categories, first_day_of_week, timezone, theme, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  insertSettings.run(
    userId,
    JSON.stringify(DEFAULT_ACTIVITY_CATEGORIES),
    JSON.stringify(DEFAULT_GOAL_CATEGORIES),
    'Senin',
    'Asia/Makassar',
    'light',
    now
  );

  // Seed activities for 2026-10-18, 2026-10-19, and 2026-10-20
  const insertAct = db.prepare(`
    INSERT INTO activities (id, user_id, date, start_time, end_time, title, category, priority, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoActivities = [
    { id: 'act_1', date: '2026-10-19', start: '05:30', end: '06:00', title: 'Bangun tidur dan merapikan tempat tidur', cat: 'Kesehatan', prio: 'Sedang', stat: 'Selesai', notes: 'Minum 2 gelas air hangat' },
    { id: 'act_2', date: '2026-10-19', start: '06:00', end: '06:45', title: 'Olahraga pagi / peregangan 30 menit', cat: 'Kesehatan', prio: 'Tinggi', stat: 'Selesai', notes: 'Jogging santai keliling kompleks' },
    { id: 'act_3', date: '2026-10-19', start: '08:30', end: '11:30', title: 'Menyelesaikan deliverable utama sprint', cat: 'Pekerjaan', prio: 'Tinggi', stat: 'Selesai', notes: 'Fokus deep work tanpa distraksi' },
    { id: 'act_4', date: '2026-10-19', start: '13:30', end: '15:00', title: 'Review laporan keuangan bulanan', cat: 'Keuangan', prio: 'Sedang', stat: 'Sedang Berjalan', notes: 'Periksa alokasi tabungan investasi' },
    { id: 'act_5', date: '2026-10-19', start: '16:00', end: '17:00', title: 'Belajar kursus arsitektur sistem cloud', cat: 'Pengembangan Diri', prio: 'Sedang', stat: 'Belum Dimulai', notes: 'Modul ke-4 microservices' },
    { id: 'act_6', date: '2026-10-19', start: '20:30', end: '21:00', title: 'Evaluasi hari ini dan rencana besok', cat: 'Evaluasi', prio: 'Tinggi', stat: 'Belum Dimulai', notes: 'Tulis jurnal refleksi harian' },

    // Yesterday: 2026-10-18 (100% completed)
    { id: 'act_y1', date: '2026-10-18', start: '06:00', end: '07:00', title: 'Olahraga lari 5km', cat: 'Kesehatan', prio: 'Tinggi', stat: 'Selesai', notes: 'Target pace 6:00 tercapai' },
    { id: 'act_y2', date: '2026-10-18', start: '09:00', end: '11:00', title: 'Merapikan dokumen kerja & arsip mingguan', cat: 'Pekerjaan', prio: 'Sedang', stat: 'Selesai', notes: 'Selesai tepat waktu' },
    { id: 'act_y3', date: '2026-10-18', start: '19:30', end: '20:30', title: 'Waktu berkualitas bersama keluarga', cat: 'Keluarga dan Sosial', prio: 'Tinggi', stat: 'Selesai', notes: 'Makan malam santai' }
  ];

  for (const a of demoActivities) {
    insertAct.run(a.id, userId, a.date, a.start, a.end, a.title, a.cat, a.prio, a.stat, a.notes, now, now);
  }

  // Seed Habits
  const insertHabit = db.prepare(`
    INSERT INTO habits (id, user_id, name, category, frequency, weekly_target, start_date, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const habits = [
    { id: 'hab_1', name: 'Minum Air 2.5 Liter / Hari', cat: 'Kesehatan', freq: 'Harian', target: 7, start: '2026-10-01' },
    { id: 'hab_2', name: 'Membaca Buku 20 Halaman', cat: 'Pengembangan Diri', freq: 'Harian', target: 7, start: '2026-10-01' },
    { id: 'hab_3', name: 'Olahraga Minimal 30 Menit', cat: 'Kesehatan', freq: 'Harian', target: 5, start: '2026-10-05' },
    { id: 'hab_4', name: 'Menulis Refleksi & Jurnal Harian', cat: 'Pribadi', freq: 'Harian', target: 7, start: '2026-10-01' }
  ];

  for (const h of habits) {
    insertHabit.run(h.id, userId, h.name, h.cat, h.freq, h.target, h.start, 1, now, now);
  }

  // Seed Habit logs for streak
  const insertLog = db.prepare(`
    INSERT INTO habit_logs (id, user_id, habit_id, date, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const datesToLog = ['2026-10-16', '2026-10-17', '2026-10-18', '2026-10-19'];
  let logCounter = 1;
  for (const d of datesToLog) {
    for (const h of habits) {
      insertLog.run(`hlog_${logCounter++}`, userId, h.id, d, 'Selesai', 'Tercapai konsisten', now, now);
    }
  }

  // Seed Goals
  const insertGoal = db.prepare(`
    INSERT INTO goals (id, user_id, title, description, category, period, start_date, deadline, target_metric, target_value, current_value, progress, status, evaluation_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const demoGoals = [
    {
      id: 'goal_1',
      title: 'Membaca 12 Buku Pengembangan Diri & Bisnis',
      desc: 'Meningkatkan wawasan kepemimpinan, finansial, dan teknologi',
      cat: 'Pendidikan & Skill',
      period: 'Tahunan',
      start: '2026-01-01',
      deadline: '2026-12-31',
      metric: 'Buku',
      target: 12,
      current: 8,
      progress: 66.7,
      status: 'Berjalan',
      eval: 'Sudah menyelesaikan 8 buku sampai Oktober, on track!'
    },
    {
      id: 'goal_2',
      title: 'Mencapai Dana Darurat 6 Bulan Pengeluaran',
      desc: 'Alokasi ke instrumen pasar uang berisiko rendah dan likuid',
      cat: 'Keuangan',
      period: 'Tahunan',
      start: '2026-01-01',
      deadline: '2026-12-31',
      metric: 'Juta Rupiah',
      target: 60,
      current: 45,
      progress: 75,
      status: 'Berjalan',
      eval: 'Terkumpul 45 juta, target tersisa 15 juta'
    },
    {
      id: 'goal_3',
      title: 'Sertifikasi Professional Cloud Solution Architect',
      desc: 'Mempersiapkan materi ujian dan practice test mingguan',
      cat: 'Karir & Pekerjaan',
      period: 'Bulanan',
      start: '2026-10-01',
      deadline: '2026-10-31',
      metric: 'Persen Persiapan',
      target: 100,
      current: 80,
      progress: 80,
      status: 'Berjalan',
      eval: 'Tinggal menyelesaikan 2 set simulasi ujian akhir'
    }
  ];

  for (const g of demoGoals) {
    insertGoal.run(g.id, userId, g.title, g.desc, g.cat, g.period, g.start, g.deadline, g.metric, g.target, g.current, g.progress, g.status, g.eval, now, now);
  }

  // Seed Journal
  const insertJournal = db.prepare(`
    INSERT INTO journals (id, user_id, date, mood, achievements, gratitude, obstacles, lessons, tomorrow_focus, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insertJournal.run(
    'jrn_1',
    userId,
    '2026-10-18',
    5,
    'Menyelesaikan refactor modul dan presentasi sprint review dengan sukses.',
    'Bersyukur atas kesehatan, rekan kerja yang kooperatif, dan secangkir kopi pagi.',
    'Ada sedikit kendala jaringan saat meeting sore namun dapat diatasi cepat.',
    'Persiapan materi sebelum rapat menghemat waktu diskusi hingga 40%.',
    'Menuntaskan deliverable core API dan lari pagi 5km.',
    'Hari yang sangat memuaskan dan produktif!',
    now,
    now
  );
}
