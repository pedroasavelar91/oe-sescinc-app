import React from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string | number;
    label: string;
}

interface StandardSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
    options: Option[];
    placeholder?: string;
    className?: string;
    label?: string;
    disableSort?: boolean;
}

export const StandardSelect: React.FC<StandardSelectProps> = ({
    options,
    placeholder,
    className = '',
    value,
    label,
    disableSort = false,
    ...props
}) => {
    // Sort options alphabetically by label (case-insensitive) unless disabled
    const sortedOptions = disableSort
        ? options
        : [...options].sort((a, b) =>
            a.label.toString().localeCompare(b.label.toString(), undefined, { sensitivity: 'base' })
        );

    return (
        <div className={`relative ${className}`}>
            {label && (
                <label className="block text-xs font-bold uppercase tracking-wider mb-1 text-gray-500">
                    {label}
                </label>
            )}
            <div className="relative">
                <select
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-[#FF6B35] focus:border-[#FF6B35] sm:text-sm bg-white text-gray-900 uppercase transition-all duration-200 cursor-pointer"
                    value={value}
                    {...props}
                >
                    {placeholder && (
                        <option value="" className="text-gray-400">
                            {placeholder.toUpperCase()}
                        </option>
                    )}
                    {sortedOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                            {option.label.toUpperCase()}
                        </option>
                    ))}
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-500">
                    <ChevronDown size={14} />
                </div>
            </div>
        </div>
    );
};
