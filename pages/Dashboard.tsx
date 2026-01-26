
import React, { useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, CourseType } from '../types';
import { HOURLY_RATES } from '../constants';
import { BookOpen, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { formatDate, getCurrentDateString } from '../utils/dateUtils';
import { StudentGradesChart, InstructorPerformanceChart, GraduatedStudentsChart, FirefighterStatusChart, SubjectAveragesChart } from '../components/DashboardCharts';
import { StandardCard } from '../components/StandardCard';

export const Dashboard: React.FC = () => {
    const { classes, students, tasks, currentUser, payments, notifications, firefighters, setupTeardownAssignments, courses, users } = useStore();

    if (!currentUser) return null;

    const isManager = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;

    // --- NON-MANAGER VIEW (Personal Summary) ---
    if (!isManager) {
        const myNextClasses = classes
            .flatMap(c => c.schedule.map(s => ({ ...s, className: c.name })))
            .filter(s => s.instructorIds.includes(currentUser.id) && s.date >= getCurrentDateString())
            .sort((a, b) => a.date.localeCompare(b.date))
            .slice(0, 5);

        const myPendingTasks = tasks.filter(t => t.assigneeId === currentUser.id && t.status !== 'Concluída');

        return (
            <div className="space-y-6 animate-fade-in">
                <div className="bg-white p-6 rounded-2xl border shadow-md" style={{ borderColor: '#E5E7EB' }}>
                    <h1 className="text-3xl font-bold login-uppercase" style={{ color: '#1F2937' }}>👋 Bem-vindo, {currentUser.name.split(' ')[0]}!</h1>
                    <p className="mt-1 login-uppercase" style={{ color: '#6B7280', fontSize: '0.875rem' }}>Aqui está um resumo das suas atividades</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Next Classes Card */}
                    <StandardCard
                        accentColor="#FF6B35"
                        className="h-full relative overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20" style={{ background: '#FF6B35' }}></div>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 login-uppercase" style={{ color: '#1F2937' }}>
                            <Calendar style={{ color: '#FF6B35' }} /> Próximas Aulas
                        </h2>
                        {myNextClasses.length === 0 ? (
                            <p className="italic" style={{ color: '#9CA3AF' }}>Nenhuma aula agendada para os próximos dias.</p>
                        ) : (
                            <div className="space-y-3">
                                {myNextClasses.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-white rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer" style={{ borderColor: '#E5E7EB' }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#FF6B35'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}>
                                        <div>
                                            <p className="font-semibold" style={{ color: '#1F2937' }}>{formatDate(item.date)}</p>
                                            <p className="text-xs" style={{ color: '#6B7280' }}>{item.startTime} - {item.endTime}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium" style={{ color: '#1F2937' }}>{item.moduleId}</p>
                                            <p className="text-xs" style={{ color: '#6B7280' }}>{item.className}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </StandardCard>

                    {/* Tasks Card */}
                    <StandardCard
                        accentColor="#10B981"
                        className="h-full relative overflow-hidden transition-all duration-300 hover:shadow-lg"
                    >
                        <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-20" style={{ background: '#10B981' }}></div>
                        <h2 className="text-lg font-bold mb-4 flex items-center gap-2 login-uppercase" style={{ color: '#1F2937' }}>
                            <CheckCircle style={{ color: '#10B981' }} /> Minhas Tarefas
                        </h2>
                        {myPendingTasks.length === 0 ? (
                            <p className="italic" style={{ color: '#9CA3AF' }}>Você não tem tarefas pendentes.</p>
                        ) : (
                            <div className="space-y-3">
                                {myPendingTasks.map(task => (
                                    <div key={task.id} className="flex justify-between items-center p-3 bg-white rounded-lg border hover:shadow-md transition-all duration-200 cursor-pointer group" style={{ borderColor: '#E5E7EB' }}
                                        onMouseEnter={(e) => e.currentTarget.style.borderColor = '#10B981'}
                                        onMouseLeave={(e) => e.currentTarget.style.borderColor = '#E5E7EB'}>
                                        <div>
                                            <p className="font-medium" style={{ color: '#1F2937' }}>{task.title}</p>
                                            <p className="text-xs" style={{ color: '#6B7280' }}>Prazo: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Sem prazo'}</p>
                                        </div>
                                        <span className={`badge transition-transform group-hover:scale-110 ${task.priority === 'Alta' ? 'badge-error' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </StandardCard>
                </div>
            </div>
        );
    }

    // --- MANAGER DASHBOARD (KPIs) ---

    // 1. Financial Stats (Unified Calculation to match Finance.tsx)
    const financialStats = useMemo(() => {
        let paid = 0;
        let pending = 0;

        // Calculate schedule items (aulas)
        classes.forEach(cls => {
            const course = courses.find(c => c.id === cls.courseId);

            cls.schedule.forEach(item => {
                // Determine instructors to process (including unassigned)
                const instructorIdsToProcess = (item.instructorIds && item.instructorIds.length > 0)
                    ? item.instructorIds
                    : ['unassigned'];

                let subject = course?.subjects.find(s => s.id === item.subjectId);

                // Fallback if subject not found
                if (!subject) {
                    subject = {
                        id: 'unknown',
                        name: 'Matéria não encontrada',
                        module: item.moduleId || 'Módulo Desconhecido',
                        hours: item.duration,
                        modality: 'Teórica'
                    };
                }

                const isExempt = /Prova|Revisão/i.test(subject.name);

                let rate = subject.modality === 'Prática' ? HOURLY_RATES.PRACTICE : HOURLY_RATES.THEORY;

                // Exemption Rule: CBA-AT Módulo Resgate - Prática classes have no value
                if (course?.name?.trim() === 'CBA-AT Módulo Resgate' && subject.modality === 'Prática') {
                    rate = 0;
                }

                instructorIdsToProcess.forEach(instId => {
                    const instructorUser = instId === 'unassigned' ? null : users.find(u => u.id === instId);

                    // Logic for specific instructor rate
                    let effectiveRate = rate;
                    if (instructorUser?.role === UserRole.AUXILIAR_INSTRUCAO && subject.modality === 'Prática') {
                        effectiveRate = 37.50;
                    }
                    if (isExempt) {
                        effectiveRate = 0;
                    }

                    const effectiveValue = item.duration * effectiveRate;

                    const paymentRecord = instId === 'unassigned' ? undefined : payments.find(p => p.scheduleItemId === item.id && p.instructorId === instId);
                    const isPaid = !!paymentRecord;

                    if (isPaid) {
                        paid += effectiveValue;
                    } else {
                        pending += effectiveValue;
                    }
                });
            });
        });

        // Add setup/teardown assignments
        setupTeardownAssignments.forEach(assignment => {
            // Check if paid (checking both scheduleItemId and referenceId for compatibility)
            const paymentRecord = payments.find(p => (p.scheduleItemId === assignment.id || (p as any).referenceId === assignment.id) && p.instructorId === assignment.instructorId);
            const isPaid = !!paymentRecord;

            if (isPaid) {
                paid += assignment.totalValue;
            } else {
                pending += assignment.totalValue;
            }
        });

        return { paid, pending };
    }, [classes, courses, payments, setupTeardownAssignments, users]);

    const totalPaid = financialStats.paid;
    const realPendingValue = financialStats.pending;

    // 2. Hours Stats
    const today = new Date();
    const totalHoursTaught = classes.reduce((acc, cls) => {
        const pastItems = cls.schedule.filter(item => new Date(item.date) <= today);
        return acc + pastItems.reduce((sAcc, item) => sAcc + item.duration, 0);
    }, 0);

    return (
        <div className="space-y-8">
            <div className="flex justify-between items-end animate-slide-down">
                <div>
                </div>
                <div className="text-sm px-4 py-2 rounded-xl border shadow-sm" style={{ color: '#6B7280', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
                    <span className="login-uppercase" style={{ fontSize: '0.75rem' }}>ATUALIZADO: {new Date().toLocaleDateString()}</span>
                </div>
            </div>

            {/* KPI Cards Row - Financials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: Total Paid */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-l-4 relative overflow-hidden group hover:shadow-xl transition-all duration-300" style={{ borderColor: '#E5E7EB', borderLeftColor: '#10B981' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" style={{ background: 'rgba(16, 185, 129, 0.1)' }}></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)' }}>
                                <DollarSign size={28} style={{ color: '#10B981' }} />
                            </div>
                        </div>
                        <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>Total Pago - Instrutores</p>
                        <h3 className="text-4xl font-extrabold" style={{ color: '#1F2937' }}>R$ {totalPaid.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    </div>
                </div>

                {/* Card 2: Values to Pay */}
                <div className="bg-white p-8 rounded-2xl shadow-lg border border-l-4 relative overflow-hidden group hover:shadow-xl transition-all duration-300" style={{ borderColor: '#E5E7EB', borderLeftColor: '#FF6B35' }}>
                    <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" style={{ background: 'rgba(255, 107, 53, 0.1)' }}></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-6">
                            <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255, 107, 53, 0.1)' }}>
                                <DollarSign size={28} style={{ color: '#FF6B35' }} />
                            </div>
                        </div>
                        <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>A Pagar - Instrutores</p>
                        <h3 className="text-4xl font-extrabold" style={{ color: '#1F2937' }}>R$ {realPendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                    </div>
                </div>
            </div>

            {/* Charts Row */}
            <div className="grid grid-cols-1 gap-6">
                <FirefighterStatusChart />
                <GraduatedStudentsChart />
                <StudentGradesChart />
                <SubjectAveragesChart />
                <InstructorPerformanceChart />
            </div>


            <footer className="mt-12 text-center text-sm pb-4 login-uppercase" style={{ color: '#9CA3AF' }}>
                <p></p>
            </footer>
        </div >
    );
};
