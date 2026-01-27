
import React, { useState, useRef, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { Camera, Trash2, Download, Image as ImageIcon, Info } from 'lucide-react';
import { ClassPhoto, UserRole } from '../types';
import { StandardSelect } from '../components/StandardSelect';
import { generateStandardPDF } from '../utils/pdf';
import { generatePhotoReportPDF } from '../utils/pdfPhotoReport';

// Helper to convert file to base64
const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = error => reject(error);
    });
};

export const ClassPhotosPage: React.FC = () => {
    const { classes, courses, classPhotos, addClassPhoto, deleteClassPhoto, currentUser } = useStore();

    // Filters State
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [selectedCourseId, setSelectedCourseId] = useState<string>('');
    const [selectedClassId, setSelectedClassId] = useState<string>('');
    const [uploading, setUploading] = useState(false);

    // Derived Options
    const yearOptions = useMemo(() => {
        const years = Array.from(new Set(classes.map(c => c.startDate.split('-')[0]))).sort().reverse();
        return years.map(y => ({ value: y, label: y }));
    }, [classes]);

    const courseOptions = useMemo(() => {
        return courses.map(c => ({ value: c.id, label: c.name }));
    }, [courses]);

    const filteredClasses = useMemo(() => {
        return classes.filter(c => {
            const yearMatch = selectedYear ? c.startDate.startsWith(selectedYear) : true;
            const courseMatch = selectedCourseId ? c.courseId === selectedCourseId : true;
            return yearMatch && courseMatch;
        });
    }, [classes, selectedYear, selectedCourseId]);

    const classOptions = filteredClasses.map(c => ({ value: c.id, label: c.name }));

    // Selected Data
    const selectedClass = classes.find(c => c.id === selectedClassId);
    const selectedCourse = courses.find(c => c.id === selectedClass?.courseId);

    // Use subjects in registration order (array order defined in Course)
    const subjects = useMemo(() => {
        if (!selectedCourse?.subjects) return [];
        return selectedCourse.subjects;
    }, [selectedCourse]);

    const canDownload = currentUser && (currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR);

    const handleExportPDF = async () => {
        if (!selectedClass || !selectedCourse || !currentUser) return;

        // Custom Data for Photo Report: 2 Columns [Photo, Info]
        const tableData = subjects.map(subject => {
            const subjectPhotos = classPhotos.filter(p => p.classId === selectedClassId && p.subjectId === subject.id);
            const latestPhoto = subjectPhotos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];
            const photoUrls = subjectPhotos.map(p => p.photoUrl);

            // Text Column Content: Subject + Uploader Info
            let textContent = subject.name.toUpperCase();
            if (latestPhoto) {
                textContent += `\n\nENVIADO POR:\n${latestPhoto.uploadedByName.toUpperCase()}\nEM ${new Date(latestPhoto.uploadedAt).toLocaleString()}`;
            } else {
                textContent += `\n\nAGUARDANDO ENVIO`;
            }

            return [
                { images: photoUrls }, // Column 0: Image Object
                textContent            // Column 1: Text
            ];
        });

        await generatePhotoReportPDF({
            title: 'RELATÓRIO DE EVIDÊNCIAS DE AULAS',
            filename: `evidencias_${selectedClass.name}`,
            details: [
                { label: 'CURSO', value: selectedCourse.name },
                { label: 'TURMA', value: selectedClass.name }
            ],
            data: tableData,
            user: currentUser,
            backgroundImage: '/pdf-background.png'
        });
    };

    const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, subjectId: string, type: 'THEORY' | 'PRACTICAL') => {
        if (!event.target.files || event.target.files.length === 0 || !selectedClass || !currentUser) return;

        const subjectPhotos = classPhotos.filter(p => p.classId === selectedClassId && p.subjectId === subjectId && p.type === type);

        // Check limits
        if (type === 'THEORY' && subjectPhotos.length >= 1) {
            alert('Limite de 1 foto para Aula Teórica atingido.');
            return;
        }
        if (type === 'PRACTICAL' && subjectPhotos.length >= 4) {
            alert('Limite de 4 fotos para Aula Prática atingido.');
            return;
        }

        const file = event.target.files[0];
        setUploading(true);

        try {
            const base64 = await convertFileToBase64(file);

            const newPhoto: ClassPhoto = {
                id: crypto.randomUUID(),
                classId: selectedClassId,
                subjectId: subjectId,
                type: type,
                photoUrl: base64,
                uploadedBy: currentUser.id,
                uploadedByName: currentUser.name,
                uploadedAt: new Date().toISOString()
            };

            await addClassPhoto(newPhoto);
        } catch (error) {
            console.error("Error uploading photo:", error);
            alert("Erro ao enviar foto.");
        } finally {
            setUploading(false);
            event.target.value = '';
        }
    };

    const handleDelete = async (id: string) => {
        if (window.confirm('Tem certeza que deseja excluir esta foto?')) {
            await deleteClassPhoto(id);
        }
    };

    const handleDownload = (photo: ClassPhoto) => {
        const link = document.createElement('a');
        link.href = photo.photoUrl;
        link.download = `FOTO_${photo.type}_${selectedClass?.name}_${photo.id}.jpg`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    const PhotoSlot = ({ photo, subjectId, type, index }: { photo?: ClassPhoto, subjectId: string, type: 'THEORY' | 'PRACTICAL', index: number }) => {
        const fileInputRef = useRef<HTMLInputElement>(null);

        if (photo) {
            return (
                <div className="relative w-16 h-12 bg-gray-100 rounded border border-gray-200 overflow-hidden group">
                    <img src={photo.photoUrl} alt="Evidence" className="w-full h-full object-cover" />
                    {/* Hover Overlay */}
                    <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100">
                        {canDownload && (
                            <button onClick={() => handleDownload(photo)} className="text-white hover:text-blue-200" title="Baixar">
                                <Download size={12} />
                            </button>
                        )}
                        <button onClick={() => handleDelete(photo.id)} className="text-white hover:text-red-200" title="Excluir">
                            <Trash2 size={12} />
                        </button>
                    </div>
                </div>
            );
        }

        return (
            <div
                className="w-16 h-12 bg-gray-50 rounded border border-dashed border-gray-300 flex flex-col items-center justify-center cursor-pointer hover:border-orange-500 hover:bg-orange-50 transition-all"
                onClick={() => fileInputRef.current?.click()}
                title={type === 'THEORY' ? 'Adicionar foto teórica' : `Adicionar foto prática ${index + 1}`}
            >
                <Camera size={14} className="text-gray-400 mb-0.5 opacity-50" />
                <span className="text-[8px] font-bold text-gray-400 uppercase leading-none">
                    {type === 'THEORY' ? 'Foto' : `${index + 1}`}
                </span>
                <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*"
                    capture="environment"
                    onChange={(e) => handleFileUpload(e, subjectId, type)}
                />
            </div>
        );
    };

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            {/* Filters Bar */}
            <div className="flex flex-col md:flex-row justify-between items-end gap-4">
                <div className="flex flex-wrap gap-4 w-full md:w-auto items-end">
                    <div className="w-full md:w-32">
                        <StandardSelect
                            label="ANO"
                            options={yearOptions}
                            value={selectedYear}
                            onChange={(e) => setSelectedYear(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-64">
                        <StandardSelect
                            label="CURSO"
                            placeholder="Todos os cursos"
                            options={courseOptions}
                            value={selectedCourseId}
                            onChange={(e) => setSelectedCourseId(e.target.value)}
                        />
                    </div>
                    <div className="w-full md:w-80">
                        <StandardSelect
                            label="TURMA"
                            placeholder="Selecione a turma..."
                            options={classOptions}
                            value={selectedClassId}
                            onChange={(e) => setSelectedClassId(e.target.value)}
                            disabled={!selectedYear}
                        />
                    </div>
                </div>

                {/* EXPORT PDF BUTTON - BLUE STYLE - TEXT ONLY */}
                {selectedClassId && (
                    <button
                        onClick={handleExportPDF}
                        className="btn-base btn-edit px-4 py-2 text-xs font-bold uppercase mb-1"
                        title="Exportar Relatório em PDF"
                    >
                        PDF
                    </button>
                )}
            </div>

            {!selectedClassId ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-2xl border border-gray-100 shadow-sm border-dashed">
                    <ImageIcon size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Selecione uma turma para visualizar as fotos.</p>
                </div>
            ) : subjects.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-gray-300 bg-white rounded-2xl border border-gray-100 shadow-sm border-dashed">
                    <Info size={48} className="mb-4 opacity-50" />
                    <p className="text-lg font-medium">Este curso não possui matérias cadastradas.</p>
                </div>
            ) : (
                <div className="card-premium overflow-hidden animate-slide-up">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200 border-collapse">
                            <thead className="bg-white">
                                <tr>
                                    <th className="px-3 py-3 text-left text-xs font-bold text-gray-700 uppercase sticky left-0 bg-white z-20 border border-gray-200 shadow-sm w-[300px]">
                                        Matéria
                                    </th>
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase border border-gray-200 w-32">
                                        Tipo
                                    </th>
                                    {/* Evidências Width Minimized to be as small as possible */}
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase border border-gray-200 w-[1%] whitespace-nowrap">
                                        EVIDÊNCIAS
                                    </th>
                                    {/* ENVIADO takes remaining space or has robust width */}
                                    <th className="px-3 py-3 text-center text-xs font-bold text-gray-700 uppercase border border-gray-200 w-auto">
                                        ENVIADO
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {subjects.map((subject) => {
                                    // Filter photos for this subject
                                    const subjectPhotos = classPhotos.filter(p => p.classId === selectedClassId && p.subjectId === subject.id);
                                    const theoryPhotos = subjectPhotos.filter(p => p.type === 'THEORY');
                                    const practicalPhotos = subjectPhotos.filter(p => p.type === 'PRACTICAL');

                                    // Determine latest uploader info
                                    const latestPhoto = subjectPhotos.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime())[0];

                                    return (
                                        <tr key={subject.id} className="hover:bg-gray-50 transition-colors uppercase">
                                            <td className="px-4 py-3 sticky left-0 bg-white border border-gray-200 text-sm font-medium text-gray-900 z-10 shadow-sm text-left align-middle">
                                                <div className="flex flex-col">
                                                    <span className="text-gray-900 font-bold">{subject.name}</span>
                                                    <span className="text-xs text-gray-500 mt-0.5">{subject.hours}h</span>
                                                </div>
                                            </td>
                                            <td className="px-2 py-2 text-center border border-gray-200 align-middle">
                                                <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase ${subject.modality === 'Teórica' ? 'bg-blue-50 text-blue-600' : 'bg-orange-50 text-orange-600'
                                                    }`}>
                                                    {subject.modality}
                                                </span>
                                            </td>
                                            <td className="px-2 py-2 border border-gray-200 align-middle">
                                                <div className="flex items-center gap-4 justify-start pl-4">
                                                    {/* THEORETICAL SLOT */}
                                                    {subject.modality === 'Teórica' && (
                                                        <div className="flex flex-col items-center gap-1">
                                                            <span className="text-[9px] font-bold text-blue-600 uppercase tracking-wider">Teórica</span>
                                                            <PhotoSlot
                                                                photo={theoryPhotos[0]}
                                                                subjectId={subject.id}
                                                                type="THEORY"
                                                                index={0}
                                                            />
                                                        </div>
                                                    )}

                                                    {/* PRACTICAL SLOTS */}
                                                    {subject.modality === 'Prática' && (
                                                        <div className="flex flex-col items-start gap-1">
                                                            <span className="text-[9px] font-bold text-orange-600 uppercase tracking-wider pl-1">Prática (4 Fotos)</span>
                                                            <div className="flex gap-2">
                                                                {[0, 1, 2, 3].map(idx => (
                                                                    <PhotoSlot
                                                                        key={`prac-${idx}`}
                                                                        photo={practicalPhotos[idx]}
                                                                        subjectId={subject.id}
                                                                        type="PRACTICAL"
                                                                        index={idx}
                                                                    />
                                                                ))}
                                                            </div>
                                                        </div>
                                                    )}

                                                    {subject.modality !== 'Teórica' && subject.modality !== 'Prática' && (
                                                        <span className="text-xs text-gray-400 italic">Sem slots definidos para esta modalidade ({subject.modality})</span>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="px-4 py-3 border border-gray-200 align-middle text-xs text-gray-500 text-center">
                                                {latestPhoto ? (
                                                    <div className="flex flex-col items-center">
                                                        <span className="font-bold text-gray-700">{latestPhoto.uploadedByName}</span>
                                                        <span>{new Date(latestPhoto.uploadedAt).toLocaleDateString()}</span>
                                                        <span className="text-[10px] opacity-75">{new Date(latestPhoto.uploadedAt).toLocaleTimeString().slice(0, 5)}</span>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-300">-</span>
                                                )}
                                            </td>
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
};
