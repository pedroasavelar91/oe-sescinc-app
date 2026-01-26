import { ClassGroup, ClassScheduleItem } from '../types';

export const findDuplicates = (classes: ClassGroup[]): string[] => {
    const report: string[] = [];

    classes.forEach(cls => {
        const seen = new Set<string>();
        let duplicatesCount = 0;

        cls.schedule.forEach(item => {
            // Define unique key: Date + StartTime + SubjectId
            // Using SubjectId is safer than name, but name works if id is consistent.
            // Including startTime to differentiate same day classes.
            const key = `${item.date}|${item.startTime}|${item.subjectId}`;

            if (seen.has(key)) {
                duplicatesCount++;
            } else {
                seen.add(key);
            }
        });

        if (duplicatesCount > 0) {
            report.push(`Turma: ${cls.name} (${duplicatesCount} duplicatas)`);
        }
    });

    return report;
};

export const fixDuplicates = async (
    classes: ClassGroup[],
    updateClass: (cls: ClassGroup) => Promise<void>
): Promise<string> => {
    let fixedCount = 0;

    for (const cls of classes) {
        const seen = new Set<string>();
        const uniqueSchedule: ClassScheduleItem[] = [];
        let hasChanges = false;

        for (const item of cls.schedule) {
            const key = `${item.date}|${item.startTime}|${item.subjectId}`;

            if (seen.has(key)) {
                hasChanges = true;
                // Skip (remove) duplicate
            } else {
                seen.add(key);
                uniqueSchedule.push(item);
            }
        }

        if (hasChanges) {
            try {
                await updateClass({
                    ...cls,
                    schedule: uniqueSchedule
                });
                fixedCount++;
            } catch (error) {
                console.error(`Erro ao atualizar turma ${cls.name}:`, error);
                throw error;
            }
        }
    }

    return `Correção aplicada em ${fixedCount} turmas.`;
};
