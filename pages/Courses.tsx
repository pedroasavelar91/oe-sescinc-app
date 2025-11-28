import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { Course, Subject, CourseType } from '../types';
import { Plus, Trash2, Pencil, X, Save, ChevronDown, ChevronUp } from 'lucide-react';

export const CoursesPage: React.FC = () => {
    const { courses, addCourse, updateCourse, deleteCourse } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingSubjectId, setEditingSubjectId] = useState<string | null>(null);
    const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());

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
        setCourseForm({
            ...courseForm,
            subjects: courseForm.subjects?.filter(s => s.id !== id)
        });
        if (editingSubjectId === id) {
            setEditingSubjectId(null);
        }
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
        const newExpanded = new Set(expandedCourses);
        if (newExpanded.has(courseId)) {
            newExpanded.delete(courseId);
        } else {
            newExpanded.add(courseId);
        }
        setExpandedCourses(newExpanded);
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
        if (window.confirm("Tem certeza que deseja excluir este curso?")) {
            deleteCourse(id);
        }
    };

    const resetForm = () => {
        setIsCreating(false);
        setEditingId(null);
        setCourseForm({ name: '', type: CourseType.CBA_2, subjects: [] });
        setCustomName('');
        setTempSubject({ module: '', name: '', hours: 4, modality: 'Teórica' });
    };

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h1 className="text-2xl font-bold text-gray-900">Cursos e Matérias</h1>
                {!isCreating && (
                    <button
                        onClick={() => setIsCreating(true)}
                        className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition"
                    >
                        <Plus size={20} />
                        <span>Novo Curso</span>
                    </button>
                )}
            </div>

            {isCreating && (
                <div className="bg-white p-6 rounded-lg shadow-lg border border-gray-100 mb-8 animate-fade-in relative overflow-hidden">
                    <div className="absolute top-0 left-0 w-1 h-full bg-primary-500"></div>
                    <div className="flex justify-between items-center mb-6 border-b border-gray-100 pb-4">
                        <h3 className="text-xl font-bold text-gray-900 flex items-center">
                            {editingId ? <Pencil size={20} className="mr-2 text-primary-500" /> : <Plus size={20} className="mr-2 text-primary-500" />}
                            {editingId ? 'Editar Curso' : 'Cadastrar Novo Curso'}
                        </h3>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600 transition-colors bg-gray-50 p-1 rounded-full hover:bg-gray-100">
                            <X size={20} />
                        </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Curso</label>
                            <select
                                className={inputClass}
                                value={courseForm.type}
                                onChange={e => setCourseForm({ ...courseForm, type: e.target.value as CourseType })}
                            >
                                {Object.values(CourseType).map(t => <option key={t} value={t}>{t}</option>)}
                            </select>
                        </div>

                        {courseForm.type === CourseType.CUSTOM && (
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Curso Personalizado</label>
                                <input
                                    placeholder="Digite o nome do curso..."
                                    className={inputClass}
                                    value={customName}
                                    onChange={e => setCustomName(e.target.value)}
                                />
                            </div>
                        )}
                    </div>

                    <div className="bg-gray-50 p-4 rounded mb-4 border border-gray-200">
                        <h4 className="text-sm font-bold text-gray-700 mb-3 flex items-center">
                            <Plus size={16} className="mr-1" /> Adicionar Matérias
                        </h4>

                        {/* Subject Input Row: Module -> Name -> Hours -> Modality */}
                        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
                            <div className="md:col-span-3">
                                <label className="text-xs text-gray-500 font-medium">Módulo</label>
                                <input
                                    placeholder="Ex: Módulo 1"
                                    className={inputClass}
                                    value={tempSubject.module}
                                    onChange={e => setTempSubject({ ...tempSubject, module: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-4">
                                <label className="text-xs text-gray-500 font-medium">Matéria</label>
                                <input
                                    placeholder="Nome da Matéria"
                                    className={inputClass}
                                    value={tempSubject.name}
                                    onChange={e => setTempSubject({ ...tempSubject, name: e.target.value })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-500 font-medium">Carga Horária</label>
                                <input
                                    type="number"
                                    className={inputClass}
                                    value={tempSubject.hours}
                                    onChange={e => setTempSubject({ ...tempSubject, hours: parseInt(e.target.value) })}
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="text-xs text-gray-500 font-medium">Modalidade</label>
                                <select
                                    className={inputClass}
                                    value={tempSubject.modality}
                                    onChange={e => setTempSubject({ ...tempSubject, modality: e.target.value as any })}
                                >
                                    <option>Teórica</option>
                                    <option>Prática</option>
                                </select>
                            </div>
                            <div className="md:col-span-1">
                                <button
                                    onClick={editingSubjectId ? handleUpdateSubject : handleAddSubject}
                                    className={`w-full flex justify-center items-center text-white rounded-md h-[38px] transition-colors ${editingSubjectId ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'
                                        }`}
                                    title={editingSubjectId ? "Atualizar Matéria" : "Adicionar Matéria"}
                                >
                                    {editingSubjectId ? <Save size={20} /> : <Plus size={20} />}
                                </button>
                            </div>
                        </div>


                        {/* List of Subjects with Scrollbar */}
                        <div className="mt-4">
                            <h4 className="text-sm font-semibold text-gray-700 mb-2 pb-2 border-b border-gray-200">
                                Matérias Cadastradas ({courseForm.subjects?.length || 0})
                            </h4>
                            <div className="max-h-64 overflow-y-auto space-y-2 pr-2">
                                {courseForm.subjects?.length === 0 && (
                                    <p className="text-sm text-gray-500 italic text-center py-2">Nenhuma matéria adicionada ainda.</p>
                                )}
                                {courseForm.subjects?.map((sub, index) => (
                                    <div key={sub.id || index} className="flex justify-between items-center text-sm bg-white p-3 border rounded shadow-sm hover:shadow-md transition-shadow">
                                        <div className="flex-1 flex flex-col">
                                            <span className="text-xs text-gray-500 font-bold">{sub.module}</span>
                                            <span className="font-semibold text-gray-900">{sub.name}</span>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <span className={`px-2 py-0.5 rounded text-xs ${sub.modality === 'Teórica' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                {sub.modality}
                                            </span>
                                            <span className="font-bold text-gray-600 w-12 text-right">{sub.hours}h</span>
                                            <button
                                                onClick={() => handleEditSubject(sub)}
                                                className="text-blue-600 hover:text-blue-800 p-1"
                                                title="Editar Matéria"
                                            >
                                                <Pencil size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleRemoveSubject(sub.id)}
                                                className="text-red-500 hover:text-red-700 p-1"
                                                title="Remover Matéria"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end space-x-3 pt-2">
                        <button onClick={resetForm} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 bg-white">
                            Cancelar
                        </button>
                        <button onClick={handleSaveCourse} className="flex items-center space-x-2 px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700 shadow-sm">
                            <Save size={18} />
                            <span>{editingId ? 'Salvar Alterações' : 'Salvar Curso'}</span>
                        </button>
                    </div>
                </div>
            )}

            <div className="grid grid-cols-1 gap-6">
                {courses.map(course => (
                    <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group">
                        <div className="bg-white px-6 py-5 border-b border-gray-100 flex justify-between items-center group-hover:bg-gray-50/50 transition-colors">
                            <div className="flex items-center space-x-3">
                                <button
                                    onClick={() => toggleCourseExpansion(course.id)}
                                    className="p-1 hover:bg-gray-200 rounded transition-colors"
                                    title={expandedCourses.has(course.id) ? "Minimizar" : "Expandir"}
                                >
                                    {expandedCourses.has(course.id) ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
                                </button>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
                                    <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{course.type}</span>
                                </div>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-600">
                                    Total: {course.subjects.reduce((acc, s) => acc + s.hours, 0)} Horas | {course.subjects.length} Matérias
                                </span>
                                <div className="flex space-x-2 pl-4 border-l border-gray-300">
                                    <button
                                        onClick={() => handleEditClick(course)}
                                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-full transition-colors"
                                        title="Editar Curso"
                                    >
                                        <Pencil size={18} />
                                    </button>
                                    <button
                                        onClick={() => handleDeleteClick(course.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-full transition-colors"
                                        title="Excluir Curso"
                                    >
                                        <Trash2 size={18} />
                                    </button>
                                </div>
                            </div>
                        </div>
                        {expandedCourses.has(course.id) && (
                            <div className="p-6">
                                <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Grade Curricular</h4>
                                {course.subjects.length > 0 ? (
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {course.subjects.map(sub => (
                                            <div key={sub.id} className={`p-4 rounded-lg border shadow-sm hover:shadow-md transition-shadow bg-white relative overflow-hidden group/card`}>
                                                <div className={`absolute left-0 top-0 bottom-0 w-1 ${sub.modality === 'Teórica' ? 'bg-blue-500' : 'bg-orange-500'}`}></div>
                                                <div className="pl-2">
                                                    <div className="flex justify-between items-start mb-1">
                                                        <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{sub.module}</span>
                                                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${sub.modality === 'Teórica' ? 'bg-blue-50 text-blue-700' : 'bg-orange-50 text-orange-700'}`}>
                                                            {sub.modality}
                                                        </span>
                                                    </div>
                                                    <h5 className="font-bold text-gray-800 text-sm mb-2 line-clamp-2 min-h-[40px]">{sub.name}</h5>
                                                    <div className="flex items-center text-xs text-gray-500 font-medium">
                                                        <span className="bg-gray-100 px-2 py-1 rounded text-gray-600 border border-gray-200">{sub.hours} Horas</span>
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
                ))}
            </div>
        </div>
    );
};