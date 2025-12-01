
import React from 'react';
import { useStore } from '../context/AppStore';

export const ClassesPage: React.FC = () => {
    const { classes, courses, users, currentUser } = useStore();

    return (
        <div className="space-y-6">
            <div>
                <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Turmas</h1>
                <p className="text-gray-500 mt-1">Gerencie turmas e cronogramas</p>
            </div>

            <div className="card-premium p-6">
                <h2 className="text-xl font-bold mb-4">Turmas Cadastradas</h2>

                {classes.length === 0 ? (
                    <p className="text-gray-500 italic">Nenhuma turma cadastrada ainda.</p>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {classes.map(cls => {
                            const course = courses.find(c => c.id === cls.courseId);
                            return (
                                <div key={cls.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <h3 className="font-bold text-lg">{cls.name}</h3>
                                    <p className="text-sm text-gray-600">{course?.name || 'Curso não encontrado'}</p>
                                    <div className="mt-2 text-xs text-gray-500">
                                        <p>Início: {new Date(cls.startDate).toLocaleDateString()}</p>
                                        <p>Fim: {new Date(cls.endDate).toLocaleDateString()}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <div className="card-premium p-6 bg-blue-50 border-blue-200">
                <h3 className="font-bold text-blue-900">⚠️ Página Temporária</h3>
                <p className="text-sm text-blue-700 mt-2">
                    Esta é uma versão simplificada da página de Turmas enquanto corrigimos o erro.
                    <br />
                    Funcionalidades completas serão restauradas em breve.
                </p>
            </div>
        </div>
    );
};
