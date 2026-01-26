import React, { useMemo } from 'react';
import { TrainingSchedule } from '../types';
import { formatDate } from '../utils/dateUtils';
import { Course } from '../types';

interface GanttChartProps {
    schedules: TrainingSchedule[];
    courses: Course[];
    onEdit: (schedule: TrainingSchedule) => void;
}

export const GanttChart: React.FC<GanttChartProps> = ({ schedules, courses, onEdit }) => {
    // Determine date range
    const dates = useMemo(() => {
        if (schedules.length === 0) return [];

        let minDate = new Date();
        let maxDate = new Date();

        // Find earliest start and latest end
        schedules.forEach(s => {
            const starts = [s.medtruckDisplacementStart, s.setupDate, s.theoryStart, s.practiceStart].filter(Boolean).map(d => new Date(d));
            const ends = [s.medtruckDisplacementEnd, s.teardownDate, s.theoryEnd, s.practiceEnd].filter(Boolean).map(d => new Date(d));

            starts.forEach(d => { if (d < minDate) minDate = d; });
            ends.forEach(d => { if (d > maxDate) maxDate = d; });
        });

        // Add some buffer
        minDate.setDate(minDate.getDate() - 2);
        maxDate.setDate(maxDate.getDate() + 5);

        const dateArray = [];
        const currentDate = new Date(minDate);
        while (currentDate <= maxDate) {
            dateArray.push(new Date(currentDate));
            currentDate.setDate(currentDate.getDate() + 1);
        }
        return dateArray;
    }, [schedules]);

    if (schedules.length === 0) {
        return (
            <div className="text-center py-10 text-gray-500 uppercase">
                NENHUM DADO PARA EXIBIR NO GRÁFICO
            </div>
        );
    }

    const getPosition = (dateStr: string) => {
        if (!dateStr) return -1;
        const date = new Date(dateStr);
        const index = dates.findIndex(d => d.getDate() === date.getDate() && d.getMonth() === date.getMonth() && d.getFullYear() === date.getFullYear());
        return index;
    };

    const getDuration = (startStr: string, endStr: string) => {
        const start = getPosition(startStr);
        const end = getPosition(endStr);
        if (start === -1 || end === -1) return 0;
        return Math.max(1, end - start + 1);
    };

    const COL_WIDTH = 40; // px per day

    return (
        <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm bg-white">
            <div style={{ width: dates.length * COL_WIDTH }} className="min-w-full">
                {/* Header */}
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <div className="w-64 flex-shrink-0 p-3 font-bold text-gray-700 bg-gray-50 sticky left-0 z-10 border-r border-gray-200">
                        TURMA
                    </div>
                    {dates.map((date, i) => (
                        <div key={i} className="flex-shrink-0 text-center border-r border-gray-100 py-2" style={{ width: COL_WIDTH }}>
                            <div className="text-[10px] text-gray-500 font-bold uppercase">{date.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}</div>
                            <div className="text-sm font-bold text-gray-800">{date.toLocaleDateString('pt-BR', { day: '2-digit' })}</div>
                        </div>
                    ))}
                </div>

                {/* Rows */}
                {schedules.map((schedule) => (
                    <div key={schedule.id} className="flex border-b border-gray-100 hover:bg-gray-50 transition-colors group relative">
                        <div className="w-64 flex-shrink-0 p-3 bg-white sticky left-0 z-10 border-r border-gray-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.1)]">
                            <div className="font-bold text-gray-900 text-sm uppercase truncate cursor-pointer hover:text-blue-600" onClick={() => onEdit(schedule)}>
                                {schedule.className}
                            </div>
                            <div className="text-[10px] text-gray-500 uppercase truncate">
                                {courses.find(c => c.id === schedule.courseId)?.name || 'N/A'}
                            </div>
                            <div className="text-[10px] text-gray-400 mt-1 uppercase flex gap-1">
                                <span className="font-bold">LOC:</span> {schedule.location}
                            </div>
                        </div>

                        <div className="relative flex-grow h-16 py-2">
                            {/* Background Grid */}
                            <div className="absolute inset-0 flex pointer-events-none">
                                {dates.map((_, i) => (
                                    <div key={i} className="border-r border-gray-100 h-full" style={{ width: COL_WIDTH }}></div>
                                ))}
                            </div>

                            {/* Bars */}
                            {/* Deslocamento */}
                            <div
                                className="absolute h-2 bg-blue-400 rounded-full top-3 opacity-80 hover:opacity-100 hover:z-20 transition-all cursor-pointer shadow-sm"
                                style={{
                                    left: getPosition(schedule.medtruckDisplacementStart) * COL_WIDTH + 2,
                                    width: (getDuration(schedule.medtruckDisplacementStart, schedule.medtruckDisplacementEnd) * COL_WIDTH) - 4
                                }}
                                title={`DESLOCAMENTO: ${formatDate(schedule.medtruckDisplacementStart)} - ${formatDate(schedule.medtruckDisplacementEnd)}`}
                            />

                            {/* Montagem */}
                            <div
                                className="absolute h-2 bg-orange-400 rounded-full top-6 opacity-80 hover:opacity-100 hover:z-20 transition-all cursor-pointer shadow-sm"
                                style={{
                                    left: getPosition(schedule.setupDate) * COL_WIDTH + 2,
                                    width: COL_WIDTH - 4
                                }}
                                title={`MONTAGEM: ${formatDate(schedule.setupDate)}`}
                            />
                            {/* Desmontagem */}
                            <div
                                className="absolute h-2 bg-orange-400 rounded-full top-6 opacity-80 hover:opacity-100 hover:z-20 transition-all cursor-pointer shadow-sm"
                                style={{
                                    left: getPosition(schedule.teardownDate) * COL_WIDTH + 2,
                                    width: COL_WIDTH - 4
                                }}
                                title={`DESMONTAGEM: ${formatDate(schedule.teardownDate)}`}
                            />

                            {/* Teórico */}
                            <div
                                className="absolute h-3 bg-purple-500 rounded-md top-9 opacity-90 hover:opacity-100 hover:z-20 transition-all cursor-pointer shadow-sm flex items-center justify-center"
                                style={{
                                    left: getPosition(schedule.theoryStart) * COL_WIDTH + 2,
                                    width: (getDuration(schedule.theoryStart, schedule.theoryEnd) * COL_WIDTH) - 4
                                }}
                                title={`TEÓRICO: ${formatDate(schedule.theoryStart)} - ${formatDate(schedule.theoryEnd)}`}
                            >
                                {/* <span className="text-[8px] text-white font-bold leading-none">T</span> */}
                            </div>

                            {/* Prático */}
                            <div
                                className="absolute h-3 bg-green-500 rounded-md top-9 opacity-90 hover:opacity-100 hover:z-20 transition-all cursor-pointer shadow-sm flex items-center justify-center border border-white"
                                style={{
                                    left: getPosition(schedule.practiceStart) * COL_WIDTH + 2,
                                    width: (getDuration(schedule.practiceStart, schedule.practiceEnd) * COL_WIDTH) - 4
                                }}
                                title={`PRÁTICO: ${formatDate(schedule.practiceStart)} - ${formatDate(schedule.practiceEnd)}`}
                            >
                                {/* <span className="text-[8px] text-white font-bold leading-none">P</span> */}
                            </div>

                        </div>
                    </div>
                ))}

                {/* Legend */}
                <div className="sticky bottom-0 left-0 bg-white border-t border-gray-200 p-2 flex gap-4 text-xs font-bold uppercase text-gray-600 z-20">
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-blue-400 rounded-full"></div> DESLOCAMENTO</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-orange-400 rounded-full"></div> MONT/DESM</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-purple-500 rounded-md"></div> TEÓRICO</div>
                    <div className="flex items-center gap-1"><div className="w-3 h-3 bg-green-500 rounded-md"></div> PRÁTICO</div>
                </div>
            </div>
        </div>
    );
};
