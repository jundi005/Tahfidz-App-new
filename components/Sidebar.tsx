
import React from 'react';
import type { Page } from '../types';
import { Home, CheckSquare, Users, BookOpen, BarChart2, X, Megaphone, Book, TrendingUp, ShieldCheck } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
  orgName?: string;
  isSuperAdmin?: boolean;
}

const NavItem: React.FC<{
  page: Page;
  currentPage: Page;
  setPage: (page: Page) => void;
  icon: React.ReactNode;
  label: string;
}> = ({ page, currentPage, setPage, icon, label }) => (
  <li>
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); setPage(page); }}
      className={`relative flex items-center p-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-secondary transition-colors duration-200 group ${ currentPage === page ? 'bg-blue-50 text-secondary font-semibold' : ''}`}
      title={label}
    >
      <div className="flex-shrink-0">{icon}</div>
      <span className="ml-3 whitespace-nowrap overflow-hidden transition-all">{label}</span>
    </a>
  </li>
);

// Updated URL with the direct image link
const LOGO_URL = "https://i.ibb.co.com/KcYyzZRz/Tanpa-judul-1080-x-1080-piksel-20260116-084021-0000.png"; 

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, isOpen, setOpen, isCollapsed, orgName, isSuperAdmin }) => {
  // Urutan Menu Sesuai Request:
  // Dashboard, Absensi, Buku Absensi, Manajemen Data, Perkembangan, Pusat Informasi, Laporan
  const navItems: { page: Page; icon: React.ReactNode; label: string }[] = [
    { page: 'Dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { page: 'Absensi', icon: <CheckSquare size={20} />, label: 'Absensi' },
    { page: 'Buku Absensi', icon: <Book size={20} />, label: 'Buku Absensi' },
    { page: 'Manajemen Data', icon: <Users size={20} />, label: 'Manajemen Data' },
    { page: 'Perkembangan Santri', icon: <TrendingUp size={20} />, label: 'Perkembangan' },
    { page: 'Pusat Informasi', icon: <Megaphone size={20} />, label: 'Pusat Informasi' },
    { page: 'Laporan', icon: <BarChart2 size={20} />, label: 'Laporan' },
  ];

  if (isSuperAdmin) {
      navItems.push({ page: 'Users', icon: <ShieldCheck size={20} />, label: 'Kelola Users' });
  }

  return (
    <>
      {/* Mobile Overlay */}
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
      
      <aside 
        className={`flex flex-col h-full bg-primary z-40 border-r border-slate-200
          fixed md:relative inset-y-0 left-0
          transform transition-all duration-300 ease-in-out 
          ${isOpen ? 'translate-x-0' : '-translate-x-full'} 
          md:transform-none
          /* Logic untuk Desktop: Jika collapsed, width jadi 0 dan border hilang (benar-benar hilang) */
          ${isCollapsed ? 'md:w-0 md:border-none overflow-hidden' : 'md:w-64'}
        `}
      >
          {/* Inner Container: Lebar tetap 64 (256px) agar konten tidak gepeng saat transisi sliding */}
          <div className="flex-grow flex flex-col min-h-0 w-64"> 
            {/* Header */}
            <div className="relative flex flex-col items-center justify-center border-b border-slate-200 flex-shrink-0 py-6">
                
                {/* Mobile Close Button */}
                 <button className="md:hidden absolute top-2 right-2 text-slate-500 hover:text-error" onClick={() => setOpen(false)}>
                    <X size={24} />
                </button>

                {/* Logo Section */}
                <div className="w-20 h-20 mb-2">
                     <img 
                        src={LOGO_URL} 
                        alt="Logo Ma'had" 
                        className="w-full h-full object-contain drop-shadow-sm"
                        onError={(e) => {
                            (e.target as HTMLImageElement).src = "https://placehold.co/100x100?text=Logo";
                        }}
                     />
                </div>
                
                {/* Text Section (Dynamic Name) */}
                <div className="text-center px-4">
                    <h1 className="text-lg font-bold text-slate-800 break-words leading-tight">{orgName || "Tahfidz App"}</h1>
                    <p className="text-xs text-slate-500 font-medium mt-1">{isSuperAdmin ? 'Super Admin' : 'Sistem Absensi'}</p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-grow p-2.5 overflow-y-auto mt-1">
                <ul className="space-y-1">
                    {navItems.map((item) => (
                        <NavItem key={item.page} {...item} currentPage={currentPage} setPage={setPage} />
                    ))}
                </ul>
            </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
