
import React, { useState, useEffect, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { EVALUATION_SCHEMAS } from '../constants';
import { CourseType, Student, GradeLog, EnrollmentStatus } from '../types';
import { Save, Edit2, X, FileText, User as UserIcon, Clock, Download, ChevronLeft, ChevronRight } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const EvaluationsPage: React.FC = () => {
    const { classes, courses, students, updateStudent, currentUser, addGradeLog, gradeLogs } = useStore();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [courseFilter, setCourseFilter] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [tempGrades, setTempGrades] = useState<{ [studentId: string]: Student }>({});
    const [historyPage, setHistoryPage] = useState(1);
    const HISTORY_ITEMS_PER_PAGE = 5;

    // Pagination for Students Table
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    // Derived Data for Filters (Hierarchy: Active Classes -> Years -> Courses -> Classes)
    const activeClasses = useMemo(() => {
        return classes.filter(c => students.some(s => s.classId === c.id));
    }, [classes, students]);

    const availableYears = useMemo(() => {
        const years = new Set(activeClasses.map(c => new Date(c.startDate).getFullYear().toString()));
        return Array.from(years).sort((a, b) => b.localeCompare(a));
    }, [activeClasses]);

    const availableCourses = useMemo(() => {
        const coursesInActiveClasses = new Set(activeClasses.map(c => c.courseId));
        return courses.filter(c => coursesInActiveClasses.has(c.id));
    }, [activeClasses, courses]);

    const filteredClasses = useMemo(() => {
        return activeClasses.filter(c => {
            const matchesYear = yearFilter ? new Date(c.startDate).getFullYear().toString() === yearFilter : true;
            const matchesCourse = courseFilter ? c.courseId === courseFilter : true;
            return matchesYear && matchesCourse;
        });
    }, [activeClasses, yearFilter, courseFilter]);

    const selectedClass = classes.find(c => c.id === selectedClassId);
    const course = selectedClass ? courses.find(c => c.id === selectedClass.courseId) : null;

    console.log('🎓 Evaluations Debug:');
    console.log('  - Selected Class:', selectedClass);
    console.log('  - Selected Class studentIds:', selectedClass?.studentIds);
    console.log('  - All students in store:', students);
    console.log('  - Students count:', students.length);

    const classStudents = useMemo(() => {
        if (!selectedClass) return [];
        return students
            .filter(s => s.classId === selectedClass.id)
            .sort((a, b) => a.name.localeCompare(b.name));
    }, [selectedClass, students]);

    // Reset pagination when class changes
    useEffect(() => {
        setCurrentPage(1);
    }, [selectedClassId]);

    const totalPages = Math.ceil(classStudents.length / ITEMS_PER_PAGE);
    const paginatedStudents = classStudents.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    console.log('  - Filtered classStudents:', classStudents);
    console.log('  - Filtered count:', classStudents.length);

    const schema = course ? (EVALUATION_SCHEMAS as any)[course.type] || EVALUATION_SCHEMAS[CourseType.CUSTOM] : null;

    // Initialize temp grades when class is selected
    useEffect(() => {
        if (classStudents.length > 0) {
            const initialMap: { [key: string]: Student } = {};
            classStudents.forEach(s => {
                const formattedGrades = { ...s.grades };
                // Format existing numeric grades to 2 decimals
                Object.keys(formattedGrades).forEach(key => {
                    const val = formattedGrades[key];
                    if (typeof val === 'number') {
                        formattedGrades[key] = val.toFixed(2);
                    } else if (typeof val === 'string' && !isNaN(Number(val)) && val !== '' && !schema?.timeFields?.includes(key)) {
                        // Also format string numbers if they aren't time fields (like '10' -> '10.00')
                        formattedGrades[key] = parseFloat(val).toFixed(2);
                    }
                });
                initialMap[s.id] = { ...s, grades: formattedGrades };
            });
            setTempGrades(initialMap);
            setIsEditing(false);
        }
    }, [selectedClassId, students]); // Re-sync if store updates externally, but mainly on class switch

    const calculateGrades = (student: Student, newGrades: { [key: string]: number | string }) => {
        if (!course) return { finalTheory: 0, finalPractical: 0, finalGrade: 0 };

        const type = course.type;

        // --- THEORY CALCULATION ---
        let finalTheory = 0;

        if (type === CourseType.CBA_2 || type === CourseType.CBA_2_COMP) {
            // Logic: Average of P1, P2, P3. If Recuperação exists, consider the 3 highest notes among P1, P2, P3, Rec.
            const p1 = Number(newGrades['P1'] || 0);
            const p2 = Number(newGrades['P2'] || 0);
            const p3 = Number(newGrades['P3'] || 0);
            const rec = Number(newGrades['Recuperação'] || 0);

            const grades = [p1, p2, p3, rec];
            grades.sort((a, b) => b - a); // Sort descending
            const top3 = grades.slice(0, 3);
            const sum = top3.reduce((a, b) => a + b, 0);
            finalTheory = sum / 3;

        } else if (type === CourseType.CBA_AT || type === CourseType.CBA_CE) {
            // Logic for "Other courses" (Single Exam):
            // 1. P1 < 5 -> Immediate Fail? (User said: "Se houver ... nota menor que 5 o aluno é reprovado" for the previous case,
            //    for this one user said: "se p1 < 7 e >= 5 prova de recuperação")
            //    This implies < 5 is different. Usually < 5 is straight fail.
            // 2. Final = Max(P1, Rec) if Rec is present? 
            //    User said: "Média vai ser igual a maior nota" (Average will be the highest grade).

            const p1 = Number(newGrades['P1'] || 0);
            const rec = Number(newGrades['Recuperação'] || 0);

            // If P1 >= 7, P1 is the grade.
            // If P1 < 7, we check Rec.
            // "Média vai ser igual a maior nota"
            // So simply Max(P1, Rec).
            // Does Rec need to be >= 7 to count? User check: "essa ele deve tirar >=7"
            // "If p1 < 7 and >= 5 recovery exam -> on this he must get >= 7"
            // This sounds like a status check (Pass/Fail) rather than just the number calculation.
            // But for the *Final Number* calculation, "Média vai ser igual a maior nota" suggests simple Max.
            // HOWEVER, if Rec < 7, does it still replace P1? 
            // Logic: "he must get >= 7". If he gets 6 in Rec, he fails. 
            // The grade would be 6 (Max(P1, Rec) if P1 was 5).

            finalTheory = Math.max(p1, rec);

        } else {
            // Default/Legacy Logic
            const theoryFields = schema?.theory || [];
            if (theoryFields.length > 0) {
                const sum = theoryFields.reduce((acc: number, field: string) => acc + Number(newGrades[field] || 0), 0);
                finalTheory = sum / theoryFields.length;
            }
        }

        // --- PRACTICE CALCULATION ---
        let finalPractical = 0;
        const practiceFieldsToAvg = schema?.avgPracticeFields || [];

        if (practiceFieldsToAvg.length > 0) {
            const sum = practiceFieldsToAvg.reduce((acc: number, field: string) => acc + Number(newGrades[field] || 0), 0);
            finalPractical = sum / practiceFieldsToAvg.length;
        }

        // --- FINAL CALCULATION ---
        const finalGrade = (finalTheory + finalPractical) / 2;

        return { finalTheory, finalPractical, finalGrade };
    };

    const timeToSeconds = (timeStr: string | undefined): number => {
        if (!timeStr || typeof timeStr !== 'string' || !timeStr.includes(':')) return Infinity;
        const [mm, ss] = timeStr.split(':').map(Number);
        if (isNaN(mm) || isNaN(ss)) return Infinity;
        return (mm * 60) + ss;
    };

    const formatTimeInput = (value: string) => {
        const digits = value.replace(/\D/g, '');
        if (digits === '') return '';

        // Limit to 4 digits (mm:ss), taking the LAST 4 typed
        const limited = digits.slice(-4);
        const padded = limited.padStart(4, '0');
        return `${padded.slice(0, 2)}:${padded.slice(2)}`;
    };

    const handleGradeChange = (studentId: string, field: string, value: string) => {
        if (!isEditing) return;

        const student = tempGrades[studentId];
        if (!student) return;

        let parsedValue = value;

        // Ensure 'Erros' is integer string
        if (field === 'Erros' || field === 'Erro') {
            parsedValue = parsedValue.replace(/[^0-9]/g, '');
        }

        const newGrades = { ...student.grades, [field]: parsedValue };

        // --- AUTO-CALCULATE 'Nota TP/EPR' ---
        // Trigger if changing T1, T2 or Erros
        if (['T1 TP/EPR', 'T2 TP/EPR', 'Erros', 'Erro'].includes(field)) {
            const t1 = newGrades['T1 TP/EPR'] as string;
            const t2 = newGrades['T2 TP/EPR'] as string;
            const errors = newGrades['Erros'] || newGrades['Erro'];

            const t1Sec = timeToSeconds(t1);
            const t2Sec = timeToSeconds(t2);

            // "No TP/EPR sera considerado o menor tempo"
            const bestTime = Math.min(t1Sec, t2Sec);

            if (bestTime !== Infinity) {
                let calculatedGrade = 10;

                // "Para cada 10s acima de 1:30 (90s) no TP EPR a nota cai 1 ponto"
                if (bestTime > 90) {
                    const extraSeconds = bestTime - 90;
                    const timePenalty = Math.floor(extraSeconds / 10);
                    calculatedGrade -= timePenalty;
                }

                // "Cada erro retira 0,5 da nota"
                const errorCount = Number(errors);
                if (!isNaN(errorCount)) {
                    calculatedGrade -= (errorCount * 0.5);
                }

                // Clamp between 0 and 10 (assuming max is 10)
                calculatedGrade = Math.max(0, calculatedGrade);

                newGrades['Nota TP/EPR'] = calculatedGrade.toFixed(2);
            }
        }

        const { finalTheory, finalPractical, finalGrade } = calculateGrades(student, newGrades);

        // --- AUTO STATUS UPDATE LOGIC ---
        // Approved if ALL finals >= 7. Failed if ANY final < 7.
        // Only apply this logic if the student is currently Matriculado, Pendente, Aprovado or Reprovado (don't touch Cancelado/Desligado)
        let newStatus = student.enrollmentStatus;

        // Check if we have at least one valid grade entry to consider "grading started"
        // This prevents marking a student as Reprovado just because they have all 0s on initialization,
        // UNLESS the user is explicitly editing/saving them now.
        const hasGrades = Object.values(newGrades).some(v => v !== 0 && v !== '' && v !== '00:00');

        if (hasGrades && ['Matriculado', 'Pendente', 'Aprovado', 'Reprovado'].includes(newStatus)) {
            if (course?.type === CourseType.CBA_2) {
                // CBA-2 Status Logic
                // 1. Immediate Fail: P1, P2 or P3 < 5
                const p1 = Number(newGrades['P1'] || 0);
                const p2 = Number(newGrades['P2'] || 0);
                const p3 = Number(newGrades['P3'] || 0);

                const p1Entered = newGrades['P1'] !== undefined && newGrades['P1'] !== '';
                const p2Entered = newGrades['P2'] !== undefined && newGrades['P2'] !== '';
                const p3Entered = newGrades['P3'] !== undefined && newGrades['P3'] !== '';

                const p1Fail = p1Entered && p1 < 5;
                const p2Fail = p2Entered && p2 < 5;
                const p3Fail = p3Entered && p3 < 5;

                if (p1Fail || p2Fail || p3Fail) {
                    newStatus = 'Reprovado';
                } else {
                    if (finalGrade >= 7) {
                        newStatus = 'Aprovado';
                    } else {
                        newStatus = 'Reprovado';
                    }
                }
            } else if (course?.type === CourseType.CBA_AT || course?.type === CourseType.CBA_CE) {
                // Logic for Other Courses (Single Exam)
                // "Failure if Final < 7"
                // "If P1 >= 7 -> Approved" 
                // "If 5 <= P1 < 7 -> Recovery -> Must get >= 7"

                const p1 = Number(newGrades['P1'] || 0);
                const p1Entered = newGrades['P1'] !== undefined && newGrades['P1'] !== '';

                // Immediate fail check if P1 < 5
                if (p1Entered && p1 < 5) {
                    newStatus = 'Reprovado';
                } else {
                    // Check Final (which is Max(P1, Rec))
                    // Also strictly check theoretical component as per request "Para os demais cursos também, se a média teórica for menor que 7"
                    if (finalGrade >= 7 && finalTheory >= 7) {
                        newStatus = 'Aprovado';
                    } else {
                        newStatus = 'Reprovado';
                    }
                }

            } else {
                // Default Criteria: Must be >= 7 in ALL three categories
                if (finalTheory >= 7 && finalPractical >= 7 && finalGrade >= 7) {
                    newStatus = 'Aprovado';
                } else {
                    newStatus = 'Reprovado';
                }
            }
        }

        const updatedStudent = {
            ...student,
            grades: newGrades,
            finalTheory,
            finalPractical,
            finalGrade,
            enrollmentStatus: newStatus
        };

        setTempGrades(prev => ({ ...prev, [studentId]: updatedStudent }));
    };

    const handleBlur = (studentId: string, field: string, value: string) => {
        if (!isEditing) return;
        const isTimeField = schema?.timeFields?.includes(field);
        const isErrorField = field === 'Erros' || field === 'Erro';

        if (isTimeField || isErrorField) return;

        if (value !== '' && !isNaN(Number(value))) {
            const formatted = parseFloat(value).toFixed(2);
            if (formatted !== value) {
                handleGradeChange(studentId, field, formatted);
            }
        }
    };

    const handleSaveChanges = () => {
        if (!currentUser) return;

        // Persist changes to Store
        Object.values(tempGrades).forEach(s => updateStudent(s));

        // Create Log
        const log: GradeLog = {
            id: crypto.randomUUID(),
            classId: selectedClassId,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
            details: `Atualizou notas da turma ${selectedClass?.name}`
        };
        addGradeLog(log);

        setIsEditing(false);
    };

    const handleCancel = () => {
        // Revert to store state
        const initialMap: { [key: string]: Student } = {};
        classStudents.forEach(s => initialMap[s.id] = { ...s });
        setTempGrades(initialMap);
        setIsEditing(false);
    };

    const exportToCSV = () => {
        if (!selectedClass || !course || !schema) return;

        // 1. Headers
        const theoryHeaders = schema.theory;
        const practiceHeaders = schema.practice;

        const headers = [
            'NOME DO ALUNO',
            'STATUS',
            ...theoryHeaders.map((h: string) => `TEORIA: ${h.toUpperCase()}`),
            'MÉDIA TEÓRICA',
            ...practiceHeaders.map((h: string) => `PRÁTICA: ${h.toUpperCase()}`),
            'MÉDIA PRÁTICA',
            'NOTA FINAL'
        ];

        // 2. Rows
        const rows = classStudents.map((student: Student) => {
            const s = tempGrades[student.id] || student;

            const theoryValues = theoryHeaders.map((col: string) => s.grades[col] ?? 0);
            const practiceValues = practiceHeaders.map((col: string) => s.grades[col] ?? 0);

            return [
                s.name,
                s.enrollmentStatus,
                ...theoryValues,
                s.finalTheory?.toFixed(2) || '0.00',
                ...practiceValues,
                s.finalPractical?.toFixed(2) || '0.00',
                s.finalGrade?.toFixed(2) || '0.00'
            ];
        });

        // 3. Construct CSV Content
        const csvContent = [
            headers.join(','),
            ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
        ].join('\n');

        // 4. Download
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.setAttribute('href', url);
        link.setAttribute('download', `Notas_${selectedClass.name.replace(/\s+/g, '_')}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const exportToPDF = () => {
        if (!selectedClass || !course || !schema) return;

        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(16);
        doc.setFontSize(14);
        doc.text(`AVALIAÇÕES - ${selectedClass.name.toUpperCase()}`, 14, 15);

        // Removed as per request:
        // doc.text(`Curso: ${course.name}`, 14, 22);
        // doc.text(`Gerado em: ...`, 14, 27);

        // Headers
        const theoryHeaders = schema.theory;
        const practiceHeaders = schema.practice;

        const headers = [
            'ALUNO',
            'STATUS',
            ...theoryHeaders.map((h: string) => h.toUpperCase()),
            'MÉD T',
            ...practiceHeaders.map((h: string) => h.toUpperCase()),
            'MÉD P',
            'FINAL'
        ];

        // Rows
        const tableData = classStudents.map((student: Student) => {
            const s = tempGrades[student.id] || student;

            const theoryValues = theoryHeaders.map((col: string) => {
                const val = s.grades[col];
                return val !== undefined && val !== '' ? val.toString() : '-';
            });
            const practiceValues = practiceHeaders.map((col: string) => {
                const val = s.grades[col];
                return val !== undefined && val !== '' ? val.toString() : '-';
            });

            return [
                s.name.toUpperCase(),
                s.enrollmentStatus.toUpperCase(),
                ...theoryValues,
                s.finalTheory?.toFixed(2) || '0.00',
                ...practiceValues,
                s.finalPractical?.toFixed(2) || '0.00',
                s.finalGrade?.toFixed(2) || '0.00'
            ];
        });

        autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: 32,
            styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
            headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { halign: 'left' } // Removed fixed width to allow expansion
            },
            didParseCell: function (data) {
                if (data.section === 'body') {
                    // Color code final grades
                    const colIndex = data.column.index;
                    const theoryFinalCol = 2 + theoryHeaders.length;
                    const practiceFinalCol = theoryFinalCol + practiceHeaders.length + 1;
                    const finalCol = practiceFinalCol + 1;

                    if (colIndex === theoryFinalCol || colIndex === practiceFinalCol || colIndex === finalCol) {
                        const value = parseFloat(data.cell.raw as string);
                        if (!isNaN(value)) {
                            if (value >= 7) {
                                data.cell.styles.textColor = [22, 163, 74];
                                data.cell.styles.fontStyle = 'bold';
                            } else {
                                data.cell.styles.textColor = [220, 38, 38];
                                data.cell.styles.fontStyle = 'bold';
                            }
                        }
                    }
                }
            },
            didDrawPage: function (data) {
                const str = "INFORMAÇÃO EXTRAÍDA DO APLICATIVO DA OE-SESCINC MED MAIS. GERADO POR: " +
                    (currentUser?.name.toUpperCase() || 'USUÁRIO') + " - CPF: " + (currentUser?.cpf || '000.000.000-00') +
                    " EM " + new Date().toLocaleDateString('pt-BR') + " ÀS " + new Date().toLocaleTimeString('pt-BR') +
                    ". © OE-SESCINC MED MAIS. TODOS OS DIREITOS RESERVADOS.";

                doc.setFontSize(7);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                doc.text(str, data.settings.margin.left, pageHeight - 10);
            },
            margin: { left: 14, right: 14 }
        });

        doc.save(`Notas_${selectedClass.name.replace(/\s+/g, '_')}.pdf`);
    };

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";
    const gradeInputClass = `w-full text-center text-xs border rounded focus:ring-primary-500 focus:border-primary-500 px-1 py-1 transition-colors ${isEditing ? 'bg-white border-gray-300 text-gray-900' : 'bg-gray-50 border-transparent text-gray-600 cursor-default'}`;

    // Helper to determine input type
    const getInputType = (field: string) => {
        if (schema?.timeFields?.includes(field)) return 'text'; // For mm:ss
        return 'number';
    };

    const formatPlaceholder = (field: string) => {
        if (schema?.timeFields?.includes(field)) return 'mm:ss';
        return '0.00';
    };

    const abbreviateHeader = (header: string) => {
        const map: { [key: string]: string } = {
            'Recuperação': 'REC.',
            'T1 TP/EPR': 'T1 TP',
            'T2 TP/EPR': 'T2 TP',
            'Nota TP/EPR': 'NOTA TP',
            'Emerg. Químicas': 'EMERG. Q.',
            'Maneabilidade': 'MANEAB.',
            'Exerc. Fogo': 'EX. FOGO',
            'Com. Oral': 'COM. ORAL',
            'Liderança/Equipe': 'LIDERANÇA',
            'Desemp. Emergência': 'DESEMP.',
            'Gestão Emergência': 'GESTÃO',
            'Estudo Caso': 'EST. CASO',
            'Com. Escrita': 'COM. ESCR.',
            'Avaliação Prática': 'AVAL. PRÁT.'
        };
        return map[header] || header;
    };

    const allClassGradeLogs = gradeLogs
        .filter(l => l.classId === selectedClassId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const totalHistoryPages = Math.ceil(allClassGradeLogs.length / HISTORY_ITEMS_PER_PAGE);
    const classGradeLogs = allClassGradeLogs.slice(
        (historyPage - 1) * HISTORY_ITEMS_PER_PAGE,
        historyPage * HISTORY_ITEMS_PER_PAGE
    );

    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header: Filters & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-slide-down">
                <div className="flex flex-wrap gap-4 w-full md:w-auto items-end">
                    <div className="w-32">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">ANO</label>
                        <select
                            className={`${inputClass}`}
                            value={yearFilter}
                            onChange={e => { setYearFilter(e.target.value); setSelectedClassId(''); }}
                        >
                            <option value="">TODOS</option>
                            {availableYears.map((y: string) => <option key={y} value={y}>{y}</option>)}
                        </select>
                    </div>
                    <div className="w-48">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">CURSO</label>
                        <select
                            className={`${inputClass}`}
                            value={courseFilter}
                            onChange={e => { setCourseFilter(e.target.value); setSelectedClassId(''); }}
                        >
                            <option value="">TODOS</option>
                            {availableCourses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <div className="min-w-[250px]">
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">TURMA</label>
                        <select className={`${inputClass}`} onChange={e => setSelectedClassId(e.target.value)} value={selectedClassId}>
                            <option value="">SELECIONE UMA TURMA</option>
                            {filteredClasses.map((c: any) => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                    {selectedClass && (
                        <>
                            <button
                                onClick={exportToCSV}
                                className="btn-base btn-edit px-4 py-2 text-xs font-bold uppercase"
                            >
                                CSV
                            </button>
                            <button
                                onClick={exportToPDF}
                                className="btn-base btn-edit px-4 py-2 text-xs font-bold uppercase"
                            >
                                PDF
                            </button>

                            {!isEditing ? (
                                <button
                                    onClick={() => setIsEditing(true)}
                                    className="btn-base btn-insert px-6 py-2.5 text-xs font-bold uppercase"
                                >
                                    EDITAR NOTAS
                                </button>
                            ) : (
                                <>
                                    <button
                                        onClick={handleCancel}
                                        className="btn-base btn-cancel px-4 py-2 text-xs font-bold uppercase"
                                    >
                                        CANCELAR
                                    </button>
                                    <button
                                        onClick={handleSaveChanges}
                                        className="btn-base btn-success px-6 py-2.5 text-xs font-bold uppercase"
                                    >
                                        SALVAR
                                    </button>
                                </>
                            )}
                        </>
                    )}
                </div>
            </div>

            {selectedClass && course && schema ? (
                <>

                    <div className="card-premium overflow-hidden animate-slide-up">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200 border-collapse">
                                <thead className="bg-white">
                                    <tr>
                                        <th rowSpan={2} className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-white z-20 border border-gray-200 shadow-sm min-w-[250px]">Aluno</th>
                                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase border border-gray-200 w-24">Equipe</th>
                                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase border border-gray-200 w-28">Status</th>
                                        <th colSpan={schema.theory.length + 1} className="px-2 py-2 text-center text-xs font-bold text-white bg-blue-600 border border-white uppercase">Avaliação Teórica</th>
                                        <th colSpan={schema.practice.length + 1} className="px-2 py-2 text-center text-xs font-bold text-white bg-orange-600 border border-white uppercase">Avaliação Prática</th>
                                        <th rowSpan={2} className="px-3 py-3 text-center text-xs font-bold text-gray-900 uppercase bg-gray-100 sticky right-0 z-20 border border-gray-200 w-24">Média Final</th>
                                    </tr>
                                    <tr>
                                        {/* Theory Columns */}
                                        {schema.theory.map((col: string) => (
                                            <th key={col} className="px-2 py-2 text-center text-xs font-bold text-blue-800 uppercase border border-gray-200 w-24 min-w-[96px]">{abbreviateHeader(col)}</th>
                                        ))}
                                        <th className="px-2 py-2 text-center text-xs font-bold text-blue-900 uppercase bg-blue-50 border border-gray-200 w-24 min-w-[96px]">Final T.</th>

                                        {/* Practice Columns */}
                                        {schema.practice.map((col: string) => (
                                            <th key={col} className="px-2 py-2 text-center text-xs font-bold text-orange-800 uppercase border border-gray-200 w-24 min-w-[96px]">{abbreviateHeader(col)}</th>
                                        ))}
                                        <th className="px-2 py-2 text-center text-xs font-bold text-orange-900 uppercase bg-orange-50 border border-gray-200 w-24 min-w-[96px]">Final P.</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {paginatedStudents.map((student: Student) => {
                                        const s = isEditing && tempGrades[student.id] ? tempGrades[student.id] : student;
                                        // Ensure team is initialized if missing
                                        const currentTeam = s.team || '';

                                        const isApproved = s.enrollmentStatus === 'Aprovado';
                                        const isFailed = s.enrollmentStatus === 'Reprovado';
                                        const statusColor = isApproved ? 'text-green-600 bg-green-50' : isFailed ? 'text-red-600 bg-red-50' : 'text-gray-500';

                                        return (
                                            <tr key={student.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap sticky left-0 bg-white border border-gray-200 text-sm font-medium text-gray-900 z-10 shadow-sm text-left">
                                                    {student.name}
                                                </td>
                                                <td className="px-2 py-2 text-center border border-gray-200">
                                                    {isEditing ? (
                                                        <select
                                                            className="w-full text-xs text-center border-gray-300 rounded focus:ring-primary-500 focus:border-primary-500 p-1 bg-white"
                                                            value={currentTeam}
                                                            onChange={(e) => {
                                                                const val = e.target.value as any;
                                                                setTempGrades(prev => ({
                                                                    ...prev,
                                                                    [student.id]: { ...prev[student.id], team: val }
                                                                }));
                                                            }}
                                                        >
                                                            <option value="">-</option>
                                                            <option value="A">A</option>
                                                            <option value="B">B</option>
                                                            <option value="C">C</option>
                                                            <option value="D">D</option>
                                                            <option value="E">E</option>
                                                        </select>
                                                    ) : (
                                                        <span className="font-bold text-gray-600">{currentTeam || '-'}</span>
                                                    )}
                                                </td>
                                                <td className="px-2 py-3 text-center border border-gray-200">
                                                    <span className={`badge px-2 inline-flex text-[10px] leading-4 font-bold uppercase rounded-full ${statusColor}`}>
                                                        {s.enrollmentStatus}
                                                    </span>
                                                </td>

                                                {/* Theory Inputs */}
                                                {schema.theory.map((col: string) => {
                                                    const val = s.grades[col] === undefined ? '' : s.grades[col];
                                                    const isTimeField = schema.timeFields?.includes(col);
                                                    const isErrorField = col === 'Erros';

                                                    let displayValue = val;
                                                    // Standardize input height and text
                                                    let gradeInputClass = "w-full text-center text-xs py-1.5 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all ";

                                                    if (isErrorField) {
                                                        gradeInputClass += "border-red-200 bg-red-50 text-red-700 font-bold";
                                                    } else if (isTimeField) {
                                                        gradeInputClass += "border-gray-300 font-mono";
                                                    } else {
                                                        const numVal = Number(val);
                                                        if (val === '' || isNaN(numVal)) {
                                                            gradeInputClass += "border-gray-300 text-gray-400";
                                                        } else if (numVal >= 7) {
                                                            gradeInputClass += "border-green-200 bg-green-50 text-green-700 font-bold";
                                                        } else if (numVal >= 5) {
                                                            gradeInputClass += "border-yellow-200 bg-yellow-50 text-yellow-700 font-bold";
                                                        } else {
                                                            gradeInputClass += "border-red-200 bg-red-50 text-red-700 font-bold";
                                                        }
                                                    }

                                                    return (
                                                        <td key={`${col}-${student.id}`} className="px-2 py-2 border border-gray-200 text-center">
                                                            {isEditing ? (
                                                                <input
                                                                    type={isTimeField ? "text" : isErrorField ? "number" : "number"}
                                                                    step={isErrorField ? "1" : "0.01"}
                                                                    onKeyDown={(e) => {
                                                                        if (isErrorField && (e.key === '.' || e.key === ',' || e.key === 'e')) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                    className={gradeInputClass}
                                                                    value={displayValue}
                                                                    onChange={(e) => {
                                                                        let newVal = e.target.value;

                                                                        if (isErrorField) {
                                                                            // Integer only validation
                                                                            newVal = newVal.replace(/[^0-9]/g, '');
                                                                        } else if (isTimeField) {
                                                                            newVal = formatTimeInput(newVal);
                                                                        }

                                                                        handleGradeChange(student.id, col, newVal);
                                                                    }}
                                                                    onBlur={() => {
                                                                        if (isTimeField && displayValue) {
                                                                            // Auto format time? (Optional enhancement)
                                                                        } else if (!isTimeField && !isErrorField && displayValue !== '') {
                                                                            const num = parseFloat(Number(displayValue).toString()); // Clean leading zeros
                                                                            handleGradeChange(student.id, col, isNaN(num) ? '' : num.toFixed(2));
                                                                        }
                                                                    }}
                                                                    maxLength={isTimeField ? undefined : isErrorField ? 3 : 5}
                                                                    placeholder={isErrorField ? "0" : "-"}
                                                                />
                                                            ) : (
                                                                <span className={`text-xs ${isErrorField ? 'font-bold text-red-600' : ''}`}>
                                                                    {displayValue === '' || displayValue === undefined ? '-' : displayValue}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className={`px-2 py-2 bg-blue-50 font-bold text-center text-sm border border-gray-200 ${s.finalTheory < 7 ? 'text-red-600' : 'text-blue-900'}`}>
                                                    {s.finalTheory.toFixed(2)}
                                                </td>

                                                {/* Practice Inputs */}
                                                {schema.practice.map((col: string) => {
                                                    const val = s.grades[col] === undefined ? '' : s.grades[col];
                                                    const isTimeField = schema.timeFields?.includes(col);
                                                    const isErrorField = col === 'Erros' || col === 'Erro'; // Check for variations

                                                    let displayValue = val;
                                                    let gradeInputClass = "w-full text-center text-xs py-1.5 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition-all ";

                                                    if (isErrorField) {
                                                        gradeInputClass += "border-red-200 bg-red-50 text-red-700 font-bold";
                                                    } else if (isTimeField) {
                                                        gradeInputClass += "border-gray-300 font-mono";
                                                    } else {
                                                        const numVal = Number(val);
                                                        if (val === '' || isNaN(numVal)) {
                                                            gradeInputClass += "border-gray-300 text-gray-400";
                                                        } else if (numVal >= 7) {
                                                            gradeInputClass += "border-green-200 bg-green-50 text-green-700 font-bold";
                                                        } else if (numVal >= 5) {
                                                            gradeInputClass += "border-yellow-200 bg-yellow-50 text-yellow-700 font-bold";
                                                        } else {
                                                            gradeInputClass += "border-red-200 bg-red-50 text-red-700 font-bold";
                                                        }
                                                    }

                                                    return (
                                                        <td key={col} className="px-2 py-2 border border-gray-200 text-center">
                                                            {isEditing ? (
                                                                <input
                                                                    className={gradeInputClass}
                                                                    type={isTimeField ? "text" : "number"}
                                                                    step={isErrorField ? "1" : "0.25"}
                                                                    min={0}
                                                                    max={isErrorField ? undefined : 10}
                                                                    placeholder={isErrorField ? "0" : formatPlaceholder(col)}
                                                                    value={s.grades[col] === undefined ? '' : s.grades[col]}
                                                                    onChange={e => {
                                                                        let newVal = e.target.value;
                                                                        if (isErrorField) {
                                                                            newVal = newVal.replace(/[^0-9]/g, '');
                                                                        } else if (isTimeField) {
                                                                            newVal = formatTimeInput(newVal);
                                                                        }
                                                                        handleGradeChange(s.id, col, newVal);
                                                                    }}
                                                                    onKeyDown={(e) => {
                                                                        if (isErrorField && (e.key === '.' || e.key === ',' || e.key === 'e')) {
                                                                            e.preventDefault();
                                                                        }
                                                                    }}
                                                                />
                                                            ) : (
                                                                <span className={`text-xs ${isErrorField ? 'font-bold text-red-600' : ''}`}>
                                                                    {displayValue === '' || displayValue === undefined ? '-' : displayValue}
                                                                </span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className={`px-2 py-2 bg-orange-50 font-bold text-center text-sm border border-gray-200 ${s.finalPractical < 7 ? 'text-red-600' : 'text-orange-900'}`}>
                                                    {s.finalPractical.toFixed(2)}
                                                </td>
                                                <td className={`px-2 py-2 bg-gray-100 font-bold text-center text-sm sticky right-0 z-10 border border-gray-200 ${s.finalGrade < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {s.finalGrade.toFixed(2)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>


                        {/* Footer: Pagination for Students */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                                <span className="text-sm text-gray-700 uppercase">
                                    MOSTRANDO <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> A <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, classStudents.length)}</span> DE <span className="font-medium">{classStudents.length}</span> ALUNOS
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className={`btn-base btn-pagination px-4 py-2 text-xs ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Anterior"
                                    >
                                        ANTERIOR
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className={`btn-base btn-pagination px-4 py-2 text-xs ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Próximo"
                                    >
                                        PRÓXIMO
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Audit Log Section */}
                    <div className="card-premium overflow-hidden mt-6">
                        {/* Title removed as per request */}
                        {classGradeLogs.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm italic">
                                Nenhum registro de alteração para esta turma.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                                    <thead className="bg-white text-gray-700">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase border border-gray-200">Data / Hora</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase border border-gray-200">Responsável</th>
                                            <th className="px-4 py-3 text-left text-xs font-bold uppercase border border-gray-200">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {classGradeLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left border border-gray-200 w-48">
                                                    <div className="flex items-center space-x-2">
                                                        <Clock size={14} className="text-gray-400" />
                                                        <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900 text-left border border-gray-200 w-64">
                                                    <div className="flex items-center space-x-2">
                                                        <UserIcon size={14} className="text-gray-400" />
                                                        <span>{log.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-600 text-left border border-gray-200 uppercase">
                                                    {log.details}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                        {totalHistoryPages > 1 && (
                            <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                                <span className="text-sm text-gray-700 uppercase">
                                    MOSTRANDO <span className="font-medium">{(historyPage - 1) * HISTORY_ITEMS_PER_PAGE + 1}</span> A <span className="font-medium">{Math.min(historyPage * HISTORY_ITEMS_PER_PAGE, allClassGradeLogs.length)}</span> DE <span className="font-medium">{allClassGradeLogs.length}</span> RESULTADOS
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                        disabled={historyPage === 1}
                                        className={`btn-base btn-pagination px-4 py-2 text-xs ${historyPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Anterior"
                                    >
                                        ANTERIOR
                                    </button>
                                    <button
                                        onClick={() => setHistoryPage(p => Math.min(totalHistoryPages, p + 1))}
                                        disabled={historyPage === totalHistoryPages}
                                        className={`btn-base btn-pagination px-4 py-2 text-xs ${historyPage === totalHistoryPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        title="Próximo"
                                    >
                                        PRÓXIMO
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </>
            ) : (
                selectedClassId && (
                    <div className="bg-white p-8 text-center rounded-lg border border-gray-200 text-gray-500">
                        Selecione uma turma para visualizar as notas.
                    </div>
                )
            )}
        </div>
    );
};
