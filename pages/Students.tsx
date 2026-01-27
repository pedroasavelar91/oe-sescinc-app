
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { Student, CourseType, EnrollmentStatus } from '../types';
import { Plus, Pencil, X, Trash2, Download, FileText, ChevronLeft, ChevronRight, Upload, MessageCircle, CheckSquare } from 'lucide-react';
import { formatCPF } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';
import { generateStandardPDF } from '../utils/pdf';
import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter, inputClass, labelClass } from '../components/StandardModal';

export const StudentsPage: React.FC = () => {
    const { students, classes, addStudent, updateStudent, deleteStudent, courses, bases, currentUser, firefighters, addFirefighter, updateFirefighter, uploadStudentDocument } = useStore();
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedClassFilter, setSelectedClassFilter] = useState('');
    const [selectedYearFilter, setSelectedYearFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);

    // Modal Hierarchical Filter States
    const [modalYear, setModalYear] = useState('');
    const [modalCourseId, setModalCourseId] = useState('');
    const itemsPerPage = 10;

    const [editingId, setEditingId] = useState<string | null>(null);
    const [studentForm, setStudentForm] = useState<Partial<Student>>({
        enrollmentStatus: 'Pendente'
    });
    const [uploadingDocs, setUploadingDocs] = useState<{ [key: string]: boolean }>({});

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
        const parts = clsName.split(' ');
        const suffix = parts[parts.length - 1];
        const [num, year] = suffix.split('/');
        return { num, year };
    };

    const computedStudents = useMemo(() => {
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

        unassignedStudents.forEach(s => {
            allComputed.push({ ...s, matricula: '-', registro: '-', capCode: '-', className: 'Sem Turma' });
        });

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

            const sortedStudents = [...studentsByClass[classId]].sort((a, b) => a.name.localeCompare(b.name));

            let validStudentCounter = 0;

            sortedStudents.forEach((s, index) => {
                const listIndex = index + 1;
                const formattedIndex = listIndex.toString().padStart(2, '0');
                const matricula = `${formattedIndex}/${course?.name.split(' ')[0] || 'CURSO'}/Nº${num}-${year}`;

                let registro = '-';
                let capCode = '-';

                if (s.enrollmentStatus !== 'Cancelado' && s.enrollmentStatus !== 'Desligado') {
                    validStudentCounter++;
                    const baseReg = parseInt(cls.registrationNumber || '0');
                    const seqReg = baseReg + validStudentCounter - 1;
                    const formattedSeqReg = seqReg.toString().padStart(4, '0');
                    registro = `08/${courseLetter}${formattedSeqReg}/${year}`;

                    if (course?.type !== CourseType.CBA_CE) {
                        const baseCap = parseInt(cls.capBa || '0');
                        const seqCap = baseCap + validStudentCounter - 1;
                        const formattedSeqCap = seqCap.toString().padStart(4, '0');
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
            id: editingId || studentForm.id || crypto.randomUUID(),
            ...studentForm, // Spread all existing properties (including documents, matricula, etc.)
            name: studentForm.name || '',
            cpf: studentForm.cpf || '',
            classId: studentForm.classId || undefined,
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
            documents: studentForm.documents || {}, // Explicitly ensure documents are kept
            isEmployee: studentForm.isEmployee ?? false,
            baseId: studentForm.baseId,
            matricula: studentForm.matricula || '',
            registro: studentForm.registro || '',
            capCode: studentForm.capCode || '',
            className: studentForm.className,
            team: studentForm.team
        };

        if (editingId) {
            updateStudent(studentData);
        } else {
            addStudent(studentData);
        }

        // Automatic Firefighter Creation/Update Logic
        // IF: Student is Employee AND has CPF AND has a Class
        if (studentData.isEmployee && studentData.cpf && studentData.classId) {
            const cls = classes.find(c => c.id === studentData.classId);
            const course = courses.find(c => c.id === cls?.courseId);

            // Only for CBA-AT courses (firefighter training)
            if (course?.type === CourseType.CBA_AT) {
                // Find Firefighter by clean CPF (deduplication check)
                const cleanCPF = studentData.cpf.replace(/\D/g, '');
                const existingFirefighter = firefighters.find(f => f.cpf.replace(/\D/g, '') === cleanCPF);

                // Get base info from student's baseId
                const studentBase = bases.find(b => b.id === studentData.baseId);

                if (existingFirefighter && cls?.endDate) {
                    // UPDATE existing firefighter validity
                    updateFirefighter({
                        ...existingFirefighter,
                        lastUpdateDate: cls.endDate,
                        isNotUpdated: false
                    });
                } else if (!existingFirefighter && cls?.endDate && studentBase) {
                    // CREATE new firefighter (no duplicate found)
                    const newFirefighter = {
                        id: crypto.randomUUID(),
                        name: studentData.name,
                        cpf: studentData.cpf,
                        base: studentBase.name,
                        region: studentBase.region,
                        airportClass: studentBase.airportClass,
                        graduationDate: cls.endDate,
                        lastUpdateDate: cls.endDate,
                        isNotUpdated: false,
                        isAway: false
                    };
                    addFirefighter(newFirefighter);
                }
            }
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
        setStudentForm({ enrollmentStatus: 'Pendente' });
        setModalYear('');
        setModalCourseId('');
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir este aluno? Esta ação não pode ser desfeita.')) {
            await deleteStudent(id);
        }
    };

    const availableYears = Array.from(new Set(classes.map(c => new Date(c.startDate).getFullYear()))).sort((a, b) => b - a);

    const activeClasses = useMemo(() => {
        const classIdsWithStudents = new Set(students.map(s => s.classId).filter(Boolean));
        return classes.filter(c => classIdsWithStudents.has(c.id)).sort((a, b) => a.name.localeCompare(b.name));
    }, [classes, students]);

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
                matchesYear = false;
            }
        }

        return matchesSearch && matchesClass && matchesYear;
    });

    const totalPages = Math.ceil(filtered.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentStudents = filtered.slice(startIndex, endIndex);

    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, selectedClassFilter, selectedYearFilter]);

    const handlePageChange = (newPage: number) => {
        if (newPage >= 1 && newPage <= totalPages) {
            setCurrentPage(newPage);
        }
    };

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
                s.finalTheory?.toFixed(2) || '-',
                s.finalPractical?.toFixed(2) || '-',
                s.finalGrade?.toFixed(2) || '-'
            ].join(','))
        ].join('\n');

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = 'alunos.csv';
        link.click();
    };

    const handleExportPDF = async () => {
        const tableData = filtered.map(s => [
            s.matricula,
            s.name,
            s.className,
            s.enrollmentStatus,
            formatCPF(s.cpf),
            s.registro,
            s.capCode,
            s.finalTheory?.toFixed(2) || '-',
            s.finalPractical?.toFixed(2) || '-',
            s.finalGrade?.toFixed(2) || '-'
        ]);

        await generateStandardPDF({
            title: 'LISTA DE ALUNOS',
            filename: 'lista_alunos',
            table: {
                headers: ['MATRÍCULA', 'NOME', 'TURMA', 'STATUS', 'CPF', 'REGISTRO', 'CAP-BA', 'TEÓRICA', 'PRÁTICA', 'FINAL'],
                data: tableData
            },
            user: null, // Or existing user context if available, but component didn't use it before
            backgroundImage: '/pdf-background.png'
        });
    };

    return (
        <>
            {/* Filters & Actions Header */}
            <div className="space-y-6">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                        <div className="relative flex-1 min-w-[300px]">
                            <input
                                type="text"
                                placeholder="BUSCAR POR NOME, CPF OU MATRÍCULA..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className={`${inputClass} uppercase`}
                            />
                        </div>

                        {/* Filters */}
                        <div className="w-full md:w-48">
                            <select
                                className={inputClass}
                                value={selectedYearFilter}
                                onChange={(e) => setSelectedYearFilter(e.target.value)}
                            >
                                <option value="">TODOS OS ANOS</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>
                        </div>

                        <div className="w-full md:w-64">
                            <select
                                className={inputClass}
                                value={selectedClassFilter}
                                onChange={(e) => setSelectedClassFilter(e.target.value)}
                            >
                                <option value="">TODAS AS TURMAS</option>
                                {activeClasses.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex gap-2 w-full md:w-auto justify-end">
                        <button
                            onClick={handleExportCSV}
                            className="btn-base btn-edit flex items-center justify-center px-6 py-3 text-sm font-bold"
                            title="Exportar CSV"
                        >
                            CSV
                        </button>
                        <button
                            onClick={handleExportPDF}
                            className="btn-base btn-edit flex items-center justify-center px-6 py-3 text-sm font-bold"
                            title="Exportar PDF"
                        >
                            PDF
                        </button>
                        <button
                            onClick={() => setShowModal(true)}
                            className="btn-base btn-insert flex items-center justify-center px-8 py-3 text-sm font-bold"
                        >
                            INSERIR
                        </button>
                    </div>
                </div>

                <div className="card-premium overflow-hidden animate-slide-up">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border-collapse">
                            <thead className="bg-white text-gray-700">
                                <tr>
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Matrícula</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Nome</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Turma</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Status</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Funcionário</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Registro</th>
                                    <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">CAP-BA</th>

                                    {/* Grade Columns - Expanded */}
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-gray-200">Final Teórica</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-gray-200">Final Prática</th>
                                    <th className="px-4 py-3 text-center text-xs font-bold uppercase border border-gray-200">Nota Final</th>

                                    <th className="px-4 py-3 text-center text-xs font-medium uppercase border border-gray-200 min-w-[150px]">Ações</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentStudents.map(s => {
                                    const isManagerOrCoord = currentUser?.role === 'Gestor' || currentUser?.role === 'Coordenador';
                                    let statusColor = 'bg-gray-100 text-gray-800';
                                    if (s.enrollmentStatus === 'Matriculado') statusColor = 'bg-blue-100 text-blue-800';
                                    else if (s.enrollmentStatus === 'Aprovado') statusColor = 'bg-green-100 text-green-800';
                                    else if (s.enrollmentStatus === 'Reprovado') statusColor = 'bg-red-100 text-red-800';
                                    else if (s.enrollmentStatus === 'Cancelado' || s.enrollmentStatus === 'Desligado') statusColor = 'bg-gray-200 text-gray-600';
                                    else if (s.enrollmentStatus === 'Pendente') statusColor = 'bg-yellow-100 text-yellow-800';

                                    // Phone Formatting
                                    const rawPhone = s.phone?.replace(/\D/g, '') || '';
                                    const formattedPhone = rawPhone.length >= 10
                                        ? `+55 ${rawPhone.replace(/^(\d{2})(\d{5})(\d{4}).*/, '($1) $2-$3')}`
                                        : s.phone || '-';
                                    const whatsappLink = rawPhone ? `https://wa.me/55${rawPhone}` : '#';

                                    return (
                                        <tr key={s.id} className="hover:bg-gray-50 transition-colors group">
                                            <td className="px-3 py-2 text-xs font-medium text-gray-900 border border-gray-200 whitespace-nowrap">{s.matricula}</td>
                                            <td
                                                className="px-3 py-2 text-xs text-gray-900 border border-gray-200 font-bold uppercase cursor-pointer hover:text-blue-600 hover:underline"
                                                onClick={() => handleEdit(s)}
                                            >
                                                {s.name}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500 border border-gray-200">{s.className}</td>
                                            <td className="px-3 py-2 border border-gray-200 text-center">
                                                <span className={`badge px-2 inline-flex text-[10px] leading-4 font-semibold rounded-full ${statusColor}`}>
                                                    {s.enrollmentStatus.toUpperCase()}
                                                </span>
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500 border border-gray-200 text-center">
                                                {s.isEmployee ? (
                                                    <span className="bg-blue-100 text-blue-800 text-[10px] px-2 py-0.5 rounded-full font-bold">SIM</span>
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                            <td className="px-3 py-2 text-xs text-gray-500 font-mono border border-gray-200 whitespace-nowrap">{s.registro}</td>
                                            <td className="px-3 py-2 text-xs text-gray-500 font-mono border border-gray-200 whitespace-nowrap">{s.capCode}</td>

                                            {/* Read-only Grade Data */}
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-blue-800 bg-blue-50 border border-gray-200">
                                                {s.finalTheory ? s.finalTheory.toFixed(2) : '-'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-purple-800 bg-purple-50 border border-gray-200">
                                                {s.finalPractical ? s.finalPractical.toFixed(2) : '-'}
                                            </td>
                                            <td className="px-4 py-4 whitespace-nowrap text-sm text-center font-bold text-gray-900 bg-gray-100 border border-gray-200">
                                                {s.finalGrade ? s.finalGrade.toFixed(2) : '-'}
                                            </td>

                                            <td className="px-4 py-2 text-right text-xs font-medium border border-gray-200 whitespace-nowrap">
                                                <div className="flex justify-end gap-2">
                                                    {isManagerOrCoord && (
                                                        <>
                                                            <button
                                                                onClick={() => handleEdit(s)}
                                                                className="btn-base btn-edit px-3 py-1 text-xs"
                                                                title="Editar"
                                                            >
                                                                EDITAR
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(s.id)}
                                                                className="btn-base btn-delete px-3 py-1 text-xs"
                                                                title="Excluir"
                                                            >
                                                                EXCLUIR
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination Controls */}
                    {totalPages > 1 && (
                        <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                            <span className="text-sm text-gray-700 uppercase">
                                Mostrando <span className="font-medium">{(startIndex) + 1}</span> a <span className="font-medium">{Math.min(endIndex, filtered.length)}</span> de <span className="font-medium">{filtered.length}</span> resultados
                            </span>
                            <div className="flex gap-2">
                                <button
                                    onClick={() => handlePageChange(currentPage - 1)}
                                    disabled={currentPage === 1}
                                    className={`btn-base btn-pagination px-4 py-2 text-xs ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    ANTERIOR
                                </button>
                                <button
                                    onClick={() => handlePageChange(currentPage + 1)}
                                    disabled={currentPage === totalPages}
                                    className={`btn-base btn-pagination px-4 py-2 text-xs ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
                                >
                                    PRÓXIMO
                                </button>
                            </div>
                        </div>
                    )}
                </div>

            </div>

            <StandardModal isOpen={showModal} onClose={handleCloseModal}>
                <StandardModalHeader onClose={handleCloseModal} title="" />

                <StandardModalBody>
                    <form id="student-form" onSubmit={handleSave}>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                            {/* Section 1: Matricula & Turma */}
                            <div className="col-span-2 p-4 rounded-lg border border-gray-200 mb-2 bg-gray-50">
                                <h4 className="text-sm font-bold text-gray-700 mb-4 uppercase">Matrícula e Turma</h4>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                    <div>
                                        <label className={labelClass}>SELECIONE O ANO</label>
                                        <select
                                            className={inputClass}
                                            value={modalYear}
                                            onChange={e => {
                                                setModalYear(e.target.value);
                                                setStudentForm({ ...studentForm, classId: '' }); // Reset class
                                            }}
                                        >
                                            <option value="">TODOS</option>
                                            {availableYears.map(y => <option key={y} value={y}>{y}</option>)}
                                        </select>
                                    </div>
                                    <div className="col-span-2">
                                        <label className={labelClass}>SELECIONE O CURSO</label>
                                        <select
                                            className={inputClass}
                                            value={modalCourseId}
                                            onChange={e => {
                                                setModalCourseId(e.target.value);
                                                setStudentForm({ ...studentForm, classId: '' }); // Reset class
                                            }}
                                        >
                                            <option value="">TODOS</option>
                                            {courses.sort((a, b) => a.name.localeCompare(b.name)).map(c => (
                                                <option key={c.id} value={c.id}>{c.name}</option>
                                            ))}
                                        </select>
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className={labelClass}>Turma</label>
                                        <select
                                            className={inputClass}
                                            value={studentForm.classId || ''}
                                            onChange={e => setStudentForm({ ...studentForm, classId: e.target.value })}
                                        >
                                            <option value="">SELECIONE UMA TURMA</option>
                                            {classes
                                                .filter(c => {
                                                    const today = new Date().toISOString().split('T')[0];
                                                    // Filter logic: Year Match AND Course Match AND (EndDate >= Today)
                                                    if (modalYear && new Date(c.startDate).getFullYear().toString() !== modalYear) return false;
                                                    if (modalCourseId && c.courseId !== modalCourseId) return false;
                                                    if (c.endDate && c.endDate < today) return false; // Filter out finished classes
                                                    return true;
                                                })
                                                .sort((a, b) => a.name.localeCompare(b.name))
                                                .map(c => (
                                                    <option key={c.id} value={c.id}>{c.name}</option>
                                                ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className={labelClass}>Status da Matrícula</label>
                                        <select
                                            className={inputClass}
                                            value={studentForm.enrollmentStatus}
                                            onChange={e => setStudentForm({ ...studentForm, enrollmentStatus: e.target.value as EnrollmentStatus })}
                                        >
                                            <option value="Pendente">PENDENTE</option>
                                            <option value="Matriculado">MATRICULADO</option>
                                            <option value="Aprovado">APROVADO</option>
                                            <option value="Reprovado">REPROVADO</option>
                                            <option value="Cancelado">CANCELADO</option>
                                            <option value="Desligado">DESLIGADO</option>
                                        </select>
                                    </div>
                                </div>
                                <p className="text-xs text-gray-500 mt-2 italic">
                                    * O número de Matrícula, Registro e CAP-BA serão gerados automaticamente.
                                </p>
                            </div>

                            {/* Section 2: Personal Info */}
                            <div className="col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className={labelClass}>Nome Completo</label>
                                    <input required className={inputClass} value={studentForm.name || ''} onChange={e => setStudentForm({ ...studentForm, name: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className={labelClass}>CPF</label>
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
                                    <label className={labelClass}>RG</label>
                                    <input className={inputClass} value={studentForm.rg || ''} onChange={e => setStudentForm({ ...studentForm, rg: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Orgão Emissor</label>
                                    <input className={inputClass} value={studentForm.rgIssuer || ''} onChange={e => setStudentForm({ ...studentForm, rgIssuer: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Data Nascimento</label>
                                    <input type="date" className={inputClass} value={studentForm.birthDate || ''} onChange={e => setStudentForm({ ...studentForm, birthDate: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Telefone</label>
                                    <div className="flex items-center gap-2">
                                        <input
                                            className={inputClass}
                                            value={studentForm.phone || ''}
                                            onChange={e => {
                                                let value = e.target.value.replace(/\D/g, '');
                                                if (value.length > 11) value = value.slice(0, 11);

                                                if (value.length > 2) {
                                                    value = `(${value.slice(0, 2)}) ${value.slice(2)}`;
                                                }
                                                if (value.length > 7) {
                                                    value = `${value.slice(0, 9)}-${value.slice(9)}`; // (XX) XXXXX-XXXX (Adjusted correctly for length including parens/spaces)
                                                    // Re-calculate to be safe: 
                                                    // (XX) XXXXX-XXXX
                                                    //  012345678901234
                                                    // raw: 11
                                                }
                                                // Simpler formatter for strict (XX) XXXXX-XXXX
                                                const raw = e.target.value.replace(/\D/g, '').slice(0, 11);
                                                let formatted = raw;
                                                if (raw.length > 0) {
                                                    formatted = raw.replace(/^(\d{2})(\d)/g, '($1) $2');
                                                    formatted = formatted.replace(/(\d)(\d{4})$/, '$1-$2');
                                                }
                                                setStudentForm({ ...studentForm, phone: formatted });
                                            }}
                                            placeholder="(XX) XXXXX-XXXX"
                                            maxLength={15}
                                        />
                                        {studentForm.phone && (
                                            <a
                                                href={`https://wa.me/55${studentForm.phone.replace(/\D/g, '')}`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                className="p-2 bg-green-100 text-green-600 rounded-md hover:bg-green-200 transition-colors"
                                                title="Conversar no WhatsApp"
                                            >
                                                <MessageCircle size={20} />
                                            </a>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className={labelClass}>Email</label>
                                    <input type="email" className={inputClass} value={studentForm.email || ''} onChange={e => setStudentForm({ ...studentForm, email: e.target.value })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Naturalidade</label>
                                    <input className={inputClass} value={studentForm.origin || ''} onChange={e => setStudentForm({ ...studentForm, origin: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Endereço</label>
                                    <input className={inputClass} value={studentForm.address || ''} onChange={e => setStudentForm({ ...studentForm, address: e.target.value.toUpperCase() })} />
                                </div>

                                {/* Employee Box */}
                                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50 flex flex-col gap-4">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isEmployee"
                                            className="w-4 h-4 text-[#FF6B35] border-gray-300 rounded focus:ring-[#FF6B35]"
                                            checked={studentForm.isEmployee || false}
                                            onChange={e => {
                                                const isChecked = e.target.checked;
                                                setStudentForm({
                                                    ...studentForm,
                                                    isEmployee: isChecked,
                                                    baseId: isChecked ? studentForm.baseId : undefined // Clear base if unchecked
                                                });
                                            }}
                                        />
                                        <label htmlFor="isEmployee" className="text-sm font-semibold text-gray-700 select-none cursor-pointer">
                                            FUNCIONÁRIO
                                        </label>
                                    </div>

                                    {studentForm.isEmployee && (
                                        <div className="animate-fade-in">
                                            <label className={labelClass}>Base Cadastrada</label>
                                            <select
                                                className={inputClass}
                                                value={studentForm.baseId || ''}
                                                onChange={e => setStudentForm({ ...studentForm, baseId: e.target.value })}
                                            >
                                                <option value="">Selecione a Base</option>
                                                {[...bases].sort((a, b) => a.name.localeCompare(b.name)).map(base => (
                                                    <option key={base.id} value={base.id}>
                                                        {base.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <label className={labelClass}>Nacionalidade</label>
                                    <input className={inputClass} value={studentForm.nationality || ''} onChange={e => setStudentForm({ ...studentForm, nationality: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Nome da Mãe</label>
                                    <input className={inputClass} value={studentForm.motherName || ''} onChange={e => setStudentForm({ ...studentForm, motherName: e.target.value.toUpperCase() })} />
                                </div>
                                <div>
                                    <label className={labelClass}>Nome do Pai</label>
                                    <input className={inputClass} value={studentForm.fatherName || ''} onChange={e => setStudentForm({ ...studentForm, fatherName: e.target.value.toUpperCase() })} />
                                </div>
                            </div>

                            {/* Documents Section */}
                            {/* Documents Section - Only for CBA-2 */}
                            {(() => {
                                const selectedClass = classes.find(c => c.id === studentForm.classId);
                                const selectedCourse = courses.find(c => c.id === selectedClass?.courseId);
                                const isCBA2 = selectedCourse?.type === CourseType.CBA_2 || selectedCourse?.type === CourseType.CBA_2_COMP;
                                const isCBA_AT = selectedCourse?.type === CourseType.CBA_AT;
                                const isCBA_MC = selectedCourse?.type === CourseType.CBA_MC;
                                const isCBA_CE = selectedCourse?.type === CourseType.CBA_CE;
                                const isManagerOrCoord = currentUser?.role === 'Gestor' || currentUser?.role === 'Coordenador';

                                if (!isCBA2 && !isCBA_AT && !isCBA_MC && !isCBA_CE) return null;

                                let requiredDocs: { key: string; label: string; optional?: boolean }[] = [];

                                if (isCBA2) {
                                    requiredDocs = [
                                        { key: 'physicalAptitude', label: 'ATESTADO DE APTIDÃO FÍSICA' },
                                        { key: 'psychologicalAptitude', label: 'ATESTADO DE APTIDÃO PSICOLÓGICA' },
                                        { key: 'photoId', label: 'DOCUMENTO COM FOTO' },
                                        { key: 'firefighterCertificate', label: 'CERTIFICADO DE BOMBEIRO CIVIL OU FORMAÇÃO DE BOMBEIRO MILITAR' },
                                        { key: 'highSchoolCertificate', label: 'CERTIFICADO DE ENSINO MÉDIO OU EQUIVALENTE' },
                                        { key: 'contract', label: 'CONTRATO', optional: true },
                                    ];
                                } else if (isCBA_AT) {
                                    requiredDocs = [
                                        { key: 'physicalAptitude', label: 'ATESTADO DE APTIDÃO FÍSICA' },
                                        { key: 'psychologicalAptitude', label: 'ATESTADO DE APTIDÃO PSICOLÓGICA' },
                                        { key: 'aerodromeCertificate', label: 'CERTIFICADO DE BOMBEIRO DE AERÓDROMO' },
                                        { key: 'contract', label: 'CONTRATO', optional: true },
                                    ];
                                } else if (isCBA_MC) {
                                    requiredDocs = [
                                        { key: 'physicalAptitude', label: 'ATESTADO DE APTIDÃO FÍSICA' },
                                        { key: 'psychologicalAptitude', label: 'ATESTADO DE APTIDÃO PSICOLÓGICA' },
                                        { key: 'aerodromeCertificate', label: 'CERTIFICADO DE BOMBEIRO DE AERÓDROMO' },
                                        { key: 'cnh', label: 'CARTEIRA NACIONAL DE HABILITAÇÃO (CNH)' },
                                        { key: 'emergencyDriverCertificate', label: 'CERTIFICADO DE CONDUTOR E VEÍCULOS DE EMERGÊNCIA' },
                                        { key: 'contract', label: 'CONTRATO', optional: true },
                                    ];
                                } else if (isCBA_CE) {
                                    requiredDocs = [
                                        { key: 'physicalAptitude', label: 'ATESTADO DE APTIDÃO FÍSICA' },
                                        { key: 'psychologicalAptitude', label: 'ATESTADO DE APTIDÃO PSICOLÓGICA' },
                                        { key: 'aerodromeCertificate', label: 'CERTIFICADO DE BOMBEIRO DE AERÓDROMO' },
                                        { key: 'contract', label: 'CONTRATO', optional: true },
                                    ];
                                }

                                return (
                                    <div className="col-span-2 p-5 rounded-lg border border-gray-200 mb-6 bg-gray-50 flex flex-col gap-6">
                                        <h4 className="text-sm font-bold text-gray-800 flex items-center uppercase border-b border-gray-200 pb-2">
                                            <FileText size={16} className="mr-2 text-[#FF6B35]" />
                                            DOCUMENTAÇÃO OBRIGATÓRIA
                                        </h4>

                                        <div className="flex flex-col gap-4">
                                            {/* Required Docs */}
                                            {requiredDocs.map((doc) => {
                                                const fileUrl = studentForm.documents?.[doc.key as keyof typeof studentForm.documents];
                                                const hasFile = !!fileUrl;

                                                return (
                                                    <div key={doc.key} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-white border border-gray-200 rounded-md hover:border-gray-300 transition-colors">
                                                        <label className="text-[11px] font-bold text-gray-700 uppercase leading-tight max-w-md flex-1">
                                                            {doc.label}
                                                            {!doc.optional && <span className="text-red-500 ml-1">*</span>}
                                                        </label>

                                                        <div className="flex items-center gap-3 shrink-0">
                                                            <div className="relative overflow-hidden group">
                                                                <input
                                                                    type="file"
                                                                    className={`block w-full text-[10px]
                                                                        file:mr-2 file:py-1.5 file:px-3
                                                                        file:rounded-md file:border-0
                                                                        file:text-[10px] file:font-semibold
                                                                        file:uppercase file:cursor-pointer
                                                                        ${hasFile
                                                                            ? 'text-green-600 file:bg-green-100 file:text-green-700 hover:file:bg-green-200'
                                                                            : 'text-gray-500 file:bg-gray-100 file:text-gray-700 hover:file:bg-gray-200'
                                                                        }`}
                                                                    onChange={async (e) => {
                                                                        const file = e.target.files?.[0];
                                                                        if (file) {
                                                                            try {
                                                                                setUploadingDocs(prev => ({ ...prev, [doc.key]: true }));

                                                                                // Generate temporary ID if new student
                                                                                const tempId = editingId || studentForm.id || 'temp-' + Date.now();

                                                                                const publicUrl = await uploadStudentDocument(file, tempId, doc.key);

                                                                                setStudentForm(prev => {
                                                                                    const newDocs = { ...prev.documents, [doc.key]: publicUrl };
                                                                                    return { ...prev, documents: newDocs };
                                                                                });
                                                                            } catch (error: any) {
                                                                                alert('Erro ao enviar documento: ' + error.message);
                                                                            } finally {
                                                                                setUploadingDocs(prev => ({ ...prev, [doc.key]: false }));
                                                                            }
                                                                        }
                                                                    }}
                                                                />
                                                            </div>

                                                            {hasFile && isManagerOrCoord && (
                                                                <a
                                                                    href={fileUrl}
                                                                    target="_blank"
                                                                    rel="noopener noreferrer"
                                                                    className="p-1.5 bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
                                                                    title="Visualizar/Baixar Documento"
                                                                >
                                                                    <Download size={14} />
                                                                </a>
                                                            )}

                                                            {uploadingDocs[doc.key] && (
                                                                <div className="text-blue-500 animate-pulse text-[10px] font-bold">
                                                                    ENVIANDO...
                                                                </div>
                                                            )}

                                                            {!uploadingDocs[doc.key] && hasFile && (
                                                                <div className="text-green-500" title="Documento Anexado">
                                                                    <CheckSquare size={16} />
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>
                                );
                            })()}
                        </div>
                    </form>
                </StandardModalBody>

                <StandardModalFooter>
                    <div className="flex justify-end gap-3 p-4">
                        <button
                            type="button"
                            onClick={handleCloseModal}
                            className="btn-base btn-delete px-6 py-2.5 text-xs"
                        >
                            CANCELAR
                        </button>
                        <button
                            type="submit"
                            form="student-form"
                            className="btn-base btn-save px-8 py-2.5"
                        >
                            SALVAR ALUNO
                        </button>
                    </div>
                </StandardModalFooter>
            </StandardModal>
        </>
    );
};
