import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, Folder, DocumentFile } from '../types';
import { Folder as FolderIcon, FileText, Plus, Trash2, Download, Search, ChevronRight, Upload } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';

export const DocumentsPage: React.FC = () => {
    const { currentUser, folders, documents, addFolder, deleteFolder, addDocument, deleteDocument, uploadDocument } = useStore();
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [newDocData, setNewDocData] = useState({ name: '', url: '', type: 'PDF' });

    if (!currentUser) return null;

    const canManage = currentUser.role === UserRole.GESTOR;

    // Available roles for selection
    const availableRoles = [
        'Motorista',
        'Instrutor',
        'Coordenador',
        'Gestor',
        'Administrador',
        'Embaixador'
    ];

    // Navigation Breadcrumbs
    const breadcrumbs = useMemo(() => {
        const path: Folder[] = [];
        let current = folders.find(f => f.id === currentFolderId);
        while (current) {
            path.unshift(current);
            current = folders.find(f => f.id === current?.parentId);
        }
        return path;
    }, [currentFolderId, folders]);

    // Filtered Content - only show folders user has access to
    const currentFolders = folders.filter(f => {
        if (f.parentId !== currentFolderId) return false;
        // If no roles specified, folder is public
        if (!f.allowedRoles || f.allowedRoles.length === 0) return true;
        // Check if user's role is in allowed roles
        return f.allowedRoles.includes(currentUser.role);
    });
    const currentDocs = documents.filter(d => d.folderId === currentFolderId);

    const handleCreateFolder = () => {
        if (!newFolderName) return;
        const folder: Folder = {
            id: Math.random().toString(36).substr(2, 9),
            name: newFolderName,
            parentId: currentFolderId ?? undefined,
            allowedRoles: selectedRoles.length > 0 ? selectedRoles : [], // Empty array = public
            createdBy: currentUser.id,
            createdAt: new Date().toISOString()
        };
        addFolder(folder);
        setNewFolderName('');
        setSelectedRoles([]);
        setShowFolderModal(false);
    };

    const toggleRole = (role: string) => {
        setSelectedRoles(prev =>
            prev.includes(role)
                ? prev.filter(r => r !== role)
                : [...prev, role]
        );
    };

    const handleAddDocument = async () => {
        if (!newDocData.name) {
            alert('Digite um nome para o documento');
            return;
        }

        if (!uploadingFile) {
            alert('Selecione um arquivo');
            return;
        }

        try {
            setIsUploading(true);

            // Upload do arquivo
            const url = await uploadDocument(uploadingFile, currentFolderId);

            // Criar registro do documento
            const doc: DocumentFile = {
                id: Math.random().toString(36).substr(2, 9),
                folderId: currentFolderId ?? '',
                name: newDocData.name,
                url: url,
                type: uploadingFile.type.includes('pdf') ? 'PDF' :
                    uploadingFile.type.includes('image') ? 'Image' : 'Other',
                size: uploadingFile.size.toString(),
                uploadedBy: currentUser.id,
                uploadedAt: new Date().toISOString()
            };

            addDocument(doc);
            setNewDocData({ name: '', url: '', type: 'PDF' });
            setUploadingFile(null);
            setShowDocModal(false);
        } catch (error) {
            alert('Erro ao fazer upload: ' + (error as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";

    return (
        <div className="space-y-6 animate-fade-in">
            <div className="flex justify-between items-center animate-slide-down">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Documentos</h1>
                    <p className="text-gray-500 mt-1">Gestão de arquivos e procedimentos</p>
                </div>
                {canManage && (
                    <div className="flex gap-2">
                        <button
                            onClick={() => setShowFolderModal(true)}
                            className="flex items-center space-x-2 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 transition"
                        >
                            <Plus size={18} /> <span>Nova Pasta</span>
                        </button>
                        <button
                            onClick={() => setShowDocModal(true)}
                            className="btn-premium flex items-center space-x-2 bg-gradient-to-r from-primary-600 to-primary-500 hover:from-primary-700 hover:to-primary-600 text-white px-4 py-2 rounded-lg shadow-md transition"
                        >
                            <Upload size={18} /> <span>Novo Arquivo</span>
                        </button>
                    </div>
                )}
            </div>

            {/* Breadcrumbs */}
            <div className="flex items-center text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                <button
                    onClick={() => setCurrentFolderId(null)}
                    className="hover:text-primary-600 font-medium flex items-center"
                >
                    Raiz
                </button>
                {breadcrumbs.map(folder => (
                    <React.Fragment key={folder.id}>
                        <ChevronRight size={16} className="mx-2 text-gray-400" />
                        <button
                            onClick={() => setCurrentFolderId(folder.id)}
                            className="hover:text-primary-600 font-medium"
                        >
                            {folder.name}
                        </button>
                    </React.Fragment>
                ))}
            </div>

            {/* Content Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                {/* Folders */}
                {currentFolders.map(folder => (
                    <div
                        key={folder.id}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition cursor-pointer group relative"
                        onClick={() => setCurrentFolderId(folder.id)}
                    >
                        <div className="flex items-center justify-between mb-2">
                            <FolderIcon className="text-yellow-500 fill-current" size={32} />
                            {canManage && (
                                <button
                                    onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                    className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Trash2 size={16} />
                                </button>
                            )}
                        </div>
                        <h3 className="font-medium text-gray-900 truncate">{folder.name}</h3>
                        <p className="text-xs text-gray-500">{new Date(folder.createdAt).toLocaleDateString()}</p>
                    </div>
                ))}

                {/* Documents */}
                {currentDocs.map(doc => (
                    <div
                        key={doc.id}
                        className="bg-white p-4 rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition group relative"
                    >
                        <div className="flex items-center justify-between mb-2">
                            <FileText className="text-blue-500" size={32} />
                            <div className="flex gap-1">
                                <a
                                    href={doc.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-gray-400 hover:text-primary-500 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Download size={16} />
                                </a>
                                {canManage && (
                                    <button
                                        onClick={() => deleteDocument(doc.id)}
                                        className="text-gray-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                )}
                            </div>
                        </div>
                        <h3 className="font-medium text-gray-900 truncate" title={doc.name}>{doc.name}</h3>
                        <p className="text-xs text-gray-500">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                    </div>
                ))}

                {currentFolders.length === 0 && currentDocs.length === 0 && (
                    <div className="col-span-full text-center py-12 text-gray-400 italic">
                        Esta pasta está vazia.
                    </div>
                )}
            </div>

            {/* Create Folder Modal */}
            {showFolderModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 animate-fade-in">
                    <div className="bg-white p-6 rounded-xl shadow-2xl w-full max-w-md animate-scale-in">
                        <h3 className="text-lg font-bold mb-4 text-gray-900">Nova Pasta</h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nome da Pasta</label>
                                <input
                                    className={inputClass}
                                    placeholder="Digite o nome da pasta"
                                    value={newFolderName}
                                    onChange={e => setNewFolderName(e.target.value)}
                                    autoFocus
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Controle de Acesso</label>
                                <p className="text-xs text-gray-500 mb-3">Selecione quem pode visualizar esta pasta. Se nenhum for selecionado, a pasta será pública.</p>

                                <div className="grid grid-cols-2 gap-2">
                                    {availableRoles.map(role => (
                                        <label
                                            key={role}
                                            className={`flex items-center space-x-2 p-2 rounded-lg border-2 cursor-pointer transition-all ${selectedRoles.includes(role)
                                                ? 'border-primary-500 bg-primary-50'
                                                : 'border-gray-200 hover:border-gray-300 bg-white'
                                                }`}
                                        >
                                            <input
                                                type="checkbox"
                                                checked={selectedRoles.includes(role)}
                                                onChange={() => toggleRole(role)}
                                                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                                            />
                                            <span className="text-sm font-medium text-gray-700">{role}</span>
                                        </label>
                                    ))}
                                </div>

                                {selectedRoles.length === 0 && (
                                    <p className="text-xs text-green-600 mt-2 flex items-center">
                                        <span className="mr-1">✓</span> Pasta pública (todos podem ver)
                                    </p>
                                )}
                                {selectedRoles.length > 0 && (
                                    <p className="text-xs text-primary-600 mt-2">
                                        Acesso restrito a: {selectedRoles.join(', ')}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => { setShowFolderModal(false); setSelectedRoles([]); }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium transition"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleCreateFolder}
                                className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 font-medium shadow-md transition"
                            >
                                Criar Pasta
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Add Document Modal */}
            {showDocModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg shadow-xl w-96 animate-scale-in">
                        <h3 className="text-lg font-bold mb-4">Novo Documento</h3>
                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Nome</label>
                                <input
                                    className={inputClass}
                                    value={newDocData.name}
                                    onChange={e => setNewDocData({ ...newDocData, name: e.target.value })}
                                    placeholder="Ex: Manual de Procedimentos"
                                />
                            </div>
                            <div>
                                <label className="block text-xs font-medium text-gray-700 mb-1">Arquivo</label>
                                <FileUpload
                                    onFileSelect={setUploadingFile}
                                    accept="application/pdf,image/*"
                                    maxSize={50}
                                    label="Clique para selecionar arquivo"
                                />
                            </div>
                        </div>
                        <div className="flex justify-end gap-2 mt-6">
                            <button
                                onClick={() => setShowDocModal(false)}
                                className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded"
                                disabled={isUploading}
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleAddDocument}
                                className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
                                disabled={isUploading}
                            >
                                {isUploading ? 'Enviando...' : 'Adicionar'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
