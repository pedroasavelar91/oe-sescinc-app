
import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { User, UserRole, UNIFORM_SIZES, SHOE_SIZES } from '../types';
import { Plus, Search, Filter, X, Trash2, Edit2 } from 'lucide-react';
import { getCurrentDateString } from '../utils/dateUtils';
import { formatCPF } from '../utils/formatters';

export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
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
    password: '123',
    uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' },
    ppeSize: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' }
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    if (editingUser) {
      // Update existing user
      const updatedUser: User = {
        ...editingUser,
        name: newUser.name || editingUser.name,
        cpf: newUser.cpf || editingUser.cpf,
        role: newUser.role as UserRole,
        email: newUser.email || editingUser.email,
        phone: newUser.phone || editingUser.phone,
        birthDate: newUser.birthDate || editingUser.birthDate,
        base: newUser.base,
        uniformSize: newUser.uniformSize as any,
        ppeSize: newUser.ppeSize as any,
        password: newUser.password || editingUser.password
      };
      updateUser(updatedUser);
    } else {
      // Create new user
      const user: User = {
        id: Math.random().toString(36).substr(2, 9),
        name: newUser.name || '',
        cpf: newUser.cpf || '',
        role: newUser.role as UserRole,
        email: newUser.email || '',
        phone: newUser.phone || '',
        birthDate: newUser.birthDate || '',
        registrationDate: getCurrentDateString(),
        createdBy: currentUser.name,
        base: newUser.base,
        uniformSize: newUser.uniformSize as any,
        ppeSize: newUser.ppeSize as any,
        password: newUser.password || '123'
      };
      addUser(user);
    }

    setShowModal(false);
    setEditingUser(null);
    setNewUser({ role: UserRole.INSTRUTOR, base: '', password: '123', uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' }, ppeSize: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' } });
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name,
      cpf: user.cpf,
      role: user.role,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      base: user.base,
      password: user.password,
      uniformSize: user.uniformSize,
      ppeSize: user.ppeSize
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      await deleteUser(id);
    }
  };

  // Sorting and Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = users
    .filter(u =>
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.role.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedUsers = filteredUsers.slice(startIndex, startIndex + ITEMS_PER_PAGE);

  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 animate-slide-down">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gerenciamento de Usuários</h1>
          <p className="text-gray-500 mt-1">Gerencie usuários e permissões</p>
        </div>
        {canCreateUsers && (
          <button
            onClick={() => setShowModal(true)}
            className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-6 py-3 rounded-lg shadow-md transition-all duration-200"
          >
            <Plus size={20} />
            <span className="font-semibold">Novo Usuário</span>
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
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.map((user) => (
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
                          user.role === UserRole.AUXILIAR_INSTRUCAO ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'}`}>
                      {user.role}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatCPF(user.cpf)}</div>
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
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <div className="flex items-center justify-end gap-2">
                      <button
                        onClick={() => handleEdit(user)}
                        className="text-blue-600 hover:text-blue-900 hover:scale-110 transition-all duration-200"
                        title="Editar usuário"
                      >
                        <Edit2 size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900 hover:scale-110 transition-all duration-200"
                        title="Excluir usuário"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        <div className="px-6 py-4 border-t border-gray-100 flex items-center justify-between bg-gray-50">
          <div className="text-sm text-gray-500">
            Mostrando <span className="font-medium">{startIndex + 1}</span> a <span className="font-medium">{Math.min(startIndex + ITEMS_PER_PAGE, filteredUsers.length)}</span> de <span className="font-medium">{filteredUsers.length}</span> usuários
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => goToPage(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
            >
              Anterior
            </button>
            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                // Logic to show window of pages around current
                let pageNum = i + 1;
                if (totalPages > 5) {
                  if (currentPage > 3) pageNum = currentPage - 2 + i;
                  if (pageNum > totalPages) pageNum = totalPages - (4 - i);
                }
                return (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === pageNum ? 'bg-primary-600 text-white' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
                  >
                    {pageNum}
                  </button>
                );
              })}
            </div>
            <button
              onClick={() => goToPage(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300'}`}
            >
              Próximo
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col animate-scale-in">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
              <h3 className="text-lg font-bold text-gray-900">{editingUser ? 'Editar Usuário' : 'Novo Cadastro de Usuário'}</h3>
              <button onClick={() => { setShowModal(false); setEditingUser(null); setNewUser({ role: UserRole.INSTRUTOR, base: '', password: '123', uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' }, ppeSize: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' } }); }}>
                <X size={24} className="text-gray-400 hover:text-gray-600" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto">
              <form onSubmit={handleSave} className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                    <input required type="text" className={inputClass}
                      value={newUser.name || ''} onChange={e => setNewUser({ ...newUser, name: e.target.value.toUpperCase() })} />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700">CPF</label>
                    <input
                      required
                      type="text"
                      className={inputClass}
                      value={formatCPF(newUser.cpf || '')}
                      onChange={e => setNewUser({ ...newUser, cpf: formatCPF(e.target.value) })}
                      placeholder="000.000.000-00"
                      maxLength={14}
                    />
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
                      value={newUser.base || ''} onChange={e => setNewUser({ ...newUser, base: e.target.value.toUpperCase() })} />
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
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Senha</label>
                    <input
                      required
                      type="password"
                      className={inputClass}
                      value={newUser.password || ''}
                      onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                      placeholder="Digite a senha"
                      minLength={3}
                    />
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
                  <button type="button" onClick={() => { setShowModal(false); setEditingUser(null); setNewUser({ role: UserRole.INSTRUTOR, base: '', password: '123', uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' }, ppeSize: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' } }); }} className="mr-3 px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200">Cancelar</button>
                  <button type="submit" className="px-4 py-2 bg-primary-600 text-white rounded-md hover:bg-primary-700">{editingUser ? 'Atualizar Usuário' : 'Salvar Usuário'}</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
