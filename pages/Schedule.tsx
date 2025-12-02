import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, TrainingSchedule } from '../types';
import { Plus, Search, Filter, Edit2, Trash2, MapPin, Calendar, Truck, Users, Clock } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/dateUtils';

export const SchedulePage: React.FC = () => {
    const { currentUser, trainingSchedules, addTrainingSchedule, updateTrainingSchedule, deleteTrainingSchedule } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<TrainingSchedule | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<TrainingSchedule>>({});

    if (!currentUser || (currentUser.role !== UserRole.GESTOR && currentUser.role !== UserRole.COORDENADOR)) {
        return (
            <div className="flex items-center justify-center h-full">
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">Acesso Negado</h2>
                    <p className="text-gray-600">Você não tem permissão para acessar esta página.</p>
                </div>
            </div>
        );
    }

    const filteredSchedules = trainingSchedules.filter(s =>
        s.className.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.origin.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.destination.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleOpenModal = (schedule?: TrainingSchedule) => {
        if (schedule) {
            setEditingSchedule(schedule);
            setFormData(schedule);
        } else {
            setEditingSchedule(null);
            setFormData({});
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSchedule(null);
        setFormData({});
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        try {
            if (editingSchedule) {
                await updateTrainingSchedule(editingSchedule.id, formData);
            } else {
                await addTrainingSchedule(formData as TrainingSchedule);
            }
            handleCloseModal();
        } catch (error) {
            console.error('Error saving schedule:', error);
            alert('Erro ao salvar agendamento. Tente novamente.');
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este agendamento?')) {
            await deleteTrainingSchedule(id);
        }
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cronograma de Treinamentos</h1>
                    <p className="text-gray-500 mt-1">Gerencie o itinerário e agenda da unidade móvel.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="btn-primary flex items-center gap-2"
                >
                    <Plus size={20} />
                    Novo Agendamento
                </button>
            </div>

            {/* Filters */}
            <div className="flex gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm">
                <div className="flex-1 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                        type="text"
                        placeholder="Buscar por turma, local, origem ou destino..."
                        className="input-field pl-10 w-full"
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                    />
                </div>
                <button className="btn-secondary flex items-center gap-2">
                    <Filter size={20} />
                    Filtros
                </button>
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                        <thead className="bg-gray-50 text-gray-700 font-semibold border-b border-gray-200">
                            <tr>
                                <th className="p-4 min-w-[150px]">Turma</th>
                                <th className="p-4 min-w-[200px]">Deslocamento Medtruck</th>
                                <th className="p-4 min-w-[150px]">Montagem/Desmontagem</th>
                                <th className="p-4 min-w-[200px]">Teórico</th>
                                <th className="p-4 min-w-[200px]">Prático</th>
                                <th className="p-4 min-w-[150px]">Local</th>
                                <th className="p-4 text-right">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {filteredSchedules.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="p-8 text-center text-gray-500">
                                        Nenhum agendamento encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredSchedules.map((schedule) => (
                                    <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{schedule.className}</div>
                                            <div className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                                <MapPin size={12} />
                                                {schedule.origin} ➝ {schedule.destination}
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Truck size={12} className="text-blue-500" />
                                                    Saída: {formatDateTime(schedule.medtruckDisplacementStart)}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Truck size={12} className="text-green-500" />
                                                    Chegada: {formatDateTime(schedule.medtruckDisplacementEnd)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs text-gray-600">
                                                    <span className="font-medium">Mont:</span> {formatDate(schedule.setupDate)}
                                                </div>
                                                <div className="text-xs text-gray-600">
                                                    <span className="font-medium">Desm:</span> {formatDate(schedule.teardownDate)}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs text-gray-600">
                                                    {formatDateTime(schedule.theoryStart)} - {formatDateTime(schedule.theoryEnd)}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Users size={12} />
                                                    {schedule.theoryStudentCount} alunos
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="flex flex-col gap-1">
                                                <div className="text-xs text-gray-600">
                                                    {formatDateTime(schedule.practiceStart)} - {formatDateTime(schedule.practiceEnd)}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Users size={12} />
                                                    {schedule.practiceStudentCount} alunos
                                                </div>
                                            </div>
                                        </td>
                                        <td className="p-4">
                                            <div className="font-medium text-gray-900">{schedule.location}</div>
                                            <div className="text-xs text-gray-500">{schedule.studentLocality}</div>
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(schedule)}
                                                    className="p-1 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                    title="Editar"
                                                >
                                                    <Edit2 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                    title="Excluir"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                &times;
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-6">
                            {/* Section 1: Basic Info & Logistics */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-1">
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field w-full"
                                        value={formData.className || ''}
                                        onChange={e => setFormData({ ...formData, className: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Origem (De)</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field w-full"
                                        value={formData.origin || ''}
                                        onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destino (Para)</label>
                                    <input
                                        type="text"
                                        required
                                        className="input-field w-full"
                                        value={formData.destination || ''}
                                        onChange={e => setFormData({ ...formData, destination: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Truck size={16} /> Deslocamento Medtruck
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="input-field w-full"
                                            value={formData.medtruckDisplacementStart ? new Date(formData.medtruckDisplacementStart).toISOString().slice(0, 16) : ''}
                                            onChange={e => setFormData({ ...formData, medtruckDisplacementStart: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="input-field w-full"
                                            value={formData.medtruckDisplacementEnd ? new Date(formData.medtruckDisplacementEnd).toISOString().slice(0, 16) : ''}
                                            onChange={e => setFormData({ ...formData, medtruckDisplacementEnd: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Calendar size={16} /> Montagem e Desmontagem
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Montagem</label>
                                        <input
                                            type="date"
                                            required
                                            className="input-field w-full"
                                            value={formData.setupDate || ''}
                                            onChange={e => setFormData({ ...formData, setupDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Desmontagem</label>
                                        <input
                                            type="date"
                                            required
                                            className="input-field w-full"
                                            value={formData.teardownDate || ''}
                                            onChange={e => setFormData({ ...formData, teardownDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Users size={16} /> Treinamento Teórico
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="input-field w-full"
                                            value={formData.theoryStart ? new Date(formData.theoryStart).toISOString().slice(0, 16) : ''}
                                            onChange={e => setFormData({ ...formData, theoryStart: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="input-field w-full"
                                            value={formData.theoryEnd ? new Date(formData.theoryEnd).toISOString().slice(0, 16) : ''}
                                            onChange={e => setFormData({ ...formData, theoryEnd: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Qtd Alunos</label>
                                        <input
                                            type="number"
                                            required
                                            className="input-field w-full"
                                            value={formData.theoryStudentCount || ''}
                                            onChange={e => setFormData({ ...formData, theoryStudentCount: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Users size={16} /> Treinamento Prático
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Início</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="input-field w-full"
                                            value={formData.practiceStart ? new Date(formData.practiceStart).toISOString().slice(0, 16) : ''}
                                            onChange={e => setFormData({ ...formData, practiceStart: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Final</label>
                                        <input
                                            type="datetime-local"
                                            required
                                            className="input-field w-full"
                                            value={formData.practiceEnd ? new Date(formData.practiceEnd).toISOString().slice(0, 16) : ''}
                                            onChange={e => setFormData({ ...formData, practiceEnd: new Date(e.target.value).toISOString() })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Qtd Alunos</label>
                                        <input
                                            type="number"
                                            required
                                            className="input-field w-full"
                                            value={formData.practiceStudentCount || ''}
                                            onChange={e => setFormData({ ...formData, practiceStudentCount: parseInt(e.target.value) })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <MapPin size={16} /> Localização
                                </h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Localidade Alunos</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field w-full"
                                            value={formData.studentLocality || ''}
                                            onChange={e => setFormData({ ...formData, studentLocality: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Local do Treinamento</label>
                                        <input
                                            type="text"
                                            required
                                            className="input-field w-full"
                                            value={formData.location || ''}
                                            onChange={e => setFormData({ ...formData, location: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end gap-3 pt-6 border-t border-gray-100">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="btn-ghost"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-primary"
                                >
                                    {editingSchedule ? 'Salvar Alterações' : 'Criar Agendamento'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
