import React, { useState, useMemo } from 'react';
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    Cell, ComposedChart, Line, Legend, Area, AreaChart
} from 'recharts';
import { useStore } from '../context/AppStore';
import { CourseType, UserRole } from '../types';
import { BookOpen, Users, Award, TrendingUp, Filter, AlertCircle, Calendar, MapPin } from 'lucide-react';

// --- Custom Tooltip Component ---
const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
        return (
            <div className="bg-white/90 backdrop-blur-md p-4 rounded-xl shadow-xl border border-gray-100">
                <p className="font-bold text-gray-800 mb-2">{label}</p>
                {payload.map((entry: any, index: number) => (
                    <div key={index} className="flex items-center gap-2 text-sm">
                        <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: entry.color || entry.fill || entry.stroke }}
                        />
                        <span className="text-gray-600">{entry.name}:</span>
                        <span className="font-bold text-gray-900">
                            {typeof entry.value === 'number'
                                ? (entry.name.includes('Média') || entry.name.includes('Nota') ? entry.value.toFixed(1) : entry.value)
                                : entry.value}
                        </span>
                    </div>
                ))}
            </div>
        );
    }
    return null;
};

// --- Firefighter Status Chart ---
export const FirefighterStatusChart: React.FC = () => {
    const { firefighters } = useStore();
    const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
    const [baseFilter, setBaseFilter] = useState<string>('all');
    const [viewMode, setViewMode] = useState<'month' | 'base'>('month');

    // Get unique bases for filter
    const bases = useMemo(() => {
        const uniqueBases = new Set(firefighters.map(f => f.base).filter(Boolean));
        return Array.from(uniqueBases).sort();
    }, [firefighters]);

    const data = useMemo(() => {
        // Use real data if available, otherwise use rich mock data





        let filteredFirefighters = firefighters;
        if (baseFilter !== 'all') {
            filteredFirefighters = firefighters.filter(f => f.base === baseFilter);
        }

        if (viewMode === 'month') {
            const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
            const stats = months.map(m => ({ name: m, updates: 0, exercises: 0 }));

            filteredFirefighters.forEach(ff => {
                if (ff.lastUpdateDate) {
                    const date = new Date(ff.lastUpdateDate);
                    const expDate = new Date(date.setFullYear(date.getFullYear() + 1));
                    if (expDate.getFullYear().toString() === yearFilter) {
                        stats[expDate.getMonth()].updates++;
                    }
                }
                if (ff.lastFireExerciseDate) {
                    const date = new Date(ff.lastFireExerciseDate);
                    const expDate = new Date(date.setFullYear(date.getFullYear() + 1));
                    if (expDate.getFullYear().toString() === yearFilter) {
                        stats[expDate.getMonth()].exercises++;
                    }
                }
            });
            return stats;
        } else {
            // Group by Base
            const baseStats = new Map<string, { updates: number; exercises: number }>();

            filteredFirefighters.forEach(ff => {
                const base = ff.base || 'Sem Base';
                if (!baseStats.has(base)) baseStats.set(base, { updates: 0, exercises: 0 });
                const stats = baseStats.get(base)!;

                if (ff.lastUpdateDate) {
                    const date = new Date(ff.lastUpdateDate);
                    const expDate = new Date(date.setFullYear(date.getFullYear() + 1));
                    if (expDate.getFullYear().toString() === yearFilter) {
                        stats.updates++;
                    }
                }
                if (ff.lastFireExerciseDate) {
                    const date = new Date(ff.lastFireExerciseDate);
                    const expDate = new Date(date.setFullYear(date.getFullYear() + 1));
                    if (expDate.getFullYear().toString() === yearFilter) {
                        stats.exercises++;
                    }
                }
            });

            return Array.from(baseStats.entries()).map(([name, stats]) => ({
                name,
                updates: stats.updates,
                exercises: stats.exercises
            })).sort((a, b) => (b.updates + b.exercises) - (a.updates + a.exercises));
        }
    }, [firefighters, yearFilter, viewMode, baseFilter]);

    return (
        <div className="card-premium p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <AlertCircle className="text-red-500" size={20} />
                        Vencimentos Bombeiros
                    </h3>
                    <p className="text-sm text-gray-500">Atualizações e Exercícios com Fogo a Vencer</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="input-field py-1.5 text-sm w-24"
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                    <select
                        value={baseFilter}
                        onChange={(e) => setBaseFilter(e.target.value)}
                        className="input-field py-1.5 text-sm w-32"
                    >
                        <option value="all">Todas Bases</option>
                        {bases.map(base => (
                            <option key={base} value={base}>{base}</option>
                        ))}
                    </select>
                    <select
                        value={viewMode}
                        onChange={(e) => setViewMode(e.target.value as any)}
                        className="input-field py-1.5 text-sm w-32"
                    >
                        <option value="month">Por Mês</option>
                        <option value="base">Por Base</option>
                    </select>
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <defs>
                            <linearGradient id="colorUpdates" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#eab308" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#eab308" stopOpacity={0.1} />
                            </linearGradient>
                            <linearGradient id="colorExercises" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#ef4444" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#ef4444" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff7ed' }} />
                        <Legend />
                        <Bar dataKey="updates" name="Atualização" fill="url(#colorUpdates)" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                        <Bar dataKey="exercises" name="Exercício Fogo" fill="url(#colorExercises)" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Graduated Students Chart ---
export const GraduatedStudentsChart: React.FC = () => {
    const { classes, students, courses } = useStore();
    const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());

    const data = useMemo(() => {




        const classesInYear = classes.filter(c =>
            new Date(c.startDate).getFullYear().toString() === yearFilter ||
            new Date(c.endDate).getFullYear().toString() === yearFilter
        );
        const classIdsInYear = classesInYear.map(c => c.id);

        return Object.values(CourseType).map(type => {
            const courseIds = courses.filter(c => c.type === type).map(c => c.id);
            const relevantStudents = students.filter(s =>
                s.classId &&
                classIdsInYear.includes(s.classId) &&
                courseIds.includes(courses.find(c => c.id === classes.find(cls => cls.id === s.classId)?.courseId)?.id || '')
            );

            return {
                name: type,
                Aprovado: relevantStudents.filter(s => s.enrollmentStatus === 'Aprovado').length,
                Reprovado: relevantStudents.filter(s => s.enrollmentStatus === 'Reprovado').length,
                Desligado: relevantStudents.filter(s => s.enrollmentStatus === 'Desligado' || s.enrollmentStatus === 'Cancelado').length,
            };
        }).filter(item => (item.Aprovado + item.Reprovado + item.Desligado) > 0);
    }, [classes, students, courses, yearFilter]);

    return (
        <div className="card-premium p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Users className="text-blue-500" size={20} />
                        Situação dos Alunos
                    </h3>
                    <p className="text-sm text-gray-500">Status por Curso</p>
                </div>
                <select
                    value={yearFilter}
                    onChange={(e) => setYearFilter(e.target.value)}
                    className="input-field py-1.5 text-sm w-32"
                >
                    <option value="2024">2024</option>
                    <option value="2025">2025</option>
                </select>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#eff6ff' }} />
                        <Legend />
                        <Bar dataKey="Aprovado" name="Aprovados" fill="#10b981" radius={[4, 4, 0, 0]} barSize={30} animationDuration={1500} />
                        <Bar dataKey="Reprovado" name="Reprovados" fill="#ef4444" radius={[4, 4, 0, 0]} barSize={30} animationDuration={1500} />
                        <Bar dataKey="Desligado" name="Desligados" fill="#9ca3af" radius={[4, 4, 0, 0]} barSize={30} animationDuration={1500} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Student Grades Chart (By Class) ---
export const StudentGradesChart: React.FC = () => {
    const { students, classes } = useStore();
    const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
    const [classFilter, setClassFilter] = useState<string>('all');

    const data = useMemo(() => {




        // Filter classes by Year
        let relevantClasses = classes.filter(c =>
            new Date(c.startDate).getFullYear().toString() === yearFilter ||
            new Date(c.endDate).getFullYear().toString() === yearFilter
        );

        if (classFilter !== 'all') {
            relevantClasses = relevantClasses.filter(c => c.id === classFilter);
        }

        return relevantClasses.map(cls => {
            const classStudents = students.filter(s => s.classId === cls.id);
            const count = classStudents.length;

            if (count === 0) return null;

            const avgFinal = classStudents.reduce((acc, s) => acc + (s.finalGrade || 0), 0) / count;
            const avgTheory = classStudents.reduce((acc, s) => acc + (s.finalTheory || 0), 0) / count;
            const avgPractice = classStudents.reduce((acc, s) => acc + (s.finalPractical || 0), 0) / count;

            return {
                name: cls.name,
                'Média Final': Number(avgFinal.toFixed(1)),
                'Média Teórica': Number(avgTheory.toFixed(1)),
                'Média Prática': Number(avgPractice.toFixed(1)),
            };
        }).filter(item => item !== null);

    }, [students, classes, yearFilter, classFilter]);

    return (
        <div className="card-premium p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <Award className="text-orange-500" size={20} />
                        Desempenho por Turma
                    </h3>
                    <p className="text-sm text-gray-500">Médias por Turma</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="input-field py-1.5 text-sm w-24"
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                    <select
                        value={classFilter}
                        onChange={(e) => setClassFilter(e.target.value)}
                        className="input-field py-1.5 text-sm w-40"
                    >
                        <option value="all">Todas as Turmas</option>
                        {classes.filter(c => new Date(c.startDate).getFullYear().toString() === yearFilter).map(c => (
                            <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                    </select>
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#6b7280', fontSize: 12 }} />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} domain={[0, 10]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#fff7ed' }} />
                        <Legend />
                        <Bar dataKey="Média Final" fill="#f97316" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                        <Bar dataKey="Média Teórica" fill="#3b82f6" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                        <Bar dataKey="Média Prática" fill="#10b981" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Subject Averages Chart (New) ---
export const SubjectAveragesChart: React.FC = () => {
    const { students, courses, classes } = useStore();
    const [yearFilter, setYearFilter] = useState<string>(new Date().getFullYear().toString());
    const [courseFilter, setCourseFilter] = useState<string>(Object.values(CourseType)[0]);

    const data = useMemo(() => {




        // Filter students by Year and Course
        const classesInYear = classes.filter(c =>
            (new Date(c.startDate).getFullYear().toString() === yearFilter ||
                new Date(c.endDate).getFullYear().toString() === yearFilter) &&
            courses.find(course => course.id === c.courseId)?.type === courseFilter
        );
        const classIds = classesInYear.map(c => c.id);
        const relevantStudents = students.filter(s => s.classId && classIds.includes(s.classId));

        const subjectStats = new Map<string, { total: number; count: number }>();

        relevantStudents.forEach(s => {
            if (!s.grades) return;
            Object.entries(s.grades).forEach(([key, value]) => {
                if (typeof value === 'number') {
                    const current = subjectStats.get(key) || { total: 0, count: 0 };
                    subjectStats.set(key, { total: current.total + value, count: current.count + 1 });
                }
            });
        });

        return Array.from(subjectStats.entries()).map(([name, stats]) => ({
            name,
            average: Number((stats.total / stats.count).toFixed(1))
        })).sort((a, b) => b.average - a.average);

    }, [students, courses, classes, yearFilter, courseFilter]);

    return (
        <div className="card-premium p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <BookOpen className="text-purple-500" size={20} />
                        Médias por Matéria
                    </h3>
                    <p className="text-sm text-gray-500">Desempenho por Disciplina</p>
                </div>
                <div className="flex gap-2">
                    <select
                        value={yearFilter}
                        onChange={(e) => setYearFilter(e.target.value)}
                        className="input-field py-1.5 text-sm w-24"
                    >
                        <option value="2024">2024</option>
                        <option value="2025">2025</option>
                    </select>
                    <select
                        value={courseFilter}
                        onChange={(e) => setCourseFilter(e.target.value)}
                        className="input-field py-1.5 text-sm w-32"
                    >
                        {Object.values(CourseType).map(t => <option key={t} value={t}>{t}</option>)}
                    </select>
                </div>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 50 }}>
                        <defs>
                            <linearGradient id="colorSubject" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} domain={[0, 10]} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f5f3ff' }} />
                        <Bar dataKey="average" name="Média" fill="url(#colorSubject)" radius={[4, 4, 0, 0]} barSize={30} animationDuration={1500} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};

// --- Instructor Performance Chart ---
export const InstructorPerformanceChart: React.FC = () => {
    const { classes, users } = useStore();
    const [periodFilter, setPeriodFilter] = useState<string>('all');

    const data = useMemo(() => {




        const instructorStats = new Map<string, { name: string; hours: number; classCount: number }>();

        users.filter(u => u.role === UserRole.INSTRUTOR || u.role === UserRole.COORDENADOR).forEach(u => {
            instructorStats.set(u.id, { name: u.name.split(' ')[0], hours: 0, classCount: 0 });
        });

        const now = new Date();
        const checkDate = (dateStr: string) => {
            const d = new Date(dateStr);
            if (periodFilter === 'year') return d.getFullYear() === now.getFullYear();
            if (periodFilter === 'month') return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
            return true;
        };

        classes.forEach(cls => {
            const uniqueInstructorsInClass = new Set<string>();
            cls.schedule.forEach(item => {
                if (!checkDate(item.date)) return;
                item.instructorIds.forEach(instId => {
                    const stats = instructorStats.get(instId);
                    if (stats) {
                        stats.hours += item.duration;
                        uniqueInstructorsInClass.add(instId);
                    }
                });
            });
            uniqueInstructorsInClass.forEach(instId => {
                const stats = instructorStats.get(instId);
                if (stats) stats.classCount += 1;
            });
        });

        return Array.from(instructorStats.values()).sort((a, b) => b.hours - a.hours);
    }, [classes, users, periodFilter]);

    return (
        <div className="card-premium p-6 animate-slide-up">
            <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                <div>
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                        <TrendingUp className="text-indigo-500" size={20} />
                        Instrutores
                    </h3>
                    <p className="text-sm text-gray-500">Performance Geral</p>
                </div>
                <select
                    value={periodFilter}
                    onChange={(e) => setPeriodFilter(e.target.value)}
                    className="input-field py-1.5 text-sm w-32"
                >
                    <option value="all">Todo Período</option>
                    <option value="year">Este Ano</option>
                    <option value="month">Este Mês</option>
                </select>
            </div>

            <div className="h-80 w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 0, bottom: 40 }}>
                        <defs>
                            <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8} />
                                <stop offset="95%" stopColor="#6366f1" stopOpacity={0.1} />
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f3f4f6" />
                        <XAxis
                            dataKey="name"
                            axisLine={false}
                            tickLine={false}
                            tick={{ fill: '#6b7280', fontSize: 10 }}
                            interval={0}
                            angle={-45}
                            textAnchor="end"
                            height={60}
                        />
                        <YAxis yAxisId="left" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                        <YAxis yAxisId="right" orientation="right" axisLine={false} tickLine={false} tick={{ fill: '#6b7280' }} />
                        <Tooltip content={<CustomTooltip />} cursor={{ fill: '#eef2ff' }} />
                        <Legend />
                        <Bar yAxisId="left" dataKey="hours" name="Horas Aula" fill="url(#colorHours)" radius={[4, 4, 0, 0]} barSize={20} animationDuration={1500} />
                        <Line yAxisId="right" type="monotone" dataKey="classCount" name="Turmas" stroke="#ec4899" strokeWidth={3} dot={{ r: 4, fill: '#ec4899', strokeWidth: 2, stroke: '#fff' }} animationDuration={1500} />
                    </ComposedChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
