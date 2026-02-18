
import React, { useState } from 'react';
import { DbService } from '../services/dbService';
import { User, UserRole } from '../types';

interface NavItem {
  id: string;
  label: string;
  show: boolean;
  badge?: number;
  subItems?: { id: string; label: string }[];
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: 'dashboard' | 'requests' | 'request-form' | 'list' | 'create' | 'edit-quote' | 'clients' | 'settings' | 'users' | 'user-form' | 'structure' | 'agencies';
  setView: (view: any) => void;
  user: User;
  onLogout: () => void;
  onEditProfile?: () => void;
  requestsBadgeCount?: number;
  validationsBadgeCount?: number;
}

export const Layout: React.FC<LayoutProps> = ({ children, currentView, setView, user, onLogout, onEditProfile, requestsBadgeCount = 0, validationsBadgeCount = 0 }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dbInfo = DbService.getDbInfo();

  const isAdmin = user.role === UserRole.ADMIN;
  const isCHEF_CENTRE = user.role === UserRole.CHEF_CENTRE || isAdmin;

  const navItems: NavItem[] = [
    { id: 'dashboard', label: 'Dashboard', show: true },  // Modifié pour permettre l'accès à tous les utilisateurs
    { id: 'requests', label: 'Demandes', show: true, badge: requestsBadgeCount > 0 ? requestsBadgeCount : (validationsBadgeCount > 0 ? validationsBadgeCount : undefined) },
    { id: 'list', label: 'Chantiers', show: true },
    { id: 'articles', label: 'Articles', show: (user?.role === UserRole.TECHICO_COMMERCIAL || user?.role === UserRole.CHEF_CENTRE || isAdmin) },
    { id: 'clients', label: 'Clients', show: true },
    { id: 'structure', label: 'Structure', show: isAdmin, subItems: [
      { id: 'structure', label: 'Centres' },
      { id: 'agencies', label: 'Agences Commerciales' }
    ]},
    { id: 'users', label: 'Équipe', show: isAdmin },
    { id: 'settings', label: 'Paramètres', show: isAdmin },
  ];

  const handleNavClick = (id: string) => {
    setView(id);
    setIsMobileMenuOpen(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gray-50/50">
      <nav className="bg-white border-b border-gray-100 sticky top-0 z-40 shadow-sm backdrop-blur-md bg-white/90">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 md:h-20">
            <div className="flex items-center">
              <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 rounded-lg text-gray-500 hover:bg-gray-100 mr-2 focus:outline-none">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{isMobileMenuOpen ? (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />) : (<path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />)}</svg>
              </button>
              <div className="flex-shrink-0 flex items-center">
                <div className="bg-blue-600 p-1.5 md:p-2.5 rounded-xl md:rounded-2xl mr-2 md:mr-3 shadow-lg shadow-blue-600/20"><svg className="w-4 h-4 md:w-6 md:h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" /></svg></div>
                <div><span className="text-sm md:text-xl font-black text-gray-900 tracking-tighter block leading-none uppercase">ADE MANAGER</span><div className="hidden xs:flex items-center mt-0.5 md:mt-1"><span className="flex h-1.5 w-1.5 rounded-full bg-blue-500 mr-1 animate-pulse"></span><span className="text-[8px] md:text-[9px] font-black text-gray-400 uppercase tracking-widest">{dbInfo.dbName}</span></div></div>
              </div>
              <div className="hidden md:-my-px md:ml-10 md:flex md:space-x-8">
                {navItems.filter(item => item.show).map((item) => (
                  <div key={item.id} className="relative">
                    {item.subItems ? (
                      <>
                        <button 
                          onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                          onMouseEnter={() => setOpenDropdown(item.id)}
                          className={`${currentView === item.id || currentView === 'agencies' ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900'} inline-flex items-center px-1 pt-1 border-b-2 text-[10px] font-black uppercase tracking-widest transition-all h-full`}
                        >
                          <span>{item.label}</span>
                          <svg className={`ml-1 w-3 h-3 transition-transform ${openDropdown === item.id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                        </button>
                        {openDropdown === item.id && (
                          <div onMouseLeave={() => setOpenDropdown(null)} className="absolute top-full left-0 mt-1 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50">
                            {item.subItems.map(sub => (
                              <button
                                key={sub.id}
                                onClick={() => { setView(sub.id); setOpenDropdown(null); }}
                                className={`w-full text-right px-4 py-2 text-[10px] font-black uppercase tracking-widest hover:bg-blue-50 transition-colors ${currentView === sub.id ? 'text-blue-600 bg-blue-50' : 'text-gray-600'}`}
                              >
                                {sub.label}
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <button onClick={() => setView(item.id as any)} className={`${currentView.startsWith(item.id) ? 'border-blue-600 text-gray-900' : 'border-transparent text-gray-400 hover:text-gray-900'} inline-flex items-center px-1 pt-1 border-b-2 text-[10px] font-black uppercase tracking-widest transition-all h-full relative`}>
                        <span>{item.label}</span>
                        {item.badge ? (<span className="ml-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-rose-600 text-[8px] font-black text-white ring-2 ring-white animate-pulse">{item.badge}</span>) : null}
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="flex items-center space-x-3 md:space-x-6">
              <button onClick={() => setView('request-form')} className="inline-flex items-center px-3 py-2 md:px-6 md:py-2.5 border border-transparent text-[9px] md:text-[10px] font-black rounded-lg md:rounded-xl shadow-lg shadow-blue-600/20 text-white bg-blue-600 hover:bg-blue-700 transition-all uppercase tracking-widest"><span className="hidden xs:inline">Saisir Demande</span><span className="xs:hidden">+</span></button>
              <div className="relative">
                <button 
                  onMouseEnter={() => setUserDropdownOpen(true)}
                  onMouseLeave={() => setUserDropdownOpen(false)}
                  className="flex items-center gap-2 md:gap-3 border-l border-gray-100 pl-3 md:pl-6 hover:bg-gray-50 rounded-lg p-1 -m-1 transition-colors"
                >
                  <div className="text-right hidden sm:block">
                    <p className="text-xs md:text-sm font-black text-gray-900 tracking-tight leading-none uppercase">{user.username}</p>
                    <p className="text-[8px] md:text-[9px] font-black text-blue-500 uppercase tracking-widest mt-1">{user.role}</p>
                  </div>
                  <img className="h-8 w-8 md:h-10 md:w-10 rounded-lg md:rounded-2xl bg-gray-100 shadow-md" src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`} alt="Avatar" />
                  <svg className={`w-3 h-3 text-gray-400 transition-transform ${userDropdownOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                </button>
                {userDropdownOpen && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 py-2 z-50" onMouseEnter={() => setUserDropdownOpen(true)} onMouseLeave={() => setUserDropdownOpen(false)}>
                    {onEditProfile && (
                      <button
                        onClick={() => { onEditProfile(); setUserDropdownOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-blue-50 hover:text-blue-600 transition-colors"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" /></svg>
                        Mon Profil
                      </button>
                    )}
                    <button
                      onClick={() => { onLogout(); setUserDropdownOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-2 text-[10px] font-black uppercase tracking-widest text-gray-600 hover:bg-rose-50 hover:text-rose-600 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
                      Déconnexion
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </nav>
      <div className="flex-grow">{children}</div>
      <footer className="bg-white border-t border-gray-100 py-4 md:py-6 flex justify-center items-center text-[8px] md:text-[10px] font-black text-gray-400 uppercase tracking-widest px-4 text-center">
        <span>ADE MANAGER v3.0 — Algérie Hydraulique</span>
      </footer>
    </div>
  );
};
