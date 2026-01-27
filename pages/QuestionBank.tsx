import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { Question, QuestionStatus, QUESTION_SUBJECTS, UserRole } from '../types';
import { BookOpen, Plus, Check, X, Edit2, Trash2, Search, Filter, AlertCircle, CheckCircle, Clock, ChevronDown, ChevronUp, Shield, UserPlus, User, ChevronLeft, ChevronRight } from 'lucide-react';
import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter, inputClass, labelClass } from '../components/StandardModal';
import { formatDate } from '../utils/dateUtils';

export const QuestionBankPage: React.FC = () => {
    const { currentUser, questions, questionApprovers, addQuestion, updateQuestion, deleteQuestion, reviewQuestion, addApprover, removeApprover, users } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [showReviewModal, setShowReviewModal] = useState(false);
    const [showApproversModal, setShowApproversModal] = useState(false);
    const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<QuestionStatus | 'Todas'>('Todas');

    const [subjectFilter, setSubjectFilter] = useState<string>('Todas');
    const [activeTab, setActiveTab] = useState<'Aprovadas' | 'Pendentes' | 'Vencidas'>('Aprovadas');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

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

            // Tab Filtering
            const now = new Date();
            const matchesTab = activeTab === 'Aprovadas'
                ? q.status === 'Aprovada' && (!q.validUntil || new Date(q.validUntil) > now)
                : activeTab === 'Vencidas'
                    ? q.status === 'Aprovada' && q.validUntil && new Date(q.validUntil) <= now
                    : ['Pendente', 'Rejeitada', 'Em Revisão'].includes(q.status);

            // Mostrar apenas questões aprovadas para não-aprovadores, ou todas para aprovadores
            const canView = ((q.status === 'Aprovada' || q.createdBy === currentUser.id || isApprover) && matchesTab);

            return matchesSearch && matchesStatus && matchesSubject && canView;
        });
    }, [questions, searchTerm, statusFilter, subjectFilter, currentUser.id, isApprover, activeTab]);

    const totalPages = Math.ceil(filteredQuestions.length / ITEMS_PER_PAGE);
    const paginatedQuestions = filteredQuestions.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

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
            id: selectedQuestion?.id || crypto.randomUUID(),
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
    };

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
        <div className="space-y-6 animate-fade-in">

            {/* Header Actions & Tabs */}
            <div className="flex flex-col gap-6">
                <div className="flex justify-between items-center">
                    {/* Tabs */}
                    <div className="flex gap-4 border-b-2 border-transparent">
                        <button
                            onClick={() => setActiveTab('Aprovadas')}
                            className={`pb-2 px-1 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'Aprovadas' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            APROVADAS
                        </button>
                        <button
                            onClick={() => setActiveTab('Pendentes')}
                            className={`pb-2 px-1 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'Pendentes' ? 'text-primary-600 border-b-2 border-primary-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            PENDENTES
                        </button>
                        <button
                            onClick={() => setActiveTab('Vencidas')}
                            className={`pb-2 px-1 text-sm font-bold uppercase tracking-wider transition-all relative ${activeTab === 'Vencidas' ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-400 hover:text-gray-600'}`}
                        >
                            VENCIDAS
                        </button>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                        {canManageApprovers && (
                            <button
                                onClick={() => setShowApproversModal(true)}
                                className="btn-base bg-blue-600 text-white hover:bg-blue-700 px-4 py-2 text-xs font-bold shadow-lg shadow-blue-200"
                            >
                                GERENCIAR APROVADORES
                            </button>
                        )}
                        {canCreate && (
                            <button
                                onClick={() => handleOpenModal()}
                                className="btn-base btn-insert flex items-center justify-center px-8 py-2 text-xs font-bold"
                            >
                                INSERIR
                            </button>
                        )}
                    </div>
                </div>

                {/* Filters */}
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        <div className="relative flex-1 min-w-[300px]">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                placeholder="BUSCAR POR CONTEÚDO..."
                                className={`${inputClass} pl-10 uppercase`}
                                value={searchTerm}
                                onChange={e => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="w-full md:w-48">
                            <select
                                className={inputClass}
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value as any)}
                            >
                                <option value="Todas">TODOS OS STATUS</option>
                                <option value="Pendente">PENDENTE</option>
                                <option value="Aprovada">APROVADA</option>
                                <option value="Rejeitada">REJEITADA</option>
                            </select>
                        </div>
                        <div className="w-full md:w-64">
                            <select
                                className={inputClass}
                                value={subjectFilter}
                                onChange={e => setSubjectFilter(e.target.value)}
                            >
                                <option value="Todas">TODOS OS ASSUNTOS</option>
                                {QUESTION_SUBJECTS.map(subject => (
                                    <option key={subject} value={subject}>{subject}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>
            </div>

            {/* Questions Table */}
            <div className="card-premium overflow-hidden animate-slide-up">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        <thead className="bg-white text-gray-700">
                            <tr>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap w-32">Status</th>
                                <th className="px-3 py-3 text-left text-xs font-bold uppercase border border-gray-200 whitespace-nowrap w-48">Assunto</th>
                                <th className="px-3 py-3 text-left text-xs font-bold uppercase border border-gray-200">Enunciado</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 w-48">Autor</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 w-32">Validade</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 w-24">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedQuestions.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 border border-gray-200">
                                        Nenhuma questão encontrada para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                paginatedQuestions.map((question) => (
                                    <tr key={question.id} className="hover:bg-gray-50 transition-colors">
                                        <td className="px-3 py-2 text-center border border-gray-200">
                                            <span className={`px-2 py-1 rounded-full text-[10px] font-bold inline-flex items-center justify-center border ${getStatusColor(question.status)}`}>
                                                {getStatusIcon(question.status)}
                                                {question.status.toUpperCase()}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-left text-xs font-medium text-gray-700 border border-gray-200 whitespace-nowrap">
                                            {question.subject}
                                        </td>
                                        <td className="px-3 py-2 text-left text-xs text-gray-900 border border-gray-200">
                                            <div className="line-clamp-2" title={question.content}>
                                                {question.content}
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center text-xs text-gray-500 border border-gray-200 whitespace-nowrap">
                                            <div className="flex flex-col">
                                                <span className="font-bold text-gray-700 uppercase">{question.createdByName}</span>
                                                <span className="text-[10px]">{formatDate(question.createdAt)}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center text-xs text-gray-500 border border-gray-200 whitespace-nowrap">
                                            {question.validUntil ? formatDate(question.validUntil) : '-'}
                                        </td>
                                        <td className="px-3 py-2 text-center border border-gray-200 whitespace-nowrap">
                                            <div className="flex justify-center gap-2">
                                                {isApprover && question.status === 'Pendente' && (
                                                    <button
                                                        onClick={() => {
                                                            setSelectedQuestion(question);
                                                            setShowReviewModal(true);
                                                        }}
                                                        className="btn-base btn-edit px-2 py-1 text-[10px]"
                                                        title="Revisar Questão"
                                                    >
                                                        REVISAR
                                                    </button>
                                                )}
                                                {(canCreate && (question.createdBy === currentUser.id || currentUser.role === UserRole.GESTOR)) && (
                                                    <>
                                                        <button
                                                            onClick={() => handleOpenModal(question)}
                                                            className="btn-base btn-edit px-2 py-1 text-[10px]"
                                                            title="Editar"
                                                        >
                                                            EDITAR
                                                        </button>
                                                        <button
                                                            onClick={() => handleDeleteQuestion(question.id)}
                                                            className="btn-base btn-delete px-2 py-1 text-[10px]"
                                                            title="Excluir"
                                                        >
                                                            EXCLUIR
                                                        </button>
                                                    </>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredQuestions.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Mostrando <span className="font-medium text-gray-700">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium text-gray-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredQuestions.length)}</span> de <span className="font-medium text-gray-700">{filteredQuestions.length}</span> resultados
                        </span>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                disabled={currentPage === 1}
                                className={`btn-base btn-pagination px-4 py-2 text-xs ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                ANTERIOR
                            </button>
                            <button
                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                disabled={currentPage === totalPages}
                                className={`btn-base btn-pagination px-4 py-2 text-xs ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                            >
                                PRÓXIMO
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal Nova/Editar Questão */}
            <StandardModal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-2xl">
                <StandardModalHeader
                    title=""
                    onClose={() => setShowModal(false)}
                />
                <StandardModalBody>
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div>
                                <label className={labelClass}>Assunto</label>
                                <select
                                    className={inputClass}
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value as any })}
                                >
                                    <option value="">SELECIONE</option>
                                    {QUESTION_SUBJECTS.map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className={labelClass}>Título (Opcional)</label>
                                <input
                                    type="text"
                                    className={inputClass}
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="EX: QUESTÃO SOBRE NR-10"
                                />
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>Enunciado da Questão</label>
                            <textarea
                                className={`${inputClass} min-h-[100px]`}
                                value={formData.content}
                                onChange={e => setFormData({ ...formData, content: e.target.value })}
                                placeholder="DIGITE O TEXTO DA QUESTÃO AQUI..."
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
                                        className={`p-2 rounded-lg transition-colors uppercase font-bold text-xs ${formData.correctOption === option ? 'text-green-600 bg-green-50' : 'text-gray-400 hover:text-gray-600'}`}
                                        title="Marcar como correta"
                                    >
                                        {formData.correctOption === option ? 'CORRETA' : 'MARCAR'}
                                    </button>
                                </div>
                            ))}
                        </div>

                        <div>
                            <label className={labelClass}>Explicação / Feedback (Opcional)</label>
                            <textarea
                                className={inputClass}
                                value={formData.explanation}
                                onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                placeholder="EXPLIQUE POR QUE A RESPOSTA ESTÁ CORRETA..."
                            />
                        </div>
                    </div>
                </StandardModalBody>
                <StandardModalFooter>
                    <div className="flex justify-end gap-3 w-full">
                        <button
                            onClick={() => setShowModal(false)}
                            className="btn-base btn-cancel px-6 py-2.5 text-sm"
                        >
                            CANCELAR
                        </button>
                        <button
                            onClick={handleSaveQuestion}
                            className="btn-base btn-save px-6 py-2.5 text-sm"
                        >
                            SALVAR QUESTÃO
                        </button>
                    </div>
                </StandardModalFooter>
            </StandardModal>

            {/* Modal Revisão */}
            <StandardModal isOpen={showReviewModal && !!selectedQuestion} onClose={() => setShowReviewModal(false)} maxWidth="max-w-lg">
                <StandardModalHeader
                    title="REVISAR QUESTÃO"
                    onClose={() => setShowReviewModal(false)}
                />
                <StandardModalBody>
                    <div className="space-y-4">
                        {selectedQuestion && (
                            <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                <p className="font-medium text-gray-900 mb-2">{selectedQuestion.content}</p>
                                <div className="text-sm text-gray-500">
                                    Resposta Correta: <span className="font-bold text-green-600">{selectedQuestion.correctOption}) {(selectedQuestion as any)[`option${selectedQuestion.correctOption}`]}</span>
                                </div>
                            </div>
                        )}

                        <div>
                            <label className={labelClass}>Notas da Revisão</label>
                            <textarea
                                className={`${inputClass} min-h-[80px]`}
                                value={reviewNotes}
                                onChange={e => setReviewNotes(e.target.value)}
                                placeholder="ADICIONE OBSERVAÇÕES..."
                                rows={3}
                            />
                        </div>
                    </div>
                </StandardModalBody>
                <StandardModalFooter>
                    <div className="flex gap-3 w-full">
                        <button
                            onClick={() => handleReview('Rejeitada')}
                            className="flex-1 btn-base btn-delete px-4 py-3 text-sm"
                        >
                            REJEITAR
                        </button>
                        <button
                            onClick={() => handleReview('Aprovada')}
                            className="flex-1 btn-base btn-save px-4 py-3 text-sm"
                        >
                            APROVAR
                        </button>
                    </div>
                </StandardModalFooter>
            </StandardModal>

            {/* Modal Aprovadores */}
            <StandardModal isOpen={showApproversModal} onClose={() => setShowApproversModal(false)} maxWidth="max-w-lg">
                <StandardModalHeader
                    title=""
                    onClose={() => setShowApproversModal(false)}
                />
                <StandardModalBody>
                    <div className="space-y-6">
                        <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                            <div className="flex gap-3">
                                <div className="p-2 bg-blue-100 rounded-lg h-fit">
                                    <Shield size={20} className="text-blue-600" />
                                </div>
                                <div>
                                    <h3 className="font-bold text-blue-800 text-sm">CONTROLE DE ACESSO</h3>
                                    <p className="text-xs text-blue-600 mt-1 uppercase">
                                        APROVADORES PODEM REVISAR E VALIDAR QUESTÕES SUBMETIDAS POR OUTROS INSTRUTORES.
                                    </p>
                                </div>
                            </div>
                        </div>

                        <div>
                            <label className={labelClass}>ADICIONAR NOVO APROVADOR</label>
                            <div className="relative">
                                <UserPlus className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <select
                                    className={`${inputClass} pl-10`}
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
                                    <option value="">SELECIONE</option>
                                    {users
                                        .filter(u =>
                                            (u.role === UserRole.INSTRUTOR ||
                                                u.role === UserRole.AUXILIAR_INSTRUCAO ||
                                                u.role === UserRole.COORDENADOR ||
                                                u.role === UserRole.GESTOR) &&
                                            !questionApprovers.some(a => a.userId === u.id && a.isActive)
                                        )
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(user => (
                                            <option key={user.id} value={user.id}>{user.name} ({user.role})</option>
                                        ))}
                                </select>
                            </div>
                        </div>

                        <div className="border border-gray-200 rounded-xl overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h3 className="text-xs font-bold text-gray-700 uppercase tracking-wider">APROVADORES ATIVOS</h3>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-60 overflow-y-auto">
                                {questionApprovers.filter(a => a.isActive).length > 0 ? (
                                    questionApprovers.filter(a => a.isActive).map(approver => (
                                        <div key={approver.id} className="flex justify-between items-center p-3 bg-white hover:bg-gray-50 transition-colors group">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-primary-100 flex items-center justify-center text-primary-700 font-bold text-xs">
                                                    {approver.userName.charAt(0)}
                                                </div>
                                                <span className="font-medium text-gray-900 text-sm uppercase">{approver.userName}</span>
                                            </div>
                                            <button
                                                onClick={() => { if (confirm('Remover aprovador?')) removeApprover(approver.id); }}
                                                className="text-gray-400 hover:text-red-600 p-1 rounded transition-colors opacity-0 group-hover:opacity-100"
                                                title="Remover acesso"
                                            >
                                                <X size={16} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-8 text-center bg-white">
                                        <User size={32} className="mx-auto text-gray-300 mb-2" />
                                        <p className="text-xs text-gray-500 uppercase">NENHUM APROVADOR ATIVO</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </StandardModalBody>
                <StandardModalFooter>
                    <div className="flex justify-end w-full">
                        <button
                            onClick={() => setShowApproversModal(false)}
                            className="btn-base btn-primary px-6 py-2.5 text-sm"
                        >
                            FECHAR
                        </button>
                    </div>
                </StandardModalFooter>
            </StandardModal>
        </div >
    );
};
