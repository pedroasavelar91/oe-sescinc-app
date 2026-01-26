import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { CourseType, UserRole } from '../types';
import { FileBadge, Search, Filter, Printer, Award, ChevronLeft, ChevronRight } from 'lucide-react';
import { formatCPF } from '../utils/formatters';
import { formatDate } from '../utils/dateUtils';

export const CertificatesPage: React.FC = () => {
    const { students, classes, courses, currentUser } = useStore();
    const [searchTerm, setSearchTerm] = useState('');
    const [classFilter, setClassFilter] = useState('');
    const [yearFilter, setYearFilter] = useState('');
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 10;

    if (!currentUser || (currentUser.role !== UserRole.GESTOR && currentUser.role !== UserRole.COORDENADOR)) {
        return <div className="p-8 text-center text-gray-500">Acesso não autorizado.</div>;
    }

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

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

    // Derive Certificate Data
    const certificateData = useMemo(() => {
        const today = new Date();

        // 1. Filter eligible students
        const eligibleStudents = students.filter(s => {
            if (!s.classId) return false;
            const cls = classes.find(c => c.id === s.classId);
            if (!cls) return false;

            const isClassFinished = new Date(cls.endDate) < today;
            const isApproved = s.enrollmentStatus === 'Aprovado';

            return isApproved;
        });

        // 2. Group by Class to calculate indexes
        const studentsByClass: { [key: string]: typeof eligibleStudents } = {};
        eligibleStudents.forEach(s => {
            if (!studentsByClass[s.classId!]) studentsByClass[s.classId!] = [];
            studentsByClass[s.classId!].push(s);
        });

        let allCertificates: any[] = [];

        Object.keys(studentsByClass).forEach(classId => {
            const cls = classes.find(c => c.id === classId);
            const course = courses.find(c => c.id === cls?.courseId);
            if (!cls || !course) return;

            // Sort alphabetically for consistent indexing
            const classStudents = studentsByClass[classId].sort((a, b) => a.name.localeCompare(b.name));

            // Get Class Year/Num
            let num = '00';
            let year = '2025';
            if (cls.name) {
                const parts = cls.name.split(' ');
                const suffix = parts[parts.length - 1];
                if (suffix.includes('/')) {
                    [num, year] = suffix.split('/');
                }
            }

            const courseLetter = getCourseLetter(course.type);
            const baseReg = parseInt(cls.registrationNumber || '0');
            const baseCap = parseInt(cls.capBa || '0');

            // We need to know the student's index within the WHOLE class (not just eligible ones)
            // So we need to fetch ALL students for this class to determine the correct index
            const allClassStudents = students.filter(s => s.classId === classId).sort((a, b) => a.name.localeCompare(b.name));

            classStudents.forEach(s => {
                // Find index in the full class list
                const index = allClassStudents.findIndex(st => st.id === s.id) + 1;

                // Calculate Fields
                const formattedIndex = index.toString().padStart(2, '0');
                const matricula = s.matricula || `${formattedIndex}/${course.name.split(' ')[0]}/Nº${num}-${year}`;

                const seqReg = baseReg + index;
                const formattedSeqReg = seqReg.toString().padStart(4, '0');
                const registro = s.registro || `08/${courseLetter}${formattedSeqReg}/${year}`;

                let capBa = s.capCode || '-';
                if (course.type !== CourseType.CBA_CE && !s.capCode) {
                    const seqCap = baseCap + index;
                    const formattedSeqCap = seqCap.toString().padStart(4, '0');
                    capBa = `08/C${formattedSeqCap}/${year}`;
                }

                allCertificates.push({
                    id: s.id,
                    name: s.name,
                    cpf: s.cpf,
                    courseName: course.name,
                    endDate: cls.endDate,
                    classId: cls.id,
                    className: cls.name,
                    year: year,
                    matricula,
                    registro,
                    capBa
                });
            });
        });

        return allCertificates;
    }, [students, classes, courses]);

    const filteredCertificates = certificateData.filter(c => {
        const matchesSearch = c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.cpf.includes(searchTerm);
        const matchesClass = classFilter ? c.classId === classFilter : true;
        const matchesYear = yearFilter ? c.year === yearFilter : true;
        return matchesSearch && matchesClass && matchesYear;
    });

    const totalPages = Math.ceil(filteredCertificates.length / ITEMS_PER_PAGE);
    const paginatedCertificates = filteredCertificates.slice(
        (currentPage - 1) * ITEMS_PER_PAGE,
        currentPage * ITEMS_PER_PAGE
    );

    // Classes with students
    const activeClasses = useMemo(() => {
        return classes.filter(c => students.some(s => s.classId === c.id));
    }, [classes, students]);

    const handlePrint = (id: string) => {
        alert('Funcionalidade ainda não implementada.');
    };

    return (
        <div className="space-y-6 animate-fade-in">

            {/* Filters & Actions Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                    <div className="relative flex-1 min-w-[300px]">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="BUSCAR POR NOME OU CPF..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className={`${inputClass} pl-10 uppercase`}
                        />
                    </div>

                    <div className="w-full md:w-32">
                        <select
                            className={inputClass}
                            value={yearFilter}
                            onChange={(e) => { setYearFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">ANO</option>
                            <option value="2024">2024</option>
                            <option value="2025">2025</option>
                            <option value="2026">2026</option>
                        </select>
                    </div>

                    <div className="w-full md:w-64">
                        <select
                            className={inputClass}
                            value={classFilter}
                            onChange={(e) => { setClassFilter(e.target.value); setCurrentPage(1); }}
                        >
                            <option value="">TODAS AS TURMAS</option>
                            {activeClasses.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()}</option>)}
                        </select>
                    </div>
                </div>
            </div>

            {/* Certificates Table */}
            <div className="card-premium overflow-hidden animate-slide-up">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 border-collapse">
                        <thead className="bg-white text-gray-700">
                            <tr>
                                <th className="px-3 py-3 text-left text-xs font-bold uppercase border border-gray-200 whitespace-nowrap sticky left-0 bg-white z-10">Aluno</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Curso / Turma</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Conclusão</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Matrícula</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Registro</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">CAP-BA</th>
                                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 sticky right-0 bg-white z-10">Ações</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {paginatedCertificates.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-12 text-center text-gray-500 border border-gray-200">
                                        Nenhum certificado encontrado para os filtros selecionados.
                                    </td>
                                </tr>
                            ) : (
                                paginatedCertificates.map((cert) => (
                                    <tr key={cert.id} className="hover:bg-gray-50 transition-colors group">
                                        <td className="px-3 py-2 whitespace-nowrap border border-gray-200 sticky left-0 bg-white group-hover:bg-gray-50 z-10">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-gray-900 uppercase">{cert.name}</span>
                                                <span className="text-[10px] text-gray-500 font-mono">{formatCPF(cert.cpf)}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center whitespace-nowrap border border-gray-200">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-bold text-gray-900 uppercase">{cert.courseName}</span>
                                                <span className="text-[10px] text-gray-500 uppercase">{cert.className}</span>
                                            </div>
                                        </td>
                                        <td className="px-3 py-2 text-center whitespace-nowrap border border-gray-200">
                                            <span className="text-[10px] font-semibold text-gray-700 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                                                {formatDate(cert.endDate)}
                                            </span>
                                        </td>
                                        <td className="px-3 py-2 text-center whitespace-nowrap text-[10px] font-medium text-gray-600 uppercase border border-gray-200">
                                            {cert.matricula}
                                        </td>
                                        <td className="px-3 py-2 text-center whitespace-nowrap text-[10px] font-medium text-gray-600 uppercase border border-gray-200">
                                            {cert.registro}
                                        </td>
                                        <td className="px-3 py-2 text-center whitespace-nowrap text-[10px] font-medium text-gray-600 uppercase border border-gray-200">
                                            {cert.capBa}
                                        </td>
                                        <td className="px-3 py-2 whitespace-nowrap text-center border border-gray-200 sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                                            <button
                                                onClick={() => handlePrint(cert.id)}
                                                className="btn-base btn-edit px-3 py-1 text-xs inline-flex items-center gap-1"
                                                title="Emitir Certificado"
                                            >
                                                EMITIR
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination Controls */}
                {filteredCertificates.length > 0 && (
                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                        <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
                            Mostrando <span className="font-medium text-gray-700">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium text-gray-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredCertificates.length)}</span> de <span className="font-medium text-gray-700">{filteredCertificates.length}</span> resultados
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
                )}
            </div>
        </div>
    );
};
