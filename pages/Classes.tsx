
import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/AppStore';
import { ClassGroup, UserRole, ClassScheduleItem, Course, Subject, CourseType, User } from '../types';
import { Plus, Calendar as CalendarIcon, Clock, ChevronRight, FileText, Download, Save, Trash2, X, ChevronDown, Check, RefreshCw } from 'lucide-react';
import jsPDF from 'jspdf';
import 'jspdf-autotable';

// --- Components ---

interface MultiSelectProps {
    options: User[];
    selectedIds: string[];
    onChange: (ids: string[]) => void;
    placeholder?: string;
    readOnly?: boolean;
}

const MultiSelect: React.FC<MultiSelectProps> = ({ options, selectedIds, onChange, placeholder = "Selecionar...", readOnly = false }) => {
    const [isOpen, setIsOpen] = useState(false);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const toggleSelection = (id: string) => {
        if (readOnly) return;
        if (selectedIds.includes(id)) {
            onChange(selectedIds.filter(sid => sid !== id));
        } else {
            onChange([...selectedIds, id]);
        }
    };

    const selectedNames = options
        .filter(opt => selectedIds.includes(opt.id))
        .map(opt => opt.name)
        .join(', ');

    return (
        <div className="relative" ref={containerRef}>
            <div
                className={`w-full min-h-[38px] px-3 py-2 border border-gray-300 rounded-md bg-white text-sm text-gray-900 cursor-pointer flex justify-between items-center ${readOnly ? 'bg-gray-50' : ''}`}
                onClick={() => !readOnly && setIsOpen(!isOpen)}
            >
                <span className={`block truncate ${selectedIds.length === 0 ? 'text-gray-400' : ''}`}>
                    {selectedIds.length > 0 ? (selectedIds.length > 2 ? `${selectedIds.length} selecionados` : selectedNames) : placeholder}
                </span>
                {!readOnly && <ChevronDown size={16} className="text-gray-400" />}
            </div>

            {isOpen && !readOnly && (
                <div className="absolute z-50 mt-1 w-full bg-white shadow-lg max-h-60 rounded-md py-1 text-base ring-1 ring-black ring-opacity-5 overflow-auto focus:outline-none sm:text-sm">
                    {options.map((option) => (
                        <div
                            key={option.id}
                            className="flex items-center px-4 py-2 hover:bg-gray-100 cursor-pointer"
                            onClick={() => toggleSelection(option.id)}
                        >
                            <div className={`flex-shrink-0 mr-2 w-4 h-4 border rounded flex items-center justify-center ${selectedIds.includes(option.id) ? 'bg-primary-600 border-primary-600' : 'border-gray-300'}`}>
                                {selectedIds.includes(option.id) && <Check size={12} className="text-white" />}
                            </div>
                            <span className="block truncate font-medium text-gray-900">
                                {option.name}
                            </span>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export const ClassesPage: React.FC = () => {
    const { classes, courses, users, addClass, updateClass, requestSwap, currentUser } = useStore();
    const [view, setView] = useState<'list' | 'create' | 'details'>('list');
    const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);

    // Swap Modal State
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [swapTargetId, setSwapTargetId] = useState('');
    const [swapItem, setSwapItem] = useState<ClassScheduleItem | null>(null);

    // Creation State
    const [newClass, setNewClass] = useState<Partial<ClassGroup>>({
        includeSaturday: false,
        includeSunday: false,
        hoursPerDay: 8,
        theoryStartDate: '',
        practiceStartDate: '',
        registrationNumber: '',
        capBa: ''
    });

    const [classNumber, setClassNumber] = useState('');
    const [classYear, setClassYear] = useState(new Date().getFullYear().toString());
    const [defaultPracticeInstructors, setDefaultPracticeInstructors] = useState<string[]>([]);

    const [previewSchedule, setPreviewSchedule] = useState<ClassScheduleItem[]>([]);

    const instructors = users.filter(u =>
        u.role === UserRole.INSTRUTOR ||
        u.role === UserRole.COORDENADOR ||
        u.role === UserRole.GESTOR
    );

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    // Helper to get local date without timezone issues
    const getLocalDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Effect to auto-calculate schedule when parameters change
    useEffect(() => {
        if (view === 'create') {
            calculateSchedulePreview();
        }
    }, [
        newClass.courseId,
        newClass.theoryStartDate,
        newClass.practiceStartDate,
        newClass.includeSaturday,
        newClass.includeSunday,
        newClass.hoursPerDay,
        defaultPracticeInstructors
    ]);

    const generateSubSchedule = (
        subjects: Subject[],
        startDateStr: string,
        config: { includeSat: boolean, includeSun: boolean, hoursPerDay: number, defaultInstructorIds?: string[] }
    ): ClassScheduleItem[] => {
        if (!startDateStr || subjects.length === 0) return [];

        const schedule: ClassScheduleItem[] = [];
        const start = getLocalDate(startDateStr);
        let currentDate = new Date(start);

        // Deep copy subjects to track remaining hours
        let subjectQueue = subjects.map(s => ({ ...s, remaining: s.hours }));

        const dayStartHour = 8; // 08:00
        const lunchStartHour = 12; // 12:00
        const lunchEndHour = 13; // 13:00
        const dayEndHour = 17; // 17:00

        const formatTime = (h: number) => `${h.toString().padStart(2, '0')}:00`;

        // Safety break to prevent infinite loops
        let safeGuard = 0;
        while (subjectQueue.length > 0 && safeGuard < 365) {
            safeGuard++;
            const day = currentDate.getDay(); // 0 = Sunday, 6 = Saturday
            const isWeekend = day === 0 || day === 6;

            // Skip logic: 
            // If it's Sunday (0) and NOT includeSunday -> Skip
            // If it's Saturday (6) and NOT includeSaturday -> Skip
            const skipDay = (day === 0 && !config.includeSun) || (day === 6 && !config.includeSat);

            if (!skipDay) {
                let hoursAvailableToday = config.hoursPerDay;
                let currentHour = dayStartHour;

                while (hoursAvailableToday > 0 && subjectQueue.length > 0) {
                    // Lunch Break Logic
                    if (currentHour === lunchStartHour) {
                        currentHour = lunchEndHour;
                        continue;
                    }
                    if (currentHour >= dayEndHour) break;

                    const currentSubject = subjectQueue[0];

                    // Calculate max duration for this slot (until lunch or until end of day)
                    let timeUntilNextBreak = (currentHour < lunchStartHour)
                        ? lunchStartHour - currentHour
                        : dayEndHour - currentHour;

                    const slotDuration = Math.min(currentSubject.remaining, timeUntilNextBreak, hoursAvailableToday);

                    if (slotDuration > 0) {
                        schedule.push({
                            id: Math.random().toString(36).substr(2, 9),
                            date: currentDate.toISOString().split('T')[0],
                            startTime: formatTime(currentHour),
                            endTime: formatTime(currentHour + slotDuration),
                            duration: slotDuration,
                            subjectId: currentSubject.id,
                            moduleId: currentSubject.module,
                            instructorIds: config.defaultInstructorIds || [],
                            isCompleted: false
                        });

                        currentHour += slotDuration;
                        hoursAvailableToday -= slotDuration;
                        currentSubject.remaining -= slotDuration;

                        if (currentSubject.remaining <= 0) {
                            subjectQueue.shift();
                        }
                    } else {
                        break;
                    }
                }
            }
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return schedule;
    };

    const calculateSchedulePreview = () => {
        if (!newClass.courseId) {
            setPreviewSchedule([]);
            return;
        }
        const course = courses.find(c => c.id === newClass.courseId);
        if (!course) return;

        // Filter subjects by modality
        const theorySubjects = course.subjects.filter(s => s.modality === 'Teórica');
        const practiceSubjects = course.subjects.filter(s => s.modality === 'Prática');

        const config = {
            includeSat: !!newClass.includeSaturday,
            includeSun: !!newClass.includeSunday,
            hoursPerDay: newClass.hoursPerDay || 8
        };

        const theorySchedule = generateSubSchedule(
            theorySubjects,
            newClass.theoryStartDate || '',
            config
        );

        const practiceSchedule = generateSubSchedule(
            practiceSubjects,
            newClass.practiceStartDate || '',
            { ...config, defaultInstructorIds: defaultPracticeInstructors }
        );

        // Merge and sort
        const merged = [...theorySchedule, ...practiceSchedule].sort((a, b) => {
            if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
            return parseInt(a.startTime) - parseInt(b.startTime);
        });

        setPreviewSchedule(merged);
    };

    const updatePreviewItem = (id: string, field: keyof ClassScheduleItem, value: any) => {
        setPreviewSchedule(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
    };

    const handleSaveClass = () => {
        if (!newClass.courseId || !classNumber || previewSchedule.length === 0) {
            alert("Por favor, preencha os campos obrigatórios e verifique se o cronograma foi gerado (datas válidas).");
            return;
        }

        const course = courses.find(c => c.id === newClass.courseId);
        const className = `${course?.name} ${classNumber}/${classYear}`;

        // Calculate start and end from actual schedule
        const dates = previewSchedule.map(s => new Date(s.date).getTime());
        const minDate = new Date(Math.min(...dates));
        const maxDate = new Date(Math.max(...dates));

        const cls: ClassGroup = {
            id: Math.random().toString(36).substr(2, 9),
            name: className,
            startDate: minDate.toISOString().split('T')[0],
            endDate: maxDate.toISOString().split('T')[0],
            courseId: newClass.courseId!,
            studentIds: [],
            daysOfWeek: [],
            includeWeekends: false,
            includeSaturday: newClass.includeSaturday!,
            includeSunday: newClass.includeSunday!,
            hoursPerDay: newClass.hoursPerDay!,
            theoryStartDate: newClass.theoryStartDate,
            practiceStartDate: newClass.practiceStartDate,
            registrationNumber: newClass.registrationNumber,
            capBa: newClass.capBa,
            schedule: previewSchedule
        };

        addClass(cls);
        setView('list');
        resetForm();
    };

    const resetForm = () => {
        setNewClass({
            includeSaturday: false,
            includeSunday: false,
            hoursPerDay: 8,
            theoryStartDate: '',
            practiceStartDate: '',
            registrationNumber: '',
            capBa: ''
        });
        setClassNumber('');
        setPreviewSchedule([]);
        setDefaultPracticeInstructors([]);
    };

    const assignInstructor = (classId: string, scheduleId: string, instructorIds: string[]) => {
        // For existing classes
        const targetClass = classes.find(c => c.id === classId);
        if (!targetClass) return;
        const updatedSchedule = targetClass.schedule.map(item =>
            item.id === scheduleId ? { ...item, instructorIds } : item
        );
        updateClass({ ...targetClass, schedule: updatedSchedule });
        if (selectedClass && selectedClass.id === classId) {
            setSelectedClass({ ...targetClass, schedule: updatedSchedule });
        }
    };

    // --- Swap Functionality ---
    const handleSwapClick = (item: ClassScheduleItem) => {
        setSwapItem(item);
        setSwapModalOpen(true);
        setSwapTargetId('');
    };

    const confirmSwap = () => {
        if (!swapItem || !swapTargetId || !selectedClass || !currentUser) return;

        const targetUser = users.find(u => u.id === swapTargetId);

        requestSwap({
            targetInstructorId: swapTargetId,
            targetInstructorName: targetUser?.name,
            classId: selectedClass.id,
            className: selectedClass.name,
            scheduleId: swapItem.id,
            date: swapItem.date,
            time: `${swapItem.startTime} - ${swapItem.endTime}`
        });

        alert('Solicitação de troca enviada com sucesso!');
        setSwapModalOpen(false);
    };


    const exportToPDF = (cls: ClassGroup) => {
        const doc: any = new jsPDF();
        const course = courses.find(c => c.id === cls.courseId);

        doc.setFontSize(16);
        doc.text(`Cronograma: ${cls.name}`, 14, 15);
        doc.setFontSize(12);
        doc.text(`Curso: ${course?.name}`, 14, 22);
        doc.text(`Registro: ${cls.registrationNumber || 'N/A'}`, 14, 28);
        if (cls.capBa) doc.text(`CAP-BA: ${cls.capBa}`, 100, 28);

        const tableData = cls.schedule.map(item => {
            const subject = course?.subjects.find(s => s.id === item.subjectId);

            const instructorNames = users
                .filter(u => item.instructorIds?.includes(u.id))
                .map(u => u.name)
                .join(', ') || 'Não atribuído';

            const dateObj = getLocalDate(item.date);

            return [
                dateObj.toLocaleDateString('pt-BR'),
                `${item.startTime} às ${item.endTime}`,
                item.moduleId,
                subject?.name || '',
                item.duration,
                instructorNames
            ];
        });

        doc.autoTable({
            startY: 35,
            head: [['Data', 'Horário', 'Módulo', 'Disciplina', 'Tempos', 'Instrutor(es)']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [234, 88, 12] },
            styles: { fontSize: 8, cellPadding: 2 },
        });

        doc.save(`cronograma_${cls.name}.pdf`);
    };

    const getStatus = (cls: ClassGroup) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = getLocalDate(cls.startDate);
        const end = getLocalDate(cls.endDate);

        if (today < start) return { label: 'A Iniciar', color: 'bg-blue-50 text-blue-700 border border-blue-200' };
        if (today > end) return { label: 'Finalizada', color: 'bg-gray-100 text-gray-600 border border-gray-200' };
        return { label: 'Em Andamento', color: 'bg-green-50 text-green-700 border border-green-200' };
    };

    const getRowSpan = (schedule: ClassScheduleItem[], index: number, key: keyof ClassScheduleItem) => {
        const currentVal = schedule[index][key];
        let span = 1;
        for (let i = index + 1; i < schedule.length; i++) {
            if (schedule[i][key] === currentVal) {
                if (key === 'date') span++;
                else if (key === 'moduleId' && schedule[i].date === schedule[index].date) span++;
                else break;
            } else {
                break;
            }
        }
        return span;
    };

    const ScheduleTable = ({ schedule, readOnly = false, onUpdate }: { schedule: ClassScheduleItem[], readOnly?: boolean, onUpdate?: (id: string, field: keyof ClassScheduleItem, val: any) => void }) => {
        const courseId = readOnly ? selectedClass?.courseId : newClass.courseId;
        const course = courses.find(c => c.id === courseId);

        if (schedule.length === 0) return <div className="text-center py-8 text-gray-500 italic">Preencha as datas para gerar o cronograma.</div>;

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        <thead>
                            <tr className="bg-green-100 text-green-900">
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-green-200">DATA</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-green-200">Horário</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-green-200 min-w-[150px]">Módulo</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase border border-green-200 min-w-[300px]">Disciplina</th>
                                <th className="px-2 py-3 text-center text-xs font-bold uppercase border border-green-200">Tempos</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-green-200 min-w-[200px]">Instrutor(es)</th>
                                {readOnly && currentUser?.role === UserRole.INSTRUTOR && <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-green-200">Ações</th>}
                            </tr>
                        </thead>
                        <tbody className="bg-white">
                            {schedule.map((item, index) => {
                                const subject = course?.subjects.find(s => s.id === item.subjectId);
                                const dateSpan = getRowSpan(schedule, index, 'date');
                                const showDate = index === 0 || schedule[index - 1].date !== item.date;
                                const moduleSpan = getRowSpan(schedule, index, 'moduleId');
                                const showModule = index === 0 || schedule[index - 1].moduleId !== item.moduleId || schedule[index - 1].date !== item.date;

                                const dateObj = getLocalDate(item.date);

                                const isAssignedToMe = item.instructorIds.includes(currentUser?.id || '');

                                return (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        {showDate && (
                                            <td rowSpan={dateSpan} className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 bg-green-50 border border-gray-300 text-center align-middle">
                                                {readOnly ? dateObj.toLocaleDateString('pt-BR') : (
                                                    <input type="date" value={item.date} onChange={e => onUpdate && onUpdate(item.id, 'date', e.target.value)} className="bg-transparent border-none text-center focus:ring-0 p-0 text-sm font-bold text-gray-900" />
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border border-gray-300 text-center bg-green-50 font-medium">
                                            {readOnly ? `${item.startTime} às ${item.endTime}` : (
                                                <div className="flex items-center justify-center space-x-1">
                                                    <input type="time" value={item.startTime} onChange={e => onUpdate && onUpdate(item.id, 'startTime', e.target.value)} className="w-16 bg-white rounded border border-gray-300 text-xs p-1 focus:ring-0 text-center text-gray-900" />
                                                    <span className="text-gray-900">-</span>
                                                    <input type="time" value={item.endTime} onChange={e => onUpdate && onUpdate(item.id, 'endTime', e.target.value)} className="w-16 bg-white rounded border border-gray-300 text-xs p-1 focus:ring-0 text-center text-gray-900" />
                                                </div>
                                            )}
                                        </td>
                                        {showModule && (
                                            <td rowSpan={moduleSpan} className="px-4 py-2 text-sm text-gray-900 border border-gray-300 text-center align-middle bg-green-50 font-bold break-words">
                                                {item.moduleId}
                                            </td>
                                        )}
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900 border border-gray-300 bg-gray-50 break-words">
                                            {subject?.name}
                                            <div className="text-xs text-gray-500 font-normal">{subject?.modality}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900 border border-gray-300 text-center bg-gray-50">
                                            {item.duration}
                                        </td>
                                        <td className="px-2 py-1 border border-gray-300 bg-white">
                                            <MultiSelect
                                                options={instructors}
                                                selectedIds={item.instructorIds || []}
                                                onChange={(ids) => readOnly ? assignInstructor(selectedClass!.id, item.id, ids) : (onUpdate && onUpdate(item.id, 'instructorIds', ids))}
                                                readOnly={readOnly && currentUser?.role === UserRole.INSTRUTOR} // Instructors can't change assignments directly
                                            />
                                        </td>
                                        {readOnly && currentUser?.role === UserRole.INSTRUTOR && (
                                            <td className="px-2 py-1 border border-gray-300 text-center bg-white">
                                                {isAssignedToMe && (
                                                    <button
                                                        onClick={() => handleSwapClick(item)}
                                                        className="p-1 text-primary-600 hover:bg-primary-50 rounded"
                                                        title="Solicitar Troca"
                                                    >
                                                        <RefreshCw size={16} />
                                                    </button>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>
        );
    };

    const selectedCourseType = courses.find(c => c.id === newClass.courseId)?.type;

    if (view === 'create') {
        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-y-auto animate-scale-in">
                    <div className="p-6 border-b border-gray-100 flex justify-between items-center sticky top-0 bg-white z-10 rounded-t-xl">
                        <h2 className="text-xl font-bold text-gray-900">Nova Turma</h2>
                        <button onClick={() => { setView('list'); resetForm(); }} className="text-gray-400 hover:text-gray-600 transition-colors">
                            <X size={24} />
                        </button>
                    </div>

                    <div className="p-6">

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                            {/* Column 1: Identification */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-1">Identificação</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Curso</label>
                                    <select className={inputClass} onChange={e => setNewClass({ ...newClass, courseId: e.target.value })}>
                                        <option value="">Selecione um curso...</option>
                                        {courses.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Nº Turma</label>
                                        <input
                                            type="number"
                                            className={inputClass}
                                            value={classNumber}
                                            onChange={e => setClassNumber(e.target.value)}
                                            placeholder="ex: 20"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ano</label>
                                        <input
                                            type="number"
                                            className={inputClass}
                                            value={classYear}
                                            onChange={e => setClassYear(e.target.value)}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Registro</label>
                                    <input
                                        type="text"
                                        maxLength={4}
                                        className={inputClass}
                                        value={newClass.registrationNumber}
                                        onChange={e => setNewClass({ ...newClass, registrationNumber: e.target.value })}
                                    />
                                </div>

                                {selectedCourseType !== CourseType.CBA_CE && (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">CAP-BA</label>
                                        <input
                                            type="text"
                                            maxLength={4}
                                            className={inputClass}
                                            value={newClass.capBa}
                                            onChange={e => setNewClass({ ...newClass, capBa: e.target.value })}
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Column 2: Dates */}
                            <div className="space-y-4">
                                <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider border-b pb-1">Datas de Início</h3>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Início Aulas Teóricas</label>
                                    <input type="date" className={inputClass} onChange={e => setNewClass({ ...newClass, theoryStartDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Início Aulas Práticas</label>
                                    <input type="date" className={inputClass} onChange={e => setNewClass({ ...newClass, practiceStartDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Horas/Dia</label>
                                    <input
                                        type="number"
                                        className={inputClass}
                                        value={newClass.hoursPerDay}
                                        onChange={e => setNewClass({ ...newClass, hoursPerDay: parseInt(e.target.value) })}
                                    />
                                </div>
                            </div>

                            {/* Column 3: Configuration */}
                            <div className="space-y-4">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200 shadow-sm">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                                        Configuração
                                    </h3>

                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3 p-2 hover:bg-white rounded transition cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition"
                                                checked={newClass.includeSaturday}
                                                onChange={e => setNewClass({ ...newClass, includeSaturday: e.target.checked })}
                                            />
                                            <span className="text-sm text-gray-700 font-medium">Incluir Sábados</span>
                                        </label>
                                        <label className="flex items-center space-x-3 p-2 hover:bg-white rounded transition cursor-pointer">
                                            <input
                                                type="checkbox"
                                                className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition"
                                                checked={newClass.includeSunday}
                                                onChange={e => setNewClass({ ...newClass, includeSunday: e.target.checked })}
                                            />
                                            <span className="text-sm text-gray-700 font-medium">Incluir Domingos</span>
                                        </label>
                                    </div>

                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Instrutor Padrão (Prática)</label>
                                        <MultiSelect
                                            options={instructors}
                                            selectedIds={defaultPracticeInstructors}
                                            onChange={setDefaultPracticeInstructors}
                                        />
                                        <p className="text-xs text-gray-500 mt-1">Atribuído automaticamente às aulas práticas.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Preview Section */}
                    <div className="mt-8">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-lg font-bold text-gray-900">Cronograma Calculado</h3>
                            <span className="text-sm text-gray-500">O sistema calculou as datas com base na carga horária. Ajuste manualmente se necessário.</span>
                        </div>

                        <ScheduleTable schedule={previewSchedule} onUpdate={updatePreviewItem} />
                    </div>

                    <div className="mt-8 flex justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button onClick={() => { setView('list'); resetForm(); }} className="px-6 py-2.5 border rounded-lg text-gray-700 bg-white hover:bg-gray-50 font-medium transition-colors">Cancelar</button>
                        <button onClick={handleSaveClass} className="btn-premium px-8 py-2.5 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white rounded-lg flex items-center font-semibold shadow-md transition-all duration-200">
                            <Save size={18} className="mr-2" />
                            Salvar Turma
                        </button>
                    </div>
                </div>
            </div>
        );
    }

    if (view === 'details' && selectedClass) {
        const course = courses.find(c => c.id === selectedClass.courseId);
        return (
            <div className="space-y-6 relative">
                <div className="flex items-center justify-between">
                    <div>
                        <button onClick={() => setView('list')} className="text-sm text-gray-500 hover:text-gray-900 mb-2 flex items-center"><ChevronRight className="rotate-180 mr-1" size={14} /> Voltar</button>
                        <h1 className="text-2xl font-bold text-gray-900">{selectedClass.name}</h1>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600">
                            <span>{course?.name}</span>
                            <span className="text-gray-300">|</span>
                            <span>Reg: {selectedClass.registrationNumber || 'N/A'}</span>
                            {selectedClass.capBa && (
                                <>
                                    <span className="text-gray-300">|</span>
                                    <span>CAP-BA: {selectedClass.capBa}</span>
                                </>
                            )}
                        </div>
                    </div>
                    <button onClick={() => exportToPDF(selectedClass)} className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded shadow hover:bg-red-700 transition">
                        <Download size={20} />
                        <span>Exportar PDF</span>
                    </button>
                </div>

                <ScheduleTable schedule={selectedClass.schedule} readOnly={true} />

                {/* Swap Modal */}
                {swapModalOpen && (
                    <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                        <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                            <h3 className="text-lg font-bold mb-4">Solicitar Permuta de Aula</h3>
                            <p className="text-sm text-gray-600 mb-4">
                                Data: {new Date(swapItem?.date || '').toLocaleDateString()} <br />
                                Horário: {swapItem?.startTime} - {swapItem?.endTime}
                            </p>

                            <div className="mb-4">
                                <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Instrutor Substituto</label>
                                <select
                                    className={inputClass}
                                    value={swapTargetId}
                                    onChange={e => setSwapTargetId(e.target.value)}
                                >
                                    <option value="">Selecione...</option>
                                    {instructors.filter(u => u.id !== currentUser?.id).map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex justify-end space-x-2">
                                <button onClick={() => setSwapModalOpen(false)} className="px-4 py-2 text-gray-600 bg-gray-100 rounded hover:bg-gray-200">Cancelar</button>
                                <button onClick={confirmSwap} className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700">Solicitar</button>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // List View
    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Turmas</h1>
                    <p className="text-gray-500 mt-1">Gerencie turmas e cronogramas</p>
                </div>
                <button
                    onClick={() => setView('create')}
                    className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200"
                >
                    <Plus size={20} />
                    <span className="font-semibold">Nova Turma</span>
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {classes.length === 0 && (
                    <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                        <p className="text-gray-500">Nenhuma turma cadastrada.</p>
                        <button onClick={() => setView('create')} className="mt-2 text-primary-600 font-medium hover:underline">Criar primeira turma</button>
                    </div>
                )}
                {classes.map(cls => {
                    const course = courses.find(c => c.id === cls.courseId);
                    const status = getStatus(cls);

                    return (
                        <div key={cls.id} className="card-premium stagger-item flex flex-col h-full group">
                            <div className="p-6 flex-1 cursor-pointer" onClick={() => { setSelectedClass(cls); setView('details'); }}>
                                <div className="flex justify-between items-start">
                                    <h3 className="text-lg font-bold text-gray-900">{cls.name}</h3>
                                    <span className="bg-gray-100 text-gray-600 text-xs px-2 py-1 rounded">{course?.type}</span>
                                </div>
                                <p className="text-sm text-primary-600 font-medium mt-1">{course?.name}</p>

                                <div className="mt-4 space-y-2">
                                    <div className="flex items-center text-sm text-gray-500">
                                        <CalendarIcon size={16} className="mr-2" />
                                        {getLocalDate(cls.startDate).toLocaleDateString()} - {getLocalDate(cls.endDate).toLocaleDateString()}
                                    </div>
                                    <div className="flex items-center text-sm text-gray-500">
                                        <Clock size={16} className="mr-2" />
                                        {cls.schedule.length} Blocos de Aula
                                    </div>
                                </div>
                            </div>
                            <div className="bg-gray-50 px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                                    {status.label}
                                </span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); exportToPDF(cls); }}
                                    className="text-red-500 hover:text-red-700 p-1 rounded-full hover:bg-red-50 transition"
                                    title="Baixar PDF"
                                >
                                    <Download size={18} />
                                </button>
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    );
};
