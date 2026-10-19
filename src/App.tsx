import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Header } from './components/Header';
import { Navigation } from './components/Navigation';
import { DashboardView } from './views/DashboardView';
import { RoutinesView } from './views/RoutinesView';
import { CalendarView } from './views/CalendarView';
import { AnnualSummaryView } from './views/AnnualSummaryView';
import { HabitsView } from './views/HabitsView';
import { GoalsView } from './views/GoalsView';
import { JournalView } from './views/JournalView';
import { SettingsProfileView } from './views/SettingsProfileView';
import { UserGuideView } from './views/UserGuideView';
import { AuthView } from './views/AuthView';

function MainApp() {
  const { user, loading } = useAuth();

  // Active tab state
  const [activeTab, setActiveTab] = useState<string>('dashboard');

  // Selected monitoring date (default: 2026-10-19 to match prompt requirements & seed data)
  const [currentDate, setCurrentDate] = useState<string>('2026-10-19');

  // Trigger to directly open Add Activity modal in RoutinesView
  const [openAddModal, setOpenAddModal] = useState<boolean>(false);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
        <div className="w-10 h-10 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-slate-400 text-sm font-medium">Memuat Personal Life Dashboard...</p>
      </div>
    );
  }

  if (!user) {
    return <AuthView />;
  }

  const handleOpenAddActivity = () => {
    setActiveTab('routines');
    setOpenAddModal(true);
    // Reset trigger after tick
    setTimeout(() => setOpenAddModal(false), 200);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col font-sans">
      <Header
        currentDate={currentDate}
        onDateChange={setCurrentDate}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <Navigation activeTab={activeTab} onTabChange={setActiveTab} />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            currentDate={currentDate}
            onNavigateTab={setActiveTab}
            onOpenAddActivity={handleOpenAddActivity}
          />
        )}

        {activeTab === 'routines' && (
          <RoutinesView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
            openCreateModalDirectly={openAddModal}
          />
        )}

        {activeTab === 'calendar' && (
          <CalendarView
            currentDate={currentDate}
            onSelectDate={setCurrentDate}
            onOpenAddActivity={handleOpenAddActivity}
          />
        )}

        {activeTab === 'annual' && (
          <AnnualSummaryView currentDate={currentDate} />
        )}

        {activeTab === 'habits' && (
          <HabitsView currentDate={currentDate} />
        )}

        {activeTab === 'goals' && (
          <GoalsView currentDate={currentDate} />
        )}

        {activeTab === 'journal' && (
          <JournalView
            currentDate={currentDate}
            onDateChange={setCurrentDate}
          />
        )}

        {activeTab === 'settings' && (
          <SettingsProfileView />
        )}

        {activeTab === 'guide' && (
          <UserGuideView />
        )}
      </main>

      {/* Global Footer */}
      <footer className="bg-white border-t border-slate-200 py-5 text-center text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Personal Life Dashboard &copy; 2026. Seluruh hak cipta dilindungi.</span>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('guide')}
              className="hover:text-blue-600 transition cursor-pointer"
            >
              Panduan
            </button>
            <button
              onClick={() => setActiveTab('settings')}
              className="hover:text-blue-600 transition cursor-pointer"
            >
              Ekspor Data
            </button>
            <span className="font-mono text-[11px] text-slate-400">v2.0 Web Edition</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <MainApp />
    </AuthProvider>
  );
}
