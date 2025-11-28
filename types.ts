
export enum UserRole {
  GESTOR = 'Gestor',
  COORDENADOR = 'Coordenador',
  INSTRUTOR = 'Instrutor',
  MOTORISTA = 'Motorista',
  EMBAIXADOR = 'Embaixador',
}

export enum CourseType {
  CBA_2 = 'CBA-2',
  CBA_2_COMP = 'CBA-2 Complementar',
  CBA_AT = 'CBA-AT',
  CBA_CE = 'CBA-CE',
  CUSTOM = 'Outro'
}

export interface User {
  id: string;
  name: string;
  cpf: string;
  role: UserRole;
  email: string;
  phone: string;
  birthDate: string;
  registrationDate: string;
  createdBy: string;
  base?: string; // New field for location restrictions
  uniformSize: {
    jumpsuit: string;
    shoes: string;
    shirt: string;
  };
  ppeSize: {
    pants: string;
    jacket: string;
    gloves: string;
    boots: string;
  };
  password?: string; // Simulating auth
}

export interface Subject {
  id: string;
  module: string;
  name: string;
  hours: number;
  modality: 'Teórica' | 'Prática';
}

export interface Course {
  id: string;
  name: string;
  type: CourseType;
  subjects: Subject[];
}

export interface ClassScheduleItem {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  duration: number; // Duration in hours (Tempos)
  subjectId: string;
  moduleId: string; // Snapshot of module name for grouping
  instructorIds: string[]; // User IDs (Multiple)
  isCompleted: boolean;
}

export interface ClassGroup {
  id: string;
  name: string;
  startDate: string; // Calculated overall start
  endDate: string;   // Calculated overall end
  courseId: string;
  studentIds: string[];
  daysOfWeek: number[]; // 0-6
  includeWeekends: boolean; // Deprecated
  includeSaturday: boolean;
  includeSunday: boolean;
  hoursPerDay: number;

  // New Fields
  theoryStartDate?: string;
  practiceStartDate?: string;
  registrationNumber?: string;
  capBa?: string;
  schedule: ClassScheduleItem[];

  // Setup/Teardown Instructors
  setupInstructor1Id?: string;
  setupInstructor1Days?: number;
  setupInstructor2Id?: string;
  setupInstructor2Days?: number;
  teardownInstructor1Id?: string;
  teardownInstructor1Days?: number;
  teardownInstructor2Id?: string;
  teardownInstructor2Days?: number;
}

export type EnrollmentStatus = 'Matriculado' | 'Cancelado' | 'Desligado' | 'Pendente' | 'Aprovado' | 'Reprovado';

export interface Student {
  id: string;
  name: string;
  cpf: string;
  classId?: string; // Linked Class
  enrollmentStatus: EnrollmentStatus;

  rg: string;
  rgIssuer: string;
  birthDate: string;
  phone: string;
  email: string;
  origin: string; // Naturalidade
  address: string;
  nationality: string;
  motherName: string;
  fatherName: string;

  // Computed fields for display
  matricula?: string;
  registro?: string;
  capCode?: string;
  className?: string;

  // Grades - P1, P2 are numbers, T1, T2 are strings (time)
  grades: {
    [key: string]: number | string;
  };
  finalTheory: number;
  finalPractical: number;
  finalGrade: number;
}

export interface Task {
  id: string;
  title: string;
  description: string; // Can act as comments
  startDate: string;
  deadline: string;
  creatorId: string;
  assigneeId?: string; // If null, it's private to creator
  priority: 'Baixa' | 'Média' | 'Alta';
  status: 'Pendente' | 'Aguardando Aprovação' | 'Concluída';
  comments: { userId: string; text: string; date: string }[];
}

export type AttendanceStatus = 'Presente' | 'Ausente' | 'Justificado';

export interface AttendanceRecord {
  studentId: string;
  status: AttendanceStatus;
  justification?: string;
}

export interface AttendanceLog {
  id: string;
  classId: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  timestamp: string; // ISO Full
  takenById: string; // User ID
  takenByName: string; // User Name snapshot
  notes?: string;
  records: AttendanceRecord[];
}

export interface GradeLog {
  id: string;
  classId: string;
  timestamp: string;
  userId: string;
  userName: string;
  details: string;
}

export interface PaymentRecord {
  id: string;
  scheduleItemId: string;
  instructorId: string;
  amount: number;
  datePaid: string;
  paidBy: string;
}

// Checklist Types
export type ChecklistType = 'VEICULO' | 'EQUIPAMENTOS';

export interface ChecklistItemDefinition {
  id: string;
  text: string;
  category: string;
}

export interface ChecklistTemplate {
  id: string;
  type: ChecklistType;
  title: string;
  items: ChecklistItemDefinition[];
}

export interface ChecklistItemResult {
  itemId: string;
  itemText: string;
  status: 'Conforme' | 'Não Conforme' | 'N/A';
  comment?: string;
  photoUrl?: string; // Base64
}

export interface ChecklistLog {
  id: string;
  templateId: string;
  type: ChecklistType;
  date: string;
  timestamp: string;
  userId: string;
  userName: string;
  classId?: string; // Required for Equipment
  stage?: 'INICIO' | 'TERMINO'; // Required for Equipment
  items: ChecklistItemResult[];
  isCompliant: boolean;
  notes?: string;
}

// Notifications & Swaps
export interface Notification {
  id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'assignment' | 'swap_request';
  read: boolean;
  timestamp: string;
  metadata?: {
    taskId?: string;
    classId?: string;
    swapRequestId?: string;
  };
}

export interface SwapRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  targetInstructorId: string;
  targetInstructorName: string;
  classId: string;
  className: string;
  scheduleId: string;
  date: string;
  time: string;
  status: 'Pendente' | 'Aceito' | 'Recusado';
  timestamp: string;
}

// Firefighters Management
export type Region = 'Norte' | 'Sul' | 'Sudeste' | 'Nordeste' | 'Centro-Oeste';
export type AirportClass = 'I' | 'II' | 'III' | 'IV';

export interface Base {
  id: string;
  name: string; // Code e.g., SBGR
  region: Region;
  airportClass: AirportClass;
}

export interface Firefighter {
  id: string;
  name: string;
  base: string;
  region: Region;
  airportClass: AirportClass;
  graduationDate: string; // Data Formação
  lastUpdateDate: string; // Ultima Atualização (AT)
  isNotUpdated: boolean; // "Ainda não atualizado"
  lastFireExerciseDate?: string; // Ultimo exercicio com fogo (Only Class IV)

  // Leave/Away Status
  isAway: boolean;
  awayStartDate?: string;
  awayEndDate?: string;
  awayReason?: string;
}

export interface FirefighterLog {
  id: string;
  firefighterId: string;
  firefighterName: string;
  timestamp: string;
  userId: string; // Who made the change
  userName: string;
  details: string;
}

// Helper types for UI
export const UNIFORM_SIZES = ['PP', 'P', 'M', 'G', 'GG', 'XG'];
export const SHOE_SIZES = ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'];
