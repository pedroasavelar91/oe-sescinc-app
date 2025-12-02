import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { Question, QuestionStatus, QUESTION_SUBJECTS, UserRole } from '../types';
import { BookOpen, Plus, Check, X, Edit2, Trash2, Search, Filter } from 'lucide-react';

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

    return (
        <div className="p-8">
            {/* Header */}
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Banco de Questões</h1>
                    <p className="text-gray-500 mt-1">Gerencie questões para avaliações</p>
                </div>
                <div className="flex gap-2">
                    {canManageApprovers && (
                        <button
                            onClick={() => setShowApproversModal(true)}
                            className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        >
                            <Filter size={18} /> <span>Aprovadores</span>
                        </button>
                    )}
                    {canCreate && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-4 py-2 rounded-lg shadow-md transition"
                        >
                            <Plus size={18} /> <span>Nova Questão</span>
                        </button>
                    )}
                </div>
            </div>

            {/* Filters */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Buscar</label>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por conteúdo ou matéria..."
                            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={statusFilter}
                        onChange={e => setStatusFilter(e.target.value as any)}
                    >
                        <option value="Todas">Todas</option>
                        <option value="Pendente">Pendente</option>
                        <option value="Aprovada">Aprovada</option>
                        <option value="Rejeitada">Rejeitada</option>
                        <option value="Em Revisão">Em Revisão</option>
                    </select>
                </div>
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Matéria</label>
                    <select
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                        value={subjectFilter}
                        onChange={e => setSubjectFilter(e.target.value)}
                    >
                        <option value="Todas">Todas</option>
                        {QUESTION_SUBJECTS.map(subject => (
                            <option key={subject} value={subject}>{subject}</option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Questions List */}
            <div className="grid grid-cols-1 gap-4">
                {filteredQuestions.length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <BookOpen className="mx-auto text-gray-400 mb-4" size={48} />
                        <p className="text-gray-500">Nenhuma questão encontrada</p>
                    </div>
                ) : (
                    filteredQuestions.map(question => (
                        <div key={question.id} className="bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition">
                            <div className="flex justify-between items-start mb-4">
                                <div className="flex-1">
                                    <div className="flex items-center gap-2 mb-2">
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${question.status === 'Aprovada' ? 'bg-green-100 text-green-800' :
                                            question.status === 'Pendente' ? 'bg-yellow-100 text-yellow-800' :
                                                question.status === 'Rejeitada' ? 'bg-red-100 text-red-800' :
                                                    'bg-blue-100 text-blue-800'
                                            }`}>
                                            {question.status}
                                        </span>
                                        <span className="text-sm text-gray-500">{question.subject}</span>
                                    </div>
                                    {question.title && <h3 className="font-semibold text-gray-900 mb-2">{question.title}</h3>}
                                    <p className="text-gray-700 mb-3">{question.content}</p>
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className={`p-2 rounded ${question.correctOption === 'A' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                            <span className="font-medium">A)</span> {question.optionA}
                                        </div>
                                        <div className={`p-2 rounded ${question.correctOption === 'B' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                            <span className="font-medium">B)</span> {question.optionB}
                                        </div>
                                        <div className={`p-2 rounded ${question.correctOption === 'C' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                            <span className="font-medium">C)</span> {question.optionC}
                                        </div>
                                        <div className={`p-2 rounded ${question.correctOption === 'D' ? 'bg-green-50 border border-green-200' : 'bg-gray-50'}`}>
                                            <span className="font-medium">D)</span> {question.optionD}
                                        </div>
                                    </div>
                                    <div className="mt-3 text-xs text-gray-500">
                                        Criada por {question.createdByName} em {new Date(question.createdAt).toLocaleDateString()}
                                    </div>
                                </div>
                                <div className="flex gap-2 ml-4">
                                    {isApprover && question.status === 'Pendente' && (
                                        <button
                                            onClick={() => { setSelectedQuestion(question); setShowReviewModal(true); }}
                                            className="text-blue-600 hover:text-blue-800 transition-colors"
                                            title="Revisar"
                                        >
                                            <Check size={20} />
                                        </button>
                                    )}
                                    {question.createdBy === currentUser.id && question.status === 'Pendente' && (
                                        <>
                                            <button
                                                onClick={() => handleOpenModal(question)}
                                                className="text-gray-600 hover:text-gray-800 transition-colors"
                                                title="Editar"
                                            >
                                                <Edit2 size={20} />
                                            </button>
                                            <button
                                                onClick={() => { if (confirm('Excluir questão?')) deleteQuestion(question.id); }}
                                                className="text-red-600 hover:text-red-800 transition-colors"
                                                title="Excluir"
                                            >
                                                <Trash2 size={20} />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))
                )}
            </div>

            {/* Modal Nova/Editar Questão */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop">
                    <div className="bg-white rounded-xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">
                                {selectedQuestion ? 'Editar Questão' : 'Nova Questão'}
                            </h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Título (opcional)</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={formData.title}
                                    onChange={e => setFormData({ ...formData, title: e.target.value })}
                                    placeholder="Título para referência interna"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Matéria *</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    value={formData.subject}
                                    onChange={e => setFormData({ ...formData, subject: e.target.value as any })}
                                >
                                    <option value="">Selecione uma matéria...</option>
                                    {QUESTION_SUBJECTS.map(subject => (
                                        <option key={subject} value={subject}>{subject}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Enunciado *</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    rows={4}
                                    value={formData.content}
                                    onChange={e => setFormData({ ...formData, content: e.target.value })}
                                    placeholder="Digite o enunciado da questão..."
                                />
                            </div>
                            <div className="space-y-3">
                                <label className="block text-sm font-medium text-gray-700">Alternativas *</label>
                                {(['A', 'B', 'C', 'D'] as const).map(option => (
                                    <div key={option} className="flex items-center gap-3">
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={formData.correctOption === option}
                                            onChange={() => setFormData({ ...formData, correctOption: option })}
                                            className="w-4 h-4 text-primary-600"
                                        />
                                        <span className="font-medium text-gray-700 w-8">{option})</span>
                                        <input
                                            type="text"
                                            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                            value={formData[`option${option}` as keyof typeof formData] as string}
                                            onChange={e => setFormData({ ...formData, [`option${option}`]: e.target.value })}
                                            placeholder={`Alternativa ${option}`}
                                        />
                                    </div>
                                ))}
                                <p className="text-xs text-gray-500">Marque o círculo da alternativa correta</p>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Explicação (opcional)</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    rows={3}
                                    value={formData.explanation}
                                    onChange={e => setFormData({ ...formData, explanation: e.target.value })}
                                    placeholder="Explicação da resposta correta..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveQuestion}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                            >
                                Salvar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Revisão */}
            {showReviewModal && selectedQuestion && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop">
                    <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full animate-scale-in">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Revisar Questão</h2>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <p className="font-medium text-gray-900 mb-2">{selectedQuestion.content}</p>
                                <div className="text-sm text-gray-600">
                                    <p>Resposta correta: <span className="font-medium">{selectedQuestion.correctOption}</span></p>
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Notas de Revisão *</label>
                                <textarea
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                                    rows={4}
                                    value={reviewNotes}
                                    onChange={e => setReviewNotes(e.target.value)}
                                    placeholder="Adicione suas observações..."
                                />
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end gap-3">
                            <button
                                onClick={() => setShowReviewModal(false)}
                                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={() => handleReview('Rejeitada')}
                                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition"
                            >
                                Rejeitar
                            </button>
                            <button
                                onClick={() => handleReview('Em Revisão')}
                                className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 transition"
                            >
                                Solicitar Revisão
                            </button>
                            <button
                                onClick={() => handleReview('Aprovada')}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                            >
                                Aprovar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Modal Aprovadores */}
            {showApproversModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full">
                        <div className="p-6 border-b border-gray-200">
                            <h2 className="text-2xl font-bold text-gray-900">Gerenciar Aprovadores</h2>
                        </div>
                        <div className="p-6">
                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-2">Adicionar Aprovador</label>
                                <select
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                                    <option value="">Selecione um instrutor...</option>
                                    {instructors.filter(i => !questionApprovers.some(a => a.userId === i.id && a.isActive)).map(instructor => (
                                        <option key={instructor.id} value={instructor.id}>{instructor.name}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-medium text-gray-900">Aprovadores Ativos</h3>
                                {questionApprovers.filter(a => a.isActive).map(approver => (
                                    <div key={approver.id} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                                        <span>{approver.userName}</span>
                                        <button
                                            onClick={() => { if (confirm('Remover aprovador?')) removeApprover(approver.id); }}
                                            className="text-red-600 hover:text-red-800"
                                        >
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                                {questionApprovers.filter(a => a.isActive).length === 0 && (
                                    <p className="text-gray-500 text-sm">Nenhum aprovador ativo</p>
                                )}
                            </div>
                        </div>
                        <div className="p-6 border-t border-gray-200 flex justify-end">
                            <button
                                onClick={() => setShowApproversModal(false)}
                                className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition"
                            >
                                Fechar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
