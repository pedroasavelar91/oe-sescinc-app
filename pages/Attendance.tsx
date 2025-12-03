import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { AttendanceLog, AttendanceStatus, EnrollmentStatus, ClassScheduleItem } from '../types';
import { Calendar, Check, Clock, X, ChevronRight, User as UserIcon, Save, Grid, List, Download, FileText } from 'lucide-react';
import { getCurrentDateString, formatDate } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface MatrixColumn {
    id: string;
    date: string;
    time: string;
    type: 'log' | 'schedule';
}

export const AttendancePage: React.FC = () => {
    const { classes, students, attendanceLogs, addAttendanceLog, currentUser, courses } = useStore();
    const [selectedClassId, setSelectedClassId] = useState('');
    const [viewMode, setViewMode] = useState<'history' | 'take' | 'matrix'>('history');

    // State for taking attendance
    const [attendanceDate, setAttendanceDate] = useState(getCurrentDateString());
    const [attendanceTime, setAttendanceTime] = useState(new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }));
    const [attendanceNotes, setAttendanceNotes] = useState('');

    // Status tracking: Present (Checked), Absent (Unchecked), Justified (Unchecked + text)
    const [presences, setPresences] = useState<{ [studentId: string]: boolean }>({});
    const [justifications, setJustifications] = useState<{ [studentId: string]: string }>({});

    const selectedClass = classes.find(c => c.id === selectedClassId);

    // Compute Students with Auto-Generated Matricula
    const classStudents = useMemo(() => {
        if (!selectedClassId || !selectedClass) return [];

        const filteredStudents = students
            .filter(s => s.classId === selectedClassId && (s.enrollmentStatus === 'Matriculado' || s.enrollmentStatus === 'Pendente'))
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
            id: Math.random().toString(36).substr(2, 9),
            classId: selectedClassId,
            date: attendanceDate,
            time: attendanceTime,
            timestamp: new Date().toISOString(),
            takenById: currentUser.id,
            takenByName: currentUser.name,
            notes: attendanceNotes,
            records
        };

        addAttendanceLog(log);
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
        if (col.type === 'schedule') return '-'; // Future

        // Find the specific log by ID
        const log = classLogs.find(l => l.id === col.id);
        if (!log) return '-';

        const record = log.records.find(r => r.studentId === studentId);
        if (!record) return '-';

        if (record.status === 'Presente') return 'P';
        if (record.status === 'Ausente') return 'F'; // Falta
        if (record.status === 'Justificado') return 'J';
        return '-';
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
        const headers = ['Aluno', '% Freq', ...dateHeaders];

        // Rows
        const rows = classStudents.map(student => {
            const stats = getAttendanceStats(student.id);
            const percentage = stats.percent.toFixed(0) + '%';

            const statuses = matrixColumns.map(col => {
                return getStudentStatusForColumn(student.id, col);
            });

            return [`"${student.name}"`, percentage, ...statuses].join(',');
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

        doc.setFontSize(16);
        doc.text(`Quadro de Frequência - ${selectedClass.name}`, 14, 15);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

        // Headers
        const dateHeaders = matrixColumns.map(col => {
            const [y, m, d] = col.date.split('-');
            return `${d}/${m}\n${col.time}`;
        });
        const headers = ['Aluno', '%', ...dateHeaders];

        // Rows
        const tableData = classStudents.map(student => {
            const stats = getAttendanceStats(student.id);
            const percentage = stats.percent.toFixed(0);

            const statuses = matrixColumns.map(col => {
                return getStudentStatusForColumn(student.id, col);
            });

            return [student.name, percentage, ...statuses];
        });

        autoTable(doc, {
            head: [headers],
            body: tableData,
            startY: 28,
            styles: { fontSize: 7, cellPadding: 1.5, halign: 'center' },
            headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
            columnStyles: {
                0: { halign: 'left', cellWidth: 50 },
                1: { cellWidth: 10 }
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

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Controle de Frequência</h1>
                    <p className="text-gray-500 mt-1">Gerencie presenças e ausências</p>
                </div>
            </div>

            <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100">
                <div className="flex flex-col md:flex-row gap-4 justify-between items-end">
                    <div className="w-full md:w-1/2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Selecione a Turma</label>
                        <select
                            className={`${inputClass}`}
                            value={selectedClassId}
                            onChange={e => { setSelectedClassId(e.target.value); setViewMode('history'); }}
                        >
                            <option value="">Selecione...</option>
                            {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>

                    {selectedClassId && viewMode !== 'take' && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setViewMode(viewMode === 'matrix' ? 'history' : 'matrix')}
                                className={`px-4 py-2 rounded-md border transition flex items-center gap-2 ${viewMode === 'matrix' ? 'bg-gray-100 border-gray-300 text-gray-900' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'}`}
                            >
                                {viewMode === 'matrix' ? <List size={18} /> : <Grid size={18} />}
                                <span>{viewMode === 'matrix' ? 'Ver Histórico' : 'Quadro de Frequência'}</span>
                            </button>

                            <button
                                onClick={handleStartAttendance}
                                className="btn-premium bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-4 py-2 rounded-lg transition-all duration-200 flex items-center justify-center space-x-2 shadow-md"
                            >
                                <Calendar size={18} />
                                <span>Registrar Frequência</span>
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {selectedClassId && viewMode === 'take' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden animate-fade-in">
                    <div className="p-6 border-b border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-lg font-bold text-gray-900">Registrar Chamada</h2>
                            <p className="text-sm text-gray-500">{selectedClass?.name}</p>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            <div className="flex gap-2">
                                <input
                                    type="date"
                                    className="border-gray-300 rounded-md text-sm bg-white text-gray-900"
                                    value={attendanceDate}
                                    onChange={e => setAttendanceDate(e.target.value)}
                                />
                                <input
                                    type="time"
                                    className="border-gray-300 rounded-md text-sm bg-white text-gray-900"
                                    value={attendanceTime}
                                    onChange={e => setAttendanceTime(e.target.value)}
                                />
                            </div>
                            <input
                                type="text"
                                placeholder="Observação (Ex: Aula Teórica)"
                                className="border-gray-300 rounded-md text-sm px-3 py-2 w-64 bg-white text-gray-900"
                                value={attendanceNotes}
                                onChange={e => setAttendanceNotes(e.target.value)}
                            />
                            <button onClick={() => setViewMode('history')} className="text-gray-400 hover:text-gray-600">
                                <X size={24} />
                            </button>
                        </div>
                    </div>

                    <div className="p-0 overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Aluno</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase w-24">Presença</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Justificativa (Se ausente)</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classStudents.map(s => {
                                    const isPresent = presences[s.id];

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="text-sm font-medium text-gray-900">{s.name}</div>
                                                <div className="text-xs text-gray-500">{s.matricula}</div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <div className="flex justify-center">
                                                    <input
                                                        type="checkbox"
                                                        checked={isPresent}
                                                        onChange={(e) => togglePresence(s.id, e.target.checked)}
                                                        className="h-5 w-5 text-primary-600 focus:ring-primary-500 border-gray-300 rounded cursor-pointer"
                                                    />
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                {!isPresent && (
                                                    <input
                                                        type="text"
                                                        placeholder="Digite o motivo..."
                                                        className="w-full border-gray-300 rounded-md text-sm px-2 py-1 bg-white text-gray-900 focus:ring-primary-500 focus:border-primary-500"
                                                        value={justifications[s.id]}
                                                        onChange={(e) => handleJustificationChange(s.id, e.target.value)}
                                                    />
                                                )}
                                                {isPresent && <span className="text-xs text-gray-400">-</span>}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    <div className="p-6 border-t border-gray-100 flex justify-end gap-3 bg-gray-50">
                        <button onClick={() => setViewMode('history')} className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 bg-white hover:bg-gray-100">
                            Cancelar
                        </button>
                        <button onClick={saveAttendance} className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-2.5 rounded-lg shadow-md font-semibold transition-all duration-200">
                            <Save size={18} />
                            <span>Salvar Lista</span>
                        </button>
                    </div>
                </div>
            )}

            {selectedClassId && viewMode === 'history' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100">
                        <h3 className="font-bold text-gray-900">Histórico de Chamadas</h3>
                    </div>
                    {classLogs.length === 0 ? (
                        <div className="p-8 text-center text-gray-500 italic">
                            Nenhuma lista de presença registrada para esta turma.
                        </div>
                    ) : (
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Data / Hora</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Turma</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Realizado Por</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Resumo</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {classLogs.map(log => {
                                        const counts = getStatusCounts(log);
                                        return (
                                            <tr key={log.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm font-medium text-gray-900">{formatDate(log.date)}</div>
                                                    <div className="text-xs text-gray-500">{log.time}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="text-sm text-gray-900">{selectedClass?.name}</div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap">
                                                    <div className="flex items-center space-x-2">
                                                        <UserIcon size={14} className="text-gray-400" />
                                                        <span className="text-sm text-gray-700">{log.takenByName}</span>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 whitespace-nowrap text-center">
                                                    <div className="flex justify-center space-x-2 text-xs">
                                                        <span className="px-2 py-1 rounded bg-green-100 text-green-800 font-medium" title="Presentes">P: {counts.Presente}</span>
                                                        <span className="px-2 py-1 rounded bg-red-100 text-red-800 font-medium" title="Ausentes">F: {counts.Ausente}</span>
                                                        {counts.Justificado > 0 && <span className="px-2 py-1 rounded bg-yellow-100 text-yellow-800 font-medium" title="Justificados">J: {counts.Justificado}</span>}
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            )}

            {selectedClassId && viewMode === 'matrix' && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                    <div className="p-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
                        <h3 className="font-bold text-gray-900">Quadro de Frequência</h3>
                        <div className="flex gap-4 text-xs">
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-green-500 mr-1"></span> Presente (P)</span>
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-red-500 mr-1"></span> Falta (F)</span>
                            <span className="flex items-center"><span className="w-2 h-2 rounded-full bg-yellow-500 mr-1"></span> Justificado (J)</span>
                        </div>
                        <button
                            onClick={handleExportMatrixCSV}
                            className="ml-4 flex items-center space-x-1 text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
                        >
                            <Download size={16} />
                            <span>CSV</span>
                        </button>
                        <button
                            onClick={handleExportMatrixPDF}
                            className="ml-2 flex items-center space-x-1 text-primary-600 hover:text-primary-800 text-sm font-medium transition-colors"
                        >
                            <FileText size={16} />
                            <span>PDF</span>
                        </button>
                    </div>

                    <div className="overflow-x-auto pb-2">
                        <table className="min-w-max divide-y divide-gray-200 border-collapse">
                            <thead>
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-bold text-gray-700 uppercase bg-gray-50 sticky left-0 z-10 border-r border-gray-200 min-w-[200px]">
                                        Aluno
                                    </th>
                                    <th className="px-2 py-2 text-center text-xs font-bold text-gray-700 uppercase bg-gray-100 border-r border-gray-200 w-16">
                                        % Freq.
                                    </th>
                                    {matrixColumns.map(col => {
                                        const [y, m, d] = col.date.split('-');
                                        return (
                                            <th key={col.id} className={`px-2 py-2 text-center text-xs font-medium border-r border-gray-200 w-14 ${col.type === 'log' ? 'bg-gray-100 text-gray-900' : 'bg-white text-gray-400'}`}>
                                                <div className="flex flex-col">
                                                    <span className="font-bold">{d}/{m}</span>
                                                    <span className="text-[10px]">{col.time}</span>
                                                </div>
                                            </th>
                                        );
                                    })}
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {classStudents.map(student => {
                                    const stats = getAttendanceStats(student.id);
                                    const percentage = stats.percent;

                                    return (
                                        <tr key={student.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2 text-sm font-medium text-gray-900 sticky left-0 bg-white border-r border-gray-200 z-10 shadow-sm">
                                                {student.name}
                                            </td>
                                            <td className="px-2 py-2 text-center border-r border-gray-100 bg-gray-50">
                                                <span className={`text-xs font-bold ${percentage < 75 ? 'text-red-600' : 'text-green-600'}`}>
                                                    {percentage.toFixed(0)}%
                                                </span>
                                            </td>
                                            {matrixColumns.map(col => {
                                                const status = getStudentStatusForColumn(student.id, col);
                                                let colorClass = "text-gray-300";

                                                if (status === 'P') colorClass = "text-green-600 bg-green-50 font-bold border border-green-100";
                                                if (status === 'F') colorClass = "text-red-600 bg-red-50 font-bold border border-red-100";
                                                if (status === 'J') colorClass = "text-yellow-600 bg-yellow-50 font-bold border border-yellow-100";

                                                // if it's a schedule column (future)
                                                if (col.type === 'schedule') colorClass = "text-gray-300";

                                                return (
                                                    <td key={col.id} className="px-2 py-2 text-center border-r border-gray-100">
                                                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded text-sm ${colorClass}`}>
                                                            {status}
                                                        </span>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};