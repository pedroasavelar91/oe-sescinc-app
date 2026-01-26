import React, { Fragment } from 'react';
import { Trash2, X, AlertTriangle } from 'lucide-react';

// ==========================================
// Types
// ==========================================

export type PremiumColor = 'orange' | 'green' | 'blue' | 'red';

interface PremiumButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: PremiumColor;
    className?: string; // For padding, text size, width, etc.
}

interface PremiumInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
    uppercase?: boolean;
}

interface PremiumSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    uppercase?: boolean;
}

interface PremiumModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    children: React.ReactNode;
    headerAction?: React.ReactNode;
    maxWidth?: string; // e.g. 'max-w-4xl', 'max-w-[95%]'
    icon?: React.ReactNode;
}

interface DeleteConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title?: string;
    message: React.ReactNode;
    confirmText?: string;
    cancelText?: string;
}

// ==========================================
// Components
// ==========================================

/**
 * Premium Button
 * Applies the standard gradient, shimmer, shadow, and hover effects.
 * Usage: <PremiumButton variant="green" onClick={...}>TEXT</PremiumButton>
 */
export const PremiumButton: React.FC<PremiumButtonProps> = ({
    variant = 'orange',
    className = '',
    children,
    ...props
}) => {
    // Maps variant to the specific CSS classes defined in index.css
    const colorClasses = {
        orange: 'btn-premium-orange btn-premium-shimmer-orange',
        green: 'btn-premium-green btn-premium-shimmer-green',
        blue: 'btn-premium-blue btn-premium-shimmer-blue',
        red: 'btn-premium-red btn-premium-shimmer-red',
    };

    return (
        <button
            className={`btn-premium ${colorClasses[variant]} login-uppercase rounded-lg ${className}`}
            {...props}
        >
            {children}
        </button>
    );
};

/**
 * Premium Input
 * Standard styled input with optional uppercase enforcement.
 */
export const PremiumInput: React.FC<PremiumInputProps> = ({
    className = '',
    uppercase = true,
    ...props
}) => {
    const baseClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";
    const caseClass = uppercase ? "" : "no-uppercase";

    return (
        <input
            className={`${baseClass} ${caseClass} ${className}`}
            {...props}
        />
    );
};

/**
 * Premium Select
 * Standard styled select.
 */
export const PremiumSelect: React.FC<PremiumSelectProps> = ({
    className = '',
    children,
    uppercase = true,
    ...props
}) => {
    const baseClass = "appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm bg-white text-gray-900";
    const caseClass = uppercase ? "" : "no-uppercase";

    return (
        <select
            className={`${baseClass} ${caseClass} ${className}`}
            {...props}
        >
            {children}
        </select>
    );
};

/**
 * Premium Modal
 * The standard modal with backdrop, orange bottom border header, and scale animation.
 */
export const PremiumModal: React.FC<PremiumModalProps> = ({
    isOpen,
    onClose,
    title,
    children,
    headerAction,
    maxWidth = 'max-w-4xl',
    icon
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 10000 }}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div
                className={`bg-white w-full ${maxWidth} max-h-[90vh] overflow-y-auto relative z-10 animate-scale-in`}
                style={{
                    border: '1px solid #E5E7EB',
                    boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04), 0 0 0 1px rgba(0, 0, 0, 0.05)'
                }}
            >
                <div className="p-6 flex justify-between items-center sticky top-0 bg-white z-10" style={{ borderBottom: '2px solid #FF6B35' }}>
                    <h3 className="text-xl font-bold login-uppercase flex items-center" style={{ color: '#1F2937' }}>
                        {icon && <span className="mr-2" style={{ color: '#FF6B35' }}>{icon}</span>}
                        {title}
                    </h3>
                    {headerAction && (
                        <div>{headerAction}</div>
                    )}
                    {!headerAction && (
                        <PremiumButton variant="red" onClick={onClose} className="px-4 py-2 text-xs">
                            FECHAR
                        </PremiumButton>
                    )}
                </div>

                <div className="p-6">
                    {children}
                </div>
            </div>
        </div>
    );
};

/**
 * Delete Confirmation Modal
 * Centralized modal for dangerous actions.
 */
export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title = "Confirmar Exclusão",
    message,
    confirmText = "SIM",
    cancelText = "NÃO"
}) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 flex items-center justify-center p-4" style={{ zIndex: 11000 }}>
            <div className="absolute inset-0 bg-black/20 backdrop-blur-sm" onClick={onClose} />
            <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-md relative z-10 text-center animate-scale-in" style={{ border: '1px solid #E5E7EB' }}>
                <div className="mb-4">
                    <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 size={32} className="text-red-500" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 mb-2">{title}</h3>
                    <div className="text-gray-600">
                        {message}
                    </div>
                    <p className="text-xs text-gray-500 mt-2">Esta ação não pode ser desfeita.</p>
                </div>
                <div className="flex justify-center space-x-3">
                    <PremiumButton
                        variant="red"
                        onClick={onClose}
                        className="px-6 py-2 text-sm w-32"
                    >
                        {cancelText}
                    </PremiumButton>
                    <PremiumButton
                        variant="green"
                        onClick={onConfirm}
                        className="px-6 py-2 text-sm w-32"
                    >
                        {confirmText}
                    </PremiumButton>
                </div>
            </div>
        </div>
    );
};
