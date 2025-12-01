# Guia de Integração Manual dos Mapeadores - AppStore.tsx

## ⚠️ Importante
Devido a problemas técnicos com edição automática, siga estas instruções manualmente para integrar os mapeadores de dados.

## Passo 1: Adicionar Import

**Localização:** Linha 5 do arquivo `context/AppStore.tsx`

**Ação:** Adicione esta linha APÓS a linha que importa `supabase`:

```typescript
import { mapStudentFromDB, mapStudentToDB, mapTaskFromDB, mapTaskToDB, mapAttendanceLogFromDB, mapAttendanceLogToDB, mapGradeLogFromDB, mapGradeLogToDB, mapPaymentFromDB, mapPaymentToDB, mapChecklistTemplateFromDB, mapChecklistTemplateToDB, mapChecklistLogFromDB, mapChecklistLogToDB, mapFirefighterFromDB, mapFirefighterToDB, mapFirefighterLogFromDB, mapFirefighterLogToDB } from '../services/dataMappers';
```

**Resultado esperado (linhas 1-7):**
```typescript

import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Course, ClassGroup, Student, Task, UserRole, AttendanceLog, GradeLog, PaymentRecord, ChecklistTemplate, ChecklistLog, Notification, SwapRequest, Firefighter, FirefighterLog, Base, Folder, DocumentFile, SetupTeardownAssignment } from '../types';
import { initialUsers, initialCourses, initialClasses, initialStudents, initialTasks, initialAttendance, initialGradeLogs, initialPayments, initialChecklistTemplates, initialChecklistLogs, initialNotifications, initialSwapRequests, initialFirefighters, initialFirefighterLogs, initialBases } from '../services/mockData';
import { supabase, isSupabaseConfigured } from '../services/supabase';
import { mapStudentFromDB, mapStudentToDB, mapTaskFromDB, mapTaskToDB, mapAttendanceLogFromDB, mapAttendanceLogToDB, mapGradeLogFromDB, mapGradeLogToDB, mapPaymentFromDB, mapPaymentToDB, mapChecklistTemplateFromDB, mapChecklistTemplateToDB, mapChecklistLogFromDB, mapChecklistLogToDB, mapFirefighterFromDB, mapFirefighterToDB, mapFirefighterLogFromDB, mapFirefighterLogToDB } from '../services/dataMappers';

interface StoreContextType {
```

---

## Passo 2: Atualizar safeFetch Calls

**Localização:** Aproximadamente linhas 310-350 (dentro da função `fetchInitialData`)

**Ação:** Encontre o bloco `await Promise.all([...])` e atualize as seguintes linhas:

### Antes:
```typescript
safeFetch('students', setStudents),
safeFetch('tasks', setTasks),
safeFetch('attendance_logs', setAttendanceLogs),
safeFetch('grade_logs', setGradeLogs),
safeFetch('payments', setPayments),
safeFetch('checklist_templates', setChecklistTemplates),
safeFetch('checklist_logs', setChecklistLogs),
safeFetch('firefighters', setFirefighters),
safeFetch('firefighter_logs', setFirefighterLogs),
```

### Depois:
```typescript
safeFetch('students', setStudents, mapStudentFromDB),
safeFetch('tasks', setTasks, mapTaskFromDB),
safeFetch('attendance_logs', setAttendanceLogs, mapAttendanceLogFromDB),
safeFetch('grade_logs', setGradeLogs, mapGradeLogFromDB),
safeFetch('payments', setPayments, mapPaymentFromDB),
safeFetch('checklist_templates', setChecklistTemplates, mapChecklistTemplateFromDB),
safeFetch('checklist_logs', setChecklistLogs, mapChecklistLogFromDB),
safeFetch('firefighters', setFirefighters, mapFirefighterFromDB),
safeFetch('firefighter_logs', setFirefighterLogs, mapFirefighterLogFromDB),
```

---

## Passo 3: Atualizar Funções add/update

### 3.1 Students

**Localização:** Aproximadamente linhas 490-500

```typescript
const addStudent = async (student: Student) => {
    setStudents([...students, student]);
    await syncWithSupabase('students', 'INSERT', mapStudentToDB(student));
};

const updateStudent = async (student: Student) => {
    setStudents(students.map(s => s.id === student.id ? student : s));
    await syncWithSupabase('students', 'UPDATE', mapStudentToDB(student));
};
```

### 3.2 Tasks

**Localização:** Aproximadamente linhas 500-520

```typescript
const addTask = async (task: Task) => {
    setTasks([...tasks, task]);
    await syncWithSupabase('tasks', 'INSERT', mapTaskToDB(task));
    // ... resto do código de notificação
};

const updateTask = async (task: Task) => {
    const oldTask = tasks.find(t => t.id === task.id);
    setTasks(tasks.map(t => t.id === task.id ? task : t));
    await syncWithSupabase('tasks', 'UPDATE', mapTaskToDB(task));
    // ... resto do código de notificação
};
```

### 3.3 AttendanceLogs

**Localização:** Aproximadamente linha 560

```typescript
const addAttendanceLog = async (log: AttendanceLog) => {
    setAttendanceLogs([...attendanceLogs, log]);
    await syncWithSupabase('attendance_logs', 'INSERT', mapAttendanceLogToDB(log));
};
```

### 3.4 GradeLogs

**Localização:** Aproximadamente linha 565

```typescript
const addGradeLog = async (log: GradeLog) => {
    setGradeLogs([...gradeLogs, log]);
    await syncWithSupabase('grade_logs', 'INSERT', mapGradeLogToDB(log));
};
```

### 3.5 Payments

**Localização:** Aproximadamente linha 570

```typescript
const addPayment = async (payment: PaymentRecord) => {
    setPayments([...payments, payment]);
    await syncWithSupabase('payments', 'INSERT', mapPaymentToDB(payment));
};
```

### 3.6 ChecklistLogs

**Localização:** Aproximadamente linha 575

```typescript
const addChecklistLog = async (log: ChecklistLog) => {
    setChecklistLogs([...checklistLogs, log]);
    await syncWithSupabase('checklist_logs', 'INSERT', mapChecklistLogToDB(log));
};
```

### 3.7 ChecklistTemplates

**Localização:** Aproximadamente linha 580

```typescript
const updateChecklistTemplate = async (template: ChecklistTemplate) => {
    setChecklistTemplates(checklistTemplates.map(t => t.id === template.id ? template : t));
    await syncWithSupabase('checklist_templates', 'UPDATE', mapChecklistTemplateToDB(template));
};
```

### 3.8 Firefighters

**Localização:** Aproximadamente linhas 665-680

```typescript
const addFirefighter = async (ff: Firefighter) => {
    setFirefighters([...firefighters, ff]);
    await syncWithSupabase('firefighters', 'INSERT', mapFirefighterToDB(ff));
};

const updateFirefighter = async (ff: Firefighter) => {
    setFirefighters(firefighters.map(f => f.id === ff.id ? ff : f));
    await syncWithSupabase('firefighters', 'UPDATE', mapFirefighterToDB(ff));
};
```

### 3.9 FirefighterLogs

**Localização:** Aproximadamente linha 680

```typescript
const addFirefighterLog = async (log: FirefighterLog) => {
    setFirefighterLogs([...firefighterLogs, log]);
    await syncWithSupabase('firefighter_logs', 'INSERT', mapFirefighterLogToDB(log));
};
```

---

## ✅ Verificação

Após fazer todas as alterações:

1. **Salve o arquivo**
2. **Verifique se não há erros de sintaxe** no editor
3. **Execute o script SQL** no Supabase (se ainda não fez)
4. **Teste a aplicação**:
   - Crie um novo estudante
   - Crie uma nova tarefa
   - Adicione um bombeiro
   - Recarregue a página
   - Verifique se os dados persistiram

## 📝 Resumo das Mudanças

- **1 import adicionado** (linha 6)
- **9 chamadas safeFetch atualizadas** (linhas ~310-350)
- **13 funções add/update modificadas** (várias localizações)

**Total:** Aproximadamente 23 alterações no arquivo
