import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, TrainingSchedule } from '../types';
import { Plus, Search, Filter, Edit2, Trash2, MapPin, Calendar, Truck, Users, Clock, Download, FileText } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const SchedulePage: React.FC = () => {
    const { currentUser, trainingSchedules, addTrainingSchedule, updateTrainingSchedule, deleteTrainingSchedule } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<TrainingSchedule | null>(null);

    // Form State
    const [formData, setFormData] = useState<Partial<TrainingSchedule>>({});

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

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

    const exportToCSV = () => {
        const headers = ['Turma', 'Origem', 'Destino', 'Deslocamento Ida', 'Deslocamento Volta', 'Montagem', 'Desmontagem', 'Teórico Início', 'Teórico Fim', 'Alunos Teórico', 'Prático Início', 'Prático Fim', 'Alunos Prático', 'Local', 'Localidade Alunos'];
        const csvContent = [
            headers.join(','),
            ...filteredSchedules.map(s => [
                `"${s.className}"`,
                `"${s.origin}"`,
                `"${s.destination}"`,
                formatDate(s.medtruckDisplacementStart),
                formatDate(s.medtruckDisplacementEnd),
                formatDate(s.setupDate),
                formatDate(s.teardownDate),
                formatDate(s.theoryStart),
                formatDate(s.theoryEnd),
                s.theoryStudentCount,
                formatDate(s.practiceStart),
                formatDate(s.practiceEnd),
                s.practiceStudentCount,
                `"${s.location}"`,
                `"${s.studentLocality}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'cronograma.csv';
        link.click();
    };

    const exportToPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4');
        doc.text('Cronograma de Treinamentos', 14, 15);

        const tableData = filteredSchedules.map(s => [
            s.className,
            `${s.origin} -> ${s.destination}`,
            `${formatDate(s.medtruckDisplacementStart)} - ${formatDate(s.medtruckDisplacementEnd)}`,
            `${formatDate(s.setupDate)} / ${formatDate(s.teardownDate)}`,
            `${formatDate(s.theoryStart)} (${s.theoryStudentCount})`,
            `${formatDate(s.practiceStart)} (${s.practiceStudentCount})`,
            s.location
        ]);

        autoTable(doc, {
            head: [['Turma', 'Rota', 'Deslocamento', 'Mont/Desm', 'Teórico', 'Prático', 'Local']],
            body: tableData,
            startY: 20,
            styles: { fontSize: 8 },
            headStyles: { fillColor: [22, 163, 74] }
        });

        doc.save('cronograma.pdf');
    };

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Cronograma de Treinamentos</h1>
                    <p className="text-gray-500 mt-1">Gerencie o itinerário e agenda da unidade móvel.</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={exportToCSV}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors shadow-sm"
                        title="Exportar CSV"
                    >
                        <FileText size={18} className="text-gray-500" />
                        CSV
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 font-medium transition-colors shadow-sm"
                        title="Exportar PDF"
                    >
                        <Download size={18} className="text-gray-500" />
                        PDF
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="flex items-center gap-2 px-4 py-2 bg-[#F97316] hover:bg-[#EA580C] text-white rounded-lg font-medium transition-colors shadow-sm"
                    >
                        <Plus size={20} />
                        Inserir
                    </button>
                </div>
            </div>

            {/* Filters */}
            <div className="flex gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm animate-fade-in delay-100">
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
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-slide-up delay-200">
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
                                    <tr key={schedule.id} className="hover:bg-gray-50 transition-colors stagger-item">
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
                                                    Saída: {formatDate(schedule.medtruckDisplacementStart)}
                                                </div>
                                                <div className="flex items-center gap-1 text-xs text-gray-600">
                                                    <Truck size={12} className="text-green-500" />
                                                    Chegada: {formatDate(schedule.medtruckDisplacementEnd)}
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
                                                    {formatDate(schedule.theoryStart)} - {formatDate(schedule.theoryEnd)}
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
                                                    {formatDate(schedule.practiceStart)} - {formatDate(schedule.practiceEnd)}
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
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h2 className="text-xl font-bold text-gray-900">
                                {editingSchedule ? 'Editar Agendamento' : 'Novo Agendamento'}
                            </h2>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="text-3xl">&times;</span>
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
                                        className={inputClass}
                                        value={formData.className || ''}
                                        onChange={e => setFormData({ ...formData, className: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Origem (De)</label>
                                    <input
                                        type="text"
                                        required
                                        className={inputClass}
                                        value={formData.origin || ''}
                                        onChange={e => setFormData({ ...formData, origin: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Destino (Para)</label>
                                    <input
                                        type="text"
                                        required
                                        className={inputClass}
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
                                            type="date"
                                            required
                                            className={inputClass}
                                            value={formData.medtruckDisplacementStart ? formData.medtruckDisplacementStart.split('T')[0] : ''}
                                            onChange={e => setFormData({ ...formData, medtruckDisplacementStart: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                                        <input
                                            type="date"
                                            required
                                            className={inputClass}
                                            value={formData.medtruckDisplacementEnd ? formData.medtruckDisplacementEnd.split('T')[0] : ''}
                                            onChange={e => setFormData({ ...formData, medtruckDisplacementEnd: e.target.value })}
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
                                            className={inputClass}
                                            value={formData.setupDate || ''}
                                            onChange={e => setFormData({ ...formData, setupDate: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Data Desmontagem</label>
                                        <input
                                            type="date"
                                            required
                                            className={inputClass}
                                            value={formData.teardownDate || ''}
                                            onChange={e => setFormData({ ...formData, teardownDate: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-100 pt-4">
                                <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <Users size={16} /> Composição da Turma (Por Base)
                                </h3>
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 mb-4">
                                    <div className="flex gap-2 mb-2">
                                        <input
                                            type="text"
                                            placeholder="Nome da Base"
                                            className={`${inputClass} flex-1`}
                                            id="baseInput"
                                        />
                                        <input
                                            type="number"
                                            placeholder="Qtd"
                                            className={`${inputClass} w-24`}
                                            id="countInput"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => {
                                                const baseInput = document.getElementById('baseInput') as HTMLInputElement;
                                                const countInput = document.getElementById('countInput') as HTMLInputElement;
                                                const base = baseInput.value;
                                                const count = parseInt(countInput.value);

                                                if (base && count > 0) {
                                                    const currentBreakdown = formData.studentBreakdown || [];
                                                    const newBreakdown = [...currentBreakdown, { base, count }];
                                                    const total = newBreakdown.reduce((sum, item) => sum + item.count, 0);

                                                    setFormData({
                                                        ...formData,
                                                        studentBreakdown: newBreakdown,
                                                        theoryStudentCount: total,
                                                        practiceStudentCount: total
                                                    });

                                                    baseInput.value = '';
                                                    countInput.value = '';
                                                    baseInput.focus();
                                                }
                                            }}
                                            className="btn-secondary"
                                        >
                                            Adicionar
                                        </button>
                                    </div>

                                    {formData.studentBreakdown && formData.studentBreakdown.length > 0 && (
                                        <div className="space-y-2 mt-3">
                                            {formData.studentBreakdown.map((item, index) => (
                                                <div key={index} className="flex justify-between items-center bg-white p-2 rounded border border-gray-200 text-sm">
                                                    <span className="font-medium text-gray-700">{item.base}</span>
                                                    <div className="flex items-center gap-3">
                                                        <span className="bg-primary-50 text-primary-700 px-2 py-0.5 rounded-full font-bold">
                                                            {item.count} alunos
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const newBreakdown = formData.studentBreakdown!.filter((_, i) => i !== index);
                                                                const total = newBreakdown.reduce((sum, item) => sum + item.count, 0);
                                                                setFormData({
                                                                    ...formData,
                                                                    studentBreakdown: newBreakdown,
                                                                    theoryStudentCount: total,
                                                                    practiceStudentCount: total
                                                                });
                                                            }}
                                                            className="text-red-500 hover:text-red-700"
                                                        >
                                                            <Trash2 size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                            <div className="flex justify-end pt-2 border-t border-gray-200">
                                                <span className="text-sm font-bold text-gray-900">
                                                    Total: {formData.studentBreakdown.reduce((sum, item) => sum + item.count, 0)} alunos
                                                </span>
                                            </div>
                                        </div>
                                    )}
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
                                            type="date"
                                            required
                                            className={inputClass}
                                            value={formData.theoryStart ? formData.theoryStart.split('T')[0] : ''}
                                            onChange={e => setFormData({ ...formData, theoryStart: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Término</label>
                                        <input
                                            type="date"
                                            required
                                            className={inputClass}
                                            value={formData.theoryEnd ? formData.theoryEnd.split('T')[0] : ''}
                                            onChange={e => setFormData({ ...formData, theoryEnd: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Qtd Alunos</label>
                                        <input
                                            type="number"
                                            required
                                            className={`${inputClass} bg-gray-50`}
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
                                            type="date"
                                            required
                                            className={inputClass}
                                            value={formData.practiceStart ? formData.practiceStart.split('T')[0] : ''}
                                            onChange={e => setFormData({ ...formData, practiceStart: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Final</label>
                                        <input
                                            type="date"
                                            required
                                            className={inputClass}
                                            value={formData.practiceEnd ? formData.practiceEnd.split('T')[0] : ''}
                                            onChange={e => setFormData({ ...formData, practiceEnd: e.target.value })}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Qtd Alunos</label>
                                        <input
                                            type="number"
                                            required
                                            className={`${inputClass} bg-gray-50`}
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
                                <div className="grid grid-cols-1 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Local do Treinamento</label>
                                        <input
                                            type="text"
                                            required
                                            className={inputClass}
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
                                    className="px-6 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 bg-white font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    className="btn-premium bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-2.5 rounded-lg shadow-md font-semibold transition-all duration-200"
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
