import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, ChecklistType, ChecklistItemResult, ChecklistLog, ChecklistItemDefinition } from '../types';
import { ClipboardList, CheckCircle, XCircle, Plus, Trash2, Camera, MessageSquare, AlertTriangle, Eye, Settings, Truck, PlusCircle, BookOpen } from 'lucide-react';
import { getCurrentDateString } from '../utils/dateUtils';

export const ChecklistsPage: React.FC = () => {
    const { currentUser, checklistTemplates, checklistLogs, addChecklistLog, updateChecklistTemplate, classes } = useStore();
    const [activeTab, setActiveTab] = useState<'fill' | 'history' | 'manage'>('fill');

    // Fill State
    const [selectedType, setSelectedType] = useState<ChecklistType | ''>('');
    const [selectedClassId, setSelectedClassId] = useState('');
    const [selectedStage, setSelectedStage] = useState<'INICIO' | 'TERMINO'>('INICIO');
    const [itemsResult, setItemsResult] = useState<{ [itemId: string]: ChecklistItemResult }>({});
    const [logNotes, setLogNotes] = useState('');

    // Management State
    const [manageType, setManageType] = useState<ChecklistType>('VEICULO');
    const [newItemText, setNewItemText] = useState('');
    const [newItemCategory, setNewItemCategory] = useState('');
    const [newItemQuantity, setNewItemQuantity] = useState<number | ''>('');

    if (!currentUser) return null;

    const isManager = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;
    const isDriver = currentUser.role === UserRole.MOTORISTA;
    const isInstructor = currentUser.role === UserRole.INSTRUTOR;

    // --- Logic for Fill Tab ---

    const availableTemplates = checklistTemplates.filter(t => {
        if (isManager) return true;
        if (isDriver) return t.type === 'VEICULO';
        if (isInstructor) return t.type === 'EQUIPAMENTOS' || t.type === 'CURSO';
        return false;
    });

    const activeTemplate = checklistTemplates.find(t => t.type === selectedType);

    const handleStartChecklist = (type: ChecklistType) => {
        setSelectedType(type);
        setItemsResult({});
        setLogNotes('');
        // Pre-fill results as N/A or empty
        const t = checklistTemplates.find(tpl => tpl.type === type);
        if (t) {
            const initialResults: any = {};
            t.items.forEach(item => {
                initialResults[item.id] = { itemId: item.id, itemText: item.text, status: 'Conforme' };
            });
            setItemsResult(initialResults);
        }
    };

    const handleItemChange = (itemId: string, field: keyof ChecklistItemResult, value: any) => {
        setItemsResult(prev => ({
            ...prev,
            [itemId]: { ...prev[itemId], [field]: value }
        }));
    };

    const handlePhotoUpload = (itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                handleItemChange(itemId, 'photoUrl', reader.result as string);
            };
            reader.readAsDataURL(file);
        }
    };

    const handleSubmit = () => {
        if (!activeTemplate) return;
        if (selectedType === 'EQUIPAMENTOS' && !selectedClassId) {
            alert('Por favor, selecione a turma.');
            return;
        }

        // Check for non-compliances
        const resultsArray = Object.values(itemsResult) as ChecklistItemResult[];
        const isCompliant = resultsArray.every(r => r.status === 'Conforme' || r.status === 'N/A');

        const log: ChecklistLog = {
            id: crypto.randomUUID(),
            templateId: activeTemplate.id,
            type: activeTemplate.type,
            date: getCurrentDateString(),
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
            classId: selectedType === 'EQUIPAMENTOS' ? selectedClassId : undefined,
            stage: selectedType === 'EQUIPAMENTOS' ? selectedStage : undefined,
            items: resultsArray,
            isCompliant,
            notes: logNotes
        };

        addChecklistLog(log);
        alert('Checklist salvo com sucesso!');
        setSelectedType('');
        setActiveTab('history');
    };

    // --- Logic for Manage Tab ---

    const manageTemplate = checklistTemplates.find(t => t.type === manageType);

    const handleAddItem = () => {
        if (!newItemText || !manageTemplate) return;
        const newItem: ChecklistItemDefinition = {
            id: crypto.randomUUID(),
            text: newItemText,
            category: newItemCategory || 'Geral',
            quantity: newItemQuantity !== '' ? Number(newItemQuantity) : undefined
        };

        const updatedTemplate = {
            ...manageTemplate,
            items: [...manageTemplate.items, newItem]
        };
        updateChecklistTemplate(updatedTemplate);
        setNewItemText('');
        setNewItemQuantity('');
    };

    const handleDeleteItem = (itemId: string) => {
        if (!manageTemplate) return;
        if (!window.confirm('Remover este item do checklist?')) return;

        const updatedTemplate = {
            ...manageTemplate,
            items: manageTemplate.items.filter(i => i.id !== itemId)
        };
        updateChecklistTemplate(updatedTemplate);
    };

    // --- UI Components ---

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Checklists Operacionais</h1>
                    <p className="text-gray-500 mt-1">Gerencie verificações e inspeções</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('fill')}
                        className={`${activeTab === 'fill' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <ClipboardList size={18} /> PREENCHER
                    </button>
                    <button
                        onClick={() => setActiveTab('history')}
                        className={`${activeTab === 'history' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <ClipboardList size={18} /> HISTÓRICO
                    </button>
                    {isManager && (
                        <button
                            onClick={() => setActiveTab('manage')}
                            className={`${activeTab === 'manage' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <Settings size={18} /> GERENCIAR MODELOS
                        </button>
                    )}
                </nav>
            </div>

            {/* Content */}

            {/* --- FILL TAB --- */}
            {activeTab === 'fill' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 animate-fade-in">
                    {!selectedType ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {availableTemplates.map(t => {
                                const isDisabled = t.type === 'CURSO';
                                return (
                                    <button
                                        key={t.id}
                                        onClick={() => !isDisabled && handleStartChecklist(t.type)}
                                        disabled={isDisabled}
                                        className={`relative overflow-hidden group bg-white p-8 rounded-xl border border-gray-200 shadow-sm transition-all duration-300 text-left ${isDisabled
                                            ? 'opacity-60 cursor-not-allowed'
                                            : 'hover:shadow-md hover:border-primary-500'
                                            }`}
                                    >
                                        {isDisabled && (
                                            <div className="absolute top-4 right-4 z-20">
                                                <span className="bg-orange-100 text-orange-700 text-xs font-bold px-3 py-1 rounded-full border border-orange-200 uppercase">
                                                    Em Breve
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                                            {t.type === 'VEICULO' && <Truck size={120} className="text-blue-600 transform rotate-12 translate-x-8 -translate-y-8" />}
                                            {t.type === 'EQUIPAMENTOS' && <Settings size={120} className="text-orange-600 transform rotate-12 translate-x-8 -translate-y-8" />}
                                            {t.type === 'CURSO' && <BookOpen size={120} className="text-green-600 transform rotate-12 translate-x-8 -translate-y-8" />}
                                        </div>
                                        <div className="relative z-10">
                                            <div className={`w-14 h-14 rounded-lg flex items-center justify-center mb-6 transition-transform duration-300 ${!isDisabled && 'group-hover:scale-110'
                                                } ${t.type === 'VEICULO' ? 'bg-blue-50' : t.type === 'EQUIPAMENTOS' ? 'bg-orange-50' : 'bg-green-50'
                                                }`}>
                                                {t.type === 'VEICULO' && <Truck size={32} className="text-blue-600" />}
                                                {t.type === 'EQUIPAMENTOS' && <Settings size={32} className="text-orange-600" />}
                                                {t.type === 'CURSO' && <BookOpen size={32} className="text-green-600" />}
                                            </div>
                                            <h3 className="text-xl font-bold text-gray-900 mb-2 uppercase">{t.title}</h3>
                                            <p className="text-gray-500 text-sm leading-relaxed">
                                                {t.type === 'VEICULO' && 'Verificação diária completa das condições de segurança e operacionais da carreta e caminhão.'}
                                                {t.type === 'EQUIPAMENTOS' && 'Controle rigoroso de materiais e equipamentos utilizados em cursos e treinamentos.'}
                                                {t.type === 'CURSO' && 'Conferência completa de todos os requisitos e materiais necessários para realização do curso.'}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                            {availableTemplates.length === 0 && (
                                <div className="col-span-full text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                    <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-medium">Nenhum checklist disponível para o seu perfil.</p>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="space-y-8 animate-slide-up">
                            {/* Header */}
                            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-gray-100 pb-6">
                                <div>
                                    <button onClick={() => setSelectedType('')} className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center transition-colors">
                                        ← Voltar para seleção
                                    </button>
                                    <h2 className="text-2xl font-bold text-gray-900">{activeTemplate?.title}</h2>
                                </div>
                                <div className="text-sm text-gray-500 bg-gray-50 px-4 py-2 rounded-lg border border-gray-100">
                                    {getCurrentDateString()}
                                </div>
                            </div>

                            {/* Context Fields */}
                            {selectedType === 'EQUIPAMENTOS' && (
                                <div className="bg-orange-50 border border-orange-100 rounded-xl p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-semibold text-orange-900 mb-2 uppercase">Turma</label>
                                        <select className="w-full bg-white border-orange-200 text-orange-900 rounded-lg focus:ring-orange-500 focus:border-orange-500" value={selectedClassId} onChange={e => setSelectedClassId(e.target.value)}>
                                            <option value="">Selecione a turma...</option>
                                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-semibold text-orange-900 mb-2 uppercase">Etapa</label>
                                        <div className="flex bg-white rounded-lg p-1 border border-orange-200">
                                            <button
                                                onClick={() => setSelectedStage('INICIO')}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all uppercase ${selectedStage === 'INICIO' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                Início
                                            </button>
                                            <button
                                                onClick={() => setSelectedStage('TERMINO')}
                                                className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-all uppercase ${selectedStage === 'TERMINO' ? 'bg-orange-100 text-orange-700 shadow-sm' : 'text-gray-500 hover:bg-gray-50'}`}
                                            >
                                                Término
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Checklist Items Grouped */}
                            <div className="space-y-8">
                                {Object.entries(
                                    activeTemplate?.items.reduce((acc, item) => {
                                        const cat = item.category || 'Geral';
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(item);
                                        return acc;
                                    }, {} as Record<string, typeof activeTemplate.items>) || {}
                                ).map(([category, items]) => (
                                    <div key={category} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center gap-3">
                                            <div className="w-2 h-6 bg-primary-500 rounded-full"></div>
                                            <h3 className="text-lg font-bold text-gray-900">{category}</h3>
                                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200 ml-auto">
                                                {items.length} itens
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {items.map(item => {
                                                const result = itemsResult[item.id] || { status: 'N/A' };
                                                const isNonCompliant = result.status === 'Não Conforme';

                                                return (
                                                    <div key={item.id} className={`p-6 transition-colors duration-300 ${isNonCompliant ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                                                            <div className="flex-1">
                                                                <div className="flex items-center gap-3">
                                                                    <p className="text-base font-medium text-gray-900">{item.text}</p>
                                                                    {item.quantity && (
                                                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded border border-blue-100">
                                                                            Qtd: {item.quantity}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            </div>
                                                            <div className="flex items-center bg-gray-100 rounded-lg p-1">
                                                                <button
                                                                    onClick={() => handleItemChange(item.id, 'status', 'Conforme')}
                                                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 uppercase font-bold text-xs ${result.status === 'Conforme' ? 'bg-white text-green-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                                                                >
                                                                    CONFORME
                                                                </button>
                                                                <div className="w-px h-4 bg-gray-300 mx-1"></div>
                                                                <button
                                                                    onClick={() => handleItemChange(item.id, 'status', 'Não Conforme')}
                                                                    className={`px-4 py-2 rounded-md text-sm font-medium transition-all flex items-center gap-2 uppercase font-bold text-xs ${result.status === 'Não Conforme' ? 'bg-white text-red-700 shadow-sm ring-1 ring-black/5' : 'text-gray-500 hover:text-gray-700'}`}
                                                                >
                                                                    NÃO CONFORME
                                                                </button>
                                                            </div>
                                                        </div>

                                                        {isNonCompliant && (
                                                            <div className="mt-4 pt-4 border-t border-red-100 animate-scale-in origin-top">
                                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-red-800 uppercase tracking-wider mb-2">
                                                                            Descrição do Problema <span className="text-red-500">*</span>
                                                                        </label>
                                                                        <textarea
                                                                            className="w-full px-4 py-3 bg-white border border-red-200 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm text-gray-900 placeholder-red-300 transition-shadow"
                                                                            rows={3}
                                                                            placeholder="Descreva detalhadamente o que está irregular..."
                                                                            value={result.comment || ''}
                                                                            onChange={e => handleItemChange(item.id, 'comment', e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div>
                                                                        <label className="block text-xs font-bold text-red-800 uppercase tracking-wider mb-2">Evidência Fotográfica</label>
                                                                        <div className="flex items-start gap-4">
                                                                            <label className="cursor-pointer group flex flex-col items-center justify-center w-32 h-32 bg-white border-2 border-dashed border-red-200 rounded-lg hover:border-red-400 hover:bg-red-50 transition-all">
                                                                                <Camera size={24} className="text-red-300 group-hover:text-red-500 mb-2" />
                                                                                <span className="text-xs text-red-400 group-hover:text-red-600 font-medium">Adicionar Foto</span>
                                                                                <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(item.id, e)} />
                                                                            </label>
                                                                            {result.photoUrl && (
                                                                                <div className="relative group">
                                                                                    <img src={result.photoUrl} alt="Evidência" className="h-32 w-auto rounded-lg border border-gray-200 shadow-sm object-cover" />
                                                                                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-10 transition-all rounded-lg"></div>
                                                                                </div>
                                                                            )}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200">
                                <label className="block text-sm font-bold text-gray-900 mb-2">Observações Gerais</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                                    rows={4}
                                    placeholder="Alguma observação adicional sobre o checklist?"
                                    value={logNotes}
                                    onChange={e => setLogNotes(e.target.value)}
                                />
                            </div>

                            <div className="flex justify-end pt-4 pb-8">
                                <button
                                    onClick={handleSubmit}
                                    className="btn-premium btn-premium-orange btn-premium-shimmer px-8 py-4 text-lg login-uppercase"
                                >
                                    FINALIZAR CHECKLIST
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* --- HISTORY TAB --- */}
            {activeTab === 'history' && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden animate-fade-in">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Data / Hora</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Tipo</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-500 uppercase tracking-wider">Responsável</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-500 uppercase tracking-wider">Status</th>
                                    <th className="px-6 py-4 text-right text-xs font-bold text-gray-500 uppercase tracking-wider">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-100">
                                {checklistLogs.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-12 text-center text-gray-500">
                                            <div className="flex flex-col items-center justify-center">
                                                <ClipboardList size={48} className="text-gray-300 mb-4" />
                                                <p className="font-medium">Nenhum checklist registrado.</p>
                                                <p className="text-sm mt-1">Os checklists finalizados aparecerão aqui.</p>
                                            </div>
                                        </td>
                                    </tr>
                                )}
                                {checklistLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                                    <tr key={log.id} className="hover:bg-gray-50 transition-colors duration-150 group">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="text-sm font-medium text-gray-900">{new Date(log.timestamp).toLocaleDateString()}</div>
                                            <div className="text-xs text-gray-500">{new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <span className={`p-2 rounded-lg mr-3 ${log.type === 'VEICULO' ? 'bg-blue-100 text-blue-600' :
                                                    log.type === 'EQUIPAMENTOS' ? 'bg-orange-100 text-orange-600' :
                                                        'bg-green-100 text-green-600'
                                                    }`}>
                                                    {log.type === 'VEICULO' && <Truck size={16} />}
                                                    {log.type === 'EQUIPAMENTOS' && <Settings size={16} />}
                                                    {log.type === 'CURSO' && <BookOpen size={16} />}
                                                </span>
                                                <div>
                                                    <div className="text-sm font-medium text-gray-900 uppercase">
                                                        {log.type === 'VEICULO' ? 'Med Truck' : log.type === 'EQUIPAMENTOS' ? 'Equipamentos' : 'Curso'}
                                                    </div>
                                                    {log.stage && <div className="text-xs text-gray-500 uppercase">{log.stage === 'INICIO' ? 'Início do Curso' : 'Término do Curso'}</div>}
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center">
                                                <div className="h-8 w-8 rounded-full bg-gray-200 flex items-center justify-center text-gray-500 font-bold text-xs mr-3">
                                                    {log.userName.charAt(0)}
                                                </div>
                                                <div className="text-sm text-gray-900">{log.userName}</div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${log.isCompliant ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
                                                {log.isCompliant ? (
                                                    <><CheckCircle size={12} className="mr-1" /> Conforme</>
                                                ) : (
                                                    <><AlertTriangle size={12} className="mr-1" /> Não Conforme</>
                                                )}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button
                                                onClick={() => alert('Feature: Modal de detalhes do checklist (em desenvolvimento)')}
                                                className="text-gray-400 hover:text-primary-600 transition-colors p-2 rounded-lg hover:bg-primary-50 font-bold text-xs uppercase"
                                                title="Ver Detalhes"
                                            >
                                                VER DETALHES
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* --- MANAGE TAB --- */}
            {activeTab === 'manage' && isManager && (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-fade-in">
                    <div className="flex flex-col sm:flex-row gap-4 mb-8">
                        <button
                            onClick={() => setManageType('VEICULO')}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 uppercase ${manageType === 'VEICULO' ? 'bg-blue-50 text-blue-700 border-2 border-blue-200 shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Truck size={20} />
                            Med Truck
                        </button>
                        <button
                            onClick={() => setManageType('EQUIPAMENTOS')}
                            className={`flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 uppercase ${manageType === 'EQUIPAMENTOS' ? 'bg-orange-50 text-orange-700 border-2 border-orange-200 shadow-sm' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}
                        >
                            <Settings size={20} />
                            Equipamentos
                        </button>
                        <button
                            onClick={() => setManageType('CURSO')}
                            disabled
                            className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2 uppercase bg-white text-gray-400 border border-gray-200 opacity-50 cursor-not-allowed relative"
                        >
                            <BookOpen size={20} />
                            Curso
                            <span className="absolute -top-2 -right-2 bg-orange-100 text-orange-700 text-xs font-bold px-2 py-0.5 rounded-full border border-orange-200">
                                Em Breve
                            </span>
                        </button>
                    </div>

                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Add Item Form */}
                        <div className="lg:col-span-1">
                            <div className="bg-gray-50 rounded-xl p-6 border border-gray-200 sticky top-6">
                                <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <PlusCircle size={20} className="text-primary-600" />
                                    Adicionar Novo Item
                                </h3>
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descrição do Item</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                                            placeholder="Ex: Verificar pressão dos pneus"
                                            value={newItemText}
                                            onChange={e => setNewItemText(e.target.value)}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoria</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                                            placeholder="Ex: Pneus, Motor, Cabine..."
                                            value={newItemCategory}
                                            onChange={e => setNewItemCategory(e.target.value)}
                                            list="categories-list"
                                        />
                                        <datalist id="categories-list">
                                            {Array.from(new Set(activeTemplate?.items.map(i => i.category))).map(cat => (
                                                <option key={cat} value={cat} />
                                            ))}
                                        </datalist>
                                    </div>
                                    {manageType === 'EQUIPAMENTOS' && (
                                        <div>
                                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Quantidade (Opcional)</label>
                                            <input
                                                type="number"
                                                className="w-full px-4 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-shadow"
                                                placeholder="Ex: 1"
                                                value={newItemQuantity}
                                                onChange={e => setNewItemQuantity(Number(e.target.value))}
                                                min={1}
                                            />
                                        </div>
                                    )}
                                    <button
                                        onClick={handleAddItem}
                                        disabled={!newItemText}
                                        className="w-full btn-premium btn-premium-orange btn-premium-shimmer py-3 login-uppercase mt-2"
                                    >
                                        ADICIONAR ITEM
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Items List */}
                        <div className="lg:col-span-2 space-y-6">
                            {activeTemplate?.items.length === 0 ? (
                                <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                                    <ClipboardList size={48} className="mx-auto text-gray-300 mb-4" />
                                    <p className="text-gray-500 font-medium">Nenhum item cadastrado neste checklist.</p>
                                    <p className="text-sm text-gray-400 mt-1">Use o formulário ao lado para começar.</p>
                                </div>
                            ) : (
                                Object.entries(
                                    activeTemplate?.items.reduce((acc, item) => {
                                        const cat = item.category || 'Geral';
                                        if (!acc[cat]) acc[cat] = [];
                                        acc[cat].push(item);
                                        return acc;
                                    }, {} as Record<string, typeof activeTemplate.items>) || {}
                                ).map(([category, items]) => (
                                    <div key={category} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
                                        <div className="bg-gray-50 px-4 py-3 border-b border-gray-200 flex justify-between items-center">
                                            <h4 className="font-bold text-gray-800 flex items-center gap-2">
                                                <div className="w-1.5 h-4 bg-primary-500 rounded-full"></div>
                                                {category}
                                            </h4>
                                            <span className="text-xs font-medium text-gray-500 bg-white px-2 py-1 rounded border border-gray-200">
                                                {items.length} itens
                                            </span>
                                        </div>
                                        <div className="divide-y divide-gray-100">
                                            {items.map(item => (
                                                <div key={item.id} className="p-4 flex items-center justify-between hover:bg-gray-50 transition-colors group">
                                                    <div>
                                                        <p className="text-sm font-medium text-gray-900">{item.text}</p>
                                                        {item.quantity && (
                                                            <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded border border-blue-100 mt-1 inline-block">
                                                                Qtd: {item.quantity}
                                                            </span>
                                                        )}
                                                    </div>
                                                    <button
                                                        onClick={() => handleDeleteItem(item.id)}
                                                        className="text-gray-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors opacity-0 group-hover:opacity-100 font-bold text-xs uppercase"
                                                        title="Remover Item"
                                                    >
                                                        REMOVER
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};