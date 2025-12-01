// Data mappers for converting between database snake_case and TypeScript camelCase

import { Student, Task, AttendanceLog, GradeLog, PaymentRecord, ChecklistTemplate, ChecklistLog, Firefighter, FirefighterLog, Base, Region, AirportClass, User, UserRole } from '../types';

// Student Mappers
export const mapStudentFromDB = (db: any): Student => ({
    id: db.id,
    name: db.name,
    cpf: db.cpf,
    classId: db.class_id,
    enrollmentStatus: db.enrollment_status,
    rg: db.rg,
    rgIssuer: db.rg_issuer,
    birthDate: db.birth_date,
    phone: db.phone,
    email: db.email,
    origin: db.origin,
    address: db.address,
    nationality: db.nationality,
    motherName: db.mother_name,
    fatherName: db.father_name,
    matricula: db.matricula,
    registro: db.registro,
    capCode: db.cap_code,
    className: db.class_name,
    grades: db.grades || {},
    finalTheory: db.final_theory || 0,
    finalPractical: db.final_practical || 0,
    finalGrade: db.final_grade || 0
});

export const mapStudentToDB = (student: Student) => ({
    id: student.id,
    name: student.name,
    cpf: student.cpf,
    class_id: student.classId,
    enrollment_status: student.enrollmentStatus,
    rg: student.rg,
    rg_issuer: student.rgIssuer,
    birth_date: student.birthDate,
    phone: student.phone,
    email: student.email,
    origin: student.origin,
    address: student.address,
    nationality: student.nationality,
    mother_name: student.motherName,
    father_name: student.fatherName,
    matricula: student.matricula,
    registro: student.registro,
    cap_code: student.capCode,
    class_name: student.className,
    grades: student.grades,
    final_theory: student.finalTheory,
    final_practical: student.finalPractical,
    final_grade: student.finalGrade
});

// Task Mappers
export const mapTaskFromDB = (db: any): Task => ({
    id: db.id,
    title: db.title,
    description: db.description,
    startDate: db.start_date,
    deadline: db.deadline,
    creatorId: db.creator_id,
    assigneeId: db.assignee_id,
    priority: db.priority,
    status: db.status,
    comments: db.comments || [],
    logs: db.logs || [],
    resolutionNotes: db.resolution_notes
});

export const mapTaskToDB = (task: Task) => ({
    id: task.id,
    title: task.title,
    description: task.description,
    start_date: task.startDate,
    deadline: task.deadline,
    creator_id: task.creatorId,
    assignee_id: task.assigneeId,
    priority: task.priority,
    status: task.status,
    comments: task.comments,
    logs: task.logs,
    resolution_notes: task.resolutionNotes
});

// AttendanceLog Mappers
export const mapAttendanceLogFromDB = (db: any): AttendanceLog => ({
    id: db.id,
    classId: db.class_id,
    date: db.date,
    time: db.time,
    timestamp: db.timestamp,
    takenById: db.taken_by_id,
    takenByName: db.taken_by_name,
    notes: db.notes,
    records: db.records || []
});

export const mapAttendanceLogToDB = (log: AttendanceLog) => ({
    id: log.id,
    class_id: log.classId,
    date: log.date,
    time: log.time,
    timestamp: log.timestamp,
    taken_by_id: log.takenById,
    taken_by_name: log.takenByName,
    notes: log.notes,
    records: log.records
});

// GradeLog Mappers
export const mapGradeLogFromDB = (db: any): GradeLog => ({
    id: db.id,
    classId: db.class_id,
    timestamp: db.timestamp,
    userId: db.user_id,
    userName: db.user_name,
    details: db.details
});

export const mapGradeLogToDB = (log: GradeLog) => ({
    id: log.id,
    class_id: log.classId,
    timestamp: log.timestamp,
    user_id: log.userId,
    user_name: log.userName,
    details: log.details
});

// PaymentRecord Mappers
export const mapPaymentFromDB = (db: any): PaymentRecord => ({
    id: db.id,
    scheduleItemId: db.schedule_item_id,
    instructorId: db.instructor_id,
    amount: db.amount,
    datePaid: db.date_paid,
    paidBy: db.paid_by
});

export const mapPaymentToDB = (payment: PaymentRecord) => ({
    id: payment.id,
    schedule_item_id: payment.scheduleItemId,
    instructor_id: payment.instructorId,
    amount: payment.amount,
    date_paid: payment.datePaid,
    paid_by: payment.paidBy
});

// ChecklistTemplate Mappers
export const mapChecklistTemplateFromDB = (db: any): ChecklistTemplate => ({
    id: db.id,
    type: db.type,
    title: db.title,
    items: db.items || []
});

export const mapChecklistTemplateToDB = (template: ChecklistTemplate) => ({
    id: template.id,
    type: template.type,
    title: template.title,
    items: template.items
});

// ChecklistLog Mappers
export const mapChecklistLogFromDB = (db: any): ChecklistLog => ({
    id: db.id,
    templateId: db.template_id,
    type: db.type,
    date: db.date,
    timestamp: db.timestamp,
    userId: db.user_id,
    userName: db.user_name,
    classId: db.class_id,
    stage: db.stage,
    items: db.items || [],
    isCompliant: db.is_compliant,
    notes: db.notes
});

export const mapChecklistLogToDB = (log: ChecklistLog) => ({
    id: log.id,
    template_id: log.templateId,
    type: log.type,
    date: log.date,
    timestamp: log.timestamp,
    user_id: log.userId,
    user_name: log.userName,
    class_id: log.classId,
    stage: log.stage,
    items: log.items,
    is_compliant: log.isCompliant,
    notes: log.notes
});

// Firefighter Mappers
export const mapFirefighterFromDB = (db: any): Firefighter => ({
    id: db.id,
    name: db.name,
    base: db.base,
    region: db.region as Region,
    airportClass: db.airport_class as AirportClass,
    graduationDate: db.graduation_date,
    lastUpdateDate: db.last_update_date,
    isNotUpdated: db.is_not_updated || false,
    lastFireExerciseDate: db.last_fire_exercise_date,
    isAway: db.is_away || false,
    awayStartDate: db.away_start_date,
    awayEndDate: db.away_end_date,
    awayReason: db.away_reason
});

export const mapFirefighterToDB = (ff: Firefighter) => ({
    id: ff.id,
    name: ff.name,
    base: ff.base,
    region: ff.region,
    airport_class: ff.airportClass,
    graduation_date: ff.graduationDate,
    last_update_date: ff.lastUpdateDate,
    is_not_updated: ff.isNotUpdated,
    last_fire_exercise_date: ff.lastFireExerciseDate,
    is_away: ff.isAway,
    away_start_date: ff.awayStartDate,
    away_end_date: ff.awayEndDate,
    away_reason: ff.awayReason
});

// FirefighterLog Mappers
export const mapFirefighterLogFromDB = (db: any): FirefighterLog => ({
    id: db.id,
    firefighterId: db.firefighter_id,
    firefighterName: db.firefighter_name,
    timestamp: db.timestamp,
    userId: db.user_id,
    userName: db.user_name,
    details: db.details
});

export const mapFirefighterLogToDB = (log: FirefighterLog) => ({
    id: log.id,
    firefighter_id: log.firefighterId,
    firefighter_name: log.firefighterName,
    timestamp: log.timestamp,
    user_id: log.userId,
    user_name: log.userName,
    details: log.details
});


// User Mappers
export const mapUserFromDB = (db: any): User => ({
    id: db.id,
    name: db.name,
    cpf: db.cpf,
    role: db.role as UserRole,
    email: db.email,
    phone: db.phone,
    birthDate: db.birth_date,
    registrationDate: db.registration_date,
    createdBy: db.created_by,
    base: db.base,
    uniformSize: db.uniform_size,
    ppeSize: db.ppe_size,
    photoUrl: db.photo_url,
    password: db.password
});

export const mapUserToDB = (user: User) => ({
    id: user.id,
    name: user.name,
    cpf: user.cpf,
    role: user.role,
    email: user.email,
    phone: user.phone,
    birth_date: user.birthDate,
    registration_date: user.registrationDate,
    created_by: user.createdBy,
    base: user.base,
    uniform_size: user.uniformSize,
    ppe_size: user.ppeSize,
    photo_url: user.photoUrl,
    password: user.password
});

// Base Mappers
export const mapBaseFromDB = (db: any): Base => ({
    id: db.id,
    name: db.name,
    region: db.region as Region,
    airportClass: db.airport_class as AirportClass
});

export const mapBaseToDB = (base: Base) => ({
    id: base.id,
    name: base.name,
    region: base.region,
    airport_class: base.airportClass
});
