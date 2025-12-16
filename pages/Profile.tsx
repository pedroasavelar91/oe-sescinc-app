import React, { useState, useEffect } from 'react';
import { useStore } from '../context/AppStore';
import { UNIFORM_SIZES, SHOE_SIZES } from '../types';
import { Save, Lock, User as UserIcon, Upload } from 'lucide-react';
import { formatCPF } from '../utils/formatters';

export const ProfilePage: React.FC = () => {
    const { currentUser, updateUser, uploadProfilePhoto } = useStore();
    const [formData, setFormData] = useState<any>(null);
    const [isUploading, setIsUploading] = useState(false);

    // Password state
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [passwordMessage, setPasswordMessage] = useState('');

    useEffect(() => {
        if (currentUser) {
            setFormData({ ...currentUser });
        }
    }, [currentUser]);

    if (!currentUser || !formData) return null;

    const handleInfoSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        updateUser(formData);
        alert('Dados atualizados com sucesso!');
    };

    const handlePasswordSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setPasswordMessage('As senhas não coincidem.');
            return;
        }
        if (newPassword.length < 3) {
            setPasswordMessage('A senha deve ter pelo menos 3 caracteres.');
            return;
        }

        updateUser({ ...currentUser, password: newPassword });
        setNewPassword('');
        setConfirmPassword('');
        setPasswordMessage('Senha alterada com sucesso!');
        setTimeout(() => setPasswordMessage(''), 3000);
    };

    const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsUploading(true);

            try {
                // Try Supabase Upload first
                try {
                    const url = await uploadProfilePhoto(file, currentUser.id);
                    setFormData({ ...formData, photoUrl: url });
                } catch (supabaseError) {
                    console.warn('Supabase upload failed, falling back to Base64:', supabaseError);

                    // Fallback to Base64
                    const reader = new FileReader();
                    reader.onloadend = () => {
                        const base64String = reader.result as string;
                        setFormData({ ...formData, photoUrl: base64String });
                    };
                    reader.readAsDataURL(file);
                }
            } catch (error) {
                console.error('Error handling file:', error);
                alert('Erro ao processar a imagem.');
            } finally {
                setIsUploading(false);
            }
        }
    };

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    return (
        <div className="space-y-6 max-w-4xl mx-auto animate-fade-in">
            <div className="animate-slide-down">
                <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
                <p className="text-gray-500 mt-1">Gerencie suas informações pessoais</p>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                    <UserIcon className="text-primary-600" />
                    <h2 className="text-lg font-medium text-gray-900">Dados Pessoais</h2>
                </div>
                <form onSubmit={handleInfoSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nome Completo</label>
                            <input type="text" className={inputClass} value={formData.name} onChange={e => setFormData({ ...formData, name: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Foto de Perfil</label>
                            <div className="flex gap-4 items-center mt-1">
                                <div className="relative group">
                                    <div className="h-16 w-16 rounded-full overflow-hidden border-2 border-gray-200 bg-gray-50 flex items-center justify-center">
                                        {formData.photoUrl ? (
                                            <img
                                                src={formData.photoUrl}
                                                alt="Profile"
                                                className="h-full w-full object-cover"
                                                onError={(e) => (e.currentTarget.style.display = 'none')}
                                            />
                                        ) : (
                                            <UserIcon className="text-gray-400" size={32} />
                                        )}
                                    </div>
                                    <label className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-0 group-hover:bg-opacity-30 rounded-full cursor-pointer transition-all">
                                        <Upload className="text-white opacity-0 group-hover:opacity-100" size={20} />
                                        <input
                                            type="file"
                                            className="hidden"
                                            accept="image/*"
                                            onChange={handleFileChange}
                                            disabled={isUploading}
                                        />
                                    </label>
                                </div>
                                <div className="flex-1">
                                    <div className="flex flex-col gap-2">
                                        <p className="text-xs text-gray-500">JPG, PNG ou WebP. Máx 5MB.</p>
                                        <div className="flex gap-2">
                                            {isUploading && <span className="text-xs text-primary-600 font-medium animate-pulse">Enviando...</span>}
                                            {formData.photoUrl && (
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData({ ...formData, photoUrl: '' })}
                                                    className="text-xs text-red-600 hover:text-red-700 hover:underline"
                                                >
                                                    Remover Foto
                                                </button>
                                            )}
                                        </div>
                                        <input
                                            type="text"
                                            className={inputClass}
                                            value={formData.photoUrl || ''}
                                            onChange={e => setFormData({ ...formData, photoUrl: e.target.value })}
                                            placeholder="Ou cole uma URL aqui..."
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">CPF (Não editável)</label>
                            <input disabled type="text" className={`${inputClass} bg-gray-100 text-gray-500 cursor-not-allowed`} value={formatCPF(formData.cpf)} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Email</label>
                            <input type="email" className={inputClass} value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Telefone</label>
                            <input type="text" className={inputClass} value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Data de Nascimento</label>
                            <input type="date" className={inputClass} value={formData.birthDate} onChange={e => setFormData({ ...formData, birthDate: e.target.value })} />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Função</label>
                            <input disabled type="text" className={`${inputClass} bg-gray-100 text-gray-500`} value={formData.role} />
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Tamanhos de Uniforme</h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Macacão</label>
                                <select className={inputClass} value={formData.uniformSize?.jumpsuit} onChange={e => setFormData({ ...formData, uniformSize: { ...formData.uniformSize, jumpsuit: e.target.value } })}>
                                    {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Camisa</label>
                                <select className={inputClass} value={formData.uniformSize?.shirt} onChange={e => setFormData({ ...formData, uniformSize: { ...formData.uniformSize, shirt: e.target.value } })}>
                                    {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Calçado</label>
                                <select className={inputClass} value={formData.uniformSize?.shoes} onChange={e => setFormData({ ...formData, uniformSize: { ...formData.uniformSize, shoes: e.target.value } })}>
                                    {SHOE_SIZES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-6">
                        <h3 className="text-sm font-bold text-gray-900 mb-4">Tamanhos de EPI</h3>
                        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Calça</label>
                                <select className={inputClass} value={formData.ppeSize?.pants} onChange={e => setFormData({ ...formData, ppeSize: { ...formData.ppeSize, pants: e.target.value } })}>
                                    {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Blusão</label>
                                <select className={inputClass} value={formData.ppeSize?.jacket} onChange={e => setFormData({ ...formData, ppeSize: { ...formData.ppeSize, jacket: e.target.value } })}>
                                    {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Luva</label>
                                <select className={inputClass} value={formData.ppeSize?.gloves} onChange={e => setFormData({ ...formData, ppeSize: { ...formData.ppeSize, gloves: e.target.value } })}>
                                    {UNIFORM_SIZES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-500 mb-1">Bota de Combate</label>
                                <select className={inputClass} value={formData.ppeSize?.boots} onChange={e => setFormData({ ...formData, ppeSize: { ...formData.ppeSize, boots: e.target.value } })}>
                                    {SHOE_SIZES.map(s => <option key={s}>{s}</option>)}
                                </select>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-8 py-2.5 rounded-lg shadow-md font-semibold transition-all duration-200">
                            <Save size={20} />
                            <span>Salvar Alterações</span>
                        </button>
                    </div>
                </form>
            </div>

            <div className="bg-white shadow-sm rounded-lg border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center space-x-3">
                    <Lock className="text-primary-600" />
                    <h2 className="text-lg font-medium text-gray-900">Alterar Senha</h2>
                </div>
                <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Nova Senha</label>
                            <input
                                type="password"
                                required
                                className={inputClass}
                                value={newPassword}
                                onChange={e => setNewPassword(e.target.value)}
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Confirmar Nova Senha</label>
                            <input
                                type="password"
                                required
                                className={inputClass}
                                value={confirmPassword}
                                onChange={e => setConfirmPassword(e.target.value)}
                            />
                        </div>
                    </div>

                    {passwordMessage && (
                        <div className={`text-sm p-3 rounded ${passwordMessage.includes('sucesso') ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                            {passwordMessage}
                        </div>
                    )}

                    <div className="flex justify-end pt-4">
                        <button type="submit" className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-gray-800 to-gray-700 hover:from-gray-900 hover:to-gray-800 text-white px-8 py-2.5 rounded-lg shadow-md font-semibold transition-all duration-200">
                            <Lock size={18} />
                            <span>Atualizar Senha</span>
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};