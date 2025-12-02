
import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, Firefighter, Region, AirportClass, FirefighterLog, Base } from '../types';
import { Plus, Search, X, Edit2, Trash2, Flame, Clock, AlertTriangle, FileText, Save, Download, MapPin } from 'lucide-react';
import { ResponsiveContainer } from 'recharts';

export const FirefightersPage: React.FC = () => {
    const { firefighters, firefighterLogs, addFirefighter, updateFirefighter, deleteFirefighter, addFirefighterLog, currentUser, bases, addBase, deleteBase } = useStore();
    const [activeTab, setActiveTab] = useState<'list' | 'dashboard' | 'bases'>('list');

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

    // Filter State
    const [searchTerm, setSearchTerm] = useState('');
    const [baseFilter, setBaseFilter] = useState('');
    const [regionFilter, setRegionFilter] = useState('');
    const [yearFilter, setYearFilter] = useState(new Date().getFullYear().toString());
    const [validityType, setValidityType] = useState<'AT' | 'FOGO'>('AT');

    if (!currentUser) return null;
    const canEdit = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR || currentUser.role === UserRole.EMBAIXADOR;
    const isManager = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;

    // --- Base Restriction Logic ---
    const userBase = currentUser.base;
    const displayedFirefighters = useMemo(() => {
        if (userBase) {
            return firefighters.filter(f => f.base === userBase);
        }
        return firefighters;
    }, [firefighters, userBase]);

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
            id: editingId || Math.random().toString(36).substr(2, 9),
            name: formData.name,
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
            id: Math.random().toString(36).substr(2, 9),
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
            id: Math.random().toString(36).substr(2, 5),
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

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Gestão de Bombeiros</h1>
                    <p className="text-gray-500 mt-1">Gerencie bombeiros e validades</p>
                </div>
                {canEdit && activeTab === 'list' && (
                    <button
                        onClick={() => { resetForm(); setShowModal(true); }}
                        className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200"
                    >
                        <Plus size={20} />
                        <span className="font-semibold">Novo Bombeiro</span>
                    </button>
                )}
            </div>

            {/* Tabs */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('list')}
                        className={`${activeTab === 'list' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <FileText size={18} /> Cadastro e Listagem
                    </button>
                    <button
                        onClick={() => setActiveTab('dashboard')}
                        className={`${activeTab === 'dashboard' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                    >
                        <AlertTriangle size={18} /> Painel de Validades
                    </button>
                    {isManager && (
                        <button
                            onClick={() => setActiveTab('bases')}
                            className={`${activeTab === 'bases' ? 'border-primary-500 text-primary-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'} whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center gap-2`}
                        >
                            <MapPin size={18} /> Gerenciar Bases
                        </button>
                    )}
                </nav>
            </div>

            {/* Filters Toolbar */}
            {activeTab !== 'bases' && (
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-100 grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                        <input
                            type="text"
                            placeholder="Buscar por Nome"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
                        />
                    </div>
                    <div>
                        <select className={inputClass} value={baseFilter} onChange={e => setBaseFilter(e.target.value)}>
                            <option value="">Todas as Bases</option>
                            {bases.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                        </select>
                    </div>
                    <div>
                        <select className={inputClass} value={regionFilter} onChange={e => setRegionFilter(e.target.value)}>
                            <option value="">Todas as Regiões</option>
                            <option value="Norte">Norte</option>
                            <option value="Nordeste">Nordeste</option>
                            <option value="Centro-Oeste">Centro-Oeste</option>
                            <option value="Sudeste">Sudeste</option>
                            <option value="Sul">Sul</option>
                        </select>
                    </div>
                    {activeTab === 'dashboard' && (
                        <div>
                            <select className={inputClass} value={yearFilter} onChange={e => setYearFilter(e.target.value)}>
                                <option value="2024">2024</option>
                                <option value="2025">2025</option>
                                <option value="2026">2026</option>
                                <option value="2027">2027</option>
                            </select>
                        </div>
                    )}
                </div>
            )}

            {activeTab === 'list' && (
                <>
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nome</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Base / Região</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Classe</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Atualização</th>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Exerc. Fogo</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Status</th>
                                        {canEdit && <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Ações</th>}
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {displayedFirefighters.filter(f => {
                                        const matchName = f.name.toLowerCase().includes(searchTerm.toLowerCase());
                                        const matchBase = baseFilter ? f.base === baseFilter : true;
                                        const matchReg = regionFilter ? f.region === regionFilter : true;
                                        return matchName && matchBase && matchReg;
                                    }).map(ff => {
                                        const { atExpiry, fireExpiry } = calculateExpirations(ff);
                                        const today = new Date();
                                        const isAtExpired = today > atExpiry;
                                        const isFireExpired = fireExpiry && today > fireExpiry;

                                        return (
                                            <tr key={ff.id} className="hover:bg-gray-50">
                                                <td className="px-6 py-4 text-sm font-medium text-gray-900">{ff.name}</td>
                                                <td className="px-6 py-4 text-sm text-gray-500">{ff.base} <span className="text-xs text-gray-400">({ff.region})</span></td>
                                                <td className="px-6 py-4 text-center text-sm font-bold">{ff.airportClass}</td>
                                                <td className="px-6 py-4 text-sm">
                                                    <div className="space-y-1">
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500">Última:</span>
                                                            <span className="font-medium text-gray-900">
                                                                {new Date(ff.isNotUpdated ? ff.graduationDate : ff.lastUpdateDate).toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                        <div className="flex items-center space-x-2">
                                                            <span className="text-xs text-gray-500">Vence:</span>
                                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isAtExpired
                                                                ? 'bg-red-100 text-red-800'
                                                                : 'bg-green-100 text-green-800'
                                                                }`}>
                                                                {isAtExpired && '⚠️ '}
                                                                {atExpiry.toLocaleDateString()}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4 text-sm">
                                                    {ff.airportClass === 'IV' ? (
                                                        <div className="space-y-1">
                                                            <div className="flex items-center space-x-2">
                                                                <span className="text-xs text-gray-500">Último:</span>
                                                                <span className="font-medium text-gray-900">
                                                                    {new Date(ff.isNotUpdated ? ff.graduationDate : (ff.lastFireExerciseDate || ff.graduationDate)).toLocaleDateString()}
                                                                </span>
                                                            </div>
                                                            {fireExpiry && (
                                                                <div className="flex items-center space-x-2">
                                                                    <span className="text-xs text-gray-500">Vence:</span>
                                                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold ${isFireExpired
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
                                                        <span className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-500">
                                                            N/A
                                                        </span>
                                                    )}
                                                </td>
                                                <td className="px-6 py-4 text-center">
                                                    {ff.isAway ? (
                                                        <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded-full">Afastado</span>
                                                    ) : (
                                                        <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Ativo</span>
                                                    )}
                                                </td>
                                                {canEdit && (
                                                    <td className="px-6 py-4 text-right space-x-2">
                                                        <button onClick={() => handleEdit(ff)} className="text-blue-600 hover:text-blue-800"><Edit2 size={18} /></button>
                                                        <button onClick={() => handleDelete(ff.id)} className="text-red-600 hover:text-red-800"><Trash2 size={18} /></button>
                                                    </td>
                                                )}
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* Log Section */}
                    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden mt-8">
                        <div className="p-4 border-b border-gray-100 bg-gray-50 flex items-center gap-2">
                            <Clock size={18} className="text-gray-500" />
                            <h3 className="font-bold text-gray-900">Log de Atividades</h3>
                        </div>
                        <div className="max-h-60 overflow-y-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <tbody className="bg-white">
                                    {firefighterLogs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).map(log => (
                                        <tr key={log.id}>
                                            <td className="px-6 py-2 text-xs text-gray-500">{new Date(log.timestamp).toLocaleString()}</td>
                                            <td className="px-6 py-2 text-xs font-medium text-gray-900">{log.firefighterName}</td>
                                            <td className="px-6 py-2 text-xs text-gray-500">{log.userName}</td>
                                            <td className="px-6 py-2 text-xs text-gray-600">{log.details}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </>
            )}

            {activeTab === 'dashboard' && (
                <div className="space-y-6">
                    {/* Controls */}
                    <div className="flex flex-col sm:flex-row justify-between items-center bg-white p-4 rounded-xl shadow-sm border border-gray-200">
                        <div className="flex gap-2 mb-2 sm:mb-0">
                            <button
                                onClick={() => setValidityType('AT')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${validityType === 'AT' ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Atualização Técnica (AT)
                            </button>
                            <button
                                onClick={() => setValidityType('FOGO')}
                                className={`px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${validityType === 'FOGO' ? 'bg-gray-800 text-white shadow-sm' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                            >
                                Exercício com Fogo
                            </button>
                        </div>
                        <button
                            onClick={exportMatrixToCSV}
                            className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 text-sm font-medium transition-all duration-200"
                        >
                            <Download size={16} /> <span>Exportar CSV</span>
                        </button>
                    </div>

                    {/* Main Dashboard Card */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
                        {/* Header */}
                        <div className="bg-gray-50 border-b border-gray-200 p-6 text-center">
                            <h3 className="text-xl font-bold text-gray-900 uppercase tracking-wide">
                                Controle de Vencimentos OE-SESCINC - {yearFilter}
                            </h3>
                        </div>

                        {/* Summary Header */}
                        <div className="bg-gray-100 border-b border-gray-200 p-4">
                            <h4 className="text-center text-sm font-semibold text-gray-700 uppercase tracking-wider mb-3">
                                Total de Vencimentos
                            </h4>

                            {/* Month Summary Grid */}
                            <div className="grid grid-cols-13 gap-1">
                                <div className="bg-gray-200 rounded-lg p-2 text-center">
                                    <div className="text-[10px] font-semibold text-gray-700 uppercase">Base</div>
                                    <div className="text-xs font-bold text-gray-900 mt-1">Total</div>
                                </div>
                                {monthNames.map((month, index) => {
                                    const shortMonth = month.substring(0, 3);
                                    const count = matrixData.monthTotals[index];
                                    return (
                                        <div key={month} className="bg-gray-200 rounded-lg p-2 text-center">
                                            <div className="text-[10px] font-semibold text-gray-700">{shortMonth}/{yearFilter.slice(2)}</div>
                                            <div className="text-lg font-bold text-gray-900 mt-1">{count}</div>
                                        </div>
                                    );
                                })}
                                <div className="bg-gray-300 rounded-lg p-2 text-center">
                                    <div className="text-[10px] font-semibold text-gray-700 uppercase">Total</div>
                                    <div className="text-lg font-bold text-gray-900 mt-1">{matrixData.monthTotals.reduce((a, b) => a + b, 0)}</div>
                                </div>
                            </div>
                        </div>

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="min-w-full">
                                <thead>
                                    <tr className="bg-gray-200 border-b border-gray-300">
                                        <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider w-32 sticky left-0 bg-gray-200 z-10 border-r border-gray-300">
                                            Base
                                        </th>
                                        {monthNames.map(m => (
                                            <th key={m} className="px-2 py-3 text-center text-[10px] font-semibold text-gray-700 uppercase tracking-wide border-r border-gray-300 min-w-[70px]">
                                                {m.substring(0, 3)}/{yearFilter.slice(2)}
                                            </th>
                                        ))}
                                        <th className="px-4 py-3 text-center text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-gray-200 z-10 border-l border-gray-300">
                                            Total
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {matrixData.uniqueBases.map((base, baseIndex) => {
                                        const rowTotal = (Object.values(matrixData.data[base]) as number[]).reduce((a, b) => a + b, 0);
                                        const isEvenRow = baseIndex % 2 === 0;

                                        return (
                                            <tr key={base} className={`${isEvenRow ? 'bg-gray-50' : 'bg-white'} hover:bg-gray-100 transition-colors duration-150`}>
                                                <td className={`px-4 py-3 text-sm font-semibold text-gray-900 sticky left-0 ${isEvenRow ? 'bg-gray-50' : 'bg-white'} border-r border-gray-200 z-10`}>
                                                    {base}
                                                </td>
                                                {monthNames.map((_, index) => {
                                                    const count = matrixData.data[base][index];
                                                    return (
                                                        <td key={index} className="px-2 py-3 text-center border-r border-gray-100">
                                                            {count > 0 ? (
                                                                <span className="inline-flex items-center justify-center min-w-[28px] h-7 px-2 bg-gray-700 text-white text-sm font-semibold rounded-md">
                                                                    {count}
                                                                </span>
                                                            ) : (
                                                                <span className="text-gray-300 font-medium">0</span>
                                                            )}
                                                        </td>
                                                    );
                                                })}
                                                <td className={`px-4 py-3 text-center text-sm font-semibold sticky right-0 ${isEvenRow ? 'bg-gray-100' : 'bg-gray-50'} border-l-2 border-gray-300 z-10`}>
                                                    <span className={`${rowTotal > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                                                        {rowTotal}
                                                    </span>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {/* Totals Row */}
                                    <tr className="bg-gray-200 border-t-2 border-gray-300">
                                        <td className="px-4 py-3 text-sm font-semibold text-gray-900 text-left uppercase tracking-wide sticky left-0 bg-gray-200 border-r border-gray-300 z-10">
                                            Total
                                        </td>
                                        {monthNames.map((_, index) => (
                                            <td key={index} className="px-2 py-3 text-center text-sm font-semibold text-gray-900 border-r border-gray-300">
                                                {matrixData.monthTotals[index]}
                                            </td>
                                        ))}
                                        <td className="px-4 py-3 text-center text-sm font-semibold text-gray-900 bg-gray-300 sticky right-0 border-l border-gray-300 z-10">
                                            {matrixData.monthTotals.reduce((a, b) => a + b, 0)}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>

                        {/* Footer Info */}
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between text-sm text-gray-600">
                                <div className="flex items-center space-x-4">
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded mr-2"></div>
                                        <span>Vencimentos no mês</span>
                                    </div>
                                    <div className="flex items-center">
                                        <div className="w-4 h-4 bg-gray-300 rounded mr-2"></div>
                                        <span>Sem vencimentos</span>
                                    </div>
                                </div>
                                <div className="text-xs text-gray-500">
                                    Última atualização: {new Date().toLocaleDateString('pt-BR')}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}

            {/* Base Management Tab */}
            {activeTab === 'bases' && isManager && (
                <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
                    <div className="mb-6 pb-6 border-b border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-4">Adicionar Nova Base</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Sigla/Nome</label>
                                <input
                                    className={inputClass}
                                    placeholder="Ex: SBGR"
                                    value={newBase.name}
                                    onChange={e => setNewBase({ ...newBase, name: e.target.value.toUpperCase() })}
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Região</label>
                                <select className={inputClass} value={newBase.region} onChange={e => setNewBase({ ...newBase, region: e.target.value as Region })}>
                                    <option value="Norte">Norte</option>
                                    <option value="Nordeste">Nordeste</option>
                                    <option value="Centro-Oeste">Centro-Oeste</option>
                                    <option value="Sudeste">Sudeste</option>
                                    <option value="Sul">Sul</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Classe</label>
                                <select className={inputClass} value={newBase.airportClass} onChange={e => setNewBase({ ...newBase, airportClass: e.target.value as AirportClass })}>
                                    <option value="I">Classe I</option>
                                    <option value="II">Classe II</option>
                                    <option value="III">Classe III</option>
                                    <option value="IV">Classe IV</option>
                                </select>
                            </div>
                            <button
                                onClick={handleAddBase}
                                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 flex justify-center items-center gap-2 h-[38px]"
                            >
                                <Plus size={18} /> Adicionar
                            </button>
                        </div>
                    </div>

                    <div>
                        <h3 className="text-md font-bold text-gray-900 mb-4">Bases Cadastradas</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            {bases.map(base => (
                                <div key={base.id} className="p-4 bg-gray-50 rounded border border-gray-200 flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-gray-900">{base.name}</div>
                                        <div className="text-xs text-gray-500">{base.region} • Classe {base.airportClass}</div>
                                    </div>
                                    <button onClick={() => deleteBase(base.id)} className="text-red-400 hover:text-red-600">
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Create/Edit Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-backdrop">
                    <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-scale-in">
                        <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                            <h3 className="text-lg font-bold text-gray-900">{editingId ? 'Editar Bombeiro' : 'Novo Bombeiro'}</h3>
                            <button onClick={() => setShowModal(false)}><X size={24} className="text-gray-400" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-6">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                                    <input className={inputClass} value={formData.name || ''} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Base</label>
                                    <select
                                        className={inputClass}
                                        value={formData.base}
                                        onChange={e => handleBaseChange(e.target.value)}
                                        disabled={!!userBase} // If user has assigned base, lock it
                                    >
                                        <option value="">Selecione...</option>
                                        {bases.map(b => <option key={b.id} value={b.name}>{b.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Região</label>
                                    <select className={`${inputClass} bg-gray-100`} value={formData.region} disabled>
                                        <option value="Norte">Norte</option>
                                        <option value="Nordeste">Nordeste</option>
                                        <option value="Centro-Oeste">Centro-Oeste</option>
                                        <option value="Sudeste">Sudeste</option>
                                        <option value="Sul">Sul</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Classe do Aeroporto</label>
                                    <select className={`${inputClass} bg-gray-100`} value={formData.airportClass} disabled>
                                        <option value="I">Classe I</option>
                                        <option value="II">Classe II</option>
                                        <option value="III">Classe III</option>
                                        <option value="IV">Classe IV</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Data de Formação</label>
                                    <input type="date" className={inputClass} value={formData.graduationDate || ''} onChange={e => setFormData({ ...formData, graduationDate: e.target.value })} />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                <h4 className="text-sm font-bold text-blue-900 mb-4 flex items-center gap-2"><Clock size={16} /> Atualização Técnica (AT)</h4>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Última Atualização</label>
                                        <input type="date" className={inputClass} disabled={formData.isNotUpdated} value={formData.lastUpdateDate || ''} onChange={e => setFormData({ ...formData, lastUpdateDate: e.target.value })} />
                                    </div>
                                    <div className="flex items-center h-full pt-6">
                                        <input
                                            id="notUpdated"
                                            type="checkbox"
                                            className="h-5 w-5 text-primary-600 rounded border-gray-300"
                                            checked={formData.isNotUpdated}
                                            onChange={e => setFormData({ ...formData, isNotUpdated: e.target.checked })}
                                        />
                                        <label htmlFor="notUpdated" className="ml-2 text-sm text-gray-700 font-medium">Ainda não atualizado (Usa data formação)</label>
                                    </div>
                                </div>
                            </div>

                            {formData.airportClass === 'IV' && (
                                <div className="bg-orange-50 p-4 rounded-lg border border-orange-100">
                                    <h4 className="text-sm font-bold text-orange-900 mb-4 flex items-center gap-2"><Flame size={16} /> Exercício com Fogo</h4>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Último Exercício</label>
                                        <input type="date" className={inputClass} disabled={formData.isNotUpdated} value={formData.lastFireExerciseDate || ''} onChange={e => setFormData({ ...formData, lastFireExerciseDate: e.target.value })} />
                                        {formData.isNotUpdated && <p className="text-xs text-gray-500 mt-1">* Utilizando data de formação devido à marcação "Ainda não atualizado".</p>}
                                    </div>
                                </div>
                            )}

                            <div className="bg-gray-100 p-4 rounded-lg border border-gray-200">
                                <div className="flex items-center justify-between mb-4">
                                    <h4 className="text-sm font-bold text-gray-900">Status de Afastamento</h4>
                                    <div className="flex items-center">
                                        <input
                                            id="isAway"
                                            type="checkbox"
                                            className="h-5 w-5 text-red-600 rounded border-gray-300"
                                            checked={formData.isAway}
                                            onChange={e => setFormData({ ...formData, isAway: e.target.checked })}
                                        />
                                        <label htmlFor="isAway" className="ml-2 text-sm text-gray-700 font-medium">Bombeiro Afastado</label>
                                    </div>
                                </div>

                                {formData.isAway && (
                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 animate-fade-in">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Início Afastamento</label>
                                            <input type="date" className={inputClass} value={formData.awayStartDate || ''} onChange={e => setFormData({ ...formData, awayStartDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Fim Afastamento</label>
                                            <input type="date" className={inputClass} value={formData.awayEndDate || ''} onChange={e => setFormData({ ...formData, awayEndDate: e.target.value })} />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-medium text-gray-500">Motivo</label>
                                            <input type="text" className={inputClass} value={formData.awayReason || ''} onChange={e => setFormData({ ...formData, awayReason: e.target.value })} />
                                        </div>
                                    </div>
                                )}
                            </div>

                            <div className="flex justify-end pt-4 border-t border-gray-100">
                                <button type="button" onClick={() => setShowModal(false)} className="mr-3 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                                <button type="submit" className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-2.5 rounded-lg shadow-md font-semibold transition-all duration-200">
                                    <Save size={18} />
                                    <span>Salvar</span>
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};