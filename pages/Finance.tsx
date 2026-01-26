import React, { useState, useMemo, useEffect } from 'react';
import { useStore } from '../context/AppStore';
import { PaymentRecord, UserRole } from '../types';
import { HOURLY_RATES } from '../constants';
import { Check, DollarSign, Clock, Filter, AlertCircle, Calendar, BarChart2, Download, Search, Wrench, AlertTriangle, CheckCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, getCurrentDateString } from '../utils/dateUtils';
import { findDuplicates, fixDuplicates } from '../utils/dataCleanup';
import { StandardSelect } from '../components/StandardSelect';

interface FinancialLogItem {
    id: string; // Composite ID for key
    type: 'Aula' | 'Montagem' | 'Desmontagem';
    scheduleId: string;
    instructorId: string;
    instructorName: string;
    instructorRole: string;
    classId: string;
    className: string;
    date: string; // YYYY-MM-DD
    subject: string;
    modality: 'Teórica' | 'Prática' | 'Operacional';
    hours?: number;
    days?: number;
    rate: number;
    value: number;
    status: 'Pago' | 'Pendente';
    paymentDate?: string;
    paymentId?: string;
}

export const FinancePage: React.FC = () => {
    const { currentUser, classes, courses, users, payments, addPayment, deletePayment, setupTeardownAssignments, updateClass } = useStore();
    const [selectedLogs, setSelectedLogs] = useState<string[]>([]); // Array of composite IDs

    // Filters
    const [instructorFilter, setInstructorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState(''); // Default to ALL to match Dashboard
    const [yearFilter, setYearFilter] = useState('');   // Default to ALL to match Dashboard
    const [showSetupTeardown, setShowSetupTeardown] = useState(true); // Toggle for Setup/Teardown (Extract)
    const [showPerformanceSetup, setShowPerformanceSetup] = useState(true); // Toggle for Setup/Teardown (Performance)
    const [statsPage, setStatsPage] = useState(1);
    const STATS_ITEMS_PER_PAGE = 10;

    const [detailedPage, setDetailedPage] = useState(1);
    const DETAILED_ITEMS_PER_PAGE = 20;

    if (!currentUser) return null;

    const isInstructor = currentUser.role === UserRole.INSTRUTOR;
    const canManagePayments = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;

    // --- 1. Compute Raw Financial Data (All Items) ---
    const rawFinancialItems = useMemo(() => {
        let items: FinancialLogItem[] = [];

        // Add class schedule items
        classes.forEach(cls => {
            const course = courses.find(c => c.id === cls.courseId);

            // Debug for missing courses
            if (course?.name.toUpperCase().includes('CBA-2')) {
                console.log('💰 Finance Debug: Processing CBA-2 Class:', cls.name, '| ID:', cls.id);
            }

            cls.schedule.forEach(item => {
                // If no instructors, process as 'unassigned' to show in list
                const instructorIdsToProcess = (item.instructorIds && item.instructorIds.length > 0)
                    ? item.instructorIds
                    : ['unassigned'];

                let subject = course?.subjects.find(s => s.id === item.subjectId);

                // Fallback if subject not found (prevents rows from disappearing)
                if (!subject) {
                    subject = {
                        id: 'unknown',
                        name: 'Matéria não encontrada',
                        module: item.moduleId || 'Módulo Desconhecido',
                        hours: item.duration,
                        modality: 'Teórica' // Default to Theory to generate some value
                    };
                }

                const isExempt = /Prova|Revisão/i.test(subject.name);

                let rate = subject.modality === 'Prática' ? HOURLY_RATES.PRACTICE : HOURLY_RATES.THEORY;

                // Exemption Rule: CBA-AT Módulo Resgate - Prática classes have no value
                if (course?.name?.trim() === 'CBA-AT Módulo Resgate' && subject.modality === 'Prática') {
                    rate = 0;
                }

                // Auxiliar de Instrução Rate for Practical
                if (instructorIdsToProcess[0] !== 'unassigned' && (currentUser?.role === UserRole.AUXILIAR_INSTRUCAO || (users.find(u => u.id === instructorIdsToProcess[0])?.role === UserRole.AUXILIAR_INSTRUCAO))) {
                    // We need to check the specific instructor inside the loop below, but here we can define base rate logic
                }

                const valuePerInstructor = item.duration * rate;

                instructorIdsToProcess.forEach(instId => {
                    // Skip unassigned instructors
                    if (instId === 'unassigned') return;

                    // Security: If current user is instructor, strictly filter early
                    if (isInstructor && instId !== currentUser.id) return;

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

                    items.push({
                        id: `${item.id}-${instId}`,
                        type: 'Aula',
                        scheduleId: item.id,
                        instructorId: instId,
                        instructorName: instructorUser?.name || (instId === 'unassigned' ? 'Sem Instrutor' : 'Desconhecido'),
                        instructorRole: instructorUser?.role || 'Instrutor',
                        classId: cls.id,
                        className: cls.name,
                        date: item.date,
                        subject: subject.name,
                        modality: subject.modality,
                        hours: item.duration,
                        rate: effectiveRate,
                        value: effectiveValue,
                        status: isPaid ? 'Pago' : 'Pendente',
                        paymentDate: paymentRecord?.datePaid,
                        paymentId: paymentRecord?.id
                    });
                });
            });
        });

        // Add setup/teardown items
        setupTeardownAssignments.forEach(assignment => {
            // Security: If current user is instructor, strictly filter
            if (isInstructor && assignment.instructorId !== currentUser.id) return;

            const instructorUser = users.find(u => u.id === assignment.instructorId);
            // Check both scheduleItemId and referenceId for compatibility
            const paymentRecord = payments.find(p => (p.scheduleItemId === assignment.id || (p as any).referenceId === assignment.id) && p.instructorId === assignment.instructorId);
            const isPaid = !!paymentRecord;

            items.push({
                id: `setup-${assignment.id}`,
                type: assignment.type as 'Montagem' | 'Desmontagem',
                scheduleId: assignment.id,
                instructorId: assignment.instructorId,
                instructorName: assignment.instructorName,
                instructorRole: instructorUser?.role || 'Instrutor',
                classId: assignment.classId,
                className: assignment.className,
                date: assignment.date,
                subject: assignment.type,
                modality: 'Operacional',
                days: assignment.days,
                hours: assignment.days * 8, // Assuming 8h work day for setup/teardown
                rate: assignment.rate,
                value: assignment.totalValue,
                status: isPaid ? 'Pago' : 'Pendente',
                paymentDate: paymentRecord?.datePaid,
                paymentId: paymentRecord?.id
            });
        });

        // Sort by Class Name Asc -> Instructor Name Asc -> Date Desc
        return items.sort((a, b) => {
            // 1. Class Name (Alphabetical)
            const classComparison = a.className.localeCompare(b.className);
            if (classComparison !== 0) return classComparison;

            // 2. Instructor Name (Alphabetical)
            const instructorComparison = a.instructorName.localeCompare(b.instructorName);
            if (instructorComparison !== 0) return instructorComparison;

            // 3. Date (Newest first) - as final tiebreaker
            const dateA = new Date(a.date).getTime();
            const dateB = new Date(b.date).getTime();
            const timeA = isNaN(dateA) ? 0 : dateA;
            const timeB = isNaN(dateB) ? 0 : dateB;
            return timeB - timeA;
        });
    }, [classes, courses, users, payments, currentUser, isInstructor, setupTeardownAssignments]);

    // --- 2. Filtered Data for Table ---
    const filteredItems = useMemo(() => {
        return rawFinancialItems.filter(item => {
            const date = new Date(item.date);
            const itemYear = date.getFullYear().toString();
            const itemMonth = date.getMonth().toString(); // 0-11

            if (instructorFilter && item.instructorId !== instructorFilter) return false;
            if (statusFilter && item.status !== statusFilter) return false;
            if (classFilter && item.classId !== classFilter) return false;
            if (yearFilter && itemYear !== yearFilter) return false;
            if (monthFilter && itemMonth !== monthFilter) return false;

            // Toggle Setup/Teardown
            if (!showSetupTeardown && (item.type === 'Montagem' || item.type === 'Desmontagem')) return false;

            return true;
        });
    }, [rawFinancialItems, instructorFilter, statusFilter, classFilter, yearFilter, monthFilter, showSetupTeardown]);

    // Reset detailed page when filters change
    useEffect(() => {
        setDetailedPage(1);
    }, [instructorFilter, statusFilter, classFilter, yearFilter, monthFilter, showSetupTeardown]);

    // --- 3. Summary Stats (Based on Filtered Data) ---
    const summary = useMemo(() => {
        return filteredItems.reduce((acc, item) => {
            acc.totalHours += item.hours ?? 0;
            acc.totalValue += item.value;
            if (item.status === 'Pago') {
                acc.paidHours += item.hours ?? 0;
                acc.paidValue += item.value;
            } else {
                acc.pendingHours += item.hours ?? 0;
                acc.pendingValue += item.value;
            }
            return acc;
        }, { totalHours: 0, paidHours: 0, pendingHours: 0, totalValue: 0, paidValue: 0, pendingValue: 0 });
    }, [filteredItems]);

    // --- 4. Instructor Performance Stats (For Manager Dashboard) ---
    const instructorStats = useMemo(() => {
        if (isInstructor) return []; // Don't calculate for single instructor view

        // 1. Identify all eligible users (Instructors, Assistants, Managers, Coordinators)
        // AND Apply Instructor Filter to the ROWS (hiding others)
        const eligibleUsers = users.filter(u =>
            (u.role === UserRole.INSTRUTOR ||
                u.role === UserRole.AUXILIAR_INSTRUCAO ||
                u.role === UserRole.GESTOR ||
                u.role === UserRole.COORDENADOR) &&
            (!instructorFilter || u.id === instructorFilter)
        );

        // 2. Initialize Stats Map with ALL eligible users
        const statsMap: {
            [key: string]: {
                id: string,
                name: string,
                role: string,
                totalHours: number,
                totalValue: number,
                paidValue: number,
                pendingValue: number,
                classesParticipated: Set<string>,
                totalEvents: number
            }
        } = {};

        eligibleUsers.forEach(u => {
            statsMap[u.id] = {
                id: u.id,
                name: u.name,
                role: u.role,
                totalHours: 0,
                totalValue: 0,
                paidValue: 0,
                pendingValue: 0,
                classesParticipated: new Set(),
                totalEvents: 0
            };
        });

        // 3. Aggregate Data from Financial Items
        rawFinancialItems.forEach(item => {
            const date = new Date(item.date);
            const itemYear = date.getFullYear().toString();
            const itemMonth = date.getMonth().toString(); // 0-11

            // Apply Filters to DATA aggregation
            if (instructorFilter && item.instructorId !== instructorFilter) return;
            if (statusFilter && item.status !== statusFilter) return;
            if (classFilter && item.classId !== classFilter) return;
            if (yearFilter && itemYear !== yearFilter) return;
            if (monthFilter && itemMonth !== monthFilter) return;

            // Filter out setup/teardown if toggle is off (specific to this table)
            if (!showPerformanceSetup && (item.type === 'Montagem' || item.type === 'Desmontagem')) return;

            // Only process if user is in our eligible map (should be always true if roles match)
            if (statsMap[item.instructorId]) {
                statsMap[item.instructorId].totalHours += item.hours ?? 0;
                statsMap[item.instructorId].totalValue += item.value;
                if (item.status === 'Pago') {
                    statsMap[item.instructorId].paidValue += item.value;
                } else {
                    statsMap[item.instructorId].pendingValue += item.value;
                }
                statsMap[item.instructorId].classesParticipated.add(item.classId);
                statsMap[item.instructorId].totalEvents += 1;
            }
        });

        return Object.values(statsMap).sort((a, b) => b.totalValue - a.totalValue);
    }, [rawFinancialItems, isInstructor, showPerformanceSetup, users, instructorFilter, statusFilter, classFilter, yearFilter, monthFilter]);

    // Pagination Logic for Instructor Stats
    const statsTotalPages = Math.ceil(instructorStats.length / STATS_ITEMS_PER_PAGE);
    const paginatedInstructorStats = useMemo(() => {
        const start = (statsPage - 1) * STATS_ITEMS_PER_PAGE;
        return instructorStats.slice(start, start + STATS_ITEMS_PER_PAGE);
    }, [instructorStats, statsPage]);

    const detailedTotalPages = Math.ceil(filteredItems.length / DETAILED_ITEMS_PER_PAGE);
    const paginatedDetailedItems = useMemo(() => {
        const start = (detailedPage - 1) * DETAILED_ITEMS_PER_PAGE;
        return filteredItems.slice(start, start + DETAILED_ITEMS_PER_PAGE);
    }, [filteredItems, detailedPage]);


    // --- Actions ---
    const handleToggleSelect = (id: string) => {
        if (selectedLogs.includes(id)) {
            setSelectedLogs(selectedLogs.filter(sid => sid !== id));
        } else {
            setSelectedLogs([...selectedLogs, id]);
        }
    };

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            const pendingIds = filteredItems.filter(i => i.status === 'Pendente').map(i => i.id);
            setSelectedLogs(pendingIds);
        } else {
            setSelectedLogs([]);
        }
    };

    const handleRegisterPayment = async () => {
        if (selectedLogs.length === 0) return;
        if (!window.confirm(`Confirma o pagamento de ${selectedLogs.length} aulas selecionadas?`)) return;

        console.log('🔄 Processing payments for:', selectedLogs.length, 'items');

        try {
            for (const compositeId of selectedLogs) {
                const item = rawFinancialItems.find(i => i.id === compositeId);
                console.log('📋 Processing item:', item);

                if (item && item.status === 'Pendente') {
                    const payment: PaymentRecord = {
                        id: crypto.randomUUID(),
                        scheduleItemId: item.scheduleId,
                        instructorId: item.instructorId,
                        amount: item.value,
                        datePaid: getCurrentDateString(), // Use getCurrentDateString
                        paidBy: currentUser.id
                    };
                    console.log('💰 Creating payment:', payment);
                    await addPayment(payment);
                    console.log('✅ Payment added successfully');
                }
            }
            setSelectedLogs([]);
            console.log('✅ All payments processed successfully');
            alert('Pagamentos registrados com sucesso!');
        } catch (error) {
            console.error('❌ Error processing payments:', error);
            alert('Pagamentos foram salvos localmente, mas houve um problema ao sincronizar com o servidor. Os dados estarão disponíveis nesta sessão.');
        }
    };

    const handleTogglePaymentStatus = async (item: any) => {
        if (!canManagePayments) return;

        if (item.status === 'Pago' && item.paymentId) {
            // Updated to remove confirmation as requested
            await deletePayment(item.paymentId);
        } else if (item.status === 'Pendente') {
            const payment: PaymentRecord = {
                id: crypto.randomUUID(),
                scheduleItemId: item.scheduleId,
                instructorId: item.instructorId,
                amount: item.value,
                datePaid: getCurrentDateString(), // Use getCurrentDateString
                paidBy: currentUser.id
            };
            await addPayment(payment);
        }
    };

    const handleExportCSV = () => {
        const headers = ["Data", "Tipo", "Instrutor", "Turma", "Materia", "Modalidade", "Horas", "Valor/Hora", "Total", "Status"];
        const rows = filteredItems.map(item => [
            new Date(item.date).toLocaleDateString(),
            item.type,
            item.instructorName,
            item.className,
            item.subject,
            item.modality,
            `${item.hours}h`,
            item.rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            item.value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }),
            item.status
        ]);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(";") + "\n"
            + rows.map(e => e.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "extrato_financeiro.csv");
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    const handleCheckDuplicates = async () => {
        const report = findDuplicates(classes);
        if (report.length === 0) {
            alert('Nenhuma duplicidade encontrada.');
            return;
        }

        const confirmFix = window.confirm(
            `Encontradas duplicidades nas seguintes turmas:\n\n${report.join('\n')}\n\nDeseja corrigir automaticamente? (Isso removerá as cópias extras)`
        );

        if (confirmFix) {
            try {
                const result = await fixDuplicates(classes, updateClass);
                alert(result);
            } catch (error) {
                alert('Erro ao corrigir duplicidades.');
            }
        }
    };

    return (
        <div className="space-y-8">
            {/* 1. Global Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Hours */}
                <div className="bg-white p-6 rounded-2xl border shadow-md relative hover:shadow-lg transition-all duration-300" style={{ borderColor: '#E5E7EB', borderLeftWidth: '4px', borderLeftColor: '#3B82F6' }}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10" style={{ backgroundColor: '#3B82F6' }}></div>
                    <div className="flex items-center justify-start mb-4">
                        <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                            <Clock size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Horas Totais</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">{summary.totalHours}h</h3>
                </div>

                {/* Pending Value */}
                <div className="bg-white p-6 rounded-2xl border shadow-md relative hover:shadow-lg transition-all duration-300" style={{ borderColor: '#E5E7EB', borderLeftWidth: '4px', borderLeftColor: '#F97316' }}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10" style={{ backgroundColor: '#F97316' }}></div>
                    <div className="flex items-center justify-start mb-4">
                        <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                            <AlertCircle size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">A Pagar</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">R$ {summary.pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>

                {/* Paid Value */}
                <div className="bg-white p-6 rounded-2xl border shadow-md relative hover:shadow-lg transition-all duration-300" style={{ borderColor: '#E5E7EB', borderLeftWidth: '4px', borderLeftColor: '#10B981' }}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10" style={{ backgroundColor: '#10B981' }}></div>
                    <div className="flex items-center justify-start mb-4">
                        <div className="p-3 bg-green-100 rounded-xl text-green-600">
                            <Check size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Liquidado</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">R$ {summary.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>

                {/* Total Value */}
                <div className="bg-white p-6 rounded-2xl border shadow-md relative hover:shadow-lg transition-all duration-300" style={{ borderColor: '#E5E7EB', borderLeftWidth: '4px', borderLeftColor: '#6B7280' }}>
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full opacity-10" style={{ backgroundColor: '#6B7280' }}></div>
                    <div className="flex items-center justify-start mb-4">
                        <div className="p-3 bg-gray-100 rounded-xl text-gray-600">
                            <DollarSign size={24} />
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Geral</p>
                    <h3 className="text-3xl font-bold text-gray-900 mt-1">R$ {summary.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</h3>
                </div>
            </div>

            {/* 2. Instructor Performance Dashboard (Managers Only) */}
            {canManagePayments && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-end gap-2 bg-white">
                        <button
                            onClick={() => setShowPerformanceSetup(!showPerformanceSetup)}
                            className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 px-6 py-2.5 text-xs font-bold flex items-center gap-2 transition-all uppercase"
                        >
                            <Wrench size={14} className="mr-2" />
                            {showPerformanceSetup ? 'OCULTAR MOBILIZAÇÃO' : 'MOSTRAR MOBILIZAÇÃO'}
                        </button>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instrutor</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Função</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Part. em Turmas</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Total Aulas</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Horas Totais</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Recebido</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor a Receber</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total Acumulado</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {paginatedInstructorStats.map((stat, idx) => (
                                    <tr
                                        key={stat.id}
                                        className={`hover:bg-gray-50 cursor-pointer transition-colors ${instructorFilter === stat.id ? 'bg-orange-50 ring-2 ring-orange-500' : ''}`}
                                        onClick={() => setInstructorFilter(instructorFilter === stat.id ? '' : stat.id)}
                                        title="Clique para filtrar o extrato abaixo"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 uppercase">{stat.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500 uppercase">{stat.role}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                            {stat.classesParticipated.size}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-600">
                                            {stat.totalEvents}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-600">
                                            {stat.totalHours}h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-green-600">
                                            R$ {stat.paidValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-orange-600">
                                            R$ {stat.pendingValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                            R$ {stat.totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    {/* Pagination Controls */}
                    {instructorStats.length > 0 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 border border-t-0 border-gray-200">
                            <span className="text-sm text-gray-700 uppercase">
                                MOSTRANDO <span className="font-bold">{(statsPage - 1) * STATS_ITEMS_PER_PAGE + 1}</span> A <span className="font-bold">{Math.min(statsPage * STATS_ITEMS_PER_PAGE, instructorStats.length)}</span> DE <span className="font-bold">{instructorStats.length}</span> RESULTADOS
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStatsPage(p => Math.max(1, p - 1))}
                                    disabled={statsPage === 1}
                                    className="btn-base btn-pagination px-4 py-2 text-xs"
                                >
                                    ANTERIOR
                                </button>
                                <button
                                    onClick={() => setStatsPage(p => Math.min(statsTotalPages, p + 1))}
                                    disabled={statsPage === statsTotalPages}
                                    className="btn-base btn-pagination px-4 py-2 text-xs"
                                >
                                    PRÓXIMA
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* 3. Detailed Extract & Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">

                {/* Filter Toolbar */}
                <div className="p-4 bg-white border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-1">
                        <StandardSelect
                            label="ANO"
                            value={yearFilter}
                            onChange={(e) => setYearFilter(e.target.value)}
                            options={[
                                { value: "", label: "TODOS" },
                                { value: "2024", label: "2024" },
                                { value: "2025", label: "2025" },
                                { value: "2026", label: "2026" }
                            ]}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <StandardSelect
                            label="MÊS"
                            value={monthFilter}
                            onChange={(e) => setMonthFilter(e.target.value)}
                            options={[
                                { value: "", label: "TODOS" },
                                { value: "0", label: "JANEIRO" },
                                { value: "1", label: "FEVEREIRO" },
                                { value: "2", label: "MARÇO" },
                                { value: "3", label: "ABRIL" },
                                { value: "4", label: "MAIO" },
                                { value: "5", label: "JUNHO" },
                                { value: "6", label: "JULHO" },
                                { value: "7", label: "AGOSTO" },
                                { value: "8", label: "SETEMBRO" },
                                { value: "9", label: "OUTUBRO" },
                                { value: "10", label: "NOVEMBRO" },
                                { value: "11", label: "DEZEMBRO" }
                            ]}
                        />
                    </div>
                    <div className="lg:col-span-1">
                        <StandardSelect
                            label="TURMA"
                            value={classFilter}
                            onChange={(e) => setClassFilter(e.target.value)}
                            options={[
                                { value: "", label: "TODAS" },
                                ...classes.sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name }))
                            ]}
                        />
                    </div>
                    {canManagePayments && (
                        <div className="lg:col-span-1">
                            <StandardSelect
                                label="INSTRUTOR"
                                value={instructorFilter}
                                onChange={(e) => setInstructorFilter(e.target.value)}
                                options={[
                                    { value: "", label: "TODOS" },
                                    ...users.filter(u => u.role === UserRole.INSTRUTOR || u.role === UserRole.AUXILIAR_INSTRUCAO || u.role === UserRole.COORDENADOR || u.role === UserRole.GESTOR)
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(u => ({ value: u.id, label: u.name }))
                                ]}
                            />
                        </div>
                    )}
                    <div className="lg:col-span-1">
                        <StandardSelect
                            label="STATUS"
                            value={statusFilter}
                            onChange={(e) => setStatusFilter(e.target.value)}
                            options={[
                                { value: "", label: "TODOS" },
                                { value: "Pago", label: "PAGO" },
                                { value: "Pendente", label: "PENDENTE" }
                            ]}
                        />
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-end items-center bg-white gap-4">
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowSetupTeardown(!showSetupTeardown)}
                            className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center px-6 py-2.5 text-xs font-bold"
                        >
                            {showSetupTeardown ? 'OCULTAR MOBILIZAÇÃO' : 'MOSTRAR MOBILIZAÇÃO'}
                        </button>
                        <button
                            onClick={handleExportCSV}
                            className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center px-6 py-2.5 text-xs font-bold"
                        >
                            CSV
                        </button>
                        {(currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR) && (
                            <button
                                onClick={handleCheckDuplicates}
                                className="btn-base bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 flex items-center justify-center px-6 py-2.5 text-xs font-bold"
                                title="Verificar inconsistências na base de dados"
                            >
                                DUPLICIDADES
                            </button>
                        )}
                        {canManagePayments && selectedLogs.length > 0 && (
                            <button
                                onClick={handleRegisterPayment}
                                className="btn-base btn-save shadow-lg shadow-green-500/30 flex items-center justify-center px-6 py-2.5 text-xs font-bold"
                            >
                                PAGAR {selectedLogs.length} ITEM(NS)
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar relative">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-white sticky top-0 z-10 shadow-sm">
                            <tr>
                                {canManagePayments && (
                                    <th className="px-4 py-3 text-center w-10">
                                        <input
                                            type="checkbox"
                                            onChange={handleSelectAll}
                                            className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                        />
                                    </th>
                                )}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                {!isInstructor && <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Instrutor</th>}
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turma</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Matéria</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modalidade</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Horas</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Hora</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Total</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredItems.length === 0 ? (
                                <tr>
                                    <td colSpan={canManagePayments ? 10 : 9} className="px-6 py-8 text-center text-gray-500 italic">
                                        Nenhum registro encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                paginatedDetailedItems.map((log) => (
                                    <tr key={log.id} className="hover:bg-gray-50">
                                        {canManagePayments && (
                                            <td className="px-4 py-4 text-center">
                                                {log.status === 'Pendente' && (
                                                    <input
                                                        type="checkbox"
                                                        checked={selectedLogs.includes(log.id)}
                                                        onChange={() => handleToggleSelect(log.id)}
                                                        className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                    />
                                                )}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                            {formatDate(log.date)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium uppercase ${log.type === 'Aula' ? 'bg-blue-100 text-blue-800' :
                                                log.type === 'Montagem' ? 'bg-green-100 text-green-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                {log.type}
                                            </span>
                                        </td>
                                        {!isInstructor && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium uppercase">
                                                {log.instructorName}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm text-gray-500 uppercase">
                                            <div className="font-medium text-gray-900">{log.className}</div>
                                        </td>
                                        <td className="px-6 py-4 text-xs text-gray-500 uppercase max-w-xs truncate" title={log.subject}>
                                            {log.subject}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded text-xs uppercase ${log.modality === 'Prática' ? 'bg-orange-100 text-orange-800' :
                                                log.modality === 'Operacional' ? 'bg-purple-100 text-purple-800' :
                                                    'bg-blue-100 text-blue-800'
                                                }`}>
                                                {log.modality}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-center font-medium text-gray-700">
                                            {log.hours} h
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right text-gray-500">
                                            R$ {log.rate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                            R$ {log.value.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleTogglePaymentStatus(log)}
                                                    disabled={!canManagePayments}
                                                    className={`px-3 py-1 rounded-full text-xs font-bold transition-all transform hover:scale-105 ${log.status === 'Pago'
                                                        ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800'
                                                        : 'bg-yellow-100 text-yellow-800 hover:bg-green-100 hover:text-green-800'
                                                        }`}
                                                    title={canManagePayments ? (log.status === 'Pago' ? "Clique para cancelar (tornar pendente)" : "Clique para marcar como pago") : ""}
                                                >
                                                    {log.status === 'Pago' ? 'PAGO' : 'PENDENTE'}
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls for Detailed Extract */}
                {filteredItems.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 border border-t-0 border-gray-200">
                        <span className="text-sm text-gray-700 uppercase">
                            MOSTRANDO <span className="font-bold">{(detailedPage - 1) * DETAILED_ITEMS_PER_PAGE + 1}</span> A <span className="font-bold">{Math.min(detailedPage * DETAILED_ITEMS_PER_PAGE, filteredItems.length)}</span> DE <span className="font-bold">{filteredItems.length}</span> RESULTADOS
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setDetailedPage(p => Math.max(1, p - 1))}
                                disabled={detailedPage === 1}
                                className="btn-base btn-pagination px-4 py-2 text-xs"
                            >
                                ANTERIOR
                            </button>
                            <button
                                onClick={() => setDetailedPage(p => Math.min(detailedTotalPages, p + 1))}
                                disabled={detailedPage === detailedTotalPages}
                                className="btn-base btn-pagination px-4 py-2 text-xs"
                            >
                                PRÓXIMA
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div >
    );
};
