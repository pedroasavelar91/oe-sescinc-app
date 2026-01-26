import React, { useState, useMemo } from 'react';
import { useStore } from '../context/AppStore';
import { UserRole, Folder, DocumentFile } from '../types';
import { Folder as FolderIcon, FileText, ChevronRight } from 'lucide-react';
import { FileUpload } from '../components/FileUpload';
import { StandardModal, StandardModalHeader, StandardModalBody, StandardModalFooter, inputClass, labelClass } from '../components/StandardModal';

export const DocumentsPage: React.FC = () => {
    const { currentUser, folders, documents, addFolder, updateFolder, deleteFolder, addDocument, deleteDocument, uploadDocument, getSignedDocumentUrl } = useStore();
    const [currentFolderId, setCurrentFolderId] = useState<string | null>(null);
    const [showFolderModal, setShowFolderModal] = useState(false);
    const [showDocModal, setShowDocModal] = useState(false);
    const [newFolderName, setNewFolderName] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [uploadingFile, setUploadingFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);
    const [newDocData, setNewDocData] = useState({ name: '', url: '', type: 'PDF' });
    const [renamingFolder, setRenamingFolder] = useState<Folder | null>(null);
    const [renameString, setRenameString] = useState('');

    if (!currentUser) return null;

    const canManageFolders = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR;
    const canUploadDocuments = currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR || currentUser.role === UserRole.INSTRUTOR;

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
        // 1. Check Location
        const isAtCurrentLocation = currentFolderId === null
            ? (!f.parentId || f.parentId === '' || f.parentId === 'null' || f.parentId === 'undefined')
            : (f.parentId === currentFolderId);

        if (!isAtCurrentLocation) return false;

        // 2. Check Permissions
        // Gestor and Coordenador see EVERYTHING
        if (currentUser.role === UserRole.GESTOR || currentUser.role === UserRole.COORDENADOR) return true;

        if (!f.allowedRoles || f.allowedRoles.length === 0) return true;
        return f.allowedRoles.includes(currentUser.role);
    });
    const currentDocs = documents.filter(d => {
        if (currentFolderId === null) {
            return !d.folderId || d.folderId === '';
        }
        return d.folderId === currentFolderId;
    });

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

    const handleStartRename = (folder: Folder) => {
        setRenamingFolder(folder);
        setRenameString(folder.name);
    };

    const handleConfirmRename = async () => {
        if (!renamingFolder || !renameString.trim()) return;

        const updatedFolder: Folder = {
            ...renamingFolder,
            name: renameString
        };

        await updateFolder(updatedFolder);
        setRenamingFolder(null);
        setRenameString('');
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
            alert('DIGITE UM NOME PARA O DOCUMENTO');
            return;
        }

        if (!uploadingFile) {
            alert('SELECIONE UM ARQUIVO');
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
            alert('ERRO AO FAZER UPLOAD: ' + (error as Error).message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleOpenDocument = async (doc: DocumentFile) => {
        try {
            // 1. Obter URL assinada
            const signedUrl = await getSignedDocumentUrl(doc.url);
            const targetUrl = signedUrl || doc.url;

            console.log('Tentando baixar:', targetUrl);

            // 2. Baixar o arquivo via fetch para contornar bloqueios do visualizador
            const response = await fetch(targetUrl);

            if (!response.ok) {
                throw new Error(`Erro ${response.status}: ${response.statusText}`);
            }

            const data = await response.blob();
            // Força o tipo PDF, pois às vezes o Supabase retorna octet-stream
            const blob = new Blob([data], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);

            // 3. Abrir o Blob (funciona melhor que link direto)
            const newTab = window.open(blobUrl, '_blank');

            // Fallback para download se popup bloquear
            if (!newTab) {
                const link = document.createElement('a');
                link.href = blobUrl;
                link.download = doc.name;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
            }

            // Limpar memória após 1 minuto
            setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);

        } catch (e) {
            console.error('Erro ao abrir documento:', e);
            alert(`NÃO FOI POSSÍVEL ABRIR O ARQUIVO. \nERRO: ${(e as Error).message}\n\nVERIFIQUE SE A POLÍTICA DE SEGURANÇA FOI SALVA CORRETAMENTE NO SUPABASE.`);
        }
    };

    const handleDownload = async (doc: DocumentFile) => {
        try {
            const signedUrl = await getSignedDocumentUrl(doc.url);
            const targetUrl = signedUrl || doc.url;
            console.log('Baixando para salvar:', targetUrl);

            const response = await fetch(targetUrl);
            if (!response.ok) throw new Error(`Erro HTTP: ${response.status}`);

            const arrayBuffer = await response.arrayBuffer();

            // Verificação de Integridade (Magic Bytes)
            if (doc.type === 'PDF') {
                const header = new Uint8Array(arrayBuffer.slice(0, 5));
                const headerString = String.fromCharCode(...header);
                if (headerString !== '%PDF-') {
                    // Se não começa com %PDF-, provavelmente é um erro XML/HTML do Supabase ou arquivo corrompido
                    const textDecoder = new TextDecoder();
                    const contentSample = textDecoder.decode(arrayBuffer.slice(0, 100)); // Lê o começo para debug
                    console.error('Conteúdo inválido encontrado:', contentSample);
                    alert(`O ARQUIVO BAIXADO NÃO É UM PDF VÁLIDO.\n\nTAMANHO: ${arrayBuffer.byteLength} BYTES\n\nPROVAVELMENTE O SUPABASE RETORNOU UMA PÁGINA DE ERRO (XML/HTML) EM VEZ DO ARQUIVO.\n\nCONTEÚDO INICIAL: ${contentSample}`);
                    return;
                }
            }

            // Se passou na validação, baixa
            const blob = new Blob([arrayBuffer], { type: 'application/pdf' });
            const blobUrl = window.URL.createObjectURL(blob);

            const link = document.createElement('a');
            link.href = blobUrl;
            link.download = doc.name;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

        } catch (e) {
            console.error('Erro no download:', e);
            alert('FALHA AO BAIXAR ARQUIVO: ' + (e as Error).message);
        }
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                {/* Header Controls */}
                <div className="flex flex-col md:flex-row justify-between items-center gap-4 animate-slide-down">
                    {/* Breadcrumbs */}
                    <div className="flex items-center text-sm text-gray-600 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <button
                            onClick={() => setCurrentFolderId(null)}
                            className="hover:text-primary-600 font-bold flex items-center uppercase"
                        >
                            RAIZ
                        </button>
                        {breadcrumbs.map(folder => (
                            <React.Fragment key={folder.id}>
                                <ChevronRight size={16} className="mx-2 text-gray-400" />
                                <button
                                    onClick={() => setCurrentFolderId(folder.id)}
                                    className="hover:text-primary-600 font-bold uppercase"
                                >
                                    {folder.name}
                                </button>
                            </React.Fragment>
                        ))}
                    </div>

                    {/* Action Buttons */}
                    {(canManageFolders || canUploadDocuments) && (
                        <div className="flex gap-2">
                            {canManageFolders && (
                                <button
                                    onClick={() => setShowFolderModal(true)}
                                    className="btn-base bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/30 px-6 py-2 uppercase font-bold"
                                >
                                    NOVA PASTA
                                </button>
                            )}
                            {canUploadDocuments && currentFolderId !== null && (
                                <button
                                    onClick={() => setShowDocModal(true)}
                                    className="btn-base btn-insert shadow-lg shadow-green-500/30 px-6 py-2 uppercase font-bold"
                                >
                                    NOVO ARQUIVO
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Content Grid */}
                <div className="card-premium animate-fade-in text-gray-800">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        {/* Folders */}
                        {currentFolders.map(folder => (
                            <div
                                key={folder.id}
                                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer group relative"
                                style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #FF6B35' }}
                                onClick={() => setCurrentFolderId(folder.id)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FolderIcon className="text-yellow-500 fill-current" size={32} />
                                    {canManageFolders && (
                                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                                            <button
                                                onClick={(e) => { e.stopPropagation(); handleStartRename(folder); }}
                                                className="text-white hover:text-white bg-blue-500 hover:bg-blue-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors"
                                                title="RENOMEAR PASTA"
                                            >
                                                RENOMEAR
                                            </button>
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteFolder(folder.id); }}
                                                className="text-white hover:text-white bg-red-500 hover:bg-red-600 px-2 py-0.5 rounded text-[10px] font-bold uppercase transition-colors"
                                                title="EXCLUIR PASTA"
                                            >
                                                EXCLUIR
                                            </button>
                                        </div>
                                    )}
                                </div>
                                <h3 className="font-bold text-gray-900 truncate uppercase">{folder.name}</h3>
                                <div className="flex justify-between items-center mt-2">
                                    <p className="text-xs text-gray-500">{new Date(folder.createdAt).toLocaleDateString()}</p>
                                    {folder.allowedRoles && folder.allowedRoles.length > 0 ? (
                                        <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded border border-red-200 font-bold uppercase" title={`Restrito a: ${folder.allowedRoles.join(', ')}`}>
                                            RESTRITO
                                        </span>
                                    ) : (
                                        <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded border border-green-200 font-bold uppercase">
                                            PÚBLICO
                                        </span>
                                    )}
                                </div>
                            </div>
                        ))}

                        {/* Documents */}
                        {currentDocs.map(doc => (
                            <div
                                key={doc.id}
                                className="bg-white p-4 rounded-lg shadow-sm hover:shadow-md transition cursor-pointer group relative"
                                style={{ border: '1px solid #E5E7EB', borderLeft: '4px solid #FF6B35' }}
                                onClick={() => handleOpenDocument(doc)}
                            >
                                <div className="flex items-center justify-between mb-2">
                                    <FileText className="text-blue-500" size={32} />
                                    <div className="flex space-x-1">
                                        <button
                                            onClick={(e) => { e.stopPropagation(); handleDownload(doc); }}
                                            className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 px-2 py-1 rounded transition text-[10px] font-bold uppercase"
                                            title="BAIXAR ARQUIVO"
                                        >
                                            BAIXAR
                                        </button>
                                        {(canManageFolders || doc.uploadedBy === currentUser.id) && (
                                            <button
                                                onClick={(e) => { e.stopPropagation(); deleteDocument(doc.id); }}
                                                className="text-red-600 hover:text-red-800 hover:bg-red-50 px-2 py-1 rounded transition text-[10px] font-bold uppercase"
                                                title="EXCLUIR ARQUIVO"
                                            >
                                                EXCLUIR
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <h3 className="font-bold text-gray-900 truncate uppercase" title={doc.name}>{doc.name}</h3>
                                <p className="text-xs text-gray-500 uppercase">{doc.type} • {new Date(doc.uploadedAt).toLocaleDateString()}</p>
                            </div>
                        ))}

                        {currentFolders.length === 0 && currentDocs.length === 0 && (
                            <div className="col-span-full text-center py-12 text-gray-400 italic uppercase">
                                ESTA PASTA ESTÁ VAZIA.
                            </div>
                        )}
                    </div>
                </div>

            </div>

            {/* Create Folder Modal */}
            <StandardModal isOpen={showFolderModal} onClose={() => { setShowFolderModal(false); setSelectedRoles([]); }}>
                <StandardModalHeader title="" onClose={() => { setShowFolderModal(false); setSelectedRoles([]); }} />
                <StandardModalBody>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>NOME DA PASTA</label>
                            <input
                                className={inputClass}
                                placeholder="DIGITE O NOME DA PASTA"
                                value={newFolderName}
                                onChange={e => setNewFolderName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div>
                            <label className={labelClass}>CONTROLE DE ACESSO</label>
                            <p className="text-xs text-gray-500 mb-3 uppercase">SELECIONE QUEM PODE VISUALIZAR ESTA PASTA. SE NENHUM FOR SELECIONADO, A PASTA SERÁ PÚBLICA.</p>

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
                                        <span className="text-sm font-medium text-gray-700 uppercase">{role}</span>
                                    </label>
                                ))}
                            </div>

                            {selectedRoles.length === 0 && (
                                <p className="text-xs text-green-600 mt-2 flex items-center uppercase font-bold">
                                    <span className="mr-1">✓</span> PASTA PÚBLICA (TODOS PODEM VER)
                                </p>
                            )}
                            {selectedRoles.length > 0 && (
                                <p className="text-xs text-primary-600 mt-2 uppercase font-bold">
                                    ACESSO RESTRITO A: {selectedRoles.join(', ')}
                                </p>
                            )}
                        </div>
                    </div>
                </StandardModalBody>
                <StandardModalFooter>
                    <button
                        onClick={() => { setShowFolderModal(false); setSelectedRoles([]); }}
                        className="btn-base bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 px-6 py-2 uppercase font-bold"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleCreateFolder}
                        className="btn-base btn-insert shadow-lg shadow-green-500/30"
                    >
                        CRIAR PASTA
                    </button>
                </StandardModalFooter>
            </StandardModal>

            {/* Add Document Modal */}
            <StandardModal isOpen={showDocModal} onClose={() => setShowDocModal(false)}>
                <StandardModalHeader title="" onClose={() => setShowDocModal(false)} />
                <StandardModalBody>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>NOME</label>
                            <input
                                className={inputClass}
                                value={newDocData.name}
                                onChange={e => setNewDocData({ ...newDocData, name: e.target.value })}
                                placeholder="EX: MANUAL DE PROCEDIMENTOS"
                            />
                        </div>
                        <div>
                            <label className={labelClass}>ARQUIVO</label>
                            <FileUpload
                                onFileSelect={setUploadingFile}
                                accept="application/pdf,image/*"
                                maxSize={50}
                                label="CLIQUE PARA SELECIONAR ARQUIVO"
                            />
                        </div>
                    </div>
                </StandardModalBody>
                <StandardModalFooter>
                    <button
                        onClick={() => setShowDocModal(false)}
                        className="btn-base bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 px-6 py-2 uppercase font-bold"
                        disabled={isUploading}
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleAddDocument}
                        className="btn-base btn-insert shadow-lg shadow-green-500/30 disabled:opacity-50"
                        disabled={isUploading}
                    >
                        {isUploading ? 'ENVIANDO...' : 'ADICIONAR'}
                    </button>
                </StandardModalFooter>
            </StandardModal>

            {/* Rename Folder Modal */}
            <StandardModal isOpen={!!renamingFolder} onClose={() => setRenamingFolder(null)}>
                <StandardModalHeader title="" onClose={() => setRenamingFolder(null)} />
                <StandardModalBody>
                    <div className="space-y-4">
                        <div>
                            <label className={labelClass}>NOVO NOME</label>
                            <input
                                className={inputClass}
                                value={renameString}
                                onChange={e => setRenameString(e.target.value)}
                                autoFocus
                                placeholder="NOME DA PASTA"
                            />
                            <p className="text-xs text-gray-500 mt-1 uppercase">DICA: O SISTEMA DIFERENCIA MAIÚSCULAS DE MINÚSCULAS.</p>
                        </div>
                    </div>
                </StandardModalBody>
                <StandardModalFooter>
                    <button
                        onClick={() => setRenamingFolder(null)}
                        className="btn-base bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 px-6 py-2 uppercase font-bold"
                    >
                        CANCELAR
                    </button>
                    <button
                        onClick={handleConfirmRename}
                        className="btn-base btn-insert shadow-lg shadow-green-500/30"
                    >
                        SALVAR
                    </button>
                </StandardModalFooter>
            </StandardModal>
        </>
    );
};

