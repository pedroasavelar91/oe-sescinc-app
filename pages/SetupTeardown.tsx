import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { SetupTeardownAssignment, UserRole } from '../types';
import { Wrench, Plus, Trash2, Edit2, DollarSign, Calendar, User } from 'lucide-react';

export const SetupTeardownPage: React.FC = () => {
    const { currentUser, classes, users, setupTeardownAssignments, addSetupTeardownAssignment, deleteSetupTeardownAssignment } = useStore();
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
            date: new Date().toISOString().split('T')[0],
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

    return (
        <div className="p-6 space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                        <Wrench className="text-primary-600" size={32} />
                        Montagem / Desmontagem
                    </h1>
                    <p className="text-gray-600 mt-1">Gerencie atribuições de montagem e desmontagem de turmas</p>
                </div>
                {canManage && (
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                    >
                        <Plus size={20} />
                        Nova Atribuição
                    </button>
                )}
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total de Atribuições</p>
                            <p className="text-2xl font-bold text-gray-900">{filteredAssignments.length}</p>
                        </div>
                        <Wrench className="text-primary-600" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Total de Dias</p>
                            <p className="text-2xl font-bold text-gray-900">{filteredAssignments.reduce((sum, a) => sum + a.days, 0)}</p>
                        </div>
                        <Calendar className="text-blue-600" size={32} />
                    </div>
                </div>
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm text-gray-600">Valor Total</p>
                            <p className="text-2xl font-bold text-green-600">R$ {totalValue.toFixed(2)}</p>
                        </div>
                        <DollarSign className="text-green-600" size={32} />
                    </div>
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Turma</label>
                        <select
                            value={filterClass}
                            onChange={(e) => setFilterClass(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Todas as Turmas</option>
                            {classes.map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Filtrar por Tipo</label>
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as any)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        >
                            <option value="">Todos os Tipos</option>
                            <option value="Montagem">Montagem</option>
                            <option value="Desmontagem">Desmontagem</option>
                        </select>
                    </div>
                </div>
            </div>

            {/* Table */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Turma</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Instrutor</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Dias</th>
                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Valor Total</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Data</th>
                                <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Status Pagamento</th>
                                {canManage && <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filteredAssignments.length === 0 ? (
                                <tr>
                                    <td colSpan={canManage ? 8 : 7} className="px-6 py-8 text-center text-gray-500">
                                        Nenhuma atribuição encontrada
                                    </td>
                                </tr>
                            ) : (
                                filteredAssignments.map(assignment => {
                                    const isPaid = payments.some(p => p.scheduleItemId === assignment.id);
                                    return (
                                        <tr key={assignment.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{assignment.className}</td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-md ${assignment.type === 'Montagem'
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-orange-100 text-orange-800'
                                                    }`}>
                                                    {assignment.type === 'Montagem' ? '🔧 ' : '📦 '}
                                                    {assignment.type}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">{assignment.instructorName}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                                                <span className="font-semibold text-gray-900">{assignment.days}</span>
                                                <span className="text-xs text-gray-500 ml-1">dias</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-right">
                                                <span className="font-bold text-primary-600">R$ {assignment.totalValue.toFixed(2)}</span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{new Date(assignment.date).toLocaleDateString('pt-BR')}</td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className={`px-2 py-1 rounded-full text-xs font-bold ${isPaid ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
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
                                                                        scheduleItemId: assignment.id,
                                                                        instructorId: assignment.instructorId,
                                                                        amount: assignment.totalValue,
                                                                        datePaid: new Date().toISOString(),
                                                                        paidBy: currentUser.id
                                                                    });
                                                                }
                                                            }}
                                                            className="text-green-600 hover:text-green-800 transition-colors"
                                                            title="Registrar Pagamento"
                                                        >
                                                            <DollarSign size={18} />
                                                        </button>
                                                    )}
                                                    <button
                                                        onClick={() => handleDelete(assignment.id)}
                                                        className="text-red-600 hover:text-red-800 transition-colors"
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
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-gray-200 rounded-t-xl">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {editingId ? 'Editar' : 'Nova'} Atribuição
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Turma *</label>
                                <select
                                    value={formData.classId}
                                    onChange={(e) => setFormData({ ...formData, classId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Selecione uma turma</option>
                                    {classes.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Tipo *</label>
                                <select
                                    value={formData.type}
                                    onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="Montagem">Montagem</option>
                                    <option value="Desmontagem">Desmontagem</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Instrutor *</label>
                                <select
                                    value={formData.instructorId}
                                    onChange={(e) => setFormData({ ...formData, instructorId: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                >
                                    <option value="">Selecione um instrutor</option>
                                    {instructors.map(i => (
                                        <option key={i.id} value={i.id}>{i.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade de Dias *</label>
                                <input
                                    type="number"
                                    min="1"
                                    value={formData.days}
                                    onChange={(e) => setFormData({ ...formData, days: parseInt(e.target.value) || 1 })}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                />
                            </div>
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex justify-between items-center">
                                    <span className="text-sm font-medium text-gray-700">Valor Total:</span>
                                    <span className="text-2xl font-bold text-green-600">R$ {(formData.days * 350).toFixed(2)}</span>
                                </div>
                                <p className="text-xs text-gray-500 mt-1">R$ 350,00 por dia</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Observações</label>
                                <textarea
                                    value={formData.notes}
                                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    placeholder="Observações adicionais..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setModalOpen(false)}
                                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSubmit}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors"
                            >
                                {editingId ? 'Salvar' : 'Criar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
