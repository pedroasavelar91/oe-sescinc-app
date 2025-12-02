
import React, { useState, useRef, useEffect } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole } from '../types';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Users, BookOpen, GraduationCap,
  ClipboardCheck, CheckSquare, DollarSign, LogOut, Menu, Shield, UserCog,
  CalendarCheck, ClipboardList, Bell, Check, X, FileBadge, Flame, Wrench, Calendar
} from 'lucide-react';

const SidebarItem = ({ icon: Icon, label, path, active, onClick }: any) => (
  <Link
    to={path}
    onClick={onClick}
    className={`group flex items-center px-4 py-3 mb-1 text-sm font-medium rounded-lg transition-all duration-200 border-l-4 ${active
      ? 'bg-gradient-to-r from-orange-50 to-white text-primary-700 shadow-sm border-primary-500'
      : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900 border-transparent'
      }`}
  >
    <Icon
      size={20}
      className={`mr-3 flex-shrink-0 transition-colors ${active ? 'text-primary-600' : 'text-gray-400 group-hover:text-gray-600'
        }`}
    />
    <span>{label}</span>
  </Link>
);

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser, logout, notifications, markNotificationAsRead, resolveSwapRequest } = useStore();
  const location = useLocation();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) {
        setNotifOpen(false);
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
  const showAttendance = isManagerOrCoord || isInstructorOrAux;
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
      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-20 lg:hidden backdrop-blur-sm"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed inset-y-0 left-0 z-30 w-64 bg-white border-r border-orange-100 transform transition-transform duration-300 ease-in-out flex flex-col
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Header Logo */}
        <div className="h-16 flex items-center px-6 border-b border-orange-100 bg-white flex-shrink-0">
          <div className="flex items-center space-x-2 text-primary-600">
            <Flame size={28} className="fill-orange-500 text-orange-600 animate-pulse-slow" />
            <span className="text-sm font-extrabold tracking-tight text-gray-900 leading-tight">
              OE-SESCINC <br /><span className="bg-clip-text text-transparent bg-gradient-to-r from-primary-600 to-orange-500">Med+ Group</span>
            </span>
          </div>
        </div>

        {/* Scrollable Nav Items */}
        <nav className="flex-1 px-4 py-6 overflow-y-auto custom-scrollbar space-y-1">
          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-2">Geral</div>
          {showDashboard && (
            <SidebarItem icon={LayoutDashboard} label="Dashboard" path="/" active={isActive('/')} onClick={() => setMobileMenuOpen(false)} />
          )}

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-6">Acadêmico</div>
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

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-6">Operacional</div>
          {showSetupTeardown && <SidebarItem icon={Wrench} label="Montagem/Desmontagem" path="/setup-teardown" active={isActive('/setup-teardown')} onClick={() => setMobileMenuOpen(false)} />}
          {showChecklists && <SidebarItem icon={ClipboardList} label="Checklists" path="/checklists" active={isActive('/checklists')} onClick={() => setMobileMenuOpen(false)} />}

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-6">Administrativo</div>
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

          <div className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 px-2 mt-6">Conta</div>
          {showProfile && <SidebarItem icon={UserCog} label="Meu Perfil" path="/profile" active={isActive('/profile')} onClick={() => setMobileMenuOpen(false)} />}
        </nav>

        {/* Footer Logout */}
        <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="flex items-center w-full px-4 py-2 text-sm font-medium text-red-600 bg-white border border-gray-200 rounded-lg hover:bg-red-50 hover:border-red-100 transition-colors"
          >
            <LogOut size={18} className="mr-3" />
            <span>Sair do Sistema</span>
          </button>
        </div>
      </aside>

      {/* Main Content Wrapper */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden lg:pl-64 transition-all duration-300">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 h-16 flex items-center justify-between px-4 sm:px-6 lg:px-8 shadow-sm flex-shrink-0 sticky top-0 z-20">
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
                  className="p-2 text-gray-400 hover:text-gray-600 relative"
                >
                  <Bell size={22} />
                  {unreadCount > 0 && (
                    <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full ring-2 ring-white"></span>
                  )}
                </button>

                {notifOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white shadow-lg rounded-lg border border-gray-200 z-50 overflow-hidden">
                    <div className="p-3 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                      <span className="font-bold text-gray-700 text-sm">Notificações</span>
                      <span className="text-xs text-gray-400">{unreadCount} não lidas</span>
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {myNotifications.length === 0 && (
                        <div className="p-4 text-center text-sm text-gray-400 italic">Sem notificações recentes.</div>
                      )}
                      {myNotifications.map(notif => (
                        <div key={notif.id} className={`p-3 border-b border-gray-50 hover:bg-gray-50 ${!notif.read ? 'bg-blue-50' : ''}`}>
                          <div className="flex justify-between items-start mb-1">
                            <h4 className="text-sm font-semibold text-gray-800">{notif.title}</h4>
                            <span className="text-[10px] text-gray-400">{new Date(notif.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          </div>
                          <p className="text-xs text-gray-600 mb-2">{notif.message}</p>

                          {/* Action Buttons for Swap Requests */}
                          {notif.type === 'swap_request' && notif.metadata?.swapRequestId && !notif.read && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => resolveSwapRequest(notif.metadata!.swapRequestId!, true)}
                                className="flex-1 bg-green-600 text-white text-xs py-1 rounded hover:bg-green-700 flex justify-center items-center gap-1"
                              >
                                <Check size={12} /> Aceitar
                              </button>
                              <button
                                onClick={() => resolveSwapRequest(notif.metadata!.swapRequestId!, false)}
                                className="flex-1 bg-red-600 text-white text-xs py-1 rounded hover:bg-red-700 flex justify-center items-center gap-1"
                              >
                                <X size={12} /> Recusar
                              </button>
                            </div>
                          )}

                          {!notif.read && notif.type !== 'swap_request' && (
                            <button
                              onClick={() => markNotificationAsRead(notif.id)}
                              className="text-[10px] text-primary-600 hover:underline mt-1"
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

            <div className="text-right hidden sm:block">
              <p className="text-sm font-semibold text-gray-900">{currentUser.name}</p>
              <p className="text-xs text-gray-500">{currentUser.role}</p>
            </div>
            <div className="h-9 w-9 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold border-2 border-white shadow-sm ring-1 ring-gray-100">
              {currentUser.name.charAt(0)}
            </div>
          </div>
        </header>

        {/* Page Content (Scrollable) */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-gray-50 scroll-smooth">
          <div className="max-w-7xl mx-auto">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};
