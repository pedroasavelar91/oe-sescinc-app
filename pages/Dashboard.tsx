
import React, { useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, CourseType } from '../types';
import { HOURLY_RATES } from '../constants';
import { BookOpen, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import { formatDate, getCurrentDateString } from '../utils/dateUtils';
import { StudentGradesChart, InstructorPerformanceChart, GraduatedStudentsChart, FirefighterStatusChart, SubjectAveragesChart } from '../components/DashboardCharts';

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
                <div className="gradient-primary-soft p-6 rounded-xl border border-primary-100">
                    <h1 className="text-3xl font-bold text-gray-900">👋 Bem-vindo, {currentUser.name.split(' ')[0]}!</h1>
                    <p className="text-gray-600 mt-1">Aqui está um resumo das suas atividades</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Next Classes Card */}
                    <div className="card-premium stagger-item hover:border-primary-200 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-primary-50 rounded-bl-full opacity-50"></div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <Calendar className="text-primary-600" /> Próximas Aulas
                        </h2>
                        {myNextClasses.length === 0 ? (
                            <p className="text-gray-500 italic">Nenhuma aula agendada para os próximos dias.</p>
                        ) : (
                            <div className="space-y-3">
                                {myNextClasses.map(item => (
                                    <div key={item.id} className="flex justify-between items-center p-3 bg-gradient-gray rounded-lg border border-gray-200 hover:shadow-md hover:border-primary-200 transition-all duration-200 cursor-pointer">
                                        <div>
                                            <p className="font-semibold text-gray-800">{formatDate(item.date)}</p>
                                            <p className="text-xs text-gray-500">{item.startTime} - {item.endTime}</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-medium text-gray-900">{item.moduleId}</p>
                                            <p className="text-xs text-gray-500">{item.className}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Tasks Card */}
                    <div className="card-premium stagger-item hover:border-green-200 transition-all duration-300">
                        <div className="absolute top-0 right-0 w-20 h-20 bg-green-50 rounded-bl-full opacity-50"></div>
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                            <CheckCircle className="text-green-600" /> Minhas Tarefas
                        </h2>
                        {myPendingTasks.length === 0 ? (
                            <p className="text-gray-500 italic">Você não tem tarefas pendentes.</p>
                        ) : (
                            <div className="space-y-3">
                                {myPendingTasks.map(task => (
                                    <div key={task.id} className="flex justify-between items-center p-3 bg-gradient-gray rounded-lg border border-gray-200 hover:shadow-md hover:border-green-200 transition-all duration-200 cursor-pointer group">
                                        <div>
                                            <p className="font-medium text-gray-800">{task.title}</p>
                                            <p className="text-xs text-gray-500">Prazo: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Sem prazo'}</p>
                                        </div>
                                        <span className={`badge transition-transform group-hover:scale-110 ${task.priority === 'Alta' ? 'badge-error' : 'bg-gray-200 text-gray-700 border border-gray-300'}`}>
                                            {task.priority}
                                        </span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // --- MANAGER DASHBOARD (KPIs) ---

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
                    <h1 className="text-3xl font-bold text-gray-900">Dashboard Executivo</h1>
                    <p className="text-gray-500 mt-1">Visão geral de performance e indicadores.</p>
                </div>
                <div className="text-sm text-gray-500 bg-white px-3 py-1 rounded border shadow-sm">
                    Atualizado: {new Date().toLocaleDateString()}
                </div>
            </div>

            {/* KPI Cards Row 1 - Financials & Hours */}
            {/* KPI Cards Row - Financials */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Card 1: Total Paid */}
                <div className="stagger-item bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-green-100 font-medium mb-1">Total Pago (Instrutores)</p>
                            <h3 className="text-3xl font-bold">R$ {totalPaid.toLocaleString('pt-BR')}</h3>
                        </div>
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <DollarSign size={24} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-green-100">
                        <CheckCircle size={14} className="mr-1" /> 100% em dia
                    </div>
                </div>

                {/* Card 2: Values to Pay */}
                <div className="stagger-item bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-orange-100 font-medium mb-1">Valores a Pagar</p>
                            <h3 className="text-3xl font-bold">R$ {realPendingValue.toLocaleString('pt-BR')}</h3>
                        </div>
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <DollarSign size={24} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-orange-100">
                        <AlertCircle size={14} className="mr-1" /> Pendente
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

            {/* Lower Section: Recent Activity */}
            <div className="card-premium overflow-hidden animate-slide-up">
                <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                    <h3 className="font-bold text-gray-800">Atividades Recentes</h3>
                </div>
                <div className="p-6">
                    <div className="space-y-4">
                        {(() => {
                            const recentActivities = [
                                ...tasks.filter(t => t.status === 'Concluída').slice(-3).map(t => ({
                                    icon: <CheckCircle size={18} className="text-green-600" />,
                                    title: `Tarefa concluída: ${t.title}`,
                                    time: new Date(t.logs?.[t.logs.length - 1]?.timestamp || Date.now()).toLocaleString('pt-BR'),
                                    bgColor: 'bg-green-50'
                                })),
                                ...notifications.filter(n => !n.read).slice(0, 3).map(n => ({
                                    icon: <AlertCircle size={18} className="text-blue-600" />,
                                    title: n.title,
                                    time: new Date(n.timestamp).toLocaleString('pt-BR'),
                                    bgColor: 'bg-blue-50'
                                }))
                            ].sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()).slice(0, 5);

                            if (recentActivities.length === 0) {
                                return (
                                    <p className="text-gray-500 italic text-center py-8">Nenhuma atividade recente</p>
                                );
                            }

                            return recentActivities.map((activity, i) => (
                                <div key={i} className="flex items-center space-x-4 pb-4 border-b border-gray-100 last:border-0 last:pb-0 hover:bg-gray-50 -mx-6 px-6 py-3 transition-colors cursor-pointer rounded-lg">
                                    <div className={`h-10 w-10 rounded-full ${activity.bgColor} flex items-center justify-center`}>
                                        {activity.icon}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm font-medium text-gray-900">{activity.title}</p>
                                        <p className="text-xs text-gray-500">{activity.time}</p>
                                    </div>
                                </div>
                            ));
                        })()}
                    </div>
                </div>
            </div>


            <footer className="mt-12 text-center text-gray-400 text-sm pb-4">
                <p>Criado por Manifold IA.</p>
            </footer>
        </div >
    );
};
