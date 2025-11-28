import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { Course, Subject, CourseType } from '../types';
import { Plus, Trash2, Pencil, X, Save, ChevronDown, ChevronUp } from 'lucide-react';

export const CoursesPage: React.FC = () => {
    const { courses, addCourse, updateCourse, deleteCourse } = useStore();
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [isSubjectsExpanded, setIsSubjectsExpanded] = useState(true);

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
                <div className="bg-white p-6 rounded-lg shadow-md border-l-4 border-primary-500 mb-6">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-900">
                            {editingId ? 'Editar Curso' : 'Cadastrar Novo Curso'}
                        </h3>
                        <button onClick={resetForm} className="text-gray-400 hover:text-gray-600">
                            <X size={24} />
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
                                    onClick={handleAddSubject}
                                    className="w-full flex justify-center items-center bg-green-600 text-white rounded-md h-[38px] hover:bg-green-700 transition-colors"
                                    title="Adicionar Matéria"
                                >
                                    <Plus size={20} />
                                </button>
                            </div>
                        </div>


                        {/* List of Subjects */}
                        <div className="mt-4">
                            <button
                                onClick={() => setIsSubjectsExpanded(!isSubjectsExpanded)}
                                className="w-full flex justify-between items-center text-sm font-semibold text-gray-700 hover:text-gray-900 mb-2 pb-2 border-b border-gray-200"
                            >
                                <span>Matérias Cadastradas ({courseForm.subjects?.length || 0})</span>
                                {isSubjectsExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                            </button>

                            {isSubjectsExpanded && (
                                <div className="space-y-2">
                                    {courseForm.subjects?.length === 0 && (
                                        <p className="text-sm text-gray-500 italic text-center py-2">Nenhuma matéria adicionada ainda.</p>
                                    )}
                                    {courseForm.subjects?.map((sub, index) => (
                                        <div key={sub.id || index} className="flex justify-between items-center text-sm bg-white p-3 border rounded shadow-sm hover:shadow-md transition-shadow">
                                            <div className="flex-1 flex flex-col">
                                                <span className="text-xs text-gray-500 font-bold">{sub.module}</span>
                                                <span className="font-semibold text-gray-900">{sub.name}</span>
                                            </div>
                                            <div className="flex items-center space-x-4">
                                                <span className={`px-2 py-0.5 rounded text-xs ${sub.modality === 'Teórica' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>
                                                    {sub.modality}
                                                </span>
                                                <span className="font-bold text-gray-600 w-16 text-right">{sub.hours}h</span>
                                                <button onClick={() => handleRemoveSubject(sub.id)} className="text-red-500 hover:text-red-700">
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
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
                    <div key={course.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
                        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                            <div>
                                <h3 className="text-lg font-bold text-gray-900">{course.name}</h3>
                                <span className="text-xs font-medium text-gray-500 bg-gray-200 px-2 py-0.5 rounded-full">{course.type}</span>
                            </div>
                            <div className="flex items-center space-x-4">
                                <span className="text-sm font-medium text-gray-600">
                                    Total: {course.subjects.reduce((acc, s) => acc + s.hours, 0)} Horas
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
                        <div className="p-6">
                            <h4 className="text-sm font-medium text-gray-500 mb-3 uppercase tracking-wider">Grade Curricular</h4>
                            {course.subjects.length > 0 ? (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                    {course.subjects.map(sub => (
                                        <div key={sub.id} className={`p-3 rounded border-l-4 shadow-sm ${sub.modality === 'Teórica' ? 'border-blue-400 bg-blue-50' : 'border-orange-400 bg-orange-50'}`}>
                                            <div className="text-xs text-gray-500 font-bold mb-1">{sub.module}</div>
                                            <div className="font-medium text-gray-900 line-clamp-2">{sub.name}</div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-2">
                                                <span className="font-semibold">{sub.modality}</span>
                                                <span className="bg-white px-2 rounded border border-gray-200">{sub.hours}h</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-gray-400 italic">Nenhuma matéria cadastrada.</p>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
};