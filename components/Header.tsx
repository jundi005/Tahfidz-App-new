
import React, { useState, useRef, useEffect } from 'react';
import type { Page } from '../types';
import { Menu, UserCircle, LogOut, ChevronDown } from 'lucide-react';

interface HeaderProps {
    currentPage: Page;
    toggleSidebar: () => void;
    isSidebarCollapsed: boolean;
    toggleSidebarCollapse: () => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, toggleSidebar, isSidebarCollapsed, toggleSidebarCollapse, onLogout }) => {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleMenuClick = () => {
      if (window.innerWidth >= 768) {
          // Desktop: Toggle Collapse
          toggleSidebarCollapse();
      } else {
          // Mobile: Toggle Drawer
          toggleSidebar();
      }
  };

  return (
    <header className="bg-primary border-b border-slate-200 z-10 transition-all duration-300">
      <div className="flex items-center justify-between h-16 px-4 sm:px-6 lg:px-8">
        <div className="flex items-center">
            <button
                onClick={handleMenuClick}
                className="text-slate-600 mr-4 p-2 rounded-full hover:bg-slate-100 focus:outline-none"
                aria-label="Toggle sidebar"
            >
                <Menu size={24} />
            </button>
            <h1 className="text-xl font-bold text-slate-800">{currentPage}</h1>
        </div>
        <div className="relative" ref={dropdownRef}>
            <button onClick={() => setDropdownOpen(!isDropdownOpen)} className="flex items-center space-x-2 p-2 rounded-lg hover:bg-slate-100">
                <UserCircle size={32} className="text-slate-500"/>
                <span className="ml-2 text-sm font-medium text-slate-700 hidden sm:block">Admin</span>
                <ChevronDown size={16} className={`text-slate-500 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-primary rounded-md shadow-lg py-1 z-20 border border-slate-200">
                    <button 
                        onClick={() => {
                            onLogout();
                            setDropdownOpen(false);
                        }} 
                        className="w-full text-left flex items-center px-4 py-2 text-sm text-slate-700 hover:bg-slate-100 hover:text-error"
                    >
                        <LogOut size={16} className="mr-2" />
                        Logout
                    </button>
                </div>
            )}
        </div>
      </div>
    </header>
  );
};

export default Header;
