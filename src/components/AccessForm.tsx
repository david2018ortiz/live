'use client'

import { useState } from 'react'
import { validateAccessCode } from '@/app/actions'
import { useRouter } from 'next/navigation'
import { StyledButton } from './StyledButtons'

interface AccessFormProps {
    dict?: any
}

export default function AccessForm({ dict }: AccessFormProps) {
    const [loading, setLoading] = useState(false)
    const router = useRouter()

    return (
        <div className="bg-white p-8 rounded-xl border border-gray-200 w-full max-w-md mx-auto shadow-sm">
            <div className="text-center mb-8">
                <h2 className="text-xl font-bold text-gray-900 mb-2 tracking-tight">
                    Bienvenido
                </h2>
                <p className="text-sm text-gray-500">
                    Ingresa tus datos para continuar
                </p>
            </div>

            <form action={async (formData) => {
                setLoading(true)
                const res = await validateAccessCode(formData)
                if (res?.error) {
                    alert(res.error)
                    setLoading(false)
                } else {
                    window.location.reload()
                }
            }}>
                <div className="mb-6">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                        Número de Teléfono
                    </label>
                    <input
                        name="phone"
                        type="tel"
                        required
                        placeholder="+1 234 567 890"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none text-gray-900 transition-all focus:border-black focus:bg-white focus:ring-1 focus:ring-black/5"
                    />
                </div>

                <div className="mb-8">
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                        Código de Acceso
                    </label>
                    <input
                        name="code"
                        type="text"
                        required
                        placeholder="ABCD-1234"
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-sm outline-none text-gray-900 font-mono tracking-widest transition-all focus:border-black focus:bg-white focus:ring-1 focus:ring-black/5"
                    />
                </div>

                <StyledButton type="submit" variant="primary" fullWidth disabled={loading}>
                    {loading ? 'Verificando...' : 'Ingresar'}
                </StyledButton>
            </form>
        </div>
    )
}
