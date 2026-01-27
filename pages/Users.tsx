import React, { useState } from 'react';
import { useStore } from '../context/AppStore';
import { User, UserRole, UNIFORM_SIZES, SHOE_SIZES } from '../types';
import { Plus, Search, Filter, X, Trash2, Edit2, UserPlus } from 'lucide-react';
import { getCurrentDateString } from '../utils/dateUtils';
import { formatCPF, formatPhone } from '../utils/formatters';
import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter, inputClass, labelClass } from '../components/StandardModal';

export const UsersPage: React.FC = () => {
  const { users, addUser, updateUser, deleteUser, currentUser, bases } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('Todas');

  // Verificar se o usuário pode criar novos usuários
  const canCreateUsers = currentUser && [
    UserRole.GESTOR,
    UserRole.COORDENADOR,
    UserRole.EMBAIXADOR
  ].includes(currentUser.role);

  // Form State
  const initialUserState: Partial<User> = {
    name: '',
    cpf: '',
    email: '',
    phone: '',
    birthDate: '',
    role: UserRole.INSTRUTOR,
    base: '',
    isActive: true,
    password: '123',
    uniformSize: { jumpsuit: 'M', shoes: '40', shirt: 'M' },
    ppeSize: { pants: 'M', jacket: 'M', gloves: 'M', boots: '40' }
  };

  const [newUser, setNewUser] = useState<Partial<User>>(initialUserState);

  const handleSave = () => {
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
        isActive: newUser.isActive ?? true,
        uniformSize: newUser.uniformSize as any,
        ppeSize: newUser.ppeSize as any,
        password: newUser.password || editingUser.password
      };
      updateUser(updatedUser);
    } else {
      // Create new user
      const user: User = {
        id: crypto.randomUUID(),
        name: newUser.name || '',
        cpf: newUser.cpf || '',
        role: newUser.role as UserRole,
        email: newUser.email || '',
        phone: newUser.phone || '',
        birthDate: newUser.birthDate || '',
        registrationDate: getCurrentDateString(),
        createdBy: currentUser.name,
        base: newUser.base,
        isActive: newUser.isActive ?? true,
        uniformSize: newUser.uniformSize as any,
        ppeSize: newUser.ppeSize as any,
        password: newUser.password || '123'
      };
      addUser(user);
    }

    setShowModal(false);
    setEditingUser(null);
    setNewUser(initialUserState);
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setNewUser({
      name: user.name.toUpperCase(),
      cpf: user.cpf,
      role: user.role,
      email: user.email,
      phone: user.phone,
      birthDate: user.birthDate,
      base: user.base?.toUpperCase(),
      isActive: user.isActive ?? true,
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

  const handleOpenModal = () => {
    setEditingUser(null);
    setNewUser(initialUserState);
    setShowModal(true);
  };

  // Sorting and Pagination
  const ITEMS_PER_PAGE = 10;
  const [currentPage, setCurrentPage] = useState(1);

  const filteredUsers = users
    .filter(u => {
      const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = roleFilter === 'Todas' || u.role === roleFilter;
      return matchesSearch && matchesRole;
    })
    .sort((a, b) => a.name.localeCompare(b.name));

  const totalPages = Math.ceil(filteredUsers.length / ITEMS_PER_PAGE);
  const paginatedUsers = filteredUsers.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Filters */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div className="flex flex-wrap gap-2 w-full md:w-auto items-center">
          <div className="relative flex-1 min-w-[300px]">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              placeholder="BUSCAR POR NOME OU EMAIL..."
              className={`${inputClass} pl-10 uppercase`}
              value={searchTerm}
              onChange={e => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="w-full md:w-48">
            <select
              className={inputClass}
              value={roleFilter}
              onChange={e => setRoleFilter(e.target.value)}
            >
              <option value="Todas">TODAS AS FUNÇÕES</option>
              {Object.values(UserRole).map(role => (
                <option key={role} value={role}>{role.toUpperCase()}</option>
              ))}
            </select>
          </div>
        </div>
        {canCreateUsers && (
          <button
            onClick={handleOpenModal}
            className="btn-base btn-insert flex items-center justify-center px-6 py-2 text-xs font-bold"
          >
            INSERIR
          </button>
        )}
      </div>

      {/* Users Table */}
      <div className="card-premium overflow-hidden animate-slide-up">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200 border-collapse">
            <thead className="bg-white text-gray-700">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Nome / Email</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Função</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">CPF</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Telefone</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Base</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap">Status</th>
                <th className="px-3 py-3 text-center text-xs font-bold uppercase border border-gray-200 whitespace-nowrap sticky right-0 bg-white z-10 w-32">Ações</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {paginatedUsers.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-gray-500 border border-gray-200">
                    Nenhum usuário encontrado para os filtros selecionados.
                  </td>
                </tr>
              ) : (
                paginatedUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors group">
                    <td className="px-3 py-2 whitespace-nowrap border border-gray-200">
                      <div className="flex flex-col">
                        <span className="text-xs font-bold text-gray-900 uppercase">{user.name}</span>
                        <span className="text-[10px] text-gray-500">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap border border-gray-200">
                      <span className={`px-2 py-0.5 inline-flex text-[10px] font-semibold rounded-full uppercase border 
                                                ${user.role === UserRole.GESTOR ? 'bg-purple-100 text-purple-800 border-purple-200' :
                          user.role === UserRole.COORDENADOR ? 'bg-blue-100 text-blue-800 border-blue-200' :
                            user.role === UserRole.INSTRUTOR ? 'bg-orange-100 text-orange-800 border-orange-200' :
                              'bg-gray-100 text-gray-800 border-gray-200'}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap border border-gray-200">
                      <span className="text-[10px] font-mono text-gray-700">{formatCPF(user.cpf)}</span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap border border-gray-200">
                      <span className="text-[10px] text-gray-500">{formatPhone(user.phone)}</span>
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap border border-gray-200 text-xs text-gray-600 font-medium">
                      {user.base || '-'}
                    </td>
                    <td className="px-3 py-2 text-center whitespace-nowrap border border-gray-200">
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border 
                                                ${user.isActive !== false ? 'bg-green-50 text-green-600 border-green-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                        {user.isActive !== false ? 'ATIVO' : 'INATIVO'}
                      </span>
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap text-center border border-gray-200 sticky right-0 bg-white group-hover:bg-gray-50 z-10">
                      <div className="flex justify-center gap-2">
                        <button
                          onClick={() => handleEdit(user)}
                          className="btn-base btn-edit px-3 py-1 text-[10px]"
                        >
                          EDITAR
                        </button>
                        <button
                          onClick={() => handleDelete(user.id)}
                          className="btn-base btn-delete px-3 py-1 text-[10px]"
                        >
                          EXCLUIR
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Controls */}
        {filteredUsers.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 flex items-center justify-between bg-gray-50">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wide">
              Mostrando <span className="font-medium text-gray-700">{((currentPage - 1) * ITEMS_PER_PAGE) + 1}</span> a <span className="font-medium text-gray-700">{Math.min(currentPage * ITEMS_PER_PAGE, filteredUsers.length)}</span> de <span className="font-medium text-gray-700">{filteredUsers.length}</span> resultados
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className={`btn-base btn-pagination px-4 py-2 text-xs ${currentPage === 1 ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                ANTERIOR
              </button>
              <button
                onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className={`btn-base btn-pagination px-4 py-2 text-xs ${currentPage === totalPages ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                PRÓXIMO
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      <StandardModal isOpen={showModal} onClose={() => setShowModal(false)} maxWidth="max-w-4xl">
        <StandardModalHeader
          title={editingUser ? 'EDITAR USUÁRIO' : ''}
          onClose={() => setShowModal(false)}
        />
        <StandardModalBody>
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={labelClass}>Nome Completo</label>
                <input required type="text" className={inputClass}
                  value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value.toUpperCase() })} />
              </div>
              <div>
                <label className={labelClass}>CPF</label>
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
                <label className={labelClass}>FUNÇÃO</label>
                <select className={`${inputClass} uppercase`}
                  value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value as UserRole })}>
                  {Object.values(UserRole).map(r => <option key={r} value={r}>{r.toUpperCase()}</option>)}
                </select>
              </div>
              <div>
                <label className={labelClass}>BASE (OPCIONAL)</label>
                <select
                  className={`${inputClass} uppercase`}
                  value={newUser.base || ''}
                  onChange={e => setNewUser({ ...newUser, base: e.target.value })}
                >
                  <option value="">SELECIONE UMA BASE (OPCIONAL)</option>
                  {bases.map(base => (
                    <option key={base.id} value={base.name}>{base.name.toUpperCase()}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  className={inputClass}
                  value={newUser.isActive !== false ? 'true' : 'false'}
                  onChange={e => setNewUser({ ...newUser, isActive: e.target.value === 'true' })}
                >
                  <option value="true">ATIVO</option>
                  <option value="false">INATIVO</option>
                </select>
              </div>
              <div>
                <label className={labelClass}>E-Mail</label>
                <input required type="email" className={inputClass}
                  value={newUser.email || ''} onChange={e => setNewUser({ ...newUser, email: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Telefone</label>
                <input required type="text" className={inputClass}
                  value={formatPhone(newUser.phone || '')} onChange={e => setNewUser({ ...newUser, phone: formatPhone(e.target.value) })}
                  placeholder="(XX) X XXXX-XXXX"
                  maxLength={16} />
              </div>
              <div>
                <label className={labelClass}>DATA DE NASCIMENTO</label>
                <input required type="date" className={`${inputClass} uppercase`}
                  value={newUser.birthDate || ''} onChange={e => setNewUser({ ...newUser, birthDate: e.target.value })} />
              </div>
              <div>
                <label className={labelClass}>Senha</label>
                <input
                  required
                  type="password"
                  className={inputClass}
                  value={newUser.password || ''}
                  onChange={e => setNewUser({ ...newUser, password: e.target.value })}
                  placeholder="DIGITE A SENHA"
                  minLength={3}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">Tamanho de Uniforme</h4>
                <div className="grid grid-cols-1 gap-3">
                  <div>
                    <label className={labelClass}>Macacão</label>
                    <select className={inputClass} value={newUser.uniformSize?.jumpsuit} onChange={e => setNewUser({ ...newUser, uniformSize: { ...newUser.uniformSize!, jumpsuit: e.target.value } })}>
                      {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Camisa</label>
                    <select className={inputClass} value={newUser.uniformSize?.shirt} onChange={e => setNewUser({ ...newUser, uniformSize: { ...newUser.uniformSize!, shirt: e.target.value } })}>
                      {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Calçado</label>
                    <select className={inputClass} value={newUser.uniformSize?.shoes} onChange={e => setNewUser({ ...newUser, uniformSize: { ...newUser.uniformSize!, shoes: e.target.value } })}>
                      {SHOE_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-md border border-gray-200">
                <h4 className="text-xs font-bold text-gray-700 uppercase tracking-wider mb-3 flex items-center gap-2">Tamanho de EPI</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className={labelClass}>Calça</label>
                    <select className={inputClass} value={newUser.ppeSize?.pants} onChange={e => setNewUser({ ...newUser, ppeSize: { ...newUser.ppeSize!, pants: e.target.value } })}>
                      {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Blusão</label>
                    <select className={inputClass} value={newUser.ppeSize?.jacket} onChange={e => setNewUser({ ...newUser, ppeSize: { ...newUser.ppeSize!, jacket: e.target.value } })}>
                      {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Luva</label>
                    <select className={inputClass} value={newUser.ppeSize?.gloves} onChange={e => setNewUser({ ...newUser, ppeSize: { ...newUser.ppeSize!, gloves: e.target.value } })}>
                      {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClass}>Bota de Combate</label>
                    <select className={inputClass} value={newUser.ppeSize?.boots} onChange={e => setNewUser({ ...newUser, ppeSize: { ...newUser.ppeSize!, boots: e.target.value } })}>
                      {SHOE_SIZES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </StandardModalBody>
        <StandardModalFooter>
          <div className="flex justify-end gap-3 w-full">
            <button
              onClick={() => setShowModal(false)}
              className="btn-base btn-cancel px-6 py-2.5 text-sm"
            >
              CANCELAR
            </button>
            <button
              onClick={handleSave}
              className="btn-base btn-save px-6 py-2.5 text-sm"
            >
              {editingUser ? 'ATUALIZAR' : 'SALVAR'}
            </button>
          </div>
        </StandardModalFooter>
      </StandardModal>
    </div>
  );
};
