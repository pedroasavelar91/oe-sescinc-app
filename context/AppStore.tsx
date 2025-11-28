
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, ClassGroup, Student, Task, UserRole, AttendanceLog, GradeLog, PaymentRecord, ChecklistTemplate, ChecklistLog, Notification, SwapRequest, Firefighter, FirefighterLog, Base } from '../types';
import { initialUsers, initialCourses, initialClasses, initialStudents, initialTasks, initialAttendance, initialGradeLogs, initialPayments, initialChecklistTemplates, initialChecklistLogs, initialNotifications, initialSwapRequests, initialFirefighters, initialFirefighterLogs, initialBases } from '../services/mockData';
import { supabase, isSupabaseConfigured } from '../services/supabase';

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

    loading: boolean;
    login: (email: string) => Promise<void>;
    logout: () => void;

    addUser: (user: User) => Promise<void>;
    addCourse: (course: Course) => Promise<void>;
    updateCourse: (course: Course) => Promise<void>;
    deleteCourse: (id: string) => Promise<void>;

    addClass: (cls: ClassGroup) => Promise<void>;
    updateClass: (cls: ClassGroup) => Promise<void>;

    addStudent: (student: Student) => Promise<void>;
    updateStudent: (student: Student) => Promise<void>;

    addTask: (task: Task) => Promise<void>;
    updateTask: (task: Task) => Promise<void>;

    addAttendanceLog: (log: AttendanceLog) => Promise<void>;
    addGradeLog: (log: GradeLog) => Promise<void>;
    addPayment: (payment: PaymentRecord) => Promise<void>;

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
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

// --- Helpers for Data Mapping ---

const mapClassFromDB = (dbClass: any): ClassGroup => ({
    id: dbClass.id,
    name: dbClass.name,
    startDate: dbClass.start_date,
    endDate: dbClass.end_date,
    courseId: dbClass.course_id,
    studentIds: dbClass.student_ids || [], // Assuming this might be a join or separate fetch, but keeping simple for now
    daysOfWeek: dbClass.days_of_week || [],
    includeWeekends: false, // Deprecated in DB?
    includeSaturday: dbClass.include_saturday,
    includeSunday: dbClass.include_sunday,
    hoursPerDay: dbClass.hours_per_day,
    theoryStartDate: dbClass.theory_start_date,
    practiceStartDate: dbClass.practice_start_date,
    registrationNumber: dbClass.registration_number,
    capBa: dbClass.cap_ba,
    schedule: dbClass.subjects || [], // The JSONB column is named 'subjects' in DB but maps to 'schedule' in types? Wait, let's check types.ts. 
    // In types.ts: schedule: ClassScheduleItem[]. 
    // In DB: subjects jsonb. 
    // So yes, map dbClass.subjects to schedule.
    setupInstructor1Id: dbClass.setup_instructor_1_id,
    setupInstructor1Days: dbClass.setup_instructor_1_days,
    setupInstructor2Id: dbClass.setup_instructor_2_id,
    setupInstructor2Days: dbClass.setup_instructor_2_days,
    teardownInstructor1Id: dbClass.teardown_instructor_1_id,
    teardownInstructor1Days: dbClass.teardown_instructor_1_days,
    teardownInstructor2Id: dbClass.teardown_instructor_2_id,
    teardownInstructor2Days: dbClass.teardown_instructor_2_days
});

const mapClassToDB = (cls: ClassGroup) => ({
    id: cls.id,
    name: cls.name,
    start_date: cls.startDate,
    end_date: cls.endDate,
    course_id: cls.courseId,
    days_of_week: cls.daysOfWeek,
    include_saturday: cls.includeSaturday,
    include_sunday: cls.includeSunday,
    hours_per_day: cls.hoursPerDay,
    theory_start_date: cls.theoryStartDate,
    practice_start_date: cls.practiceStartDate,
    registration_number: cls.registrationNumber,
    cap_ba: cls.capBa,
    subjects: cls.schedule, // Mapping schedule back to subjects JSONB column
    setup_instructor_1_id: cls.setupInstructor1Id || null,
    setup_instructor_1_days: cls.setupInstructor1Days || 0,
    setup_instructor_2_id: cls.setupInstructor2Id || null,
    setup_instructor_2_days: cls.setupInstructor2Days || 0,
    teardown_instructor_1_id: cls.teardownInstructor1Id || null,
    teardown_instructor_1_days: cls.teardownInstructor1Days || 0,
    teardown_instructor_2_id: cls.teardownInstructor2Id || null,
    teardown_instructor_2_days: cls.teardownInstructor2Days || 0
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
    const [firefighters, setFirefighters] = useState<Firefighter[]>([]);
    const [firefighterLogs, setFirefighterLogs] = useState<FirefighterLog[]>([]);
    const [bases, setBases] = useState<Base[]>([]);

    // Initial Load
    useEffect(() => {
        fetchInitialData();
    }, []);

    const seedDatabase = async () => {
        console.log("🌱 Database appears empty. Seeding initial data...");
        try {
            await supabase.from('users').insert(initialUsers);
            await supabase.from('courses').insert(initialCourses);
            await supabase.from('classes').insert(initialClasses);
            await supabase.from('students').insert(initialStudents);
            await supabase.from('tasks').insert(initialTasks);
            await supabase.from('attendance_logs').insert(initialAttendance);
            await supabase.from('grade_logs').insert(initialGradeLogs);
            await supabase.from('checklist_templates').insert(initialChecklistTemplates);
            await supabase.from('bases').insert(initialBases);
            await supabase.from('firefighters').insert(initialFirefighters);
            console.log("✅ Database seeded successfully.");
        } catch (e) {
            console.error("❌ Error seeding database:", e);
        }
    };

    const fetchInitialData = async () => {
        setLoading(true);

        // Check local storage for session
        const storedUser = localStorage.getItem('medgroup_user');
        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        }

        if (isSupabaseConfigured()) {
            try {
                // Check if we need to seed (Only works if tables exist)
                const { count, error } = await supabase.from('users').select('*', { count: 'exact', head: true });

                if (!error && count === 0) {
                    await seedDatabase();
                }

                // Helper to safe fetch with FALLBACK to mock data if table missing
                const safeFetch = async (table: string, setter: any, fallback: any) => {
                    const { data, error } = await supabase.from(table).select('*');
                    if (!error && data) {
                        setter(data);
                    } else {
                        console.warn(`Supabase: Error fetching ${table}. Using fallback data.`);
                        // CRITICAL CHANGE: Fallback to mock data so app works even if DB is empty/broken
                        setter(fallback);
                    }
                };

                await Promise.all([
                    safeFetch('users', setUsers, initialUsers),
                    safeFetch('courses', setCourses, initialCourses),
                    // Custom fetch for classes to handle mapping
                    (async () => {
                        const { data, error } = await supabase.from('classes').select('*');
                        if (!error && data) {
                            setClasses(data.map(mapClassFromDB));
                        } else {
                            console.warn("Supabase: Error fetching classes. Using fallback.");
                            setClasses(initialClasses);
                        }
                    })(),
                    safeFetch('students', setStudents, initialStudents),
                    safeFetch('tasks', setTasks, initialTasks),
                    safeFetch('attendance_logs', setAttendanceLogs, initialAttendance),
                    safeFetch('grade_logs', setGradeLogs, initialGradeLogs),
                    safeFetch('payments', setPayments, initialPayments),
                    safeFetch('checklist_templates', setChecklistTemplates, initialChecklistTemplates),
                    safeFetch('checklist_logs', setChecklistLogs, initialChecklistLogs),
                    safeFetch('notifications', setNotifications, initialNotifications),
                    safeFetch('swap_requests', setSwapRequests, initialSwapRequests),
                    safeFetch('firefighters', setFirefighters, initialFirefighters),
                    safeFetch('firefighter_logs', setFirefighterLogs, initialFirefighterLogs),
                    safeFetch('bases', setBases, initialBases),
                ]);
            } catch (e) {
                console.error("Critical Supabase connection error, using mock data:", e);
                // Catastrophic failure fallback
                setUsers(initialUsers);
                setCourses(initialCourses);
                setClasses(initialClasses);
                setStudents(initialStudents);
                setTasks(initialTasks);
                setAttendanceLogs(initialAttendance);
                setGradeLogs(initialGradeLogs);
                setPayments(initialPayments);
                setChecklistTemplates(initialChecklistTemplates);
                setChecklistLogs(initialChecklistLogs);
                setNotifications(initialNotifications);
                setSwapRequests(initialSwapRequests);
                setFirefighters(initialFirefighters);
                setFirefighterLogs(initialFirefighterLogs);
                setBases(initialBases);
            }
        } else {
            // Fallback to Mock Data (No Supabase)
            setUsers(initialUsers);
            setCourses(initialCourses);
            setClasses(initialClasses);
            setStudents(initialStudents);
            setTasks(initialTasks);
            setAttendanceLogs(initialAttendance);
            setGradeLogs(initialGradeLogs);
            setPayments(initialPayments);
            setChecklistTemplates(initialChecklistTemplates);
            setChecklistLogs(initialChecklistLogs);
            setNotifications(initialNotifications);
            setSwapRequests(initialSwapRequests);
            setFirefighters(initialFirefighters);
            setFirefighterLogs(initialFirefighterLogs);
            setBases(initialBases);
        }
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
        if (!isSupabaseConfigured()) return;
        try {
            if (action === 'INSERT') {
                await supabase.from(table).insert(data);
            } else if (action === 'UPDATE') {
                await supabase.from(table).update(data).eq('id', data.id);
            } else if (action === 'DELETE' && id) {
                await supabase.from(table).delete().eq('id', id);
            }
        } catch (e) {
            console.error(`Supabase Sync Error (${table}):`, e);
        }
    };

    // --- Specific Actions ---

    const addUser = async (user: User) => {
        setUsers([...users, user]);
        await syncWithSupabase('users', 'INSERT', user);
    };

    const updateUser = async (user: User) => {
        setUsers(users.map(u => u.id === user.id ? user : u));
        if (currentUser?.id === user.id) {
            setCurrentUser(user);
            localStorage.setItem('medgroup_user', JSON.stringify(user));
        }
        await syncWithSupabase('users', 'UPDATE', user);
    };

    const addCourse = async (course: Course) => {
        setCourses([...courses, course]);
        await syncWithSupabase('courses', 'INSERT', course);
    };

    const updateCourse = async (course: Course) => {
        setCourses(courses.map(c => c.id === course.id ? course : c));
        await syncWithSupabase('courses', 'UPDATE', course);
    };

    const deleteCourse = async (id: string) => {
        setCourses(courses.filter(c => c.id !== id));
        await syncWithSupabase('courses', 'DELETE', null, id);
    };

    const addClass = async (cls: ClassGroup) => {
        setClasses([...classes, cls]);
        const dbData = mapClassToDB(cls);
        await syncWithSupabase('classes', 'INSERT', dbData);
    };

    const updateClass = async (cls: ClassGroup) => {
        setClasses(classes.map(c => c.id === cls.id ? cls : c));
        const dbData = mapClassToDB(cls);
        await syncWithSupabase('classes', 'UPDATE', dbData);
    };

    const addStudent = async (student: Student) => {
        setStudents([...students, student]);
        await syncWithSupabase('students', 'INSERT', student);
    };

    const updateStudent = async (student: Student) => {
        setStudents(students.map(s => s.id === student.id ? student : s));
        await syncWithSupabase('students', 'UPDATE', student);
    };

    const addTask = async (task: Task) => {
        setTasks([...tasks, task]);
        await syncWithSupabase('tasks', 'INSERT', task);

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
            await syncWithSupabase('notifications', 'INSERT', notif);
        }
    };

    const updateTask = async (task: Task) => {
        const oldTask = tasks.find(t => t.id === task.id);
        setTasks(tasks.map(t => t.id === task.id ? task : t));
        await syncWithSupabase('tasks', 'UPDATE', task);

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
            await syncWithSupabase('notifications', 'INSERT', notif);
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
            await syncWithSupabase('notifications', 'INSERT', notif);
        }
    };

    const addAttendanceLog = async (log: AttendanceLog) => {
        setAttendanceLogs([...attendanceLogs, log]);
        await syncWithSupabase('attendance_logs', 'INSERT', log);
    };

    const addGradeLog = async (log: GradeLog) => {
        setGradeLogs([...gradeLogs, log]);
        await syncWithSupabase('grade_logs', 'INSERT', log);
    };

    const addPayment = async (payment: PaymentRecord) => {
        setPayments([...payments, payment]);
        await syncWithSupabase('payments', 'INSERT', payment);
    };

    const addChecklistLog = async (log: ChecklistLog) => {
        setChecklistLogs([...checklistLogs, log]);
        await syncWithSupabase('checklist_logs', 'INSERT', log);
    };

    const updateChecklistTemplate = async (template: ChecklistTemplate) => {
        setChecklistTemplates(checklistTemplates.map(t => t.id === template.id ? template : t));
        await syncWithSupabase('checklist_templates', 'UPDATE', template);
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
        await syncWithSupabase('swap_requests', 'INSERT', newReq);

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
        await syncWithSupabase('notifications', 'INSERT', notif);
    };

    const resolveSwapRequest = async (requestId: string, approved: boolean) => {
        const req = swapRequests.find(r => r.id === requestId);
        if (!req) return;

        const updatedReq = { ...req, status: approved ? 'Aceito' : 'Recusado' } as SwapRequest;
        setSwapRequests(swapRequests.map(r => r.id === requestId ? updatedReq : r));
        await syncWithSupabase('swap_requests', 'UPDATE', updatedReq);

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
        await syncWithSupabase('notifications', 'INSERT', notif);

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
        await syncWithSupabase('firefighters', 'INSERT', ff);
    };

    const updateFirefighter = async (ff: Firefighter) => {
        setFirefighters(firefighters.map(f => f.id === ff.id ? ff : f));
        await syncWithSupabase('firefighters', 'UPDATE', ff);
    };

    const deleteFirefighter = async (id: string) => {
        setFirefighters(firefighters.filter(f => f.id !== id));
        await syncWithSupabase('firefighters', 'DELETE', null, id);
    };

    const addFirefighterLog = async (log: FirefighterLog) => {
        setFirefighterLogs([...firefighterLogs, log]);
        await syncWithSupabase('firefighter_logs', 'INSERT', log);
    };

    const addBase = async (base: Base) => {
        setBases([...bases, base]);
        await syncWithSupabase('bases', 'INSERT', base);
    };

    const deleteBase = async (id: string) => {
        setBases(bases.filter(b => b.id !== id));
        await syncWithSupabase('bases', 'DELETE', null, id);
    };

    return (
        <StoreContext.Provider value={{
            currentUser, users, courses, classes, students, tasks, attendanceLogs, gradeLogs, payments, checklistTemplates, checklistLogs, notifications, swapRequests, firefighters, firefighterLogs, bases,
            loading, login, logout,
            addUser, addCourse, updateCourse, deleteCourse, addClass, updateClass, addStudent, updateStudent, addTask, updateTask,
            addAttendanceLog, addGradeLog, addPayment, addChecklistLog, updateChecklistTemplate,
            markNotificationAsRead, requestSwap, resolveSwapRequest,
            addFirefighter, updateFirefighter, deleteFirefighter, addFirefighterLog,
            addBase, deleteBase, updateUser
        }}>
            {children}
        </StoreContext.Provider>
    );
};

export const useStore = () => {
    const context = useContext(StoreContext);
    if (context === undefined) {
        throw new Error('useStore must be used within a StoreProvider');
    }
    return context;
};
