import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { PaymentRecord, UserRole } from '../types';
import { HOURLY_RATES } from '../constants';
import { Check, DollarSign, Clock, Filter, AlertCircle, Calendar, BarChart2, Download, Search, Wrench } from 'lucide-react';
import { formatDate } from '../utils/dateUtils';

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
    const { currentUser, classes, courses, users, payments, addPayment, deletePayment, setupTeardownAssignments } = useStore();
    const [selectedLogs, setSelectedLogs] = useState<string[]>([]); // Array of composite IDs

    // Filters
    const [instructorFilter, setInstructorFilter] = useState('');
    const [statusFilter, setStatusFilter] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [monthFilter, setMonthFilter] = useState(''); // Default to ALL to match Dashboard
    const [yearFilter, setYearFilter] = useState('');   // Default to ALL to match Dashboard
    const [showSetupTeardown, setShowSetupTeardown] = useState(true); // Toggle for Setup/Teardown

    if (!currentUser) return null;

    const isInstructor = currentUser.role === UserRole.INSTRUTOR;
    const canManagePayments = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;

    // --- 1. Compute Raw Financial Data (All Items) ---
    const rawFinancialItems = useMemo(() => {
        let items: FinancialLogItem[] = [];

        // Add class schedule items
        classes.forEach(cls => {
            const course = courses.find(c => c.id === cls.courseId);
            cls.schedule.forEach(item => {
                if (!item.instructorIds || item.instructorIds.length === 0) return;

                const subject = course?.subjects.find(s => s.id === item.subjectId);
                if (!subject) return;

                const rate = subject.modality === 'Prática' ? HOURLY_RATES.PRACTICE : HOURLY_RATES.THEORY;
                const valuePerInstructor = item.duration * rate;

                item.instructorIds.forEach(instId => {
                    // Security: If current user is instructor, strictly filter early
                    if (isInstructor && instId !== currentUser.id) return;

                    const instructorUser = users.find(u => u.id === instId);
                    const paymentRecord = payments.find(p => p.scheduleItemId === item.id && p.instructorId === instId);
                    const isPaid = !!paymentRecord;

                    items.push({
                        id: `${item.id}-${instId}`,
                        type: 'Aula',
                        scheduleId: item.id,
                        instructorId: instId,
                        instructorName: instructorUser?.name || 'Desconhecido',
                        instructorRole: instructorUser?.role || 'Instrutor',
                        classId: cls.id,
                        className: cls.name,
                        date: item.date,
                        subject: subject.name,
                        modality: subject.modality,
                        hours: item.duration,
                        rate,
                        value: valuePerInstructor,
                        status: isPaid ? 'Pago' : 'Pendente',
                        paymentDate: paymentRecord?.datePaid
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

        // Sort by date desc
        return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
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

        // Group raw items by instructor
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

        rawFinancialItems.forEach(item => {
            if (!statsMap[item.instructorId]) {
                statsMap[item.instructorId] = {
                    id: item.instructorId,
                    name: item.instructorName,
                    role: item.instructorRole,
                    totalHours: 0,
                    totalValue: 0,
                    paidValue: 0,
                    pendingValue: 0,
                    classesParticipated: new Set(),
                    totalEvents: 0
                };
            }
            statsMap[item.instructorId].totalHours += item.hours ?? 0;
            statsMap[item.instructorId].totalValue += item.value;
            if (item.status === 'Pago') {
                statsMap[item.instructorId].paidValue += item.value;
            } else {
                statsMap[item.instructorId].pendingValue += item.value;
            }
            statsMap[item.instructorId].classesParticipated.add(item.classId);
            statsMap[item.instructorId].totalEvents += 1;
        });

        return Object.values(statsMap).sort((a, b) => b.totalValue - a.totalValue);
    }, [rawFinancialItems, isInstructor]);


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

    const handleRegisterPayment = () => {
        if (selectedLogs.length === 0) return;
        if (!window.confirm(`Confirma o pagamento de ${selectedLogs.length} aulas selecionadas?`)) return;

        selectedLogs.forEach(compositeId => {
            const item = rawFinancialItems.find(i => i.id === compositeId);
            if (item && item.status === 'Pendente') {
                const payment: PaymentRecord = {
                    id: Math.random().toString(36).substr(2, 9),
                    scheduleItemId: item.scheduleId,
                    instructorId: item.instructorId,
                    amount: item.value,
                    datePaid: new Date().toISOString(),
                    paidBy: currentUser.id
                };
                addPayment(payment);
            }
        });
        setSelectedLogs([]);
    };

    const handleTogglePaymentStatus = async (item: any) => {
        if (!canManagePayments) return;

        if (item.status === 'Pago' && item.paymentId) {
            if (confirm('Deseja cancelar o pagamento deste item?')) {
                await deletePayment(item.paymentId);
            }
        } else if (item.status === 'Pendente') {
            const payment: PaymentRecord = {
                id: Math.random().toString(36).substr(2, 9),
                scheduleItemId: item.scheduleId,
                instructorId: item.instructorId,
                amount: item.value,
                datePaid: new Date().toISOString(),
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
            item.rate.toString().replace('.', ','),
            item.value.toString().replace('.', ','),
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

    return (
        <div className="space-y-8 animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Painel Financeiro</h1>
                    <p className="text-gray-500 mt-1">Gerencie pagamentos e acompanhe finanças</p>
                </div>
            </div>

            {/* 1. Global Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Hours */}
                <div className="card-premium stagger-item p-6 relative overflow-hidden">
                    <div className="flex items-center justify-between mb-2 relative z-10">
                        <p className="text-gray-500 text-sm font-medium">Horas Totais (Filtrado)</p>
                        <Clock size={18} className="text-blue-500" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900 relative z-10">{summary.totalHours}h</p>
                </div>

                {/* Pending Value */}
                <div className="card-premium stagger-item p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-500 text-sm font-medium">A Pagar (Pendente)</p>
                        <AlertCircle size={18} className="text-orange-500" />
                    </div>
                    <p className="text-2xl font-bold text-orange-600">R$ {summary.pendingValue.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">{summary.pendingHours}h pendentes</p>
                </div>

                {/* Paid Value */}
                <div className="card-premium stagger-item p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-500 text-sm font-medium">Liquidado (Pago)</p>
                        <Check size={18} className="text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-green-600">R$ {summary.paidValue.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">{summary.paidHours}h pagas</p>
                </div>

                {/* Total Value */}
                <div className="card-premium stagger-item p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-gray-500 text-sm font-medium">Total Geral</p>
                        <DollarSign size={18} className="text-gray-400" />
                    </div>
                    <p className="text-2xl font-bold text-gray-900">R$ {summary.totalValue.toFixed(2)}</p>
                    <p className="text-xs text-gray-400 mt-1">Acumulado do período</p>
                </div>
            </div>

            {/* 2. Instructor Performance Dashboard (Managers Only) */}
            {canManagePayments && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2 bg-gray-50">
                        <BarChart2 size={18} className="text-gray-500" />
                        <h3 className="font-bold text-gray-800">Desempenho dos Instrutores (Geral)</h3>
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
                                {instructorStats.map((stat, idx) => (
                                    <tr
                                        key={idx}
                                        className={`hover:bg-blue-50 cursor-pointer transition-colors ${instructorFilter === stat.id ? 'bg-blue-100 ring-2 ring-blue-500' : ''}`}
                                        onClick={() => setInstructorFilter(instructorFilter === stat.id ? '' : stat.id)}
                                        title="Clique para filtrar o extrato abaixo"
                                    >
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{stat.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-500">{stat.role}</td>
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
                                            R$ {stat.paidValue.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-orange-600">
                                            R$ {stat.pendingValue.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                            R$ {stat.totalValue.toFixed(2)}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* 3. Detailed Extract & Filters */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">

                {/* Filter Toolbar */}
                <div className="p-4 bg-gray-50 border-b border-gray-200 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
                    <div className="lg:col-span-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Ano</label>
                        <select className={inputClass} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Mês</label>
                        <select className={inputClass} value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="0">Janeiro</option>
                            <option value="1">Fevereiro</option>
                            <option value="2">Março</option>
                            <option value="3">Abril</option>
                            <option value="4">Maio</option>
                            <option value="5">Junho</option>
                            <option value="6">Julho</option>
                            <option value="7">Agosto</option>
                            <option value="8">Setembro</option>
                            <option value="9">Outubro</option>
                            <option value="10">Novembro</option>
                            <option value="11">Dezembro</option>
                        </select>
                    </div>
                    <div className="lg:col-span-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Turma</label>
                        <select className={inputClass} value={classFilter} onChange={e => setClassFilter(e.target.value)}>
                            <option value="">Todas</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    {canManagePayments && (
                        <div className="lg:col-span-1">
                            <label className="text-xs font-medium text-gray-500 mb-1 block">Instrutor</label>
                            <select className={inputClass} value={instructorFilter} onChange={e => setInstructorFilter(e.target.value)}>
                                <option value="">Todos</option>
                                {users.filter(u => u.role === UserRole.INSTRUTOR || u.role === UserRole.AUXILIAR_INSTRUCAO || u.role === UserRole.COORDENADOR || u.role === UserRole.GESTOR).map(u => (
                                    <option key={u.id} value={u.id}>{u.name}</option>
                                ))}
                            </select>
                        </div>
                    )}
                    <div className="lg:col-span-1">
                        <label className="text-xs font-medium text-gray-500 mb-1 block">Status</label>
                        <select className={inputClass} value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                            <option value="">Todos</option>
                            <option value="Pago">Pago</option>
                            <option value="Pendente">Pendente</option>
                        </select>
                    </div>
                    {/* Toggle Setup/Teardown Button */}
                    <div className="lg:col-span-5 flex justify-end mt-2">
                        <button
                            onClick={() => setShowSetupTeardown(!showSetupTeardown)}
                            className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${showSetupTeardown
                                    ? 'bg-indigo-100 text-indigo-700 border border-indigo-200'
                                    : 'bg-gray-100 text-gray-600 border border-gray-200 hover:bg-gray-200'
                                }`}
                        >
                            <Wrench size={16} />
                            {showSetupTeardown ? 'Ocultar Montagem/Desmontagem' : 'Mostrar Montagem/Desmontagem'}
                        </button>
                    </div>
                </div>

                <div className="px-6 py-4 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center bg-white gap-4">
                    <h3 className="font-semibold text-gray-800">Extrato Detalhado</h3>
                    <div className="flex gap-2">
                        <button
                            onClick={handleExportCSV}
                            className="bg-white border border-gray-300 text-gray-700 px-3 py-2 rounded-md hover:bg-gray-50 transition flex items-center gap-2 text-sm"
                        >
                            <Download size={16} /> Exportar CSV
                        </button>
                        {canManagePayments && selectedLogs.length > 0 && (
                            <button
                                onClick={handleRegisterPayment}
                                className="btn-premium bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center gap-2 text-sm shadow-md"
                            >
                                <DollarSign size={16} />
                                Pagar {selectedLogs.length} item(ns)
                            </button>
                        )}
                    </div>
                </div>
                <div className="overflow-x-auto max-h-[600px] overflow-y-auto custom-scrollbar">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
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
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turma / Matéria</th>
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
                                    <td colSpan={canManagePayments ? 9 : 8} className="px-6 py-8 text-center text-gray-500 italic">
                                        Nenhum registro encontrado com os filtros atuais.
                                    </td>
                                </tr>
                            ) : (
                                filteredItems.map((log) => (
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
                                            <span className={`inline-flex items-center px-2 py-1 rounded-md text-xs font-medium ${log.type === 'Aula' ? 'bg-blue-100 text-blue-800' :
                                                log.type === 'Montagem' ? 'bg-green-100 text-green-800' :
                                                    'bg-orange-100 text-orange-800'
                                                }`}>
                                                {log.type === 'Aula' && '📚 '}
                                                {log.type === 'Montagem' && '🔧 '}
                                                {log.type === 'Desmontagem' && '📦 '}
                                                {log.type}
                                            </span>
                                        </td>
                                        {!isInstructor && (
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-medium">
                                                {log.instructorName}
                                            </td>
                                        )}
                                        <td className="px-6 py-4 text-sm text-gray-500">
                                            <div className="font-medium text-gray-900">{log.className}</div>
                                            <div className="text-xs">{log.subject}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                                            <span className={`px-2 py-1 rounded text-xs ${log.modality === 'Prática' ? 'bg-orange-100 text-orange-800' :
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
                                            R$ {log.rate.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-right font-bold text-gray-900">
                                            R$ {log.value.toFixed(2)}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => handleTogglePaymentStatus(log)}
                                                disabled={!canManagePayments}
                                                className={`px-2 py-1 rounded-full text-xs font-bold transition-colors ${log.status === 'Pago'
                                                    ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                    : 'bg-yellow-100 text-yellow-800 hover:bg-yellow-200'
                                                    }`}
                                                title={canManagePayments ? "Clique para alterar status" : ""}
                                            >
                                                {log.status}
                                            </button>
                                            {log.status === 'Pago' && log.paymentDate && (
                                                <div className="text-[10px] text-gray-400 mt-1">
                                                    {formatDate(log.paymentDate)}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div >
    );
};
