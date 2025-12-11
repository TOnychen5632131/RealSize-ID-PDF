import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary';
    isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
    children,
    variant = 'primary',
    isLoading,
    className = '',
    disabled,
    ...props
}) => {
    return (
        <button
            className={`btn btn-${variant} ${className}`}
            disabled={isLoading || disabled}
            {...props}
        >
            {isLoading ? 'Loading...' : children}
        </button>
    );
};
