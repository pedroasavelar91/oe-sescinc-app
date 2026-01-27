
import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { Task, UserRole, User } from '../types';
import { Plus, MessageSquare, CheckCircle, Clock, AlertCircle, User as UserIcon, Send, X, ThumbsUp, ThumbsDown, ArrowRight, ChevronRight, Trash2 } from 'lucide-react';
import { getCurrentDateString } from '../utils/dateUtils';
import { GoogleGenAI } from '@google/genai';
import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter } from '../components/StandardModal';
import { StandardSelect } from '../components/StandardSelect';

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

    // Pagination State
    const [pendingPage, setPendingPage] = useState(1);
    const [completedPage, setCompletedPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

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
            id: crypto.randomUUID(),
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
            id: crypto.randomUUID(),
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
        u.role === UserRole.INSTRUTOR ||
        u.role === UserRole.MOTORISTA ||
        u.role === UserRole.AUXILIAR_INSTRUCAO ||
        u.role === UserRole.COORDENADOR ||
        u.role === UserRole.GESTOR
    ).sort((a, b) => a.name.localeCompare(b.name));

    const canAssign = currentUser?.role === UserRole.GESTOR || currentUser?.role === UserRole.COORDENADOR;

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    return (
        <>
            <div className="space-y-6 relative h-full">
                <div className="flex justify-end items-center animate-slide-down">
                    <button
                        onClick={() => setShowCreateModal(true)}
                        className="btn-base bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30 px-8 py-3 text-sm font-bold"
                    >
                        CRIAR
                    </button>
                </div>

                {/* Toggle Tabs */}
                <div className="flex gap-2 border-b border-gray-200">
                    <button
                        onClick={() => setShowCompleted(false)}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${!showCompleted ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        ATIVAS ({overdueTasks.length + pendingTasks.length})
                    </button>
                    <button
                        onClick={() => setShowCompleted(true)}
                        className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${showCompleted ? 'border-primary-600 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}
                    >
                        CONCLUÍDAS ({completedTasks.length})
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
                                                            <Clock size={14} /> Atrasada: {task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
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
                                    {pendingTasks.slice((pendingPage - 1) * ITEMS_PER_PAGE, pendingPage * ITEMS_PER_PAGE).map(task => {
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
                                                            <Clock size={14} /> Prazo: {task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
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
                                {/* Pending Tasks Pagination */}
                                {pendingTasks.length > 0 && (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white border border-gray-200 rounded-b-xl">
                                        <span className="text-sm text-gray-700 uppercase">
                                            MOSTRANDO <span className="font-bold">{(pendingPage - 1) * ITEMS_PER_PAGE + 1}</span> A <span className="font-bold">{Math.min(pendingPage * ITEMS_PER_PAGE, pendingTasks.length)}</span> DE <span className="font-bold">{pendingTasks.length}</span> RESULTADOS
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setPendingPage(p => Math.max(1, p - 1))}
                                                disabled={pendingPage === 1}
                                                className="btn-base btn-pagination px-4 py-2 text-xs"
                                            >
                                                ANTERIOR
                                            </button>
                                            <button
                                                onClick={() => setPendingPage(p => Math.min(Math.ceil(pendingTasks.length / ITEMS_PER_PAGE), p + 1))}
                                                disabled={pendingPage === Math.ceil(pendingTasks.length / ITEMS_PER_PAGE)}
                                                className="btn-base btn-pagination px-4 py-2 text-xs"
                                            >
                                                PRÓXIMA
                                            </button>
                                        </div>
                                    </div>
                                )}
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
                        {completedTasks.slice((completedPage - 1) * ITEMS_PER_PAGE, completedPage * ITEMS_PER_PAGE).map(task => {
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
                                                <Clock size={14} /> Prazo: {task.deadline ? new Date(task.deadline).toLocaleDateString('pt-BR') : 'Sem prazo'}
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

                        {/* Completed Tasks Pagination */}
                        {completedTasks.length > 0 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-white border border-gray-200 rounded-b-xl">
                                <span className="text-sm text-gray-700 uppercase">
                                    MOSTRANDO <span className="font-bold">{(completedPage - 1) * ITEMS_PER_PAGE + 1}</span> A <span className="font-bold">{Math.min(completedPage * ITEMS_PER_PAGE, completedTasks.length)}</span> DE <span className="font-bold">{completedTasks.length}</span> RESULTADOS
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCompletedPage(p => Math.max(1, p - 1))}
                                        disabled={completedPage === 1}
                                        className="btn-base btn-pagination px-4 py-2 text-xs"
                                    >
                                        ANTERIOR
                                    </button>
                                    <button
                                        onClick={() => setCompletedPage(p => Math.min(Math.ceil(completedTasks.length / ITEMS_PER_PAGE), p + 1))}
                                        disabled={completedPage === Math.ceil(completedTasks.length / ITEMS_PER_PAGE)}
                                        className="btn-base btn-pagination px-4 py-2 text-xs"
                                    >
                                        PRÓXIMA
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}

            </div>

            {/* --- DETAILS & COMMENTS MODAL --- */}
            <StandardModal isOpen={!!selectedTask} onClose={() => setSelectedTask(null)} maxWidth="max-w-4xl">
                {selectedTask && (
                    <>
                        <StandardModalHeader
                            title=""
                            onClose={() => setSelectedTask(null)}
                        />
                        <StandardModalBody>
                            <div className="space-y-6">
                                {/* Status Badge and Actions Header */}
                                <div className="flex justify-between items-center bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-xs px-2 py-1 rounded font-bold uppercase tracking-wider ${selectedTask.status === 'Concluída' ? 'bg-green-100 text-green-800' :
                                            selectedTask.status === 'Aguardando Aprovação' ? 'bg-blue-100 text-blue-800' :
                                                'bg-gray-100 text-gray-600'
                                            }`}>
                                            {selectedTask.status.toUpperCase()}
                                        </span>
                                        <span className={`text-xs px-2 py-1 rounded font-medium uppercase ${selectedTask.priority === 'Alta' ? 'bg-red-100 text-red-800' :
                                            'bg-gray-100 text-gray-600'
                                            }`}>
                                            {selectedTask.priority.toUpperCase()}
                                        </span>
                                    </div>
                                    {currentUser?.id === selectedTask.creatorId && (
                                        <button
                                            onClick={() => {
                                                if (window.confirm('Tem certeza que deseja excluir esta tarefa? Esta ação não pode ser desfeita.')) {
                                                    deleteTask(selectedTask.id);
                                                    setSelectedTask(null);
                                                }
                                            }}
                                            className="text-red-600 hover:text-red-800 hover:bg-red-50 p-2 rounded-full transition-all font-bold text-xs uppercase"
                                            title="Excluir tarefa"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    )}
                                </div>

                                {/* Description */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-2 uppercase">DESCRIÇÃO</h4>
                                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                                        <p className="text-sm text-gray-700 whitespace-pre-wrap uppercase">{selectedTask.description}</p>
                                    </div>
                                </div>

                                {/* Meta Info */}
                                <div className="grid grid-cols-2 gap-4 text-sm bg-gray-50 p-4 rounded-lg border border-gray-100">
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-semibold">DATA INÍCIO</span>
                                        <span className="font-medium text-gray-900">{new Date(selectedTask.startDate).toLocaleDateString('pt-BR')}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-semibold">PRAZO</span>
                                        <span className="font-medium text-red-600">{selectedTask.deadline ? new Date(selectedTask.deadline).toLocaleDateString('pt-BR') : '-'}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-semibold">CRIADO POR</span>
                                        <span className="font-medium text-gray-900">{users.find(u => u.id === selectedTask.creatorId)?.name.toUpperCase()}</span>
                                    </div>
                                    <div>
                                        <span className="block text-gray-500 text-xs uppercase font-semibold">ATRIBUÍDO PARA</span>
                                        <span className="font-medium text-gray-900">{users.find(u => u.id === selectedTask.assigneeId)?.name.toUpperCase() || 'PRIVADA'}</span>
                                    </div>
                                </div>

                                {/* Resolution Notes Input */}
                                {selectedTask.status !== 'Concluída' && (
                                    <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-100">
                                        <h4 className="text-sm font-bold text-yellow-900 mb-2 uppercase">NOTAS DE CONCLUSÃO / RESOLUÇÃO</h4>
                                        <textarea
                                            className="w-full p-2 border border-yellow-200 rounded-md text-sm focus:outline-none focus:border-yellow-400 bg-white"
                                            placeholder="DESCREVA COMO A TAREFA FOI RESOLVIDA..."
                                            rows={3}
                                            value={resolutionNotes}
                                            onChange={e => setResolutionNotes(e.target.value)}
                                        />
                                    </div>
                                )}

                                {/* Comments Section */}
                                <div>
                                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase">
                                        <MessageSquare size={16} /> COMENTÁRIOS
                                    </h4>

                                    <div className="space-y-4 mb-4 max-h-60 overflow-y-auto pr-2">
                                        {selectedTask.comments?.length === 0 && <p className="text-sm text-gray-400 italic uppercase">NENHUM COMENTÁRIO AINDA.</p>}
                                        {selectedTask.comments?.map((comment, idx) => (
                                            <div key={idx} className={`flex flex-col ${comment.userId === currentUser?.id ? 'items-end' : 'items-start'}`}>
                                                <div className={`max-w-[85%] p-3 rounded-lg text-sm ${comment.userId === currentUser?.id ? 'bg-blue-50 text-blue-900 rounded-br-none border border-blue-100' : 'bg-gray-100 text-gray-800 rounded-bl-none border border-gray-200'}`}>
                                                    <p className="uppercase">{comment.text}</p>
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1 uppercase font-medium">
                                                    {users.find(u => u.id === comment.userId)?.name} • {new Date(comment.date).toLocaleDateString('pt-BR')}
                                                </span>
                                            </div>
                                        ))}
                                    </div>

                                    <div className="flex gap-2">
                                        <input
                                            type="text"
                                            className="flex-1 appearance-none block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm bg-white text-gray-900 uppercase"
                                            placeholder="ESCREVA UM COMENTÁRIO..."
                                            value={commentText}
                                            onChange={e => setCommentText(e.target.value.toUpperCase())}
                                            onKeyDown={e => e.key === 'Enter' && handleAddComment()}
                                        />
                                        <button
                                            onClick={handleAddComment}
                                            disabled={!commentText.trim()}
                                            className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 px-4 py-2 text-xs font-bold disabled:opacity-50"
                                        >
                                            ENVIAR
                                        </button>
                                    </div>
                                </div>

                                {/* Activity Log */}
                                <div className="border-t border-gray-100 pt-6">
                                    <h4 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2 uppercase">
                                        <Clock size={16} /> HISTÓRICO DE ATIVIDADES
                                    </h4>
                                    <div className="space-y-3 max-h-40 overflow-y-auto">
                                        {selectedTask.logs?.length === 0 && <p className="text-sm text-gray-400 italic uppercase">NENHUMA ATIVIDADE REGISTRADA.</p>}
                                        {selectedTask.logs?.slice().reverse().map((log, idx) => (
                                            <div key={idx} className="flex gap-3 text-sm">
                                                <div className="min-w-[4px] w-1 bg-gray-200 rounded-full"></div>
                                                <div>
                                                    <p className="text-gray-900 font-medium text-xs uppercase">
                                                        {log.userName} <span className="text-gray-400 font-normal uppercase">• {new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </p>
                                                    <p className="text-gray-600 uppercase">{log.details}</p>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </StandardModalBody>
                        <StandardModalFooter>
                            {/* Action Buttons Logic */}
                            <div className="flex gap-2 w-full justify-end">
                                <button
                                    onClick={() => setSelectedTask(null)}
                                    className="btn-base btn-cancel px-6 py-2.5 text-xs font-bold"
                                >
                                    FECHAR
                                </button>

                                {selectedTask.status !== 'Concluída' && (
                                    <>
                                        {/* Logic for Private Tasks */}
                                        {!selectedTask.assigneeId && selectedTask.creatorId === currentUser?.id && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'finish_private'); }}
                                                className="btn-base btn-save px-6 py-2.5 text-xs font-bold bg-green-600 hover:bg-green-700 shadow-green-500/30 text-white"
                                            >
                                                CONCLUIR TAREFA
                                            </button>
                                        )}

                                        {/* Logic for Assigned Tasks - Assignee View */}
                                        {selectedTask.assigneeId === currentUser?.id && selectedTask.status === 'Pendente' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'request_finish'); }}
                                                className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 px-6 py-2.5 text-xs font-bold"
                                            >
                                                ENVIAR PARA APROVAÇÃO
                                            </button>
                                        )}

                                        {/* Logic for Assigned Tasks - Creator View (Force Finish) */}
                                        {selectedTask.creatorId === currentUser?.id && selectedTask.assigneeId && selectedTask.status === 'Pendente' && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'finish_private'); }}
                                                className="btn-base btn-save px-6 py-2.5 text-xs font-bold bg-green-600 hover:bg-green-700 shadow-green-500/30 text-white"
                                            >
                                                CONCLUIR TAREFA
                                            </button>
                                        )}

                                        {/* Logic for Assigned Tasks - Creator (Approver) View */}
                                        {selectedTask.creatorId === currentUser?.id && selectedTask.status === 'Aguardando Aprovação' && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'approve'); }}
                                                    className="btn-base btn-save px-6 py-2.5 text-xs font-bold bg-green-600 hover:bg-green-700 shadow-green-500/30 text-white"
                                                >
                                                    APROVAR
                                                </button>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleStatusChange(selectedTask, 'reject'); }}
                                                    className="btn-base bg-red-600 text-white hover:bg-red-700 shadow-lg shadow-red-500/30 px-6 py-2.5 text-xs font-bold"
                                                >
                                                    RECUSAR
                                                </button>
                                            </>
                                        )}
                                    </>
                                )}
                            </div>
                        </StandardModalFooter>
                    </>
                )}
            </StandardModal>


            {/* --- CREATE TASK MODAL --- */}
            <StandardModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} maxWidth="max-w-lg">
                <StandardModalHeader
                    title=""
                    onClose={() => setShowCreateModal(false)}
                />

                <StandardModalBody>
                    <div className="space-y-4">
                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">TÍTULO</label>
                            <input
                                placeholder="TÍTULO DA TAREFA"
                                className="w-full px-4 py-3 text-sm bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all uppercase placeholder-gray-400"
                                value={newTask.title || ''}
                                onChange={e => setNewTask({ ...newTask, title: e.target.value.toUpperCase() })}
                            />
                        </div>

                        <div>
                            <label className="block text-xs font-bold text-gray-700 uppercase mb-2">DESCRIÇÃO</label>
                            <textarea
                                placeholder="DETALHES DA TAREFA..."
                                className="w-full px-4 py-3 text-sm bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all h-24 uppercase placeholder-gray-400"
                                value={newTask.description || ''}
                                onChange={e => setNewTask({ ...newTask, description: e.target.value.toUpperCase() })}
                            />
                            <button onClick={getAiSuggestion} className="text-xs text-blue-600 hover:text-blue-800 hover:underline mt-2 flex items-center gap-1 uppercase font-bold">
                                ✨ Usar IA para sugerir descrição
                            </button>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">DATA DE INÍCIO</label>
                                <input
                                    type="date"
                                    lang="pt-BR"
                                    className="w-full px-4 py-3 text-sm bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    value={newTask.startDate || ''}
                                    onChange={e => setNewTask({ ...newTask, startDate: e.target.value })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">PRAZO FINAL</label>
                                <input
                                    type="date"
                                    lang="pt-BR"
                                    className="w-full px-4 py-3 text-sm bg-gray-50 text-gray-900 border border-gray-300 rounded-lg focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all"
                                    value={newTask.deadline || ''}
                                    onChange={e => setNewTask({ ...newTask, deadline: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            <StandardSelect
                                label="PRIORIDADE"
                                value={newTask.priority || 'Média'}
                                onChange={(e) => setNewTask({ ...newTask, priority: e.target.value as any })}
                                options={[
                                    { value: "Baixa", label: "BAIXA" },
                                    { value: "Média", label: "MÉDIA" },
                                    { value: "Alta", label: "ALTA" }
                                ]}
                            />

                            {canAssign ? (
                                <StandardSelect
                                    label="ATRIBUIR A"
                                    value={newTask.assigneeId || ''}
                                    onChange={(e) => setNewTask({ ...newTask, assigneeId: e.target.value })}
                                    options={[
                                        { value: "", label: "NÃO ATRIBUIR (PRIVADA)" },
                                        ...assignableUsers.map(u => ({ value: u.id, label: `${u.name} (${u.role})`.toUpperCase() }))
                                    ]}
                                />
                            ) : (
                                <div className="flex items-center text-sm text-gray-500 pt-6 italic border border-dashed border-gray-300 rounded-lg justify-center bg-gray-50 uppercase">
                                    <AlertCircle size={16} className="mr-1" /> TAREFA PRIVADA
                                </div>
                            )}
                        </div>
                    </div>
                </StandardModalBody>

                <StandardModalFooter>
                    <button
                        onClick={() => setShowCreateModal(false)}
                        className="btn-base btn-cancel px-6 py-2.5 text-xs font-bold"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleSave}
                        className="btn-base btn-save px-6 py-2.5 text-xs font-bold bg-orange-600 hover:bg-orange-700 shadow-orange-500/30 text-white"
                    >
                        CRIAR TAREFA
                    </button>
                </StandardModalFooter>
            </StandardModal>
        </>
    );
};
