import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { AttendanceLog, AttendanceStatus, EnrollmentStatus, ClassScheduleItem } from '../types';
import { Calendar, Check, Clock, X, ChevronRight, User as UserIcon, Save, Grid, List, Download, FileText } from 'lucide-react';
import { getCurrentDateString, formatDate } from '../utils/dateUtils';
import { formatCPF } from '../utils/formatters';
import { StandardSelect } from '../components/StandardSelect';
import { StandardModal, inputClass } from '../components/StandardModal';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MatrixColumn {
    id: string;
    date: string;
    time: string;
    type: 'log' | 'schedule';
}

export const AttendancePage: React.FC = () => {
    const {
        classes, students, courses, currentUser, attendanceLogs,
        addAttendanceLog, updateAttendanceLog
    } = useStore();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [viewMode, setViewMode] = useState<'history' | 'take' | 'matrix'>('history');
    const [editingLogId, setEditingLogId] = useState<string | null>(null);
    const [historyPage, setHistoryPage] = useState(1);
    const HISTORY_ITEMS_PER_PAGE = 10;
    const [matrixPage, setMatrixPage] = useState(1);
    const MATRIX_ITEMS_PER_PAGE = 10;

    // State for taking attendance
    const [attendanceDate, setAttendanceDate] = useState(getCurrentDateString());
    const [attendanceTime, setAttendanceTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const [attendanceNotes, setAttendanceNotes] = useState('');

    // Filters
    const [yearFilter, setYearFilter] = useState<string>('');
    const [courseFilter, setCourseFilter] = useState('');

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


    // Status tracking: Present (Checked), Absent (Unchecked), Justified (Unchecked + text)
    const [presences, setPresences] = useState<{ [studentId: string]: boolean }>({});
    const [justifications, setJustifications] = useState<{ [studentId: string]: string }>({});

    const selectedClass = classes.find(c => c.id === selectedClassId);

    // Compute Students with Auto-Generated Matricula
    const classStudents = useMemo(() => {
        if (!selectedClassId || !selectedClass) return [];

        const filteredStudents = students
            .filter(s => s.classId === selectedClassId)
            .sort((a, b) => a.name.localeCompare(b.name));

        const course = courses.find(c => c.id === selectedClass.courseId);
        let num = '00';
        let year = new Date().getFullYear().toString();

        if (selectedClass.name) {
            const parts = selectedClass.name.split(' ');
            const suffix = parts[parts.length - 1];
            if (suffix.includes('/')) {
                [num, year] = suffix.split('/');
            }
        }
        const courseName = course?.name.split(' ')[0] || 'CURSO';

        return filteredStudents.map((s, index) => {
            const formattedIndex = (index + 1).toString().padStart(2, '0');
            const matricula = `${formattedIndex}/${courseName}/Nº${num}-${year}`;
            return { ...s, matricula };
        });

    }, [students, selectedClassId, selectedClass, courses]);

    // History logs for selected class
    const classLogs = useMemo(() => {
        return attendanceLogs
            .filter(l => l.classId === selectedClassId)
            .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    }, [attendanceLogs, selectedClassId]);

    const handleStartAttendance = () => {
        if (!selectedClassId) return;
        setEditingLogId(null);
        // Initialize all as Present (checked)
        const initialPresences: { [key: string]: boolean } = {};
        const initialJustifications: { [key: string]: string } = {};

        classStudents.forEach(s => {
            initialPresences[s.id] = true;
            initialJustifications[s.id] = '';
        });

        setPresences(initialPresences);
        setJustifications(initialJustifications);
        setAttendanceDate(getCurrentDateString());
        setAttendanceTime(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
        setAttendanceNotes('');
        setViewMode('take');
    };

    const handleEditLog = (log: AttendanceLog) => {
        setEditingLogId(log.id);
        setAttendanceDate(log.date);
        setAttendanceTime(log.time);
        setAttendanceNotes(log.notes || '');

        const newPresences: { [key: string]: boolean } = {};
        const newJustifications: { [key: string]: string } = {};

        classStudents.forEach(s => {
            const record = log.records.find(r => r.studentId === s.id);
            if (record) {
                newPresences[s.id] = record.status === 'Presente';
                newJustifications[s.id] = record.justification || '';
            } else {
                newPresences[s.id] = false;
                newJustifications[s.id] = '';
            }
        });

        setPresences(newPresences);
        setJustifications(newJustifications);
        setViewMode('take');
    };

    const togglePresence = (studentId: string, checked: boolean) => {
        setPresences(prev => ({ ...prev, [studentId]: checked }));
        if (checked) {
            // Clear justification if marked present
            setJustifications(prev => ({ ...prev, [studentId]: '' }));
        }
    };

    const handleJustificationChange = (studentId: string, text: string) => {
        setJustifications(prev => ({ ...prev, [studentId]: text }));
    };

    const saveAttendance = () => {
        if (!currentUser || !selectedClassId) return;

        const records = classStudents.map(s => {
            const isPresent = presences[s.id];
            const justText = justifications[s.id];

            let status: AttendanceStatus = 'Ausente';
            if (isPresent) {
                status = 'Presente';
            } else if (justText && justText.trim().length > 0) {
                status = 'Justificado';
            }

            return {
                studentId: s.id,
                status,
                justification: status === 'Justificado' ? justText : undefined
            };
        });

        const log: AttendanceLog = {
            id: editingLogId || Math.random().toString(36).substr(2, 9),
            classId: selectedClassId,
            date: attendanceDate,
            time: attendanceTime,
            timestamp: editingLogId ? (classLogs.find(l => l.id === editingLogId)?.timestamp || new Date().toISOString()) : new Date().toISOString(),
            takenById: currentUser.id,
            takenByName: currentUser.name,
            notes: attendanceNotes,
            records
        };

        if (editingLogId) {
            updateAttendanceLog(log);
            setEditingLogId(null);
        } else {
            addAttendanceLog(log);
        }
        setViewMode('history');
    };

    const getStatusCounts = (log: AttendanceLog) => {
        const counts = { Presente: 0, Ausente: 0, Justificado: 0 };
        log.records.forEach(r => {
            if (counts[r.status] !== undefined) counts[r.status]++;
        });
        return counts;
    };

    // --- Matrix Logic ---
    const matrixColumns = useMemo(() => {
        if (!selectedClass) return [];

        const columns: MatrixColumn[] = [];

        // 1. Logs (Realized Calls) - Source of Truth for History
        // We use classLogs (sorted desc) but for columns we want ASC date
        const sortedLogs = [...classLogs].sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });

        sortedLogs.forEach(log => {
            columns.push({
                id: log.id,
                date: log.date,
                time: log.time,
                type: 'log'
            });
        });

        // 2. Future Schedule - Source of Truth for Projection
        // We only show scheduled items that are strictly in the future (Date > Today)
        // This avoids cluttering today/past with "missed" schedule blocks if they weren't logged exactly as planned.
        const today = getCurrentDateString();

        // Filter schedule items
        const futureSchedule = selectedClass.schedule.filter(item => item.date > today);

        futureSchedule.forEach(item => {
            columns.push({
                id: item.id,
                date: item.date,
                time: item.startTime,
                type: 'schedule'
            });
        });

        // Final Sort by Date then Time
        return columns.sort((a, b) => {
            if (a.date !== b.date) return a.date.localeCompare(b.date);
            return a.time.localeCompare(b.time);
        });
    }, [classLogs, selectedClass]);

    const getStudentStatusForColumn = (studentId: string, col: MatrixColumn) => {
        if (col.type === 'schedule') return { code: '-', text: undefined }; // Future

        // Find the specific log by ID
        const log = classLogs.find(l => l.id === col.id);
        if (!log) return { code: '-', text: undefined };

        const record = log.records.find(r => r.studentId === studentId);
        if (!record) return { code: '-', text: undefined };

        if (record.status === 'Presente') return { code: 'P', text: 'Presente' };
        if (record.status === 'Ausente') return { code: 'F', text: 'Ausente' }; // Falta
        if (record.status === 'Justificado') return { code: 'J', text: record.justification || 'Justificado' };
        return { code: '-', text: undefined };
    };

    const getAttendanceStats = (studentId: string) => {
        // Calculate ONLY based on Logs (Realized Classes)
        // Ignore scheduled columns
        const totalRealizedLogs = classLogs.length;

        if (totalRealizedLogs === 0) return { percent: 100 }; // Default start

        let presentCount = 0;

        classLogs.forEach(log => {
            const record = log.records.find(r => r.studentId === studentId);
            if (record && (record.status === 'Presente' || record.status === 'Justificado')) {
                presentCount++;
            }
        });

        return {
            percent: (presentCount / totalRealizedLogs) * 100
        };
    };

    const handleExportMatrixCSV = () => {
        if (!selectedClass) return;

        // Headers
        const dateHeaders = matrixColumns.map(col => {
            const [y, m, d] = col.date.split('-');
            return `${d}/${m} ${col.time}`;
        });
        const headers = ['Aluno', 'CPF', '% Freq', ...dateHeaders];

        // Rows
        const rows = classStudents.map(student => {
            const stats = getAttendanceStats(student.id);
            const percentage = stats.percent.toFixed(0) + '%';

            const statuses = matrixColumns.map(col => {
                return getStudentStatusForColumn(student.id, col).code;
            });

            return [`"${student.name}"`, `"${formatCPF(student.cpf)}"`, percentage, ...statuses].join(',');
        });

        const csvContent = [headers.join(','), ...rows].join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `frequencia_${selectedClass.name.replace(/\s+/g, '_')}.csv`;
        link.click();
    };

    const handleExportMatrixPDF = () => {
        if (!selectedClass) return;

        const doc = new jsPDF('l', 'mm', 'a4');

        doc.setFontSize(14);
        doc.text(`Quadro de Frequência - ${selectedClass.name}`, 14, 15);
        doc.setFontSize(10);
        // Timestamp removed as per request

        // Headers
        const dateHeaders = matrixColumns.map(col => {
            const [y, m, d] = col.date.split('-');
            return `${d}/${m}\n${col.time}`;
        });
        const headers = ['Aluno', 'CPF', '%', ...dateHeaders];

        // Rows
        const tableData = classStudents.map(student => {
            const stats = getAttendanceStats(student.id);
            const percentage = stats.percent.toFixed(0);

            const statuses = matrixColumns.map(col => {
                return getStudentStatusForColumn(student.id, col).code;
            });

            return [student.name, formatCPF(student.cpf), percentage, ...statuses];
        });

        autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: 28,
            styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
            headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { halign: 'left', cellWidth: 50 },
                1: { cellWidth: 35 }
            },
            didDrawPage: function (data) {
                const str = "INFORMAÇÃO EXTRAÍDA DO APLICATIVO DA OE-SESCINC MED MAIS. GERADO POR: " +
                    (currentUser?.name.toUpperCase() || 'USUÁRIO') + " - CPF: " + (currentUser?.cpf || '000.000.000-00') +
                    " EM " + new Date().toLocaleDateString('pt-BR') + " ÀS " + new Date().toLocaleTimeString('pt-BR') +
                    ". © OE-SESCINC MED MAIS. TODOS OS DIREITOS RESERVADOS.";

                doc.setFontSize(7);
                const pageSize = doc.internal.pageSize;
                const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
                const pageWidth = pageSize.width ? pageSize.width : pageSize.getWidth();

                const text = doc.splitTextToSize(str, pageWidth - 20);
                doc.text(text, pageWidth / 2, pageHeight - 10, { align: 'center' });
            },
            didParseCell: function (data) {
                if (data.section === 'body' && data.column.index > 1) {
                    const value = data.cell.raw;
                    if (value === 'P') {
                        data.cell.styles.fillColor = [220, 252, 231];
                        data.cell.styles.textColor = [22, 163, 74];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (value === 'F') {
                        data.cell.styles.fillColor = [254, 226, 226];
                        data.cell.styles.textColor = [220, 38, 38];
                        data.cell.styles.fontStyle = 'bold';
                    } else if (value === 'J') {
                        data.cell.styles.fillColor = [254, 249, 195];
                        data.cell.styles.textColor = [161, 98, 7];
                        data.cell.styles.fontStyle = 'bold';
                    }
                }
            },
            margin: { left: 14, right: 14 }
        });

        doc.save(`frequencia_${selectedClass.name.replace(/\s+/g, '_')}.pdf`);
    };



    return (
        <div className="space-y-6 animate-fade-in">
            {/* Header: Filters & Actions */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4 animate-slide-down">
                <div className="animate-fade-in delay-100 flex-1 w-full md:max-w-4xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <StandardSelect
                            label="ANO"
                            value={yearFilter}
                            onChange={e => { setYearFilter(e.target.value); setSelectedClassId(''); }}
                            options={[
                                { value: "", label: "TODOS" },
                                ...availableYears.map(y => ({ value: y, label: y }))
                            ]}
                        />
                        <StandardSelect
                            label="CURSO"
                            value={courseFilter}
                            onChange={e => { setCourseFilter(e.target.value); setSelectedClassId(''); }}
                            options={[
                                { value: "", label: "TODOS" },
                                ...availableCourses.map(c => ({ value: c.id, label: c.name.toUpperCase() }))
                            ]}
                        />
                        <StandardSelect
                            label="TURMA"
                            value={selectedClassId}
                            onChange={e => { setSelectedClassId(e.target.value); setViewMode('history'); }}
                            options={[
                                { value: "", label: "SELECIONE UMA TURMA" },
                                ...filteredClasses.map(c => ({ value: c.id, label: c.name.toUpperCase() }))
                            ]}
                        />
                    </div>
                </div>

                <div className="flex gap-2 w-full md:w-auto justify-end">
                    {selectedClassId && viewMode !== 'take' && (
                        <>
                            <button
                                onClick={() => setViewMode(viewMode === 'matrix' ? 'history' : 'matrix')}
                                className="btn-base btn-insert flex items-center justify-center px-6 py-3 text-sm font-bold"
                            >
                                {viewMode === 'matrix' ? 'HISTÓRICO' : 'QUADRO DE FREQUÊNCIA'}
                            </button>

                            <button
                                onClick={handleStartAttendance}
                                className="btn-base btn-insert flex items-center justify-center px-6 py-3 text-sm font-bold shadow-lg shadow-green-500/30"
                            >
                                NOVA CHAMADA
                            </button>
                        </>
                    )}
                </div>
            </div>

            {selectedClassId && viewMode === 'take' && (
                <div className="card-premium overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-200 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-gray-900 uppercase tracking-tight">{editingLogId ? 'EDITAR CHAMADA' : 'REGISTRAR CHAMADA'}</h2>
                            <p className="text-sm text-gray-500 uppercase mt-1">{selectedClass?.name}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    lang="pt-BR"
                                    className={inputClass}
                                    value={attendanceDate}
                                    onChange={e => setAttendanceDate(e.target.value)}
                                />
                                <input
                                    type="time"
                                    className={inputClass}
                                    value={attendanceTime}
                                    onChange={e => setAttendanceTime(e.target.value)}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="OBSERVAÇÃO (EX: AULA TEÓRICA)"
                                className={`${inputClass} w-64 uppercase`}
                                value={attendanceNotes}
                                onChange={e => setAttendanceNotes(e.target.value)}
                            />
                            <button onClick={() => setViewMode('history')} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">ALUNO</th>
                                    <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200 w-32">PRESENÇA</th>
                                    <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider border-b border-gray-200">JUSTIFICATIVA (SE AUSENTE)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classStudents.map(s => {
                                    const isPresent = presences[s.id];

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                                                <div className="text-sm font-bold text-gray-900 uppercase">{s.name}</div>
                                                <div className="text-xs text-gray-500 mt-1 uppercase">{s.matricula}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center border-b border-gray-100">
                                                <div className="flex justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isPresent}
                                                        onChange={(e) => togglePresence(s.id, e.target.checked)}
                                                        className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded cursor-pointer transition-all"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap border-b border-gray-100">
                                                {!isPresent && (
                                                    <input
                                                        type="text"
                                                        placeholder="DIGITE O MOTIVO..."
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50 text-gray-900 focus:ring-blue-500 focus:border-blue-500 transition-all uppercase"
                                                        value={justifications[s.id]}
                                                        onChange={(e) => handleJustificationChange(s.id, e.target.value)}
                                                    />
                                                )}
                                                {isPresent && <span className="text-xs text-gray-400 block text-center">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-gray-200 flex justify-end gap-3 bg-gray-50">
                        <button
                            onClick={() => setViewMode('history')}
                            className="btn-base bg-gray-500 text-white hover:bg-gray-600 shadow-lg shadow-gray-500/30 px-6 py-3 text-sm font-bold"
                        >
                            CANCELAR
                        </button>
                        <button
                            onClick={saveAttendance}
                            className="btn-base bg-green-600 text-white hover:bg-green-700 shadow-lg shadow-green-500/30 px-8 py-3 text-sm font-bold"
                        >
                            SALVAR LISTA
                        </button>
                    </div>
                </div>
            )}

            {selectedClassId && viewMode === 'history' && (
                <div className="card-premium overflow-hidden animate-slide-up">
                    {/* Title Removed as per request */}
                    {classLogs.length === 0 ? (
                        <div className="px-6 py-12 text-center text-gray-500 border border-gray-200">
                            <div className="flex flex-col items-center justify-center">
                                <List className="text-gray-300 mb-3" size={48} />
                                <p className="text-lg font-medium text-gray-900">NENHUM REGISTRO ENCONTRADO</p>
                                <p className="text-sm text-gray-500 uppercase">REGISTRE UMA NOVA CHAMADA PARA COMEÇAR.</p>
                            </div>
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-white">
                                    <tr>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">DATA / HORA</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">TURMA</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">REALIZADO POR</th>
                                        <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">RESUMO</th>
                                        {(currentUser?.role === 'Gestor' || currentUser?.role === 'Coordenador') && (
                                            <th className="px-6 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider border border-gray-200">AÇÕES</th>
                                        )}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {classLogs.slice((historyPage - 1) * HISTORY_ITEMS_PER_PAGE, historyPage * HISTORY_ITEMS_PER_PAGE).map(log => {
                                        const counts = getStatusCounts(log);
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-center">
                                                    <div className="text-sm font-medium text-gray-900 uppercase">{formatDate(log.date)}</div>
                                                    <div className="text-xs text-gray-500 uppercase">{log.time}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-center">
                                                    <div className="text-sm text-gray-900 uppercase">{selectedClass?.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap border border-gray-200 text-center">
                                                    <div className="flex items-center justify-center space-x-2">
                                                        <UserIcon size={14} className="text-gray-400" />
                                                        <span className="text-sm text-gray-700 uppercase">{log.takenByName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center border border-gray-200">
                                                    <div className="flex justify-center space-x-2 text-xs">
                                                        <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-bold uppercase" title="PRESENTES">P: {counts.Presente}</span>
                                                        <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-bold uppercase" title="AUSENTES">F: {counts.Ausente}</span>
                                                        {counts.Justificado > 0 && <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-bold uppercase" title="JUSTIFICADOS">J: {counts.Justificado}</span>}
                                                    </div>
                                                </td>
                                                {(currentUser?.role === 'Gestor' || currentUser?.role === 'Coordenador') && (
                                                    <td className="px-6 py-4 whitespace-nowrap text-center border border-gray-200">
                                                        <button
                                                            onClick={() => handleEditLog(log)}
                                                            className="btn-base btn-edit px-3 py-1 text-[10px]"
                                                            title="EDITAR CHAMADA"
                                                        >
                                                            EDITAR
                                                        </button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}

                    {classLogs.length > HISTORY_ITEMS_PER_PAGE && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl border border-gray-200">
                            <span className="text-sm text-gray-700 uppercase">
                                MOSTRANDO <span className="font-medium">{(historyPage - 1) * HISTORY_ITEMS_PER_PAGE + 1}</span> A <span className="font-medium">{Math.min(historyPage * HISTORY_ITEMS_PER_PAGE, classLogs.length)}</span> DE <span className="font-medium">{classLogs.length}</span> RESULTADOS
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setHistoryPage(p => Math.max(1, p - 1))}
                                    disabled={historyPage === 1}
                                    className="btn-base btn-pagination px-4 py-2 text-xs"
                                >
                                    ANTERIOR
                                </button>
                                <button
                                    onClick={() => setHistoryPage(p => Math.min(Math.ceil(classLogs.length / HISTORY_ITEMS_PER_PAGE), p + 1))}
                                    disabled={historyPage === Math.ceil(classLogs.length / HISTORY_ITEMS_PER_PAGE)}
                                    className="btn-base btn-pagination px-4 py-2 text-xs"
                                >
                                    PRÓXIMO
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {selectedClassId && viewMode === 'matrix' && (
                <div className="card-premium overflow-hidden">
                    <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
                        <div className="flex gap-4 text-xs font-medium uppercase">
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span> PRESENTE (P)</span>
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-2"></span> FALTA (F)</span>
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span> JUSTIFICADO (J)</span>
                        </div>
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={handleExportMatrixCSV}
                                className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 px-4 py-2 text-xs font-bold"
                            >
                                CSV
                            </button>
                            <button
                                onClick={handleExportMatrixPDF}
                                className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 px-4 py-2 text-xs font-bold"
                            >
                                PDF
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto pb-2">
                        <table className="min-w-max divide-y divide-gray-200 border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase bg-white sticky left-0 z-10 border border-gray-200 min-w-[200px] shadow-sm">
                                        ALUNO
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-white border border-gray-200 min-w-[120px]">
                                        CPF
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase bg-gray-50 border-r border-gray-200 w-20">
                                        % FREQ.
                                    </th>
                                    {matrixColumns.map(col => {
                                        const [y, m, d] = col.date.split('-');
                                        return (
                                            <th key={col.id} className={`px-2 py-2 text-center text-xs font-bold border-r border-gray-200 w-16 uppercase ${col.type === 'log' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-400'}`}>
                                                <div className="flex flex-col">
                                                    <span>{d}/{m}</span>
                                                    <span className="text-[10px] font-normal">{col.time}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classStudents.slice((matrixPage - 1) * MATRIX_ITEMS_PER_PAGE, matrixPage * MATRIX_ITEMS_PER_PAGE).map(student => {
                                    const stats = getAttendanceStats(student.id);
                                    const percentage = stats.percent;

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-3 py-2 text-xs font-medium text-gray-900 sticky left-0 bg-white border border-gray-200 z-10 shadow-sm">
                                                {student.name}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500 text-center border border-gray-200">
                                                {formatCPF(student.cpf)}
                                            </td>
                                            <td className="px-2 py-2 text-center border-r border-gray-100 bg-gray-50">
                                                <span className={`text-xs font-bold ${percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {percentage.toFixed(0)}%
                                                </span>
                                            </td>
                                            {matrixColumns.map(col => {
                                                const { code, text } = getStudentStatusForColumn(student.id, col);
                                                let colorClass = "text-gray-300";

                                                if (code === 'P') colorClass = "text-green-600 bg-green-50 font-bold border border-green-100";
                                                if (code === 'F') colorClass = "text-red-600 bg-red-50 font-bold border border-red-100";
                                                if (code === 'J') colorClass = "text-yellow-600 bg-yellow-50 font-bold border border-yellow-100";

                                                return (
                                                    <td key={col.id} className="px-2 py-2 text-center border-r border-gray-100">
                                                        <div className="relative group flex justify-center items-center">
                                                            <span
                                                                className={`inline-block w-6 h-6 leading-6 text-center text-xs rounded ${colorClass} ${code === 'J' ? 'cursor-help' : 'cursor-default'}`}
                                                            >
                                                                {code}
                                                            </span>
                                                            {code === 'J' && text && (
                                                                <div className="absolute bottom-full mb-2 hidden group-hover:block w-48 p-2 bg-gray-800 text-white text-xs rounded z-50 shadow-lg text-center left-1/2 -translate-x-1/2">
                                                                    {text}
                                                                    <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {classStudents.length > MATRIX_ITEMS_PER_PAGE && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-b-xl border border-gray-200">
                            <span className="text-sm text-gray-700 uppercase">
                                MOSTRANDO <span className="font-medium">{(matrixPage - 1) * MATRIX_ITEMS_PER_PAGE + 1}</span> A <span className="font-medium">{Math.min(matrixPage * MATRIX_ITEMS_PER_PAGE, classStudents.length)}</span> DE <span className="font-medium">{classStudents.length}</span> RESULTADOS
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => setMatrixPage(p => Math.max(1, p - 1))}
                                    disabled={matrixPage === 1}
                                    className="btn-base btn-pagination px-4 py-2 text-xs"
                                >
                                    ANTERIOR
                                </button>
                                <button
                                    onClick={() => setMatrixPage(p => Math.min(Math.ceil(classStudents.length / MATRIX_ITEMS_PER_PAGE), p + 1))}
                                    disabled={matrixPage === Math.ceil(classStudents.length / MATRIX_ITEMS_PER_PAGE)}
                                    className="btn-base btn-pagination px-4 py-2 text-xs"
                                >
                                    PRÓXIMO
                                </button>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};