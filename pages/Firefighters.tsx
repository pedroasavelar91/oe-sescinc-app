
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, Firefighter, Region, AirportClass, FirefighterLog, Base, Student } from '../types';
import { Plus, Search, X, Edit2, Trash2, Flame, Clock, AlertTriangle, FileText, Save, Download, MapPin, UserPlus } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';
import { FirefighterChartViz } from '../components/DashboardCharts';
import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter, inputClass, labelClass } from '../components/StandardModal';

export const FirefightersPage: React.FC = () => {
    const { firefighters, firefighterLogs, addFirefighter, updateFirefighter, deleteFirefighter, addFirefighterLog, currentUser, bases, addBase, deleteBase, classes, addStudent } = useStore();
    const [activeTab, setActiveTab] = useState<'list' | 'dashboard' | 'bases'>('list');

    const formatCPF = (value: string) => {
        return value
            .replace(/\D/g, '')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d)/, '$1.$2')
            .replace(/(\d{3})(\d{1,2})/, '$1-$2')
            .replace(/(-\d{2})\d+?$/, '$1');
    };

    // Form State
    const [showModal, setShowModal] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState<Partial<Firefighter>>({
        region: 'Sudeste',
        airportClass: 'I',
        isNotUpdated: false,
        isAway: false
    });

    // Base Management State
    const [newBase, setNewBase] = useState<Partial<Base>>({ region: 'Sudeste', airportClass: 'I' });
    const [showBaseModal, setShowBaseModal] = useState(false);

    // Enrollment Modal State
    const [showEnrollModal, setShowEnrollModal] = useState(false);
    const [selectedFirefighterForEnroll, setSelectedFirefighterForEnroll] = useState<Firefighter | null>(null);
    const [selectedClassForEnroll, setSelectedClassForEnroll] = useState('');

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [baseFilter, setBaseFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState('');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
    const [validityType, setValidityType] = useState<'AT' | 'FOGO'>('AT');

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const ITEMS_PER_PAGE = 15;

    // Reset pagination when filters change
    React.useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, baseFilter, regionFilter]);

    if (!currentUser) return null;
    const canEdit = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR || currentUser.role === UserRole.EMBAIXADOR;
    const isManager = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;

    // --- Base Restriction Logic ---
    // Treat '-' or empty string as "no base" (show all firefighters)
    const userBase = currentUser.base;
    const hasBaseRestriction = userBase && userBase !== '-' && userBase.trim() !== '';
    const displayedFirefighters = useMemo(() => {
        if (hasBaseRestriction) {
            return firefighters.filter(f => f.base === userBase);
        }
        return firefighters;
    }, [firefighters, userBase, hasBaseRestriction]);

    // --- Logic ---

    const calculateExpirations = (ff: Firefighter) => {
        const validityYears = (ff.airportClass === 'I' || ff.airportClass === 'II') ? 4 : 2;

        const baseDateStr = ff.isNotUpdated ? ff.graduationDate : ff.lastUpdateDate;
        const baseDate = new Date(baseDateStr);

        const atExpiry = new Date(baseDate);
        atExpiry.setFullYear(atExpiry.getFullYear() + validityYears);

        let fireExpiry: Date | null = null;
        if (ff.airportClass === 'IV') {
            const fireBaseStr = ff.isNotUpdated ? ff.graduationDate : (ff.lastFireExerciseDate || ff.graduationDate);
            const fireBase = new Date(fireBaseStr);
            fireExpiry = new Date(fireBase);
            fireExpiry.setFullYear(fireExpiry.getFullYear() + 2);
        }

        return { atExpiry, fireExpiry };
    };

    const handleBaseChange = (baseName: string) => {
        // Auto-fill region and class based on selected Base
        const selectedBase = bases.find(b => b.name === baseName);
        if (selectedBase) {
            setFormData(prev => ({
                ...prev,
                base: baseName,
                region: selectedBase.region,
                airportClass: selectedBase.airportClass
            }));
        } else {
            setFormData(prev => ({ ...prev, base: baseName }));
        }
    };

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.base || !formData.graduationDate || !formData.lastUpdateDate) {
            alert('Preencha os campos obrigatórios.');
            return;
        }

        const newFF: Firefighter = {
            id: editingId || crypto.randomUUID(),
            name: formData.name,
            cpf: formData.cpf || '',
            base: formData.base,
            region: formData.region as Region,
            airportClass: formData.airportClass as AirportClass,
            graduationDate: formData.graduationDate,
            lastUpdateDate: formData.lastUpdateDate,
            isNotUpdated: !!formData.isNotUpdated,
            lastFireExerciseDate: formData.lastFireExerciseDate,
            isAway: !!formData.isAway,
            awayStartDate: formData.awayStartDate,
            awayEndDate: formData.awayEndDate,
            awayReason: formData.awayReason
        };

        const log: FirefighterLog = {
            id: crypto.randomUUID(),
            firefighterId: newFF.id,
            firefighterName: newFF.name,
            timestamp: new Date().toISOString(),
            userId: currentUser.id,
            userName: currentUser.name,
            details: editingId ? 'Atualizou cadastro' : 'Criou novo bombeiro'
        };

        if (editingId) {
            updateFirefighter(newFF);
        } else {
            addFirefighter(newFF);
        }
        addFirefighterLog(log);

        setShowModal(false);
        resetForm();
    };

    const handleAddBase = () => {
        if (!newBase.name) return;
        const b: Base = {
            id: crypto.randomUUID(),
            name: newBase.name,
            region: newBase.region as Region,
            airportClass: newBase.airportClass as AirportClass
        };
        addBase(b);
        setNewBase({ region: 'Sudeste', airportClass: 'I', name: '' });
    };

    const resetForm = () => {
        setEditingId(null);
        setFormData({
            region: 'Sudeste',
            airportClass: 'I',
            isNotUpdated: false,
            isAway: false,
            base: userBase || ''
        });
    };

    const handleEdit = (ff: Firefighter) => {
        setEditingId(ff.id);
        setFormData({ ...ff });
        setShowModal(true);
    };

    const handleDelete = (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir?')) {
            deleteFirefighter(id);
        }
    };

    // --- Matrix Data Calculation ---
    const matrixData = useMemo(() => {
        const selectedYear = parseInt(yearFilter);
        const uniqueBases = Array.from(new Set(displayedFirefighters.map(f => f.base))).sort() as string[];
        const months = Array.from({ length: 12 }, (_, i) => i); // 0-11

        // Initialize Matrix: { [base]: { [month]: count } }
        const data: { [base: string]: { [month: number]: number } } = {};
        uniqueBases.forEach(b => {
            data[b] = {};
            months.forEach(m => data[b][m] = 0);
        });

        // Footer Totals
        const monthTotals: number[] = Array(12).fill(0);

        displayedFirefighters.forEach(ff => {
            if (regionFilter && ff.region !== regionFilter) return;
            if (ff.isAway && ff.awayEndDate && new Date() < new Date(ff.awayEndDate)) return; // Skip away if required

            const { atExpiry, fireExpiry } = calculateExpirations(ff);

            if (validityType === 'AT') {
                if (atExpiry.getFullYear() === selectedYear) {
                    const m = atExpiry.getMonth();
                    if (data[ff.base]) {
                        data[ff.base][m]++;
                        monthTotals[m]++;
                    }
                }
            } else {
                if (fireExpiry && fireExpiry.getFullYear() === selectedYear) {
                    const m = fireExpiry.getMonth();
                    if (data[ff.base]) {
                        data[ff.base][m]++;
                        monthTotals[m]++;
                    }
                }
            }
        });

        return { uniqueBases, data, monthTotals };
    }, [displayedFirefighters, yearFilter, regionFilter, validityType]);

    const handleOpenEnrollModal = (ff: Firefighter) => {
        setSelectedFirefighterForEnroll(ff);
        setSelectedClassForEnroll('');
        setShowEnrollModal(true);
    };

    const handleEnrollment = () => {
        if (!selectedFirefighterForEnroll || !selectedClassForEnroll) return;

        // Find Base ID using Firefighter Base Name
        const baseObj = bases.find(b => b.name === selectedFirefighterForEnroll.base);

        const newStudent: Student = {
            id: crypto.randomUUID(),
            name: selectedFirefighterForEnroll.name,
            cpf: selectedFirefighterForEnroll.cpf,
            classId: selectedClassForEnroll,
            enrollmentStatus: 'Pendente',
            isEmployee: true,
            baseId: baseObj ? baseObj.id : undefined,

            // Empty defaults
            rg: '',
            rgIssuer: '',
            birthDate: '',
            phone: '',
            email: '',
            origin: '',
            address: '',
            nationality: 'BRASILEIRA',
            motherName: '',
            fatherName: '',
            grades: {},
            finalTheory: 0,
            finalPractical: 0,
            finalGrade: 0
        };

        addStudent(newStudent);
        setShowEnrollModal(false);
        alert('Bombeiro matriculado com sucesso! Complete o cadastro na página de Alunos.');
    };

    const exportMatrixToCSV = () => {
        const headers = ["BASE", ...monthNames, "TOTAL"];
        const rows = matrixData.uniqueBases.map(base => {
            const rowTotal = (Object.values(matrixData.data[base]) as number[]).reduce((a, b) => a + b, 0);
            const monthCells = monthNames.map((_, idx) => matrixData.data[base][idx] || 0);
            return [base, ...monthCells, rowTotal];
        });

        // Totals Row
        const totalRow = ["TOTAL", ...matrixData.monthTotals, matrixData.monthTotals.reduce((a, b) => a + b, 0)];
        rows.push(totalRow);

        const csvContent = "data:text/csv;charset=utf-8,"
            + headers.join(";") + "\n"
            + rows.map(e => e.join(";")).join("\n");

        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `Vencimentos_${validityType}_${yearFilter}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";
    const monthNames = ["JANEIRO", "FEVEREIRO", "MARÇO", "ABRIL", "MAIO", "JUNHO", "JULHO", "AGOSTO", "SETEMBRO", "OUTUBRO", "NOVEMBRO", "DEZEMBRO"];

    const filteredFirefighters = useMemo(() => {
        return displayedFirefighters.filter(f => {
            const matchName = f.name.toLowerCase().includes(searchTerm.toLowerCase());
            const matchBase = baseFilter ? f.base === baseFilter : true;
            const matchReg = regionFilter ? f.region === regionFilter : true;
            return matchName && matchBase && matchReg;
        });
    }, [displayedFirefighters, searchTerm, baseFilter, regionFilter]);

    const totalPages = Math.ceil(filteredFirefighters.length / ITEMS_PER_PAGE);
    const paginatedFirefighters = useMemo(() => {
        const start = (currentPage - 1) * ITEMS_PER_PAGE;
        return filteredFirefighters.slice(start, start + ITEMS_PER_PAGE);
    }, [filteredFirefighters, currentPage]);

    // Calculate available years for the year filter (from current year to max expiration year)
    const availableYears = useMemo(() => {
        const currentYear = new Date().getFullYear();
        let maxYear = currentYear;

        displayedFirefighters.forEach(ff => {
            const { atExpiry, fireExpiry } = calculateExpirations(ff);
            if (atExpiry.getFullYear() > maxYear) maxYear = atExpiry.getFullYear();
            if (fireExpiry && fireExpiry.getFullYear() > maxYear) maxYear = fireExpiry.getFullYear();
        });

        const years: string[] = [];
        for (let y = currentYear; y <= maxYear; y++) {
            years.push(y.toString());
        }
        return years;
    }, [displayedFirefighters]);

    // Calculate chart data using page filters
    const chartData = useMemo(() => {
        const months = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
        const stats = months.map(m => ({ name: m, updates: 0, exercises: 0 }));

        displayedFirefighters.forEach(ff => {
            // Apply Global Filters
            if (searchTerm && !ff.name.toLowerCase().includes(searchTerm.toLowerCase())) return;
            if (baseFilter && ff.base !== baseFilter) return;
            if (regionFilter && ff.region !== regionFilter) return;

            const { atExpiry, fireExpiry } = calculateExpirations(ff);

            // Updates
            if (atExpiry.getFullYear().toString() === yearFilter) {
                stats[atExpiry.getMonth()].updates++;
            }
            // Exercises
            if (fireExpiry && fireExpiry.getFullYear().toString() === yearFilter) {
                stats[fireExpiry.getMonth()].exercises++;
            }
        });

        return stats;
    }, [displayedFirefighters, searchTerm, baseFilter, regionFilter, yearFilter]);

    return (
        <>
            <div className="space-y-6 animate-fade-in">

                {/* Tabs */}
                <div className="border-b border-gray-200">
                    <nav className="-mb-px flex space-x-8">
                        <button
                            onClick={() => setActiveTab('list')}
                            className={`${activeTab === 'list' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 uppercase`}
                        >
                            BOMBEIROS
                        </button>
                        <button
                            onClick={() => setActiveTab('dashboard')}
                            className={`${activeTab === 'dashboard' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 uppercase`}
                        >
                            PAINEL DE VALIDADES
                        </button>
                        {isManager && (
                            <button
                                onClick={() => setActiveTab('bases')}
                                className={`${activeTab === 'bases' ? 'border-orange-500 text-orange-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm flex items-center gap-2 uppercase`}
                            >
                                GERENCIAR BASES
                            </button>
                        )}
                    </nav>
                </div>

                {/* Filters & Actions Header */}
                {activeTab === 'list' && (
                    <div className="space-y-6">
                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                            <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
                                <div className="relative flex-1 min-w-[300px]">
                                    <input
                                        type="text"
                                        placeholder="BUSCAR POR NOME..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className={`${inputClass} uppercase`}
                                    />
                                </div>
                                <div className="w-full md:w-48">
                                    <select className={inputClass} value={baseFilter} onChange={e => setBaseFilter(e.target.value)}>
                                        <option value="">TODAS AS BASES</option>
                                        {[...bases].sort((a, b) => a.name.localeCompare(b.name)).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div className="w-full md:w-48">
                                    <select className={inputClass} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                                        <option value="">TODAS AS REGIÕES</option>
                                        <option value="Norte">NORTE</option>
                                        <option value="Nordeste">NORDESTE</option>
                                        <option value="Centro-Oeste">CENTRO-OESTE</option>
                                        <option value="Sudeste">SUDESTE</option>
                                        <option value="Sul">SUL</option>
                                    </select>
                                </div>
                            </div>

                            <div className="flex gap-2 w-full md:w-auto justify-end">
                                {canEdit && (
                                    <button
                                        onClick={() => { resetForm(); setShowModal(true); }}
                                        className="btn-base btn-insert flex items-center justify-center px-8 py-3 text-sm font-bold"
                                    >
                                        INSERIR
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                )}

                {activeTab === 'list' && (
                    <>
                        <div className="card-premium animate-fade-in text-gray-800">
                            <div className="overflow-x-auto custom-scrollbar relative">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-white text-gray-700">
                                        <tr>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase border border-gray-200">Nome</th>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase border border-gray-200">Base / Região</th>
                                            <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Classe</th>
                                            <th className="px-3 py-3 text-left text-xs font-bold uppercase border border-gray-200">Atualização</th>
                                            <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Exerc. Fogo</th>
                                            <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200">Status</th>
                                            {canEdit && <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 min-w-[200px]">Ações</th>}
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {paginatedFirefighters.length > 0 ? (
                                            paginatedFirefighters.map(ff => {
                                                const { atExpiry, fireExpiry } = calculateExpirations(ff);
                                                const today = new Date();
                                                const isAtExpired = today > atExpiry;
                                                const isFireExpired = fireExpiry && today > fireExpiry;

                                                return (
                                                    <tr key={ff.id} className="hover:bg-gray-50 transition-colors duration-150">
                                                        <td className="px-3 py-2 text-xs font-bold text-gray-900 uppercase border border-gray-200">{ff.name}</td>
                                                        <td className="px-3 py-2 text-xs text-gray-500 uppercase border border-gray-200">
                                                            {ff.base} <span className="text-xs text-gray-400">({ff.region})</span>
                                                        </td>
                                                        <td className="px-3 py-2 text-center text-xs font-bold uppercase border border-gray-200">{ff.airportClass}</td>
                                                        <td className="px-3 py-2 text-xs border border-gray-200">
                                                            <div className="space-y-1">
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs text-gray-500 uppercase">ÚLTIMA:</span>
                                                                    <span className="font-medium text-gray-900">
                                                                        {new Date(ff.isNotUpdated ? ff.graduationDate : ff.lastUpdateDate).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs text-gray-500 uppercase">VENCE:</span>
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isAtExpired
                                                                        ? 'bg-red-100 text-red-800'
                                                                        : 'bg-green-100 text-green-800'
                                                                        }`}>
                                                                        {isAtExpired && '⚠️ '}
                                                                        {atExpiry.toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="px-3 py-2 text-xs text-center border border-gray-200">
                                                            {ff.airportClass === 'IV' ? (
                                                                <div className="space-y-1 inline-block text-left">
                                                                    <div className="flex items-center space-x-2">
                                                                        <span className="text-xs text-gray-500 uppercase">ÚLTIMO:</span>
                                                                        <span className="font-medium text-gray-900">
                                                                            {new Date(ff.isNotUpdated ? ff.graduationDate : (ff.lastFireExerciseDate || ff.graduationDate)).toLocaleDateString()}
                                                                        </span>
                                                                    </div>
                                                                    {fireExpiry && (
                                                                        <div className="flex items-center space-x-2">
                                                                            <span className="text-xs text-gray-500 uppercase">VENCE:</span>
                                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-bold ${isFireExpired
                                                                                ? 'bg-orange-100 text-orange-800'
                                                                                : 'bg-blue-100 text-blue-800'
                                                                                }`}>
                                                                                {isFireExpired && '🔥 '}
                                                                                {fireExpiry.toLocaleDateString()}
                                                                            </span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            ) : (
                                                                <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500 uppercase">
                                                                    N/A
                                                                </span>
                                                            )}
                                                        </td>
                                                        <td className="px-3 py-2 text-center border border-gray-200">
                                                            {ff.isAway ? (
                                                                <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs font-bold rounded-full uppercase">AFASTADO</span>
                                                            ) : (
                                                                <span className="px-2 py-1 bg-green-100 text-green-800 text-xs font-bold rounded-full uppercase">ATIVO</span>
                                                            )}
                                                        </td>
                                                        {canEdit && (
                                                            <td className="px-3 py-2 text-center border border-gray-200">
                                                                <div className="flex justify-center gap-2">
                                                                    <button onClick={() => handleEdit(ff)} className="btn-base btn-edit px-3 py-1 text-xs">EDITAR</button>
                                                                    <button onClick={() => handleDelete(ff.id)} className="btn-base btn-delete px-3 py-1 text-xs">EXCLUIR</button>
                                                                    <button
                                                                        onClick={() => handleOpenEnrollModal(ff)}
                                                                        className="btn-base btn-insert px-3 py-1 text-xs flex items-center gap-1"
                                                                        title="Matricular em Turma"
                                                                    >
                                                                        <UserPlus size={14} />
                                                                        MATRICULAR
                                                                    </button>
                                                                </div>
                                                            </td>
                                                        )}
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                                    Nenhum bombeiro encontrado com os filtros selecionados.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Pagination Controls */}
                            {totalPages > 1 && (
                                <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
                                    <span className="text-sm text-gray-700 uppercase">
                                        Mostrando <span className="font-medium">{(currentPage - 1) * ITEMS_PER_PAGE + 1}</span> a <span className="font-medium">{Math.min(currentPage * ITEMS_PER_PAGE, filteredFirefighters.length)}</span> de <span className="font-medium">{filteredFirefighters.length}</span> resultados
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

                        {/* Log Section */}
                        {/* Log Section */}

                    </>
                )}




                {activeTab === 'dashboard' && (
                    <div className="space-y-6">
                        {/* Controls */}
                        {/* Controls */}
                        <div className="card-premium animate-fade-in text-gray-800 flex flex-col sm:flex-row justify-between items-center gap-4">
                            <div className="flex w-full sm:w-auto">
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setValidityType('AT')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all duration-200 ${validityType === 'AT' ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        ATUALIZAÇÃO
                                    </button>
                                    <button
                                        onClick={() => setValidityType('FOGO')}
                                        className={`px-4 py-2 rounded-lg text-sm font-bold uppercase transition-all duration-200 ${validityType === 'FOGO' ? 'bg-[#FF6B35] text-white shadow-md' : 'bg-gray-100 text-gray-500 hover:bg-gray-200'}`}
                                    >
                                        FOGO
                                    </button>
                                </div>
                            </div>

                            {/* Filters for Graph */}
                            <div className="flex items-center gap-2 w-full sm:w-auto">
                                <select className={inputClass + " w-24"} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                                <select className={inputClass + " w-32"} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                                    <option value="">REGIÃO</option>
                                    <option value="Norte">NORTE</option>
                                    <option value="Nordeste">NORDESTE</option>
                                    <option value="Centro-Oeste">CENTRO-OESTE</option>
                                    <option value="Sudeste">SUDESTE</option>
                                    <option value="Sul">SUL</option>
                                </select>
                                <select className={inputClass + " w-32"} value={baseFilter} onChange={e => setBaseFilter(e.target.value)}>
                                    <option value="">BASE</option>
                                    {[...bases].sort((a, b) => a.name.localeCompare(b.name)).map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                </select>
                            </div>

                            <button
                                onClick={exportMatrixToCSV}
                                className="btn-base btn-edit flex items-center justify-center px-6 py-2 text-sm font-bold uppercase shadow-sm whitespace-nowrap transition-colors"
                            >
                                CSV
                            </button>
                        </div>

                        {/* Main Dashboard Card */}
                        {/* Main Dashboard Card */}
                        <div className="card-premium animate-fade-in text-gray-800">
                            {/* Chart Header Replacement */}
                            <div className="bg-white border-b border-gray-200 p-6">
                                <div className="flex justify-between items-start mb-4">
                                    <div className="flex-1"></div>
                                    <div className="text-sm px-4 py-2 rounded-xl border shadow-sm" style={{ color: '#6B7280', backgroundColor: '#FFFFFF', borderColor: '#E5E7EB' }}>
                                        <span className="font-bold text-xs uppercase">ATUALIZADO: {new Date().toLocaleDateString('pt-BR')}</span>
                                    </div>
                                </div>
                                <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide mb-4 text-center">
                                    CONTROLE DE VALIDADES
                                </h3>
                                <FirefighterChartViz data={chartData} activeSeries={validityType} />
                            </div>

                            {/* Summary Header - REMOVED as per previous request, keeping Table below */}

                            {/* Table */}
                            <div className="overflow-x-auto max-h-[600px] custom-scrollbar">
                                {/* ... Table Content ... */}
                                <table className="min-w-full divide-y divide-gray-200 border-collapse">
                                    <thead className="bg-white text-gray-700 sticky top-0 z-20">
                                        <tr className="bg-gray-50 border-b border-gray-200">
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider w-32 sticky left-0 bg-gray-50 z-30 border border-gray-200 whitespace-nowrap">
                                                BASE
                                            </th>
                                            {monthNames.map(m => (
                                                <th key={m} className="px-2 py-3 text-center text-[10px] font-bold text-gray-700 uppercase tracking-wide border border-gray-200 min-w-[70px] bg-gray-50 whitespace-nowrap">
                                                    {m.substring(0, 3)}/{yearFilter.slice(2)}
                                                </th>
                                            ))}
                                            <th className="px-4 py-3 text-center text-xs font-bold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-50 z-30 border border-gray-200 whitespace-nowrap">
                                                TOTAL
                                            </th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {matrixData.uniqueBases.map((base, baseIndex) => {
                                            const rowTotal = (Object.values(matrixData.data[base]) as number[]).reduce((a, b) => a + b, 0);
                                            const isEvenRow = baseIndex % 2 === 0;

                                            return (
                                                <tr key={base} className="bg-white hover:bg-gray-50 transition-colors duration-150">
                                                    <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 sticky left-0 bg-white border border-gray-200 z-10 whitespace-nowrap">
                                                        {base}
                                                    </td>
                                                    {monthNames.map((_, index) => {
                                                        const count = matrixData.data[base][index];
                                                        return (
                                                            <td key={index} className="px-2 py-3 text-center border border-gray-200">
                                                                {count > 0 ? (
                                                                    <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-gray-800 text-white text-sm font-bold rounded-md">
                                                                        {count}
                                                                    </span>
                                                                ) : (
                                                                    <span className="text-gray-300 font-medium">0</span>
                                                                )}
                                                            </td>
                                                        );
                                                    })}
                                                    <td className="px-4 py-3 text-center text-sm font-bold sticky right-0 bg-white border border-gray-200 z-10 whitespace-nowrap">
                                                        <span className={`${rowTotal > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                                            {rowTotal}
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {/* Totals Row */}
                                        <tr className="bg-white border-t-2 border-gray-300 sticky bottom-0 z-20 shadow-inner">
                                            <td className="px-4 py-3 text-sm font-bold text-gray-900 text-center uppercase tracking-wide sticky left-0 bg-white border border-gray-300 z-30 whitespace-nowrap">
                                                TOTAL
                                            </td>
                                            {monthNames.map((_, index) => (
                                                <td key={index} className="px-2 py-3 text-center text-sm font-bold text-gray-900 border border-gray-300 bg-white whitespace-nowrap">
                                                    {matrixData.monthTotals[index]}
                                                </td>
                                            ))}
                                            <td className="px-4 py-3 text-center text-sm font-bold text-gray-900 bg-white sticky right-0 border border-gray-300 z-30 whitespace-nowrap">
                                                {matrixData.monthTotals.reduce((a, b) => a + b, 0)}
                                            </td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>

                            {/* Footer Info - Legend Removed */}
                        </div>
                    </div>
                )}

                {/* Base Management Tab */}
                {/* Base Management Tab */}
                {activeTab === 'bases' && isManager && (
                    <div className="card-premium animate-fade-in text-gray-800">
                        <div className="flex justify-end mb-4">
                            <button
                                onClick={() => setShowBaseModal(true)}
                                className="btn-base btn-insert flex items-center justify-center px-6 py-2 text-sm font-bold uppercase transition-all duration-200"
                            >
                                INSERIR
                            </button>
                        </div>

                        <StandardModal
                            isOpen={showBaseModal}
                            onClose={() => setShowBaseModal(false)}
                            maxWidth="max-w-md"
                        >
                            <StandardModalHeader onClose={() => setShowBaseModal(false)} title="" />
                            <div className="w-full">
                                <StandardModalBody>
                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClass}>SIGLA/NOME</label>
                                            <input
                                                className={`${inputClass} uppercase`}
                                                placeholder="EX: SBGR"
                                                value={newBase.name}
                                                onChange={e => setNewBase({ ...newBase, name: e.target.value.toUpperCase() })}
                                            />
                                        </div>
                                        <div>
                                            <label className={labelClass}>REGIÃO</label>
                                            <select className={inputClass} value={newBase.region} onChange={e => setNewBase({ ...newBase, region: e.target.value as Region })}>
                                                <option value="Norte">NORTE</option>
                                                <option value="Nordeste">NORDESTE</option>
                                                <option value="Centro-Oeste">CENTRO-OESTE</option>
                                                <option value="Sudeste">SUDESTE</option>
                                                <option value="Sul">SUL</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className={labelClass}>CLASSE</label>
                                            <select className={inputClass} value={newBase.airportClass} onChange={e => setNewBase({ ...newBase, airportClass: e.target.value as AirportClass })}>
                                                <option value="I">CLASSE I</option>
                                                <option value="II">CLASSE II</option>
                                                <option value="III">CLASSE III</option>
                                                <option value="IV">CLASSE IV</option>
                                            </select>
                                        </div>
                                    </div>
                                </StandardModalBody>
                                <StandardModalFooter className="px-6 pb-6">
                                    <div className="flex justify-end gap-2 w-full">
                                        <button
                                            onClick={() => setShowBaseModal(false)}
                                            className="btn-base btn-delete px-6 py-3 text-xs font-bold uppercase transition-colors"
                                        >
                                            CANCELAR
                                        </button>
                                        <button
                                            onClick={() => {
                                                handleAddBase();
                                                setShowBaseModal(false);
                                            }}
                                            className="btn-base btn-save px-6 py-3 text-xs font-bold uppercase transition-colors"
                                        >
                                            SALVAR
                                        </button>
                                    </div>
                                </StandardModalFooter>
                            </div>
                        </StandardModal>

                        <StandardModal
                            isOpen={showEnrollModal}
                            onClose={() => setShowEnrollModal(false)}
                            maxWidth="max-w-md"
                        >
                            <StandardModalHeader onClose={() => setShowEnrollModal(false)} title="" />
                            <div className="w-full">
                                <StandardModalBody>
                                    <div className="text-center mb-6">
                                        <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                            <UserPlus className="text-orange-600" size={24} />
                                        </div>
                                        <h3 className="text-lg font-bold text-gray-900 uppercase">MATRICULAR BOMBEIRO</h3>
                                        <p className="text-sm text-gray-500 mt-1 uppercase font-bold text-orange-600">{selectedFirefighterForEnroll?.name}</p>
                                    </div>

                                    <div className="space-y-4">
                                        <div>
                                            <label className={labelClass}>SELECIONE A TURMA</label>
                                            <select
                                                className={inputClass}
                                                value={selectedClassForEnroll}
                                                onChange={e => setSelectedClassForEnroll(e.target.value)}
                                            >
                                                <option value="">SELECIONE...</option>
                                                {classes.filter(c => new Date(c.endDate) >= new Date()).map(c => (
                                                    <option key={c.id} value={c.id}>
                                                        {c.name}
                                                    </option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </StandardModalBody>
                                <StandardModalFooter className="px-6 pb-6">
                                    <div className="flex justify-end gap-2 w-full">
                                        <button
                                            onClick={() => setShowEnrollModal(false)}
                                            className="btn-base btn-delete px-6 py-3 text-xs font-bold uppercase transition-colors"
                                        >
                                            CANCELAR
                                        </button>
                                        <button
                                            onClick={handleEnrollment}
                                            disabled={!selectedClassForEnroll}
                                            className="btn-base btn-save px-6 py-3 text-xs font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            CONFIRMAR
                                        </button>
                                    </div>
                                </StandardModalFooter>
                            </div>
                        </StandardModal>

                        <div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {[...bases].sort((a, b) => a.name.localeCompare(b.name)).map(base => (
                                    <div key={base.id} className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-lg hover:-translate-y-1 transition-all duration-300 group" style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #FF6B35' }}>
                                        <div className="bg-white px-6 py-5 flex justify-between items-center transition-colors" style={{ borderBottom: '1px solid #E5E7EB' }}>
                                            <div>
                                                <div className="font-bold text-gray-900 uppercase text-lg">{base.name}</div>
                                                <div className="text-xs text-gray-500 uppercase font-medium mt-1">{base.region} • CLASSE {base.airportClass}</div>
                                            </div>
                                            <button
                                                onClick={() => deleteBase(base.id)}
                                                className="btn-base btn-delete px-3 py-2 text-xs"
                                                title="Excluir Base"
                                            >
                                                EXCLUIR
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}

            </div >

            {/* Create/Edit Modal - Firefighter */}
            < StandardModal
                isOpen={showModal}
                onClose={() => setShowModal(false)}
                maxWidth="max-w-2xl"
            >
                <StandardModalHeader onClose={() => setShowModal(false)} title="" />
                <form onSubmit={handleSave}>
                    <StandardModalBody>
                        <div className="space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className={labelClass}>NOME COMPLETO</label>
                                    <input className={`${inputClass} uppercase`} value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value.toUpperCase() })} />
                                </div>
                                <div className="md:col-span-2">
                                    <label className={labelClass}>CPF</label>
                                    <input
                                        className={inputClass}
                                        value={formData.cpf || ''}
                                        onChange={e => setFormData({ ...formData, cpf: formatCPF(e.target.value) })}
                                        placeholder="000.000.000-00"
                                        maxLength={14}
                                    />
                                </div>
                                <div>
                                    <label className={labelClass}>BASE</label>
                                    <select
                                        className={inputClass}
                                        value={formData.base || ''}
                                        onChange={e => handleBaseChange(e.target.value)}
                                    >
                                        <option value="">SELECIONE...</option>
                                        {bases.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className={labelClass}>REGIÃO</label>
                                    <input className={`${inputClass} bg-gray-100 uppercase`} value={formData.base ? (formData.region || '') : ''} disabled />
                                </div>
                                <div>
                                    <label className={labelClass}>CLASSE DO AEROPORTO</label>
                                    <input className={`${inputClass} bg-gray-100 uppercase`} value={formData.base && formData.airportClass ? `CLASSE ${formData.airportClass}` : ''} disabled />
                                </div>
                                <div>
                                    <label className={labelClass}>DATA DE FORMAÇÃO</label>
                                    <input type="date" className={`${inputClass} uppercase`} value={formData.graduationDate || ''} onChange={e => setFormData({ ...formData, graduationDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 border border-blue-100 rounded-lg">
                                <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                                    <div>
                                        <label className={labelClass}>ÚLTIMA ATUALIZAÇÃO</label>
                                        <input type="date" className={`${inputClass} uppercase`} value={formData.lastUpdateDate || ''} onChange={e => setFormData({ ...formData, lastUpdateDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>

                            {formData.airportClass === 'IV' && (
                                <div className="bg-orange-50 p-4 border border-orange-100 rounded-lg">
                                    <div>
                                        <label className={labelClass}>ÚLTIMO EXERCÍCIO COM FOGO</label>
                                        <input type="date" className={`${inputClass} uppercase`} value={formData.lastFireExerciseDate || ''} onChange={e => setFormData({ ...formData, lastFireExerciseDate: e.target.value })} />
                                    </div>
                                </div>
                            )}

                            <div className="bg-gray-100 p-4 border border-gray-200 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-900 uppercase">STATUS DE AFASTAMENTO</h4>
                                    <div className="flex items-center">
                                        <input
                                            id="isAway"
                                            type="checkbox"
                                            className="h-5 w-5 text-red-600 border-gray-300 focus:ring-red-500 rounded"
                                            checked={formData.isAway}
                                            onChange={e => setFormData({ ...formData, isAway: e.target.checked })}
                                        />
                                        <label htmlFor="isAway" className="ml-2 text-sm text-gray-700 font-bold uppercase">BOMBEIRO AFASTADO</label>
                                    </div>
                                </div>

                                {formData.isAway && (
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-fade-in">
                                        <div>
                                            <label className={labelClass}>INÍCIO AFASTAMENTO</label>
                                            <input type="date" className={`${inputClass} uppercase`} value={formData.awayStartDate || ''} onChange={e => setFormData({ ...formData, awayStartDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className={labelClass}>FIM AFASTAMENTO</label>
                                            <input type="date" className={`${inputClass} uppercase`} value={formData.awayEndDate || ''} onChange={e => setFormData({ ...formData, awayEndDate: e.target.value })} />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className={labelClass}>MOTIVO</label>
                                            <input type="text" className={`${inputClass} uppercase`} value={formData.awayReason || ''} onChange={e => setFormData({ ...formData, awayReason: e.target.value.toUpperCase() })} />
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </StandardModalBody>
                    <StandardModalFooter className="px-6 pb-6">
                        <div className="flex justify-end gap-2 w-full">
                            <button
                                type="button"
                                onClick={() => setShowModal(false)}
                                className="btn-base btn-delete px-6 py-3 text-xs font-bold uppercase transition-colors"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="submit"
                                className="btn-base btn-save px-6 py-3 text-xs font-bold uppercase transition-colors"
                            >
                                SALVAR
                            </button>
                        </div>
                    </StandardModalFooter>
                </form>
            </StandardModal >

            {/* Enrollment Modal */}
            <StandardModal
                isOpen={showEnrollModal}
                onClose={() => setShowEnrollModal(false)}
                maxWidth="max-w-md"
            >
                <StandardModalHeader onClose={() => setShowEnrollModal(false)} title="" />
                <div className="w-full">
                    <StandardModalBody>
                        <div className="text-center mb-6">
                            <div className="mx-auto w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                                <UserPlus className="text-orange-600" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-gray-900 uppercase">MATRICULAR BOMBEIRO</h3>
                            <p className="text-sm text-gray-500 mt-1 uppercase font-bold text-orange-600">{selectedFirefighterForEnroll?.name}</p>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className={labelClass}>SELECIONE A TURMA</label>
                                <select
                                    className={inputClass}
                                    value={selectedClassForEnroll}
                                    onChange={e => setSelectedClassForEnroll(e.target.value)}
                                >
                                    <option value="">SELECIONE...</option>
                                    {classes
                                        .filter(c => {
                                            // Show only ongoing and upcoming classes (endDate >= today)
                                            const today = new Date().toISOString().split('T')[0];
                                            return c.endDate >= today;
                                        })
                                        .sort((a, b) => a.name.localeCompare(b.name))
                                        .map(c => (
                                            <option key={c.id} value={c.id}>{c.name}</option>
                                        ))}
                                </select>
                            </div>
                        </div>
                    </StandardModalBody>
                    <StandardModalFooter className="px-6 pb-6">
                        <div className="flex justify-end gap-2 w-full">
                            <button
                                type="button"
                                onClick={() => setShowEnrollModal(false)}
                                className="btn-base btn-delete px-6 py-3 text-xs font-bold uppercase transition-colors"
                            >
                                CANCELAR
                            </button>
                            <button
                                type="button"
                                onClick={handleEnrollment}
                                disabled={!selectedClassForEnroll}
                                className="btn-base btn-save px-6 py-3 text-xs font-bold uppercase transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                CONFIRMAR
                            </button>
                        </div>
                    </StandardModalFooter>
                </div>
            </StandardModal>
        </>
    );
};