import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { Question, QuestionStatus, QUESTION_SUBJECTS, UserRole } from '../types';
import { BookOpen, Plus, Check, X, Edit2, Trash2, Search, Filter, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, Shield, UserPlus, User } from 'lucide-react';

export const QuestionBankPage: React.FC = () => {
    const { currentUser, questions, questionApprovers, addQuestion, updateQuestion, deleteQuestion, reviewQuestion, addApprover, removeApprover, users } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showApproversModal, setShowApproversModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuestionStatus | 'Todas'>('Todas');
    const [subjectFilter, setSubjectFilter] = useState<string>('Todas');

    const [formData, setFormData] = useState({
        title: '',
        subject: '' as any,
        content: '',
        optionA: '',
        optionB: '',
        optionC: '',
        optionD: '',
        correctOption: '' as 'A' | 'B' | 'C' | 'D' | '',
        explanation: ''
    });

    const [reviewNotes, setReviewNotes] = useState('');

    if (!currentUser) return null;

    const canCreate = currentUser.role === UserRole.INSTRUTOR || currentUser.role === UserRole.COORDENADOR || currentUser.role === UserRole.GESTOR;
    const canManageApprovers = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;
    const isApprover = questionApprovers.some(a => a.userId === currentUser.id && a.isActive);

    const filteredQuestions = useMemo(() => {
        return questions.filter(q => {
            const matchesSearch = q.content.toLowerCase().includes(searchTerm.toLowerCase()) ||
                q.subject.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesStatus = statusFilter === 'Todas' || q.status === statusFilter;
            const matchesSubject = subjectFilter === 'Todas' || q.subject === subjectFilter;

            // Mostrar apenas questões aprovadas para não-aprovadores, ou todas para aprovadores
            const canView = q.status === 'Aprovada' || q.createdBy === currentUser.id || isApprover;

            return matchesSearch && matchesStatus && matchesSubject && canView;
        });
    }, [questions, searchTerm, statusFilter, subjectFilter, currentUser.id, isApprover]);

    const handleOpenModal = (question?: Question) => {
        if (question) {
            setFormData({
                title: question.title || '',
                subject: question.subject,
                content: question.content,
                optionA: question.optionA,
                optionB: question.optionB,
                optionC: question.optionC,
                optionD: question.optionD,
                correctOption: question.correctOption,
                explanation: question.explanation || ''
            });
            setSelectedQuestion(question);
        } else {
            setFormData({
                title: '',
                subject: '' as any,
                content: '',
                optionA: '',
                optionB: '',
                optionC: '',
                optionD: '',
                correctOption: '' as any,
                explanation: ''
            });
            setSelectedQuestion(null);
        }
        setShowModal(true);
    };

    const handleSaveQuestion = () => {
        if (!formData.subject || !formData.content || !formData.optionA || !formData.optionB ||
            !formData.optionC || !formData.optionD || !formData.correctOption) {
            alert('Por favor, preencha todos os campos obrigatórios');
            return;
        }

        const questionData: Question = {
            id: selectedQuestion?.id || Math.random().toString(36).substr(2, 9),
            title: formData.title,
            subject: formData.subject,
            content: formData.content,
            optionA: formData.optionA,
            optionB: formData.optionB,
            optionC: formData.optionC,
            optionD: formData.optionD,
            correctOption: formData.correctOption,
            explanation: formData.explanation,
            createdBy: selectedQuestion?.createdBy || currentUser.id,
            createdByName: selectedQuestion?.createdByName || currentUser.name,
            createdAt: selectedQuestion?.createdAt || new Date().toISOString(),
            status: selectedQuestion?.status || 'Pendente',
            timesUsed: selectedQuestion?.timesUsed || 0
        };

        if (selectedQuestion) {
            updateQuestion(questionData);
        } else {
            addQuestion(questionData);
        }

        setShowModal(false);
        alert(selectedQuestion ? 'Questão atualizada!' : 'Questão enviada para aprovação!');
    };

    const handleDeleteQuestion = (id: string) => {
        if (confirm('Tem certeza que deseja excluir esta questão?')) {
            deleteQuestion(id);
        }
    };

    const handleReview = (action: 'Aprovada' | 'Rejeitada' | 'Em Revisão') => {
        if (!selectedQuestion || !reviewNotes.trim()) {
            alert('Por favor, adicione notas de revisão');
            return;
        }

        reviewQuestion(selectedQuestion.id, action, reviewNotes, currentUser.id);
        setShowReviewModal(false);
        setReviewNotes('');
        alert(`Questão ${action.toLowerCase()}!`);
    };

    const instructors = users.filter(u => u.role === UserRole.INSTRUTOR);

    const getStatusColor = (status: QuestionStatus) => {
        switch (status) {
            case 'Aprovada': return 'bg-green-100 text-green-800 border-green-200';
            case 'Rejeitada': return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        }
    };

    const getStatusIcon = (status: QuestionStatus) => {
        switch (status) {
            case 'Aprovada': return <CheckCircle size={14} className="mr-1" />;
            case 'Rejeitada': return <AlertCircle size={14} className="mr-1" />;
            default: return <Clock size={14} className="mr-1" />;
        }
    };

    return (
        <div className="p-6 max-w-7xl mx-auto animate-fade-in">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 animate-slide-down mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
                    <p className="text-gray-500 mt-1">Gerencie e revise as questões para as avaliações.</p>
                </div>
                <div className="flex gap-3">
                    {canManageApprovers && (
                        <button
                            onClick={() => setShowApproversModal(true)}
                            className="px-4 py-2 bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm font-medium"
                        >
                            Gerenciar Aprovadores
                        </button>
                    )}
                    {canCreate && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="btn-premium bg-primary-600 hover:bg-primary-700 text-white px-6 py-3 rounded-xl font-bold shadow-lg shadow-primary-200 flex items-center gap-2 transform hover:-translate-y-0.5 transition-all"
                        >
                            <Plus size={20} />
                            Nova Questão
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200 mb-8">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    <div className="col-span-2 relative">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Buscar</label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                            <input
                                type="text"
                                placeholder="Buscar por conteúdo ou assunto..."
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Status</label>
                        <div className="relative">
                            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <select
                                className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none"
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                            >
                                <option value="Todas">Todos os Status</option>
                                <option value="Pendente">Pendente</option>
                                <option value="Aprovada">Aprovada</option>
                                <option value="Rejeitada">Rejeitada</option>
                            </select>
                        </div>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assunto</label>
                        <select
                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                            value={subjectFilter}
                            onChange={e => setSubjectFilter(e.target.value)}
                        >
                            <option value="Todas">Todos os Assuntos</option>
                            {QUESTION_SUBJECTS.map(subject => (
                                <option key={subject} value={subject}>{subject}</option>
                            ))}
                        </select>
                    </div>
                </div>
            </div>

            {/* Questions List */}
            <div className="grid grid-cols-1 gap-6">
                {filteredQuestions.map(question => (
                    <div key={question.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-all duration-200 group">
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-3">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold flex items-center border ${getStatusColor(question.status)}`}>
                                    {getStatusIcon(question.status)}
                                    {question.status.toUpperCase()}
                                </span>
                                <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-medium border border-gray-200">
                                    {question.subject}
                                </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                {isApprover && question.status === 'Pendente' && (
                                    <button
                                        onClick={() => {
                                            setSelectedQuestion(question);
                                            setShowReviewModal(true);
                                        }}
                                        className="text-primary-600 hover:text-primary-800 p-2 hover:bg-primary-50 rounded-full transition-colors"
                                        title="Revisar Questão"
                                    >
                                        <CheckCircle size={20} />
                                    </button>
                                )}
                                {(canCreate && (question.createdBy === currentUser.id || currentUser.role === UserRole.GESTOR)) && (
                                    <>
                                        <button
                                            onClick={() => handleOpenModal(question)}
                                            className="text-gray-400 hover:text-blue-600 p-2 hover:bg-blue-50 rounded-full transition-colors"
                                            title="Editar"
                                        >
                                            <Edit2 size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDeleteQuestion(question.id)}
                                            className="text-gray-400 hover:text-red-600 p-2 hover:bg-red-50 rounded-full transition-colors"
                                            title="Excluir"
                                        >
                                            <Trash2 size={20} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        <h3 className="text-lg font-bold text-gray-900 mb-3 leading-snug">{question.content}</h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            <div className={`p-3 rounded-lg border ${question.correctOption === 'A' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                <span className={`font-bold mr-2 ${question.correctOption === 'A' ? 'text-green-700' : 'text-gray-500'}`}>A)</span>
                                <span className={question.correctOption === 'A' ? 'text-green-900 font-medium' : 'text-gray-600'}>{question.optionA}</span>
                            </div>
                            <div className={`p-3 rounded-lg border ${question.correctOption === 'B' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                <span className={`font-bold mr-2 ${question.correctOption === 'B' ? 'text-green-700' : 'text-gray-500'}`}>B)</span>
                                <span className={question.correctOption === 'B' ? 'text-green-900 font-medium' : 'text-gray-600'}>{question.optionB}</span>
                            </div>
                            <div className={`p-3 rounded-lg border ${question.correctOption === 'C' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                <span className={`font-bold mr-2 ${question.correctOption === 'C' ? 'text-green-700' : 'text-gray-500'}`}>C)</span>
                                <span className={question.correctOption === 'C' ? 'text-green-900 font-medium' : 'text-gray-600'}>{question.optionC}</span>
                            </div>
                            <div className={`p-3 rounded-lg border ${question.correctOption === 'D' ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-100'}`}>
                                <span className={`font-bold mr-2 ${question.correctOption === 'D' ? 'text-green-700' : 'text-gray-500'}`}>D)</span>
                                <span className={question.correctOption === 'D' ? 'text-green-900 font-medium' : 'text-gray-600'}>{question.optionD}</span>
                            </div>
                        </div>

                        <div className="flex justify-between items-center text-xs text-gray-500 mt-4 pt-4 border-t border-gray-100">
                            <div>
                                Criado por <span className="font-medium text-gray-700">{question.createdByName}</span> em {new Date(question.createdAt).toLocaleDateString()}
                            </div>
                            {question.explanation && (
                                <div className="flex items-center gap-1 text-primary-600 bg-primary-50 px-2 py-1 rounded">
                                    <AlertCircle size={12} />
                                    <span className="font-medium">Com explicação</span>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
                {filteredQuestions.length === 0 && (
                    <div className="text-center py-16 bg-white rounded-xl border-2 border-dashed border-gray-200">
                        <BookOpen size={48} className="mx-auto text-gray-300 mb-4" />
                        <p className="text-gray-500 font-medium text-lg">Nenhuma questão encontrada.</p>
                        <p className="text-gray-400">Tente ajustar os filtros ou crie uma nova questão.</p>
                    </div>
                )}
            </div>

            {/* Modal Nova/Editar Questão */}
            {showModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop backdrop-blur-sm bg-gray-900/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                {selectedQuestion ? <Edit2 size={20} className="text-primary-600" /> : <Plus size={20} className="text-primary-600" />}
                                {selectedQuestion ? 'Editar Questão' : 'Nova Questão'}
                            </h2>
                            <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-8 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Assunto</label>
                                    <select
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                        value={formData.subject}
                                        onChange={e => setFormData({ ...formData, subject: e.target.value as any })}
                                    >
                                        <option value="">Selecione um assunto...</option>
                                        {QUESTION_SUBJECTS.map(subject => (
                                            <option key={subject} value={subject}>{subject}</option>
                                        ))}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Título (Opcional)</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                        value={formData.title}
                                        onChange={e => setFormData({ ...formData, title: e.target.value })}
                                        placeholder="Ex: Questão sobre NR-10"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Enunciado da Questão</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-h-[100px]"
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Digite o texto da questão aqui..."
                                />
                            </div>

                            <div className="space-y-4 bg-gray-50 p-6 rounded-xl border border-gray-200">
                                <h3 className="text-sm font-bold text-gray-700 uppercase tracking-wider mb-2">Alternativas</h3>
                                {['A', 'B', 'C', 'D'].map((option) => (
                                    <div key={option} className="flex items-center gap-4">
                                        <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-lg ${formData.correctOption === option ? 'bg-green-500 text-white shadow-md' : 'bg-gray-200 text-gray-500'}`}>
                                            {option}
                                        </div>
                                        <input
                                            type="text"
                                            className={`flex-1 px-4 py-2.5 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${formData.correctOption === option ? 'bg-white border-green-300 ring-2 ring-green-100' : 'bg-white border-gray-200'}`}
                                            value={(formData as any)[`option${option}`]}
                                            onChange={e => setFormData({ ...formData, [`option${option}`]: e.target.value })}
                                            placeholder={`Opção ${option}`}
                                        />
                                        <button
                                            onClick={() => setFormData({ ...formData, correctOption: option as any })}
                                            className={`p-2 rounded-lg transition-colors ${formData.correctOption === option ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'}`}
                                            title="Marcar como correta"
                                        >
                                            <Check size={20} />
                                        </button>
                                    </div>
                                ))}
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Explicação / Feedback (Opcional)</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    value={formData.explanation}
                                    onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                    placeholder="Explique por que a resposta está correta..."
                                />
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-6 py-2.5 text-gray-600 font-medium hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveQuestion}
                                className="px-6 py-2.5 bg-primary-600 text-white font-bold rounded-lg hover:bg-primary-700 shadow-md transform hover:-translate-y-0.5 transition-all"
                            >
                                Salvar Questão
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Revisão */}
            {showReviewModal && selectedQuestion && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop backdrop-blur-sm bg-gray-900/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-xl font-bold text-gray-900">Revisar Questão</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="font-medium text-gray-900 mb-2">{selectedQuestion.content}</p>
                                <div className="text-sm text-gray-500">
                                    Resposta Correta: <span className="font-bold text-green-600">{selectedQuestion.correctOption}) {(selectedQuestion as any)[`option${selectedQuestion.correctOption}`]}</span>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Notas da Revisão</label>
                                <textarea
                                    className="w-full px-4 py-3 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    value={reviewNotes}
                                    onChange={e => setReviewNotes(e.target.value)}
                                    placeholder="Adicione observações sobre a aprovação ou rejeição..."
                                    rows={3}
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    onClick={() => handleReview('Rejeitada')}
                                    className="flex-1 py-3 bg-red-50 text-red-700 font-bold rounded-lg hover:bg-red-100 border border-red-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <X size={18} /> Rejeitar
                                </button>
                                <button
                                    onClick={() => handleReview('Aprovada')}
                                    className="flex-1 py-3 bg-green-50 text-green-700 font-bold rounded-lg hover:bg-green-100 border border-green-200 transition-colors flex items-center justify-center gap-2"
                                >
                                    <Check size={18} /> Aprovar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Aprovadores */}
            {showApproversModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-backdrop backdrop-blur-sm bg-gray-900/50">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-gray-50 rounded-t-2xl">
                            <h2 className="text-xl font-bold text-gray-900 flex items-center gap-2">
                                <Shield size={20} className="text-primary-600" />
                                Gerenciar Aprovadores
                            </h2>
                            <button onClick={() => setShowApproversModal(false)} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <span className="sr-only">Fechar</span>
                                <X size={24} />
                            </button>
                        </div>

                        <div className="p-6 space-y-6">
                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                                <div className="flex gap-3">
                                    <div className="p-2 bg-blue-100 rounded-lg h-fit">
                                        <Shield size={20} className="text-blue-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-blue-800 text-sm">Controle de Acesso</h3>
                                        <p className="text-xs text-blue-600 mt-1">
                                            Aprovadores podem revisar e validar questões submetidas por outros instrutores.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Adicionar Novo Aprovador</label>
                                <div className="relative">
                                    <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                    <select
                                        className="w-full pl-10 pr-4 py-2.5 bg-gray-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all appearance-none"
                                        onChange={e => {
                                            if (e.target.value) {
                                                const user = users.find(u => u.id === e.target.value);
                                                if (user) {
                                                    addApprover(user.id, user.name, currentUser.id);
                                                    e.target.value = '';
                                                }
                                            }
                                        }}
                                    >
                                        <option value="">Selecione um instrutor para adicionar...</option>
                                        {instructors.filter(i => !questionApprovers.some(a => a.userId === i.id && a.isActive)).map(instructor => (
                                            <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div>
                                <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Aprovadores Ativos</h3>
                                <div className="space-y-2 max-h-60 overflow-y-auto pr-1 custom-scrollbar">
                                    {questionApprovers.filter(a => a.isActive).length > 0 ? (
                                        questionApprovers.filter(a => a.isActive).map(approver => (
                                            <div key={approver.id} className="flex justify-between items-center p-3 bg-white border border-gray-100 rounded-xl hover:border-primary-100 hover:shadow-sm transition-all group">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                        {approver.userName.charAt(0)}
                                                    </div>
                                                    <span className="font-medium text-gray-900">{approver.userName}</span>
                                                </div>
                                                <button
                                                    onClick={() => { if (confirm('Remover aprovador?')) removeApprover(approver.id); }}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                                                    title="Remover acesso"
                                                >
                                                    <Trash2 size={18} />
                                                </button>
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                                            <User size={32} className="mx-auto text-gray-300 mb-2" />
                                            <p className="text-sm text-gray-500">Nenhum aprovador ativo no momento</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>

                        <div className="p-6 border-t border-gray-100 bg-gray-50 rounded-b-2xl flex justify-end">
                            <button
                                onClick={() => setShowApproversModal(false)}
                                className="px-6 py-2.5 bg-white border border-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-50 hover:border-gray-300 shadow-sm transition-all"
                            >
                                Fechar Gerenciamento
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
