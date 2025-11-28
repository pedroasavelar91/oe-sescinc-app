
import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { User, UserRole, UNIFORM_SIZES, SHOE_SIZES } from '../types';
import { Plus, Search, Filter, X } from 'lucide-react';

export const UsersPage: React.FC = () => {
  const { users, addUser, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Verificar se o usuário pode criar novos usuários
  const canCreateUsers = currentUser && [
    UserRole.GESTOR,
    UserRole.COORDENADOR,
    UserRole.EMBAIXADOR
  ].includes(currentUser.role);

  // Form State
  const [newUser, setNewUser] = useState<Partial<User>>({
    role: UserRole.INSTRUTOR,
    base: '',
    uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' },
    ppeSize: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    const user: User = {
      id: Math.random().toString(36).substr(2, 9),
      name: newUser.name || '',
      cpf: newUser.cpf || '',
      role: newUser.role as UserRole,
      email: newUser.email || '',
      phone: newUser.phone || '',
      birthDate: newUser.birthDate || '',
      registrationDate: new Date().toISOString().split('T')[0],
      createdBy: currentUser.name,
      base: newUser.base,
      uniformSize: newUser.uniformSize as any,
      ppeSize: newUser.ppeSize as any,
      password: '123' // Default
    };

    addUser(user);
    setShowModal(false);
    setNewUser({ role: UserRole.INSTRUTOR, base: '', uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' }, ppeSize: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' } });
  };

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    u.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
        {canCreateUsers && (
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded-md hover:bg-primary-700 transition"
          >
            <Plus size={20} />
            <span>Novo Usuário</span>
          </button>
        )}
      </div>

      <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center space-x-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
            <input
              type="text"
              placeholder="Buscar por nome ou função..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900"
            />
          </div>
          <button className="text-gray-500 hover:text-gray-700">
            <Filter size={20} />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Nome / Email</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Função</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">CPF / Telefone</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Base</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cadastrado Por</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="h-10 w-10 rounded-full bg-gray-200 flex items-center justify-center text-gray-600 font-bold">
                        {user.name.charAt(0)}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">{user.name}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full 
                      ${user.role === UserRole.GESTOR ? 'bg-purple-100 text-purple-800' :
                        user.role === UserRole.INSTRUTOR ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{user.cpf}</div>
                    <div className="text-sm text-gray-500">{user.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.base || '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.createdBy}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-600 text-sm font-medium">Ativo</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">Novo Cadastro de Usuário</h3>
              <button onClick={() => setShowModal(false)}><X size={24} className="text-gray-400 hover:text-gray-600" /></button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input required type="text" className={inputClass}
                      value={newUser.name || ''} onChange={e => setNewUser({ ...newUser, name: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <input required type="text" className={inputClass}
                      value={newUser.cpf || ''} onChange={e => setNewUser({ ...newUser, cpf: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Função</label>
                    <select className={inputClass}
                      value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}>
                      {Object.values(UserRole).map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Base (Opcional)</label>
                    <input type="text" className={inputClass} placeholder="Ex: SBGR"
                      value={newUser.base || ''} onChange={e => setNewUser({ ...newUser, base: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">E-Mail</label>
                    <input required type="email" className={inputClass}
                      value={newUser.email || ''} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Número de Telefone</label>
                    <input required type="text" className={inputClass}
                      value={newUser.phone || ''} onChange={e => setNewUser({ ...newUser, phone: e.target.value })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                    <input required type="date" className={inputClass}
                      value={newUser.birthDate || ''} onChange={e => setNewUser({ ...newUser, birthDate: e.target.value })} />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">Tamanho de Uniforme</h4>
                    <div className="grid grid-cols-1 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Macacão</label>
                        <select className={inputClass} value={newUser.uniformSize?.jumpsuit} onChange={e => setNewUser({ ...newUser, uniformSize: { ...newUser.uniformSize!, jumpsuit: e.target.value } })}>
                          {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Camisa</label>
                        <select className={inputClass} value={newUser.uniformSize?.shirt} onChange={e => setNewUser({ ...newUser, uniformSize: { ...newUser.uniformSize!, shirt: e.target.value } })}>
                          {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Calçado</label>
                        <select className={inputClass} value={newUser.uniformSize?.shoes} onChange={e => setNewUser({ ...newUser, uniformSize: { ...newUser.uniformSize!, shoes: e.target.value } })}>
                          {SHOE_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>

                  <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                    <h4 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">Tamanho de EPI</h4>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Calça</label>
                        <select className={inputClass} value={newUser.ppeSize?.pants} onChange={e => setNewUser({ ...newUser, ppeSize: { ...newUser.ppeSize!, pants: e.target.value } })}>
                          {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Blusão</label>
                        <select className={inputClass} value={newUser.ppeSize?.jacket} onChange={e => setNewUser({ ...newUser, ppeSize: { ...newUser.ppeSize!, jacket: e.target.value } })}>
                          {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Luva</label>
                        <select className={inputClass} value={newUser.ppeSize?.gloves} onChange={e => setNewUser({ ...newUser, ppeSize: { ...newUser.ppeSize!, gloves: e.target.value } })}>
                          {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 font-medium">Bota de Combate</label>
                        <select className={inputClass} value={newUser.ppeSize?.boots} onChange={e => setNewUser({ ...newUser, ppeSize: { ...newUser.ppeSize!, boots: e.target.value } })}>
                          {SHOE_SIZES.map(s => <option key={s}>{s}</option>)}
                        </select>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-4 border-t border-gray-100">
                  <button type="button" onClick={() => setShowModal(false)} className="mr-3 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">Salvar Usuário</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
