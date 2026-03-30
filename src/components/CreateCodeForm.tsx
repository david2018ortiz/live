'use client'

import { useActionState, useState } from 'react'
import { createAccessCode } from '@/app/admin/actions'
import { SmallButton } from './StyledButtons'

async function createAction(prevState: any, formData: FormData) {
    return await createAccessCode(formData)
}

export default function CreateCodeForm() {
    const [state, dispatch, isPending] = useActionState(createAction, null)
    const [isCustom, setIsCustom] = useState(false)

    return (
        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6 mb-6 md:mb-8">
            <form action={dispatch} className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
                <input
                    name="phone"
                    type="text"
                    placeholder="Teléfono del Cliente"
                    required
                    className="w-full px-3 py-2 rounded border border-gray-200 outline-none focus:border-gray-900 transition-colors"
                />

                <div className="flex gap-2">
                    <select
                        name={isCustom ? "duration_select" : "duration"}
                        onChange={(e) => setIsCustom(e.target.value === 'custom')}
                        className="flex-1 px-3 py-2 rounded border border-gray-200 bg-white outline-none focus:border-gray-900 transition-colors"
                    >
                        <option value="5">5 Minutos</option>
                        <option value="15">15 Minutos</option>
                        <option value="30">30 Minutos</option>
                        <option value="60">1 Hora</option>
                        <option value="custom">Personalizado</option>
                    </select>

                    {isCustom && (
                        <input
                            name="duration"
                            type="number"
                            placeholder="Min"
                            required
                            min="1"
                            className="w-16 sm:w-20 px-2 py-2 rounded border border-gray-200 outline-none focus:border-gray-900"
                        />
                    )}
                </div>

                <SmallButton type="submit" variant="primary" disabled={isPending}>
                    {isPending ? 'Generando...' : 'Generar'}
                </SmallButton>
            </form>

            {state?.success && state.code && (
                <div className="mt-4 p-3 md:p-4 bg-green-50 border border-green-200 rounded text-green-900">
                    <strong>Código Generado:</strong> <span className="font-mono text-lg md:text-xl ml-2">{state.code}</span>
                </div>
            )}
            {state?.error && (
                <div className="mt-4 text-red-500 text-sm">
                    Error: {state.error}
                </div>
            )}
        </div>
    )
}
