import React, { useState, useEffect } from 'react';
import { useStore } from '../context/AppStore';
import { Course, Subject, CourseType, UserRole } from '../types';
import { Plus, Trash2, Pencil, X, Save, ChevronDown, ChevronUp, Copy, ArrowUp, ArrowDown } from 'lucide-react';

export const CoursesPage: React.FC = () => {
    const { courses, addCourse, updateCourse, deleteCourse, currentUser } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [expandedCourseId, setExpandedCourseId] = useState<string | null>(null);
    const [deletionTarget, setDeletionTarget] = useState<{ id: string, type: 'course' | 'subject', name?: string, subject?: Subject } | null>(null);

    const canEdit = currentUser?.role === UserRole.GESTOR || currentUser?.role === UserRole.COORDENADOR;

    const [courseForm, setCourseForm] = useState<Partial<Course>>({
        name: '',
        type: CourseType.CBA_2,
        subjects: []
    });

    const [customName, setCustomName] = useState('');

    const [tempSubject, setTempSubject] = useState<{
        module: string;
        name: string;
        hours: number;
        modality: 'Teórica' | 'Prática';
    }>({
        module: '',
        name: '',
        hours: 4,
        modality: 'Teórica'
    });

    // Scroll to top when modal opens to ensure it's centered
    useEffect(() => {
        if (isCreating) {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [isCreating]);

    const handleAddSubject = () => {
        if (!tempSubject.name) return;

        const sub: Subject = {
            id: Math.random().toString(36).substr(2, 5),
            module: tempSubject.module || 'Geral',
            name: tempSubject.name,
            hours: tempSubject.hours || 4,
            modality: tempSubject.modality
        };
        setCourseForm({
            ...courseForm,
            subjects: [...(courseForm.subjects || []), sub]
        });
        setTempSubject({ module: '', name: '', hours: 4, modality: 'Teórica' });
    };

    const handleRemoveSubject = (id: string) => {
        const subject = courseForm.subjects?.find(s => s.id === id);
        if (subject) {
            setDeletionTarget({ id, type: 'subject', name: subject.name, subject });
        }
    };

    const confirmRemoveSubject = () => {
        if (!deletionTarget || deletionTarget.type !== 'subject') return;

        setCourseForm({
            ...courseForm,
            subjects: courseForm.subjects?.filter(s => s.id !== deletionTarget.id)
        });
        if (editingSubjectId === deletionTarget.id) {
            setEditingSubjectId(null);
        }
        setDeletionTarget(null);
    };

    const moveSubject = (index: number, direction: 'up' | 'down') => {
        if (!courseForm.subjects) return;
        const newSubjects = [...courseForm.subjects];

        if (direction === 'up') {
            if (index === 0) return;
            const temp = newSubjects[index];
            newSubjects[index] = newSubjects[index - 1];
            newSubjects[index - 1] = temp;
        } else {
            if (index === newSubjects.length - 1) return;
            const temp = newSubjects[index];
            newSubjects[index] = newSubjects[index + 1];
            newSubjects[index + 1] = temp;
        }
        setCourseForm({ ...courseForm, subjects: newSubjects });
    };

    const handleEditSubject = (subject: Subject) => {
        setTempSubject({
            module: subject.module,
            name: subject.name,
            hours: subject.hours,
            modality: subject.modality
        });
        setEditingSubjectId(subject.id);
    };

    const handleUpdateSubject = () => {
        if (!editingSubjectId || !tempSubject.name) return;

        setCourseForm({
            ...courseForm,
            subjects: courseForm.subjects?.map(s =>
                s.id === editingSubjectId
                    ? { ...s, module: tempSubject.module || 'Geral', name: tempSubject.name, hours: tempSubject.hours || 4, modality: tempSubject.modality }
                    : s
            )
        });
        setTempSubject({ module: '', name: '', hours: 4, modality: 'Teórica' });
        setEditingSubjectId(null);
    };

    const toggleCourseExpansion = (courseId: string) => {
        setExpandedCourseId(prev => prev === courseId ? null : courseId);
    };

    const handleSaveCourse = () => {
        let finalCourseName = courseForm.type as string;

        if (courseForm.type === CourseType.CUSTOM) {
            if (!customName) return alert("Por favor, digite o nome do curso.");
            finalCourseName = customName;
        }

        const courseData: Course = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            name: finalCourseName,
            type: courseForm.type as CourseType,
            subjects: courseForm.subjects || []
        };

        if (editingId) {
            updateCourse(courseData);
        } else {
            addCourse(courseData);
        }

        resetForm();
    };

    const handleEditClick = (course: Course) => {
        setEditingId(course.id);
        setIsCreating(true);

        // Check if it's a custom name (not matching the enum value exactly)
        const isCustom = !Object.values(CourseType).includes(course.type as CourseType) || course.type === CourseType.CUSTOM;

        setCourseForm({
            name: course.name,
            type: course.type,
            subjects: course.subjects
        });

        if (course.type === CourseType.CUSTOM) {
            setCustomName(course.name);
        } else {
            setCustomName('');
        }
    };

    const handleDeleteClick = (id: string) => {
        const course = courses.find(c => c.id === id);
        if (course) {
            setDeletionTarget({ id, type: 'course', name: course.name });
        }
    };

    const confirmDeleteCourse = () => {
        if (!deletionTarget || deletionTarget.type !== 'course') return;
        deleteCourse(deletionTarget.id);
        setDeletionTarget(null);
    };

    const handleCopyClick = (course: Course) => {
        if (!window.confirm(`Deseja criar uma cópia do curso "${course.name}"?`)) return;

        const newCourse: Course = {
            ...course,
            id: Math.random().toString(36).substr(2, 9),
            name: `${course.name} (Cópia)`,
            subjects: course.subjects.map(s => ({ ...s, id: Math.random().toString(36).substr(2, 5) }))
        };

        addCourse(newCourse);
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setCourseForm({ name: '', type: CourseType.CBA_2, subjects: [] });
        setCustomName('');
        setTempSubject({ module: '', name: '', hours: 4, modality: 'Teórica' });
    };

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900 uppercase";

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center animate-slide-down">
                    <div>
                    </div>
                    {!isCreating && canEdit && (
                        <button
                            onClick={() => setIsCreating(true)}
                            className="btn-base btn-insert px-6 py-3"
                        >
                            INSERIR
                        </button>
                    )}
                </div>

            </div>

            {isCreating && (
                <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={resetForm} />
                    <div className="bg-white w-full max-w-[95%] max-h-[90vh] overflow-y-auto relative z-10" style={{ border: '1px solid #E5E7EB', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)' }}>
                        <div className="p-6 flex justify-between items-center sticky top-0 bg-white z-10" style={{ borderBottom: '2px solid #FF6B35' }}>
                            <div></div>
                            <button onClick={resetForm} className="btn-base btn-delete px-4 py-2 text-xs">
                                FECHAR
                            </button>
                        </div>

                        <div className="p-6">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                                <div>
                                    <label className="block text-xs font-bold login-uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>CURSO</label>
                                    <select
                                        className={inputClass}
                                        value={courseForm.type}
                                        onChange={e => setCourseForm({ ...courseForm, type: e.target.value as CourseType })}
                                    >
                                        {Object.values(CourseType).map(t => <option key={t} value={t}>{t.toUpperCase()}</option>)}
                                    </select>
                                </div>

                                {courseForm.type === CourseType.CUSTOM && (
                                    <div>
                                        <label className="block text-xs font-bold login-uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>NOME DO CURSO PERSONALIZADO</label>
                                        <input
                                            placeholder="DIGITE O NOME DO CURSO..."
                                            className={inputClass}
                                            value={customName}
                                            onChange={e => setCustomName(e.target.value.toUpperCase())}
                                        />
                                    </div>
                                )}
                            </div>

                            <div className="p-4 mb-4" style={{ backgroundColor: '#FFFFFF', border: '1px solid #E5E7EB' }}>
                                <h4 className="text-sm font-bold login-uppercase mb-3 flex items-center" style={{ color: '#1F2937' }}>
                                    <Plus size={16} className="mr-1" style={{ color: '#FF6B35' }} /> ADICIONAR MATÉRIAS
                                </h4>

                                {/* Subject Input Row: Module -> Name -> Hours -> Modality */}
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold login-uppercase tracking-wider" style={{ color: '#6B7280' }}>MÓDULO</label>
                                        <input
                                            placeholder="EX: MÓDULO 1"
                                            className={`${inputClass} uppercase`}
                                            value={tempSubject.module}
                                            onChange={e => setTempSubject({ ...tempSubject, module: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="md:col-span-4">
                                        <label className="text-xs font-bold login-uppercase tracking-wider" style={{ color: '#6B7280' }}>MATÉRIA</label>
                                        <input
                                            placeholder="NOME DA MATÉRIA"
                                            className={`${inputClass} uppercase`}
                                            value={tempSubject.name}
                                            onChange={e => setTempSubject({ ...tempSubject, name: e.target.value.toUpperCase() })}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold login-uppercase tracking-wider" style={{ color: '#6B7280' }}>CARGA HORÁRIA</label>
                                        <input
                                            type="number"
                                            className={inputClass}
                                            value={tempSubject.hours || ''}
                                            onChange={e => {
                                                const val = parseInt(e.target.value);
                                                setTempSubject({ ...tempSubject, hours: isNaN(val) ? 0 : val });
                                            }}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <label className="text-xs font-bold login-uppercase tracking-wider" style={{ color: '#6B7280' }}>MODALIDADE</label>
                                        <select
                                            className={inputClass}
                                            value={tempSubject.modality}
                                            onChange={e => setTempSubject({ ...tempSubject, modality: e.target.value as any })}
                                        >
                                            <option value="Teórica">TEÓRICA</option>
                                            <option value="Prática">PRÁTICA</option>
                                        </select>
                                    </div>
                                    <div className="md:col-span-2">
                                        <button
                                            onClick={editingSubjectId ? handleUpdateSubject : handleAddSubject}
                                            className={`btn-base w-full flex justify-center items-center text-white h-[42px] font-bold text-xs !px-1 ${editingSubjectId ? 'btn-edit' : 'btn-insert'
                                                }`}
                                            title={editingSubjectId ? "Atualizar Matéria" : "Adicionar Matéria"}
                                        >
                                            {editingSubjectId ? 'EDITAR' : 'ADICIONAR'}
                                        </button>
                                    </div>
                                </div>


                                {/* List of Subjects with Scrollbar */}
                                <div className="mt-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-200 login-uppercase">
                                        MATÉRIAS CADASTRADAS ({courseForm.subjects?.length || 0})
                                    </h4>
                                    <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                        {courseForm.subjects?.length === 0 && (
                                            <p className="text-sm text-gray-500 italic text-center py-2 uppercase">Nenhuma matéria adicionada ainda.</p>
                                        )}
                                        {courseForm.subjects?.map((sub, index) => (
                                            <div key={sub.id || index} className="flex justify-between items-center text-sm bg-white p-3 border rounded shadow-sm hover:shadow-md transition-shadow">
                                                <div className="flex flex-col mr-3 justify-center">
                                                    <button
                                                        onClick={() => moveSubject(index, 'up')}
                                                        disabled={index === 0}
                                                        className={`text-orange-500 p-0.5 transition-transform hover:scale-110 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-orange-700'}`}
                                                        title="Mover para cima"
                                                    >
                                                        <ArrowUp size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => moveSubject(index, 'down')}
                                                        disabled={index === (courseForm.subjects?.length || 0) - 1}
                                                        className={`text-orange-500 p-0.5 transition-transform hover:scale-110 ${index === (courseForm.subjects?.length || 0) - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-orange-700'}`}
                                                        title="Mover para baixo"
                                                    >
                                                        <ArrowDown size={16} />
                                                    </button>
                                                </div>
                                                <div className="flex-1 flex flex-row items-center gap-2">
                                                    <span className="text-xs text-gray-500 font-bold whitespace-nowrap uppercase">{sub.module}</span>
                                                    <span className="font-semibold text-gray-900 uppercase">{sub.name}</span>
                                                </div>
                                                <div className="flex items-center space-x-2">
                                                    <span className={`px-2 py-0.5 rounded text-xs uppercase font-bold ${sub.modality === 'Teórica' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                        {sub.modality}
                                                    </span>
                                                    <span className="font-bold text-gray-600 w-12 text-right">{sub.hours}h</span>
                                                    <button
                                                        onClick={() => handleEditSubject(sub)}
                                                        className="btn-base btn-edit px-2 py-1 text-xs"
                                                        title="Editar Matéria"
                                                    >
                                                        EDITAR
                                                    </button>
                                                    <button
                                                        onClick={() => handleRemoveSubject(sub.id)}
                                                        className="btn-base btn-delete px-2 py-1 text-xs"
                                                        title="Remover Matéria"
                                                    >
                                                        EXCLUIR
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="flex justify-end space-x-3 pt-2">
                                <button onClick={resetForm} className="btn-base btn-delete px-6 py-2.5 text-xs">
                                    CANCELAR
                                </button>
                                <button onClick={handleSaveCourse} className="btn-base btn-save px-6 py-2.5">
                                    SALVAR
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            <div className="mt-6 space-y-6 animate-fade-in">
                <div className="grid grid-cols-1 gap-6">
                    {courses.map(course => (
                        <div key={course.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group" style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #FF6B35' }}>
                            <div className="bg-white px-6 py-5 flex justify-between items-center transition-colors" style={{ borderBottom: '1px solid #E5E7EB' }}>
                                <div className="flex items-center space-x-3">
                                    <button
                                        onClick={() => toggleCourseExpansion(course.id)}
                                        className="p-1 transition-colors text-orange-500 hover:text-orange-700"
                                        title={expandedCourseId === course.id ? "Recolher" : "Expandir"}
                                    >
                                        {expandedCourseId === course.id ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                                    </button>
                                    <div>
                                        <h3 className="text-lg font-bold login-uppercase" style={{ color: '#1F2937' }}>{course.name}</h3>

                                    </div>
                                </div>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm font-medium text-gray-600 uppercase">
                                        TOTAL: {course.subjects.reduce((acc, s) => acc + s.hours, 0)} HORAS | {course.subjects.length} MATÉRIAS
                                    </span>
                                    <div className="flex space-x-2 pl-4 border-l border-gray-300">
                                        {canEdit && (
                                            <>
                                                <button
                                                    onClick={() => handleCopyClick(course)}
                                                    className="btn-base btn-save px-3 py-2 text-xs"
                                                    title="Copiar Curso"
                                                >
                                                    COPIAR
                                                </button>
                                                <button
                                                    onClick={() => handleEditClick(course)}
                                                    className="btn-base btn-edit px-3 py-2 text-xs"
                                                    title="Editar Curso"
                                                >
                                                    EDITAR
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(course.id)}
                                                    className="btn-base btn-delete px-3 py-2 text-xs"
                                                    title="Excluir Curso"
                                                >
                                                    EXCLUIR
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                            {expandedCourseId === course.id && (
                                <div className="p-6">
                                    <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Grade Curricular</h4>
                                    {course.subjects.length > 0 ? (
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                            {course.subjects.map(sub => (
                                                <div key={sub.id} className={`p-6 rounded-xl border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 bg-white relative overflow-hidden group/card h-full uppercase`}>
                                                    <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${sub.modality === 'Teórica' ? 'bg-blue-600' : 'bg-orange-500'}`}></div>
                                                    <div className="pl-3 flex flex-col h-full">
                                                        <div className="flex justify-between items-start mb-3">
                                                            <span className="text-xs font-extra-bold tracking-wider text-gray-500">{sub.module}</span>
                                                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${sub.modality === 'Teórica' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                                                {sub.modality}
                                                            </span>
                                                        </div>
                                                        <h5 className="font-extrabold text-gray-800 text-base mb-4 flex-grow leading-relaxed">{sub.name}</h5>
                                                        <div className="flex items-center text-sm text-gray-600 font-bold mt-auto pt-4 border-t border-gray-100">
                                                            <span className="bg-gray-50 px-3 py-1.5 rounded-lg border border-gray-200">{sub.hours} HORAS</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    ) : (
                                        <p className="text-sm text-gray-400 italic">Nenhuma matéria cadastrada.</p>
                                    )}
                                </div>
                            )}
                        </div>
                    ))
                    }
                </div >
            </div>

            {deletionTarget && (
                <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 11000 }}>
                    <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={() => setDeletionTarget(null)} />
                    <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-10 text-center animate-scale-in" style={{ border: '1px solid #E5E7EB' }}>
                        <div className="mb-4">
                            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Trash2 size={32} className="text-red-500" />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 mb-2 uppercase">Confirmar Exclusão</h3>
                            <p className="text-gray-600 uppercase">
                                Tem certeza que deseja excluir {deletionTarget.type === 'course' ? 'o curso' : 'a matéria'} <span className="font-bold">"{deletionTarget.name}"</span>?
                            </p>
                            <p className="text-xs text-gray-500 mt-2 uppercase">Esta ação não pode ser desfeita.</p>
                        </div>
                        <div className="flex justify-center space-x-3">
                            <button
                                onClick={() => setDeletionTarget(null)}
                                className="btn-base btn-delete px-6 py-2 text-sm w-32"
                            >
                                NÃO
                            </button>
                            <button
                                onClick={deletionTarget.type === 'course' ? confirmDeleteCourse : confirmRemoveSubject}
                                className="btn-base btn-save px-6 py-2 text-sm w-32"
                            >
                                SIM
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};