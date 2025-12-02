
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { Student, CourseType, EnrollmentStatus } from '../types';
import { Plus, Pencil, X, Trash2, Download, FileText } from 'lucide-react';
import { formatCPF } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const StudentsPage: React.FC = () => {
    const { students, classes, addStudent, updateStudent, deleteStudent, courses } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('');

    const [editingId, setEditingId] = useState<string | null>(null);
    const [studentForm, setStudentForm] = useState<Partial<Student>>({
        enrollmentStatus: 'Matriculado'
    });

    // Helper to get Course Letter code
    const getCourseLetter = (type: CourseType) => {
        switch (type) {
            case CourseType.CBA_2:
            case CourseType.CBA_2_COMP:
                return 'H';
            case CourseType.CBA_AT:
                return 'A';
            case CourseType.CBA_CE:
                return 'E';
            default:
                return 'X';
        }
    };

    // Helper to extract numeric part of Class Name "Curso 20/2025" -> 20 and Year
    const getClassDetails = (clsName: string) => {
        // Expected format: "Name Num/Year"
        const parts = clsName.split(' ');
        const suffix = parts[parts.length - 1]; // "20/2025"
        const [num, year] = suffix.split('/');
        return { num, year };
    };

    // --- Core Logic: Calculate Codes Dynamically ---
    const computedStudents = useMemo(() => {
        // Group by Class First
        const studentsByClass: { [key: string]: Student[] } = {};
        const unassignedStudents: Student[] = [];

        students.forEach(s => {
            if (s.classId) {
                if (!studentsByClass[s.classId]) studentsByClass[s.classId] = [];
                studentsByClass[s.classId].push(s);
            } else {
                unassignedStudents.push(s);
            }
        });

        let allComputed: any[] = [];

        // Process Unassigned
        unassignedStudents.forEach(s => {
            allComputed.push({ ...s, matricula: '-', registro: '-', capCode: '-', className: 'Sem Turma' });
        });

        // Process Assigned Classes
        Object.keys(studentsByClass).forEach(classId => {
            const cls = classes.find(c => c.id === classId);
            if (!cls) return;

            const course = courses.find(c => c.id === cls.courseId);
            const courseLetter = course ? getCourseLetter(course.type) : 'X';

            let num = '00';
            let year = new Date().getFullYear().toString();
            if (cls.name) {
                const parts = cls.name.split(' ');
                const suffix = parts[parts.length - 1];
                if (suffix.includes('/')) {
                    [num, year] = suffix.split('/');
                }
            }

            // Sort Alphabetically
            const sortedStudents = [...studentsByClass[classId]].sort((a, b) => a.name.localeCompare(b.name));

            let validStudentCounter = 0;

            sortedStudents.forEach((s, index) => {
                const listIndex = index + 1; // 1 to 40

                // 1. Matrícula: xx (2 digits) / Nome do Curso / Nº Turma - Ano
                // Ex: 35/CBA-AT/Nº20-2025
                const formattedIndex = listIndex.toString().padStart(2, '0');
                const matricula = `${formattedIndex} /${course?.name.split(' ')[0] || 'CURSO'}/Nº${num} -${year} `;

                let registro = '-';
                let capCode = '-';

                if (s.enrollmentStatus !== 'Cancelado' && s.enrollmentStatus !== 'Desligado') {
                    validStudentCounter++; // Increment only for valid students

                    // 2. Registro: 08/Letra + (Base + Sequencia - 1) / Ano
                    // Usar base + counter - 1 para começar no número indicado
                    const baseReg = parseInt(cls.registrationNumber || '0');
                    const seqReg = baseReg + validStudentCounter - 1;
                    const formattedSeqReg = seqReg.toString().padStart(4, '0'); // 4 dígitos
                    registro = `08 / ${courseLetter}${formattedSeqReg}/${year}`;

                    // 3. CAP-BA: 08/C + (Base + Sequencia - 1) / Ano (Skip for CBA-CE)
                    if (course?.type !== CourseType.CBA_CE) {
                        const baseCap = parseInt(cls.capBa || '0');
                        const seqCap = baseCap + validStudentCounter - 1;
                        const formattedSeqCap = seqCap.toString().padStart(4, '0'); // 4 dígitos
                        capCode = `08/C${formattedSeqCap}/${year}`;
                    }
                }

                allComputed.push({
                    ...s,
                    className: cls.name,
                    matricula,
                    registro,
                    capCode
                });
            });
        });

        return allComputed;
    }, [students, classes, courses]);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();

        const studentData: Student = {
            id: editingId || Math.random().toString(36).substr(2, 9),
            name: studentForm.name || '',
            cpf: studentForm.cpf || '',
            classId: studentForm.classId,
            enrollmentStatus: studentForm.enrollmentStatus as EnrollmentStatus,
            rg: studentForm.rg || '',
            rgIssuer: studentForm.rgIssuer || '',
            birthDate: studentForm.birthDate || '',
            phone: studentForm.phone || '',
            email: studentForm.email || '',
            origin: studentForm.origin || '',
            address: studentForm.address || '',
            nationality: studentForm.nationality || '',
            motherName: studentForm.motherName || '',
            fatherName: studentForm.fatherName || '',
            grades: studentForm.grades || {},
            finalTheory: studentForm.finalTheory || 0,
            finalPractical: studentForm.finalPractical || 0,
            finalGrade: studentForm.finalGrade || 0,
        };

        if (editingId) {
            updateStudent(studentData);
        } else {
            addStudent(studentData);
        }

        handleCloseModal();
    };

    const handleEdit = (s: any) => {
        setEditingId(s.id);
        setStudentForm({ ...s });
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingId(null);
        setStudentForm({ enrollmentStatus: 'Matriculado' });
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
            await deleteStudent(id);
        }
    };

    const [selectedYearFilter, setSelectedYearFilter] = useState('');

    // Derived Data for Filters
    const availableYears = Array.from(new Set(classes.map(c => new Date(c.startDate).getFullYear()))).sort((a, b) => b - a);

    const filtered = computedStudents.filter(s => {
        const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            s.cpf.includes(searchTerm) ||
            s.matricula.includes(searchTerm);

        const matchesClass = selectedClassFilter ? s.classId === selectedClassFilter : true;

        let matchesYear = true;
        if (selectedYearFilter) {
            const studentClass = classes.find(c => c.id === s.classId);
            if (studentClass) {
                matchesYear = new Date(studentClass.startDate).getFullYear().toString() === selectedYearFilter;
            } else {
                matchesYear = false; // Unassigned students don't match a specific year filter
            }
        }

        return matchesSearch && matchesClass && matchesYear;
    });

    const handleExportCSV = () => {
        const headers = ['Matricula', 'Nome', 'Turma', 'Status', 'CPF', 'Registro', 'CAP-BA', 'Final Teorica', 'Final Pratica', 'Nota Final'];
        const csvContent = [
            headers.join(','),
            ...filtered.map(s => [
                `"${s.matricula}"`,
                `"${s.name}"`,
                `"${s.className}"`,
                `"${s.enrollmentStatus}"`,
                `"${s.cpf}"`,
                `"${s.registro}"`,
                `"${s.capCode}"`,
                s.finalTheory?.toFixed(1) || '-',
                s.finalPractical?.toFixed(1) || '-',
                s.finalGrade?.toFixed(1) || '-'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'alunos.csv';
        link.click();
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('l', 'mm', 'a4'); // landscape

        doc.setFontSize(16);
        doc.text('Lista de Alunos', 14, 15);
        doc.setFontSize(10);
        doc.text(`Gerado em: ${new Date().toLocaleDateString('pt-BR')}`, 14, 22);

        const tableData = filtered.map(s => [
            s.matricula,
            s.name,
            s.className,
            s.enrollmentStatus,
            formatCPF(s.cpf),
            s.registro,
            s.capCode,
            s.finalTheory?.toFixed(1) || '-',
            s.finalPractical?.toFixed(1) || '-',
            s.finalGrade?.toFixed(1) || '-'
        ]);

        autoTable(doc, {
            head: [['Matrícula', 'Nome', 'Turma', 'Status', 'CPF', 'Registro', 'CAP-BA', 'Teórica', 'Prática', 'Final']],
            body: tableData,
            startY: 28,
            styles: { fontSize: 8, cellPadding: 2 },
            headStyles: { fillColor: [234, 88, 12], textColor: 255, fontStyle: 'bold' },
            alternateRowStyles: { fillColor: [245, 245, 245] },
            margin: { left: 14, right: 14 }
        });

        doc.save('alunos.pdf');
    };

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Alunos</h1>
                    <p className="text-gray-500 mt-1">Gerencie os alunos e suas matrículas</p>
                </div>
                <button
                    onClick={handleExportCSV}
                    className="btn-premium flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-3 rounded-lg shadow-sm transition-all duration-200 mr-2"
                >
                    <Download size={20} />
                    <span className="font-semibold">CSV</span>
                </button>
                <button
                    onClick={handleExportPDF}
                    className="btn-premium flex items-center space-x-2 bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 px-4 py-3 rounded-lg shadow-sm transition-all duration-200 mr-2"
                >
                    <FileText size={20} />
                    <span className="font-semibold">PDF</span>
                </button>
                <button
                    onClick={() => setShowModal(true)}
                    className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200"
                >
                    <Plus size={20} />
                    <span className="font-semibold">Novo Aluno</span>
                </button>
            </div>

            <div className="card-premium overflow-hidden animate-slide-up">
                <div className="p-4 border-b border-gray-100 flex flex-col md:flex-row gap-4 justify-between">
                    <div className="relative flex-1 max-w-md">
                        <input
                            type="text"
                            placeholder="Buscar por nome, CPF ou Matrícula..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="input-premium appearance-none block w-full px-3 py-2 rounded-md shadow-sm placeholder-gray-400 sm:text-sm bg-white text-gray-900"
                        />
                    </div>

                    <div className="flex gap-2 w-full md:w-auto">
                        <select
                            className={`${inputClass} w-32`}
                            value={selectedYearFilter}
                            onChange={(e) => setSelectedYearFilter(e.target.value)}
                        >
                            <option value="">Todos os Anos</option>
                            {availableYears.map(year => (
                                <option key={year} value={year}>{year}</option>
                            ))}
                        </select>

                        <select
                            className={`${inputClass} w-48`}
                            value={selectedClassFilter}
                            onChange={(e) => setSelectedClassFilter(e.target.value)}
                        >
                            <option value="">Todas as Turmas</option>
                            {classes.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                <option key={c.id} value={c.id}>{c.name}</option>
                            ))}
                        </select>
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Matrícula</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Nome</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Turma</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Status</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">CPF</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Registro</th>
                                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase whitespace-nowrap">CAP-BA</th>

                                {/* Grade Columns */}
                                <th className="px-4 py-3 text-center text-xs font-bold text-blue-700 uppercase bg-blue-50">Final Teórica</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-orange-700 uppercase bg-orange-50">Final Prática</th>
                                <th className="px-4 py-3 text-center text-xs font-bold text-gray-900 uppercase bg-gray-100">Nota Final</th>

                                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase whitespace-nowrap">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {filtered.map(s => {
                                let statusColor = 'bg-gray-100 text-gray-800';
                                if (s.enrollmentStatus === 'Matriculado') statusColor = 'bg-blue-100 text-blue-800';
                                else if (s.enrollmentStatus === 'Aprovado') statusColor = 'bg-green-100 text-green-800';
                                else if (s.enrollmentStatus === 'Reprovado') statusColor = 'bg-red-100 text-red-800';
                                else if (s.enrollmentStatus === 'Cancelado' || s.enrollmentStatus === 'Desligado') statusColor = 'bg-gray-200 text-gray-600';
                                else if (s.enrollmentStatus === 'Pendente') statusColor = 'bg-yellow-100 text-yellow-800';

                                return (
                                    <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{s.matricula}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{s.name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{s.className}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <span className={`badge px-2 inline-flex text-xs leading-5 font-semibold rounded-full transition-transform group-hover:scale-110 ${statusColor}`}>
                                                {s.enrollmentStatus}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{formatCPF(s.cpf)}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{s.registro}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">{s.capCode}</td>

                                        {/* Read-only Grade Data */}
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-800 bg-blue-50">
                                            {s.finalTheory ? s.finalTheory.toFixed(1) : '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-orange-800 bg-orange-50">
                                            {s.finalPractical ? s.finalPractical.toFixed(1) : '-'}
                                        </td>
                                        <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 bg-gray-100">
                                            {s.finalGrade ? s.finalGrade.toFixed(1) : '-'}
                                        </td>

                                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                            <button onClick={() => handleEdit(s)} className="text-primary-600 hover:text-primary-900 hover:scale-110 transition-all duration-200 mr-2">
                                                <Pencil size={18} />
                                            </button>
                                            <button onClick={() => handleDelete(s.id)} className="text-red-600 hover:text-red-900 hover:scale-110 transition-all duration-200">
                                                <Trash2 size={18} />
                                            </button>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                    </table>
                </div>
            </div>

            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Aluno' : 'Cadastro de Aluno'}</h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 p-2 rounded-full transition-all"><X size={24} /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                                <div className="col-span-2 bg-blue-50 p-4 rounded-md border border-blue-100 mb-2">
                                    <h4 className="text-sm font-bold text-blue-900 mb-3">Matrícula e Turma</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Turma</label>
                                            <select
                                                className={inputClass}
                                                value={studentForm.classId || ''}
                                                onChange={e => setStudentForm({ ...studentForm, classId: e.target.value })}
                                            >
                                                <option value="">Selecione uma turma...</option>
                                                {classes.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Status da Matrícula</label>
                                            <select
                                                className={inputClass}
                                                value={studentForm.enrollmentStatus}
                                                onChange={e => setStudentForm({ ...studentForm, enrollmentStatus: e.target.value as EnrollmentStatus })}
                                            >
                                                <option value="Pendente">Pendente</option>
                                                <option value="Matriculado">Matriculado</option>
                                                <option value="Aprovado">Aprovado</option>
                                                <option value="Reprovado">Reprovado</option>
                                                <option value="Cancelado">Cancelado</option>
                                                <option value="Desligado">Desligado</option>
                                            </select>
                                        </div>
                                    </div>
                                    <p className="text-xs text-blue-600 mt-2">
                                        * O número de Matrícula, Registro e CAP-BA serão gerados automaticamente com base na ordem alfabética da turma e no status do aluno.
                                    </p>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                    <input required className={inputClass} value={studentForm.name || ''} onChange={e => setStudentForm({ ...studentForm, name: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                                    <input
                                        required
                                        className={inputClass}
                                        value={formatCPF(studentForm.cpf || '')}
                                        onChange={e => setStudentForm({ ...studentForm, cpf: formatCPF(e.target.value) })}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">RG</label>
                                    <input className={inputClass} value={studentForm.rg || ''} onChange={e => setStudentForm({ ...studentForm, rg: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Orgão Emissor</label>
                                    <input className={inputClass} value={studentForm.rgIssuer || ''} onChange={e => setStudentForm({ ...studentForm, rgIssuer: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Data Nascimento</label>
                                    <input type="date" className={inputClass} value={studentForm.birthDate || ''} onChange={e => setStudentForm({ ...studentForm, birthDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Telefone</label>
                                    <input className={inputClass} value={studentForm.phone || ''} onChange={e => setStudentForm({ ...studentForm, phone: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Email</label>
                                    <input type="email" className={inputClass} value={studentForm.email || ''} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Naturalidade</label>
                                    <input className={inputClass} value={studentForm.origin || ''} onChange={e => setStudentForm({ ...studentForm, origin: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Endereço</label>
                                    <input className={inputClass} value={studentForm.address || ''} onChange={e => setStudentForm({ ...studentForm, address: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nacionalidade</label>
                                    <input className={inputClass} value={studentForm.nationality || ''} onChange={e => setStudentForm({ ...studentForm, nationality: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome da Mãe</label>
                                    <input className={inputClass} value={studentForm.motherName || ''} onChange={e => setStudentForm({ ...studentForm, motherName: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Nome do Pai</label>
                                    <input className={inputClass} value={studentForm.fatherName || ''} onChange={e => setStudentForm({ ...studentForm, fatherName: e.target.value.toUpperCase() })} />
                                </div>
                            </div>

                            <div className="flex justify-end mt-6 pt-4 border-t border-gray-100 space-x-3">
                                <button type="button" onClick={handleCloseModal} className="px-6 py-2.5 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition-colors">Cancelar</button>
                                <button type="submit" className="btn-premium bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-2.5 rounded-lg font-semibold shadow-md transition-all duration-200">Salvar Aluno</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
