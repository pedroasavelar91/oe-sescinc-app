import React from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, User } from '../types';
import { User as UserIcon } from 'lucide-react';

export const OrganogramPage: React.FC = () => {
    const { users } = useStore();

    // Filter users by role
    const managers = users.filter(u => u.role === UserRole.GESTOR);
    const coordinators = users.filter(u => u.role === UserRole.COORDENADOR);
    const instructors = users.filter(u => u.role === UserRole.INSTRUTOR);
    const assistants = users.filter(u => u.role === UserRole.AUXILIAR_INSTRUCAO);

    const UserCard = ({ user, roleColor }: { user: User; roleColor: string }) => (
        <div className="flex flex-col items-center p-4 bg-white rounded-xl shadow-md border border-gray-100 w-48 relative group hover:-translate-y-1 transition-transform duration-200">
            <div className={`h-16 w-16 rounded-full overflow-hidden border-2 ${roleColor} mb-3 flex items-center justify-center bg-gray-50`}>
                {user.photoUrl ? (
                    <img src={user.photoUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                    <UserIcon className="text-gray-400" size={32} />
                )}
            </div>
            <h3 className="font-bold text-gray-900 text-center text-sm leading-tight">{user.name}</h3>
            <p className="text-xs text-gray-500 mt-1 text-center">{user.role}</p>
            {user.base && <span className="mt-2 text-[10px] px-2 py-0.5 bg-gray-100 rounded-full text-gray-600">{user.base}</span>}
        </div>
    );

    const Connector = () => (
        <div className="h-8 w-px bg-gray-300 my-2"></div>
    );

    const HorizontalLine = () => (
        <div className="w-full h-px bg-gray-300 my-4 relative">
            <div className="absolute left-1/2 -translate-x-1/2 -top-2 h-4 w-px bg-gray-300"></div>
        </div>
    );

    return (
        <div className="space-y-6 animate-fade-in pb-20">
            <div className="animate-slide-down text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900">Organograma</h1>
                <p className="text-gray-500 mt-1">Estrutura organizacional da equipe</p>
            </div>

            <div className="flex flex-col items-center space-y-4 overflow-x-auto p-4 min-w-full">

                {/* Level 1: Gestão */}
                <div className="flex flex-col items-center">
                    <div className="flex gap-6">
                        {managers.map(user => (
                            <UserCard key={user.id} user={user} roleColor="border-purple-500" />
                        ))}
                    </div>
                    {managers.length === 0 && <p className="text-gray-400 italic">Sem Gestores</p>}
                </div>

                {/* Connector */}
                {(managers.length > 0 && coordinators.length > 0) && <Connector />}

                {/* Level 2: Coordenação */}
                <div className="flex flex-col items-center w-full">
                    {/* Horizontal connector if multiple coordinators */}
                    {coordinators.length > 1 && (
                        <div className="w-3/4 h-px bg-gray-300 mb-4 relative">
                            <div className="absolute left-1/2 -translate-x-1/2 -top-4 h-4 w-px bg-gray-300"></div>
                        </div>
                    )}

                    <div className="flex flex-wrap justify-center gap-8">
                        {coordinators.map(user => (
                            <div key={user.id} className="flex flex-col items-center">
                                <UserCard user={user} roleColor="border-blue-500" />
                            </div>
                        ))}
                    </div>
                </div>

                {/* Connector */}
                {(coordinators.length > 0 && instructors.length > 0) && <Connector />}

                {/* Level 3: Instrutores */}
                <div className="flex flex-col items-center w-full">
                    <div className="bg-orange-50 px-4 py-1 rounded-full text-xs font-bold text-orange-700 mb-4 border border-orange-100">
                        Instrutores
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                        {instructors.map(user => (
                            <UserCard key={user.id} user={user} roleColor="border-orange-500" />
                        ))}
                    </div>
                </div>

                {/* Connector */}
                {(instructors.length > 0 && assistants.length > 0) && <Connector />}

                {/* Level 4: Auxiliares */}
                {assistants.length > 0 && (
                    <div className="flex flex-col items-center w-full mt-8">
                        <div className="bg-gray-100 px-4 py-1 rounded-full text-xs font-bold text-gray-600 mb-4 border border-gray-200">
                            Auxiliares de Instrução
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                            {assistants.map(user => (
                                <UserCard key={user.id} user={user} roleColor="border-gray-400" />
                            ))}
                        </div>
                    </div>
                )}

            </div>
        </div>
    );
};
