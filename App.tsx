
import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import DataManagement from './pages/DataManagement';
import Reports from './pages/Reports';
import AttendanceBook from './pages/AttendanceBook';
import StudentProgress from './pages/StudentProgress';
import Login from './pages/Login';
import Informasi from './pages/Informasi';
import ChatWidget from './components/ChatWidget';
import type { Page } from './types';
import { supabase } from './lib/supabaseClient';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [session, setSession] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Cek sesi aktif saat aplikasi dimuat (Supabase v2 Syntax)
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    // 2. Dengarkan perubahan status auth (Login/Logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  const handleSetPage = useCallback((page: Page) => {
    setCurrentPage(page);
    if(window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setCurrentPage('Dashboard');
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Pusat Informasi':
        return <Informasi />;
      case 'Absensi':
        return <Attendance />;
      case 'Manajemen Data':
        return <DataManagement />;
      // 'Data Halaqah' case removed, handled within DataManagement now
      case 'Perkembangan Santri':
        return <StudentProgress />;
      case 'Buku Absensi':
        return <AttendanceBook />;
      case 'Laporan':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };
  
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-neutral text-slate-600 flex-col gap-4">
             <div className="w-10 h-10 border-4 border-secondary border-t-transparent rounded-full animate-spin"></div>
             <p className="text-sm font-medium animate-pulse">Memuat Aplikasi...</p>
        </div>
    );
  }

  if (!session) {
    return <Login />;
  }

  return (
    <div className="flex h-screen bg-neutral text-base-100">
      <Sidebar 
        currentPage={currentPage} 
        setPage={handleSetPage} 
        isOpen={isSidebarOpen} 
        setOpen={setSidebarOpen}
        isCollapsed={isSidebarCollapsed}
        setCollapsed={setSidebarCollapsed}
      />
      <div className="flex-1 flex flex-col overflow-hidden relative">
        <Header 
          currentPage={currentPage} 
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          isSidebarCollapsed={isSidebarCollapsed}
          toggleSidebarCollapse={() => setSidebarCollapsed(!isSidebarCollapsed)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
        
        {/* Floating Chat Widget available on all pages */}
        <ChatWidget />
      </div>
    </div>
  );
};

export default App;
