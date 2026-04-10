
import React, { useState, useEffect, useRef } from 'react';
import Swal from 'sweetalert2';
import { DbService } from '../services/dbService';
import { User, UserRole, WorkType } from '../types';

interface NavItem {
  id: string;
  label: string;
  shortLabel?: string;
  show: boolean;
  badge?: number;
  icon?: React.ReactNode;
  subItems?: { id: string; label: string }[];
}

interface LayoutProps {
  children: React.ReactNode;
  currentView: string;
  setView: (view: any) => void;
  user: User;
  onLogout: () => void;
  onEditProfile?: () => void;
  requestsBadgeCount?: number;
  validationsBadgeCount?: number;
  quotesBadgeCount?: number;
  workTypes: WorkType[];
}

// ── Obat.fr Design Tokens ──────────────────────────────
const BLUE        = '#1592ef';
const BLUE_HOVER  = '#0d7fd4';
const BLUE_LIGHT  = '#e8f4fd';
const NAVY        = '#0b1e42';
const GRAY_BORDER = '#e5e7eb';
const GRAY_BG     = '#f8fafc';
const GRAY_TEXT   = '#6b7280';

// ── Small SVG Icons ────────────────────────────────────
const Icon = ({ name }: { name: string }) => {
  const paths: Record<string, string> = {
    dashboard: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6',
    requests:  'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    list:      'M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10',
    articles:  'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
    clients:   'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z',
    structure: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
    users:     'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
    settings:  'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065zM15 12a3 3 0 11-6 0 3 3 0 016 0z',
    plus:      'M12 4v16m8-8H4',
    logout:    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1',
    profile:   'M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z',
    chevron:   'M19 9l-7 7-7-7',
    menu:      'M4 6h16M4 12h16M4 18h16',
    close:     'M6 18L18 6M6 6l12 12',
  };
  return (
    <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8} d={paths[name] ?? ''} />
    </svg>
  );
};

export const Layout: React.FC<LayoutProps> = ({
  children, currentView, setView, user, onLogout, onEditProfile,
  requestsBadgeCount = 0, validationsBadgeCount = 0, quotesBadgeCount = 0, workTypes = []
}) => {
  const [mobileOpen,      setMobileOpen]      = useState(false);
  const [openDropdown,    setOpenDropdown]    = useState<string | null>(null);
  const [userDropdown,    setUserDropdown]    = useState(false);
  const [scrolled,        setScrolled]        = useState(false);

  const dropdownRef  = useRef<HTMLDivElement>(null);
  const userDropRef  = useRef<HTMLDivElement>(null);
  const dbInfo = DbService.getDbInfo();

  const isAdmin = user.role === UserRole.ADMIN;
  const isChef  = user.role === UserRole.CHEF_CENTRE || isAdmin;

  // ── Effects ───────────────────────────────────────────
  useEffect(() => {
    const onScroll  = () => setScrolled(window.scrollY > 4);
    const onResize  = () => { if (window.innerWidth >= 1280) setMobileOpen(false); };
    window.addEventListener('scroll', onScroll,  { passive: true });
    window.addEventListener('resize', onResize);
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('resize', onResize); };
  }, []);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null);
      if (userDropRef.current  && !userDropRef.current.contains(e.target as Node))  setUserDropdown(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  // ── Nav items ─────────────────────────────────────────
  const navBadge = quotesBadgeCount > 0
    ? quotesBadgeCount
    : (requestsBadgeCount > 0 ? requestsBadgeCount : (validationsBadgeCount > 0 ? validationsBadgeCount : undefined));

  const NAV_ITEMS: NavItem[] = [
    { id: 'dashboard', label: 'Tableau De Bord', shortLabel: 'Accueil',  show: true,               icon: <Icon name="dashboard" /> },
    { id: 'requests',  label: 'Demandes',                                 show: true,   badge: navBadge, icon: <Icon name="requests"  /> },
    { id: 'list',      label: 'Chantiers',                                show: true,               icon: <Icon name="list"      /> },
    { id: 'articles',  label: 'Articles',                                 show: isChef,             icon: <Icon name="articles"  /> },
    { id: 'clients',   label: 'Clients',                                  show: true,               icon: <Icon name="clients"   /> },
    {
      id: 'structure', label: 'Structure', show: isAdmin, icon: <Icon name="structure" />,
      subItems: [{ id: 'structure', label: 'Unités & Centres' }, { id: 'agencies', label: 'Agences Commerciales' }]
    },
    { id: 'users',    label: 'Utilisateurs', show: isAdmin, icon: <Icon name="users"    /> },
    { id: 'settings', label: 'Paramètres',   show: isAdmin, icon: <Icon name="settings" /> },
  ];

  const visibleItems = NAV_ITEMS.filter(i => i.show);

  // ── Handlers ─────────────────────────────────────────
  const go = (id: string) => { setView(id); setMobileOpen(false); setOpenDropdown(null); };

  const handleNewRequest = () => {
    const allowed = workTypes.some(wt => (wt.allowedRoles ?? []).includes(user.role));
    if (!allowed) {
      Swal.fire({ title: 'Accès Refusé', text: "Vous n'êtes pas autorisé à créer des demandes.", icon: 'error', confirmButtonColor: BLUE, confirmButtonText: 'Compris' });
      return;
    }
    go('request-form');
  };

  const isActive = (item: NavItem) =>
    currentView === item.id || item.subItems?.some(s => s.id === currentView);

  // ── Shared Styles ─────────────────────────────────────
  const s = {
    navLink: (active: boolean): React.CSSProperties => ({
      display:        'flex',
      alignItems:     'center',
      gap:            '6px',
      padding:        '6px 10px',
      borderRadius:   '7px',
      border:         'none',
      background:     active ? BLUE_LIGHT : 'transparent',
      color:          active ? BLUE : '#374151',
      fontSize:       '13px',
      fontWeight:     active ? 700 : 600,
      cursor:         'pointer',
      whiteSpace:     'nowrap' as const,
      transition:     'background 0.15s, color 0.15s',
      fontFamily:     'inherit',
      flexShrink:     0,
    }),
    panel: (alignRight = false): React.CSSProperties => ({
      position:       'absolute',
      top:            'calc(100% + 10px)',
      left:           alignRight ? 'auto' : 0,
      right:          alignRight ? 0 : 'auto',
      minWidth:       '210px',
      background:     '#fff',
      borderRadius:   '10px',
      border:         `1px solid ${GRAY_BORDER}`,
      boxShadow:      '0 10px 32px -6px rgba(11,30,66,0.14)',
      padding:        '6px',
      zIndex:         200,
      animation:      'navSlide 0.18s ease',
    }),
    dropItem: (active: boolean): React.CSSProperties => ({
      display:        'block',
      width:          '100%',
      textAlign:      'left',
      padding:        '9px 14px',
      borderRadius:   '7px',
      border:         'none',
      background:     active ? BLUE_LIGHT : 'transparent',
      color:          active ? BLUE : '#374151',
      fontSize:       '13.5px',
      fontWeight:     600,
      cursor:         'pointer',
      transition:     'background 0.12s, color 0.12s',
      fontFamily:     'inherit',
    }),
  };

  return (
    <>
      <style>{`
        @keyframes navSlide {
          from { opacity: 0; transform: translateY(-6px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        /* Hamburger: hidden by default, shown < 1280px */
        .nav-hamburger { display: none !important; }
        .nav-desktop-links { display: flex !important; }
        @media (max-width: 1279px) {
          .nav-hamburger { display: flex !important; }
          .nav-desktop-links { display: none !important; }
        }
        /* CTA label: hidden < 640px */
        @media (max-width: 639px) {
          .nav-cta-label   { display: none !important; }
          .nav-user-name   { display: none !important; }
        }
        /* Mobile drawer animation */
        .nav-drawer {
          overflow: hidden;
          transition: max-height 0.32s cubic-bezier(0.4,0,0.2,1), opacity 0.22s ease;
        }
        .nav-drawer.open  { max-height: 800px; opacity: 1; }
        .nav-drawer.closed { max-height: 0; opacity: 0; }
        /* Mobile nav button */
        .mob-link {
          display: flex;
          align-items: center;
          justify-content: space-between;
          width: 100%;
          padding: 11px 14px;
          border-radius: 8px;
          border: none;
          background: transparent;
          color: #374151;
          font-size: 14px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.14s, color 0.14s;
          font-family: inherit;
        }
        .mob-link:hover { background: ${BLUE_LIGHT}; color: ${BLUE}; }
        .mob-link.active { background: ${BLUE_LIGHT}; color: ${BLUE}; font-weight: 700; }
        /* Nav link hover */
        .nav-link-btn:hover { background: ${BLUE_LIGHT} !important; color: ${BLUE} !important; }

        /* CTA icon button */
        .nav-cta-icon-btn:hover {
          background: ${BLUE_HOVER} !important;
          transform: translateY(-2px) scale(1.06) !important;
          box-shadow: 0 6px 18px rgba(21,146,239,0.40) !important;
        }
        .nav-cta-icon-btn:active {
          transform: scale(0.96) !important;
        }

        /* Tooltip */
        .nav-cta-tooltip {
          position: absolute;
          bottom: calc(100% + 10px);
          left: 50%;
          transform: translateX(-50%) translateY(4px);
          background: ${NAVY};
          color: #fff;
          padding: 5px 10px;
          border-radius: 6px;
          font-size: 11.5px;
          font-weight: 600;
          white-space: nowrap;
          pointer-events: none;
          opacity: 0;
          transition: opacity 0.18s, transform 0.18s;
          z-index: 300;
        }
        .nav-cta-tooltip::after {
          content: '';
          position: absolute;
          top: 100%;
          left: 50%;
          transform: translateX(-50%);
          border: 5px solid transparent;
          border-top-color: ${NAVY};
        }
        .nav-cta-wrap:hover .nav-cta-tooltip {
          opacity: 1;
          transform: translateX(-50%) translateY(0);
        }
      `}</style>

      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: GRAY_BG }}>

        {/* ═══════════════════════════════════════════
            NAVBAR
        ═══════════════════════════════════════════ */}
        <nav style={{
          position:     'sticky',
          top:          0,
          zIndex:       100,
          background:   '#fff',
          borderBottom: `1px solid ${scrolled ? '#d1d5db' : GRAY_BORDER}`,
          boxShadow:    scrolled ? '0 2px 16px -4px rgba(11,30,66,0.09)' : 'none',
          transition:   'box-shadow 0.3s, border-color 0.3s',
        }} className="print:hidden">
          <div style={{ maxWidth: '1600px', margin: '0 auto', padding: '0 20px' }}>
            <div style={{ display: 'flex', alignItems: 'center', height: '64px', gap: '0' }}>

              {/* ── Hamburger (mobile / tablet only) ─── */}
              <button
                className="nav-hamburger"
                onClick={() => setMobileOpen(v => !v)}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  width:          '40px',
                  height:         '40px',
                  border:         `1px solid ${GRAY_BORDER}`,
                  borderRadius:   '8px',
                  background:     'transparent',
                  cursor:         'pointer',
                  color:          NAVY,
                  marginRight:    '12px',
                  flexShrink:     0,
                }}
              >
                <Icon name={mobileOpen ? 'close' : 'menu'} />
              </button>

              {/* ── Brand ─────────────────────────────── */}
              <div
                onClick={() => go('dashboard')}
                style={{ display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer', flexShrink: 0, userSelect: 'none', marginRight: '24px' }}
              >
                <img src="/ade.png" alt="ADE" style={{ height: '34px', width: 'auto', objectFit: 'contain' }} />
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 900, color: NAVY, letterSpacing: '-0.03em', lineHeight: 1.1, textTransform: 'uppercase' }}>
                    ADE Manager
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '2px' }}>
                    <span style={{ width: '5px', height: '5px', borderRadius: '50%', background: BLUE, display: 'inline-block' }} />
                    <span style={{ fontSize: '9px', fontWeight: 700, color: '#9ca3af', letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                      {dbInfo.dbName}
                    </span>
                  </div>
                </div>
              </div>

              {/* ── Desktop Nav Links ─────────────────── */}
              <div
                ref={dropdownRef}
                className="nav-desktop-links"
                style={{ flex: 1, alignItems: 'center', gap: '2px', overflow: 'visible' }}
              >
                {visibleItems.map(item => {
                  const active = isActive(item);
                  return (
                    <div key={item.id} style={{ position: 'relative', flexShrink: 0 }}>
                      {item.subItems ? (
                        <>
                          <button
                            className="nav-link-btn"
                            style={s.navLink(active)}
                            onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                          >
                            <span style={{ color: active ? BLUE : '#c0c9d4', flexShrink: 0 }}>{item.icon}</span>
                            {item.label}
                            <span style={{ color: '#c0c9d4', display: 'inline-flex', transition: 'transform 0.2s ease', transform: openDropdown === item.id ? 'rotate(180deg)' : 'rotate(0deg)' }}>
                              <Icon name="chevron" />
                            </span>
                          </button>
                          {openDropdown === item.id && (
                            <div style={s.panel()}>
                              {item.subItems.map(sub => (
                                <button
                                  key={sub.id}
                                  style={s.dropItem(currentView === sub.id)}
                                  onClick={() => { go(sub.id); }}
                                  onMouseEnter={e => { if (currentView !== sub.id) { (e.currentTarget as HTMLButtonElement).style.background = BLUE_LIGHT; (e.currentTarget as HTMLButtonElement).style.color = BLUE; } }}
                                  onMouseLeave={e => { if (currentView !== sub.id) { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; } }}
                                >
                                  {sub.label}
                                </button>
                              ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <button
                          className="nav-link-btn"
                          style={s.navLink(active)}
                          onClick={() => setView(item.id)}
                        >
                          <span style={{ color: active ? BLUE : '#c0c9d4', flexShrink: 0 }}>{item.icon}</span>
                          {item.label}
                          {item.badge ? (
                            <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '18px', height: '18px', padding: '0 4px', borderRadius: '100px', background: '#ef4444', color: '#fff', fontSize: '10px', fontWeight: 800 }}>
                              {item.badge}
                            </span>
                          ) : null}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* ── Right: CTA + User ─────────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginLeft: 'auto', flexShrink: 0 }}>

                {/* New Request CTA — icon button with tooltip */}
                <div style={{ position: 'relative' }} className="nav-cta-wrap">
                  <button
                    onClick={handleNewRequest}
                    className="nav-cta-icon-btn"
                    title=""
                    aria-label="Nouvelle Demande"
                    style={{
                      display:        'flex',
                      alignItems:     'center',
                      justifyContent: 'center',
                      width:          '40px',
                      height:         '40px',
                      borderRadius:   '50%',
                      border:         'none',
                      background:     BLUE,
                      color:          '#fff',
                      cursor:         'pointer',
                      boxShadow:      '0 2px 10px rgba(21,146,239,0.30)',
                      transition:     'background 0.18s, transform 0.18s, box-shadow 0.18s',
                      flexShrink:     0,
                    }}
                  >
                    {/* Pencil + document icon */}
                    <svg width="18" height="18" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                        d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5
                           m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  {/* Tooltip */}
                  <div className="nav-cta-tooltip">
                    Nouvelle Demande
                  </div>
                </div>

                {/* User Dropdown */}
                <div ref={userDropRef} style={{ position: 'relative' }}>
                  <button
                    onClick={() => setUserDropdown(v => !v)}
                    style={{
                      display:     'flex',
                      alignItems:  'center',
                      gap:         '8px',
                      padding:     '5px 8px',
                      borderRadius:'8px',
                      border:      `1px solid ${GRAY_BORDER}`,
                      background:  'transparent',
                      cursor:      'pointer',
                      transition:  'background 0.15s, border-color 0.15s',
                      fontFamily:  'inherit',
                    }}
                    onMouseEnter={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = BLUE_LIGHT; b.style.borderColor = `${BLUE}44`; }}
                    onMouseLeave={e => { const b = e.currentTarget as HTMLButtonElement; b.style.background = 'transparent'; b.style.borderColor = GRAY_BORDER; }}
                  >
                    <img
                      src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                      alt="Avatar"
                      style={{ width: '30px', height: '30px', borderRadius: '6px', background: '#f3f4f6', flexShrink: 0 }}
                    />
                    <div className="nav-user-name" style={{ textAlign: 'left' }}>
                      <div style={{ fontSize: '12.5px', fontWeight: 800, color: NAVY, lineHeight: 1.2, textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{user.username}</div>
                      <div style={{ fontSize: '10px', fontWeight: 600, color: BLUE, letterSpacing: '0.04em', textTransform: 'uppercase', whiteSpace: 'nowrap' }}>{user.role}</div>
                    </div>
                    <span style={{ color: '#c0c9d4', transition: 'transform 0.2s', display: 'inline-flex', transform: userDropdown ? 'rotate(180deg)' : 'none' }}>
                      <Icon name="chevron" />
                    </span>
                  </button>

                  {userDropdown && (
                    <div style={s.panel(true)}>
                      {/* Header */}
                      <div style={{ padding: '10px 14px 12px', borderBottom: `1px solid ${GRAY_BORDER}`, marginBottom: '4px' }}>
                        <div style={{ fontSize: '10.5px', color: GRAY_TEXT, fontWeight: 600, marginBottom: '2px' }}>Session active</div>
                        <div style={{ fontSize: '13.5px', fontWeight: 800, color: NAVY }}>{user.username}</div>
                        <div style={{ fontSize: '11px', color: BLUE, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{user.role}</div>
                      </div>
                      {onEditProfile && (
                        <button
                          style={s.dropItem(false)}
                          onClick={() => { onEditProfile(); setUserDropdown(false); }}
                          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = BLUE_LIGHT; (e.currentTarget as HTMLButtonElement).style.color = BLUE; }}
                          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; (e.currentTarget as HTMLButtonElement).style.color = '#374151'; }}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><Icon name="profile" /> Mon Profil</span>
                        </button>
                      )}
                      <button
                        style={{ ...s.dropItem(false), color: '#dc2626' }}
                        onClick={() => { onLogout(); setUserDropdown(false); }}
                        onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = '#fef2f2'; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = 'transparent'; }}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '9px' }}><Icon name="logout" /> Se Déconnecter</span>
                      </button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          {/* ═══════════════════════════════════════════
              MOBILE DRAWER (< 1280px)
          ═══════════════════════════════════════════ */}
          <div
            className={`nav-drawer ${mobileOpen ? 'open' : 'closed'}`}
            style={{ borderTop: mobileOpen ? `1px solid ${GRAY_BORDER}` : 'none', background: '#fff' }}
          >
            <div style={{ padding: '12px 16px 20px', display: 'flex', flexDirection: 'column', gap: '2px' }}>

              {/* Mobile CTA */}
              <button
                onClick={handleNewRequest}
                style={{
                  display:        'flex',
                  alignItems:     'center',
                  justifyContent: 'center',
                  gap:            '8px',
                  width:          '100%',
                  padding:        '13px',
                  borderRadius:   '8px',
                  border:         'none',
                  background:     BLUE,
                  color:          '#fff',
                  fontSize:       '14px',
                  fontWeight:     700,
                  cursor:         'pointer',
                  marginBottom:   '10px',
                  boxShadow:      '0 2px 8px rgba(21,146,239,0.22)',
                  fontFamily:     'inherit',
                }}
              >
                <Icon name="plus" /> Nouvelle Demande
              </button>

              {/* Mobile links */}
              {visibleItems.map(item => {
                const active = isActive(item);
                return (
                  <div key={item.id}>
                    {item.subItems ? (
                      <>
                        <button
                          className={`mob-link${active ? ' active' : ''}`}
                          onClick={() => setOpenDropdown(openDropdown === item.id ? null : item.id)}
                        >
                          <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <span style={{ color: active ? BLUE : '#c0c9d4' }}>{item.icon}</span>
                            {item.label}
                          </span>
                          <span style={{ color: '#c0c9d4', display: 'inline-flex', transition: 'transform 0.2s', transform: openDropdown === item.id ? 'rotate(180deg)' : 'none' }}>
                            <Icon name="chevron" />
                          </span>
                        </button>
                        {openDropdown === item.id && (
                          <div style={{ paddingLeft: '32px', marginTop: '2px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
                            {item.subItems.map(sub => (
                              <button
                                key={sub.id}
                                className={`mob-link${currentView === sub.id ? ' active' : ''}`}
                                onClick={() => go(sub.id)}
                                style={{ fontSize: '13px' }}
                              >
                                <span>{sub.label}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </>
                    ) : (
                      <button
                        className={`mob-link${active ? ' active' : ''}`}
                        onClick={() => go(item.id)}
                      >
                        <span style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <span style={{ color: active ? BLUE : '#c0c9d4' }}>{item.icon}</span>
                          {item.label}
                        </span>
                        {item.badge ? (
                          <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: '20px', height: '20px', padding: '0 5px', borderRadius: '100px', background: '#ef4444', color: '#fff', fontSize: '11px', fontWeight: 800 }}>
                            {item.badge}
                          </span>
                        ) : null}
                      </button>
                    )}
                  </div>
                );
              })}

              {/* Mobile User info */}
              <div style={{
                marginTop:    '12px',
                padding:      '12px 14px',
                borderRadius: '8px',
                background:   GRAY_BG,
                border:       `1px solid ${GRAY_BORDER}`,
                display:      'flex',
                alignItems:   'center',
                gap:          '12px',
              }}>
                <img
                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.username}`}
                  alt="Avatar"
                  style={{ width: '40px', height: '40px', borderRadius: '8px', background: '#e5e7eb', flexShrink: 0 }}
                />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontSize: '13px', fontWeight: 800, color: NAVY, textTransform: 'uppercase', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.username}</div>
                  <div style={{ fontSize: '11px', fontWeight: 600, color: BLUE, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{user.role}</div>
                </div>
                {onEditProfile && (
                  <button
                    onClick={() => { onEditProfile(); setMobileOpen(false); }}
                    style={{ padding: '8px', borderRadius: '8px', border: `1px solid ${BLUE_LIGHT}`, background: BLUE_LIGHT, color: BLUE, cursor: 'pointer', flexShrink: 0 }}
                  >
                    <Icon name="profile" />
                  </button>
                )}
                <button
                  onClick={() => { onLogout(); setMobileOpen(false); }}
                  style={{ padding: '8px', borderRadius: '8px', border: '1px solid #fecaca', background: '#fef2f2', color: '#dc2626', cursor: 'pointer', flexShrink: 0 }}
                >
                  <Icon name="logout" />
                </button>
              </div>
            </div>
          </div>
        </nav>

        {/* ═══════════════ PAGE CONTENT ═══════════════ */}
        <div style={{ flex: 1 }}>{children}</div>

        {/* ═══════════════ FOOTER ═════════════════════ */}
        <footer style={{
          background:    '#fff',
          borderTop:     `1px solid ${GRAY_BORDER}`,
          padding:       '14px 20px',
          textAlign:     'center',
          fontSize:      '11px',
          fontWeight:    600,
          color:         '#9ca3af',
          letterSpacing: '0.07em',
          textTransform: 'uppercase',
        }} className="print:hidden">
          ADE Manager v3.0 — Algérie Des Eaux
        </footer>
      </div>
    </>
  );
};
