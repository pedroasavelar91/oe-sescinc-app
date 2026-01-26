import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole } from '../types';
import { CheckCircle, AlertTriangle, BookOpen, Camera, Upload, AlertCircle, Save, Download, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, Edit2, Trash2, Plus, Calendar, Filter, FileText, CheckSquare, XCircle, Search } from 'lucide-react';
import { getCurrentDateString } from '../utils/dateUtils';

type ComplianceStatus = 'CONFORME' | 'NAO_CONFORME' | 'NAO_APLICAVEL' | 'PENDENTE';

interface CourseChecklistItem {
    id: string;
    normativeReference: string;
    description: string;
    status: ComplianceStatus;
    comment?: string;
    photoUrl?: string;
    photoCaption?: string;
}

interface CourseChecklistSection {
    id: string;
    title: string;
    items: CourseChecklistItem[];
}

interface ChecklistHeader {
    classId: string;
    className: string;
    theoryModality: 'EAD_SINCRONO' | 'PRESENCIAL';
    practicalLocation: string;
    theoryPeriod: string;
    practicalPeriod: string;
    trainingArea: string;
    responsibleId: string;
    responsibleName: string;
    responsibleFunction: string;
    date: string;
}

interface ChecklistLog {
    id: string;
    userId: string;
    userName: string;
    classId: string;
    className: string;
    date: string;
    conformeCount: number;
    naoConformeCount: number;
    concluded: boolean;
    items?: Array<{
        sectionTitle: string;
        itemText: string;
        status: ComplianceStatus;
        comment?: string;
        photoUrl?: string;
    }>;
}

export const ChecklistCursoPage: React.FC = () => {
    const { currentUser, users, classes, courses } = useStore();
    const [activeTab, setActiveTab] = useState<'realizar' | 'acompanhamento'>('realizar');

    // Filters for Header (New)
    const [selectedYear, setSelectedYear] = useState<number>(new Date().getFullYear());
    const [selectedCourseType, setSelectedCourseType] = useState<string>('TODOS');

    // Header Data
    const [header, setHeader] = useState<ChecklistHeader>({
        classId: '',
        className: '',
        theoryModality: 'PRESENCIAL',
        practicalLocation: '',
        theoryPeriod: '',
        practicalPeriod: '',
        trainingArea: 'Área de Treinamento Itinerante Nível 2 – Med Truck - Portaria nº17956',
        responsibleId: currentUser?.id || '',
        responsibleName: currentUser?.name || '',
        responsibleFunction: currentUser?.role || '',
        date: new Date().toISOString().split('T')[0]
    });

    // Additional header fields for detailed form
    const [courseId, setCourseId] = useState<string>('');
    const [theoryStartDate, setTheoryStartDate] = useState<string>('');
    const [theoryEndDate, setTheoryEndDate] = useState<string>('');
    const [practicalStartDate, setPracticalStartDate] = useState<string>('');
    const [practicalEndDate, setPracticalEndDate] = useState<string>('');
    const [customTrainingArea, setCustomTrainingArea] = useState<string>('');

    // Header filters for class selection
    const [headerFilterYear, setHeaderFilterYear] = useState<number | 'TODOS'>('TODOS');
    const [headerFilterCourse, setHeaderFilterCourse] = useState<string>('');


    // Initial Sections with Standard Items
    const [sections, setSections] = useState<CourseChecklistSection[]>([
        {
            id: 'adm',
            title: '1. PARTE ADMINISTRATIVA',
            items: [
                { id: 'adm-1', normativeReference: 'ANAC', description: 'Documento formal solicitando Autorização para Realização de Cursos itinerantes.', status: 'PENDENTE' },
                { id: 'adm-2', normativeReference: 'ANAC', description: 'Apólice de seguro (danos a terceiros ou propriedade).', status: 'PENDENTE' },
                { id: 'adm-3', normativeReference: 'ANAC', description: 'Lista com a relação dos instrutores (separados por disciplina).', status: 'PENDENTE' },
            ]
        },
        {
            id: 'teorica',
            title: '2. INSTALAÇÕES PARA INSTRUÇÃO TEÓRICA',
            items: [
                { id: 'teo-1', normativeReference: 'ANAC', description: 'Sala de aula.', status: 'PENDENTE' },
                { id: 'teo-2', normativeReference: 'ANAC', description: 'Ergonomia das instalações (proteção climática, iluminação e ventilação).', status: 'PENDENTE' },
                { id: 'teo-3', normativeReference: 'ANAC', description: 'Ergonomia do mobiliário.', status: 'PENDENTE' },
                { id: 'teo-4', normativeReference: 'ANAC', description: 'Equipamentos de apoio pedagógico (TV, projetor, quadro).', status: 'PENDENTE' },
                { id: 'teo-5', normativeReference: 'ANAC', description: 'Sala de preparação para instrutores.', status: 'PENDENTE' },
                { id: 'teo-6', normativeReference: 'ANAC', description: 'Banheiro feminino.', status: 'PENDENTE' },
                { id: 'teo-7', normativeReference: 'ANAC', description: 'Banheiro masculino.', status: 'PENDENTE' },
            ]
        },
        {
            id: 'pratica',
            title: '3. INSTALAÇÕES PARA TREINAMENTO PRÁTICO – NÍVEL 2',
            items: [
                { id: 'pra-1', normativeReference: 'ANAC', description: 'Requisitos de preservação ambiental.', status: 'PENDENTE' },
                { id: 'pra-2', normativeReference: 'ANAC', description: 'Dimensões da área (22 x 8m com corredor central).', status: 'PENDENTE' },
                { id: 'pra-3', normativeReference: 'ANAC', description: 'Equipamentos de tratamento de efluentes, drenagem e separação de óleo.', status: 'PENDENTE' },
                { id: 'pra-4', normativeReference: 'ANAC', description: 'Sistema de reaproveitamento de água.', status: 'PENDENTE' },
                { id: 'pra-5', normativeReference: 'ANAC', description: 'Construção de concreto com piso impermeável.', status: 'PENDENTE' },
                { id: 'pra-6', normativeReference: 'ANAC', description: '8 bacias de contenção (profundidade 20cm).', status: 'PENDENTE' },
                { id: 'pra-7', normativeReference: 'ANAC', description: 'Malha de ferro tipo "grelha" nas bacias.', status: 'PENDENTE' },
                { id: 'pra-8', normativeReference: 'ANAC', description: 'Sistemas para coleta de combustível/resíduos nas bacias.', status: 'PENDENTE' },
                { id: 'pra-9', normativeReference: 'ANAC', description: 'Entorno pavimentado (calçada).', status: 'PENDENTE' },
                { id: 'pra-10', normativeReference: 'ANAC', description: 'Aceiro (extensão mínima de 10m).', status: 'PENDENTE' },
                { id: 'pra-11', normativeReference: 'ANAC', description: 'Conexão do sistema de efluentes e grelhas ao tratamento.', status: 'PENDENTE' },
                { id: 'pra-12', normativeReference: 'ANAC', description: 'Casa de fumaça (Nível 03 - Avançado).', status: 'PENDENTE' },
                { id: 'pra-13', normativeReference: 'ANAC', description: 'Torre de salvamento em altura (mínimo 10m).', status: 'PENDENTE' },
                { id: 'pra-14', normativeReference: 'ANAC', description: 'Área para treinamento de extricação.', status: 'PENDENTE' },
                { id: 'pra-15', normativeReference: 'ANAC', description: 'Área para simulação de atendimento pré-hospitalar.', status: 'PENDENTE' },
                { id: 'pra-16', normativeReference: 'ANAC', description: 'Cenários para combate a incêndios classes A, B, C.', status: 'PENDENTE' },
                { id: 'pra-17', normativeReference: 'ANAC', description: 'Área para emergências químicas.', status: 'PENDENTE' },
                { id: 'pra-18', normativeReference: 'ANAC', description: 'Sistema de hidrante de coluna (saída 2,5") com bomba e regulador.', status: 'PENDENTE' },
                { id: 'pra-19', normativeReference: 'ANAC', description: 'Derivante com mangueiras de 1,5".', status: 'PENDENTE' },
                { id: 'pra-20', normativeReference: 'ANAC', description: 'Capacidade de treinamentos ininterruptos.', status: 'PENDENTE' },
                { id: 'pra-21', normativeReference: 'ANAC', description: 'Vestiário feminino.', status: 'PENDENTE' },
                { id: 'pra-22', normativeReference: 'ANAC', description: 'Vestiário masculino.', status: 'PENDENTE' },
            ]
        },
        {
            id: 'equipamentos',
            title: '4. EQUIPAMENTOS E VEÍCULOS',
            items: [
                { id: 'eq-1', normativeReference: 'ANAC', description: 'Trajes de Proteção (TP).', status: 'PENDENTE' },
                { id: 'eq-2', normativeReference: 'ANAC', description: 'Capacidade para higienização de TP.', status: 'PENDENTE' },
                { id: 'eq-3', normativeReference: 'ANAC', description: 'Equipamento de Proteção Respiratória (EPR).', status: 'PENDENTE' },
                { id: 'eq-4', normativeReference: 'ANAC', description: 'Capacidade para higienização de EPR.', status: 'PENDENTE' },
                { id: 'eq-5', normativeReference: 'ANAC', description: 'Capacidade para recarga de cilindros de ar respirável.', status: 'PENDENTE' },
                { id: 'eq-6', normativeReference: 'ANAC', description: 'Extintores de incêndio portáteis (água, pó químico, CO2).', status: 'PENDENTE' },
                { id: 'eq-7', normativeReference: 'ANAC', description: 'Manequim de treinamento (APH).', status: 'PENDENTE' },
                { id: 'eq-8', normativeReference: 'ANAC', description: 'Chave inglesa.', status: 'PENDENTE' },
                { id: 'eq-9', normativeReference: 'ANAC', description: 'Machado de resgate grande sem cunha.', status: 'PENDENTE' },
                { id: 'eq-10', normativeReference: 'ANAC', description: 'Machado de resgate pequeno (sem cunha ou aeronáutico).', status: 'PENDENTE' },
                { id: 'eq-11', normativeReference: 'ANAC', description: 'Pé-de-cabra (95 cm).', status: 'PENDENTE' },
                { id: 'eq-12', normativeReference: 'ANAC', description: 'Talhadeira (2,5 cm).', status: 'PENDENTE' },
                { id: 'eq-13', normativeReference: 'ANAC', description: 'Lanterna manual.', status: 'PENDENTE' },
                { id: 'eq-14', normativeReference: 'ANAC', description: 'Martelo (1,5 a 2,0 kg).', status: 'PENDENTE' },
                { id: 'eq-15', normativeReference: 'ANAC', description: 'Gancho ou garra para salvamento.', status: 'PENDENTE' },
                { id: 'eq-16', normativeReference: 'ANAC', description: 'Serra circular para corte pesado de metal (motor a combustão).', status: 'PENDENTE' },
                { id: 'eq-17', normativeReference: 'ANAC', description: 'Serra manual (arco).', status: 'PENDENTE' },
                { id: 'eq-18', normativeReference: 'ANAC', description: 'Manta à prova de fogo.', status: 'PENDENTE' },
                { id: 'eq-19', normativeReference: 'ANAC', description: 'Escada extensora.', status: 'PENDENTE' },
                { id: 'eq-20', normativeReference: 'ANAC', description: 'Corda de salvamento (15m).', status: 'PENDENTE' },
                { id: 'eq-21', normativeReference: 'ANAC', description: 'Alicate cortante (17 cm).', status: 'PENDENTE' },
                { id: 'eq-22', normativeReference: 'ANAC', description: 'Chave de grifo (25 cm).', status: 'PENDENTE' },
                { id: 'eq-23', normativeReference: 'ANAC', description: 'Conjunto de chaves de fenda.', status: 'PENDENTE' },
                { id: 'eq-24', normativeReference: 'ANAC', description: 'Tesoura para metal.', status: 'PENDENTE' },
                { id: 'eq-25', normativeReference: 'ANAC', description: 'Calços (15 cm).', status: 'PENDENTE' },
                { id: 'eq-26', normativeReference: 'ANAC', description: 'Ferramenta de corte de cintos de segurança.', status: 'PENDENTE' },
                { id: 'eq-27', normativeReference: 'ANAC', description: 'Kit médico de primeiros socorros.', status: 'PENDENTE' },
                { id: 'eq-28', normativeReference: 'ANAC', description: 'Lona.', status: 'PENDENTE' },
                { id: 'eq-29', normativeReference: 'ANAC', description: 'Maca rígida.', status: 'PENDENTE' },
                { id: 'eq-30', normativeReference: 'ANAC', description: 'Colar cervical retrátil.', status: 'PENDENTE' },
                { id: 'eq-31', normativeReference: 'ANAC', description: 'Colete de imobilização dorso-lombar (KED).', status: 'PENDENTE' },
                { id: 'eq-32', normativeReference: 'ANAC', description: 'Conjunto de talas rígidas.', status: 'PENDENTE' },
                { id: 'eq-33', normativeReference: 'ANAC', description: 'Pé-de-cabra (165 cm).', status: 'PENDENTE' },
                { id: 'eq-34', normativeReference: 'ANAC', description: 'Corda de salvamento (30m).', status: 'PENDENTE' },
                { id: 'eq-35', normativeReference: 'ANAC', description: 'Motosserra completa (motor a combustão).', status: 'PENDENTE' },
                { id: 'eq-36', normativeReference: 'ANAC', description: 'Inalador de oxigênio com cilindro.', status: 'PENDENTE' },
                { id: 'eq-37', normativeReference: 'ANAC', description: 'Desencarcerador (hidráulico, elétrico ou pneumático).', status: 'PENDENTE' },
                { id: 'eq-38', normativeReference: 'ANAC', description: 'Turbo-ventilador (vazão mínima 50.000 m³/h).', status: 'PENDENTE' },
                { id: 'eq-39', normativeReference: 'ANAC', description: 'Equipamento para espuma.', status: 'PENDENTE' },
            ]
        },
        {
            id: 'geral',
            title: '5. GENERALIDADES',
            items: [
                { id: 'gen-1', normativeReference: 'ANAC', description: 'CCI (Carro Contra Incêndio).', status: 'PENDENTE' },
                { id: 'gen-2', normativeReference: 'ANAC', description: 'Carga horária do instrutor (máx 8h em 24h).', status: 'PENDENTE' },
                { id: 'gen-3', normativeReference: 'ANAC', description: 'Número máximo de alunos (40).', status: 'PENDENTE' },
                { id: 'gen-4', normativeReference: 'ANAC', description: 'Relação alunos/instrutores em exercícios práticos.', status: 'PENDENTE' },
                { id: 'gen-5', normativeReference: 'ANAC', description: 'Acompanhamento médico/enfermagem em treinos com fogo.', status: 'PENDENTE' },
                { id: 'gen-6', normativeReference: 'ANAC', description: 'Disponibilização de Kit de primeiros socorros (Ambulância).', status: 'PENDENTE' },
            ]
        }
    ]);

    // UI States
    const [isManaging, setIsManaging] = useState(false);
    const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['adm', 'teorica', 'pratica', 'equipamentos', 'geral']));

    // New Item/Section States
    const [newItemDesc, setNewItemDesc] = useState('');
    const [newItemRef, setNewItemRef] = useState('');
    const [newItemSection, setNewItemSection] = useState('adm');

    const [isCreatingSection, setIsCreatingSection] = useState(false);
    const [newSectionTitle, setNewSectionTitle] = useState('');
    const [editingSectionId, setEditingSectionId] = useState<string | null>(null);

    // Closing Data
    const [closingData, setClosingData] = useState({
        concluded: false,
        finalObservations: '',
        responsibleSign: currentUser?.name || '',
        closingDate: new Date().toISOString().split('T')[0]
    });

    // Logs Data (Mock for Demonstration)
    const [checklistLogs, setChecklistLogs] = useState<ChecklistLog[]>([]);

    // Filters for Dashboard
    const [filterYear, setFilterYear] = useState<number | 'TODOS'>('TODOS');
    const [filterClassId, setFilterClassId] = useState<string>('TODOS');
    const [filterCourseId, setFilterCourseId] = useState<string>('TODOS');
    const [currentPage, setCurrentPage] = useState(1);
    const logsPerPage = 10;
    const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

    if (!currentUser) return null;

    const canEdit = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;

    const canAccess = currentUser.role === UserRole.GESTOR ||
        currentUser.role === UserRole.COORDENADOR ||
        currentUser.role === UserRole.INSTRUTOR;

    if (!canAccess) {
        return (
            <div className="p-8 text-center text-gray-500">
                <AlertTriangle className="mx-auto h-12 w-12 text-gray-300 mb-3" />
                <p className="text-lg font-medium uppercase">Acesso Não Autorizado</p>
            </div>
        );
    }

    // Filter Classes Logic
    const availableHeaderYears = Array.from(new Set(classes.map(c => new Date(c.startDate).getFullYear()))).sort((a, b) => b - a);
    const availableCourseTypes = Array.from(new Set(classes.map(c => c.courseId))); // Assuming courseId helps or using name patterns if type not available on class directly. 
    // Actually, ClassGroup has courseId. referencing 'courses' from store would be better but I only have 'classes' here. 
    // Let's use unique names or just list all unique courseIds if I can't map to names easily without looking up courses.
    // Wait, I have 'classes' which has 'courseId'. I don't have 'courses' in useStore destructuring.

    const activeClasses = classes.filter(c => {
        const yearMatch = new Date(c.startDate).getFullYear() === selectedYear;
        // For course type, we might need to filter by name or courseId. Let's assume user wants to filter by Course Name pattern or similar.
        // Since I don't have the Course Type enum easily accessible on the class object (status is missing), I will filter by available courseIds present in the classes list.
        const typeMatch = selectedCourseType === 'TODOS' || c.courseId === selectedCourseType;
        return yearMatch && typeMatch;
    });

    const availableYears = Array.from(new Set(classes.map(c => new Date(c.startDate).getFullYear()))).sort((a, b) => b - a);
    const availableClassesForFilter = classes;

    // --- Actions ---

    const handleClassChange = (classId: string) => {
        const selectedClass = classes.find(c => c.id === classId);
        if (selectedClass) {
            // Auto-fill dates from class
            const startDate = new Date(selectedClass.startDate);
            const endDate = new Date(selectedClass.endDate);

            setHeader(prev => ({
                ...prev,
                classId: selectedClass.id,
                className: selectedClass.name,
                practicalLocation: selectedClass.location || '',
                theoryPeriod: `${startDate.toLocaleDateString()}`,
                practicalPeriod: `${endDate.toLocaleDateString()}`
            }));

            // Set date fields
            setTheoryStartDate(selectedClass.startDate);
            setTheoryEndDate(selectedClass.endDate);
            setPracticalStartDate(selectedClass.startDate);
            setPracticalEndDate(selectedClass.endDate);

            // Ensure course is synced
            if (selectedClass.courseId !== headerFilterCourse) {
                setHeaderFilterCourse(selectedClass.courseId);
            }
            setCourseId(selectedClass.courseId);
        } else {
            setHeader(prev => ({
                ...prev,
                classId: '',
                className: '',
                practicalLocation: '',
                theoryPeriod: '',
                practicalPeriod: ''
            }));
            setTheoryStartDate('');
            setTheoryEndDate('');
            setPracticalStartDate('');
            setPracticalEndDate('');
        }
    };

    const toggleSection = (sectionId: string) => {
        const newExpanded = new Set(expandedSections);
        if (newExpanded.has(sectionId)) {
            newExpanded.delete(sectionId);
        } else {
            newExpanded.add(sectionId);
        }
        setExpandedSections(newExpanded);
    };

    // Item Management
    const addNewItem = () => {
        if (!newItemDesc.trim() || !newItemRef.trim()) {
            alert('Preencha a referência e a descrição.');
            return;
        }

        setSections(prev => prev.map(section => {
            if (section.id === newItemSection) {
                return {
                    ...section,
                    items: [
                        ...section.items,
                        {
                            id: `item-${Date.now()}`,
                            normativeReference: newItemRef,
                            description: newItemDesc,
                            status: 'PENDENTE'
                        }
                    ]
                };
            }
            return section;
        }));

        setNewItemRef('');
        setNewItemDesc('');
    };

    const deleteItem = (sectionId: string, itemId: string) => {
        if (!window.confirm('Tem certeza que deseja remover este item?')) return;
        setSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: section.items.filter(item => item.id !== itemId)
                };
            }
            return section;
        }));
    };

    const updateItem = (sectionId: string, itemId: string, field: keyof CourseChecklistItem, value: any) => {
        setSections(prev => prev.map(section => {
            if (section.id === sectionId) {
                return {
                    ...section,
                    items: section.items.map(item =>
                        item.id === itemId ? { ...item, [field]: value } : item
                    )
                };
            }
            return section;
        }));
    };

    const handlePhotoUpload = (sectionId: string, itemId: string, e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            const reader = new FileReader();
            reader.onloadend = () => {
                setSections(prev => prev.map(section => {
                    if (section.id === sectionId) {
                        return {
                            ...section,
                            items: section.items.map(item =>
                                item.id === itemId ? { ...item, photoUrl: reader.result as string } : item
                            )
                        };
                    }
                    return section;
                }));
            };
            reader.readAsDataURL(file);
        }
    };

    // Section Management
    const addNewSection = () => {
        if (!newSectionTitle.trim()) return;
        const newSection: CourseChecklistSection = {
            id: `section-${Date.now()}`,
            title: newSectionTitle.toUpperCase(),
            items: []
        };
        setSections([...sections, newSection]);
        setNewSectionTitle('');
        setIsCreatingSection(false);
        setExpandedSections(prev => new Set(prev).add(newSection.id));
    };

    const deleteSection = (sectionId: string) => {
        if (window.confirm('Tem certeza? Todos os itens desta seção serão removidos.')) {
            setSections(sections.filter(s => s.id !== sectionId));
        }
    };

    const startEditingSection = (sectionId: string, currentTitle: string) => {
        setEditingSectionId(sectionId);
        setNewSectionTitle(currentTitle);
        setIsCreatingSection(true);
    };

    const saveSectionEdit = () => {
        if (!newSectionTitle.trim()) return;

        if (editingSectionId) {
            setSections(sections.map(s => s.id === editingSectionId ? { ...s, title: newSectionTitle.toUpperCase() } : s));
            setEditingSectionId(null);
        } else {
            addNewSection();
        }
        setNewSectionTitle('');
        setIsCreatingSection(false);
    };

    // Finalize
    const handleSubmit = () => {
        if (!header.classId) {
            alert('Selecione uma turma no cabeçalho.');
            window.scrollTo(0, 0);
            return;
        }

        let hasError = false;
        let conformeCount = 0;
        let naoConformeCount = 0;

        sections.forEach(section => {
            section.items.forEach(item => {
                if (item.status === 'PENDENTE') {
                    alert(`Item "${item.normativeReference}" precisa ser avaliado.`);
                    hasError = true;
                }
                if (item.status === 'NAO_APLICAVEL' && !item.comment?.trim()) {
                    alert(`Item "${item.normativeReference}" marcado como Não Aplicável deve ter justificativa.`);
                    hasError = true;
                }
                if (item.status === 'CONFORME') conformeCount++;
                if (item.status === 'NAO_CONFORME') naoConformeCount++;
            });
        });

        if (hasError) return;

        if (!closingData.concluded) {
            alert('Confirme a conclusão do checklist na seção final.');
            return;
        }

        const newLog: ChecklistLog = {
            id: Date.now().toString(),
            userId: currentUser.id,
            userName: currentUser.name,
            classId: header.classId,
            className: header.className,
            date: new Date().toISOString(),
            conformeCount,
            naoConformeCount,
            concluded: true,
            items: sections.flatMap(section =>
                section.items.map(item => ({
                    sectionTitle: section.title,
                    itemText: item.normativeReference,
                    status: item.status,
                    comment: item.comment,
                    photoUrl: item.photoUrl
                }))
            )
        };

        setChecklistLogs([newLog, ...checklistLogs]);
        alert('Checklist finalizado com sucesso!');
        setActiveTab('acompanhamento');

        // Reset steps if needed, for now keep state to show data
    };

    // Export CSV
    const exportToCSV = () => {
        const headers = ["Data", "Responsável", "Turma", "Conformes", "Não Conformes", "Resultado"];
        const csvContent = [
            headers.join(","),
            ...checklistLogs.map(log => [
                new Date(log.date).toLocaleDateString(),
                log.userName,
                log.className,
                log.conformeCount,
                log.naoConformeCount,
                log.concluded ? "CONCLUÍDO" : "PENDENTE"
            ].join(","))
        ].join("\n");

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        const url = URL.createObjectURL(blob);
        link.setAttribute("href", url);
        link.setAttribute("download", `checklist_curso_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const getStatusColor = (status: ComplianceStatus) => {
        switch (status) {
            case 'CONFORME': return 'bg-green-100 text-green-800 border-green-300';
            case 'NAO_CONFORME': return 'bg-red-100 text-red-800 border-red-300';
            case 'NAO_APLICAVEL': return 'bg-gray-100 text-gray-800 border-gray-300';
            default: return 'bg-white text-gray-500 border-gray-300';
        }
    };

    return (
        <div className="space-y-6 animate-fade-in pb-12">
            {/* Header Title and Actions */}
            <div className="flex justify-between items-start animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 uppercase">Checklist - Curso</h1>
                </div>

                {/* Botão Gerenciar Itens */}
                {canAccess && activeTab === 'realizar' && (
                    <button
                        onClick={() => setIsManaging(!isManaging)}
                        className={`px-4 py-2 rounded-lg font-bold uppercase transition-all flex items-center gap-2 ${isManaging
                            ? 'bg-red-600 text-white hover:bg-red-700'
                            : 'btn-premium btn-premium-orange btn-premium-shimmer'
                            }`}
                    >
                        {isManaging ? 'SAIR DO MODO EDIÇÃO' : 'GERENCIAR CHECKLIST'}
                    </button>
                )}
            </div>

            {/* Tabs Navigation */}
            <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-8">
                    <button
                        onClick={() => setActiveTab('realizar')}
                        className={`${activeTab === 'realizar'
                            ? 'border-orange-500 text-orange-600'
                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                            } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm uppercase flex items-center gap-2 transition-colors`}
                    >
                        REALIZAR CHECKLIST
                    </button>
                    {(currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR) && (
                        <button
                            onClick={() => setActiveTab('acompanhamento')}
                            className={`${activeTab === 'acompanhamento'
                                ? 'border-orange-500 text-orange-600'
                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                } whitespace-nowrap py-4 px-1 border-b-2 font-bold text-sm uppercase flex items-center gap-2 transition-colors`}
                        >
                            ACOMPANHAMENTO
                        </button>
                    )}
                </nav>
            </div>


            {activeTab === 'realizar' ? (
                <>
                    {/* CABEÇALHO DO CHECKLIST */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 uppercase">Informações do Checklist</h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {/* Ano */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Ano *</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={headerFilterYear}
                                    onChange={(e) => {
                                        setHeaderFilterYear(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value));
                                        setHeaderFilterCourse('');
                                        setCourseId('');
                                        setHeader({ ...header, classId: '', className: '' });
                                    }}
                                >
                                    <option value="TODOS">Selecione o Ano...</option>
                                    {availableYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Curso */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Curso *</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={headerFilterCourse}
                                    onChange={(e) => {
                                        setHeaderFilterCourse(e.target.value);
                                        setCourseId(e.target.value);
                                        setHeader({ ...header, classId: '', className: '' });
                                    }}
                                    disabled={headerFilterYear === 'TODOS'}
                                >
                                    <option value="">Selecione o Curso...</option>
                                    {courses.map(course => (
                                        <option key={course.id} value={course.id}>{course.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Turma */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Turma *</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={header.classId}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                    disabled={!headerFilterCourse}
                                >
                                    <option value="">Selecione a Turma...</option>
                                    {classes
                                        .filter(c => {
                                            const yearMatch = headerFilterYear === 'TODOS' || new Date(c.startDate).getFullYear() === headerFilterYear;
                                            const courseMatch = !headerFilterCourse || c.courseId === headerFilterCourse;
                                            return yearMatch && courseMatch;
                                        })
                                        .map(classItem => (
                                            <option key={classItem.id} value={classItem.id}>{classItem.name}</option>
                                        ))}
                                </select>
                            </div>

                            {/* Modalidade da Parte Teórica */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Modalidade da Parte Teórica *</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={header.theoryModality}
                                    onChange={(e) => setHeader({ ...header, theoryModality: e.target.value as 'EAD_SINCRONO' | 'PRESENCIAL' })}
                                >
                                    <option value="PRESENCIAL">Presencial</option>
                                    <option value="EAD_SINCRONO">EAD Síncrono</option>
                                </select>
                            </div>

                            {/* Local da Parte Prática */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Local da Parte Prática *</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    placeholder="DIGITE O LOCAL..."
                                    value={header.practicalLocation}
                                    onChange={(e) => setHeader({ ...header, practicalLocation: e.target.value })}
                                />
                            </div>

                            {/* Período Teórico - Data Inicial */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Período Teórico - Início *</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={theoryStartDate}
                                    onChange={(e) => setTheoryStartDate(e.target.value)}
                                />
                            </div>

                            {/* Período Teórico - Data Final */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Período Teórico - Fim *</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={theoryEndDate}
                                    onChange={(e) => setTheoryEndDate(e.target.value)}
                                />
                            </div>

                            {/* Período Prático - Data Inicial */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Período Prático - Início *</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={practicalStartDate}
                                    onChange={(e) => setPracticalStartDate(e.target.value)}
                                />
                            </div>

                            {/* Período Prático - Data Final */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Período Prático - Fim *</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={practicalEndDate}
                                    onChange={(e) => setPracticalEndDate(e.target.value)}
                                />
                            </div>

                            {/* Área de Treinamento / Estrutura Utilizada */}
                            <div className="md:col-span-2">
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Área de Treinamento / Estrutura Utilizada *</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={header.trainingArea === 'Área de Treinamento Itinerante Nível 2 – Med Truck - Portaria nº17956' ? 'MED_TRUCK' : 'OUTRO'}
                                    onChange={(e) => {
                                        if (e.target.value === 'MED_TRUCK') {
                                            setHeader({ ...header, trainingArea: 'Área de Treinamento Itinerante Nível 2 – Med Truck - Portaria nº17956' });
                                            setCustomTrainingArea('');
                                        } else {
                                            setHeader({ ...header, trainingArea: '' });
                                        }
                                    }}
                                >
                                    <option value="MED_TRUCK">Área de Treinamento Itinerante Nível 2 – Med Truck - Portaria nº17956</option>
                                    <option value="OUTRO">Outro</option>
                                </select>
                            </div>

                            {/* Campo Customizado para Área de Treinamento (se OUTRO) */}
                            {header.trainingArea !== 'Área de Treinamento Itinerante Nível 2 – Med Truck - Portaria nº17956' && (
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Especifique a Área de Treinamento *</label>
                                    <input
                                        type="text"
                                        className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase placeholder:normal-case"
                                        placeholder="Digite a área de treinamento..."
                                        value={customTrainingArea}
                                        onChange={(e) => {
                                            setCustomTrainingArea(e.target.value);
                                            setHeader({ ...header, trainingArea: e.target.value });
                                        }}
                                    />
                                </div>
                            )}

                            {/* Responsável pelo Preenchimento */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Responsável pelo Preenchimento *</label>
                                <select
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all uppercase"
                                    value={header.responsibleId}
                                    onChange={(e) => {
                                        const user = users.find(u => u.id === e.target.value);
                                        setHeader({
                                            ...header,
                                            responsibleId: e.target.value,
                                            responsibleName: user?.name || '',
                                            responsibleFunction: user?.role || ''
                                        });
                                    }}
                                >
                                    {users.filter(u => u.role === UserRole.GESTOR || u.role === UserRole.COORDENADOR).map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Função (Auto-preenchido) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Função</label>
                                <input
                                    type="text"
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-500 border border-gray-300 uppercase cursor-not-allowed"
                                    value={header.responsibleFunction}
                                    disabled
                                />
                            </div>

                            {/* Data do Preenchimento */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-2">Data do Preenchimento</label>
                                <input
                                    type="date"
                                    className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-500 border border-gray-300 uppercase cursor-not-allowed"
                                    value={header.date}
                                    disabled
                                />
                            </div>
                        </div>
                    </div>

                    {/* Progress Bar (Global) */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-sm font-bold text-gray-900 uppercase">Progresso</span>
                            <div className="flex gap-4 text-sm font-bold">
                                <span className="text-green-600">
                                    {sections.reduce((acc, s) => acc + s.items.filter(i => i.status === 'CONFORME').length, 0)} Conforme
                                </span>
                                <span className="text-gray-500">
                                    {sections.reduce((acc, s) => acc + s.items.length, 0)} Total
                                </span>
                            </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                            <div
                                className="bg-blue-600 h-3 rounded-full transition-all duration-300"
                                style={{ width: `${Math.round((sections.reduce((acc, s) => acc + s.items.filter(i => i.status !== 'PENDENTE').length, 0) / sections.reduce((acc, s) => acc + s.items.length, 0)) * 100) || 0}%` }}
                            />
                        </div>
                    </div>

                    {/* SEÇÃO 1: CABEÇALHO DADOS (Remover Header Antigo) */}
                    <div className="hidden">
                        {/* Placeholder para ancorar substituição e ocultar o antigo se não deletar tudo */}

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {/* Filtro Ano */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Ano da Turma</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(Number(e.target.value))}
                                >
                                    {availableHeaderYears.map(year => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Filtro Tipo de Curso */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Tipo de Curso</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                                    value={selectedCourseType}
                                    onChange={(e) => setSelectedCourseType(e.target.value)}
                                >
                                    <option value="TODOS">Todos</option>
                                    {availableCourseTypes.map(cId => (
                                        <option key={cId} value={cId}>{cId}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Turma Sem Filtro (Label Only) */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Selecione a Turma</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                                    value={header.classId}
                                    onChange={(e) => handleClassChange(e.target.value)}
                                >
                                    <option value="">Selecione uma turma...</option>
                                    {activeClasses.map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                                </select>
                            </div>

                            {/* Modalidade */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Modalidade Teórica</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                                    value={header.theoryModality}
                                    onChange={(e) => setHeader({ ...header, theoryModality: e.target.value as any })}
                                >
                                    <option value="PRESENCIAL">Presencial</option>
                                    <option value="EAD_SINCRONO">EAD Síncrono</option>
                                </select>
                            </div>

                            {/* Área de Treinamento */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Área de Treinamento</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                                    value={header.trainingArea}
                                    onChange={(e) => setHeader({ ...header, trainingArea: e.target.value })}
                                >
                                    <option value="Área de Treinamento Itinerante Nível 2 – Med Truck - Portaria nº17956">Itinerante Nível 2 – Med Truck</option>
                                    <option value="OUTRO">Outro (Especificar)</option>
                                </select>
                                {header.trainingArea === 'OUTRO' && (
                                    <input
                                        type="text"
                                        className="mt-2 w-full px-3 py-2 border rounded-lg uppercase text-sm"
                                        placeholder="Especifique a área..."
                                    />
                                )}
                            </div>

                            {/* Infos Automáticas */}
                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Local Prático</label>
                                <div className="font-bold text-gray-900 text-sm uppercase">{header.practicalLocation || '-'}</div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Período Teórico</label>
                                <div className="font-bold text-gray-900 text-sm uppercase">{header.theoryPeriod || '-'}</div>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Período Prático</label>
                                <div className="font-bold text-gray-900 text-sm uppercase">{header.practicalPeriod || '-'}</div>
                            </div>

                            {/* Responsável */}
                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Responsável Preenchimento</label>
                                <select
                                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 uppercase text-sm"
                                    value={header.responsibleId}
                                    onChange={(e) => {
                                        const user = users.find(u => u.id === e.target.value);
                                        setHeader({
                                            ...header,
                                            responsibleId: e.target.value,
                                            responsibleName: user?.name || '',
                                            responsibleFunction: user?.role || ''
                                        });
                                    }}
                                >
                                    {users.filter(u => u.role === UserRole.GESTOR || u.role === UserRole.COORDENADOR).map(u => (
                                        <option key={u.id} value={u.id}>{u.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                                <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Função / Cargo</label>
                                <div className="font-bold text-gray-900 text-sm uppercase">{header.responsibleFunction}</div>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data Preenchimento</label>
                                <input
                                    type="date"
                                    className="w-full px-3 py-2 border rounded-lg uppercase text-sm"
                                    value={header.date}
                                    onChange={(e) => setHeader({ ...header, date: e.target.value })}
                                />
                            </div>
                        </div>
                    </div>

                    {/* CREATE/EDIT SECTION MODE */}
                    {isManaging && (
                        <div className="bg-blue-50 rounded-xl shadow-sm border-2 border-blue-200 p-6">
                            <h3 className="text-lg font-bold text-blue-800 mb-4 uppercase flex items-center gap-2">
                                <Edit2 size={20} />
                                Gerenciar Seções
                            </h3>
                            {!isCreatingSection ? (
                                <button
                                    onClick={() => { setIsCreatingSection(true); setEditingSectionId(null); setNewSectionTitle(''); }}
                                    className="w-full py-3 bg-white border-2 border-dashed border-blue-300 text-blue-600 rounded-lg font-bold uppercase hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
                                >
                                    <Plus size={20} />
                                    Criar Nova Seção
                                </button>
                            ) : (
                                <div className="flex gap-4 items-end animate-fade-in">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-blue-800 uppercase mb-1">Título da Seção</label>
                                        <input
                                            type="text"
                                            className="w-full px-4 py-2 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 uppercase"
                                            placeholder="Digite o título da seção..."
                                            value={newSectionTitle}
                                            onChange={(e) => setNewSectionTitle(e.target.value)}
                                        />
                                    </div>
                                    <button
                                        onClick={saveSectionEdit}
                                        className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 uppercase transition-colors"
                                    >
                                        {editingSectionId ? 'Salvar Edição' : 'Criar Seção'}
                                    </button>
                                    <button
                                        onClick={() => { setIsCreatingSection(false); setEditingSectionId(null); setNewSectionTitle(''); }}
                                        className="px-6 py-2 bg-gray-200 text-gray-700 font-bold rounded-lg hover:bg-gray-300 uppercase transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ADD ITEM FORM (MANAGEMENT MODE) */}
                    {isManaging && (
                        <div className="bg-orange-50 rounded-xl shadow-sm border-2 border-orange-200 p-6">
                            <h3 className="text-lg font-bold text-orange-800 mb-4 uppercase flex items-center gap-2">
                                <Plus size={20} />
                                Adicionar Item
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Referência Normativa</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-orange-300 rounded-lg"
                                        placeholder="ex: RBAC 136.5(a)"
                                        value={newItemRef}
                                        onChange={e => setNewItemRef(e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-2">
                                    <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Descrição do Requisito</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 border border-orange-300 rounded-lg"
                                        placeholder="Descrição detalhada..."
                                        value={newItemDesc}
                                        onChange={e => setNewItemDesc(e.target.value)}
                                    />
                                </div>
                                <div className="md:col-span-1">
                                    <label className="block text-xs font-bold text-orange-800 uppercase mb-1">Seção de Destino</label>
                                    <select
                                        className="w-full px-3 py-2 border border-orange-300 rounded-lg uppercase text-sm"
                                        value={newItemSection}
                                        onChange={e => setNewItemSection(e.target.value)}
                                    >
                                        {sections.map(s => <option key={s.id} value={s.id}>{s.title}</option>)}
                                    </select>
                                </div>
                            </div>
                            <button
                                onClick={addNewItem}
                                className="mt-4 w-full py-2 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 uppercase transition-colors"
                            >
                                Adicionar Item ao Checklist
                            </button>
                        </div>
                    )}

                    {/* CONTENT SECTIONS */}
                    {sections.map(section => (
                        <div key={section.id} className="bg-white rounded-xl shadow-sm border border-gray-200 border-l-4 border-l-orange-500 overflow-hidden">
                            <div className="w-full px-6 py-4 bg-white flex items-center justify-between border-b border-gray-200">
                                <button
                                    onClick={() => toggleSection(section.id)}
                                    className="flex-1 flex items-center justify-between hover:text-orange-600 transition-colors mr-4"
                                >
                                    <div className="flex items-center gap-3">
                                        <h3 className="text-lg font-bold text-gray-900 uppercase text-left">{section.title}</h3>
                                        <span className="px-2 py-0.5 rounded text-xs font-bold bg-white text-gray-500 border border-gray-200">
                                            {section.items.filter(i => i.status === 'CONFORME').length}/{section.items.length}
                                        </span>
                                    </div>
                                    {expandedSections.has(section.id) ? <ChevronUp className="text-gray-500" /> : <ChevronDown className="text-gray-500" />}
                                </button>

                                {isManaging && (
                                    <div className="flex items-center gap-2">
                                        <button
                                            onClick={() => startEditingSection(section.id, section.title)}
                                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                            title="Editar Título"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => deleteSection(section.id)}
                                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                            title="Excluir Seção"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            {expandedSections.has(section.id) && (
                                <div className="divide-y divide-gray-100 bg-white">
                                    {section.items.length === 0 ? (
                                        <p className="text-center text-gray-400 italic py-4">Nenhum item cadastrado nesta seção.</p>
                                    ) : (
                                        section.items.map(item => (
                                            <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                                                <div className="flex flex-col gap-3">
                                                    {/* Description Wrapper */}
                                                    <div className="flex justify-between items-start">
                                                        <label className="text-sm font-bold text-gray-800 uppercase leading-snug">
                                                            {item.description}
                                                        </label>
                                                        {isManaging && (
                                                            <button
                                                                onClick={() => deleteItem(section.id, item.id)}
                                                                className="text-gray-400 hover:text-red-500 transition-colors"
                                                                title="Remover Item"
                                                            >
                                                                <Trash2 size={16} />
                                                            </button>
                                                        )}
                                                    </div>

                                                    {/* Status Dropdown - Full Width */}
                                                    <div className="w-full">
                                                        <select
                                                            value={item.status}
                                                            onChange={(e) => updateItem(section.id, item.id, 'status', e.target.value as ComplianceStatus)}
                                                            className={`w-full px-4 py-3 rounded-lg text-sm font-bold border border-gray-300 transition-all uppercase appearance-none ${item.status === 'PENDENTE' ? 'bg-white text-gray-500' :
                                                                getStatusColor(item.status)
                                                                } focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
                                                            disabled={isManaging}
                                                        >
                                                            <option value="PENDENTE">SELECIONE</option>
                                                            <option value="CONFORME">CONFORME</option>
                                                            <option value="NAO_CONFORME">NÃO CONFORME</option>
                                                            <option value="NAO_APLICAVEL">NÃO SE APLICA</option>
                                                        </select>
                                                    </div>

                                                    {/* Campos Adicionais - Comentário e Foto (Opcional para CONFORME e NÃO CONFORME) */}
                                                    {(item.status === 'CONFORME' || item.status === 'NAO_CONFORME') && (
                                                        <div className={`mt-2 p-4 rounded-lg space-y-4 animate-scale-in ${item.status === 'NAO_CONFORME' ? 'bg-red-50 border border-red-200' : 'bg-green-50 border border-green-200'}`}>
                                                            {/* Comentário */}
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">Comentário (Opcional)</label>
                                                                <textarea
                                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-sm uppercase"
                                                                    rows={3}
                                                                    placeholder="ADICIONE UM COMENTÁRIO..."
                                                                    value={item.comment || ''}
                                                                    onChange={(e) => updateItem(section.id, item.id, 'comment', e.target.value)}
                                                                />
                                                            </div>

                                                            {/* Upload de Foto com Legenda */}
                                                            <div>
                                                                <label className="block text-xs font-bold text-gray-900 mb-1 uppercase">Foto (Opcional)</label>
                                                                <div className="flex items-start gap-4">
                                                                    <label className="cursor-pointer group flex flex-col items-center justify-center w-32 h-32 bg-white border-2 border-dashed border-gray-300 rounded-lg hover:border-orange-500 hover:bg-orange-50 transition-all">
                                                                        <Camera size={24} className="text-gray-400 group-hover:text-orange-600 mb-2" />
                                                                        <span className="text-[10px] text-gray-500 group-hover:text-orange-700 font-medium text-center px-1 uppercase leading-tight">
                                                                            {item.photoUrl ? 'Trocar Foto' : 'Adicionar Foto'}
                                                                        </span>
                                                                        <input
                                                                            type="file"
                                                                            accept="image/*"
                                                                            className="hidden"
                                                                            onChange={(e) => handlePhotoUpload(section.id, item.id, e)}
                                                                            disabled={isManaging}
                                                                        />
                                                                    </label>
                                                                    {item.photoUrl && (
                                                                        <div className="flex-1 space-y-2">
                                                                            <div className="relative group rounded-lg overflow-hidden border border-gray-200 shadow-sm">
                                                                                <img
                                                                                    src={item.photoUrl}
                                                                                    alt="Evidência"
                                                                                    className="h-32 w-32 object-cover"
                                                                                />
                                                                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                                                    <a href={item.photoUrl} target="_blank" rel="noreferrer" className="text-white text-xs font-bold uppercase hover:underline">Ver Ampliado</a>
                                                                                </div>
                                                                            </div>
                                                                            {/* Legenda da Foto */}
                                                                            <div>
                                                                                <input
                                                                                    type="text"
                                                                                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 text-xs uppercase"
                                                                                    placeholder="LEGENDA DA FOTO..."
                                                                                    value={item.photoCaption || ''}
                                                                                    onChange={(e) => updateItem(section.id, item.id, 'photoCaption', e.target.value)}
                                                                                />
                                                                            </div>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    ))}

                    {/* SEÇÃO 4: FECHAMENTO */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                        <h2 className="text-lg font-bold text-gray-900 border-b pb-4 mb-6 uppercase flex items-center gap-2">
                            <CheckCircle className="text-green-600" />
                            Encerramento da Inspeção
                        </h2>

                        <div className="space-y-6">
                            <div>
                                <span className="block text-sm font-bold text-gray-900 mb-2 uppercase">Conclusão do Checklist</span>
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        className="w-5 h-5 text-green-600 rounded focus:ring-green-500"
                                        checked={closingData.concluded}
                                        onChange={(e) => setClosingData({ ...closingData, concluded: e.target.checked })}
                                    />
                                    <span className="text-sm font-medium uppercase">Declaro que a inspeção foi realizada e concluída de acordo com os requisitos.</span>
                                </label>
                            </div>

                            <div>
                                <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Observações Finais</label>
                                <textarea
                                    className="w-full p-3 border border-gray-300 rounded-lg h-24"
                                    placeholder="Considerações finais sobre a inspeção..."
                                    value={closingData.finalObservations}
                                    onChange={(e) => setClosingData({ ...closingData, finalObservations: e.target.value })}
                                ></textarea>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-gray-100">
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Responsável pelo Preenchimento</label>
                                    <input
                                        type="text"
                                        className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-gray-600 cursor-not-allowed uppercase"
                                        value={closingData.responsibleSign}
                                        readOnly
                                    />
                                    <p className="text-xs text-gray-400 mt-1">Assinatura Digital Eletrônica</p>
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-700 uppercase mb-1">Data de Encerramento</label>
                                    <input
                                        type="date"
                                        className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                                        value={closingData.closingDate}
                                        onChange={(e) => setClosingData({ ...closingData, closingDate: e.target.value })}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Observações Gerais */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <label className="block text-sm font-bold text-gray-900 mb-3 uppercase">Observações Gerais</label>
                        <textarea
                            className="w-full px-4 py-3 rounded-lg text-sm bg-white text-gray-700 border border-gray-300 focus:border-orange-500 transition-all placeholder:normal-case"
                            rows={4}
                            placeholder="Registre aqui qualquer observação importante sobre a inspeção..."
                            value={closingData.finalObservations}
                            onChange={(e) => setClosingData({ ...closingData, finalObservations: e.target.value })}
                        />
                    </div>

                    {/* Action Bar */}
                    <div className="flex justify-end gap-4 bg-white p-6 rounded-xl shadow-sm border border-gray-100">
                        <button
                            className="px-8 py-3 bg-gray-100 text-gray-700 font-bold rounded-lg hover:bg-gray-200 uppercase transition-colors"
                            onClick={() => {
                                if (confirm('Deseja realmente limpar todos os dados do checklist?')) {
                                    window.location.reload();
                                }
                            }}
                        >
                            Limpar
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 uppercase transition-colors shadow-md flex items-center gap-2"
                        >
                            <Save size={20} />
                            Finalizar Checklist
                        </button>
                    </div>
                </>
            ) : (
                /* ABA ACOMPANHAMENTO */
                <div className="space-y-6">
                    {/* Header with Filters */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                        <div>
                            <h2 className="text-2xl font-bold text-gray-900 uppercase">Checklists Realizados</h2>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {/* Filters */}
                            <select
                                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs uppercase"
                                value={filterYear}
                                onChange={(e) => {
                                    setFilterYear(e.target.value === 'TODOS' ? 'TODOS' : Number(e.target.value));
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="TODOS">TODOS OS ANOS</option>
                                {availableYears.map(year => (
                                    <option key={year} value={year}>{year}</option>
                                ))}
                            </select>

                            <select
                                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs uppercase"
                                value={filterCourseId}
                                onChange={(e) => {
                                    setFilterCourseId(e.target.value);
                                    setFilterClassId('TODOS');
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="TODOS">TODOS OS CURSOS</option>
                                {courses.map(course => (
                                    <option key={course.id} value={course.id}>{course.name}</option>
                                ))}
                            </select>

                            <select
                                className="px-3 py-2 rounded-lg border border-gray-300 bg-white text-xs uppercase"
                                value={filterClassId}
                                onChange={(e) => {
                                    setFilterClassId(e.target.value);
                                    setCurrentPage(1);
                                }}
                            >
                                <option value="TODOS">TODAS AS TURMAS</option>
                                {availableClassesForFilter
                                    .filter(c => filterCourseId === 'TODOS' || c.courseId === filterCourseId)
                                    .map(c => (
                                        <option key={c.id} value={c.id}>{c.name}</option>
                                    ))}
                            </select>
                        </div>
                    </div>

                    {/* Cards Grid */}
                    {(() => {
                        const filteredLogs = checklistLogs.filter(log => {
                            const logYear = parseInt(log.date.split('-')[0]);
                            const matchYear = filterYear === 'TODOS' || logYear === filterYear;
                            const matchCourse = filterCourseId === 'TODOS' || classes.find(c => c.id === log.classId)?.courseId === filterCourseId;
                            const matchClass = filterClassId === 'TODOS' || log.classId === filterClassId;
                            return matchYear && matchCourse && matchClass;
                        });

                        const itemsPerPage = 12;
                        const totalPages = Math.ceil(filteredLogs.length / itemsPerPage);
                        const startIndex = (currentPage - 1) * itemsPerPage;
                        const endIndex = startIndex + itemsPerPage;
                        const paginatedLogs = filteredLogs.slice(startIndex, endIndex);

                        if (filteredLogs.length === 0) {
                            return (
                                <div className="col-span-full text-center py-12 bg-white rounded-lg border border-dashed border-gray-300">
                                    <p className="text-gray-500">Nenhum checklist encontrado com os filtros selecionados.</p>
                                </div>
                            );
                        }

                        return (
                            <>
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {paginatedLogs.map(log => {
                                        const isExpanded = expandedLogId === log.id;
                                        const classInfo = classes.find(c => c.id === log.classId);

                                        return (
                                            <div key={log.id} className="flex flex-col h-full group" style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #FF6B35', borderRadius: '0.5rem', backgroundColor: 'white' }}>
                                                <div className="p-6 flex-1 cursor-pointer" onClick={() => setExpandedLogId(isExpanded ? null : log.id)}>
                                                    <div className="flex justify-between items-start">
                                                        <h3 className="text-lg font-bold uppercase text-gray-900">{log.className}</h3>
                                                    </div>

                                                    <div className="mt-4 space-y-2">
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <Calendar size={16} className="mr-2" />
                                                            {new Date(log.date).toLocaleDateString('pt-BR')}
                                                        </div>
                                                        <div className="flex items-center text-sm text-gray-500">
                                                            <FileText size={16} className="mr-2" />
                                                            Responsável: {log.userName}
                                                        </div>
                                                        <div className="flex items-center gap-4 mt-3">
                                                            <div className="flex items-center gap-2">
                                                                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-100 text-green-700 font-bold text-xs">
                                                                    {log.conformeCount}
                                                                </span>
                                                                <span className="text-xs text-gray-600">Conformes</span>
                                                            </div>
                                                            <div className="flex items-center gap-2">
                                                                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-xs ${log.naoConformeCount > 0 ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-400'}`}>
                                                                    {log.naoConformeCount}
                                                                </span>
                                                                <span className="text-xs text-gray-600">Não Conformes</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="bg-transparent px-6 py-3 border-t border-gray-100 flex justify-between items-center">
                                                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 uppercase">
                                                        <CheckCircle size={12} />
                                                        Concluído
                                                    </span>
                                                    <div className="flex space-x-2">
                                                        {canEdit && (
                                                            <>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        // TODO: Implement edit functionality
                                                                        alert('Funcionalidade de edição em desenvolvimento');
                                                                    }}
                                                                    className="p-1 rounded-full hover:bg-orange-50 transition"
                                                                    style={{ color: '#FF6B35' }}
                                                                    title="Editar Checklist"
                                                                >
                                                                    <Edit2 size={18} />
                                                                </button>
                                                                <button
                                                                    onClick={(e) => {
                                                                        e.stopPropagation();
                                                                        if (window.confirm(`Tem certeza que deseja excluir este checklist? Esta ação não pode ser desfeita.`)) {
                                                                            setChecklistLogs(checklistLogs.filter(l => l.id !== log.id));
                                                                        }
                                                                    }}
                                                                    className="text-gray-400 hover:text-red-600 p-1 rounded-full hover:bg-red-50 transition"
                                                                    title="Excluir Checklist"
                                                                >
                                                                    <Trash2 size={18} />
                                                                </button>
                                                            </>
                                                        )}
                                                    </div>
                                                </div>

                                                {/* Expanded Details */}
                                                {isExpanded && log.items && log.items.length > 0 && (
                                                    <div className="border-t border-gray-200 p-6 bg-gray-50">
                                                        <div className="flex justify-between items-center mb-4">
                                                            <h3 className="text-sm font-bold text-gray-900 uppercase">Detalhes do Checklist</h3>
                                                            <button
                                                                onClick={(e) => {
                                                                    e.stopPropagation();
                                                                    alert('Funcionalidade de exportar PDF em desenvolvimento');
                                                                }}
                                                                className="px-3 py-1.5 bg-orange-600 text-white text-xs font-bold rounded hover:bg-orange-700 transition-colors uppercase flex items-center gap-1"
                                                            >
                                                                <Download size={14} />
                                                                PDF
                                                            </button>
                                                        </div>
                                                        <div className="space-y-4 max-h-96 overflow-y-auto">
                                                            {(() => {
                                                                const groupedItems = log.items.reduce((acc, item) => {
                                                                    if (!acc[item.sectionTitle]) {
                                                                        acc[item.sectionTitle] = [];
                                                                    }
                                                                    acc[item.sectionTitle].push(item);
                                                                    return acc;
                                                                }, {} as Record<string, typeof log.items>);

                                                                return Object.entries(groupedItems).map(([sectionTitle, items]) => (
                                                                    <div key={sectionTitle} className="mb-4">
                                                                        <h4 className="text-xs font-bold text-gray-800 mb-2 pb-1 border-b border-gray-300">{sectionTitle}</h4>
                                                                        <div className="space-y-2">
                                                                            {items.map((item, idx) => (
                                                                                <div key={idx} className="bg-white p-3 rounded border border-gray-200 text-xs">
                                                                                    <div className="flex items-start justify-between gap-2">
                                                                                        <p className="text-gray-700 flex-1 text-xs">{item.itemText}</p>
                                                                                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase whitespace-nowrap ${item.status === 'CONFORME' ? 'bg-green-100 text-green-700' :
                                                                                            item.status === 'NAO_CONFORME' ? 'bg-red-100 text-red-700' :
                                                                                                item.status === 'NAO_APLICAVEL' ? 'bg-gray-100 text-gray-700' :
                                                                                                    'bg-yellow-100 text-yellow-700'
                                                                                            }`}>
                                                                                            {item.status === 'CONFORME' ? 'C' :
                                                                                                item.status === 'NAO_CONFORME' ? 'NC' :
                                                                                                    item.status === 'NAO_APLICAVEL' ? 'NA' : 'P'}
                                                                                        </span>
                                                                                    </div>
                                                                                    {item.comment && (
                                                                                        <div className="mt-2 pt-2 border-t border-gray-200">
                                                                                            <p className="text-xs font-bold text-gray-600">Obs:</p>
                                                                                            <p className="text-xs text-gray-700">{item.comment}</p>
                                                                                        </div>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ));
                                                            })()}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* Pagination Controls */}
                                {totalPages > 1 && (
                                    <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50 rounded-lg">
                                        <span className="text-sm text-gray-700">
                                            Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(endIndex, filteredLogs.length)}</span> de <span className="font-medium">{filteredLogs.length}</span> resultados
                                        </span>
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                                disabled={currentPage === 1}
                                                className="p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronLeft size={16} />
                                            </button>
                                            <button
                                                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                                disabled={currentPage === totalPages}
                                                className="p-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                <ChevronRight size={16} />
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </>
                        );
                    })()}
                </div>
            )}
        </div>
    );
};
