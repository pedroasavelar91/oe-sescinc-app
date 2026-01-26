import React, { ReactNode } from 'react';

interface StandardCardProps {
    children: ReactNode;
    onClick?: () => void;
    accentColor?: string; // Hex code or Tailwind class for the left strip
    className?: string;
    dimmed?: boolean;
}

export const StandardCard: React.FC<StandardCardProps> = ({
    children,
    onClick,
    accentColor,
    className = '',
    dimmed = false
}) => {
    return (
        <div
            onClick={onClick}
            className={`
                bg-white rounded-xl border border-gray-200 shadow-sm 
                hover:shadow-lg hover:-translate-y-1 transition-all duration-300 
                relative overflow-hidden group/card 
                ${dimmed ? 'opacity-70' : ''} 
                ${onClick ? 'cursor-pointer' : ''} 
                ${className}
            `}
        >
            {accentColor && (
                <div
                    className="absolute left-0 top-0 bottom-0 w-1.5"
                    style={{ backgroundColor: accentColor.startsWith('#') || accentColor.startsWith('rgb') ? accentColor : undefined }}
                ></div>
            )}
            {children}
        </div>
    );
};
