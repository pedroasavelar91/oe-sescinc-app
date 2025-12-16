
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, ClassGroup, Student, Task, UserRole, AttendanceLog, GradeLog, PaymentRecord, ChecklistTemplate, ChecklistLog, Notification, SwapRequest, Firefighter, FirefighterLog, Base, Folder, DocumentFile, SetupTeardownAssignment, Question, QuestionReview, QuestionApprover, TrainingSchedule } from '../types';

import { supabase, isSupabaseConfigured } from '../services/supabase';
import { mapStudentFromDB, mapStudentToDB, mapTaskFromDB, mapTaskToDB, mapAttendanceLogFromDB, mapAttendanceLogToDB, mapGradeLogFromDB, mapGradeLogToDB, mapPaymentFromDB, mapPaymentToDB, mapChecklistTemplateFromDB, mapChecklistTemplateToDB, mapChecklistLogFromDB, mapChecklistLogToDB, mapFirefighterFromDB, mapFirefighterToDB, mapFirefighterLogFromDB, mapFirefighterLogToDB, mapBaseFromDB, mapBaseToDB, mapUserFromDB, mapUserToDB } from '../services/dataMappers';

interface StoreContextType {
    currentUser: User | null;
    users: User[];
    courses: Course[];
    classes: ClassGroup[];
    students: Student[];
    tasks: Task[];
    attendanceLogs: AttendanceLog[];
    gradeLogs: GradeLog[];
    payments: PaymentRecord[];
    checklistTemplates: ChecklistTemplate[];
    checklistLogs: ChecklistLog[];
    notifications: Notification[];
    swapRequests: SwapRequest[];
    firefighters: Firefighter[];
    firefighterLogs: FirefighterLog[];
    bases: Base[];
    folders: Folder[];
    documents: DocumentFile[];
    setupTeardownAssignments: SetupTeardownAssignment[];
    questions: Question[];
    questionReviews: QuestionReview[];
    questionApprovers: QuestionApprover[];
    trainingSchedules: TrainingSchedule[];

    loading: boolean;
    login: (email: string) => Promise<void>;
    logout: () => void;

    addTrainingSchedule: (schedule: TrainingSchedule) => Promise<void>;
    updateTrainingSchedule: (id: string, updates: Partial<TrainingSchedule>) => Promise<void>;
    deleteTrainingSchedule: (id: string) => Promise<void>;

    addUser: (user: User) => Promise<void>;
    addCourse: (course: Course) => Promise<void>;
    updateCourse: (course: Course) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;

    addClass: (cls: ClassGroup) => Promise<void>;
    updateClass: (cls: ClassGroup) => Promise<void>;
    deleteClass: (id: string) => Promise<void>;

    addStudent: (student: Student) => Promise<void>;
    updateStudent: (student: Student) => Promise<void>;
    deleteStudent: (id: string) => Promise<void>;

    addTask: (task: Task) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;
    deleteTask: (id: string) => Promise<void>;

    addAttendanceLog: (log: AttendanceLog) => Promise<void>;
    addGradeLog: (log: GradeLog) => Promise<void>;
    addPayment: (payment: PaymentRecord) => Promise<void>;
    deletePayment: (id: string) => Promise<void>;

    addChecklistLog: (log: ChecklistLog) => Promise<void>;
    updateChecklistTemplate: (template: ChecklistTemplate) => Promise<void>;

    markNotificationAsRead: (id: string) => Promise<void>;
    requestSwap: (request: Partial<SwapRequest>) => Promise<void>;
    resolveSwapRequest: (requestId: string, approved: boolean) => Promise<void>;

    addFirefighter: (ff: Firefighter) => Promise<void>;
    updateFirefighter: (ff: Firefighter) => Promise<void>;
    deleteFirefighter: (id: string) => Promise<void>;
    addFirefighterLog: (log: FirefighterLog) => Promise<void>;

    addBase: (base: Base) => Promise<void>;
    deleteBase: (id: string) => Promise<void>;

    updateUser: (user: User) => Promise<void>;
    deleteUser: (id: string) => Promise<void>;

    addFolder: (folder: Folder) => Promise<void>;
    deleteFolder: (id: string) => Promise<void>;
    addDocument: (doc: DocumentFile) => Promise<void>;
    deleteDocument: (id: string) => Promise<void>;

    // Setup/Teardown
    addSetupTeardownAssignment: (assignment: SetupTeardownAssignment) => Promise<void>;
    updateSetupTeardownAssignment: (assignment: SetupTeardownAssignment) => Promise<void>;
    deleteSetupTeardownAssignment: (id: string) => Promise<void>;

    // Question Bank
    addQuestion: (question: Question) => Promise<void>;
    updateQuestion: (question: Question) => Promise<void>;
    deleteQuestion: (id: string) => Promise<void>;
    reviewQuestion: (questionId: string, action: 'Aprovada' | 'Rejeitada' | 'Em Revisão', notes: string, reviewerId: string) => Promise<void>;
    addApprover: (userId: string, userName: string, assignedBy: string) => Promise<void>;
    removeApprover: (approverId: string) => Promise<void>;

    // File Upload
    uploadDocument: (file: File, folderId: string | null) => Promise<string>;
    getSignedDocumentUrl: (url: string) => Promise<string | null>;
    uploadProfilePhoto: (file: File, userId: string) => Promise<string>;
    deleteFile: (bucket: string, path: string) => Promise<void>;
    seedDatabase: () => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// --- Helpers for Data Mapping ---

const mapClassFromDB = (dbClass: any): ClassGroup => {
    console.log('📚 mapClassFromDB - Raw DB data:', dbClass);
    const mapped = {
        id: dbClass.id,
        name: dbClass.name,
        startDate: dbClass.start_date,
        endDate: dbClass.end_date,
        courseId: dbClass.course_id,
        studentIds: dbClass.student_ids || [],
        daysOfWeek: dbClass.days_of_week || [],
        includeWeekends: false, // Deprecated in DB
        includeSaturday: dbClass.include_saturday,
        includeSunday: dbClass.include_sunday,
        hoursPerDay: dbClass.hours_per_day,
        theoryStartDate: dbClass.theory_start_date,
        practiceStartDate: dbClass.practice_start_date,
        registrationNumber: dbClass.registration_number,
        capBa: dbClass.cap_ba,
        location: dbClass.location, // Re-enabled
        schedule: dbClass.schedule || [], // Correct: DB column is 'schedule', maps to 'schedule' in types
        setupInstructor1Id: dbClass.setup_instructor_1_id,
        setupInstructor1Days: dbClass.setup_instructor_1_days,
        setupInstructor2Id: dbClass.setup_instructor_2_id,
        setupInstructor2Days: dbClass.setup_instructor_2_days,
        teardownInstructor1Id: dbClass.teardown_instructor_1_id,
        teardownInstructor1Days: dbClass.teardown_instructor_1_days,
        teardownInstructor2Id: dbClass.teardown_instructor_2_id,
        teardownInstructor2Days: dbClass.teardown_instructor_2_days
    };
    console.log('📚 mapClassFromDB - Mapped class:', mapped);
    return mapped;
};

const mapClassToDB = (cls: ClassGroup) => {
    console.log('🔄 mapClassToDB (VERSION 2.0 - FIXED) called for:', cls.name);
    return {
        id: cls.id,
        name: cls.name,
        start_date: cls.startDate,
        end_date: cls.endDate,
        course_id: cls.courseId,
        student_ids: cls.studentIds || [],
        days_of_week: cls.daysOfWeek || [],
        include_saturday: cls.includeSaturday,
        include_sunday: cls.includeSunday,
        hours_per_day: cls.hoursPerDay,
        theory_start_date: cls.theoryStartDate,
        practice_start_date: cls.practiceStartDate,
        registration_number: cls.registrationNumber,
        cap_ba: cls.capBa,
        location: cls.location,
        schedule: cls.schedule || [], // Correct column name is 'schedule', not 'subjects'
        setup_instructor_1_id: cls.setupInstructor1Id || null,
        setup_instructor_1_days: cls.setupInstructor1Days || 0,
        setup_instructor_2_id: cls.setupInstructor2Id || null,
        setup_instructor_2_days: cls.setupInstructor2Days || 0,
        teardown_instructor_1_id: cls.teardownInstructor1Id || null,
        teardown_instructor_1_days: cls.teardownInstructor1Days || 0,
        teardown_instructor_2_id: cls.teardownInstructor2Id || null,
        teardown_instructor_2_days: cls.teardownInstructor2Days || 0
    };
};

const mapSwapRequestFromDB = (db: any): SwapRequest => ({
    id: db.id,
    requesterId: db.requester_id,
    requesterName: db.requester_name,
    targetInstructorId: db.target_instructor_id,
    targetInstructorName: db.target_instructor_name,
    classId: db.class_id,
    className: db.class_name,
    scheduleId: db.schedule_id,
    date: db.date,
    time: db.time,
    status: db.status,
    timestamp: db.timestamp
});

const mapSwapRequestToDB = (req: SwapRequest) => ({
    id: req.id,
    requester_id: req.requesterId,
    requester_name: req.requesterName,
    target_instructor_id: req.targetInstructorId,
    target_instructor_name: req.targetInstructorName,
    class_id: req.classId,
    class_name: req.className,
    schedule_id: req.scheduleId,
    date: req.date,
    time: req.time,
    status: req.status,
    timestamp: req.timestamp
});

const mapFolderFromDB = (db: any): Folder => ({
    id: db.id,
    name: db.name,
    parentId: db.parent_id,
    allowedRoles: db.allowed_roles || [],
    createdBy: db.created_by,
    createdAt: db.created_at
});

const mapFolderToDB = (folder: Folder) => ({
    id: folder.id,
    name: folder.name,
    parent_id: folder.parentId || null,
    allowed_roles: folder.allowedRoles,
    created_by: folder.createdBy,
    created_at: folder.createdAt
});

const mapDocumentFromDB = (db: any): DocumentFile => ({
    id: db.id,
    folderId: db.folder_id,
    name: db.name,
    url: db.url,
    type: db.type,
    size: db.size,
    uploadedBy: db.uploaded_by,
    uploadedAt: db.uploaded_at
});

const mapDocumentToDB = (doc: DocumentFile) => ({
    id: doc.id,
    folder_id: doc.folderId,
    name: doc.name,
    url: doc.url,
    type: doc.type,
    size: doc.size,
    uploaded_by: doc.uploadedBy,
    uploaded_at: doc.uploadedAt
});



const mapNotificationFromDB = (db: any): Notification => ({
    id: db.id,
    userId: db.user_id,
    title: db.title,
    message: db.message,
    type: db.type,
    read: db.read,
    timestamp: db.timestamp,
    metadata: db.metadata
});

const mapNotificationToDB = (notif: Notification) => ({
    id: notif.id,
    user_id: notif.userId,
    title: notif.title,
    message: notif.message,
    type: notif.type,
    read: notif.read,
    timestamp: notif.timestamp,
    metadata: notif.metadata
});

export const StoreProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    // Data States
    const [users, setUsers] = useState<User[]>([]);
    const [courses, setCourses] = useState<Course[]>([]);
    const [classes, setClasses] = useState<ClassGroup[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [attendanceLogs, setAttendanceLogs] = useState<AttendanceLog[]>([]);
    const [gradeLogs, setGradeLogs] = useState<GradeLog[]>([]);
    const [payments, setPayments] = useState<PaymentRecord[]>([]);
    const [checklistTemplates, setChecklistTemplates] = useState<ChecklistTemplate[]>([]);
    const [checklistLogs, setChecklistLogs] = useState<ChecklistLog[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [swapRequests, setSwapRequests] = useState<SwapRequest[]>([]);
    const [setupTeardownAssignments, setSetupTeardownAssignments] = useState<SetupTeardownAssignment[]>([]);
    const [firefighters, setFirefighters] = useState<Firefighter[]>([]);
    const [firefighterLogs, setFirefighterLogs] = useState<FirefighterLog[]>([]);
    const [bases, setBases] = useState<Base[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [documents, setDocuments] = useState<DocumentFile[]>([]);
    const [questions, setQuestions] = useState<Question[]>([]);
    const [questionReviews, setQuestionReviews] = useState<QuestionReview[]>([]);
    const [questionApprovers, setQuestionApprovers] = useState<QuestionApprover[]>([]);

    // Initial Load
    useEffect(() => {
        fetchInitialData();
    }, []);

    const seedDatabase = async () => {
        console.log("🌱 Database seeding is disabled.");
    };

    const fetchInitialData = async () => {
        setLoading(true);

        // Check local storage for session
        const storedUser = localStorage.getItem('medgroup_user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        if (isSupabaseConfigured()) {
            console.log('✅ Supabase is configured!');
            console.log('URL:', (import.meta as any).env.VITE_SUPABASE_URL ? 'Set' : 'Not set');
            console.log('Key:', (import.meta as any).env.VITE_SUPABASE_ANON_KEY ? 'Set' : 'Not set');

            try {
                // Check if we need to seed (If users OR courses OR classes are missing)
                const { count: userCount } = await supabase.from('users').select('*', { count: 'exact', head: true });
                const { count: courseCount } = await supabase.from('courses').select('*', { count: 'exact', head: true });
                const { count: classCount } = await supabase.from('classes').select('*', { count: 'exact', head: true });

                // SEED DISABLED
                // if ((userCount === 0 || courseCount === 0 || classCount === 0)) {
                //    await seedDatabase();
                // }

                // Helper to safe fetch WITHOUT fallback to mock data (Exclusive Persistence)
                const safeFetch = async (table: string, setter: any, mapper?: (data: any) => any) => {
                    console.log(`📡 Fetching ${table}...`);

                    let allData: any[] = [];
                    let page = 0;
                    const pageSize = 1000;
                    let hasMore = true;

                    try {
                        while (hasMore) {
                            const from = page * pageSize;
                            const to = from + pageSize - 1;

                            const { data, error } = await supabase
                                .from(table)
                                .select('*')
                                .range(from, to);

                            if (error) {
                                console.error(`❌ Supabase Error fetching ${table} (page ${page}):`, error);
                                hasMore = false; // Stop on error
                            } else if (data) {
                                allData = [...allData, ...data];
                                if (data.length < pageSize) {
                                    hasMore = false; // Reached end
                                } else {
                                    page++;
                                }
                            } else {
                                hasMore = false;
                            }
                        }

                        if (allData.length > 0) {
                            console.log(`✅ Fetched ${table}:`, allData.length, 'records total');
                            setter(mapper ? allData.map(mapper) : allData);
                        } else {
                            console.warn(`⚠️ Fetched ${table} but data is empty`);
                            setter([]);
                        }
                    } catch (e) {
                        console.error(`❌ Exception fetching ${table}:`, e);
                        setter([]);
                    }
                };

                await Promise.all([
                    safeFetch('users', setUsers, mapUserFromDB),
                    safeFetch('courses', setCourses, mapCourseFromDB),
                    safeFetch('classes', setClasses, mapClassFromDB),
                    safeFetch('students', setStudents, mapStudentFromDB),
                    safeFetch('tasks', setTasks, mapTaskFromDB),
                    safeFetch('attendance_logs', setAttendanceLogs, mapAttendanceLogFromDB),
                    safeFetch('grade_logs', setGradeLogs, mapGradeLogFromDB),
                    safeFetch('payments', setPayments, mapPaymentFromDB),
                    safeFetch('checklist_templates', setChecklistTemplates, mapChecklistTemplateFromDB),
                    safeFetch('checklist_logs', setChecklistLogs, mapChecklistLogFromDB),
                    safeFetch('notifications', setNotifications, mapNotificationFromDB),
                    safeFetch('swap_requests', setSwapRequests, mapSwapRequestFromDB),
                    safeFetch('firefighters', setFirefighters, mapFirefighterFromDB),
                    safeFetch('firefighter_logs', setFirefighterLogs, mapFirefighterLogFromDB),
                    safeFetch('bases', setBases, mapBaseFromDB),
                    safeFetch('folders', setFolders, mapFolderFromDB),
                    safeFetch('documents', setDocuments, mapDocumentFromDB),
                    safeFetch('setup_teardown_assignments', setSetupTeardownAssignments, (db: any) => ({
                        id: db.id,
                        classId: db.class_id,
                        className: db.class_name,
                        type: db.type,
                        instructorId: db.instructor_id,
                        instructorName: db.instructor_name,
                        days: db.days,
                        rate: db.rate,
                        totalValue: db.total_value,
                        date: db.date,
                        notes: db.notes
                    })),
                ]);
            } catch (e) {
                console.error("Critical Supabase connection error:", e);
            }
        } else {
            console.warn("⚠️ Supabase not configured. App will be empty.");
            console.warn('VITE_SUPABASE_URL:', (import.meta as any).env.VITE_SUPABASE_URL || 'NOT SET');
            console.warn('VITE_SUPABASE_ANON_KEY:', (import.meta as any).env.VITE_SUPABASE_ANON_KEY ? 'SET' : 'NOT SET');
        }

        // ALWAYS set loading to false, regardless of Supabase config
        setLoading(false);
    };

    const login = async (email: string) => {
        try {
            setLoading(true);
            // 1. Check loaded users
            let user = users.find(u => u.email === email);

            // 2. If not found locally, try fetching specifically
            if (!user && isSupabaseConfigured()) {
                try {
                    const { data } = await supabase.from('users').select('*').eq('email', email).single();
                    if (data) {
                        user = data as User;
                        setUsers(prev => [...prev, user!]);
                    }
                } catch (fetchError) {
                    console.warn("Error fetching user from DB, attempting fallback:", fetchError);
                }
            }

            // 3. EMERGENCY FALLBACK: If Admin Login fails, FORCE CREATE ADMIN
            if (!user && email === 'admin@medgroup.com') {
                console.log("⚠️ Emergency Mode: Creating temporary Admin user");
                const rescueAdmin: User = {
                    id: 'admin-master',
                    name: 'Administrador Master',
                    cpf: '000.000.000-00',
                    role: UserRole.GESTOR,
                    email: 'admin@medgroup.com',
                    phone: '11999999999',
                    birthDate: '1980-01-01',
                    registrationDate: '2024-01-01',
                    createdBy: 'System',
                    uniformSize: { jumpsuit: 'G', shoes: '42', shirt: 'G' },
                    ppeSize: { pants: 'G', jacket: 'G', gloves: 'G', boots: '42' },
                    password: 'admin123'
                };

                user = rescueAdmin;
                setUsers(prev => [...prev, rescueAdmin]);

                // Try to save to DB so next time it works
                if (isSupabaseConfigured()) {
                    supabase.from('users').insert(rescueAdmin).then(({ error }) => {
                        if (error) console.error("Could not persist rescue admin:", error);
                        else console.log("Rescue admin persisted to DB.");
                    });
                }
            }

            if (user) {
                setCurrentUser(user);
                localStorage.setItem('medgroup_user', JSON.stringify(user));
            } else {
                throw new Error("Usuário não encontrado.");
            }
        } catch (e) {
            throw e;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        setCurrentUser(null);
        localStorage.removeItem('medgroup_user');
    };

    // --- Generic CRUD Wrappers ---

    const syncWithSupabase = async (table: string, action: 'INSERT' | 'UPDATE' | 'DELETE', data: any, id?: string) => {
        console.log('🔄 syncWithSupabase called:', { table, action, isConfigured: isSupabaseConfigured() });

        if (!isSupabaseConfigured()) {
            console.warn('⚠️ Supabase not configured - data will NOT persist!');
            return;
        }

        try {
            console.log(`📤 Attempting ${action} on table: ${table}`);
            console.log(`📦 Data being sent:`, JSON.stringify(data, null, 2));

            if (action === 'INSERT') {
                const { data: result, error } = await supabase.from(table).insert(data).select();
                if (error) {
                    console.error(`❌ INSERT Error:`, error);
                    throw error;
                }
                console.log(`✅ ${table} INSERT successful`, result);
            } else if (action === 'UPDATE') {
                const { data: result, error } = await supabase.from(table).update(data).eq('id', data.id).select();
                if (error) {
                    console.error(`❌ UPDATE Error:`, error);
                    throw error;
                }
                console.log(`✅ ${table} UPDATE successful`, result);
            } else if (action === 'DELETE' && id) {
                const { error } = await supabase.from(table).delete().eq('id', id);
                if (error) {
                    console.error(`❌ DELETE Error:`, error);
                    throw error;
                }
                console.log(`✅ ${table} DELETE successful`);
            }
        } catch (e: any) {
            console.error(`❌ Supabase Sync Error (${table}):`, e);
            console.error('Error message:', e.message);
            console.error('Error details:', e.details);
            console.error('Error hint:', e.hint);
            console.error('Error code:', e.code);
            console.error('Full error object:', JSON.stringify(e, null, 2));

            // Show user-friendly alert for debugging
            alert(`Erro ao salvar ${table}:\n${e.message}\n\nDetalhes: ${e.details || 'N/A'}\nDica: ${e.hint || 'N/A'}\n\nVerifique o console para mais informações.`);
        }
    };

    // --- Specific Actions ---

    const addUser = async (user: User) => {
        setUsers([...users, user]);
        await syncWithSupabase('users', 'INSERT', mapUserToDB(user));
    };

    const updateUser = async (user: User) => {
        setUsers(prev => prev.map(u => u.id === user.id ? user : u));
        if (currentUser?.id === user.id) {
            setCurrentUser(user);
            localStorage.setItem('medgroup_user', JSON.stringify(user));
        }
        await syncWithSupabase('users', 'UPDATE', mapUserToDB(user), user.id);
    };

    const deleteUser = async (id: string) => {
        setUsers(users.filter(u => u.id !== id));
        await syncWithSupabase('users', 'DELETE', null, id);
    };

    const mapCourseToDB = (course: Course) => {
        const mapped = {
            id: course.id,
            name: course.name,
            type: course.type,
            subjects: course.subjects
        };
        console.log('📊 mapCourseToDB - Input course:', course);
        console.log('📊 mapCourseToDB - Mapped data:', mapped);
        console.log('📊 mapCourseToDB - Subjects array:', JSON.stringify(course.subjects));
        return mapped;
    };

    const mapCourseFromDB = (db: any): Course => {
        console.log('📥 mapCourseFromDB - Raw DB data:', db);
        console.log('📥 mapCourseFromDB - DB subjects:', db.subjects);
        const mapped = {
            id: db.id,
            name: db.name,
            type: db.type,
            subjects: db.subjects || []
        };
        console.log('📥 mapCourseFromDB - Mapped course:', mapped);
        return mapped;
    };

    const addCourse = async (course: Course) => {
        setCourses([...courses, course]);
        await syncWithSupabase('courses', 'INSERT', mapCourseToDB(course));
    };

    const updateCourse = async (course: Course) => {
        setCourses(prev => prev.map(c => c.id === course.id ? course : c));
        await syncWithSupabase('courses', 'UPDATE', mapCourseToDB(course));
    };

    const deleteCourse = async (id: string) => {
        setCourses(courses.filter(c => c.id !== id));
        await syncWithSupabase('courses', 'DELETE', null, id);
    };

    const addClass = async (cls: ClassGroup) => {
        console.log('➕ addClass called with:', cls);
        setClasses([...classes, cls]);
        const dbData = mapClassToDB(cls);
        console.log('📦 addClass - Mapped DB data:', dbData);
        await syncWithSupabase('classes', 'INSERT', dbData);
    };

    const updateClass = async (cls: ClassGroup) => {
        setClasses(prev => prev.map(c => c.id === cls.id ? cls : c));
        const dbData = mapClassToDB(cls);
        await syncWithSupabase('classes', 'UPDATE', dbData);
    };

    const deleteClass = async (id: string) => {
        setClasses(classes.filter(c => c.id !== id));
        await syncWithSupabase('classes', 'DELETE', null, id);
    };

    const addStudent = async (student: Student) => {
        setStudents([...students, student]);
        await syncWithSupabase('students', 'INSERT', mapStudentToDB(student));
    };

    const updateStudent = async (student: Student) => {
        setStudents(prev => prev.map(s => s.id === student.id ? student : s));
        await syncWithSupabase('students', 'UPDATE', mapStudentToDB(student));
    };

    const deleteStudent = async (id: string) => {
        setStudents(students.filter(s => s.id !== id));
        await syncWithSupabase('students', 'DELETE', null, id);
    };

    const addTask = async (task: Task) => {
        // Initialize logs if empty
        if (!task.logs || task.logs.length === 0) {
            task.logs = [{
                id: Math.random().toString(36).substr(2, 9),
                timestamp: new Date().toISOString(),
                userId: currentUser?.id || 'system',
                userName: currentUser?.name || 'Sistema',
                action: 'created',
                details: 'Tarefa criada'
            }];
        }

        setTasks([...tasks, task]);
        await syncWithSupabase('tasks', 'INSERT', mapTaskToDB(task));

        // Notify Assignee
        if (task.assigneeId && task.assigneeId !== currentUser?.id) {
            const notif: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                userId: task.assigneeId,
                title: 'Nova Tarefa Atribuída',
                message: `Você recebeu uma nova tarefa: ${task.title}`,
                type: 'assignment',
                read: false,
                timestamp: new Date().toISOString(),
                metadata: { taskId: task.id }
            };
            setNotifications(prev => [notif, ...prev]);
            await syncWithSupabase('notifications', 'INSERT', mapNotificationToDB(notif));
        }
    };

    const updateTask = async (task: Task) => {
        const oldTask = tasks.find(t => t.id === task.id);
        setTasks(prev => prev.map(t => t.id === task.id ? task : t));
        await syncWithSupabase('tasks', 'UPDATE', mapTaskToDB(task));

        // Notify completion to creator
        if (oldTask && oldTask.status !== 'Concluída' && task.status === 'Concluída' && task.creatorId !== currentUser?.id) {
            const notif: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                userId: task.creatorId,
                title: 'Tarefa Concluída',
                message: `${currentUser?.name} concluiu a tarefa: ${task.title}`,
                type: 'info',
                read: false,
                timestamp: new Date().toISOString(),
                metadata: { taskId: task.id }
            };
            setNotifications(prev => [notif, ...prev]);
            await syncWithSupabase('notifications', 'INSERT', mapNotificationToDB(notif));
        }

        // Notify Request Finish
        if (oldTask && oldTask.status !== 'Aguardando Aprovação' && task.status === 'Aguardando Aprovação') {
            const notif: Notification = {
                id: Math.random().toString(36).substr(2, 9),
                userId: task.creatorId,
                title: 'Aprovação Necessária',
                message: `${currentUser?.name} solicitou conclusão da tarefa: ${task.title}`,
                type: 'info',
                read: false,
                timestamp: new Date().toISOString(),
                metadata: { taskId: task.id }
            };
            setNotifications(prev => [notif, ...prev]);
            await syncWithSupabase('notifications', 'INSERT', mapNotificationToDB(notif));
        }
    };

    const deleteTask = async (id: string) => {
        setTasks(tasks.filter(t => t.id !== id));
        await syncWithSupabase('tasks', 'DELETE', null, id);
    };

    const addAttendanceLog = async (log: AttendanceLog) => {
        setAttendanceLogs([...attendanceLogs, log]);
        await syncWithSupabase('attendance_logs', 'INSERT', mapAttendanceLogToDB(log));
    };

    const addGradeLog = async (log: GradeLog) => {
        setGradeLogs([...gradeLogs, log]);
        await syncWithSupabase('grade_logs', 'INSERT', mapGradeLogToDB(log));
    };

    const addPayment = async (payment: PaymentRecord) => {
        console.log('💳 Adding payment to state:', payment);
        // Use functional update to ensure we always work with latest state
        setPayments(prevPayments => {
            console.log('📊 Current payments count:', prevPayments.length);
            const newPayments = [...prevPayments, payment];
            console.log('📊 New payments count:', newPayments.length);
            return newPayments;
        });

        // Then try to sync with Supabase (if configured)
        try {
            await syncWithSupabase('payments', 'INSERT', mapPaymentToDB(payment));
        } catch (error) {
            console.warn('⚠️ Failed to sync payment with Supabase, but payment is saved locally:', error);
            // Don't throw - payment is already in state
        }
    };

    const deletePayment = async (id: string) => {
        setPayments(payments.filter(p => p.id !== id));
        await syncWithSupabase('payments', 'DELETE', null, id);
    };

    const addChecklistLog = async (log: ChecklistLog) => {
        setChecklistLogs([...checklistLogs, log]);
        await syncWithSupabase('checklist_logs', 'INSERT', mapChecklistLogToDB(log));
    };

    const updateChecklistTemplate = async (template: ChecklistTemplate) => {
        setChecklistTemplates(prev => prev.map(t => t.id === template.id ? template : t));
        await syncWithSupabase('checklist_templates', 'UPDATE', mapChecklistTemplateToDB(template));
    };

    const markNotificationAsRead = async (id: string) => {
        setNotifications(notifications.map(n => n.id === id ? { ...n, read: true } : n));
        if (isSupabaseConfigured()) {
            await supabase.from('notifications').update({ read: true }).eq('id', id);
        }
    };

    const requestSwap = async (request: Partial<SwapRequest>) => {
        if (!currentUser) return;
        const newReq: SwapRequest = {
            id: Math.random().toString(36).substr(2, 9),
            requesterId: currentUser.id,
            requesterName: currentUser.name,
            targetInstructorId: request.targetInstructorId!,
            targetInstructorName: request.targetInstructorName!,
            classId: request.classId!,
            className: request.className!,
            scheduleId: request.scheduleId!,
            date: request.date!,
            time: request.time!,
            status: 'Pendente',
            timestamp: new Date().toISOString()
        };

        setSwapRequests([...swapRequests, newReq]);
        await syncWithSupabase('swap_requests', 'INSERT', mapSwapRequestToDB(newReq));

        const notif: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            userId: newReq.targetInstructorId,
            title: 'Solicitação de Troca de Aula',
            message: `${currentUser.name} solicitou uma troca para a turma ${newReq.className} no dia ${new Date(newReq.date).toLocaleDateString()}.`,
            type: 'swap_request',
            read: false,
            timestamp: new Date().toISOString(),
            metadata: { swapRequestId: newReq.id }
        };
        setNotifications(prev => [notif, ...prev]);
        await syncWithSupabase('notifications', 'INSERT', mapNotificationToDB(notif));
    };

    const resolveSwapRequest = async (requestId: string, approved: boolean) => {
        const req = swapRequests.find(r => r.id === requestId);
        if (!req) return;

        const updatedReq = { ...req, status: approved ? 'Aceito' : 'Recusado' } as SwapRequest;
        setSwapRequests(swapRequests.map(r => r.id === requestId ? updatedReq : r));
        await syncWithSupabase('swap_requests', 'UPDATE', mapSwapRequestToDB(updatedReq));

        const notif: Notification = {
            id: Math.random().toString(36).substr(2, 9),
            userId: req.requesterId,
            title: `Troca de Aula ${approved ? 'Aceita' : 'Recusada'}`,
            message: `${currentUser?.name} ${approved ? 'aceitou' : 'recusou'} sua solicitação de troca.`,
            type: 'info',
            read: false,
            timestamp: new Date().toISOString()
        };
        setNotifications(prev => [notif, ...prev]);
        await syncWithSupabase('notifications', 'INSERT', mapNotificationToDB(notif));

        if (approved) {
            const cls = classes.find(c => c.id === req.classId);
            if (cls) {
                const updatedSchedule = cls.schedule.map(item => {
                    if (item.id === req.scheduleId) {
                        const newInstructors = item.instructorIds.filter(id => id !== req.requesterId);
                        newInstructors.push(req.targetInstructorId);
                        return { ...item, instructorIds: newInstructors };
                    }
                    return item;
                });
                updateClass({ ...cls, schedule: updatedSchedule });
            }
        }

        const relatedNotif = notifications.find(n => n.metadata?.swapRequestId === requestId);
        if (relatedNotif) markNotificationAsRead(relatedNotif.id);
    };

    const addFirefighter = async (ff: Firefighter) => {
        setFirefighters([...firefighters, ff]);
        await syncWithSupabase('firefighters', 'INSERT', mapFirefighterToDB(ff));
    };

    const updateFirefighter = async (ff: Firefighter) => {
        setFirefighters(prev => prev.map(f => f.id === ff.id ? ff : f));
        await syncWithSupabase('firefighters', 'UPDATE', mapFirefighterToDB(ff));
    };

    // Training Schedules State
    const [trainingSchedules, setTrainingSchedules] = useState<TrainingSchedule[]>([]);

    // Load Training Schedules
    const loadTrainingSchedules = async () => {
        try {
            const { data, error } = await supabase
                .from('training_schedules')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;

            if (data) {
                setTrainingSchedules(data.map(item => ({
                    id: item.id,
                    className: item.class_name,
                    origin: item.origin,
                    destination: item.destination,
                    medtruckDisplacementStart: item.medtruck_displacement_start,
                    medtruckDisplacementEnd: item.medtruck_displacement_end,
                    setupDate: item.setup_date,
                    teardownDate: item.teardown_date,
                    theoryStart: item.theory_start,
                    theoryEnd: item.theory_end,
                    theoryStudentCount: item.theory_student_count,
                    practiceStart: item.practice_start,
                    practiceEnd: item.practice_end,
                    practiceStudentCount: item.practice_student_count,
                    studentLocality: item.student_locality,
                    location: item.location,
                    studentBreakdown: item.student_breakdown || []
                })));
            }
        } catch (error) {
            console.error('Error loading training schedules:', error);
        }
    };

    const addTrainingSchedule = async (schedule: TrainingSchedule) => {
        const newSchedule = { ...schedule, id: crypto.randomUUID() };
        setTrainingSchedules(prev => [newSchedule, ...prev]);

        const dbRecord = {
            id: newSchedule.id,
            class_name: newSchedule.className,
            origin: newSchedule.origin,
            destination: newSchedule.destination,
            medtruck_displacement_start: newSchedule.medtruckDisplacementStart,
            medtruck_displacement_end: newSchedule.medtruckDisplacementEnd,
            setup_date: newSchedule.setupDate,
            teardown_date: newSchedule.teardownDate,
            theory_start: newSchedule.theoryStart,
            theory_end: newSchedule.theoryEnd,
            theory_student_count: newSchedule.theoryStudentCount,
            practice_start: newSchedule.practiceStart,
            practice_end: newSchedule.practiceEnd,
            practice_student_count: newSchedule.practiceStudentCount,
            student_locality: newSchedule.studentLocality,
            location: newSchedule.location,
            student_breakdown: newSchedule.studentBreakdown || []
        };

        await syncWithSupabase('training_schedules', 'INSERT', dbRecord);
    };

    const updateTrainingSchedule = async (id: string, updates: Partial<TrainingSchedule>) => {
        setTrainingSchedules(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));

        const schedule = trainingSchedules.find(s => s.id === id);
        if (!schedule) return;

        const updatedSchedule = { ...schedule, ...updates };

        const dbRecord = {
            class_name: updatedSchedule.className,
            origin: updatedSchedule.origin,
            destination: updatedSchedule.destination,
            medtruck_displacement_start: updatedSchedule.medtruckDisplacementStart,
            medtruck_displacement_end: updatedSchedule.medtruckDisplacementEnd,
            setup_date: updatedSchedule.setupDate,
            teardown_date: updatedSchedule.teardownDate,
            theory_start: updatedSchedule.theoryStart,
            theory_end: updatedSchedule.theoryEnd,
            theory_student_count: updatedSchedule.theoryStudentCount,
            practice_start: updatedSchedule.practiceStart,
            practice_end: updatedSchedule.practiceEnd,
            practice_student_count: updatedSchedule.practiceStudentCount,
            student_locality: updatedSchedule.studentLocality,
            location: updatedSchedule.location,
            student_breakdown: updatedSchedule.studentBreakdown || [],
            updated_at: new Date().toISOString()
        };

        await syncWithSupabase('training_schedules', 'UPDATE', dbRecord, id);
    };

    const deleteTrainingSchedule = async (id: string) => {
        setTrainingSchedules(prev => prev.filter(s => s.id !== id));
        await syncWithSupabase('training_schedules', 'DELETE', {}, id);
    };

    const deleteFirefighter = async (id: string) => {
        setFirefighters(firefighters.filter(f => f.id !== id));
        await syncWithSupabase('firefighters', 'DELETE', null, id);
    };

    const addFirefighterLog = async (log: FirefighterLog) => {
        setFirefighterLogs([...firefighterLogs, log]);
        await syncWithSupabase('firefighter_logs', 'INSERT', mapFirefighterLogToDB(log));
    };

    const addBase = async (base: Base) => {
        setBases([...bases, base]);
        await syncWithSupabase('bases', 'INSERT', mapBaseToDB(base));
    };

    const deleteBase = async (id: string) => {
        setBases(bases.filter(b => b.id !== id));
        await syncWithSupabase('bases', 'DELETE', null, id);
    };

    return (
        <StoreContext.Provider value={{
            currentUser, users, courses, classes, students, tasks, attendanceLogs, gradeLogs, payments, checklistTemplates, checklistLogs, notifications, swapRequests, firefighters, firefighterLogs, bases, folders, documents, setupTeardownAssignments, questions, questionReviews, questionApprovers,
            loading, login, logout,
            addUser, addCourse, updateCourse, deleteCourse, addClass, updateClass, deleteClass, addStudent, updateStudent, deleteStudent, addTask, updateTask, deleteTask,
            addAttendanceLog, addGradeLog, addPayment, deletePayment, addChecklistLog, updateChecklistTemplate,
            markNotificationAsRead, requestSwap, resolveSwapRequest,
            addFirefighter, updateFirefighter, deleteFirefighter, addFirefighterLog,
            addBase, deleteBase, updateUser, deleteUser,

            addFolder: async (folder: Folder) => {
                setFolders([...folders, folder]);
                await syncWithSupabase('folders', 'INSERT', mapFolderToDB(folder));
            },
            deleteFolder: async (id: string) => {
                setFolders(folders.filter(f => f.id !== id));
                await syncWithSupabase('folders', 'DELETE', null, id);
            },
            addDocument: async (doc: DocumentFile) => {
                setDocuments([...documents, doc]);
                await syncWithSupabase('documents', 'INSERT', mapDocumentToDB(doc));
            },
            deleteDocument: async (id: string) => {
                setDocuments(documents.filter(d => d.id !== id));
                await syncWithSupabase('documents', 'DELETE', null, id);
            },



            // Setup/Teardown
            addSetupTeardownAssignment: async (assignment: SetupTeardownAssignment) => {
                setSetupTeardownAssignments([...setupTeardownAssignments, assignment]);
                await syncWithSupabase('setup_teardown_assignments', 'INSERT', {
                    id: assignment.id,
                    class_id: assignment.classId,
                    class_name: assignment.className,
                    type: assignment.type,
                    instructor_id: assignment.instructorId,
                    instructor_name: assignment.instructorName,
                    days: assignment.days,
                    rate: assignment.rate,
                    total_value: assignment.totalValue,
                    date: assignment.date,
                    notes: assignment.notes
                });
            },
            updateSetupTeardownAssignment: async (assignment: SetupTeardownAssignment) => {
                setSetupTeardownAssignments(prev => prev.map(a => a.id === assignment.id ? assignment : a));
                await syncWithSupabase('setup_teardown_assignments', 'UPDATE', {
                    id: assignment.id,
                    class_id: assignment.classId,
                    class_name: assignment.className,
                    type: assignment.type,
                    instructor_id: assignment.instructorId,
                    instructor_name: assignment.instructorName,
                    days: assignment.days,
                    rate: assignment.rate,
                    total_value: assignment.totalValue,
                    date: assignment.date,
                    notes: assignment.notes
                });
            },
            deleteSetupTeardownAssignment: async (id: string) => {
                setSetupTeardownAssignments(setupTeardownAssignments.filter(a => a.id !== id));
                await syncWithSupabase('setup_teardown_assignments', 'DELETE', null, id);
            },

            // File Upload Functions
            uploadDocument: async (file: File, folderId: string | null) => {
                try {
                    // Validar tipo de arquivo
                    const allowedTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/jpg'];
                    if (!allowedTypes.includes(file.type)) {
                        throw new Error('Tipo de arquivo não permitido. Use PDF ou imagens.');
                    }

                    // Validar tamanho (50MB)
                    if (file.size > 50 * 1024 * 1024) {
                        throw new Error('Arquivo muito grande. Tamanho máximo: 50MB');
                    }

                    // Gerar nome único
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
                    const filePath = folderId ? `${folderId}/${fileName}` : fileName;

                    // Upload para Supabase
                    const { data, error } = await supabase.storage
                        .from('documents')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: false
                        });

                    if (error) throw error;

                    // Obter URL pública
                    const { data: { publicUrl } } = supabase.storage
                        .from('documents')
                        .getPublicUrl(filePath);

                    return publicUrl;
                } catch (error) {
                    console.error('Erro ao fazer upload:', error);
                    throw error;
                }
            },

            getSignedDocumentUrl: async (url: string) => {
                try {
                    if (!url) return null;
                    // Extract path from public URL
                    // URL format: .../storage/v1/object/public/documents/PATH
                    const parts = url.split('/documents/');
                    if (parts.length < 2) return url; // Not a Supabase storage URL or unexpected format

                    const filePath = parts[1]; // encoded path

                    // Create signed URL (valid for 1 hour)
                    const { data, error } = await supabase.storage
                        .from('documents')
                        .createSignedUrl(decodeURIComponent(filePath), 3600);

                    if (error) {
                        console.error('Error creating signed URL:', error);
                        return url; // Fallback to public URL
                    }

                    return data.signedUrl;
                } catch (error) {
                    console.error('Error in getSignedDocumentUrl:', error);
                    return url;
                }
            },

            uploadProfilePhoto: async (file: File, userId: string) => {
                try {
                    // Validar tipo de arquivo
                    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
                    if (!allowedTypes.includes(file.type)) {
                        throw new Error('Tipo de arquivo não permitido. Use JPEG, PNG ou WebP.');
                    }

                    // Validar tamanho (5MB)
                    if (file.size > 5 * 1024 * 1024) {
                        throw new Error('Imagem muito grande. Tamanho máximo: 5MB');
                    }

                    // Nome do arquivo baseado no userId
                    const fileExt = file.name.split('.').pop();
                    const fileName = `${userId}.${fileExt}`;
                    const filePath = `avatars/${fileName}`;

                    // Deletar foto antiga se existir
                    await supabase.storage
                        .from('profile-photos')
                        .remove([filePath])
                        .catch(() => { }); // Ignorar erro se não existir

                    // Upload para Supabase
                    const { data, error } = await supabase.storage
                        .from('profile-photos')
                        .upload(filePath, file, {
                            cacheControl: '3600',
                            upsert: true
                        });

                    if (error) throw error;

                    // Obter URL pública
                    const { data: { publicUrl } } = supabase.storage
                        .from('profile-photos')
                        .getPublicUrl(filePath);

                    return publicUrl;
                } catch (error) {
                    console.error('Erro ao fazer upload da foto:', error);
                    throw error;
                }
            },

            // Question Bank Functions
            addQuestion: async (question: Question) => {
                setQuestions([...questions, question]);
                // Sync with Supabase if configured
                if (isSupabaseConfigured()) {
                    await syncWithSupabase('questions', 'INSERT', {
                        id: question.id,
                        title: question.title,
                        subject: question.subject,
                        content: question.content,
                        option_a: question.optionA,
                        option_b: question.optionB,
                        option_c: question.optionC,
                        option_d: question.optionD,
                        correct_option: question.correctOption,
                        explanation: question.explanation,
                        created_by: question.createdBy,
                        created_by_name: question.createdByName,
                        created_at: question.createdAt,
                        status: question.status,
                        times_used: question.timesUsed
                    });
                }
            },

            updateQuestion: async (question: Question) => {
                setQuestions(questions.map(q => q.id === question.id ? question : q));
                if (isSupabaseConfigured()) {
                    await syncWithSupabase('questions', 'UPDATE', {
                        id: question.id,
                        title: question.title,
                        subject: question.subject,
                        content: question.content,
                        option_a: question.optionA,
                        option_b: question.optionB,
                        option_c: question.optionC,
                        option_d: question.optionD,
                        correct_option: question.correctOption,
                        explanation: question.explanation,
                        status: question.status,
                        reviewer_id: question.reviewerId,
                        reviewer_name: question.reviewerName,
                        reviewed_at: question.reviewedAt,
                        review_notes: question.reviewNotes,
                        times_used: question.timesUsed
                    });
                }
            },

            deleteQuestion: async (id: string) => {
                setQuestions(questions.filter(q => q.id !== id));
                await syncWithSupabase('questions', 'DELETE', null, id);
            },

            reviewQuestion: async (questionId: string, action: 'Aprovada' | 'Rejeitada' | 'Em Revisão', notes: string, reviewerId: string) => {
                const question = questions.find(q => q.id === questionId);
                if (!question) return;

                const reviewer = users.find(u => u.id === reviewerId);
                const updatedQuestion: Question = {
                    ...question,
                    status: action,
                    reviewerId,
                    reviewerName: reviewer?.name || '',
                    reviewedAt: new Date().toISOString(),
                    reviewNotes: notes
                };

                setQuestions(questions.map(q => q.id === questionId ? updatedQuestion : q));

                // Add review to history
                const review: QuestionReview = {
                    id: Math.random().toString(36).substr(2, 9),
                    questionId,
                    reviewerId,
                    reviewerName: reviewer?.name || '',
                    timestamp: new Date().toISOString(),
                    action: action === 'Em Revisão' ? 'Solicitou Revisão' : action,
                    notes
                };
                setQuestionReviews([...questionReviews, review]);

                if (isSupabaseConfigured()) {
                    await syncWithSupabase('questions', 'UPDATE', {
                        id: updatedQuestion.id,
                        status: updatedQuestion.status,
                        reviewer_id: updatedQuestion.reviewerId,
                        reviewer_name: updatedQuestion.reviewerName,
                        reviewed_at: updatedQuestion.reviewedAt,
                        review_notes: updatedQuestion.reviewNotes
                    });

                    await syncWithSupabase('question_reviews', 'INSERT', {
                        id: review.id,
                        question_id: review.questionId,
                        reviewer_id: review.reviewerId,
                        reviewer_name: review.reviewerName,
                        timestamp: review.timestamp,
                        action: review.action,
                        notes: review.notes
                    });
                }
            },

            addApprover: async (userId: string, userName: string, assignedBy: string) => {
                const approver: QuestionApprover = {
                    id: Math.random().toString(36).substr(2, 9),
                    userId,
                    userName,
                    assignedBy,
                    assignedByName: currentUser?.name || '',
                    assignedAt: new Date().toISOString(),
                    isActive: true
                };
                setQuestionApprovers([...questionApprovers, approver]);

                if (isSupabaseConfigured()) {
                    await syncWithSupabase('question_approvers', 'INSERT', {
                        id: approver.id,
                        user_id: approver.userId,
                        user_name: approver.userName,
                        assigned_by: approver.assignedBy,
                        assigned_by_name: approver.assignedByName,
                        assigned_at: approver.assignedAt,
                        is_active: approver.isActive
                    });
                }
            },

            removeApprover: async (approverId: string) => {
                setQuestionApprovers(questionApprovers.map(a =>
                    a.id === approverId ? { ...a, isActive: false } : a
                ));

                if (isSupabaseConfigured()) {
                    await supabase.from('question_approvers')
                        .update({ is_active: false })
                        .eq('id', approverId);
                }
            },

            deleteFile: async (bucket: string, path: string) => {
                try {
                    const { error } = await supabase.storage
                        .from(bucket)
                        .remove([path]);

                    if (error) throw error;
                } catch (error) {
                    console.error('Erro ao deletar arquivo:', error);
                    throw error;
                }
            },

            seedDatabase,

            trainingSchedules,
            addTrainingSchedule,
            updateTrainingSchedule,
            deleteTrainingSchedule
        }}>
            {children}
        </StoreContext.Provider >
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
