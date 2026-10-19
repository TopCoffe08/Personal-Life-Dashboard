const API_BASE = '/api';

export function getAuthToken(): string | null {
  return localStorage.getItem('pld_session_token');
}

export function setAuthToken(token: string): void {
  localStorage.setItem('pld_session_token', token);
}

export function clearAuthToken(): void {
  localStorage.removeItem('pld_session_token');
}

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const token = getAuthToken();
  const headers = new Headers(options.headers || {});

  if (!headers.has('Content-Type') && !(options.body instanceof FormData)) {
    headers.set('Content-Type', 'application/json');
  }

  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${API_BASE}${endpoint}`, {
    ...options,
    headers,
  });

  const contentType = response.headers.get('content-type');
  let data: any = null;

  if (contentType && contentType.includes('application/json')) {
    data = await response.json();
  } else if (response.status !== 204) {
    data = await response.text();
  }

  if (!response.ok) {
    const errorMsg = data?.error || data?.message || `Permintaan gagal (${response.status})`;
    throw new Error(errorMsg);
  }

  return data as T;
}

export const api = {
  // Auth
  register: (body: any) => request<any>('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login: (body: any) => request<any>('/auth/login', { method: 'POST', body: JSON.stringify(body) }),
  logout: () => request<any>('/auth/logout', { method: 'POST' }),
  getCurrentUser: () => request<{ user: any }>('/auth/me'),
  updateProfile: (body: any) => request<any>('/auth/update-profile', { method: 'PUT', body: JSON.stringify(body) }),
  changePassword: (body: any) => request<any>('/auth/change-password', { method: 'PUT', body: JSON.stringify(body) }),
  forgotPassword: (email: string) => request<any>('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  resetPassword: (body: any) => request<any>('/auth/reset-password', { method: 'POST', body: JSON.stringify(body) }),
  deleteAccount: (password: string) => request<any>('/auth/delete-account', { method: 'DELETE', body: JSON.stringify({ password }) }),

  // Activities
  getActivities: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request<{ activities: any[] }>(`/activities${q ? `?${q}` : ''}`);
  },
  createActivity: (body: any) => request<any>('/activities', { method: 'POST', body: JSON.stringify(body) }),
  updateActivity: (id: string, body: any) => request<any>(`/activities/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateActivityStatus: (id: string, status: string) => request<any>(`/activities/${id}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }),
  deleteActivity: (id: string) => request<any>(`/activities/${id}`, { method: 'DELETE' }),
  applyTemplates: (date: string, selectedTemplates: any[]) => request<any>('/activities/templates', { method: 'POST', body: JSON.stringify({ date, selectedTemplates }) }),

  // Habits
  getHabits: () => request<{ habits: any[] }>('/habits'),
  createHabit: (body: any) => request<any>('/habits', { method: 'POST', body: JSON.stringify(body) }),
  updateHabit: (id: string, body: any) => request<any>(`/habits/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  toggleHabitActive: (id: string) => request<any>(`/habits/${id}/toggle-active`, { method: 'PATCH' }),
  deleteHabit: (id: string) => request<any>(`/habits/${id}`, { method: 'DELETE' }),
  getHabitLogs: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request<{ logs: any[] }>(`/habit-logs${q ? `?${q}` : ''}`);
  },
  setHabitLog: (body: { habit_id: string; date: string; status: string; notes?: string }) =>
    request<any>('/habit-logs', { method: 'POST', body: JSON.stringify(body) }),

  // Goals
  getGoals: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request<{ goals: any[] }>(`/goals${q ? `?${q}` : ''}`);
  },
  createGoal: (body: any) => request<any>('/goals', { method: 'POST', body: JSON.stringify(body) }),
  updateGoal: (id: string, body: any) => request<any>(`/goals/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
  updateGoalProgress: (id: string, body: any) => request<any>(`/goals/${id}/progress`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteGoal: (id: string) => request<any>(`/goals/${id}`, { method: 'DELETE' }),

  // Journals
  getJournals: (params: Record<string, string> = {}) => {
    const q = new URLSearchParams(params).toString();
    return request<{ journals: any[] }>(`/journals${q ? `?${q}` : ''}`);
  },
  saveJournal: (body: any) => request<any>('/journals', { method: 'POST', body: JSON.stringify(body) }),
  deleteJournal: (id: string) => request<any>(`/journals/${id}`, { method: 'DELETE' }),

  // Settings
  getSettings: () => request<{ settings: any }>('/settings'),
  updateSettings: (body: any) => request<any>('/settings', { method: 'PUT', body: JSON.stringify(body) }),

  // Analytics
  getDailyAnalytics: (date: string) => request<any>(`/analytics/daily?date=${date}`),
  getMonthlyAnalytics: (year: number, month: number) => request<any>(`/analytics/monthly?year=${year}&month=${month}`),
  getAnnualAnalytics: (year: number) => request<any>(`/analytics/annual?year=${year}`),

  // Export
  exportDataUrl: (format: 'json' | 'csv') => {
    const token = getAuthToken();
    return `/api/export?format=${format}&token=${encodeURIComponent(token || '')}`;
  }
};
