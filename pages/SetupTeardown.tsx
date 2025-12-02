import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { SetupTeardownAssignment, UserRole } from '../types';
import { Wrench, Plus, Trash2, Edit2, DollarSign, Calendar, User, Download, ArrowUpRight, ArrowDownLeft, Filter, Search } from 'lucide-react';
import { formatDate, getCurrentDateString } from '../utils/dateUtils';

export const SetupTeardownPage: React.FC = () => {
    const { currentUser, classes, users, setupTeardownAssignments, addSetupTeardownAssignment, deleteSetupTeardownAssignment, payments, addPayment } = useStore();
    const [modalOpen, setModalOpen] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [filterClass, setFilterClass] = useState('');
    const [filterType, setFilterType] = useState<'' | 'Montagem' | 'Desmontagem'>('');

    // Form state
    const [formData, setFormData] = useState({
        classId: '',
        type: 'Montagem' as 'Montagem' | 'Desmontagem',
        instructorId: '',
        days: 1,
        notes: ''
    });

    if (!currentUser) return null;

    const canManage = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;
    const instructors = users.filter(u => u.role === UserRole.INSTRUTOR || u.role === UserRole.AUXILIAR_INSTRUCAO);

    const filteredAssignments = useMemo(() => {
        return setupTeardownAssignments.filter(a => {
            if (filterClass && a.classId !== filterClass) return false;
            if (filterType && a.type !== filterType) return false;
            return true;
        });
    }, [setupTeardownAssignments, filterClass, filterType]);

    const totalValue = filteredAssignments.reduce((sum, a) => sum + a.totalValue, 0);

    const handleOpenModal = (assignment?: SetupTeardownAssignment) => {
        if (assignment) {
            setEditingId(assignment.id);
            setFormData({
                classId: assignment.classId,
                type: assignment.type,
                instructorId: assignment.instructorId,
                days: assignment.days,
                notes: assignment.notes || ''
            });
        } else {
            setEditingId(null);
            setFormData({
                classId: '',
                type: 'Montagem',
                instructorId: '',
                days: 1,
                notes: ''
            });
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
            id: editingId || Math.random().toString(36).substr(2, 9),
            classId: formData.classId,
            className: selectedClass.name,
            type: formData.type,
            instructorId: formData.instructorId,
            instructorName: selectedInstructor.name,
            days: formData.days,
            rate: 350,
            totalValue: formData.days * 350,
            date: getCurrentDateString(),
            notes: formData.notes
        };

        addSetupTeardownAssignment(assignment);
        setModalOpen(false);
    };

    const handleDelete = (id: string) => {
        if (confirm('Deseja realmente excluir esta atribuição?')) {
            deleteSetupTeardownAssignment(id);
        }
    };

    const exportToCSV = () => {
        const headers = ['Turma', 'Tipo', 'Instrutor', 'Dias', 'Valor Total', 'Data', 'Status Pagamento', 'Observações'];
        const csvContent = [
            headers.join(','),
            ...filteredAssignments.map(a => {
                const isPaid = payments.some(p => p.referenceId === a.id);
                return [
                    `"${a.className}"`,
                    a.type,
                    `"${a.instructorName}"`,
                    a.days,
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
        link.download = 'montagem_desmontagem.csv';
        link.click();
    };

    return (
        <div className="space-y-8 animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Montagem e Desmontagem</h1>
                    <p className="text-gray-500 mt-1">Gerencie as atribuições de logística e pagamentos</p>
                </div>
                <div className="flex gap-3">
                    <button
                        onClick={exportToCSV}
                        className="px-4 py-2 bg-white text-gray-700 border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm font-medium flex items-center gap-2"
                    >
                        <Download size={18} />
                        Exportar CSV
                    </button>
                    {canManage && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-200 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
                        >
                            <Plus size={20} />
                            Nova Atribuição
                        </button>
                    )}
                </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-blue-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-blue-100 rounded-xl text-blue-600">
                                <Wrench size={24} />
                            </div>
                            <span className="flex items-center text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">
                                <Filter size={14} className="mr-1" />
                                Total
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total de Atribuições</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{filteredAssignments.length}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-orange-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-orange-100 rounded-xl text-orange-600">
                                <Calendar size={24} />
                            </div>
                            <span className="flex items-center text-xs font-bold text-orange-600 bg-orange-50 px-2 py-1 rounded-lg">
                                <ArrowUpRight size={14} className="mr-1" />
                                Dias
                            </span>
                        </div>
                        <p className="text-sm font-medium text-gray-500 uppercase tracking-wide">Total de Dias</p>
                        <h3 className="text-3xl font-bold text-gray-900 mt-1">{filteredAssignments.reduce((sum, a) => sum + a.days, 0)}</h3>
                    </div>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 relative overflow-hidden group hover:shadow-md transition-all">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-green-50 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-110"></div>
                    <div className="relative z-10">
                        <div className="flex items-center justify-between mb-4">
                            <div className="p-3 bg-green-100 rounded-xl text-green-600">
                                <DollarSign size={24} />
                            </div>
                            <span className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-2 py-1 rounded-lg">
                                <ArrowUpRight size={14} className="mr-1" />
                                Receita
                            </span>
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
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Filtrar por Turma</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={filterClass}
                                onChange={(e) => setFilterClass(e.target.value)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none"
                            >
                                <option value="">Todas as Turmas</option>
                                {classes.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Filtrar por Tipo</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                value={filterType}
                                onChange={(e) => setFilterType(e.target.value as any)}
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none"
                            >
                                <option value="">Todos os Tipos</option>
                                <option value="Montagem">Montagem</option>
                                <option value="Desmontagem">Desmontagem</option>
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Turma</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Instrutor</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Dias</th>
                                <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Valor Total</th>
                                <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status Pagamento</th>
                                {canManage && <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 8 : 7} className="px-6 py-12 text-center text-gray-500">
                                        <div className="flex flex-col items-center justify-center">
                                            <Wrench className="text-gray-300 mb-3" size={48} />
                                            <p className="text-lg font-medium text-gray-900">Nenhuma atribuição encontrada</p>
                                            <p className="text-sm text-gray-500">Tente ajustar os filtros ou adicione uma nova atribuição.</p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map(assignment => {
                                    const isPaid = payments.some(p => p.referenceId === assignment.id);
                                    return (
                                        <tr key={assignment.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900">{assignment.className}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full border ${assignment.type === 'Montagem'
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200'
                                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                                    }`}>
                                                    {assignment.type === 'Montagem' ? <Wrench size={12} className="mr-1" /> : <Calendar size={12} className="mr-1" />}
                                                    {assignment.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center">
                                                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs mr-3">
                                                        {assignment.instructorName.charAt(0)}
                                                    </div>
                                                    <div className="text-sm font-medium text-gray-900">{assignment.instructorName}</div>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm text-gray-700 font-medium">
                                                <span className="bg-gray-100 px-2 py-1 rounded-md">{assignment.days}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-bold text-green-600">
                                                {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(assignment.totalValue)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                {formatDate(assignment.date)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-bold rounded-full ${isPaid
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                                    }`}>
                                                    {isPaid ? 'Pago' : 'Pendente'}
                                                </span>
                                            </td>
                                            {canManage && (
                                                <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2">
                                                    {!isPaid && (
                                                        <button
                                                            onClick={() => {
                                                                if (confirm(`Confirmar pagamento de R$ ${assignment.totalValue.toFixed(2)} para ${assignment.instructorName}?`)) {
                                                                    addPayment({
                                                                        id: Math.random().toString(36).substr(2, 9),
                                                                        referenceId: assignment.id,
                                                                        type: 'SETUP_TEARDOWN',
                                                                        instructorId: assignment.instructorId,
                                                                        amount: assignment.totalValue,
                                                                        date: new Date().toISOString(),
                                                                        status: 'PAID',
                                                                        notes: `Pagamento de ${assignment.type} - ${assignment.className}`
                                                                    });
                                                                }
                                                            }}
                                                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                                                            title="Registrar Pagamento"
                                                        >
                                                            <DollarSign size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleOpenModal(assignment)}
                                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit2 size={18} />
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(assignment.id)}
                                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                        title="Excluir"
                                                    >
                                                        <Trash2 size={18} />
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

            {/* Modal */}
            {modalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop backdrop-blur-sm bg-gray-900/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] flex flex-col">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {editingId ? <Edit2 size={20} className="text-primary-600" /> : <Plus size={20} className="text-primary-600" />}
                                {editingId ? 'Editar Atribuição' : 'Nova Atribuição'}
                            </h2>
                            <button onClick={() => setModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="sr-only">Fechar</span>
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        <div className="p-6 space-y-5 overflow-y-auto">
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Turma</label>
                                <select
                                    value={formData.classId}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                >
                                    <option value="">Selecione uma turma...</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Tipo</label>
                                    <select
                                        value={formData.type}
                                        onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    >
                                        <option value="Montagem">Montagem</option>
                                        <option value="Desmontagem">Desmontagem</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Qtd. Dias</label>
                                    <input
                                        type="number"
                                        min="1"
                                        value={formData.days}
                                        onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Instrutor Responsável</label>
                                <select
                                    value={formData.instructorId}
                                    onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                >
                                    <option value="">Selecione um instrutor...</option>
                                    {instructors.map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-primary-50 p-4 rounded-xl border border-primary-100">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-primary-700">Valor Total Estimado</span>
                                    <span className="text-xl font-bold text-primary-700">
                                        {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(formData.days * 350)}
                                    </span>
                                </div>
                                <p className="text-xs text-primary-500 mt-1">Baseado na diária de R$ 350,00</p>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Observações (Opcional)</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    rows={3}
                                    placeholder="Detalhes adicionais sobre a logística..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-md transform hover:-translate-y-0.5 transition-all"
                            >
                                {editingId ? 'Salvar Alterações' : 'Criar Atribuição'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
