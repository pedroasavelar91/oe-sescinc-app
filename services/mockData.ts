
import { User, UserRole, Course, CourseType, ClassGroup, Student, Task, AttendanceLog, GradeLog, PaymentRecord, ChecklistTemplate, ChecklistLog, Notification, SwapRequest, Firefighter, FirefighterLog, Base } from '../types';

export const initialUsers: User[] = [
  {
    id: 'a0000000-0000-0000-0000-000000000000',
    name: 'Administrador Master',
    cpf: '000.000.000-00',
    role: UserRole.GESTOR,
    email: 'admin@medgroup.com',
    phone: '11999999999',
    birthDate: '1980-01-01',
    registrationDate: '2023-01-01',
    createdBy: 'System',
    uniformSize: { jumpsuit: 'G', shoes: '42', shirt: 'G' },
    ppeSize: { pants: 'G', jacket: 'G', gloves: 'M', boots: '42' },
    password: 'admin123'
  },
  {
    id: 'b1111111-1111-1111-1111-111111111111',
    name: 'João Instrutor',
    cpf: '111.222.333-44',
    role: UserRole.INSTRUTOR,
    email: 'joao@firesafe.com',
    phone: '11988888888',
    birthDate: '1985-05-15',
    registrationDate: '2023-02-01',
    createdBy: 'a0000000-0000-0000-0000-000000000000',
    uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' },
    ppeSize: { pants: 'M', jacket: 'M', gloves: 'G', boots: '40' },
    password: '123'
  },
  {
    id: 'c2222222-2222-2222-2222-222222222222',
    name: 'Ana Coordenadora',
    cpf: '999.888.777-66',
    role: UserRole.COORDENADOR,
    email: 'ana@firesafe.com',
    phone: '11977777777',
    birthDate: '1990-03-20',
    registrationDate: '2023-01-15',
    createdBy: 'a0000000-0000-0000-0000-000000000000',
    base: 'SBGR',
    uniformSize: { jumpsuit: 'P', shoes: '36', shirt: 'P' },
    ppeSize: { pants: 'P', jacket: 'P', gloves: 'P', boots: '36' },
    password: '123'
  },
  {
    id: 'd3333333-3333-3333-3333-333333333333',
    name: 'Marcos Motorista',
    cpf: '777.666.555-44',
    role: UserRole.MOTORISTA,
    email: 'marcos@firesafe.com',
    phone: '11966666666',
    birthDate: '1988-08-08',
    registrationDate: '2023-03-01',
    createdBy: 'a0000000-0000-0000-0000-000000000000',
    uniformSize: { jumpsuit: 'G', shoes: '42', shirt: 'G' },
    ppeSize: { pants: 'G', jacket: 'G', gloves: 'G', boots: '42' },
    password: '123'
  },
  {
    id: 'e4444444-4444-4444-4444-444444444444',
    name: 'Roberto Embaixador',
    cpf: '555.444.333-22',
    role: UserRole.EMBAIXADOR,
    email: 'roberto@firesafe.com',
    phone: '11955554444',
    birthDate: '1982-12-12',
    registrationDate: '2023-04-01',
    createdBy: 'a0000000-0000-0000-0000-000000000000',
    base: 'SBEG',
    uniformSize: { jumpsuit: 'G', shoes: '42', shirt: 'G' },
    ppeSize: { pants: 'G', jacket: 'G', gloves: 'G', boots: '42' },
    password: '123'
  }
];

export const initialCourses: Course[] = [
  {
    id: 'course-1',
    name: 'Curso Básico CBA-2',
    type: CourseType.CBA_2,
    subjects: [
      { id: 'sub-1', module: 'Módulo I', name: 'Teoria do Fogo', hours: 4, modality: 'Teórica' },
      { id: 'sub-2', module: 'Módulo II', name: 'Combate a Incêndio', hours: 8, modality: 'Prática' },
      { id: 'sub-3', module: 'Módulo III', name: 'Primeiros Socorros', hours: 8, modality: 'Prática' }
    ]
  },
  {
    id: 'course-2',
    name: 'Curso Avançado CBA-CE',
    type: CourseType.CBA_CE,
    subjects: [
      { id: 'sub-4', module: 'Gestão', name: 'Liderança', hours: 4, modality: 'Teórica' },
      { id: 'sub-5', module: 'Operacional', name: 'Gestão de Crise', hours: 12, modality: 'Prática' }
    ]
  }
];

export const initialClasses: ClassGroup[] = [
  {
    id: 'class-demo-1',
    name: 'Curso Básico CBA-2 20/2025',
    startDate: '2025-03-01',
    endDate: '2025-03-15',
    courseId: 'course-1',
    studentIds: ['s1', 's2', 's3', 's4', 's5'],
    daysOfWeek: [],
    includeWeekends: false,
    includeSaturday: true,
    includeSunday: false,
    hoursPerDay: 8,
    theoryStartDate: '2025-03-01',
    practiceStartDate: '2025-03-10',
    registrationNumber: '1000', // Base Register Number
    capBa: '5000', // Base CAP Number
    schedule: [
      // Mock schedule data to support matrix view
      { id: 'sch-1', date: '2025-03-01', startTime: '08:00', endTime: '12:00', duration: 4, subjectId: 'sub-1', moduleId: 'Módulo I', instructorIds: ['b1111111-1111-1111-1111-111111111111'], isCompleted: false },
      { id: 'sch-2', date: '2025-03-02', startTime: '08:00', endTime: '17:00', duration: 8, subjectId: 'sub-2', moduleId: 'Módulo II', instructorIds: ['b1111111-1111-1111-1111-111111111111'], isCompleted: false },
    ]
  }
];

export const initialStudents: Student[] = [
  {
    id: 's1',
    name: 'Alessandro de Souza',
    cpf: '111.111.111-11',
    classId: 'class-demo-1',
    enrollmentStatus: 'Aprovado',
    rg: '11.111.111-1',
    rgIssuer: 'SSP/SP',
    birthDate: '1990-01-01',
    phone: '11999998888',
    email: 'alessandro@email.com',
    origin: 'São Paulo',
    address: 'Rua A, 100',
    nationality: 'Brasileira',
    motherName: 'Ana Souza',
    fatherName: 'Pedro Souza',
    // Example: Excellent Student
    grades: {
      'P1': 9.5,
      'P2': 9.0,
      'P3': 10.0,
      'T1 TP/EPR': '01:45',
      'T2 TP/EPR': '01:30',
      'Nota TP/EPR': 10.0,
      'Emerg. Químicas': 9.5,
      'APH': 10.0,
      'Maneabilidade': 10.0,
      'Exerc. Fogo': 9.0
    },
    finalTheory: 9.5,
    finalPractical: 9.7,
    finalGrade: 9.6
  },
  {
    id: 's2', // ID order shouldn't matter for sorting
    name: 'Beatriz Oliveira',
    cpf: '222.222.222-22',
    classId: 'class-demo-1',
    enrollmentStatus: 'Aprovado',
    rg: '12.345.678-9',
    rgIssuer: 'SSP/SP',
    birthDate: '1995-05-10',
    phone: '11988887777',
    email: 'beatriz@email.com',
    origin: 'São Paulo',
    address: 'Rua B, 200',
    nationality: 'Brasileira',
    motherName: 'Maria Oliveira',
    fatherName: 'José Oliveira',
    // Example: Average Student, needed Recovery
    grades: {
      'P1': 5.0,
      'P2': 6.0,
      'P3': 4.0,
      'Recuperação': 7.5, // Replaces 4.0 in calculation -> (7.5, 6.0, 5.0) / 3 = 6.16
      'T1 TP/EPR': '02:30',
      'T2 TP/EPR': '02:15',
      'Nota TP/EPR': 7.0,
      'Emerg. Químicas': 7.5,
      'APH': 8.0,
      'Maneabilidade': 7.0,
      'Exerc. Fogo': 7.5
    },
    finalTheory: 6.2,
    finalPractical: 7.4,
    finalGrade: 6.8
  },
  {
    id: 's3',
    name: 'Carlos Eduardo',
    cpf: '333.333.333-33',
    classId: 'class-demo-1',
    enrollmentStatus: 'Cancelado',
    rg: '33.333.333-3',
    rgIssuer: 'SSP/SP',
    birthDate: '1992-02-02',
    phone: '11977776666',
    email: 'carlos@email.com',
    origin: 'Rio de Janeiro',
    address: 'Rua C, 300',
    nationality: 'Brasileira',
    motherName: 'Carla Eduardo',
    fatherName: 'Carlos Pai',
    grades: {},
    finalTheory: 0,
    finalPractical: 0,
    finalGrade: 0
  },
  {
    id: 's4',
    name: 'Daniel Santos',
    cpf: '444.444.444-44',
    classId: 'class-demo-1',
    enrollmentStatus: 'Reprovado',
    rg: '44.444.444-4',
    rgIssuer: 'SSP/SP',
    birthDate: '1998-08-08',
    phone: '11966665555',
    email: 'daniel@email.com',
    origin: 'Bahia',
    address: 'Rua D, 400',
    nationality: 'Brasileira',
    motherName: 'Denise Santos',
    fatherName: 'Dario Santos',
    // Example: Incomplete Grades
    grades: {
      'P1': 4.0,
      'P2': 3.0
      // Missing P3, Rec, and Practice
    },
    finalTheory: 2.3,
    finalPractical: 0,
    finalGrade: 1.1
  },
  {
    id: 's5',
    name: 'Eduardo Lima',
    cpf: '555.555.555-55',
    classId: 'class-demo-1',
    enrollmentStatus: 'Aprovado',
    rg: '55.555.555-5',
    rgIssuer: 'SSP/BA',
    birthDate: '2000-01-01',
    phone: '71999999999',
    email: 'eduardo@email.com',
    origin: 'Salvador',
    address: 'Rua E, 500',
    nationality: 'Brasileira',
    motherName: 'Eliana Lima',
    fatherName: 'Edson Lima',
    grades: {
      'P1': 10.0,
      'P2': 10.0,
      'P3': 10.0,
      'T1 TP/EPR': '01:20',
      'T2 TP/EPR': '01:15',
      'Nota TP/EPR': 10.0,
      'Emerg. Químicas': 10.0,
      'APH': 10.0,
      'Maneabilidade': 10.0,
      'Exerc. Fogo': 10.0
    },
    finalTheory: 10.0,
    finalPractical: 10.0,
    finalGrade: 10.0
  }
];

export const initialTasks: Task[] = [];

export const initialAttendance: AttendanceLog[] = [
  {
    id: 'log-1',
    classId: 'class-demo-1',
    date: '2025-03-01',
    time: '08:00',
    timestamp: '2025-03-01T08:00:00Z',
    takenById: 'a0000000-0000-0000-0000-000000000000',
    takenByName: 'Administrador Master',
    records: [
      { studentId: 's1', status: 'Presente' },
      { studentId: 's2', status: 'Presente' },
      { studentId: 's3', status: 'Ausente' },
      { studentId: 's4', status: 'Presente' },
      { studentId: 's5', status: 'Presente' },
    ]
  },
  {
    id: 'log-2',
    classId: 'class-demo-1',
    date: '2025-03-02',
    time: '08:00',
    timestamp: '2025-03-02T08:00:00Z',
    takenById: 'a0000000-0000-0000-0000-000000000000',
    takenByName: 'Administrador Master',
    records: [
      { studentId: 's1', status: 'Presente' },
      { studentId: 's2', status: 'Justificado', justification: 'Atestado Médico' },
      { studentId: 's3', status: 'Ausente' },
      { studentId: 's4', status: 'Presente' },
      { studentId: 's5', status: 'Ausente' },
    ]
  }
];

export const initialGradeLogs: GradeLog[] = [
  {
    id: 'glog-1',
    classId: 'class-demo-1',
    userId: 'a0000000-0000-0000-0000-000000000000',
    userName: 'Administrador Master',
    timestamp: '2025-03-10T14:30:00Z',
    details: 'Lançamento de notas da P1 e P2'
  }
];

export const initialPayments: PaymentRecord[] = [];

export const initialChecklistTemplates: ChecklistTemplate[] = [
  {
    id: 'tpl-veiculo',
    type: 'VEICULO',
    title: 'Checklist Diário - Carreta de Treinamento',
    items: [
      { id: 'v1', category: 'Cabine', text: 'Limpeza interna' },
      { id: 'v2', category: 'Cabine', text: 'Painel de instrumentos' },
      { id: 'v3', category: 'Motor', text: 'Nível de óleo' },
      { id: 'v4', category: 'Motor', text: 'Nível de água' },
      { id: 'v5', category: 'Pneus', text: 'Calibragem dos pneus' },
      { id: 'v6', category: 'Pneus', text: 'Estado dos pneus (estepe)' },
      { id: 'v7', category: 'Carroceria', text: 'Luzes de sinalização' },
      { id: 'v8', category: 'Carroceria', text: 'Estado geral da pintura' },
    ]
  },
  {
    id: 'tpl-equipamentos',
    type: 'EQUIPAMENTOS',
    title: 'Checklist de Materiais e Equipamentos',
    items: [
      { id: 'e1', category: 'EPIs', text: 'Capacetes de instrução (Quantidade)' },
      { id: 'e2', category: 'EPIs', text: 'Luvas de proteção' },
      { id: 'e3', category: 'APH', text: 'Bonecos de RCP (Adulto)' },
      { id: 'e4', category: 'APH', text: 'Bonecos de RCP (Infantil)' },
      { id: 'e5', category: 'APH', text: 'DEA de treinamento' },
      { id: 'e6', category: 'Combate', text: 'Extintores de CO2' },
      { id: 'e7', category: 'Combate', text: 'Extintores de Pó Químico' },
      { id: 'e8', category: 'Combate', text: 'Mangueiras' },
    ]
  }
];

export const initialChecklistLogs: ChecklistLog[] = [];

export const initialNotifications: Notification[] = [];
export const initialSwapRequests: SwapRequest[] = [];

export const initialBases: Base[] = [
  { id: 'b1', name: 'SBGR', region: 'Sudeste', airportClass: 'IV' },
  { id: 'b2', name: 'SBEG', region: 'Norte', airportClass: 'II' },
  { id: 'b3', name: 'SBSJ', region: 'Sul', airportClass: 'III' },
];

export const initialFirefighters: Firefighter[] = [
  {
    id: 'ff-1',
    name: 'Sérgio Bombeiro',
    base: 'SBGR',
    region: 'Sudeste',
    airportClass: 'IV',
    graduationDate: '2022-01-10',
    lastUpdateDate: '2024-01-10',
    isNotUpdated: false,
    lastFireExerciseDate: '2024-02-15',
    isAway: false
  },
  {
    id: 'ff-2',
    name: 'Marcos Norte',
    base: 'SBEG',
    region: 'Norte',
    airportClass: 'II',
    graduationDate: '2021-05-20',
    lastUpdateDate: '2023-05-20', // Valid 4 years (until 2027 based on last update? Or logic applies to grad/update)
    isNotUpdated: false,
    isAway: false
  },
  {
    id: 'ff-3',
    name: 'Fernando Afastado',
    base: 'SBSJ',
    region: 'Sul',
    airportClass: 'III',
    graduationDate: '2020-01-01',
    lastUpdateDate: '2022-01-01',
    isNotUpdated: false,
    isAway: true,
    awayStartDate: '2025-01-01',
    awayEndDate: '2025-06-01',
    awayReason: 'Licença Médica'
  }
];

export const initialFirefighterLogs: FirefighterLog[] = [];