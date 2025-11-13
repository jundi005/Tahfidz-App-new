import React from 'react';
import type { Page } from '../types';
import { Home, CheckSquare, Users, BookOpen, BarChart2, X, BookMarked, Menu, Megaphone } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  setPage: (page: Page) => void;
  isOpen: boolean;
  setOpen: (isOpen: boolean) => void;
  isCollapsed: boolean;
  setCollapsed: (collapsed: boolean) => void;
}

const NavItem: React.FC<{
  page: Page;
  currentPage: Page;
  setPage: (page: Page) => void;
  icon: React.ReactNode;
  label: string;
  isCollapsed: boolean;
}> = ({ page, currentPage, setPage, icon, label, isCollapsed }) => (
  <li>
    <a
      href="#"
      onClick={(e) => { e.preventDefault(); setPage(page); }}
      className={`flex items-center p-3 rounded-lg text-slate-700 hover:bg-slate-100 hover:text-secondary transition-colors duration-200 group ${ currentPage === page ? 'bg-blue-50 text-secondary font-semibold' : ''} ${isCollapsed ? 'justify-center' : ''}`}
      title={label}
    >
      {icon}
      <span className={`ml-3 whitespace-nowrap ${isCollapsed ? 'hidden' : 'group-hover:translate-x-1 transition-transform'}`}>{label}</span>
    </a>
  </li>
);

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setPage, isOpen, setOpen, isCollapsed, setCollapsed }) => {
  const navItems: { page: Page; icon: React.ReactNode; label: string }[] = [
    { page: 'Dashboard', icon: <Home size={20} />, label: 'Dashboard' },
    { page: 'Absensi', icon: <CheckSquare size={20} />, label: 'Absensi' },
    { page: 'Manajemen Data', icon: <Users size={20} />, label: 'Manajemen Data' },
    { page: 'Data Halaqah', icon: <BookOpen size={20} />, label: 'Data Halaqah' },
    { page: 'Pusat Informasi', icon: <Megaphone size={20} />, label: 'Pusat Informasi' },
    { page: 'Laporan', icon: <BarChart2 size={20} />, label: 'Laporan' },
  ];

  return (
    <>
      <div className={`fixed inset-0 bg-black bg-opacity-50 z-30 md:hidden transition-opacity ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setOpen(false)}></div>
      
      <aside 
        className={`flex flex-col h-full bg-primary z-40 border-r border-slate-200
          fixed md:relative inset-y-0 left-0
          transform transition-transform duration-300 ease-in-out ${isOpen ? 'translate-x-0' : '-translate-x-full'} md:transform-none
          md:transition-all md:duration-300 ${isCollapsed ? 'md:w-20' : 'md:w-64'}`}
      >
          <div className="flex-grow flex flex-col min-h-0">
            {/* Header */}
            <div className={`flex items-center p-4 border-b border-slate-200 flex-shrink-0 h-16 ${isCollapsed ? 'justify-center' : 'justify-between'}`}>
                {/* Logo and Title */}
                <div className={`flex items-center w-full overflow-hidden ${isCollapsed ? 'hidden' : ''}`}>
                    <div className="p-2 bg-gradient-to-br from-blue-500 to-secondary rounded-lg">
                        <BookMarked className="text-white" size={24} />
                    </div>
                    <div className="ml-2 overflow-hidden">
                        <h1 className="text-base font-bold text-slate-800 whitespace-nowrap">Tahfidz App</h1>
                        <p className="text-xs text-slate-500 whitespace-nowrap">Lajnah Al-Quran</p>
                    </div>
                </div>
                
                {/* Controls */}
                <div className={`${isCollapsed ? 'w-full flex justify-center' : ''}`}>
                    {/* Desktop Toggle */}
                    <button onClick={() => setCollapsed(!isCollapsed)} className="hidden md:block text-slate-500 hover:text-secondary p-1 rounded-md hover:bg-slate-100">
                      <Menu size={24}/>
                    </button>
                    {/* Mobile Close */}
                    <button className="md:hidden text-slate-500" onClick={() => setOpen(false)}>
                        <X size={24} />
                    </button>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-grow p-2.5 overflow-y-auto">
                <ul className="space-y-1.5">
                    {navItems.map((item) => (
                        <NavItem key={item.page} {...item} currentPage={currentPage} setPage={setPage} isCollapsed={isCollapsed} />
                    ))}
                </ul>
            </nav>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;