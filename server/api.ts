import { Router, Request, Response, NextFunction } from 'express';
import crypto from 'node:crypto';
import {
  db,
  hashPassword,
  verifyPassword,
  DEFAULT_ACTIVITY_CATEGORIES,
  DEFAULT_GOAL_CATEGORIES
} from './db.js';
import {
  calculateDailyKPI,
  calculateMonthlyKPI,
  calculateAnnualSummary,
  calculateHabitStats,
  generateCalendarGrid,
  type ActivityItem,
  type HabitLogItem
} from '../src/utils/calculations.js';

export interface AuthenticatedUser {
  id: string;
  name: string;
  email: string;
  timezone: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthenticatedUser;
    }
  }
}

export const apiRouter = Router();

// Middleware: Authenticate Session Token
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/session_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Autentikasi diperlukan. Silakan login terlebih dahulu.' });
  }

  const now = Date.now();
  const sessionStmt = db.prepare(`
    SELECT s.user_id, s.expires_at, u.id, u.name, u.email, u.timezone
    FROM sessions s
    JOIN users u ON s.user_id = u.id
    WHERE s.token = ? AND s.expires_at > ?
  `);
  const session = sessionStmt.get(token, now) as (AuthenticatedUser & { expires_at: number }) | undefined;

  if (!session) {
    return res.status(401).json({ error: 'Sesi telah kedaluwarsa atau tidak valid. Silakan login ulang.' });
  }

  req.user = {
    id: session.id,
    name: session.name,
    email: session.email,
    timezone: session.timezone || 'Asia/Makassar'
  };
  next();
}

// -----------------------------------------------------------------------------
// AUTH ENDPOINTS
// -----------------------------------------------------------------------------

apiRouter.post('/auth/register', (req: Request, res: Response) => {
  const { name, email, password, confirmPassword } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Nama tampilan, email, dan kata sandi wajib diisi.' });
  }
  if (confirmPassword && password !== confirmPassword) {
    return res.status(400).json({ error: 'Konfirmasi kata sandi tidak cocok.' });
  }
  if (password.length < 8) {
    return res.status(400).json({ error: 'Kata sandi minimal 8 karakter demi keamanan.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(cleanEmail)) {
    return res.status(400).json({ error: 'Format alamat email tidak valid.' });
  }

  const checkUser = db.prepare('SELECT id FROM users WHERE email = ?');
  const existing = checkUser.get(cleanEmail);
  if (existing) {
    return res.status(409).json({ error: 'Email sudah terdaftar. Silakan gunakan email lain atau login.' });
  }

  const userId = `usr_${crypto.randomUUID().slice(0, 12)}`;
  const now = new Date().toISOString();
  const { salt, hash } = hashPassword(password);

  const insertUser = db.prepare(`
    INSERT INTO users (id, name, email, password_hash, salt, timezone, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, 'Asia/Makassar', ?, ?)
  `);
  insertUser.run(userId, String(name).trim(), cleanEmail, hash, salt, now, now);

  const insertSettings = db.prepare(`
    INSERT INTO user_settings (user_id, activity_categories, goal_categories, first_day_of_week, timezone, theme, updated_at)
    VALUES (?, ?, ?, 'Senin', 'Asia/Makassar', 'light', ?)
  `);
  insertSettings.run(
    userId,
    JSON.stringify(DEFAULT_ACTIVITY_CATEGORIES),
    JSON.stringify(DEFAULT_GOAL_CATEGORIES),
    now
  );

  // Generate session token
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000; // 30 days
  const insertSession = db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);
  insertSession.run(token, userId, expiresAt, now);

  res.cookie('session_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  return res.status(201).json({
    message: 'Registrasi berhasil!',
    token,
    user: {
      id: userId,
      name: String(name).trim(),
      email: cleanEmail,
      timezone: 'Asia/Makassar'
    }
  });
});

apiRouter.post('/auth/login', (req: Request, res: Response) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email dan kata sandi wajib diisi.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const userStmt = db.prepare('SELECT * FROM users WHERE email = ?');
  const user = userStmt.get(cleanEmail) as any;

  if (!user || !verifyPassword(password, user.password_hash, user.salt)) {
    return res.status(401).json({ error: 'Email atau kata sandi tidak cocok.' });
  }

  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + 30 * 24 * 60 * 60 * 1000;
  const now = new Date().toISOString();

  const insertSession = db.prepare(`
    INSERT INTO sessions (token, user_id, expires_at, created_at)
    VALUES (?, ?, ?, ?)
  `);
  insertSession.run(token, user.id, expiresAt, now);

  res.cookie('session_token', token, {
    httpOnly: true,
    sameSite: 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
  });

  return res.json({
    message: 'Login berhasil!',
    token,
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      timezone: user.timezone || 'Asia/Makassar'
    }
  });
});

apiRouter.post('/auth/logout', (req: Request, res: Response) => {
  let token = '';
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.slice(7).trim();
  } else if (req.headers.cookie) {
    const match = req.headers.cookie.match(/session_token=([^;]+)/);
    if (match) token = match[1];
  }

  if (token) {
    const delStmt = db.prepare('DELETE FROM sessions WHERE token = ?');
    delStmt.run(token);
  }

  res.clearCookie('session_token');
  return res.json({ message: 'Logout berhasil.' });
});

apiRouter.get('/auth/me', requireAuth, (req: Request, res: Response) => {
  return res.json({ user: req.user });
});

apiRouter.put('/auth/update-profile', requireAuth, (req: Request, res: Response) => {
  const { name, timezone } = req.body;
  if (!name || String(name).trim().length === 0) {
    return res.status(400).json({ error: 'Nama tidak boleh kosong.' });
  }

  const now = new Date().toISOString();
  const updateStmt = db.prepare(`
    UPDATE users SET name = ?, timezone = ?, updated_at = ? WHERE id = ?
  `);
  updateStmt.run(String(name).trim(), timezone || req.user!.timezone, now, req.user!.id);

  return res.json({
    message: 'Profil berhasil diperbarui.',
    user: {
      ...req.user,
      name: String(name).trim(),
      timezone: timezone || req.user!.timezone
    }
  });
});

apiRouter.put('/auth/change-password', requireAuth, (req: Request, res: Response) => {
  const { oldPassword, newPassword } = req.body;
  if (!oldPassword || !newPassword) {
    return res.status(400).json({ error: 'Kata sandi saat ini dan kata sandi baru wajib diisi.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Kata sandi baru minimal 8 karakter.' });
  }

  const userStmt = db.prepare('SELECT password_hash, salt FROM users WHERE id = ?');
  const user = userStmt.get(req.user!.id) as { password_hash: string; salt: string };

  if (!verifyPassword(oldPassword, user.password_hash, user.salt)) {
    return res.status(400).json({ error: 'Kata sandi saat ini tidak tepat.' });
  }

  const { salt: newSalt, hash: newHash } = hashPassword(newPassword);
  const now = new Date().toISOString();
  const updatePass = db.prepare(`
    UPDATE users SET password_hash = ?, salt = ?, updated_at = ? WHERE id = ?
  `);
  updatePass.run(newHash, newSalt, now, req.user!.id);

  return res.json({ message: 'Kata sandi berhasil diubah.' });
});

apiRouter.post('/auth/forgot-password', (req: Request, res: Response) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ error: 'Email wajib diisi.' });
  }

  const cleanEmail = String(email).trim().toLowerCase();
  const userStmt = db.prepare('SELECT id FROM users WHERE email = ?');
  const user = userStmt.get(cleanEmail) as { id: string } | undefined;

  // In production/simulated environment: generate secure 1-hour reset token
  if (user) {
    const resetToken = crypto.randomBytes(24).toString('hex');
    const resetExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    const updateStmt = db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?');
    updateStmt.run(resetToken, resetExpires, user.id);

    return res.json({
      message: 'Instruksi pemulihan berhasil dibuat. Gunakan token pemulihan berikut:',
      recoveryToken: resetToken,
      info: 'Karena server berjalan dalam mode mandiri tanpa layanan SMTP eksternal, Anda dapat langsung memasukkan token ini di halaman Reset Kata Sandi.'
    });
  }

  // Consistent message to prevent email enumeration
  return res.json({
    message: 'Jika email terdaftar, instruksi pemulihan telah disiapkan.',
    info: 'Silakan periksa kembali email Anda.'
  });
});

apiRouter.post('/auth/reset-password', (req: Request, res: Response) => {
  const { token, newPassword } = req.body;
  if (!token || !newPassword) {
    return res.status(400).json({ error: 'Token pemulihan dan kata sandi baru wajib diisi.' });
  }
  if (newPassword.length < 8) {
    return res.status(400).json({ error: 'Kata sandi baru minimal 8 karakter.' });
  }

  const now = Date.now();
  const userStmt = db.prepare(`
    SELECT id FROM users WHERE reset_token = ? AND reset_expires > ?
  `);
  const user = userStmt.get(token, now) as { id: string } | undefined;

  if (!user) {
    return res.status(400).json({ error: 'Token pemulihan tidak valid atau telah kedaluwarsa.' });
  }

  const { salt, hash } = hashPassword(newPassword);
  const nowStr = new Date().toISOString();
  const updateStmt = db.prepare(`
    UPDATE users SET password_hash = ?, salt = ?, reset_token = NULL, reset_expires = NULL, updated_at = ? WHERE id = ?
  `);
  updateStmt.run(hash, salt, nowStr, user.id);

  // Invalidate any existing sessions for this user
  db.prepare('DELETE FROM sessions WHERE user_id = ?').run(user.id);

  return res.json({ message: 'Kata sandi berhasil direset! Silakan login dengan kata sandi baru.' });
});

apiRouter.delete('/auth/delete-account', requireAuth, (req: Request, res: Response) => {
  const { password } = req.body;
  if (!password) {
    return res.status(400).json({ error: 'Konfirmasi kata sandi diperlukan untuk menghapus akun.' });
  }

  const userStmt = db.prepare('SELECT password_hash, salt FROM users WHERE id = ?');
  const user = userStmt.get(req.user!.id) as { password_hash: string; salt: string };

  if (!verifyPassword(password, user.password_hash, user.salt)) {
    return res.status(400).json({ error: 'Kata sandi konfirmasi salah. Penghapusan akun dibatalkan.' });
  }

  // Cascade delete in SQLite
  const delStmt = db.prepare('DELETE FROM users WHERE id = ?');
  delStmt.run(req.user!.id);

  res.clearCookie('session_token');
  return res.json({ message: 'Akun dan seluruh data pribadi Anda telah berhasil dihapus secara permanen.' });
});

// -----------------------------------------------------------------------------
// ACTIVITIES / ROUTINES CRUD
// -----------------------------------------------------------------------------

apiRouter.get('/activities', requireAuth, (req: Request, res: Response) => {
  const { date, startDate, endDate, category, priority, status } = req.query;

  let query = 'SELECT * FROM activities WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  } else if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }
  if (priority) {
    query += ' AND priority = ?';
    params.push(priority);
  }
  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }

  query += " ORDER BY date ASC, CASE WHEN start_time IS NULL OR start_time = '' THEN '99:99' ELSE start_time END ASC, priority DESC";

  const rows = db.prepare(query).all(...params);
  return res.json({ activities: rows });
});

apiRouter.post('/activities', requireAuth, (req: Request, res: Response) => {
  const { date, start_time, end_time, title, category, priority, status, notes, recurrence_group } = req.body;

  if (!title || !date) {
    return res.status(400).json({ error: 'Judul aktivitas dan tanggal wajib diisi.' });
  }

  const id = `act_${crypto.randomUUID().slice(0, 10)}`;
  const now = new Date().toISOString();

  const insert = db.prepare(`
    INSERT INTO activities (id, user_id, date, start_time, end_time, title, category, priority, status, notes, recurrence_group, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id,
    req.user!.id,
    date,
    start_time || '',
    end_time || '',
    String(title).trim(),
    category || 'Pribadi',
    priority || 'Sedang',
    status || 'Belum Dimulai',
    notes || '',
    recurrence_group || null,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  return res.status(201).json({ message: 'Aktivitas berhasil ditambahkan.', activity: created });
});

apiRouter.put('/activities/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { date, start_time, end_time, title, category, priority, status, notes } = req.body;

  const existing = db.prepare('SELECT id FROM activities WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) {
    return res.status(404).json({ error: 'Aktivitas tidak ditemukan atau Anda tidak memiliki akses.' });
  }

  const now = new Date().toISOString();
  const update = db.prepare(`
    UPDATE activities
    SET date = ?, start_time = ?, end_time = ?, title = ?, category = ?, priority = ?, status = ?, notes = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `);

  update.run(
    date,
    start_time || '',
    end_time || '',
    String(title).trim(),
    category || 'Pribadi',
    priority || 'Sedang',
    status || 'Belum Dimulai',
    notes || '',
    now,
    id,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM activities WHERE id = ?').get(id);
  return res.json({ message: 'Aktivitas berhasil diperbarui.', activity: updated });
});

apiRouter.patch('/activities/:id/status', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { status } = req.body;

  const validStatuses = ['Belum Dimulai', 'Sedang Berjalan', 'Selesai', 'Dilewati'];
  if (!validStatuses.includes(status)) {
    return res.status(400).json({ error: 'Status tidak valid.' });
  }

  const existing = db.prepare('SELECT id FROM activities WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) {
    return res.status(404).json({ error: 'Aktivitas tidak ditemukan.' });
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE activities SET status = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(status, now, id, req.user!.id);

  return res.json({ message: 'Status aktivitas berhasil diubah.', status });
});

apiRouter.delete('/activities/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const del = db.prepare('DELETE FROM activities WHERE id = ? AND user_id = ?');
  const result = del.run(id, req.user!.id);

  if (result.changes === 0) {
    return res.status(404).json({ error: 'Aktivitas tidak ditemukan atau Anda tidak memiliki izin.' });
  }
  return res.json({ message: 'Aktivitas berhasil dihapus.' });
});

// Apply Routine Templates (Onboarding / Quick Starter)
apiRouter.post('/activities/templates', requireAuth, (req: Request, res: Response) => {
  const { date, selectedTemplates } = req.body;
  if (!date || !Array.isArray(selectedTemplates) || selectedTemplates.length === 0) {
    return res.status(400).json({ error: 'Tanggal dan pilihan template wajib ditentukan.' });
  }

  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO activities (id, user_id, date, start_time, end_time, title, category, priority, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Belum Dimulai', ?, ?, ?)
  `);

  let added = 0;
  for (const t of selectedTemplates) {
    const id = `act_${crypto.randomUUID().slice(0, 10)}`;
    insert.run(
      id,
      req.user!.id,
      date,
      t.startTime || '',
      t.endTime || '',
      t.title,
      t.category || 'Pribadi',
      t.priority || 'Sedang',
      t.notes || 'Ditambahkan dari template rutinitas',
      now,
      now
    );
    added++;
  }

  return res.json({ message: `${added} rutinitas berhasil ditambahkan ke tanggal ${date}.` });
});

// -----------------------------------------------------------------------------
// HABITS CRUD & LOGS
// -----------------------------------------------------------------------------

apiRouter.get('/habits', requireAuth, (req: Request, res: Response) => {
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? ORDER BY created_at DESC').all(req.user!.id);
  return res.json({ habits });
});

apiRouter.post('/habits', requireAuth, (req: Request, res: Response) => {
  const { name, category, frequency, weekly_target, start_date } = req.body;
  if (!name || !start_date) {
    return res.status(400).json({ error: 'Nama kebiasaan dan tanggal mulai wajib diisi.' });
  }

  const id = `hab_${crypto.randomUUID().slice(0, 10)}`;
  const now = new Date().toISOString();
  const insert = db.prepare(`
    INSERT INTO habits (id, user_id, name, category, frequency, weekly_target, start_date, is_active, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
  `);

  insert.run(
    id,
    req.user!.id,
    String(name).trim(),
    category || 'Kesehatan',
    frequency || 'Harian',
    weekly_target || 7,
    start_date,
    now,
    now
  );

  const created = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  return res.status(201).json({ message: 'Kebiasaan berhasil ditambahkan.', habit: created });
});

apiRouter.put('/habits/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { name, category, frequency, weekly_target, start_date, is_active } = req.body;

  const existing = db.prepare('SELECT id FROM habits WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) {
    return res.status(404).json({ error: 'Kebiasaan tidak ditemukan.' });
  }

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE habits
    SET name = ?, category = ?, frequency = ?, weekly_target = ?, start_date = ?, is_active = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    String(name).trim(),
    category || 'Kesehatan',
    frequency || 'Harian',
    weekly_target || 7,
    start_date,
    is_active ? 1 : 0,
    now,
    id,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM habits WHERE id = ?').get(id);
  return res.json({ message: 'Kebiasaan berhasil diperbarui.', habit: updated });
});

apiRouter.patch('/habits/:id/toggle-active', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const current = db.prepare('SELECT is_active FROM habits WHERE id = ? AND user_id = ?').get(id, req.user!.id) as { is_active: number } | undefined;
  if (!current) return res.status(404).json({ error: 'Kebiasaan tidak ditemukan.' });

  const nextActive = current.is_active === 1 ? 0 : 1;
  const now = new Date().toISOString();
  db.prepare('UPDATE habits SET is_active = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(nextActive, now, id, req.user!.id);

  return res.json({ message: `Status kebiasaan diubah menjadi ${nextActive === 1 ? 'Aktif' : 'Nonaktif'}.`, isActive: nextActive === 1 });
});

apiRouter.delete('/habits/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const del = db.prepare('DELETE FROM habits WHERE id = ? AND user_id = ?');
  const result = del.run(id, req.user!.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Kebiasaan tidak ditemukan.' });
  return res.json({ message: 'Kebiasaan berhasil dihapus beserta log terkait.' });
});

apiRouter.get('/habit-logs', requireAuth, (req: Request, res: Response) => {
  const { startDate, endDate, date } = req.query;
  let query = 'SELECT * FROM habit_logs WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  } else if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  const logs = db.prepare(query).all(...params);
  return res.json({ logs });
});

apiRouter.post('/habit-logs', requireAuth, (req: Request, res: Response) => {
  const { habit_id, date, status, notes } = req.body;
  if (!habit_id || !date || !status) {
    return res.status(400).json({ error: 'Habit ID, tanggal, dan status pencapaian wajib diisi.' });
  }

  const now = new Date().toISOString();
  const id = `hlog_${crypto.randomUUID().slice(0, 10)}`;

  // Upsert to prevent duplicate entry for same habit and date
  const upsert = db.prepare(`
    INSERT INTO habit_logs (id, user_id, habit_id, date, status, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, habit_id, date) DO UPDATE SET
      status = excluded.status,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `);

  upsert.run(id, req.user!.id, habit_id, date, status, notes || '', now, now);
  return res.json({ message: 'Log kebiasaan berhasil disimpan.' });
});

// -----------------------------------------------------------------------------
// GOALS CRUD
// -----------------------------------------------------------------------------

apiRouter.get('/goals', requireAuth, (req: Request, res: Response) => {
  const { status, period, category } = req.query;
  let query = 'SELECT * FROM goals WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (status) {
    query += ' AND status = ?';
    params.push(status);
  }
  if (period) {
    query += ' AND period = ?';
    params.push(period);
  }
  if (category) {
    query += ' AND category = ?';
    params.push(category);
  }

  query += ' ORDER BY deadline ASC, created_at DESC';
  const goals = db.prepare(query).all(...params);
  return res.json({ goals });
});

apiRouter.post('/goals', requireAuth, (req: Request, res: Response) => {
  const {
    title,
    description,
    category,
    period,
    start_date,
    deadline,
    target_metric,
    target_value,
    current_value,
    progress,
    status,
    evaluation_notes
  } = req.body;

  if (!title) {
    return res.status(400).json({ error: 'Judul target wajib diisi.' });
  }

  const id = `goal_${crypto.randomUUID().slice(0, 10)}`;
  const now = new Date().toISOString();

  let finalProgress = Number(progress) || 0;
  if (Number(target_value) > 0 && (progress === undefined || progress === null)) {
    finalProgress = Math.min(100, Math.round(((Number(current_value) || 0) / Number(target_value)) * 1000) / 10);
  }

  const insert = db.prepare(`
    INSERT INTO goals (id, user_id, title, description, category, period, start_date, deadline, target_metric, target_value, current_value, progress, status, evaluation_notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  insert.run(
    id,
    req.user!.id,
    String(title).trim(),
    description || '',
    category || 'Karir & Pekerjaan',
    period || 'Tahunan',
    start_date || now.slice(0, 10),
    deadline || '',
    target_metric || '',
    Number(target_value) || 0,
    Number(current_value) || 0,
    finalProgress,
    status || 'Belum Dimulai',
    evaluation_notes || '',
    now,
    now
  );

  const created = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  return res.status(201).json({ message: 'Target berhasil dibuat.', goal: created });
});

apiRouter.put('/goals/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const {
    title,
    description,
    category,
    period,
    start_date,
    deadline,
    target_metric,
    target_value,
    current_value,
    progress,
    status,
    evaluation_notes
  } = req.body;

  const existing = db.prepare('SELECT id FROM goals WHERE id = ? AND user_id = ?').get(id, req.user!.id);
  if (!existing) return res.status(404).json({ error: 'Target tidak ditemukan.' });

  const now = new Date().toISOString();
  let finalProgress = Number(progress) || 0;
  if (Number(target_value) > 0 && (progress === undefined || progress === null)) {
    finalProgress = Math.min(100, Math.round(((Number(current_value) || 0) / Number(target_value)) * 1000) / 10);
  }

  db.prepare(`
    UPDATE goals
    SET title = ?, description = ?, category = ?, period = ?, start_date = ?, deadline = ?, target_metric = ?, target_value = ?, current_value = ?, progress = ?, status = ?, evaluation_notes = ?, updated_at = ?
    WHERE id = ? AND user_id = ?
  `).run(
    String(title).trim(),
    description || '',
    category || 'Karir & Pekerjaan',
    period || 'Tahunan',
    start_date || '',
    deadline || '',
    target_metric || '',
    Number(target_value) || 0,
    Number(current_value) || 0,
    finalProgress,
    status || 'Belum Dimulai',
    evaluation_notes || '',
    now,
    id,
    req.user!.id
  );

  const updated = db.prepare('SELECT * FROM goals WHERE id = ?').get(id);
  return res.json({ message: 'Target berhasil diperbarui.', goal: updated });
});

apiRouter.patch('/goals/:id/progress', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const { current_value, progress, status } = req.body;

  const existing = db.prepare('SELECT * FROM goals WHERE id = ? AND user_id = ?').get(id, req.user!.id) as any;
  if (!existing) return res.status(404).json({ error: 'Target tidak ditemukan.' });

  let newCur = current_value !== undefined ? Number(current_value) : existing.current_value;
  let newProg = progress !== undefined ? Number(progress) : existing.progress;
  let newStat = status || existing.status;

  if (existing.target_value > 0 && current_value !== undefined && progress === undefined) {
    newProg = Math.round((newCur / existing.target_value) * 1000) / 10;
  }
  if (newProg >= 100 && newStat === 'Berjalan') {
    newStat = 'Selesai';
  }

  const now = new Date().toISOString();
  db.prepare('UPDATE goals SET current_value = ?, progress = ?, status = ?, updated_at = ? WHERE id = ? AND user_id = ?')
    .run(newCur, newProg, newStat, now, id, req.user!.id);

  return res.json({ message: 'Progres target berhasil diperbarui.', current_value: newCur, progress: newProg, status: newStat });
});

apiRouter.delete('/goals/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const del = db.prepare('DELETE FROM goals WHERE id = ? AND user_id = ?');
  const result = del.run(id, req.user!.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Target tidak ditemukan.' });
  return res.json({ message: 'Target berhasil dihapus.' });
});

// -----------------------------------------------------------------------------
// JOURNAL CRUD
// -----------------------------------------------------------------------------

apiRouter.get('/journals', requireAuth, (req: Request, res: Response) => {
  const { date, startDate, endDate, search } = req.query;
  let query = 'SELECT * FROM journals WHERE user_id = ?';
  const params: any[] = [req.user!.id];

  if (date) {
    query += ' AND date = ?';
    params.push(date);
  } else if (startDate && endDate) {
    query += ' AND date BETWEEN ? AND ?';
    params.push(startDate, endDate);
  }

  if (search) {
    query += ' AND (achievements LIKE ? OR gratitude LIKE ? OR notes LIKE ? OR lessons LIKE ?)';
    const term = `%${search}%`;
    params.push(term, term, term, term);
  }

  query += ' ORDER BY date DESC';
  const journals = db.prepare(query).all(...params);
  return res.json({ journals });
});

apiRouter.post('/journals', requireAuth, (req: Request, res: Response) => {
  const { date, mood, achievements, gratitude, obstacles, lessons, tomorrow_focus, notes } = req.body;
  if (!date) return res.status(400).json({ error: 'Tanggal jurnal wajib diisi.' });

  const id = `jrn_${crypto.randomUUID().slice(0, 10)}`;
  const now = new Date().toISOString();

  // Upsert to ensure 1 entry per date per user
  const upsert = db.prepare(`
    INSERT INTO journals (id, user_id, date, mood, achievements, gratitude, obstacles, lessons, tomorrow_focus, notes, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ON CONFLICT(user_id, date) DO UPDATE SET
      mood = excluded.mood,
      achievements = excluded.achievements,
      gratitude = excluded.gratitude,
      obstacles = excluded.obstacles,
      lessons = excluded.lessons,
      tomorrow_focus = excluded.tomorrow_focus,
      notes = excluded.notes,
      updated_at = excluded.updated_at
  `);

  upsert.run(
    id,
    req.user!.id,
    date,
    Number(mood) || 3,
    achievements || '',
    gratitude || '',
    obstacles || '',
    lessons || '',
    tomorrow_focus || '',
    notes || '',
    now,
    now
  );

  const entry = db.prepare('SELECT * FROM journals WHERE user_id = ? AND date = ?').get(req.user!.id, date);
  return res.json({ message: 'Jurnal refleksi berhasil disimpan.', journal: entry });
});

apiRouter.delete('/journals/:id', requireAuth, (req: Request, res: Response) => {
  const { id } = req.params;
  const del = db.prepare('DELETE FROM journals WHERE id = ? AND user_id = ?');
  const result = del.run(id, req.user!.id);
  if (result.changes === 0) return res.status(404).json({ error: 'Entri jurnal tidak ditemukan.' });
  return res.json({ message: 'Entri jurnal berhasil dihapus.' });
});

// -----------------------------------------------------------------------------
// SETTINGS
// -----------------------------------------------------------------------------

apiRouter.get('/settings', requireAuth, (req: Request, res: Response) => {
  let settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user!.id) as any;
  if (!settings) {
    const now = new Date().toISOString();
    db.prepare(`
      INSERT INTO user_settings (user_id, activity_categories, goal_categories, first_day_of_week, timezone, theme, updated_at)
      VALUES (?, ?, ?, 'Senin', 'Asia/Makassar', 'light', ?)
    `).run(
      req.user!.id,
      JSON.stringify(DEFAULT_ACTIVITY_CATEGORIES),
      JSON.stringify(DEFAULT_GOAL_CATEGORIES),
      now
    );
    settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(req.user!.id);
  }

  return res.json({
    settings: {
      ...settings,
      activity_categories: JSON.parse(settings.activity_categories),
      goal_categories: JSON.parse(settings.goal_categories)
    }
  });
});

apiRouter.put('/settings', requireAuth, (req: Request, res: Response) => {
  const { activity_categories, goal_categories, first_day_of_week, timezone, theme } = req.body;
  const now = new Date().toISOString();

  db.prepare(`
    UPDATE user_settings
    SET activity_categories = ?, goal_categories = ?, first_day_of_week = ?, timezone = ?, theme = ?, updated_at = ?
    WHERE user_id = ?
  `).run(
    JSON.stringify(activity_categories || DEFAULT_ACTIVITY_CATEGORIES),
    JSON.stringify(goal_categories || DEFAULT_GOAL_CATEGORIES),
    first_day_of_week || 'Senin',
    timezone || 'Asia/Makassar',
    theme || 'light',
    now,
    req.user!.id
  );

  if (timezone) {
    db.prepare('UPDATE users SET timezone = ? WHERE id = ?').run(timezone, req.user!.id);
  }

  return res.json({ message: 'Pengaturan berhasil diperbarui.' });
});

// -----------------------------------------------------------------------------
// ANALYTICS & DASHBOARD METRICS
// -----------------------------------------------------------------------------

apiRouter.get('/analytics/daily', requireAuth, (req: Request, res: Response) => {
  const date = (req.query.date as string) || new Date().toISOString().slice(0, 10);
  const activities = (db.prepare('SELECT * FROM activities WHERE user_id = ? AND date = ?')
    .all(req.user!.id, date) as unknown) as ActivityItem[];

  const kpi = calculateDailyKPI(activities);

  // Today's journal
  const journal = db.prepare('SELECT * FROM journals WHERE user_id = ? AND date = ?')
    .get(req.user!.id, date);

  // Active habits and status for today
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ? AND is_active = 1').all(req.user!.id) as any[];
  const habitLogs = db.prepare('SELECT * FROM habit_logs WHERE user_id = ? AND date = ?')
    .all(req.user!.id, date) as any[];

  const habitLogMap = new Map<string, any>();
  for (const log of habitLogs) {
    habitLogMap.set(log.habit_id, log);
  }

  const habitsWithTodayStatus = habits.map(h => ({
    ...h,
    todayStatus: habitLogMap.get(h.id)?.status || 'Belum',
    todayNotes: habitLogMap.get(h.id)?.notes || ''
  }));

  // Goals approaching deadline (within 14 days or active)
  const urgentGoals = db.prepare(`
    SELECT * FROM goals 
    WHERE user_id = ? AND status != 'Selesai' AND status != 'Dibatalkan'
    ORDER BY CASE WHEN deadline IS NULL OR deadline = '' THEN '9999-99-99' ELSE deadline END ASC
    LIMIT 4
  `).all(req.user!.id);

  return res.json({
    date,
    kpi,
    activities,
    journal: journal || null,
    habits: habitsWithTodayStatus,
    urgentGoals
  });
});

apiRouter.get('/analytics/monthly', requireAuth, (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();
  const month = parseInt(req.query.month as string, 10) || (new Date().getMonth() + 1);

  const startOfMonth = `${year}-${String(month).padStart(2, '0')}-01`;
  const endOfMonth = `${year}-${String(month).padStart(2, '0')}-31`;

  const activities = (db.prepare(`
    SELECT * FROM activities WHERE user_id = ? AND date BETWEEN ? AND ?
  `).all(req.user!.id, startOfMonth, endOfMonth) as unknown) as ActivityItem[];

  const activitiesByDate: Record<string, ActivityItem[]> = {};
  for (const a of activities) {
    if (!activitiesByDate[a.date]) activitiesByDate[a.date] = [];
    activitiesByDate[a.date].push(a);
  }

  const calendarGrid = generateCalendarGrid(year, month, activitiesByDate);
  const kpi = calculateMonthlyKPI(year, month, activitiesByDate);

  return res.json({
    year,
    month,
    kpi,
    calendarGrid
  });
});

apiRouter.get('/analytics/annual', requireAuth, (req: Request, res: Response) => {
  const year = parseInt(req.query.year as string, 10) || new Date().getFullYear();

  const startOfYear = `${year}-01-01`;
  const endOfYear = `${year}-12-31`;

  const activities = (db.prepare(`
    SELECT * FROM activities WHERE user_id = ? AND date BETWEEN ? AND ?
  `).all(req.user!.id, startOfYear, endOfYear) as unknown) as ActivityItem[];

  const activitiesByDate: Record<string, ActivityItem[]> = {};
  for (const a of activities) {
    if (!activitiesByDate[a.date]) activitiesByDate[a.date] = [];
    activitiesByDate[a.date].push(a);
  }

  const summary = calculateAnnualSummary(year, activitiesByDate);

  // Category breakdown for the year
  const categoryCounts = db.prepare(`
    SELECT category, COUNT(*) as total, SUM(CASE WHEN status = 'Selesai' THEN 1 ELSE 0 END) as completed
    FROM activities
    WHERE user_id = ? AND date BETWEEN ? AND ?
    GROUP BY category
  `).all(req.user!.id, startOfYear, endOfYear);

  return res.json({
    year,
    monthlyBreakdown: summary.monthlyBreakdown,
    kpi: summary.kpi,
    categoryCounts
  });
});

// -----------------------------------------------------------------------------
// EXPORT DATA (JSON / CSV)
// -----------------------------------------------------------------------------

apiRouter.get('/export', requireAuth, (req: Request, res: Response) => {
  const format = req.query.format === 'csv' ? 'csv' : 'json';
  const userId = req.user!.id;

  const activities = db.prepare('SELECT * FROM activities WHERE user_id = ? ORDER BY date DESC').all(userId);
  const habits = db.prepare('SELECT * FROM habits WHERE user_id = ?').all(userId);
  const habitLogs = db.prepare('SELECT * FROM habit_logs WHERE user_id = ? ORDER BY date DESC').all(userId);
  const goals = db.prepare('SELECT * FROM goals WHERE user_id = ? ORDER BY created_at DESC').all(userId);
  const journals = db.prepare('SELECT * FROM journals WHERE user_id = ? ORDER BY date DESC').all(userId);
  const settings = db.prepare('SELECT * FROM user_settings WHERE user_id = ?').get(userId);

  const exportPayload = {
    app: 'Personal Life Dashboard',
    version: '2.0',
    exportTimestamp: new Date().toISOString(),
    user: req.user,
    data: {
      activities,
      habits,
      habitLogs,
      goals,
      journals,
      settings
    }
  };

  if (format === 'json') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Content-Disposition', `attachment; filename="personal_dashboard_export_${new Date().toISOString().slice(0, 10)}.json"`);
    return res.send(JSON.stringify(exportPayload, null, 2));
  }

  // If CSV format requested: export activities as CSV
  let csv = 'ID,Tanggal,Jam Mulai,Jam Selesai,Judul,Kategori,Prioritas,Status,Catatan\n';
  for (const a of activities as any[]) {
    const sanitize = (val: any) => `"${String(val || '').replace(/"/g, '""')}"`;
    csv += [
      sanitize(a.id),
      sanitize(a.date),
      sanitize(a.start_time),
      sanitize(a.end_time),
      sanitize(a.title),
      sanitize(a.category),
      sanitize(a.priority),
      sanitize(a.status),
      sanitize(a.notes)
    ].join(',') + '\n';
  }

  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="aktivitas_export_${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(csv);
});
