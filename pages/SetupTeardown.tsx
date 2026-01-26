import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { SetupTeardownAssignment, UserRole } from '../types';
import { Wrench, Plus, Trash2, Edit2, DollarSign, Calendar, User, Download, ArrowUpRight, ArrowDownLeft, Filter, Search, Pencil, X, Save, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatDate, getCurrentDateString } from '../utils/dateUtils';
import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter, inputClass, labelClass } from '../components/StandardModal';
import { StandardSelect } from '../components/StandardSelect';

export const SetupTeardownPage: React.FC = () => {
    const { currentUser, classes, users, courses, setupTeardownAssignments, addSetupTeardownAssignment, updateSetupTeardownAssignment, deleteSetupTeardownAssignment, payments, addPayment, deletePayment } = useStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterClass, setFilterClass] = useState('');
    const [filterType, setFilterType] = useState<'' | 'Montagem' | 'Desmontagem'>('');
    const [filterInstructor, setFilterInstructor] = useState('');
    const [filterYear, setFilterYear] = useState('');
    const [filterCourse, setFilterCourse] = useState('');
    const [selectedAssignments, setSelectedAssignments] = useState<string[]>([]); // Para pagamento em lote

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Modal filter state
    const [modalYear, setModalYear] = useState('');
    const [modalCourseId, setModalCourseId] = useState('');

    // Form state
    const [formData, setFormData] = useState({
        classId: '',
        type: 'Montagem' as 'Montagem' | 'Desmontagem',
        instructorId: '',
        days: 1,
        startDate: '',
        endDate: '',
        notes: ''
    });

    if (!currentUser) return null;

    const canManage = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;
    const instructors = users
        .filter(u =>
            u.role === UserRole.INSTRUTOR ||
            u.role === UserRole.AUXILIAR_INSTRUCAO ||
            u.role === UserRole.GESTOR ||
            u.role === UserRole.COORDENADOR
        )
        .sort((a, b) => a.name.localeCompare(b.name)); // Ordem alfabética

    const filteredAssignments = useMemo(() => {
        return setupTeardownAssignments
            .filter(a => {
                // Privacy Rule: Only Managers can see all. Instructors see only their own.
                if (!canManage && a.instructorId !== currentUser.id) return false;

                if (filterClass && a.classId !== filterClass) return false;
                if (filterType && a.type !== filterType) return false;
                if (filterInstructor && a.instructorId !== filterInstructor) return false;

                // Year filter - extract year from class name (e.g., "CBA-2 01/2026")
                if (filterYear) {
                    const yearMatch = a.className.match(/\d{2}\/(\d{4})/);
                    if (!yearMatch || yearMatch[1] !== filterYear) return false;
                }

                // Course filter - extract course prefix (e.g., "CBA-2", "CBA-AT")
                if (filterCourse) {
                    const coursePrefix = a.className.split(' ')[0];
                    if (!coursePrefix.includes(filterCourse)) return false;
                }

                return true;
            })
            .sort((a, b) => a.className.localeCompare(b.className)); // Ordenar por turma
    }, [setupTeardownAssignments, filterClass, filterType, filterInstructor, filterYear, filterCourse, canManage, currentUser]);

    const totalValue = filteredAssignments.reduce((sum, a) => sum + a.totalValue, 0);

    // Extract unique years and courses from assignments
    const availableYears = useMemo(() => {
        const years = new Set<string>();
        setupTeardownAssignments.forEach(a => {
            const yearMatch = a.className.match(/\d{2}\/(\d{4})/);
            if (yearMatch) years.add(yearMatch[1]);
        });
        return Array.from(years).sort();
    }, [setupTeardownAssignments]);

    const availableCourses = useMemo(() => {
        const courses = new Set<string>();
        setupTeardownAssignments.forEach(a => {
            const coursePrefix = a.className.split(' ')[0];
            if (coursePrefix) courses.add(coursePrefix);
        });
        return Array.from(courses).sort();
    }, [setupTeardownAssignments]);

    // Modal-specific years from classes
    const modalAvailableYears = useMemo(() => {
        const years = new Set<string>();
        classes.forEach(c => {
            const year = new Date(c.startDate).getFullYear().toString();
            years.add(year);
        });
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [classes]);

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredAssignments.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredAssignments.length / itemsPerPage);

    const handleOpenModal = (assignment?: SetupTeardownAssignment) => {
        if (assignment) {
            setEditingId(assignment.id);
            setFormData({
                classId: assignment.classId,
                type: assignment.type,
                instructorId: assignment.instructorId,
                days: assignment.days,
                startDate: assignment.startDate || '',
                endDate: assignment.endDate || '',
                notes: assignment.notes || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                classId: '',
                type: 'Montagem',
                instructorId: '',
                days: 1,
                startDate: '',
                endDate: '',
                notes: ''
            });
            setModalYear('');
            setModalCourseId('');
        }
        setModalOpen(true);
    };

    const handleSubmit = () => {
        if (!formData.classId || !formData.instructorId || formData.days <= 0) {
            alert('Preencha todos os campos obrigatórios');
            return;
        }

        const selectedClass = classes.find(c => c.id === formData.classId);
        const selectedInstructor = instructors.find(i => i.id === formData.instructorId);

        if (!selectedClass || !selectedInstructor) return;

        const assignment: SetupTeardownAssignment = {
            id: editingId || crypto.randomUUID(),
            classId: formData.classId,
            className: selectedClass.name,
            type: formData.type,
            instructorId: formData.instructorId,
            instructorName: selectedInstructor.name,
            days: formData.days,
            rate: 350,
            totalValue: formData.days * 350,
            date: getCurrentDateString(),
            startDate: formData.startDate,
            endDate: formData.endDate,
            notes: formData.notes
        };

        if (editingId) {
            updateSetupTeardownAssignment(assignment);
        } else {
            addSetupTeardownAssignment(assignment);
        }
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Deseja realmente excluir esta atribuição?')) {
            deleteSetupTeardownAssignment(id);
        }
    };

    const exportToCSV = () => {
        const headers = ['Turma', 'Tipo', 'Instrutor', 'Dias', 'Início', 'Término', 'Valor Total', 'Data', 'Status Pagamento', 'Observações'];
        const csvContent = [
            headers.join(','),
            ...filteredAssignments.map(a => {
                const isPaid = payments.some(p => p.scheduleItemId === a.id);
                return [
                    `"${a.className}"`,
                    a.type,
                    `"${a.instructorName}"`,
                    a.days,
                    a.startDate ? formatDate(a.startDate) : '-',
                    a.endDate ? formatDate(a.endDate) : '-',
                    a.totalValue,
                    formatDate(a.date),
                    isPaid ? 'Pago' : 'Pendente',
                    `"${a.notes || ''}"`
                ].join(',');
            })
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'mobilizacao.csv';
        link.click();
    };

    const handleBatchPayment = async () => {
        if (selectedAssignments.length === 0) return;
        if (!window.confirm(`Confirma o pagamento de ${selectedAssignments.length} atribuições selecionadas?`)) return;

        console.log('🔄 Processing batch payments for:', selectedAssignments.length, 'assignments');

        try {
            for (const assignmentId of selectedAssignments) {
                const assignment = filteredAssignments.find(a => a.id === assignmentId);
                console.log('📋 Processing assignment:', assignment);

                if (assignment) {
                    const isPaid = payments.some(p => p.scheduleItemId === assignment.id);
                    if (!isPaid) {
                        const payment = {
                            id: crypto.randomUUID(),
                            scheduleItemId: assignment.id,
                            instructorId: assignment.instructorId,
                            amount: assignment.totalValue,
                            datePaid: new Date().toISOString(),
                            paidBy: currentUser.id
                        };
                        console.log('💰 Creating payment:', payment);
                        await addPayment(payment);
                        console.log('✅ Payment added successfully');
                    }
                }
            }
            setSelectedAssignments([]);
            console.log('✅ All batch payments processed successfully');
            alert('Pagamentos registrados com sucesso!');
        } catch (error) {
            console.error('❌ Error processing batch payments:', error);
            alert('Pagamentos foram salvos localmente, mas houve um problema ao sincronizar com o servidor.');
        }
    };

    const toggleSelection = (id: string) => {
        setSelectedAssignments(prev =>
            prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
        );
    };

    const toggleSelectAll = () => {
        const pendingAssignments = filteredAssignments.filter(a =>
            !payments.some(p => p.scheduleItemId === a.id)
        );
        if (selectedAssignments.length === pendingAssignments.length) {
            setSelectedAssignments([]);
        } else {
            setSelectedAssignments(pendingAssignments.map(a => a.id));
        }
    };

    const handlePaymentToggle = async (assignment: SetupTeardownAssignment) => {
        if (!canManage) return;

        console.log('🔄 Toggling payment for assignment:', assignment);
        const payment = payments.find(p => p.scheduleItemId === assignment.id);
        console.log('💰 Payment found:', payment);

        if (payment) {
            // Updated to remove confirmation as requested
            console.log('❌ Deleting payment:', payment.id);
            await deletePayment(payment.id);
        } else {
            // If Pending -> Pay
            const newPayment = {
                id: crypto.randomUUID(),
                scheduleItemId: assignment.id,
                instructorId: assignment.instructorId,
                amount: assignment.totalValue,
                datePaid: new Date().toISOString(),
                paidBy: currentUser.id
            };
            console.log('✅ Adding payment:', newPayment);
            await addPayment(newPayment);
        }
    };

    return (
        <>
            <div className="space-y-8 animate-fade-in">


                {/* Summary Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">A Pagar</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    filteredAssignments.filter(a => !payments.some(p => p.scheduleItemId === a.id)).reduce((sum, a) => sum + a.totalValue, 0)
                                )}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total Pago</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(
                                    filteredAssignments.filter(a => payments.some(p => p.scheduleItemId === a.id)).reduce((sum, a) => sum + a.totalValue, 0)
                                )}
                            </h3>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                        <div className="relative z-10">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 bg-green-100 rounded-xl text-green-600">
                                    <DollarSign size={24} />
                                </div>
                            </div>
                            <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Valor Total</p>
                            <h3 className="text-3xl font-bold text-gray-900 mt-1">
                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}
                            </h3>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
                        <div>
                            <StandardSelect
                                label="FILTRAR POR ANO"
                                value={filterYear}
                                onChange={(e) => setFilterYear(e.target.value)}
                                options={[
                                    { value: "", label: "TODOS OS ANOS" },
                                    ...availableYears.map(year => ({ value: year, label: year }))
                                ]}
                            />
                        </div>
                        <div>
                            <StandardSelect
                                label="FILTRAR POR CURSO"
                                value={filterCourse}
                                onChange={(e) => setFilterCourse(e.target.value)}
                                options={[
                                    { value: "", label: "TODOS OS CURSOS" },
                                    ...availableCourses.map(course => ({ value: course, label: course }))
                                ]}
                            />
                        </div>
                        <div>
                            <StandardSelect
                                label="FILTRAR POR TURMA"
                                value={filterClass}
                                onChange={(e) => setFilterClass(e.target.value)}
                                options={[
                                    { value: "", label: "TODAS AS TURMAS" },
                                    ...classes
                                        .filter(c => setupTeardownAssignments.some(a => a.classId === c.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(c => ({ value: c.id, label: c.name.toUpperCase() }))
                                ]}
                            />
                        </div>
                        <div>
                            <StandardSelect
                                label="FILTRAR POR TIPO"
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                options={[
                                    { value: "", label: "TODOS OS TIPOS" },
                                    { value: "Montagem", label: "MONTAGEM" },
                                    { value: "Desmontagem", label: "DESMONTAGEM" }
                                ]}
                            />
                        </div>
                        <div>
                            <StandardSelect
                                label="FILTRAR POR INSTRUTOR"
                                value={filterInstructor}
                                onChange={(e) => setFilterInstructor(e.target.value)}
                                options={[
                                    { value: "", label: "TODOS OS INSTRUTORES" },
                                    ...instructors
                                        .filter(i => setupTeardownAssignments.some(a => a.instructorId === i.id))
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(i => ({ value: i.id, label: i.name.toUpperCase() }))
                                ]}
                            />
                        </div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3 mb-4">
                    <button
                        onClick={exportToCSV}
                        className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center px-8 py-3 text-sm font-bold"
                    >
                        CSV
                    </button>
                    {canManage && selectedAssignments.length > 0 && (
                        <button
                            onClick={handleBatchPayment}
                            className="btn-base btn-edit flex items-center justify-center px-8 py-3 text-sm font-bold text-green-700 bg-green-100 hover:bg-green-200 border border-green-200"
                        >
                            PAGAR {selectedAssignments.length} ITEM(NS)
                        </button>
                    )}
                    {canManage && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="btn-base btn-insert flex items-center justify-center px-8 py-3 text-sm font-bold"
                        >
                            INSERIR
                        </button>
                    )}
                </div>

                {/* Table */}
                <div className="card-premium animate-fade-in text-gray-800">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    {canManage && (
                                        <th className="px-4 py-3 text-center w-10 border border-gray-200">
                                            <input
                                                type="checkbox"
                                                checked={selectedAssignments.length > 0 && selectedAssignments.length === filteredAssignments.filter(a => !payments.some(p => p.scheduleItemId === a.id)).length}
                                                onChange={toggleSelectAll}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                        </th>
                                    )}
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">TURMA</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">TIPO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">INSTRUTOR</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">DIAS</th>
                                    <th className="px-6 py-3 text-right text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">VALOR TOTAL</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">DATA</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">STATUS</th>
                                    {canManage && <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">AÇÕES</th>}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={canManage ? 9 : 7} className="px-6 py-12 text-center text-gray-500 border border-gray-200">
                                            <div className="flex flex-col items-center justify-center">
                                                <Wrench className="text-gray-300 mb-3" size={48} />
                                                <p className="text-lg font-medium text-gray-900">Nenhuma atribuição encontrada</p>
                                                <p className="text-sm text-gray-500">Tente ajustar os filtros ou adicione uma nova atribuição.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map(assignment => {
                                        const isPaid = payments.some(p => p.scheduleItemId === assignment.id);
                                        return (
                                            <tr key={assignment.id} className="hover:bg-gray-50">
                                                {canManage && (
                                                    <td className="px-4 py-4 text-center border border-gray-200">
                                                        {!isPaid && (
                                                            <input
                                                                type="checkbox"
                                                                checked={selectedAssignments.includes(assignment.id)}
                                                                onChange={() => toggleSelection(assignment.id)}
                                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                                            />
                                                        )}
                                                    </td>
                                                )}
                                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 border border-gray-200">{assignment.className}</td>

                                                <td className="px-6 py-4 whitespace-nowrap border border-gray-200">
                                                    <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${assignment.type === 'Montagem'
                                                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                        : 'bg-orange-50 text-orange-700 border-orange-200'
                                                        }`}>
                                                        {assignment.type.toUpperCase()}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap border border-gray-200">
                                                    <div className="text-sm font-medium text-gray-900">{assignment.instructorName}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 font-medium border border-gray-200">
                                                    <span className="bg-gray-100 px-2 py-1 rounded-md">{assignment.days}</span>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600 border border-gray-200">
                                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assignment.totalValue)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 border border-gray-200">
                                                    {assignment.endDate ? formatDate(assignment.endDate) : formatDate(assignment.date)}
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center border border-gray-200">
                                                    <button
                                                        onClick={() => handlePaymentToggle(assignment)}
                                                        disabled={!canManage}
                                                        className={`px-3 py-1 rounded-full text-xs font-bold transition-all transform hover:scale-105 login-uppercase ${isPaid
                                                            ? 'bg-green-100 text-green-800 hover:bg-red-100 hover:text-red-800'
                                                            : 'bg-yellow-100 text-yellow-800 hover:bg-green-100 hover:text-green-800'
                                                            } ${!canManage ? 'cursor-default hover:scale-100' : 'cursor-pointer'}`}
                                                        title={canManage ? (isPaid ? "Clique para cancelar pagamento" : "Clique para registrar pagamento") : ""}
                                                    >
                                                        {isPaid ? 'PAGO' : 'PENDENTE'}
                                                    </button>
                                                </td>
                                                {canManage && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2 border border-gray-200">
                                                        <button
                                                            onClick={() => handleOpenModal(assignment)}
                                                            className="btn-base btn-edit px-3 py-1 text-[10px]"
                                                            title="Editar"
                                                        >
                                                            EDITAR
                                                        </button>
                                                        <button
                                                            onClick={() => handleDelete(assignment.id)}
                                                            className="btn-base btn-delete px-3 py-1 text-[10px]"
                                                            title="Excluir"
                                                        >
                                                            EXCLUIR
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Pagination Controls */}
                {totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl border border-gray-200">
                        <span className="text-sm text-gray-700">
                            Mostrando <span className="font-medium">{indexOfFirstItem + 1}</span> a <span className="font-medium">{Math.min(indexOfLastItem, filteredAssignments.length)}</span> de <span className="font-medium">{filteredAssignments.length}</span> resultados
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                                disabled={currentPage === 1}
                                className="btn-base btn-pagination px-4 py-2 text-xs"
                            >
                                ANTERIOR
                            </button>
                            <button
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                                disabled={currentPage === totalPages}
                                className="btn-base btn-pagination px-4 py-2 text-xs"
                            >
                                PRÓXIMO
                            </button>
                        </div>
                    </div>
                )}

            </div>

            {/* Standard Modal */}
            <StandardModal isOpen={modalOpen} onClose={() => setModalOpen(false)} maxWidth="max-w-xl">
                <StandardModalHeader
                    title=""
                    onClose={() => setModalOpen(false)}
                />

                <StandardModalBody>
                    <div className="space-y-4">
                        {/* Year and Course Filters */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>ANO</label>
                                <select
                                    value={modalYear}
                                    onChange={(e) => {
                                        setModalYear(e.target.value);
                                        setFormData({ ...formData, classId: '' });
                                    }}
                                    className={inputClass}
                                >
                                    <option value="">TODOS</option>
                                    {modalAvailableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <StandardSelect
                                    label="ANO"
                                    value={modalYear}
                                    onChange={(e) => {
                                        setModalYear(e.target.value);
                                        setFormData({ ...formData, classId: '' });
                                    }}
                                    options={[
                                        { value: "", label: "TODOS" },
                                        ...modalAvailableYears.map(year => ({ value: year, label: year }))
                                    ]}
                                />
                            </div>
                            <div>
                                <StandardSelect
                                    label="CURSO"
                                    value={modalCourseId}
                                    onChange={(e) => {
                                        setModalCourseId(e.target.value);
                                        setFormData({ ...formData, classId: '' });
                                    }}
                                    options={[
                                        { value: "", label: "TODOS" },
                                        ...courses.sort((a, b) => a.name.localeCompare(b.name)).map(c => ({ value: c.id, label: c.name }))
                                    ]}
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>TURMA</label>
                            <select
                                value={formData.classId}
                                onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                className={inputClass}
                            >
                                <option value="">SELECIONE</option>
                                {classes
                                    .filter(c => {
                                        if (modalYear && new Date(c.startDate).getFullYear().toString() !== modalYear) return false;
                                        if (modalCourseId && c.courseId !== modalCourseId) return false;
                                        return true;
                                    })
                                    .sort((a, b) => a.name.localeCompare(b.name))
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>
                                    ))}
                            </select>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className={labelClass}>TIPO</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className={inputClass}
                                >
                                    <option value="Montagem">MONTAGEM</option>
                                    <option value="Desmontagem">DESMONTAGEM</option>
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>QTD. DIAS</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.days}
                                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                                    className={inputClass + " text-center font-bold"}
                                />
                            </div>
                        </div>

                        {/* Data de Realização */}
                        <div className="p-4 rounded-lg bg-gray-50 border border-gray-200">
                            <label className={labelClass + " mb-2 block"}>DATA DE REALIZAÇÃO</label>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">INÍCIO DD/MM/AAAA</label>
                                    <input
                                        type="date"
                                        value={formData.startDate}
                                        onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                                <div>
                                    <label className="text-[10px] font-bold text-gray-500 uppercase">TÉRMINO DD/MM/AAAA</label>
                                    <input
                                        type="date"
                                        value={formData.endDate}
                                        onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                                        className={inputClass}
                                    />
                                </div>
                            </div>
                        </div>

                        <div>
                            <StandardSelect
                                label="INSTRUTOR RESPONSÁVEL"
                                value={formData.instructorId}
                                onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                                options={[
                                    { value: "", label: "SELECIONE" },
                                    ...instructors.map(i => ({ value: i.id, label: i.name.toUpperCase() }))
                                ]}
                            />
                        </div>

                        <div className="p-4 rounded-lg border border-gray-200 bg-gray-50">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">VALOR TOTAL ESTIMADO</span>
                                <span className="text-xl font-bold" style={{ color: '#FF6B35' }}>
                                    {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.days * 350)}
                                </span>
                            </div>
                            <p className="text-xs text-gray-500 mt-1">BASEADO NA DIÁRIA DE R$ 350,00</p>
                        </div>

                        <div>
                            <label className={labelClass}>OBSERVAÇÕES (OPCIONAL)</label>
                            <textarea
                                value={formData.notes}
                                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                className={inputClass + " uppercase"}
                                rows={3}
                                placeholder="DETALHES ADICIONAIS SOBRE A LOGÍSTICA..."
                            />
                        </div>
                    </div>
                </StandardModalBody>

                <StandardModalFooter>
                    <button
                        onClick={() => setModalOpen(false)}
                        className="btn-base btn-cancel px-6 py-2.5 text-sm"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleSubmit}
                        className="btn-base btn-save px-6 py-2.5 text-sm"
                    >
                        {editingId ? 'SALVAR ALTERAÇÕES' : 'CRIAR ATRIBUIÇÃO'}
                    </button>
                </StandardModalFooter>
            </StandardModal>
        </>
    );
};
