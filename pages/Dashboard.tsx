
import React, { useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, CourseType } from '../types';
import { HOURLY_RATES } from '../constants';
import { BookOpen, DollarSign, TrendingUp, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from 'recharts';

export const Dashboard: React.FC = () => {
    const { classes, students, tasks, currentUser, payments, notifications, firefighters, setupTeardownAssignments } = useStore();

    if (!currentUser) return null;

    const isManager = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;

    // --- NON-MANAGER VIEW (Personal Summary) ---
    if (!isManager) {
        const myNextClasses = classes
            .flatMap(c => c.schedule.map(s => ({ ...s, className: c.name })))
            .filter(s => s.instructorIds.includes(currentUser.id) && new Date(s.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
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
                                            <p className="font-semibold text-gray-800">{new Date(item.date).toLocaleDateString()}</p>
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

    // 1. Financial Stats
    const totalPaid = payments.reduce((acc, p) => acc + p.amount, 0);

    // 2. Calculate Real Pending Value (dynamic calculation)
    const realPendingValue = useMemo(() => {
        let pending = 0;

        // Calculate unpaid schedule items (aulas)
        classes.forEach(cls => {
            cls.schedule.forEach(item => {
                const isPaid = payments.some(p => p.scheduleItemId === item.id);
                if (!isPaid) {
                    // Use hourly rates based on modality
                    const subject = cls.schedule.find(s => s.id === item.id);
                    const rate = subject?.moduleId?.toLowerCase().includes('prática') || subject?.moduleId?.toLowerCase().includes('pratica')
                        ? HOURLY_RATES.PRACTICE
                        : HOURLY_RATES.THEORY;
                    pending += item.duration * rate;
                }
            });
        });

        // Add unpaid setup/teardown assignments
        setupTeardownAssignments.forEach(assignment => {
            const isPaid = payments.some(p => p.scheduleItemId === assignment.id);
            if (!isPaid) {
                pending += assignment.totalValue;
            }
        });

        return pending;
    }, [classes, payments, setupTeardownAssignments]);

    // 2. Hours Stats
    const today = new Date();
    const totalHoursTaught = classes.reduce((acc, cls) => {
        const pastItems = cls.schedule.filter(item => new Date(item.date) <= today);
        return acc + pastItems.reduce((sAcc, item) => sAcc + item.duration, 0);
    }, 0);

    // 3. Charts Data: Graduated Students per Course Type
    const graduatedPerCourse = [
        { name: 'CBA-2', value: 0 },
        { name: 'CBA-2 Comp', value: 0 },
        { name: 'CBA-AT', value: 0 },
        { name: 'CBA-CE', value: 0 }
    ];

    // Re-implementation using the actual store data structure
    const { courses } = useStore();

    courses.forEach(c => {
        const classIds = classes.filter(cls => cls.courseId === c.id).map(cls => cls.id);
        const approvedCount = students.filter(s => s.classId && classIds.includes(s.classId) && s.enrollmentStatus === 'Aprovado').length;

        if (c.type === CourseType.CBA_2) graduatedPerCourse[0].value += approvedCount;
        else if (c.type === CourseType.CBA_2_COMP) graduatedPerCourse[1].value += approvedCount;
        else if (c.type === CourseType.CBA_AT) graduatedPerCourse[2].value += approvedCount;
        else if (c.type === CourseType.CBA_CE) graduatedPerCourse[3].value += approvedCount;
    });

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
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Cards will have stagger animation */}
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

                <div className="stagger-item bg-gradient-to-br from-yellow-500 to-yellow-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-yellow-100 font-medium mb-1">Atualização a Vencer</p>
                            <h3 className="text-3xl font-bold">{(() => {
                                const today = new Date();
                                const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
                                return firefighters.filter(ff => {
                                    if (!ff.lastUpdateDate) return false;
                                    const updateDate = new Date(ff.lastUpdateDate);
                                    const nextUpdate = new Date(updateDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                                    return nextUpdate >= today && nextUpdate <= in90Days;
                                }).length;
                            })()}</h3>
                        </div>
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <AlertCircle size={24} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-yellow-100">
                        <Clock size={14} className="mr-1" /> Próximos 90 dias
                    </div>
                </div>

                <div className="stagger-item bg-gradient-to-br from-red-500 to-red-600 rounded-xl shadow-lg p-6 text-white hover:shadow-2xl hover:scale-105 transition-all duration-300 cursor-pointer relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full -mr-16 -mt-16"></div>
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-red-100 font-medium mb-1">Exercício com Fogo a Vencer</p>
                            <h3 className="text-3xl font-bold">{(() => {
                                const today = new Date();
                                const in90Days = new Date(today.getTime() + 90 * 24 * 60 * 60 * 1000);
                                return firefighters.filter(ff => {
                                    if (!ff.lastFireExerciseDate) return false;
                                    const exerciseDate = new Date(ff.lastFireExerciseDate);
                                    const nextExercise = new Date(exerciseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
                                    return nextExercise >= today && nextExercise <= in90Days;
                                }).length;
                            })()}</h3>
                        </div>
                        <div className="p-2 bg-white bg-opacity-20 rounded-lg">
                            <AlertCircle size={24} className="text-white" />
                        </div>
                    </div>
                    <div className="mt-4 flex items-center text-sm text-red-100">
                        <Clock size={14} className="mr-1" /> Próximos 90 dias
                    </div>
                </div>
            </div>

            {/* KPI Cards Row 2 - Values to Pay */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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

            {/* Chart Row */}
            <div className="card-premium animate-slide-up p-6">
                <h3 className="text-lg font-bold text-gray-900 mb-6">Alunos Formados por Curso</h3>
                <div className="h-80 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={graduatedPerCourse} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} />
                            <XAxis dataKey="name" />
                            <YAxis allowDecimals={false} />
                            <Tooltip cursor={{ fill: '#f3f4f6' }} />
                            <Bar dataKey="value" name="Formados" fill="#f97316" radius={[4, 4, 0, 0]} barSize={60} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
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
