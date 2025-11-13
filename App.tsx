import React, { useState, useCallback, useEffect } from 'react';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './pages/Dashboard';
import Attendance from './pages/Attendance';
import DataManagement from './pages/DataManagement';
import HalaqahData from './pages/HalaqahData';
import Reports from './pages/Reports';
import Login from './pages/Login';
import Informasi from './pages/Informasi';
import type { Page } from './types';
import { supabase } from './lib/supabaseClient';
import type { Session } from '@supabase/supabase-js';

const App: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setSession(session);
      setLoading(false);
    };

    getSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
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
    setCurrentPage('Dashboard'); // Reset page on logout
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
      case 'Data Halaqah':
        return <HalaqahData />;
      case 'Laporan':
        return <Reports />;
      default:
        return <Dashboard />;
    }
  };
  
  if (loading) {
    return (
        <div className="flex h-screen w-full items-center justify-center bg-neutral">
            <p className="text-base-100">Loading...</p>
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
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header 
          currentPage={currentPage} 
          toggleSidebar={() => setSidebarOpen(!isSidebarOpen)}
          onLogout={handleLogout}
        />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-neutral p-4 sm:p-6 lg:p-8">
          {renderPage()}
        </main>
      </div>
    </div>
  );
};

export default App;