
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole } from '../types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardCheck, CheckSquare, DollarSign, LogOut, Menu, Shield, UserCog,
  CalendarCheck, ClipboardList, Bell, Check, X, FileBadge, Flame, Wrench, Calendar, ChevronDown, Truck, Settings, Camera
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: any) => (
  <Link
    to={path}
    onClick={onClick}
    className={`group flex items-center px-4 py-3 mb-2 text-sm font-bold rounded-xl transition-all duration-300 uppercase mx-3 ${active
      ? 'shadow-lg translate-x-1'
      : 'hover:bg-gray-50'
      }`}
    style={{
      backgroundColor: active ? '#FF6B35' : 'transparent',
      color: active ? '#FFFFFF' : '#6B7280',
      boxShadow: active ? '0 8px 20px -4px rgba(255, 107, 53, 0.5)' : 'none',
      transform: active ? 'scale(1.02)' : 'scale(1)'
    }}
    onMouseEnter={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = 'rgba(255, 107, 53, 0.08)';
        e.currentTarget.style.color = '#FF6B35';
        e.currentTarget.style.transform = 'translateX(4px)';
      }
    }}
    onMouseLeave={(e) => {
      if (!active) {
        e.currentTarget.style.backgroundColor = 'transparent';
        e.currentTarget.style.color = '#6B7280';
        e.currentTarget.style.transform = 'translateX(0)';
      }
    }}
  >
    <Icon
      size={20}
      className="mr-3 flex-shrink-0 transition-colors duration-300"
      style={{ color: active ? '#FFFFFF' : 'currentColor' }}
    />
    <span className="tracking-wide">{label}</span>
  </Link>
);

const CategorySection = ({ title, isOpen, onToggle, children }: { title: string; isOpen: boolean; onToggle: () => void; children: React.ReactNode }) => (
  <div className="mb-4">
    <button
      type="button"
      onClick={onToggle}
      className="w-full flex items-center justify-between px-2 py-2 text-xs font-semibold uppercase tracking-wider transition-all duration-200 cursor-pointer select-none outline-none focus:outline-none"
      style={{ color: '#9CA3AF' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.color = '#FF6B35';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.color = '#9CA3AF';
      }}
    >
      <span className="flex-1 text-left">{title}</span>
      <ChevronDown
        size={14}
        className={`chevron-rotate ${isOpen ? 'chevron-open' : ''}`}
        style={{ color: '#FF6B35', opacity: 0.6 }}
      />
    </button>
    <div
      className="category-collapse"
      style={{
        maxHeight: isOpen ? '1000px' : '0',
        opacity: isOpen ? 1 : 0
      }}
    >
      <div className="mt-2">
        {children}
      </div>
    </div>
  </div>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, notifications, markNotificationAsRead, resolveSwapRequest } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);

  // Single state for accordion behavior
  const [openSection, setOpenSection] = useState<string | null>(() => {
    return localStorage.getItem('sidebar_open_section') || 'geral';
  });

  const toggleSection = (section: string) => {
    setOpenSection(prev => prev === section ? null : section);
  };

  useEffect(() => {
    if (openSection) {
      localStorage.setItem('sidebar_open_section', openSection);
    } else {
      localStorage.removeItem('sidebar_open_section');
    }
  }, [openSection]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  if (!currentUser) return <>{children}</>;

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const role = currentUser.role;
  const isManagerOrCoord = role === UserRole.GESTOR || role === UserRole.COORDENADOR;
  const isInstructorOrAux = role === UserRole.INSTRUTOR || role === UserRole.AUXILIAR_INSTRUCAO;
  const isAmbassador = role === UserRole.EMBAIXADOR;
  const isDriver = role === UserRole.MOTORISTA;

  // Visibility Logic
  const showDashboard = isManagerOrCoord;
  const showCourses = isManagerOrCoord || isInstructorOrAux;
  const showClasses = isManagerOrCoord || isInstructorOrAux;
  const showStudents = isManagerOrCoord;
  const showAttendance = isManagerOrCoord || isInstructorOrAux; // Explicitly includes Coordenador and Auxiliar
  const showEvaluations = isManagerOrCoord || isInstructorOrAux;
  const showCertificates = isManagerOrCoord || isAmbassador;
  const showSetupTeardown = isManagerOrCoord;
  const showChecklists = isManagerOrCoord || isInstructorOrAux || isDriver;
  const showDocuments = isManagerOrCoord || isInstructorOrAux || isDriver;
  const showTasks = isManagerOrCoord || isInstructorOrAux || isDriver;
  const showFinance = isManagerOrCoord || isInstructorOrAux;
  const showFirefighters = isManagerOrCoord || isAmbassador;
  const showUsers = isManagerOrCoord;
  const showQuestionBank = isManagerOrCoord || isInstructorOrAux;
  const showProfile = true;

  // Helper to determine active state (exact match for root, startsWith for others)
  const isActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  const unreadCount = notifications.filter(n => n.userId === currentUser.id && !n.read).length;
  const myNotifications = notifications.filter(n => n.userId === currentUser.id).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      <style>{`
        @keyframes notification-pulse {
          0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 53, 0.7); }
          50% { transform: scale(1.1); box-shadow: 0 0 0 10px rgba(255, 107, 53, 0); }
          100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(255, 107, 53, 0); }
        }
        .notification-active {
          animation: notification-pulse 2s infinite;
        }
        /* Custom Scrollbar for Sidebar */
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background-color: rgba(156, 163, 175, 0.5);
          border-radius: 20px;
        }
        .chevron-rotate {
          transition: transform 0.3s ease;
        }
        .chevron-rotate.chevron-open {
          transform: rotate(180deg);
        }
        .category-collapse {
          overflow: hidden;
          transition: max-height 0.3s ease-in-out, opacity 0.3s ease-in-out;
        }
      `}</style>
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar - Corporate Layered Design */}
      {/* Sidebar - Unified Corporate Design */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-72 bg-white transform transition-transform duration-300 ease-in-out flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `} style={{ boxShadow: '4px 0 24px 0 rgba(0, 0, 0, 0.08)' }}>

        {/* Logo Area */}
        <div className="h-20 flex items-center px-6 flex-shrink-0 bg-white transition-all duration-300">
          <div className="flex items-center justify-center w-full">
            <span className="text-sm font-extrabold tracking-tight leading-tight text-center">
              <span style={{ color: '#1F2937', fontSize: '1.25rem', letterSpacing: '-0.02em' }}>OE-SESCINC</span> <br />
              <span className="bg-clip-text text-transparent bg-gradient-to-r uppercase text-[10px] tracking-[0.2em] font-bold" style={{ backgroundImage: 'linear-gradient(to right, #FF6B35, #FF8C42)' }}>Med+ Group</span>
            </span>
          </div>
        </div>

        {/* Menu Area */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar bg-white">
          {/* GERAL - Collapsible */}
          <CategorySection title="Geral" isOpen={openSection === 'geral'} onToggle={() => toggleSection('geral')}>
            {showDashboard && (
              <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={isActive('/')} onClick={() => setMobileMenuOpen(false)} />
            )}
          </CategorySection>

          {/* ACADÊMICO - Collapsible */}
          <CategorySection title="Acadêmico" isOpen={openSection === 'academico'} onToggle={() => toggleSection('academico')}>
            {showCourses && <SidebarItem icon={BookOpen} label="Cursos" path="/courses" active={isActive('/courses')} onClick={() => setMobileMenuOpen(false)} />}
            {showClasses && <SidebarItem icon={GraduationCap} label="Turmas" path="/classes" active={isActive('/classes')} onClick={() => setMobileMenuOpen(false)} />}
            {showStudents && <SidebarItem icon={Users} label="Alunos" path="/students" active={isActive('/students')} onClick={() => setMobileMenuOpen(false)} />}
            {showAttendance && <SidebarItem icon={CalendarCheck} label="Frequência" path="/attendance" active={isActive('/attendance')} onClick={() => setMobileMenuOpen(false)} />}
            {showEvaluations && <SidebarItem icon={ClipboardCheck} label="Avaliações" path="/evaluations" active={isActive('/evaluations')} onClick={() => setMobileMenuOpen(false)} />}
            {showCertificates && (
              <SidebarItem icon={FileBadge} label="Certificados" path="/certificates" active={isActive('/certificates')} onClick={() => setMobileMenuOpen(false)} />
            )}
            {showQuestionBank && (
              <SidebarItem icon={BookOpen} label="Banco de Questões" path="/question-bank" active={isActive('/question-bank')} onClick={() => setMobileMenuOpen(false)} />
            )}
          </CategorySection>

          {/* OPERACIONAL - Collapsible */}
          <CategorySection title="Operacional" isOpen={openSection === 'operacional'} onToggle={() => toggleSection('operacional')}>
            {showSetupTeardown && <SidebarItem icon={Wrench} label="Mobilização" path="/setup-teardown" active={isActive('/setup-teardown')} onClick={() => setMobileMenuOpen(false)} />}
            {(isManagerOrCoord || isDriver) && <SidebarItem icon={Truck} label="Checklist - Med Truck" path="/checklist-medtruck" active={isActive('/checklist-medtruck')} onClick={() => setMobileMenuOpen(false)} />}
            {(isManagerOrCoord || isInstructorOrAux) && <SidebarItem icon={Settings} label="Checklist - Equipamentos" path="/checklist-equipamentos" active={isActive('/checklist-equipamentos')} onClick={() => setMobileMenuOpen(false)} />}
            {(isManagerOrCoord || isInstructorOrAux) && <SidebarItem icon={BookOpen} label="Checklist - Curso" path="/checklist-curso" active={isActive('/checklist-curso')} onClick={() => setMobileMenuOpen(false)} />}
            {(isManagerOrCoord || isInstructorOrAux) && <SidebarItem icon={Camera} label="Fotos" path="/class-photos" active={isActive('/class-photos')} onClick={() => setMobileMenuOpen(false)} />}
          </CategorySection>

          {/* ADMINISTRATIVO - Collapsible */}
          <CategorySection title="Administrativo" isOpen={openSection === 'administrativo'} onToggle={() => toggleSection('administrativo')}>
            {showDocuments && <SidebarItem icon={FileBadge} label="Documentos" path="/documents" active={isActive('/documents')} onClick={() => setMobileMenuOpen(false)} />}
            <SidebarItem icon={Calendar} label="Cronograma" path="/schedule" active={isActive('/schedule')} onClick={() => setMobileMenuOpen(false)} />
            {showTasks && <SidebarItem icon={CheckSquare} label="Tarefas" path="/tasks" active={isActive('/tasks')} onClick={() => setMobileMenuOpen(false)} />}
            {showFinance && <SidebarItem icon={DollarSign} label="Financeiro" path="/finance" active={isActive('/finance')} onClick={() => setMobileMenuOpen(false)} />}
            {showFirefighters && (
              <SidebarItem icon={Flame} label="Bombeiros" path="/firefighters" active={isActive('/firefighters')} onClick={() => setMobileMenuOpen(false)} />
            )}
            {showUsers && (
              <SidebarItem icon={Users} label="Usuários" path="/users" active={isActive('/users')} onClick={() => setMobileMenuOpen(false)} />
            )}
          </CategorySection>
        </nav>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-72 relative bg-gray-50/50">
        {/* Header - Unified Level with Sidebar */}
        <header className="h-20 flex items-center justify-between px-4 sm:px-6 lg:px-8 flex-shrink-0 sticky top-0 z-30 transition-all duration-300"
          style={{ backgroundColor: '#FFFFFF', boxShadow: '0 4px 20px -5px rgba(0, 0, 0, 0.08)', borderBottom: '1px solid #F3F4F6' }}>
          <button onClick={() => setMobileMenuOpen(true)} className="lg:hidden text-gray-500 hover:text-gray-700 p-2 rounded-md hover:bg-gray-100">
            <Menu size={24} />
          </button>

          <div className="flex items-center justify-end w-full space-x-4">
            {/* Notifications */}
            <div className="flex items-center space-x-3">
              {/* Notifications Wrapper */}
              <div className="relative" ref={notifRef}>
                <button
                  onClick={() => setNotifOpen(!notifOpen)}
                  className={`p-2 rounded-lg transition-all duration-200 icon-hover-glow relative ${unreadCount > 0 ? 'notification-active' : ''}`}
                  style={{ color: '#FF6B35' }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = 'rgba(255, 107, 53, 0.1)'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold text-white notification-badge-pulse" style={{ backgroundColor: '#FF6B35' }}>
                      {unreadCount}
                    </span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-96 rounded-xl shadow-2xl overflow-hidden dropdown-animate z-50" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                    <div className="max-h-96 overflow-y-auto">
                      {myNotifications.length === 0 && (
                        <div className="p-6 text-center text-sm text-gray-400 italic uppercase">Sem notificações recentes.</div>
                      )}
                      {myNotifications.map((notif, index) => (
                        <div
                          key={notif.id}
                          className={`notification-item p-6 border-b transition-all duration-200 cursor-pointer uppercase ${!notif.read ? 'border-l-4' : ''}`}
                          style={{
                            borderBottomColor: '#F3F4F6',
                            borderLeftColor: !notif.read ? '#FF6B35' : 'transparent',
                            backgroundColor: !notif.read ? 'rgba(255, 107, 53, 0.03)' : '#FFFFFF'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.backgroundColor = 'rgba(255, 107, 53, 0.05)';
                            e.currentTarget.style.transform = 'translateX(4px)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = !notif.read ? 'rgba(255, 107, 53, 0.03)' : '#FFFFFF';
                            e.currentTarget.style.transform = 'translateX(0)';
                          }}
                        >
                          <div className="flex justify-between items-start mb-2">
                            <h4 className="text-base font-bold text-gray-900">{notif.title}</h4>
                            <span className="text-xs text-gray-500 font-medium">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-sm text-gray-700 mb-3 font-medium">{notif.message}</p>

                          {/* Action Buttons for Swap Requests */}
                          {notif.type === 'swap_request' && notif.metadata?.swapRequestId && !notif.read && (
                            <div className="flex gap-3 mt-3">
                              <button
                                onClick={() => resolveSwapRequest(notif.metadata!.swapRequestId!, true)}
                                className="flex-1 bg-green-600 text-white text-xs py-2 rounded hover:bg-green-700 flex justify-center items-center gap-1 font-bold uppercase"
                              >
                                <Check size={14} /> Aceitar
                              </button>
                              <button
                                onClick={() => resolveSwapRequest(notif.metadata!.swapRequestId!, false)}
                                className="flex-1 bg-red-600 text-white text-xs py-2 rounded hover:bg-red-700 flex justify-center items-center gap-1 font-bold uppercase"
                              >
                                <X size={14} /> Recusar
                              </button>
                            </div>
                          )}

                          {!notif.read && notif.type !== 'swap_request' && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-xs font-bold hover:underline mt-1 transition-colors uppercase"
                              style={{ color: '#FF6B35' }}
                            >
                              Marcar como lida
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen(!profileOpen)}
                className="flex items-center space-x-3 focus:outline-none"
              >
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
                  <p className="text-xs login-uppercase" style={{ color: '#6B7280' }}>
                    {currentUser.role ? currentUser.role.toUpperCase() : currentUser.role}
                  </p>
                </div>
                {currentUser.photoUrl ? (
                  <img
                    src={currentUser.photoUrl}
                    alt={currentUser.name}
                    className="h-10 w-10 rounded-full object-cover shadow-md transition-all duration-200 cursor-pointer hover:shadow-lg"
                    style={{ border: '2px solid #FF6B35' }}
                  />
                ) : (
                  <div className="h-10 w-10 rounded-full flex items-center justify-center font-bold shadow-md transition-all duration-200 cursor-pointer hover:shadow-lg" style={{ backgroundColor: 'rgba(255, 107, 53, 0.1)', color: '#FF6B35', border: '2px solid #FF6B35' }}>
                    {currentUser.name.charAt(0)}
                  </div>
                )}
              </button>

              {profileOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-xl shadow-2xl overflow-hidden profile-dropdown-animate z-50 card-premium" style={{ backgroundColor: '#FFFFFF', border: 'none' }}>
                  <div className="py-2">
                    <button
                      onClick={() => {
                        navigate('/profile');
                        setProfileOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center space-x-3 transition-all duration-200 hover:bg-gray-50"
                      style={{ color: '#1F2937' }}
                    >
                      <UserCog size={18} style={{ color: '#FF6B35' }} />
                      <span className="text-sm font-semibold login-uppercase">MEU PERFIL</span>
                    </button>

                    <div className="mx-3 my-1 border-t border-gray-100"></div>

                    <button
                      onClick={() => {
                        handleLogout();
                        setProfileOpen(false);
                      }}
                      className="w-full px-4 py-3 text-left flex items-center space-x-3 transition-all duration-200 hover:bg-gray-50"
                      style={{ color: '#1F2937' }}
                    >
                      <LogOut size={18} style={{ color: '#FF6B35' }} />
                      <span className="text-sm font-semibold login-uppercase">SAIR</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Page Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 scroll-smooth" style={{ backgroundColor: '#FFFFFF' }}>
          <div className={`mx-auto ${location.pathname === '/students' || location.pathname === '/setup-teardown' || location.pathname === '/finance' || location.pathname === '/tasks' || location.pathname === '/schedule' || location.pathname === '/attendance' ? 'max-w-full' : 'max-w-7xl'}`}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
