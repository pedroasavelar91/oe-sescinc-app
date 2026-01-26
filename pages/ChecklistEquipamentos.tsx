import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole } from '../types';
import { Settings, CheckCircle, XCircle, Camera, AlertTriangle, ChevronDown, ChevronUp, AlertCircle, Plus, Trash2, Edit2, ChevronLeft, ChevronRight, Clock, User, Download } from 'lucide-react';

type ItemStatus = 'PENDENTE' | 'CONFORME' | 'NAO_CONFORME' | 'NAO_SE_APLICA';

interface ChecklistItem {
    id: string;
    text: string;
    status: ItemStatus;
    comment?: string;
    photoUrl?: string;
}

interface ChecklistSection {
    id: string;
    title: string;
    items: ChecklistItem[];
}

interface ChecklistLog {
    id: string;
    userId: string;
    userName: string;
    classId: string;
    className: string;
    courseId: string;
    courseName: string;
    year: number;
    moment: 'INICIO' | 'FIM';
    completedAt: string;
    conformeCount: number;
    naoConformeCount: number;
    totalItems: number;
}

export const ChecklistEquipamentosPage: React.FC = () => {
    const { currentUser, users, classes, courses } = useStore();
    const [activeTab, setActiveTab] = useState<'realizar' | 'acompanhamento'>('realizar');
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [selectedMoment, setSelectedMoment] = useState<'INICIO' | 'FIM'>('INICIO');
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
    const [generalNotes, setGeneralNotes] = useState('');
    const [isManaging, setIsManaging] = useState(false);
    const [newItemText, setNewItemText] = useState('');
    const [selectedSectionForNewItem, setSelectedSectionForNewItem] = useState('');
    const [checklistLogs, setChecklistLogs] = useState<ChecklistLog[]>([]);
    const [currentPage, setCurrentPage] = useState(1);
    const [filterYear, setFilterYear] = useState<number | 'TODOS'>('TODOS');
    const [filterCourseId, setFilterCourseId] = useState<string | 'TODOS'>('TODOS');
    const [filterMoment, setFilterMoment] = useState<'TODOS' | 'INICIO' | 'FIM'>('TODOS');
    const [isCreatingSection, setIsCreatingSection] = useState(false);
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const logsPerPage = 10;

    // Todas as seções - começar vazio
    const [allSections, setAllSections] = useState<ChecklistSection[]>([]);

    if (!currentUser) return null;

    const canAccess = currentUser.role === UserRole.GESTOR ||
        currentUser.role === UserRole.COORDENADOR ||
        currentUser.role === UserRole.INSTRUTOR;

    const canManage = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;

    if (!canAccess) {
        return (
            <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-lg font-medium uppercase">Acesso Não Autorizado</p>
            </div>
        );
    }

    // Get available years
    const availableYears = Array.from(new Set(classes.map(c => new Date(c.startDate).getFullYear()))).sort((a, b) => b - a);
    if (availableYears.length === 0) availableYears.push(new Date().getFullYear());

    // Get classes for selected course and year
    const availableClasses = classes.filter(c => {
        const classYear = new Date(c.startDate).getFullYear();
        return (!selectedCourseId || c.courseId === selectedCourseId) && classYear === selectedYear;
    });

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    const updateItemStatus = (sectionId: string, itemId: string, status: ItemStatus) => {
        setAllSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: section.items.map(item =>
                        item.id === itemId ? { ...item, status, comment: status !== 'NAO_CONFORME' ? undefined : item.comment, photoUrl: status !== 'NAO_CONFORME' ? undefined : item.photoUrl } : item
                    )
                };
            }
            return section;
        }));
    };

    const updateItemComment = (sectionId: string, itemId: string, comment: string) => {
        setAllSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: section.items.map(item =>
                        item.id === itemId ? { ...item, comment } : item
                    )
                };
            }
            return section;
        }));
    };

    const handlePhotoUpload = (sectionId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setAllSections(prev => prev.map(section => {
                    if (section.id === sectionId) {
                        return {
                            ...section,
                            items: section.items.map(item =>
                                item.id === itemId ? { ...item, photoUrl: reader.result as string } : item
                            )
                        };
                    }
                    return section;
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    const addNewItem = () => {
        if (!newItemText.trim() || !selectedSectionForNewItem) {
            alert('Por favor, preencha o texto do item e selecione uma seção.');
            return;
        }

        setAllSections(prev => prev.map(section => {
            if (section.id === selectedSectionForNewItem) {
                return {
                    ...section,
                    items: [
                        ...section.items,
                        {
                            id: `custom-${Date.now()}`,
                            text: newItemText,
                            status: 'PENDENTE' as ItemStatus
                        }
                    ]
                };
            }
            return section;
        }));

        setNewItemText('');
        setSelectedSectionForNewItem('');
    };

    const removeItem = (sectionId: string, itemId: string) => {
        if (!window.confirm('Deseja realmente remover este item?')) return;

        setAllSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: section.items.filter(item => item.id !== itemId)
                };
            }
            return section;
        }));
    };

    const createNewSection = () => {
        if (!newSectionTitle.trim()) {
            alert('Por favor, preencha o título da seção.');
            return;
        }

        const newSection: ChecklistSection = {
            id: `section-${Date.now()}`,
            title: newSectionTitle,
            items: []
        };

        setAllSections(prev => [...prev, newSection]);
        setNewSectionTitle('');
        setIsCreatingSection(false);
    };

    const startEditingSection = (sectionId: string) => {
        const section = allSections.find(s => s.id === sectionId);
        if (section) {
            setEditingSectionId(sectionId);
            setNewSectionTitle(section.title);
        }
    };

    const saveEditedSection = () => {
        if (!newSectionTitle.trim()) {
            alert('Por favor, preencha o título da seção.');
            return;
        }

        setAllSections(prev => prev.map(section => {
            if (section.id === editingSectionId) {
                return {
                    ...section,
                    title: newSectionTitle
                };
            }
            return section;
        }));

        setEditingSectionId(null);
        setNewSectionTitle('');
    };

    const cancelEditingSection = () => {
        setEditingSectionId(null);
        setNewSectionTitle('');
        setIsCreatingSection(false);
    };

    const removeSection = (sectionId: string) => {
        const section = allSections.find(s => s.id === sectionId);
        if (!section) return;

        if (!window.confirm(`Deseja realmente remover a seção "${section.title}" e todos os seus itens?`)) return;

        setAllSections(prev => prev.filter(s => s.id !== sectionId));
    };

    const exportToCSV = () => {
        const filteredLogs = checklistLogs.filter(log =>
            (filterYear === 'TODOS' || log.year === filterYear) &&
            (filterCourseId === 'TODOS' || log.courseId === filterCourseId) &&
            (filterMoment === 'TODOS' || log.moment === filterMoment)
        );

        if (filteredLogs.length === 0) {
            alert('Não há dados para exportar com o filtro atual.');
            return;
        }

        const headers = ['Data/Hora', 'Usuário', 'Ano', 'Curso', 'Turma', 'Momento', 'Conforme', 'Não Conforme', 'Total Itens', 'Taxa (%)'];

        const rows = filteredLogs.map(log => {
            const conformidadeRate = log.totalItems > 0
                ? Math.round((log.conformeCount / log.totalItems) * 100)
                : 0;

            return [
                new Date(log.completedAt).toLocaleString('pt-BR'),
                log.userName,
                log.year,
                log.courseName,
                log.className,
                log.moment,
                log.conformeCount,
                log.naoConformeCount,
                log.totalItems,
                conformidadeRate
            ];
        });

        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);

        link.setAttribute('href', url);
        link.setAttribute('download', `checklist-equipamentos-${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const currentSections = allSections;
    const totalItems = currentSections.reduce((sum, section) => sum + section.items.length, 0);
    const conformeItems = currentSections.reduce((sum, section) =>
        sum + section.items.filter(item => item.status === 'CONFORME').length, 0
    );
    const naoConformeItems = currentSections.reduce((sum, section) =>
        sum + section.items.filter(item => item.status === 'NAO_CONFORME').length, 0
    );
    const progress = totalItems > 0 ? Math.round((conformeItems / totalItems) * 100) : 0;

    const getStatusColor = (status: ItemStatus) => {
        switch (status) {
            case 'CONFORME': return 'bg-green-50 text-green-700 border-green-200';
            case 'NAO_CONFORME': return 'bg-red-50 text-red-700 border-red-200';
            case 'NAO_SE_APLICA': return 'bg-gray-50 text-gray-700 border-gray-200';
            default: return 'bg-white text-gray-700 border-gray-300';
        }
    };

    const finalizeChecklist = () => {
        if (!selectedClassId) {
            alert('Por favor, selecione uma turma.');
            return;
        }

        const invalidItems = currentSections.flatMap(section =>
            section.items.filter(item =>
                item.status === 'NAO_CONFORME' && (!item.comment || !item.photoUrl)
            )
        );

        if (invalidItems.length > 0) {
            alert(`Atenção! ${invalidItems.length} item(ns) marcado(s) como NÃO CONFORME precisa(m) de comentário e foto obrigatórios.`);
            return;
        }

        const selectedClass = classes.find(c => c.id === selectedClassId);
        const selectedCourse = courses.find(c => c.id === selectedCourseId);

        const newLog: ChecklistLog = {
            id: `log-${Date.now()}`,
            userId: currentUser.id,
            userName: currentUser.name,
            classId: selectedClassId,
            className: selectedClass?.name || '',
            courseId: selectedCourseId,
            courseName: selectedCourse?.name || '',
            year: selectedYear,
            moment: selectedMoment,
            completedAt: new Date().toISOString(),
            conformeCount: conformeItems,
            naoConformeCount: naoConformeItems,
            totalItems
        };

        setChecklistLogs(prev => [newLog, ...prev]);

        alert(`Checklist de Equipamentos finalizado!\\n\\nTurma: ${selectedClass?.name}\\nMomento: ${selectedMoment}\\n\\n✅ ${conformeItems} Conforme\\n❌ ${naoConformeItems} Não Conforme\\n📊 ${progress}% Completo`);

        setAllSections(prev => prev.map(section => ({
            ...section,
            items: section.items.map(item => ({ ...item, status: 'PENDENTE' as ItemStatus, comment: undefined, photoUrl: undefined }))
        })));
        setGeneralNotes('');
    };

    const totalPages = Math.ceil(checklistLogs.length / logsPerPage);
    const startIndex = (currentPage - 1) * logsPerPage;
    const endIndex = startIndex + logsPerPage;

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header */}
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 uppercase">Checklist - Equipamentos</h1>
                </div>
                {canManage && activeTab === 'realizar' && (
                    <button
                        onClick={() => setIsManaging(!isManaging)}
                        className={`px-4 py-2 rounded-lg font-bold uppercase transition-all flex items-center gap-2 ${isManaging
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'btn-premium btn-premium-orange btn-premium-shimmer'
                            }`}
                    >
                        {isManaging ? 'SAIR DO MODO EDIÇÃO' : 'GERENCIAR ITENS'}
                    </button>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => {
                            setActiveTab('realizar');
                            setIsManaging(false);
                        }}
                        className={`${activeTab === 'realizar'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm uppercase flex items-center gap-2 transition-colors`}
                    >
                        REALIZAR CHECKLIST
                    </button>
                    {canManage && (
                        <button
                            onClick={() => {
                                setActiveTab('acompanhamento');
                                setIsManaging(false);
                            }}
                            className={`${activeTab === 'acompanhamento'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm uppercase flex items-center gap-2 transition-colors`}
                        >
                            ACOMPANHAMENTO
                        </button>
                    )}
                </nav>
            </div>

            {/* Acompanhamento Tab Content */}
            {activeTab === 'acompanhamento' && canManage && (
                <div className="space-y-6">
                    {/* Statistics Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-l-4 relative overflow-hidden group hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderLeftColor: '#3B82F6' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" style={{ background: 'rgba(59, 130, 246, 0.1)' }}></div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>Total Realizados</p>
                                <h3 className="text-4xl font-extrabold" style={{ color: '#1F2937' }}>{checklistLogs.length}</h3>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-l-4 relative overflow-hidden group hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderLeftColor: '#EF4444' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" style={{ background: 'rgba(239, 68, 68, 0.1)' }}></div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>Não Conformidades</p>
                                <h3 className="text-4xl font-extrabold" style={{ color: '#1F2937' }}>
                                    {checklistLogs.reduce((sum, log) => sum + log.naoConformeCount, 0)}
                                </h3>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-l-4 relative overflow-hidden group hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderLeftColor: '#10B981' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" style={{ background: 'rgba(16, 185, 129, 0.1)' }}></div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>Taxa Conformidade</p>
                                <h3 className="text-4xl font-extrabold" style={{ color: '#1F2937' }}>
                                    {checklistLogs.length > 0
                                        ? Math.round((checklistLogs.reduce((sum, log) => sum + log.conformeCount, 0) / checklistLogs.reduce((sum, log) => sum + log.totalItems, 0)) * 100)
                                        : 0}%
                                </h3>
                            </div>
                        </div>

                        <div className="bg-white p-8 rounded-2xl shadow-lg border border-l-4 relative overflow-hidden group hover:shadow-xl transition-all duration-300" style={{ backgroundColor: '#FFFFFF', borderColor: '#E5E7EB', borderLeftColor: '#FF6B35' }}>
                            <div className="absolute top-0 right-0 w-32 h-32 rounded-bl-full -mr-8 -mt-8 transition-transform group-hover:scale-110" style={{ background: 'rgba(255, 107, 53, 0.1)' }}></div>
                            <div className="relative z-10">
                                <p className="text-sm font-bold uppercase tracking-wide mb-2" style={{ color: '#6B7280', letterSpacing: '0.05em' }}>Turmas Ativas</p>
                                <h3 className="text-4xl font-extrabold" style={{ color: '#1F2937' }}>{availableClasses.length}</h3>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <label className="block text-sm font-bold text-gray-900 mb-3 uppercase">Filtros</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Ano</label>
                                <select
                                    value={filterYear}
                                    onChange={(e) => setFilterYear(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value))}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase"
                                >
                                    <option value="TODOS">Todos</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Curso</label>
                                <select
                                    value={filterCourseId}
                                    onChange={(e) => setFilterCourseId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase"
                                >
                                    <option value="TODOS">Todos</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 mb-2 uppercase">Momento</label>
                                <select
                                    value={filterMoment}
                                    onChange={(e) => setFilterMoment(e.target.value as 'TODOS' | 'INICIO' | 'FIM')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 uppercase"
                                >
                                    <option value="TODOS">Todos</option>
                                    <option value="INICIO">Início</option>
                                    <option value="FIM">Fim</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Checklists List */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-xl font-bold text-gray-900 uppercase">Checklists Realizados</h2>
                            <button
                                onClick={exportToCSV}
                                className="btn-premium btn-premium-orange btn-premium-shimmer px-4 py-2 login-uppercase"
                            >
                                EXPORTAR CSV
                            </button>
                        </div>
                        {checklistLogs.filter(log =>
                            (filterYear === 'TODOS' || log.year === filterYear) &&
                            (filterCourseId === 'TODOS' || log.courseId === filterCourseId) &&
                            (filterMoment === 'TODOS' || log.moment === filterMoment)
                        ).length === 0 ? (
                            <div className="text-center py-12 text-gray-500">
                                <AlertCircle size={48} className="mx-auto mb-3 text-gray-300" />
                                <p className="font-medium">Nenhum checklist encontrado</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {checklistLogs
                                    .filter(log =>
                                        (filterYear === 'TODOS' || log.year === filterYear) &&
                                        (filterCourseId === 'TODOS' || log.courseId === filterCourseId) &&
                                        (filterMoment === 'TODOS' || log.moment === filterMoment)
                                    )
                                    .slice(startIndex, endIndex)
                                    .map(log => (
                                        <div key={log.id} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="flex items-center justify-between p-4 bg-gray-50 hover:bg-gray-100 transition-colors">
                                                <div className="flex items-center gap-4 flex-1">
                                                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                                                        <User size={20} className="text-blue-600" />
                                                    </div>
                                                    <div className="flex-1">
                                                        <p className="text-sm font-bold text-gray-900">{log.userName}</p>
                                                        <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                                                            <Clock size={14} />
                                                            <span>{new Date(log.completedAt).toLocaleString('pt-BR')}</span>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500 mb-1">{log.courseName}</p>
                                                        <p className="text-sm font-bold text-gray-900">{log.className}</p>
                                                    </div>
                                                    <span className={`px-3 py-1 rounded-full text-xs font-bold uppercase ${log.moment === 'INICIO' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'
                                                        }`}>
                                                        {log.moment}
                                                    </span>
                                                    <div className="text-right">
                                                        <p className="text-xs text-gray-500">Resultado</p>
                                                        <p className="text-sm font-bold text-gray-900">
                                                            <span className="text-green-600">{log.conformeCount}</span> /
                                                            <span className="text-red-600"> {log.naoConformeCount}</span> /
                                                            <span className="text-gray-500"> {log.totalItems}</span>
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
                                <div className="text-sm text-gray-500">
                                    Mostrando {startIndex + 1}-{Math.min(endIndex, checklistLogs.length)} de {checklistLogs.length} registros
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                                        disabled={currentPage === 1}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-xs uppercase"
                                    >
                                        ANTERIOR
                                    </button>
                                    <span className="text-sm font-medium text-gray-700">
                                        Página {currentPage} de {totalPages}
                                    </span>
                                    <button
                                        onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                                        disabled={currentPage === totalPages}
                                        className="p-2 rounded-lg border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-bold text-xs uppercase"
                                    >
                                        PRÓXIMO
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Realizar Checklist Tab Content */}
            {activeTab === 'realizar' && (
                <div className="space-y-6">
                    {/* Filters: Year, Course, Class, Moment */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 uppercase">Selecionar Turma e Momento</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Ano</label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => {
                                        setSelectedYear(Number(e.target.value));
                                        setSelectedCourseId('');
                                        setSelectedClassId('');
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    disabled={isManaging}
                                >
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Curso</label>
                                <select
                                    value={selectedCourseId}
                                    onChange={(e) => {
                                        setSelectedCourseId(e.target.value);
                                        setSelectedClassId('');
                                    }}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    disabled={isManaging}
                                >
                                    <option value="">Selecione</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Turma</label>
                                <select
                                    value={selectedClassId}
                                    onChange={(e) => setSelectedClassId(e.target.value)}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    disabled={isManaging || !selectedCourseId}
                                >
                                    <option value="">Selecione</option>
                                    {availableClasses.map(cls => (
                                        <option key={cls.id} value={cls.id}>{cls.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Momento</label>
                                <select
                                    value={selectedMoment}
                                    onChange={(e) => setSelectedMoment(e.target.value as 'INICIO' | 'FIM')}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                    disabled={isManaging}
                                >
                                    <option value="INICIO">Início</option>
                                    <option value="FIM">Fim</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Management Mode */}
                    {isManaging && canManage && (
                        <div className="bg-white border border-gray-100 rounded-xl p-6 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-2">
                                    <AlertTriangle size={20} className="text-orange-600" />
                                    <h3 className="text-lg font-bold text-gray-900 uppercase">Modo de Edição Ativo</h3>
                                </div>
                                <button
                                    onClick={() => setIsCreatingSection(true)}
                                    className="btn-premium btn-premium-orange btn-premium-shimmer px-4 py-2 login-uppercase"
                                >
                                    NOVA SEÇÃO
                                </button>
                            </div>

                            {/* Create/Edit Section Form */}
                            {(isCreatingSection || editingSectionId) && (
                                <div className="mb-6 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
                                    <h4 className="text-sm font-bold text-green-900 mb-3 uppercase">
                                        {isCreatingSection ? 'Criar Nova Seção' : 'Editar Seção'}
                                    </h4>
                                    <div className="mb-4">
                                        <label className="block text-sm font-bold text-green-900 mb-2 uppercase">Título da Seção</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border-2 border-green-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                            value={newSectionTitle}
                                            onChange={(e) => setNewSectionTitle(e.target.value)}
                                            placeholder="Ex: 1. EQUIPAMENTOS DE PROTEÇÃO"
                                        />
                                    </div>
                                    <div className="flex gap-2">
                                        <button
                                            onClick={isCreatingSection ? createNewSection : saveEditedSection}
                                            className="px-4 py-2 bg-green-600 text-white rounded-lg font-bold uppercase hover:bg-green-700 transition-colors text-sm"
                                        >
                                            {isCreatingSection ? 'CRIAR SEÇÃO' : 'SALVAR ALTERAÇÕES'}
                                        </button>
                                        <button
                                            onClick={cancelEditingSection}
                                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg font-bold uppercase hover:bg-gray-300 transition-colors text-sm"
                                        >
                                            CANCELAR
                                        </button>
                                    </div>
                                </div>
                            )}

                            {/* Add Item Form */}
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Novo Item</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        value={newItemText}
                                        onChange={(e) => setNewItemText(e.target.value)}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-900 mb-2 uppercase">Seção</label>
                                    <select
                                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                                        value={selectedSectionForNewItem}
                                        onChange={(e) => setSelectedSectionForNewItem(e.target.value)}
                                    >
                                        <option value="">Selecione</option>
                                        {allSections.map(section => (
                                            <option key={section.id} value={section.id}>{section.title}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={addNewItem}
                                className="mt-4 btn-premium btn-premium-orange btn-premium-shimmer px-6 py-2 login-uppercase"
                            >
                                ADICIONAR ITEM
                            </button>
                        </div>
                    )}

                    {/* Progress Bar */}
                    {totalItems > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex justify-between items-center mb-2">
                                <h3 className="text-sm font-bold text-gray-900 uppercase">Progresso do Checklist</h3>
                                <span className="text-2xl font-bold text-blue-600">{progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-3">
                                <div
                                    className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                        </div>
                    )}

                    {/* Checklist Sections */}
                    {allSections.length === 0 ? (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
                            <Settings size={48} className="mx-auto mb-3 text-gray-300" />
                            <p className="text-gray-500 font-medium">Nenhuma seção criada ainda</p>
                            {canManage && (
                                <p className="text-sm text-gray-400 mt-2">Clique em "Gerenciar Itens" para criar seções e itens</p>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {currentSections.map(section => (
                                <div key={section.id} className="bg-white rounded-lg shadow-sm border border-gray-100 border-l-4 border-l-blue-600 overflow-hidden">
                                    <button
                                        onClick={() => toggleSection(section.id)}
                                        className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition-colors"
                                    >
                                        <div className="flex items-center gap-3">
                                            <h3 className="text-base font-bold text-gray-900">{section.title}</h3>
                                            <span className="text-xs font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                                                {section.items.filter(i => i.status === 'CONFORME').length}/{section.items.length}
                                            </span>
                                            {isManaging && canManage && (
                                                <div className="flex items-center gap-2" onClick={(e) => e.stopPropagation()}>
                                                    <button
                                                        onClick={() => startEditingSection(section.id)}
                                                        className="p-1.5 text-blue-600 hover:bg-blue-50 rounded transition-colors"
                                                        title="Editar Seção"
                                                    >
                                                        <Edit2 size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => removeSection(section.id)}
                                                        className="p-1.5 text-red-600 hover:bg-red-50 rounded transition-colors"
                                                        title="Remover Seção"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                        {expandedSections.has(section.id) ? (
                                            <ChevronUp size={20} className="text-gray-400" />
                                        ) : (
                                            <ChevronDown size={20} className="text-gray-400" />
                                        )}
                                    </button>

                                    {expandedSections.has(section.id) && (
                                        <div className="border-t border-gray-100">
                                            {section.items.map(item => (
                                                <div key={item.id} className="p-4 bg-white hover:bg-gray-50 transition-colors">
                                                    <div className="flex items-start gap-4">
                                                        <div className="flex-1">
                                                            <p className="text-sm text-gray-900 mb-3 uppercase">{item.text}</p>

                                                            {/* Status Dropdown */}
                                                            <select
                                                                value={item.status}
                                                                onChange={(e) => updateItemStatus(section.id, item.id, e.target.value as ItemStatus)}
                                                                className={`w-full px-3 py-2 rounded-lg text-sm font-bold border-2 transition-all uppercase ${getStatusColor(item.status)}`}
                                                                disabled={isManaging}
                                                            >
                                                                <option value="PENDENTE">Selecione</option>
                                                                <option value="CONFORME">CONFORME</option>
                                                                <option value="NAO_CONFORME">NÃO CONFORME</option>
                                                                <option value="NAO_SE_APLICA">NÃO SE APLICA</option>
                                                            </select>

                                                            {/* Não Conforme - Comentário e Foto Obrigatórios */}
                                                            {item.status === 'NAO_CONFORME' && (
                                                                <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg space-y-3">
                                                                    <div className="flex items-center gap-2 text-red-800 font-bold text-xs uppercase">
                                                                        <AlertCircle size={16} />
                                                                        Comentário e Foto Obrigatórios
                                                                    </div>
                                                                    <textarea
                                                                        className="w-full px-3 py-2 border border-red-300 rounded-lg text-sm focus:ring-2 focus:ring-red-500 focus:border-red-500"
                                                                        rows={3}
                                                                        placeholder="Descreva o problema encontrado..."
                                                                        value={item.comment || ''}
                                                                        onChange={(e) => updateItemComment(section.id, item.id, e.target.value)}
                                                                        disabled={isManaging}
                                                                    />
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-red-900 mb-1 uppercase">Evidência Fotográfica *</label>
                                                                        <div className="flex items-start gap-3">
                                                                            <label className="cursor-pointer group flex flex-col items-center justify-center w-32 h-32 bg-white border-2 border-dashed border-red-300 rounded-lg hover:border-red-500 hover:bg-red-50 transition-all">
                                                                                <Camera size={24} className="text-red-400 group-hover:text-red-600 mb-2" />
                                                                                <span className="text-xs text-red-500 group-hover:text-red-700 font-medium text-center px-2">
                                                                                    {item.photoUrl ? 'Alterar Foto' : 'Adicionar Foto'}
                                                                                </span>
                                                                                <input
                                                                                    type="file"
                                                                                    accept="image/*"
                                                                                    className="hidden"
                                                                                    onChange={(e) => handlePhotoUpload(section.id, item.id, e)}
                                                                                    disabled={isManaging}
                                                                                />
                                                                            </label>
                                                                            {item.photoUrl && (
                                                                                <div className="relative group">
                                                                                    <img
                                                                                        src={item.photoUrl}
                                                                                        alt="Evidência"
                                                                                        className="h-32 w-auto rounded-lg border-2 border-red-200 shadow-sm object-cover"
                                                                                    />
                                                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg" />
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Remove Item Button (Management Mode) */}
                                                        {isManaging && canManage && (
                                                            <button
                                                                onClick={() => removeItem(section.id, item.id)}
                                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                                title="Remover Item"
                                                            >
                                                                <Trash2 size={18} />
                                                            </button>
                                                        )}
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Finalize Button */}
                    {!isManaging && totalItems > 0 && (
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <button
                                onClick={finalizeChecklist}
                                className="w-full px-6 py-3 bg-orange-600 text-white rounded-lg font-bold uppercase hover:bg-orange-700 transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-2"
                            >
                                <CheckCircle size={20} />
                                Finalizar Checklist
                            </button>
                        </div>
                    )}
                </div>
            )
            }
        </div >
    );
};
