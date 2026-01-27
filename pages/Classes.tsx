import React, { useState, useEffect, useRef } from 'react';
import { useStore } from '../context/AppStore';
import { ClassGroup, UserRole, ClassScheduleItem, Course, Subject, CourseType, User } from '../types';
import { Plus, Calendar as CalendarIcon, Clock, ChevronRight, FileText, Download, Save, Trash2, X, ChevronDown, Check, RefreshCw, Edit, MapPin, Hash, ArrowUp, ArrowDown, Pencil, ChevronLeft } from 'lucide-react';


import { formatDate } from '../utils/dateUtils';
import { generateStandardPDF } from '../utils/pdf';

import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter, inputClass, labelClass } from '../components/StandardModal';
import { StandardSelect } from '../components/StandardSelect';
import { StandardCard } from '../components/StandardCard';

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
                            <div className={`flex-shrink-0 mr-2 w-4 h-4 border rounded flex items-center justify-center ${selectedIds.includes(option.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
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
    const { classes, courses, users, addClass, updateClass, deleteClass, requestSwap, currentUser } = useStore();

    console.log('🏫 ClassesPage Debug:');
    console.log('  - Classes from store:', classes);
    console.log('  - Courses from store:', courses);
    console.log('  - Users from store:', users);

    const [view, setView] = useState<'list' | 'create' | 'details'>('list');

    const [selectedClass, setSelectedClass] = useState<ClassGroup | null>(null);
    const [isEditing, setIsEditing] = useState(false);
    const isInitialEditLoad = useRef(false);

    // Swap Modal State
    const [swapModalOpen, setSwapModalOpen] = useState(false);
    const [swapTargetId, setSwapTargetId] = useState('');
    const [swapItem, setSwapItem] = useState<ClassScheduleItem | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Creation State
    const [newClass, setNewClass] = useState<Partial<ClassGroup>>({
        includeSaturday: false,
        includeSunday: false,
        hoursPerDay: 8,
        theoryStartDate: '',
        practiceStartDate: '',
        registrationNumber: '',
        capBa: '',
        location: ''
    });

    const [classNumber, setClassNumber] = useState('');
    const [classYear, setClassYear] = useState(new Date().getFullYear().toString());
    const [defaultPracticeInstructors, setDefaultPracticeInstructors] = useState<string[]>([]);


    // Filters
    const [selectedCourseFilter, setSelectedCourseFilter] = useState('');
    const [selectedYearFilter, setSelectedYearFilter] = useState<string>('');

    // Pagination
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 9;

    const [previewSchedule, setPreviewSchedule] = useState<ClassScheduleItem[]>([]);

    const instructors = users.filter(u =>
        u.role === UserRole.INSTRUTOR ||
        u.role === UserRole.AUXILIAR_INSTRUCAO ||
        u.role === UserRole.COORDENADOR ||
        u.role === UserRole.GESTOR
    ).sort((a, b) => a.name.localeCompare(b.name));



    const canEdit = currentUser?.role === UserRole.GESTOR || currentUser?.role === UserRole.COORDENADOR;

    // Helper to get local date without timezone issues
    const getLocalDate = (dateStr: string) => {
        if (!dateStr) return new Date();
        const [year, month, day] = dateStr.split('-').map(Number);
        return new Date(year, month - 1, day);
    };

    // Effect to auto-calculate schedule when parameters change
    useEffect(() => {
        if (view === 'create') {
            if (isEditing && isInitialEditLoad.current) {
                isInitialEditLoad.current = false;
                return;
            }
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
        config: { includeSat: boolean, includeSun: boolean, hoursPerDay: number, defaultInstructorIds?: string[] },
        existingItems: ClassScheduleItem[] = []
    ): ClassScheduleItem[] => {
        if (!startDateStr || subjects.length === 0) return [];

        // Pre-process existing items into queues by SubjectId
        const existingQueues: { [key: string]: ClassScheduleItem[] } = {};
        existingItems.forEach(item => {
            if (!existingQueues[item.subjectId]) {
                existingQueues[item.subjectId] = [];
            }
            // Only add if it belongs to this subject
            existingQueues[item.subjectId].push(item);
        });

        const schedule: ClassScheduleItem[] = [];
        const start = getLocalDate(startDateStr);
        let currentDate = new Date(start);

        // Deep copy subjects to track remaining hours
        let subjectQueue = subjects.map(s => ({
            ...s,
            remaining: Number(s.hours) || 0,
            // Track how many "slots" we've created for this subject to match with existing
            generatedSlots: 0
        }));

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

            // Skip logic: 
            const skipDay = (day === 0 && !config.includeSun) || (day === 6 && !config.includeSat);

            if (!skipDay) {
                let hoursAvailableToday = Number(config.hoursPerDay);
                let currentHour = dayStartHour;

                while (hoursAvailableToday > 0 && subjectQueue.length > 0) {
                    // Lunch Break Logic
                    if (currentHour === lunchStartHour) {
                        currentHour = lunchEndHour;
                        continue;
                    }
                    if (currentHour >= dayEndHour) break;

                    const currentSubject = subjectQueue[0];

                    // Calculate max duration for this slot
                    let timeUntilNextBreak = (currentHour < lunchStartHour)
                        ? lunchStartHour - currentHour
                        : dayEndHour - currentHour;

                    const slotDuration = Math.min(currentSubject.remaining, timeUntilNextBreak, hoursAvailableToday);

                    if (slotDuration > 0) {
                        // --- PRESERVATION LOGIC ---
                        // Try to find a matching existing item for this subject
                        let preservedItem: ClassScheduleItem | undefined;
                        if (existingQueues[currentSubject.id] && existingQueues[currentSubject.id].length > 0) {
                            preservedItem = existingQueues[currentSubject.id].shift();
                        }

                        // Determine Instructors:
                        let finalInstructors: string[] = [];

                        // 1. If we have a SPECIFIC default (e.g. Practice), use it (overwrite).
                        if (config.defaultInstructorIds && config.defaultInstructorIds.length > 0) {
                            finalInstructors = config.defaultInstructorIds;
                        }
                        // 2. If NO specific default (e.g. Theory), try to keep existing.
                        else if (preservedItem && preservedItem.instructorIds && preservedItem.instructorIds.length > 0) {
                            finalInstructors = preservedItem.instructorIds;
                        }
                        // 3. Fallback to empty
                        else {
                            finalInstructors = [];
                        }

                        // Determine ID and Completion Status
                        const itemId = preservedItem ? preservedItem.id : crypto.randomUUID();
                        const isCompleted = preservedItem ? preservedItem.isCompleted : false;
                        // ---------------------------

                        schedule.push({
                            id: itemId,
                            date: currentDate.toISOString().split('T')[0],
                            startTime: formatTime(currentHour),
                            endTime: formatTime(currentHour + slotDuration),
                            duration: slotDuration,
                            subjectId: currentSubject.id,
                            moduleId: currentSubject.module,
                            instructorIds: finalInstructors,
                            isCompleted: isCompleted
                        });

                        currentHour += slotDuration;
                        hoursAvailableToday -= slotDuration;
                        currentSubject.remaining -= slotDuration;
                        currentSubject.generatedSlots++; // Increment slot count if we need more complex matching later

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

        // Filter subjects by modality (Robust check)
        const subjects = course.subjects || [];

        // Debug: Check what we have
        if (subjects.length === 0) {
            console.warn("DEBUG: Course has no subjects!", course);
        }

        const theorySubjects = subjects.filter(s =>
            (s.modality as string) === 'Teórica' ||
            (s.modality as string) === 'Teorica' ||
            (s.modality && (s.modality as string).includes('Te'))
        );

        const practiceSubjects = subjects.filter(s =>
            (s.modality as string) === 'Prática' ||
            (s.modality as string) === 'Pratica' ||
            (s.modality && (s.modality as string).includes('Pr'))
        );

        const config = {
            includeSat: !!newClass.includeSaturday,
            includeSun: !!newClass.includeSunday,
            hoursPerDay: newClass.hoursPerDay || 8
        };

        // Pass current previewSchedule (containing manual edits) as existingItems
        const theorySchedule = generateSubSchedule(
            theorySubjects,
            newClass.theoryStartDate || '',
            config,
            previewSchedule // Pass existing items!
        );

        const practiceSchedule = generateSubSchedule(
            practiceSubjects,
            newClass.practiceStartDate || '',
            { ...config, defaultInstructorIds: defaultPracticeInstructors },
            previewSchedule // Pass existing items!
        );

        // Merge and sort
        const merged = [...theorySchedule, ...practiceSchedule].sort((a, b) => {
            if (a.date !== b.date) return new Date(a.date).getTime() - new Date(b.date).getTime();
            return parseInt(a.startTime) - parseInt(b.startTime);
        });

        setPreviewSchedule(merged);
    };

    const updatePreviewItem = (id: string, field: keyof ClassScheduleItem, value: any) => {
        if (field === 'date') {
            handleDateChange(id, value);
        } else {
            setPreviewSchedule(prev => prev.map(item => item.id === id ? { ...item, [field]: value } : item));
        }
    };

    const handleDateChange = (id: string, newDateStr: string) => {
        const index = previewSchedule.findIndex(item => item.id === id);
        if (index === -1) return;

        const oldDate = getLocalDate(previewSchedule[index].date);
        const newDate = getLocalDate(newDateStr);
        const diffTime = newDate.getTime() - oldDate.getTime();

        if (diffTime === 0) return;

        const updatedSchedule = [...previewSchedule];
        // Update current item
        updatedSchedule[index] = { ...updatedSchedule[index], date: newDateStr };

        // Update subsequent items
        for (let i = index + 1; i < updatedSchedule.length; i++) {
            const currentItemDate = getLocalDate(updatedSchedule[i].date);
            const nextDate = new Date(currentItemDate.getTime() + diffTime);
            updatedSchedule[i] = { ...updatedSchedule[i], date: nextDate.toISOString().split('T')[0] };
        }
        setPreviewSchedule(updatedSchedule);
    };

    const handleEditClass = (cls: ClassGroup) => {
        setIsEditing(true);
        isInitialEditLoad.current = true;
        setSelectedClass(cls);

        setNewClass({
            courseId: cls.courseId,
            includeSaturday: cls.includeSaturday,
            includeSunday: cls.includeSunday,
            hoursPerDay: cls.hoursPerDay,
            theoryStartDate: cls.theoryStartDate,
            practiceStartDate: cls.practiceStartDate,
            registrationNumber: cls.registrationNumber,
            capBa: cls.capBa,
            location: cls.location || ''
        });

        // Parse name for number/year (Assuming format "Name Number/Year")
        // Example: "CBA-2 20/2024"
        const parts = cls.name.split(' ');
        const lastPart = parts[parts.length - 1]; // "20/2024"
        if (lastPart && lastPart.includes('/')) {
            const [num, year] = lastPart.split('/');
            setClassNumber(num);
            setClassYear(year);
        } else {
            // Fallback if format is different
            setClassNumber('');
            setClassYear(new Date().getFullYear().toString());
        }

        // --- NEW: Pre-fill Default Instructors from Existing Schedule ---
        const course = courses.find(c => c.id === cls.courseId);
        const existingInstructors = new Set<string>();

        if (course) {
            cls.schedule.forEach(item => {
                const subject = course.subjects.find(s => s.id === item.subjectId);
                const isPractice = subject && (
                    (subject.modality as string) === 'Prática' ||
                    (subject.modality as string) === 'Pratica' ||
                    (subject.modality && (subject.modality as string).includes('Pr'))
                );

                if (isPractice && item.instructorIds && item.instructorIds.length > 0) {
                    item.instructorIds.forEach(id => existingInstructors.add(id));
                }
            });
        }

        setDefaultPracticeInstructors(Array.from(existingInstructors));
        // ----------------------------------------------------------------

        setPreviewSchedule(cls.schedule);
        setView('create');
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

        const clsData: ClassGroup = {
            id: isEditing && selectedClass ? selectedClass.id : crypto.randomUUID(),
            name: className,
            startDate: minDate.toISOString().split('T')[0],
            endDate: maxDate.toISOString().split('T')[0],
            courseId: newClass.courseId!,
            studentIds: isEditing && selectedClass ? selectedClass.studentIds : [],
            daysOfWeek: [],
            includeWeekends: false,
            includeSaturday: newClass.includeSaturday!,
            includeSunday: newClass.includeSunday!,
            hoursPerDay: newClass.hoursPerDay!,
            theoryStartDate: newClass.theoryStartDate,
            practiceStartDate: newClass.practiceStartDate,
            registrationNumber: newClass.registrationNumber,
            capBa: newClass.capBa,
            location: newClass.location,
            schedule: previewSchedule
        };

        if (isEditing && selectedClass) {
            updateClass(clsData);
        } else {
            addClass(clsData);
        }

        setView('list');
        resetForm();
        setIsEditing(false);
    };

    const resetForm = () => {
        setNewClass({
            includeSaturday: false,
            includeSunday: false,
            hoursPerDay: 8,
            theoryStartDate: '',
            practiceStartDate: '',
            registrationNumber: '',
            capBa: '',
            location: ''
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

    const confirmSwap = async () => {
        if (!swapItem || !swapTargetId || !selectedClass || !currentUser) return;
        if (isSubmitting) return;

        setIsSubmitting(true);
        try {
            const targetUser = users.find(u => u.id === swapTargetId);

            await requestSwap({
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
        } catch (error) {
            console.error(error);
            alert('Erro ao solicitar troca.');
        } finally {
            setIsSubmitting(false);
        }
    };


    const exportToPDF = async (cls: ClassGroup) => {
        const course = courses.find(c => c.id === cls.courseId);

        const tableData = cls.schedule.map(item => {
            const subject = course?.subjects.find(s => s.id === item.subjectId);

            const instructorNames = users
                .filter(u => item.instructorIds?.includes(u.id))
                .map(u => u.name.toUpperCase())
                .join(', ') || 'NÃO ATRIBUÍDO';

            const dateObj = getLocalDate(item.date);

            return [
                dateObj.toLocaleDateString('pt-BR'),
                `${item.startTime} ÀS ${item.endTime}`,
                item.moduleId.toUpperCase(),
                (subject?.name || '').toUpperCase(),
                item.duration,
                instructorNames
            ];
        });

        // Prepare Details
        const details = [
            { label: 'CURSO', value: course?.name || '' },
            { label: 'REGISTRO', value: cls.registrationNumber || 'N/A' }
        ];

        if (cls.capBa) details.push({ label: 'CAP-BA', value: cls.capBa });
        if (cls.location) details.push({ label: 'LOCALIDADE', value: cls.location });

        await generateStandardPDF({
            title: `CRONOGRAMA: ${cls.name}`,
            filename: `cronograma_${cls.name}`,
            details: details,
            table: {
                headers: ['DATA', 'HORÁRIO', 'MÓDULO', 'DISCIPLINA', 'TEMPOS', 'INSTRUTOR(ES)'],
                data: tableData
            },
            user: currentUser,
            backgroundImage: '/pdf-background.png'
        });
    };


    const getStatus = (cls: ClassGroup) => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const start = getLocalDate(cls.startDate);
        const end = getLocalDate(cls.endDate);

        if (today < start) return { label: 'A INICIAR', color: 'bg-blue-50 text-blue-700 border border-blue-200' };
        if (today > end) return { label: 'FINALIZADA', color: 'bg-transparent text-gray-600 border border-gray-200' };
        return { label: 'EM ANDAMENTO', color: 'bg-green-50 text-green-700 border border-green-200' };
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

        const moveScheduleItem = (index: number, direction: 'up' | 'down') => {
            if (!onUpdate) return;
            const newSchedule = [...schedule];

            if (direction === 'up') {
                if (index === 0) return;
                const temp = newSchedule[index];
                newSchedule[index] = newSchedule[index - 1];
                newSchedule[index - 1] = temp;
            } else {
                if (index === newSchedule.length - 1) return;
                const temp = newSchedule[index];
                newSchedule[index] = newSchedule[index + 1];
                newSchedule[index + 1] = temp;
            }

            setPreviewSchedule(newSchedule);
        };

        if (schedule.length === 0) return <div className="text-center py-8 text-gray-500 italic">Preencha as datas para gerar o cronograma.</div>;

        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        <thead>
                            <tr className="bg-white text-gray-700">
                                {!readOnly && <th className="px-2 py-3 text-center text-xs font-bold uppercase border border-gray-200 w-16 text-gray-700">Ordem</th>}
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-gray-200 text-gray-700">DATA</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-gray-200 text-gray-700">HORÁRIO</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-gray-200 min-w-[150px] text-gray-700">MÓDULO</th>
                                <th className="px-4 py-3 text-left text-xs font-bold uppercase border border-gray-200 min-w-[300px] text-gray-700">DISCIPLINA</th>
                                <th className="px-2 py-3 text-center text-xs font-bold uppercase border border-gray-200 text-gray-700">TEMPOS</th>
                                <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-gray-200 min-w-[280px] text-gray-700">INSTRUTOR(ES)</th>
                                {readOnly && currentUser?.role === UserRole.INSTRUTOR && <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-gray-200 text-gray-700">AÇÕES</th>}
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
                                        {!readOnly && (
                                            <td className="px-2 py-2 border border-gray-200 text-center bg-white">
                                                <div className="flex flex-col items-center gap-1">
                                                    <button
                                                        onClick={() => moveScheduleItem(index, 'up')}
                                                        disabled={index === 0}
                                                        className={`text-orange-500 p-0.5 transition-transform hover:scale-110 ${index === 0 ? 'opacity-30 cursor-not-allowed' : 'hover:text-orange-700'}`}
                                                        title="Mover para cima"
                                                    >
                                                        <ArrowUp size={16} />
                                                    </button>
                                                    <button
                                                        onClick={() => moveScheduleItem(index, 'down')}
                                                        disabled={index === schedule.length - 1}
                                                        className={`text-orange-500 p-0.5 transition-transform hover:scale-110 ${index === schedule.length - 1 ? 'opacity-30 cursor-not-allowed' : 'hover:text-orange-700'}`}
                                                        title="Mover para baixo"
                                                    >
                                                        <ArrowDown size={16} />
                                                    </button>
                                                </div>
                                            </td>
                                        )}
                                        {showDate && (
                                            <td rowSpan={dateSpan} className="px-4 py-2 whitespace-nowrap text-sm font-bold text-gray-900 bg-white border border-gray-200 text-center align-middle">
                                                {readOnly ? dateObj.toLocaleDateString('pt-BR') : (
                                                    <input type="date" value={item.date} onChange={e => onUpdate && onUpdate(item.id, 'date', e.target.value)} className="bg-transparent border-none text-center focus:ring-0 p-0 text-sm font-bold text-gray-900" />
                                                )}
                                            </td>
                                        )}
                                        <td className="px-4 py-2 whitespace-nowrap text-sm text-gray-900 border border-gray-200 text-center bg-white font-medium">
                                            {readOnly ? `${item.startTime} às ${item.endTime}` : (
                                                <div className="flex items-center justify-center space-x-1">
                                                    <input type="time" value={item.startTime} onChange={e => onUpdate && onUpdate(item.id, 'startTime', e.target.value)} className="w-16 bg-white rounded border border-gray-300 text-xs p-1 focus:ring-0 text-center text-gray-900" />
                                                    <span className="text-gray-900">-</span>
                                                    <input type="time" value={item.endTime} onChange={e => onUpdate && onUpdate(item.id, 'endTime', e.target.value)} className="w-16 bg-white rounded border border-gray-300 text-xs p-1 focus:ring-0 text-center text-gray-900" />
                                                </div>
                                            )}
                                        </td>
                                        {showModule && (
                                            <td rowSpan={moduleSpan} className="px-4 py-2 text-sm text-gray-900 border border-gray-200 text-center align-middle bg-white font-bold break-words uppercase">
                                                {item.moduleId}
                                            </td>
                                        )}
                                        <td className="px-4 py-2 text-sm font-medium text-gray-900 border border-gray-200 bg-white break-words uppercase">
                                            {subject?.name}
                                            <div className="text-xs text-gray-500 font-normal uppercase">{subject?.modality}</div>
                                        </td>
                                        <td className="px-4 py-2 text-sm text-gray-900 border border-gray-200 text-center bg-white">
                                            {item.duration}
                                        </td>
                                        <td className="px-2 py-1 border border-gray-200 bg-white">
                                            <MultiSelect
                                                options={instructors}
                                                selectedIds={item.instructorIds || []}
                                                onChange={(ids) => readOnly ? assignInstructor(selectedClass!.id, item.id, ids) : (onUpdate && onUpdate(item.id, 'instructorIds', ids))}
                                                readOnly={readOnly && currentUser?.role === UserRole.INSTRUTOR} // Instructors can't change assignments directly
                                            />
                                        </td>
                                        {readOnly && currentUser?.role === UserRole.INSTRUTOR && (
                                            <td className="px-2 py-1 border border-gray-200 text-center bg-white">
                                                {isAssignedToMe && (
                                                    <button
                                                        onClick={() => handleSwapClick(item)}
                                                        className="btn-base btn-edit px-3 py-1 text-xs"
                                                        title="Solicitar Troca"
                                                    >
                                                        TROCAR
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
    const selectedCourseName = courses.find(c => c.id === newClass.courseId)?.name;
    const isCBAATModuloResgate = selectedCourseName?.includes('Módulo Resgate');

    // Scroll to top when view changes to create
    useEffect(() => {
        if (view === 'create') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        }
    }, [view]);

    // --- Render Helpers ---

    const renderCreateModal = () => {
        if (view !== 'create') return null;
        return (
            <StandardModal isOpen={true} onClose={() => { setView('list'); resetForm(); setIsEditing(false); }}>
                <StandardModalHeader title="NOVA TURMA" onClose={() => { setView('list'); resetForm(); setIsEditing(false); }} />
                <StandardModalBody>
                    <div className="p-6 overflow-y-auto flex-grow">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                            <div className="space-y-4">
                                <div>
                                    <StandardSelect
                                        label="CURSO"
                                        placeholder="Selecione um curso..."
                                        options={courses.map(c => ({ value: c.id, label: c.name }))}
                                        value={newClass.courseId || ''}
                                        onChange={e => setNewClass({ ...newClass, courseId: e.target.value })}
                                        className="mb-1"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Nº TURMA</label>
                                        <input type="number" className={inputClass} value={classNumber} onChange={e => setClassNumber(e.target.value)} placeholder="ex: 20" />
                                    </div>
                                    <div>
                                        <label className={labelClass}>ANO</label>
                                        <input type="number" className={inputClass} value={classYear} onChange={e => setClassYear(e.target.value)} />
                                    </div>
                                </div>
                                {!isCBAATModuloResgate && (
                                    <>
                                        <div>
                                            <label className={labelClass}>REGISTRO</label>
                                            <input type="text" maxLength={4} className={inputClass} value={newClass.registrationNumber} onChange={e => setNewClass({ ...newClass, registrationNumber: e.target.value.toUpperCase() })} />
                                        </div>
                                        {selectedCourseType !== CourseType.CBA_CE && (
                                            <div>
                                                <label className={labelClass}>CAP-BA</label>
                                                <input type="text" maxLength={4} className={inputClass} value={newClass.capBa} onChange={e => setNewClass({ ...newClass, capBa: e.target.value.toUpperCase() })} />
                                            </div>
                                        )}
                                    </>
                                )}
                            </div>
                            <div className="space-y-6">
                                <div className="space-y-4">
                                    <div>
                                        <label className={labelClass}>LOCALIDADE</label>
                                        <input type="text" className={inputClass} value={newClass.location || ''} onChange={e => setNewClass({ ...newClass, location: e.target.value.toUpperCase() })} />
                                    </div>
                                    {!isCBAATModuloResgate && (
                                        <div>
                                            <label className="block text-xs font-bold login-uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>INÍCIO AULAS TEÓRICAS</label>
                                            <input type="date" className={inputClass} value={newClass.theoryStartDate || ''} onChange={e => setNewClass({ ...newClass, theoryStartDate: e.target.value })} />
                                        </div>
                                    )}
                                    <div>
                                        <label className="block text-xs font-bold login-uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>INÍCIO AULAS PRÁTICAS</label>
                                        <input type="date" className={inputClass} value={newClass.practiceStartDate || ''} onChange={e => setNewClass({ ...newClass, practiceStartDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-bold login-uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>HORAS/DIA</label>
                                        <input type="number" className={inputClass} value={newClass.hoursPerDay} onChange={e => setNewClass({ ...newClass, hoursPerDay: parseInt(e.target.value) })} />
                                    </div>
                                </div>
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100 shadow-sm">
                                    <h3 className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3 flex items-center">
                                        <span className="w-2 h-2 bg-primary-500 rounded-full mr-2"></span>
                                        CONFIGURAÇÃO
                                    </h3>
                                    <div className="space-y-3">
                                        <label className="flex items-center space-x-3 p-2 hover:bg-white rounded transition cursor-pointer">
                                            <input type="checkbox" className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition" checked={newClass.includeSaturday} onChange={e => setNewClass({ ...newClass, includeSaturday: e.target.checked })} />
                                            <span className="text-sm font-bold login-uppercase tracking-wider" style={{ color: '#6B7280' }}>INCLUIR SÁBADOS</span>
                                        </label>
                                        <label className="flex items-center space-x-3 p-2 hover:bg-white rounded transition cursor-pointer">
                                            <input type="checkbox" className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded transition" checked={newClass.includeSunday} onChange={e => setNewClass({ ...newClass, includeSunday: e.target.checked })} />
                                            <span className="text-sm font-bold login-uppercase tracking-wider" style={{ color: '#6B7280' }}>INCLUIR DOMINGOS</span>
                                        </label>
                                    </div>
                                    {!isCBAATModuloResgate && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <label className="block text-xs font-bold login-uppercase tracking-wider mb-1" style={{ color: '#6B7280' }}>INSTRUTOR PADRÃO (PRÁTICA)</label>
                                            <MultiSelect options={instructors} selectedIds={defaultPracticeInstructors} onChange={setDefaultPracticeInstructors} />
                                            <p className="text-xs text-gray-500 mt-1">Atribuído automaticamente às aulas práticas.</p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="mt-8">
                            <div className="flex justify-between items-center mb-4">
                            </div>
                            <ScheduleTable schedule={previewSchedule} onUpdate={updatePreviewItem} />
                        </div>
                    </div>
                </StandardModalBody>
                <StandardModalFooter>
                    <div className="flex justify-end gap-3 p-4">
                        <button onClick={() => { setView('list'); resetForm(); }} className="btn-base btn-delete px-6 py-2.5 text-xs">CANCELAR</button>
                        <button onClick={handleSaveClass} className="btn-base btn-save px-8 py-2.5">SALVAR TURMA</button>
                    </div>
                </StandardModalFooter>
            </StandardModal>
        );
    };

    const renderDetailsModal = () => {
        if (view !== 'details' || !selectedClass) return null;
        const course = courses.find(c => c.id === selectedClass.courseId);
        return (
            <StandardModal isOpen={true} onClose={() => setView('list')}>
                <StandardModalHeader title={selectedClass.name} onClose={() => setView('list')} />
                <StandardModalBody>
                    <div className="p-6">
                        <ScheduleTable schedule={selectedClass.schedule} readOnly={true} />

                        {/* Swap Modal Nested */}
                        {swapModalOpen && (
                            <div className="fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-backdrop">
                                <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl animate-scale-in">
                                    <h3 className="text-lg font-bold mb-4">Solicitar Permuta de Aula</h3>
                                    <p className="text-sm text-gray-600 mb-4">
                                        Data: {new Date(swapItem?.date || '').toLocaleDateString()} <br />
                                        Horário: {swapItem?.startTime} - {swapItem?.endTime}
                                    </p>
                                    <div className="mb-4">
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione o Instrutor Substituto</label>
                                        <select className={inputClass} value={swapTargetId} onChange={e => setSwapTargetId(e.target.value)}>
                                            <option value="">Selecione...</option>
                                            {instructors.filter(u => u.id !== currentUser?.id).map(u => (
                                                <option key={u.id} value={u.id}>{u.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div className="flex justify-end space-x-2">
                                        <button onClick={() => setSwapModalOpen(false)} className="btn-premium btn-premium-orange btn-premium-shimmer px-4 py-2 login-uppercase">CANCELAR</button>
                                        <button onClick={confirmSwap} className="btn-premium btn-premium-orange btn-premium-shimmer px-4 py-2 login-uppercase">SOLICITAR</button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </StandardModalBody>
            </StandardModal>
        );
    };

    // Derived Data for Filters
    const availableYears = Array.from(new Set(classes.map(c => new Date(c.startDate).getFullYear()))).sort((a, b) => b - a);

    const filteredClasses = classes.filter(cls => {
        const matchesCourse = selectedCourseFilter ? cls.courseId === selectedCourseFilter : true;
        const matchesYear = selectedYearFilter ? new Date(cls.startDate).getFullYear().toString() === selectedYearFilter : true;
        return matchesCourse && matchesYear;
    }).sort((a, b) => {
        const dateA = new Date(a.theoryStartDate || a.startDate).getTime();
        const dateB = new Date(b.theoryStartDate || b.startDate).getTime();
        return dateB - dateA; // Descending (Newest first)
    });

    const totalPages = Math.ceil(filteredClasses.length / ITEMS_PER_PAGE);
    const displayedClasses = filteredClasses.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

    // List View
    return (
        <>
            {renderCreateModal()}
            {renderDetailsModal()}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto">
                        {/* Filters */}
                        <div className="w-full md:w-64">
                            <StandardSelect
                                placeholder="TODOS OS CURSOS"
                                options={courses.map(c => ({ value: c.id, label: c.name }))}
                                value={selectedCourseFilter}
                                onChange={e => { setSelectedCourseFilter(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        <div className="w-full md:w-48">
                            <StandardSelect
                                placeholder="TODOS OS ANOS"
                                options={availableYears.map(year => ({ value: year, label: year.toString() }))}
                                value={selectedYearFilter}
                                onChange={e => { setSelectedYearFilter(e.target.value); setCurrentPage(1); }}
                            />
                        </div>

                        {canEdit && (
                            <button
                                onClick={() => setView('create')}
                                className="btn-base btn-insert flex items-center justify-center px-6 py-2"
                            >
                                <span className="">INSERIR</span>
                            </button>
                        )}
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {displayedClasses.length === 0 && (
                        <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                            <p className="text-gray-500">Nenhuma turma encontrada com os filtros selecionados.</p>
                        </div>
                    )}
                    {displayedClasses.map(cls => {
                        const course = courses.find(c => c.id === cls.courseId);
                        const status = getStatus(cls);

                        return (
                            <StandardCard
                                key={cls.id}
                                onClick={() => {
                                    if (cls && cls.id && cls.schedule) {
                                        setSelectedClass(cls);
                                        setView('details');
                                    } else {
                                        console.error('Invalid class data:', cls);
                                        alert('Erro ao carregar dados da turma. Por favor, tente novamente.');
                                    }
                                }}
                                accentColor="#FF6B35"
                                className="flex flex-col h-full"
                            >
                                <div className="p-6 flex-1">
                                    <div className="flex justify-between items-start">
                                        <h3 className="text-lg font-bold login-uppercase" style={{ color: '#1F2937' }}>{cls.name}</h3>
                                    </div>


                                    <div className="mt-4 space-y-2">
                                        <div className="flex items-center text-xs text-gray-500 uppercase">
                                            <CalendarIcon size={16} className="mr-2" />
                                            {formatDate(cls.startDate)} - {formatDate(cls.endDate)}
                                        </div>
                                        <div className="flex items-center text-xs text-gray-500 uppercase">
                                            <Clock size={16} className="mr-2" />
                                            {cls.schedule.length} Blocos de Aula
                                        </div>
                                    </div>
                                    {cls.location && (
                                        <div className="text-xs text-gray-500 mt-1 break-words uppercase">
                                            <MapPin size={14} className="inline mr-1" />
                                            Local: {cls.location.toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <div className="bg-transparent px-6 py-3 border-t border-gray-100 flex justify-between items-center bg-gray-50/50">
                                    <span className={`text-xs font-medium px-2 py-1 rounded-full ${status.color}`}>
                                        {status.label}
                                    </span>
                                    <div className="flex space-x-2">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); exportToPDF(cls); }}
                                            className="btn-base btn-edit px-3 py-1 text-xs"
                                            title="Baixar PDF"
                                        >
                                            PDF
                                        </button>
                                        {(currentUser?.role === UserRole.GESTOR || currentUser?.role === UserRole.COORDENADOR) && (
                                            <>
                                                <button
                                                    onClick={(e) => { e.stopPropagation(); handleEditClass(cls); }}
                                                    className="btn-base btn-edit px-3 py-1 text-xs"
                                                    title="Editar Turma"
                                                >
                                                    EDITAR
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (window.confirm(`Tem certeza que deseja excluir a turma "${cls.name}"? Esta ação não pode ser desfeita.`)) {
                                                            deleteClass(cls.id);
                                                        }
                                                    }}
                                                    className="btn-base btn-delete px-3 py-1 text-xs"
                                                    title="Excluir Turma"
                                                >
                                                    EXCLUIR
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </StandardCard>
                        )
                    })}
                </div>

                {/* Pagination Controls */}
                {
                    totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                            <span className="text-sm text-gray-700 uppercase">
                                Mostrando <span className="font-medium">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredClasses.length)}</span> de <span className="font-medium">{filteredClasses.length}</span> resultados
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
                    )
                }
            </div>
        </>
    );
};
