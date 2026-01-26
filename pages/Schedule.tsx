import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, TrainingSchedule } from '../types';
import { Plus, Search, Edit2, Trash2, MapPin, Calendar, Truck, Users, Clock, Download, FileText } from 'lucide-react';
import { formatDate, formatDateTime } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter, inputClass, labelClass } from '../components/StandardModal';
import { StandardSelect } from '../components/StandardSelect';
import { GanttChart } from '../components/GanttChart';
import { List, Calendar as CalendarIcon } from 'lucide-react';

export const SchedulePage: React.FC = () => {
    const { currentUser, trainingSchedules, addTrainingSchedule, updateTrainingSchedule, deleteTrainingSchedule, bases, courses } = useStore();

    // Filters
    const [monthFilter, setMonthFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [locationFilter, setLocationFilter] = useState('');

    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<TrainingSchedule | null>(null);

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Form State
    const [formData, setFormData] = useState<Partial<TrainingSchedule>>({});

    // View Mode
    const [viewMode, setViewMode] = useState<'list' | 'gantt'>('list');

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

    const filteredSchedules = trainingSchedules
        .filter(s => {
            const date = new Date(s.medtruckDisplacementStart);
            const month = (date.getMonth() + 1).toString();
            const year = date.getFullYear().toString();

            if (monthFilter && month !== monthFilter) return false;
            if (yearFilter && year !== yearFilter) return false;
            if (locationFilter && s.location !== locationFilter) return false;
            return true;
        })
        .sort((a, b) => {
            if (!a.medtruckDisplacementStart) return 1;
            if (!b.medtruckDisplacementStart) return -1;
            return a.medtruckDisplacementStart.localeCompare(b.medtruckDisplacementStart);
        });

    // Pagination Logic
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredSchedules.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredSchedules.length / itemsPerPage);

    const uniqueLocations = Array.from(new Set(trainingSchedules.map(s => s.location))).sort();

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
            courses.find(c => c.id === s.courseId)?.name || 'N/A',
            s.className,
            s.origin,
            s.destination,
            formatDate(s.medtruckDisplacementStart),
            formatDate(s.medtruckDisplacementEnd),
            formatDate(s.setupDate),
            formatDate(s.teardownDate),
            s.glpRefillDate ? formatDate(s.glpRefillDate) : '-',
            formatDate(s.theoryStart),
            formatDate(s.theoryEnd),
            s.theoryStudentCount,
            s.instructorCount || 0,
            formatDate(s.practiceStart),
            formatDate(s.practiceEnd),
            s.practiceStudentCount,
            s.location,
            s.studentBreakdown ? s.studentBreakdown.map(b => `${b.base}: ${b.count}`).join(', ') : '-',
            (s as any).created_at ? formatDateTime((s as any).created_at) : '-'
        ]);

        autoTable(doc, {
            head: [[
                'Curso', 'Turma', 'Origem', 'Destino', 'Ida Truck', 'Volta Truck',
                'Montagem', 'Desmontagem', 'GLP', 'Início Teór.', 'Fim Teór.',
                'Alunos Teór.', 'Instrutores', 'Início Prát.', 'Fim Prát.',
                'Alunos Prát.', 'Local', 'Composição', 'Criado Em'
            ]],
            body: tableData,
            startY: 20,
            styles: { fontSize: 6 },
            headStyles: { fillColor: [22, 163, 74] },
            columnStyles: {
                0: { cellWidth: 15 },
                17: { cellWidth: 20 }
            }
        });

        doc.save('cronograma.pdf');
    };

    return (
        <>
            <div className="space-y-6 mb-8">
                <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-slide-down">
                    <div className="flex-1 w-full md:max-w-4xl">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <StandardSelect
                                label="MÊS"
                                value={monthFilter}
                                onChange={(e) => setMonthFilter(e.target.value)}
                                options={[
                                    { value: "", label: "TODOS" },
                                    { value: "1", label: "JANEIRO" },
                                    { value: "2", label: "FEVEREIRO" },
                                    { value: "3", label: "MARÇO" },
                                    { value: "4", label: "ABRIL" },
                                    { value: "5", label: "MAIO" },
                                    { value: "6", label: "JUNHO" },
                                    { value: "7", label: "JULHO" },
                                    { value: "8", label: "AGOSTO" },
                                    { value: "9", label: "SETEMBRO" },
                                    { value: "10", label: "OUTUBRO" },
                                    { value: "11", label: "NOVEMBRO" },
                                    { value: "12", label: "DEZEMBRO" }
                                ]}
                            />
                            <StandardSelect
                                label="ANO"
                                value={yearFilter}
                                onChange={(e) => setYearFilter(e.target.value)}
                                options={[
                                    { value: "", label: "TODOS" },
                                    ...Array.from(new Set(trainingSchedules.map(s => new Date(s.theoryStart).getFullYear()))).sort().map(y => ({
                                        value: y.toString(),
                                        label: y.toString()
                                    }))
                                ]}
                            />
                            <StandardSelect
                                label="LOCALIZAÇÃO"
                                value={locationFilter}
                                onChange={(e) => setLocationFilter(e.target.value)}
                                options={[
                                    { value: "", label: "TODAS" },
                                    ...uniqueLocations.map(loc => ({
                                        value: loc,
                                        label: loc
                                    }))
                                ]}
                            />
                        </div>
                    </div>
                </div>
                <div className="flex justify-end items-center gap-2">
                    <div className="flex gap-2 mr-2">
                        <button
                            onClick={() => setViewMode('list')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all duration-200 ${viewMode === 'list' ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            TABELA
                        </button>
                        <button
                            onClick={() => setViewMode('gantt')}
                            className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all duration-200 ${viewMode === 'gantt' ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                        >
                            CALENDÁRIO
                        </button>
                    </div>

                    <button
                        onClick={exportToCSV}
                        className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center px-8 py-3 text-sm font-bold"
                        title="EXPORTAR CSV"
                    >
                        CSV
                    </button>
                    <button
                        onClick={exportToPDF}
                        className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 flex items-center justify-center px-8 py-3 text-sm font-bold"
                        title="EXPORTAR PDF"
                    >
                        PDF
                    </button>
                    <button
                        onClick={() => handleOpenModal()}
                        className="btn-base btn-insert flex items-center justify-center px-8 py-3 text-sm font-bold shadow-lg shadow-green-500/30"
                    >
                        INSERIR
                    </button>
                </div>
            </div>

            {/* Content View */}
            <div className="card-premium animate-fade-in text-gray-800">
                {viewMode === 'list' ? (
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200 min-w-[200px]">CURSO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">TURMA</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">ORIGEM</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">DESTINO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">IDA MEDTRUCK</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">VOLTA MEDTRUCK</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">MONTAGEM</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">DESMONTAGEM</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">RECARGA GLP</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">INÍCIO TEÓRICO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">FIM TEÓRICO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">ALUNOS TEÓRICO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">INSTRUTORES</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">INÍCIO PRÁTICO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">FIM PRÁTICO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">ALUNOS PRÁTICO</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">LOCAL</th>
                                    <th className="px-6 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200 min-w-[200px]">COMPOSIÇÃO</th>
                                    <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">AÇÕES</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={19} className="px-6 py-12 text-center text-gray-500 border border-gray-200">
                                            <div className="flex flex-col items-center justify-center">
                                                <Calendar className="text-gray-300 mb-3" size={48} />
                                                <p className="text-lg font-medium text-gray-900">NENHUM AGENDAMENTO ENCONTRADO</p>
                                                <p className="text-sm text-gray-500 uppercase">TENTE AJUSTAR OS FILTROS OU ADICIONE UM NOVO AGENDAMENTO.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    currentItems.map((schedule) => (
                                        <tr key={schedule.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-900 font-bold uppercase">
                                                {courses.find(c => c.id === schedule.courseId)?.name || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase font-bold">
                                                {schedule.className}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {schedule.origin}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {schedule.destination}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {formatDate(schedule.medtruckDisplacementStart)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {formatDate(schedule.medtruckDisplacementEnd)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {formatDate(schedule.setupDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {formatDate(schedule.teardownDate)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 font-bold uppercase">
                                                {schedule.glpRefillDate ? formatDate(schedule.glpRefillDate) : '-'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {formatDate(schedule.theoryStart)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {formatDate(schedule.theoryEnd)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-900 font-bold uppercase">
                                                {schedule.theoryStudentCount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {schedule.instructorCount || 0}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {formatDate(schedule.practiceStart)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-500 uppercase">
                                                {formatDate(schedule.practiceEnd)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-900 font-bold uppercase">
                                                {schedule.practiceStudentCount}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-sm text-gray-900 font-medium uppercase">
                                                {schedule.location}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-xs text-gray-500 uppercase">
                                                {schedule.studentBreakdown && schedule.studentBreakdown.length > 0
                                                    ? schedule.studentBreakdown.map(b => `${b.base}: ${b.count}`).join(', ')
                                                    : '-'
                                                }
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center text-sm flex justify-center gap-2 border border-gray-200">
                                                <button
                                                    onClick={() => handleOpenModal(schedule)}
                                                    className="btn-base btn-edit px-3 py-1 text-[10px]"
                                                    title="EDITAR"
                                                >
                                                    EDITAR
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(schedule.id)}
                                                    className="btn-base btn-delete px-3 py-1 text-[10px]"
                                                    title="EXCLUIR"
                                                >
                                                    EXCLUIR
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                ) : (
                    <div className="p-4">
                        <GanttChart
                            schedules={filteredSchedules}
                            courses={courses}
                            onEdit={handleOpenModal}
                        />
                    </div>
                )}


                {/* Pagination Controls - Only show in List View */}
                {viewMode === 'list' && totalPages > 1 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl border border-gray-200">
                        <span className="text-sm text-gray-700">
                            MOSTRANDO <span className="font-medium">{indexOfFirstItem + 1}</span> A <span className="font-medium">{Math.min(indexOfLastItem, filteredSchedules.length)}</span> DE <span className="font-medium">{filteredSchedules.length}</span> RESULTADOS
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

            {/* Modal */}
            <StandardModal isOpen={isModalOpen} onClose={handleCloseModal} maxWidth="max-w-4xl">
                <StandardModalHeader
                    title={editingSchedule ? 'EDITAR AGENDAMENTO' : 'NOVO AGENDAMENTO'}
                    onClose={handleCloseModal}
                />
                <StandardModalBody>
                    <div className="space-y-6">
                        {/* Section 1: Basic Info & Logistics */}
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className={labelClass}>CURSO</label>
                                <select
                                    className={`${inputClass} uppercase`}
                                    value={formData.courseId || ''}
                                    onChange={e => setFormData({ ...formData, courseId: e.target.value })}
                                >
                                    <option value="">SELECIONE</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>
                                            {course.name.toUpperCase()}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>TURMA</label>
                                <input
                                    type="text"
                                    required
                                    className={`${inputClass} uppercase`}
                                    value={formData.className || ''}
                                    onChange={e => setFormData({ ...formData, className: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>ORIGEM (DE)</label>
                                <input
                                    type="text"
                                    required
                                    className={`${inputClass} uppercase`}
                                    value={formData.origin || ''}
                                    onChange={e => setFormData({ ...formData, origin: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>DESTINO (PARA)</label>
                                <input
                                    type="text"
                                    required
                                    className={`${inputClass} uppercase`}
                                    value={formData.destination || ''}
                                    onChange={e => setFormData({ ...formData, destination: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className={labelClass}>QTD INSTRUTORES</label>
                                <input
                                    type="number"
                                    required
                                    className={inputClass}
                                    value={formData.instructorCount || ''}
                                    onChange={e => setFormData({ ...formData, instructorCount: parseInt(e.target.value) })}
                                />
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 uppercase">
                                <Truck size={16} /> DESLOCAMENTO MEDTRUCK
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex-1">
                                    <label className={labelClass}>INÍCIO</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.medtruckDisplacementStart ? formData.medtruckDisplacementStart.split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, medtruckDisplacementStart: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={labelClass}>TÉRMINO</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.medtruckDisplacementEnd ? formData.medtruckDisplacementEnd.split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, medtruckDisplacementEnd: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 uppercase">
                                <Calendar size={16} /> MONTAGEM E DESMONTAGEM
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div>
                                    <label className={labelClass}>DATA MONTAGEM</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.setupDate || ''}
                                        onChange={e => setFormData({ ...formData, setupDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>DATA DESMONTAGEM</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.teardownDate || ''}
                                        onChange={e => setFormData({ ...formData, teardownDate: e.target.value })}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>RECARGA GLP</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.glpRefillDate ? formData.glpRefillDate.split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, glpRefillDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 uppercase">
                                <Users size={16} /> COMPOSIÇÃO DA TURMA (POR BASE)
                            </h3>
                            <div className="bg-white p-4 border border-gray-200 mb-4 rounded-lg">
                                <div className="flex gap-2 mb-2">
                                    <div className="flex-1">
                                        <div className="mb-1">
                                            <select
                                                id="baseInput"
                                                className={`${inputClass} uppercase`}
                                            >
                                                <option value="">SELECIONE A BASE</option>
                                                {bases.map(base => (
                                                    <option key={base.id} value={base.name}>{base.name.toUpperCase()}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                    <input
                                        type="number"
                                        placeholder="QTD"
                                        className={`${inputClass} w-32 uppercase`}
                                        id="countInput"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => {
                                            const baseInput = document.getElementById('baseInput') as HTMLSelectElement;
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
                                            }
                                        }}
                                        className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 px-6 py-2 text-xs font-bold self-start mt-0.5"
                                        style={{ height: '38px' }}
                                    >
                                        ADICIONAR
                                    </button>
                                </div>

                                {formData.studentBreakdown && formData.studentBreakdown.length > 0 && (
                                    <div className="space-y-2 mt-3">
                                        {formData.studentBreakdown.map((item, index) => (
                                            <div key={index} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-200 text-sm">
                                                <span className="font-bold text-gray-700 uppercase">{item.base}</span>
                                                <div className="flex items-center gap-3">
                                                    <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-xs font-bold uppercase">
                                                        {item.count} ALUNOS
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
                                                        className="text-red-500 hover:text-red-700 font-bold text-xs uppercase"
                                                    >
                                                        EXCLUIR
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                        <div className="flex justify-end pt-2 border-t border-gray-200">
                                            <span className="text-sm font-bold text-gray-900 uppercase">
                                                TOTAL: {formData.studentBreakdown.reduce((sum, item) => sum + item.count, 0)} ALUNOS
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 uppercase">
                                <Users size={16} /> TREINAMENTO TEÓRICO
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex-1">
                                    <label className={labelClass}>INÍCIO</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.theoryStart ? formData.theoryStart.split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, theoryStart: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={labelClass}>TÉRMINO</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.theoryEnd ? formData.theoryEnd.split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, theoryEnd: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 uppercase">
                                <Users size={16} /> TREINAMENTO PRÁTICO
                            </h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="flex-1">
                                    <label className={labelClass}>INÍCIO</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.practiceStart ? formData.practiceStart.split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, practiceStart: e.target.value })}
                                    />
                                </div>
                                <div className="flex-1">
                                    <label className={labelClass}>TÉRMINO</label>
                                    <input
                                        type="date"
                                        lang="pt-BR"
                                        className={inputClass}
                                        value={formData.practiceEnd ? formData.practiceEnd.split('T')[0] : ''}
                                        onChange={e => setFormData({ ...formData, practiceEnd: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="border-t border-gray-100 pt-4">
                            <h3 className="text-sm font-semibold text-gray-900 mb-3 flex items-center gap-2 uppercase">
                                <MapPin size={16} /> LOCALIZAÇÃO
                            </h3>
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className={labelClass}>LOCAL DO TREINAMENTO</label>
                                    <input
                                        type="text"
                                        required
                                        className={`${inputClass} uppercase`}
                                        value={formData.location || ''}
                                        onChange={e => setFormData({ ...formData, location: e.target.value.toUpperCase() })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </StandardModalBody>
                <StandardModalFooter>
                    <button
                        type="button"
                        onClick={handleCloseModal}
                        className="btn-base bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/30 px-6 py-2.5 text-xs font-bold"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleSubmit as any}
                        className="btn-base bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30 px-8 py-3 text-sm font-bold"
                    >
                        {editingSchedule ? 'SALVAR' : 'CRIAR'}
                    </button>
                </StandardModalFooter>
            </StandardModal >
        </>
    );
};
