'use client'

import { ButtonHTMLAttributes, ReactNode } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    variant?: 'primary' | 'secondary' | 'danger' | 'success'
    fullWidth?: boolean
}

export function StyledButton({ children, variant = 'primary', fullWidth, className = '', ...props }: ButtonProps) {
    const baseClasses = "px-6 py-3 text-sm font-bold uppercase cursor-pointer transition-all duration-200 border-2 disabled:opacity-50 disabled:cursor-not-allowed"
    const widthClass = fullWidth ? 'w-full' : 'w-auto'
    const hoverEffects = !props.disabled ? 'hover:-translate-y-0.5 hover:shadow-lg' : ''

    const variants = {
        primary: "bg-black text-white border-black hover:bg-gray-900",
        secondary: "bg-white text-black border-gray-200 hover:bg-gray-50",
        danger: "bg-red-600 text-white border-red-600 hover:bg-red-700",
        success: "bg-green-600 text-white border-green-600 hover:bg-green-700"
    }

    return (
        <button
            {...props}
            className={`${baseClasses} ${widthClass} ${hoverEffects} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    )
}

interface SmallButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    children: ReactNode
    variant?: 'primary' | 'danger' | 'success' | 'secondary'
}

export function SmallButton({ children, variant = 'secondary', className = '', ...props }: SmallButtonProps) {
    const baseClasses = "px-3 py-1.5 text-xs font-bold uppercase cursor-pointer transition-colors duration-200 border rounded"

    const variants = {
        primary: "bg-black text-white border-black hover:bg-gray-800",
        secondary: "bg-white text-black border-gray-200 hover:bg-gray-50",
        danger: "bg-red-600 text-white border-red-600 hover:bg-red-700",
        success: "bg-green-600 text-white border-green-600 hover:bg-green-700"
    }

    return (
        <button
            {...props}
            className={`${baseClasses} ${variants[variant]} ${className}`}
        >
            {children}
        </button>
    )
}
