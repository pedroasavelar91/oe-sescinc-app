import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';

interface ModalProps {
    isOpen: boolean;
    onClose: () => void;
    children: React.ReactNode;
    maxWidth?: string;
}

export const StandardModal: React.FC<ModalProps> = ({ isOpen, onClose, children, maxWidth = 'max-w-[95%]' }) => {
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/20 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            />

            {/* Modal Container */}
            <div
                className={`bg-white w-full ${maxWidth} max-h-[90vh] overflow-y-auto relative z-10 rounded-lg animate-scale-in`}
                style={{
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
            >
                {children}
            </div>
        </div>,
        document.body
    );
};

export const StandardModalHeader: React.FC<{ title: string; onClose: () => void }> = ({ title, onClose }) => (
    <div className="p-4 sm:p-6 flex justify-between items-center sticky top-0 bg-white z-20" style={{ borderBottom: '2px solid #FF6B35' }}>
        <h2 className="text-lg sm:text-xl font-bold uppercase flex items-center gap-2" style={{ color: '#1F2937' }}>
            {title}
        </h2>
        <button
            onClick={onClose}
            className="btn-base btn-delete px-4 py-2 text-xs"
        >
            FECHAR
        </button>
    </div>
);

export const StandardModalBody: React.FC<{ children: React.ReactNode }> = ({ children }) => (
    <div className="p-4 sm:p-6 space-y-5 overflow-y-auto custom-scrollbar">
        {children}
    </div>
);

export const StandardModalFooter: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = '' }) => (
    <div className={`p-4 sm:p-6 border-t border-gray-100 flex flex-col sm:flex-row justify-end gap-3 sticky bottom-0 bg-white z-20 ${className}`}>
        {children}
    </div>
);

export const inputClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";
export const labelClass = "block text-xs font-bold text-gray-700 uppercase tracking-wider mb-1";
