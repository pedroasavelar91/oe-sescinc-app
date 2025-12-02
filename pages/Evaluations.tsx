
import React, { useState, useEffect } from 'react';
import { useStore } from '../context/AppStore';
import { EVALUATION_SCHEMAS } from '../constants';
import { CourseType, Student, GradeLog, EnrollmentStatus } from '../types';
import { Save, Edit2, X, FileText, User as UserIcon, Clock, Download } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const EvaluationsPage: React.FC = () => {
    const { classes, courses, students, updateStudent, currentUser, addGradeLog, gradeLogs } = useStore();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [isEditing, setIsEditing] = useState(false);
    const [tempGrades, setTempGrades] = useState<{ [studentId: string]: Student }>({});

    const selectedClass = classes.find(c => c.id === selectedClassId);
    const course = selectedClass ? courses.find(c => c.id === selectedClass.courseId) : null;

    console.log('🎓 Evaluations Debug:');
    console.log('  - Selected Class:', selectedClass);
    console.log('  - Selected Class studentIds:', selectedClass?.studentIds);
    console.log('  - All students in store:', students);
    console.log('  - Students count:', students.length);

    const classStudents = selectedClass ? students.filter(s => s.classId === selectedClass.id) : [];
    console.log('  - Filtered classStudents:', classStudents);
    console.log('  - Filtered count:', classStudents.length);

    const schema = course ? EVALUATION_SCHEMAS[course.type] || EVALUATION_SCHEMAS[CourseType.CUSTOM] : null;

    // Initialize temp grades when class is selected
    useEffect(() => {
        if (classStudents.length > 0) {
            const initialMap: { [key: string]: Student } = {};
            classStudents.forEach(s => initialMap[s.id] = { ...s });
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
            // Logic: Max(P1, Recuperação)
            const p1 = Number(newGrades['P1'] || 0);
            const rec = Number(newGrades['Recuperação'] || 0);
            finalTheory = Math.max(p1, rec);
        } else {
            // Custom / Default: Simple Average of all theory fields
            const theoryFields = schema?.theory || [];
            if (theoryFields.length > 0) {
                const sum = theoryFields.reduce((acc, field) => acc + Number(newGrades[field] || 0), 0);
                finalTheory = sum / theoryFields.length;
            }
        }

        // --- PRACTICE CALCULATION ---
        let finalPractical = 0;
        const practiceFieldsToAvg = schema?.avgPracticeFields || [];

        if (practiceFieldsToAvg.length > 0) {
            const sum = practiceFieldsToAvg.reduce((acc, field) => acc + Number(newGrades[field] || 0), 0);
            finalPractical = sum / practiceFieldsToAvg.length;
        }

        // --- FINAL CALCULATION ---
        const finalGrade = (finalTheory + finalPractical) / 2;

        return { finalTheory, finalPractical, finalGrade };
    };

    const handleGradeChange = (studentId: string, field: string, value: string) => {
        if (!isEditing) return;

        const student = tempGrades[studentId];
        if (!student) return;

        const isTimeField = schema?.timeFields?.includes(field);
        const parsedValue = isTimeField ? value : (value === '' ? 0 : parseFloat(value));

        const newGrades = { ...student.grades, [field]: parsedValue };
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
            // Criteria: Must be >= 7 in ALL three categories
            if (finalTheory >= 7 && finalPractical >= 7 && finalGrade >= 7) {
                newStatus = 'Aprovado';
            } else {
                newStatus = 'Reprovado';
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

    const handleSaveChanges = () => {
        if (!currentUser) return;

        // Persist changes to Store
        Object.values(tempGrades).forEach(s => updateStudent(s));

        // Create Log
        const log: GradeLog = {
            id: Math.random().toString(36).substr(2, 9),
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
            'Nome do Aluno',
            'Status',
            ...theoryHeaders.map(h => `Teoria: ${h}`),
            'Média Teórica',
            ...practiceHeaders.map(h => `Prática: ${h}`),
            'Média Prática',
            'Nota Final'
        ];

        // 2. Rows
        const rows = classStudents.map(student => {
            const s = tempGrades[student.id] || student;

            const theoryValues = theoryHeaders.map(col => s.grades[col] ?? 0);
            const practiceValues = practiceHeaders.map(col => s.grades[col] ?? 0);

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
        doc.text(`Avaliações - ${selectedClass.name}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Curso: ${course.name}`, 14, 22);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 27);

        // Headers
        const theoryHeaders = schema.theory;
        const practiceHeaders = schema.practice;

        const headers = [
            'Aluno',
            'Status',
            ...theoryHeaders,
            'Méd T',
            ...practiceHeaders,
            'Méd P',
            'Final'
        ];

        // Rows
        const tableData = classStudents.map(student => {
            const s = tempGrades[student.id] || student;

            const theoryValues = theoryHeaders.map(col => {
                const val = s.grades[col];
                return val !== undefined && val !== '' ? val.toString() : '-';
            });
            const practiceValues = practiceHeaders.map(col => {
                const val = s.grades[col];
                return val !== undefined && val !== '' ? val.toString() : '-';
            });

            return [
                s.name,
                s.enrollmentStatus,
                ...theoryValues,
                s.finalTheory?.toFixed(1) || '0.0',
                ...practiceValues,
                s.finalPractical?.toFixed(1) || '0.0',
                s.finalGrade?.toFixed(1) || '0.0'
            ];
        });

        autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: 32,
            styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
            headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { halign: 'left', cellWidth: 40 },
                1: { cellWidth: 20 }
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
        return '0.0';
    };

    const classGradeLogs = gradeLogs
        .filter(l => l.classId === selectedClassId)
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Avaliações e Notas</h1>
                    <p className="text-gray-500 mt-1">Gerencie notas e boletins</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm flex flex-col md:flex-row justify-between items-end md:items-center gap-4 border border-gray-100">
                <div className="w-full md:w-1/2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Turma</label>
                    <select className={`${inputClass}`} onChange={e => setSelectedClassId(e.target.value)} value={selectedClassId}>
                        <option value="">Selecione...</option>
                        {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                </div>

                {selectedClass && (
                    <div className="flex space-x-2">
                        <button
                            onClick={exportToCSV}
                            className="btn-premium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all"
                        >
                            <Download size={18} /> CSV
                        </button>
                        <button
                            onClick={exportToPDF}
                            className="btn-premium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 flex items-center gap-2 px-4 py-2 rounded-lg shadow-sm transition-all"
                        >
                            <FileText size={18} /> PDF
                        </button>

                        {!isEditing ? (
                            <button
                                onClick={() => setIsEditing(true)}
                                className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 transition"
                            >
                                <Edit2 size={18} />
                                <span>Editar Notas</span>
                            </button>
                        ) : (
                            <>
                                <button
                                    onClick={handleCancel}
                                    className="flex items-center space-x-2 bg-white border border-red-200 text-red-700 px-4 py-2 rounded-md hover:bg-red-50 transition"
                                >
                                    <X size={18} />
                                    <span>Cancelar</span>
                                </button>
                                <button
                                    onClick={handleSaveChanges}
                                    className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-6 py-2.5 rounded-lg shadow-md font-semibold transition-all duration-200"
                                >
                                    <Save size={18} />
                                    <span>Salvar Alterações</span>
                                </button>
                            </>
                        )}
                    </div>
                )}
            </div>

            {selectedClass && course && schema ? (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-x-auto">
                        <div className="min-w-max">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead>
                                    <tr className="bg-gray-50">
                                        <th rowSpan={2} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase sticky left-0 bg-gray-50 z-20 border-r border-gray-200 shadow-sm w-48">Aluno</th>
                                        <th rowSpan={2} className="px-2 py-3 text-center text-xs font-medium text-gray-500 uppercase border-r border-gray-200 w-24">Status</th>
                                        <th colSpan={schema.theory.length + 1} className="px-2 py-1 text-center text-xs font-bold text-white bg-blue-600 border-l border-white">Avaliação Teórica</th>
                                        <th colSpan={schema.practice.length + 1} className="px-2 py-1 text-center text-xs font-bold text-white bg-orange-600 border-l border-white">Avaliação Prática</th>
                                        <th rowSpan={2} className="px-2 py-3 text-center text-xs font-bold text-gray-900 uppercase bg-gray-100 sticky right-0 z-20 w-16 border-l border-gray-200">Média Final</th>
                                    </tr>
                                    <tr className="bg-gray-50">
                                        {/* Theory Columns */}
                                        {schema.theory.map(col => (
                                            <th key={col} className="px-2 py-2 text-center text-[10px] font-medium text-blue-800 uppercase border-l border-gray-200 w-16">{col}</th>
                                        ))}
                                        <th className="px-2 py-2 text-center text-[10px] font-bold text-blue-900 uppercase bg-blue-50 border-l border-gray-200 w-16">Final T.</th>

                                        {/* Practice Columns */}
                                        {schema.practice.map(col => (
                                            <th key={col} className="px-2 py-2 text-center text-[10px] font-medium text-orange-800 uppercase border-l border-gray-200 w-20">{col}</th>
                                        ))}
                                        <th className="px-2 py-2 text-center text-[10px] font-bold text-orange-900 uppercase bg-orange-50 border-l border-gray-200 w-16">Final P.</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {classStudents.map(student => {
                                        // Use tempGrades for rendering inputs
                                        const s = tempGrades[student.id] || student;

                                        const isApproved = s.enrollmentStatus === 'Aprovado';
                                        const isFailed = s.enrollmentStatus === 'Reprovado';
                                        const statusColor = isApproved ? 'text-green-600 bg-green-50' : isFailed ? 'text-red-600 bg-red-50' : 'text-gray-500';

                                        return (
                                            <tr key={s.id} className="hover:bg-gray-50">
                                                <td className="px-4 py-2 whitespace-nowrap sticky left-0 bg-white border-r border-gray-200 text-sm font-medium text-gray-900 z-10">
                                                    {s.name}
                                                </td>
                                                <td className="px-2 py-2 text-center border-r border-gray-200">
                                                    <span className={`text-[10px] px-2 py-1 rounded font-bold uppercase ${statusColor}`}>
                                                        {s.enrollmentStatus}
                                                    </span>
                                                </td>

                                                {/* Theory Inputs */}
                                                {schema.theory.map(col => (
                                                    <td key={col} className="px-1 py-1 border-l border-gray-100">
                                                        <input
                                                            className={gradeInputClass}
                                                            type="number" step="0.1" min="0" max="10"
                                                            placeholder="0.0"
                                                            value={s.grades[col] === undefined ? '' : s.grades[col]}
                                                            onChange={e => handleGradeChange(s.id, col, e.target.value)}
                                                            readOnly={!isEditing}
                                                        />
                                                    </td>
                                                ))}
                                                <td className={`px-1 py-1 bg-blue-50 font-bold text-center text-sm border-l border-blue-100 ${s.finalTheory < 7 ? 'text-red-600' : 'text-blue-900'}`}>
                                                    {s.finalTheory.toFixed(1)}
                                                </td>

                                                {/* Practice Inputs */}
                                                {schema.practice.map(col => (
                                                    <td key={col} className="px-1 py-1 border-l border-gray-100">
                                                        <input
                                                            className={gradeInputClass}
                                                            type={getInputType(col)}
                                                            step={getInputType(col) === 'number' ? "0.1" : undefined}
                                                            min={getInputType(col) === 'number' ? "0" : undefined}
                                                            max={getInputType(col) === 'number' ? "10" : undefined}
                                                            placeholder={formatPlaceholder(col)}
                                                            value={s.grades[col] === undefined ? '' : s.grades[col]}
                                                            onChange={e => handleGradeChange(s.id, col, e.target.value)}
                                                            readOnly={!isEditing}
                                                        />
                                                    </td>
                                                ))}
                                                <td className={`px-1 py-1 bg-orange-50 font-bold text-center text-sm border-l border-orange-100 ${s.finalPractical < 7 ? 'text-red-600' : 'text-orange-900'}`}>
                                                    {s.finalPractical.toFixed(1)}
                                                </td>
                                                <td className={`px-1 py-1 bg-gray-100 font-bold text-center text-sm sticky right-0 z-10 border-l border-gray-200 ${s.finalGrade < 7 ? 'text-red-600' : 'text-gray-900'}`}>
                                                    {s.finalGrade.toFixed(1)}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Audit Log Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center space-x-2">
                            <FileText size={18} className="text-gray-500" />
                            <h3 className="font-bold text-gray-900">Histórico de Alterações</h3>
                        </div>
                        {classGradeLogs.length === 0 ? (
                            <div className="p-6 text-center text-gray-400 text-sm italic">
                                Nenhum registro de alteração para esta turma.
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white">
                                        <tr>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data / Hora</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Responsável</th>
                                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Ação</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {classGradeLogs.map(log => (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center space-x-2">
                                                        <Clock size={14} className="text-gray-400" />
                                                        <span>{new Date(log.timestamp).toLocaleDateString()} {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                                    <div className="flex items-center space-x-2">
                                                        <UserIcon size={14} className="text-gray-400" />
                                                        <span>{log.userName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                                                    {log.details}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
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
