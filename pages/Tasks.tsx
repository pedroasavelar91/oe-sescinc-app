
import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { Task, UserRole, User } from '../types';
import { Plus, MessageSquare, CheckCircle, Clock, AlertCircle, User as UserIcon, Send, X, ThumbsUp, ThumbsDown, ArrowRight, ChevronRight, Trash2 } from 'lucide-react';
import { getCurrentDateString } from '../utils/dateUtils';
import { GoogleGenAI } from '@google/genai';

export const TasksPage: React.FC = () => {
    const { tasks, addTask, updateTask, deleteTask, users, currentUser } = useStore();
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null); // For Details View
    const [showCompleted, setShowCompleted] = useState(false);

    // Creation State
    const [newTask, setNewTask] = useState<Partial<Task>>({
        priority: 'Média',
        status: 'Pendente'
    });
    const [aiSuggestion, setAiSuggestion] = useState('');
    const [commentText, setCommentText] = useState('');

    // --- AI Helper ---
    const getAiSuggestion = async () => {
        if (!newTask.title) return;
        try {
            const ai = new GoogleGenAI({ apiKey: (import.meta as any).env.VITE_GEMINI_API_KEY || '' });
            const response = await ai.models.generateContent({
                model: 'gemini-2.5-flash',
                contents: `Suggest a brief, professional description and checklist for a task titled: "${newTask.title}" for a fire safety instructor.`,
            });
            const r = response as any;
            const text = typeof r.text === 'function' ? r.text() : r.text;
            setAiSuggestion(text || '');
            setNewTask({ ...newTask, description: text || '' });
        } catch (error) {
            console.error("AI Error", error);
        }
    };

    // --- CRUD Operations ---
    const handleSave = () => {
        if (!currentUser || !newTask.title) return;
        const t: Task = {
            id: Math.random().toString(36).substr(2, 9),
            title: newTask.title,
            description: newTask.description || '',
            startDate: newTask.startDate || getCurrentDateString(),
            deadline: newTask.deadline || '',
            creatorId: currentUser.id,
            assigneeId: newTask.assigneeId, // If undefined, private
            priority: newTask.priority as any,
            status: 'Pendente',
            comments: [],
            logs: []
        };
        addTask(t);
        setShowCreateModal(false);
        setNewTask({ priority: 'Média', status: 'Pendente' });
    };

    const handleAddComment = () => {
        if (!selectedTask || !currentUser || !commentText.trim()) return;

        const newComment = {
            userId: currentUser.id,
            text: commentText,
            date: new Date().toISOString()
        };

        const updatedTask = {
            ...selectedTask,
            comments: [...(selectedTask.comments || []), newComment]
        };

        updateTask(updatedTask);
        setSelectedTask(updatedTask); // Update local view
        setCommentText('');
    };

    const [resolutionNotes, setResolutionNotes] = useState('');

    // --- Workflow Logic ---
    const handleStatusChange = (task: Task, action: 'request_finish' | 'approve' | 'reject' | 'finish_private') => {
        let newStatus = task.status;
        let logAction = '';
        let logDetails = '';

        if (action === 'finish_private') {
            newStatus = 'Concluída';
            logAction = 'finished';
            logDetails = `Tarefa concluída por ${currentUser?.name}. Notas: ${resolutionNotes || 'Sem notas'}`;
        } else if (action === 'request_finish') {
            newStatus = 'Aguardando Aprovação';
            logAction = 'status_change';
            logDetails = `Solicitação de conclusão por ${currentUser?.name}. Notas: ${resolutionNotes || 'Sem notas'}`;
        } else if (action === 'approve') {
            newStatus = 'Concluída';
            logAction = 'finished';
            logDetails = `Conclusão aprovada por ${currentUser?.name}.`;
        } else if (action === 'reject') {
            newStatus = 'Pendente';
            logAction = 'status_change';
            logDetails = `Conclusão recusada por ${currentUser?.name}.`;
        }

        const newLog = {
            id: Math.random().toString(36).substr(2, 9),
            timestamp: new Date().toISOString(),
            userId: currentUser?.id || 'system',
            userName: currentUser?.name || 'Sistema',
            action: logAction as any,
            details: logDetails
        };

        const updatedTask = {
            ...task,
            status: newStatus,
            logs: [...(task.logs || []), newLog],
            resolutionNotes: (action === 'finish_private' || action === 'request_finish') ? resolutionNotes : task.resolutionNotes
        };

        updateTask(updatedTask);
        if (selectedTask && selectedTask.id === task.id) {
            setSelectedTask(updatedTask);
        }
        setResolutionNotes(''); // Reset notes
    };

    // --- Filtering ---
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueTasks = tasks.filter(t => {
        // 1. Private tasks (no assignee): Only Creator sees them
        if (!t.assigneeId && t.creatorId !== currentUser?.id) return false;
        // 2. Assigned tasks: Creator and Assignee see them
        if (t.assigneeId && t.creatorId !== currentUser?.id && t.assigneeId !== currentUser?.id) return false;

        // Must not be completed
        if (t.status === 'Concluída') return false;

        // Must have a deadline and be past it
        if (!t.deadline) return false;
        const deadline = new Date(t.deadline);
        deadline.setHours(0, 0, 0, 0);
        return deadline < today;
    });

    const pendingTasks = tasks.filter(t => {
        // 1. Private tasks (no assignee): Only Creator sees them
        if (!t.assigneeId && t.creatorId !== currentUser?.id) return false;
        // 2. Assigned tasks: Creator and Assignee see them
        if (t.assigneeId && t.creatorId !== currentUser?.id && t.assigneeId !== currentUser?.id) return false;

        // Must not be completed
        if (t.status === 'Concluída') return false;

        // Either no deadline or not past deadline
        if (!t.deadline) return true;
        const deadline = new Date(t.deadline);
        deadline.setHours(0, 0, 0, 0);
        return deadline >= today;
    });

    const completedTasks = tasks.filter(t => {
        // 1. Private tasks (no assignee): Only Creator sees them
        if (!t.assigneeId && t.creatorId !== currentUser?.id) return false;
        // 2. Assigned tasks: Creator and Assignee see them
        if (t.assigneeId && t.creatorId !== currentUser?.id && t.assigneeId !== currentUser?.id) return false;

        return t.status === 'Concluída';
    });

    // Assignable Users: Instructors and Drivers
    const assignableUsers = users.filter(u =>
        u.role === UserRole.INSTRUTOR || u.role === UserRole.MOTORISTA
    );

    const canAssign = currentUser?.role === UserRole.GESTOR || currentUser?.role === UserRole.COORDENADOR;

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    return (
        <div className="space-y-6 relative h-full animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Tarefas</h1>
                    <p className="text-gray-500 mt-1">Gerencie e acompanhe suas tarefas</p>
                </div>
                <button onClick={() => setShowCreateModal(true)} className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200">
                    <Plus size={20} /> <span className="font-semibold">Nova Tarefa</span>
                </button>
            </div>

            {/* Toggle Tabs */}
            <div className="flex gap-2 border-b border-gray-200">
                <button
                    onClick={() => setShowCompleted(false)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${!showCompleted ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Ativas ({overdueTasks.length + pendingTasks.length})
                </button>
                <button
                    onClick={() => setShowCompleted(true)}
                    className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${showCompleted ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                >
                    Concluídas ({completedTasks.length})
                </button>
            </div>

            {!showCompleted ? (
                <>
                    {/* Overdue Tasks Section */}
                    {overdueTasks.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <AlertCircle className="text-red-500" size={20} />
                                <h2 className="text-lg font-bold text-red-600">Tarefas Atrasadas ({overdueTasks.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {overdueTasks.map(task => {
                                    const isCreator = currentUser?.id === task.creatorId;
                                    const isAssignee = currentUser?.id === task.assigneeId;
                                    const isPrivate = !task.assigneeId;

                                    return (
                                        <div key={task.id} className="card-premium stagger-item p-5 flex flex-col md:flex-row justify-between cursor-pointer group border-l-4 border-red-500" onClick={() => setSelectedTask(task)}>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900">{task.title}</h3>
                                                    <span className={`badge text-xs px-2 py-1 rounded font-medium transition-transform group-hover:scale-110 ${task.priority === 'Alta' ? 'badge-error' :
                                                        task.priority === 'Média' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className={`badge text-xs px-2 py-1 rounded font-medium transition-transform group-hover:scale-110 ${task.status === 'Concluída' ? 'badge-success' :
                                                        task.status === 'Aguardando Aprovação' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1 text-red-600 font-bold">
                                                        <Clock size={14} /> Atrasada: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Sem prazo'}
                                                    </span>
                                                    {isPrivate ? (
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">Privada</span>
                                                    ) : (
                                                        <>
                                                            <span className="flex items-center gap-1">
                                                                <ArrowRight size={14} /> De: <strong>{users.find(u => u.id === task.creatorId)?.name.split(' ')[0]}</strong>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <UserIcon size={14} /> Para: <strong>{users.find(u => u.id === task.assigneeId)?.name}</strong>
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare size={14} /> {task.comments?.length || 0} Comentários
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 md:mt-0 md:ml-6 flex items-center justify-end">
                                                <ChevronRight size={24} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Pending Tasks Section */}
                    {pendingTasks.length > 0 && (
                        <div className="space-y-4">
                            <div className="flex items-center gap-2">
                                <Clock className="text-blue-500" size={20} />
                                <h2 className="text-lg font-bold text-gray-800">Tarefas Pendentes ({pendingTasks.length})</h2>
                            </div>
                            <div className="grid grid-cols-1 gap-4">
                                {pendingTasks.map(task => {
                                    const isCreator = currentUser?.id === task.creatorId;
                                    const isAssignee = currentUser?.id === task.assigneeId;
                                    const isPrivate = !task.assigneeId;

                                    return (
                                        <div key={task.id} className="card-premium stagger-item p-5 flex flex-col md:flex-row justify-between cursor-pointer group" onClick={() => setSelectedTask(task)}>
                                            <div className="flex-1">
                                                <div className="flex items-center space-x-3 mb-2">
                                                    <h3 className="font-bold text-lg text-gray-900">{task.title}</h3>
                                                    <span className={`badge text-xs px-2 py-1 rounded font-medium transition-transform group-hover:scale-110 ${task.priority === 'Alta' ? 'badge-error' :
                                                        task.priority === 'Média' ? 'bg-yellow-100 text-yellow-800' :
                                                            'bg-green-100 text-green-800'
                                                        }`}>
                                                        {task.priority}
                                                    </span>
                                                    <span className={`badge text-xs px-2 py-1 rounded font-medium transition-transform group-hover:scale-110 ${task.status === 'Concluída' ? 'badge-success' :
                                                        task.status === 'Aguardando Aprovação' ? 'bg-blue-100 text-blue-800' :
                                                            'bg-gray-100 text-gray-600'
                                                        }`}>
                                                        {task.status}
                                                    </span>
                                                </div>
                                                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>

                                                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                                    <span className="flex items-center gap-1">
                                                        <Clock size={14} /> Prazo: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Sem prazo'}
                                                    </span>
                                                    {isPrivate ? (
                                                        <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">Privada</span>
                                                    ) : (
                                                        <>
                                                            <span className="flex items-center gap-1">
                                                                <ArrowRight size={14} /> De: <strong>{users.find(u => u.id === task.creatorId)?.name.split(' ')[0]}</strong>
                                                            </span>
                                                            <span className="flex items-center gap-1">
                                                                <UserIcon size={14} /> Para: <strong>{users.find(u => u.id === task.assigneeId)?.name}</strong>
                                                            </span>
                                                        </>
                                                    )}
                                                    <span className="flex items-center gap-1">
                                                        <MessageSquare size={14} /> {task.comments?.length || 0} Comentários
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="mt-4 md:mt-0 md:ml-6 flex items-center justify-end">
                                                <ChevronRight size={24} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {overdueTasks.length === 0 && pendingTasks.length === 0 && (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                            Você não possui tarefas ativas.
                        </div>
                    )}
                </>
            ) : (
                <div className="grid grid-cols-1 gap-4">
                    {completedTasks.length === 0 && (
                        <div className="text-center py-12 text-gray-500 bg-white rounded-lg border border-dashed border-gray-300">
                            Nenhuma tarefa concluída.
                        </div>
                    )}
                    {completedTasks.map(task => {
                        const isCreator = currentUser?.id === task.creatorId;
                        const isAssignee = currentUser?.id === task.assigneeId;
                        const isPrivate = !task.assigneeId;

                        return (
                            <div key={task.id} className="card-premium stagger-item p-5 flex flex-col md:flex-row justify-between cursor-pointer group" onClick={() => setSelectedTask(task)}>
                                <div className="flex-1">
                                    <div className="flex items-center space-x-3 mb-2">
                                        <h3 className="font-bold text-lg text-gray-900">{task.title}</h3>
                                        <span className={`badge text-xs px-2 py-1 rounded font-medium transition-transform group-hover:scale-110 ${task.priority === 'Alta' ? 'badge-error' :
                                            task.priority === 'Média' ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-green-100 text-green-800'
                                            }`}>
                                            {task.priority}
                                        </span>
                                        <span className="badge text-xs px-2 py-1 rounded font-medium bg-green-100 text-green-800">
                                            Concluída
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-600 line-clamp-2 mb-3">{task.description}</p>

                                    <div className="flex flex-wrap items-center gap-4 text-xs text-gray-500">
                                        <span className="flex items-center gap-1">
                                            <Clock size={14} /> Prazo: {task.deadline ? new Date(task.deadline).toLocaleDateString() : 'Sem prazo'}
                                        </span>
                                        {isPrivate ? (
                                            <span className="bg-gray-100 px-2 py-0.5 rounded text-gray-700">Privada</span>
                                        ) : (
                                            <>
                                                <span className="flex items-center gap-1">
                                                    <ArrowRight size={14} /> De: <strong>{users.find(u => u.id === task.creatorId)?.name.split(' ')[0]}</strong>
                                                </span>
                                                <span className="flex items-center gap-1">
                                                    <UserIcon size={14} /> Para: <strong>{users.find(u => u.id === task.assigneeId)?.name}</strong>
                                                </span>
                                            </>
                                        )}
                                        <span className="flex items-center gap-1">
                                            <MessageSquare size={14} /> {task.comments?.length || 0} Comentários
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-4 md:mt-0 md:ml-6 flex items-center justify-end">
                                    <ChevronRight size={24} className="text-gray-300 group-hover:text-primary-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* --- DETAILS & COMMENTS MODAL --- */}
            {selectedTask && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex justify-end z-50 animate-fade-in">
                    <div className="bg-white w-full max-w-xl h-full shadow-2xl overflow-y-auto flex flex-col animate-slide-left">
                        {/* Header */}
                        <div className="p-6 border-b border-gray-100 flex justify-between items-start sticky top-0 bg-white z-10">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${selectedTask.status === 'Concluída' ? 'bg-green-100 text-green-800' :
                                        selectedTask.status === 'Aguardando Aprovação' ? 'bg-blue-100 text-blue-800' :
                                            'bg-gray-100 text-gray-600'
                                        }`}>
                                        {selectedTask.status}
                                    </span>
                                    <span className={`text-xs px-2 py-1 rounded font-medium ${selectedTask.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                                        'bg-gray-100 text-gray-600'
                                        }`}>
                                        {selectedTask.priority}
                                    </span>
                                </div>
                                <h2 className="text-xl font-bold text-gray-900">{selectedTask.title}</h2>
                            </div>
                            <div className="flex items-center gap-2">
                                {currentUser?.id === selectedTask.creatorId && (
                                    <button
                                        onClick={() => {
                                            if (window.confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')) {
                                                deleteTask(selectedTask.id);
                                                setSelectedTask(null);
                                            }
                                        }}
                                        className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-all"
                                        title="Excluir tarefa"
                                    >
                                        <Trash2 size={20} />
                                    </button>
                                )}
                                <button onClick={() => setSelectedTask(null)} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all">
                                    <X size={24} />
                                </button>
                            </div>
                        </div>

                        {/* Body */}
                        <div className="p-6 flex-1 space-y-6">
                            {/* Description */}
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-100">
                                <h4 className="text-sm font-bold text-gray-900 mb-2">Descrição</h4>
                                <p className="text-sm text-gray-700 whitespace-pre-wrap">{selectedTask.description}</p>
                            </div>

                            {/* Meta Info */}
                            <div className="grid grid-cols-2 gap-4 text-sm">
                                <div>
                                    <span className="block text-gray-500 text-xs">Data Início</span>
                                    <span className="font-medium">{new Date(selectedTask.startDate).toLocaleDateString()}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Prazo</span>
                                    <span className="font-medium text-red-600">{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString() : '-'}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Criado Por</span>
                                    <span className="font-medium">{users.find(u => u.id === selectedTask.creatorId)?.name}</span>
                                </div>
                                <div>
                                    <span className="block text-gray-500 text-xs">Atribuído Para</span>
                                    <span className="font-medium">{users.find(u => u.id === selectedTask.assigneeId)?.name || 'Privada'}</span>
                                </div>
                            </div>

                            {/* Resolution Notes Input */}
                            {selectedTask.status !== 'Concluída' && (
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                    <h4 className="text-sm font-bold text-yellow-900 mb-2">Notas de Conclusão / Resolução</h4>
                                    <textarea
                                        className="w-full p-2 border border-yellow-200 rounded-md text-sm focus:outline-none focus:border-yellow-400"
                                        placeholder="Descreva como a tarefa foi resolvida ou adicione observações..."
                                        rows={3}
                                        value={resolutionNotes}
                                        onChange={e => setResolutionNotes(e.target.value)}
                                    />
                                </div>
                            )}

                            {/* Action Buttons */}
                            {selectedTask.status !== 'Concluída' && (
                                <div className="py-4 border-t border-b border-gray-100">
                                    <h4 className="text-sm font-bold text-gray-900 mb-3">Ações</h4>
                                    <div className="flex gap-3">
                                        {/* Logic for Private Tasks */}
                                        {!selectedTask.assigneeId && selectedTask.creatorId === currentUser?.id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'finish_private'); }}
                                                className="btn-premium flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 shadow-md transition-all duration-200"
                                            >
                                                <CheckCircle size={18} /> Concluir Tarefa
                                            </button>
                                        )}

                                        {/* Logic for Assigned Tasks - Assignee View */}
                                        {selectedTask.assigneeId === currentUser?.id && selectedTask.status === 'Pendente' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'request_finish'); }}
                                                className="btn-premium flex-1 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 shadow-md transition-all duration-200"
                                            >
                                                <Send size={18} /> Enviar para Aprovação
                                            </button>
                                        )}

                                        {/* Logic for Assigned Tasks - Creator View (Force Finish) */}
                                        {selectedTask.creatorId === currentUser?.id && selectedTask.assigneeId && selectedTask.status === 'Pendente' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'finish_private'); }}
                                                className="btn-premium flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 shadow-md transition-all duration-200"
                                            >
                                                <CheckCircle size={18} /> Concluir Tarefa
                                            </button>
                                        )}

                                        {/* Logic for Assigned Tasks - Creator (Approver) View */}
                                        {selectedTask.creatorId === currentUser?.id && selectedTask.status === 'Aguardando Aprovação' && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'approve'); }}
                                                    className="btn-premium flex-1 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-700 hover:to-green-600 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 shadow-md transition-all duration-200"
                                                >
                                                    <ThumbsUp size={18} /> Aprovar
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'reject'); }}
                                                    className="btn-premium flex-1 bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 text-white px-4 py-2 rounded-lg flex justify-center items-center gap-2 shadow-md transition-all duration-200"
                                                >
                                                    <ThumbsDown size={18} /> Recusar
                                                </button>
                                            </>
                                        )}

                                        {/* Waiting State */}
                                        {selectedTask.assigneeId === currentUser?.id && selectedTask.status === 'Aguardando Aprovação' && (
                                            <div className="flex-1 bg-gray-100 text-gray-600 px-4 py-2 rounded-md text-center text-sm italic">
                                                Aguardando aprovação do gestor...
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}

                            {/* Comments Section */}
                            <div>
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <MessageSquare size={16} /> Comentários
                                </h4>

                                <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                    {selectedTask.comments?.length === 0 && <p className="text-sm text-gray-400 italic">Nenhum comentário ainda.</p>}
                                    {selectedTask.comments?.map((comment, idx) => (
                                        <div key={idx} className={`flex flex-col ${comment.userId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                            <div className={`max-w-[85%] p-3 rounded-lg text-sm ${comment.userId === currentUser?.id ? 'bg-primary-50 text-gray-800 rounded-br-none' : 'bg-gray-100 text-gray-800 rounded-bl-none'}`}>
                                                <p>{comment.text}</p>
                                            </div>
                                            <span className="text-[10px] text-gray-400 mt-1">
                                                {users.find(u => u.id === comment.userId)?.name} • {new Date(comment.date).toLocaleDateString()} {new Date(comment.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </span>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex gap-2">
                                    <input
                                        type="text"
                                        className="input-premium flex-1 appearance-none block w-full px-3 py-2 rounded-md shadow-sm placeholder-gray-400 sm:text-sm bg-white text-gray-900"
                                        placeholder="Escreva um comentário..."
                                        value={commentText}
                                        onChange={e => setCommentText(e.target.value.toUpperCase())}
                                        onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                    />
                                    <button
                                        onClick={handleAddComment}
                                        disabled={!commentText.trim()}
                                        className="btn-premium bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white p-2 rounded-lg disabled:opacity-50 shadow-md transition-all duration-200"
                                    >
                                        <Send size={18} />
                                    </button>
                                </div>
                            </div>

                            {/* Activity Log */}
                            <div className="border-t border-gray-100 pt-6">
                                <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
                                    <Clock size={16} /> Histórico de Atividades
                                </h4>
                                <div className="space-y-3 max-h-40 overflow-y-auto">
                                    {selectedTask.logs?.length === 0 && <p className="text-sm text-gray-400 italic">Nenhuma atividade registrada.</p>}
                                    {selectedTask.logs?.slice().reverse().map((log, idx) => (
                                        <div key={idx} className="flex gap-3 text-sm">
                                            <div className="min-w-[4px] w-1 bg-gray-200 rounded-full"></div>
                                            <div>
                                                <p className="text-gray-900 font-medium text-xs">
                                                    {log.userName} <span className="text-gray-400 font-normal">• {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                </p>
                                                <p className="text-gray-600">{log.details}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* --- CREATE TASK MODAL --- */}
            {showCreateModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl p-6 w-full max-w-lg shadow-2xl animate-scale-in">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">Criar Tarefa</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título</label>
                                <input placeholder="Título da tarefa" className={inputClass} value={newTask.title || ''} onChange={e => setNewTask({ ...newTask, title: e.target.value.toUpperCase() })} />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição</label>
                                <textarea placeholder="Detalhes da tarefa..." className={`${inputClass} h-24`} value={newTask.description || ''} onChange={e => setNewTask({ ...newTask, description: e.target.value.toUpperCase() })} />
                                <button onClick={getAiSuggestion} className="text-xs text-primary-600 hover:underline mt-1 flex items-center gap-1">
                                    ✨ Usar IA para sugerir descrição
                                </button>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Data de Início</label>
                                    <input type="date" className={inputClass} value={newTask.startDate || ''} onChange={e => setNewTask({ ...newTask, startDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prazo Final</label>
                                    <input type="date" className={inputClass} value={newTask.deadline || ''} onChange={e => setNewTask({ ...newTask, deadline: e.target.value })} />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Prioridade</label>
                                    <select className={inputClass} value={newTask.priority} onChange={e => setNewTask({ ...newTask, priority: e.target.value as any })}>
                                        <option>Baixa</option>
                                        <option>Média</option>
                                        <option>Alta</option>
                                    </select>
                                </div>

                                {canAssign ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Atribuir a</label>
                                        <select className={inputClass} value={newTask.assigneeId || ''} onChange={e => setNewTask({ ...newTask, assigneeId: e.target.value })}>
                                            <option value="">Não atribuir (Privada)</option>
                                            {assignableUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.role})</option>
                                            ))}
                                        </select>
                                    </div>
                                ) : (
                                    <div className="flex items-center text-sm text-gray-500 pt-6 italic">
                                        <AlertCircle size={16} className="mr-1" /> Tarefa Privada
                                    </div>
                                )}
                            </div>
                        </div>
                        <div className="mt-6 flex justify-end space-x-3 pt-4 border-t border-gray-100">
                            <button onClick={() => setShowCreateModal(false)} className="px-6 py-2.5 border rounded-lg text-gray-700 hover:bg-gray-50 bg-white font-medium transition-colors">Cancelar</button>
                            <button onClick={handleSave} className="btn-premium bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-2.5 rounded-lg shadow-md font-semibold transition-all duration-200">Criar Tarefa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
