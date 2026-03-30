'use client'

import { useActionState } from 'react'
import { startStream } from '@/app/model/actions'
import { StyledButton } from './StyledButtons'

async function startAction(prevState: any, formData: FormData) {
    return await startStream(formData)
}

export default function StartStreamForm() {
    const [state, dispatch, isPending] = useActionState(startAction, null)

    return (
        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">
            <h2 className="text-lg font-semibold mb-6 text-center">
                Iniciar Nueva Transmisión
            </h2>

            <form action={dispatch} className="flex flex-col gap-6">
                <div>
                    <label className="block text-xs font-bold uppercase text-gray-500 mb-2 tracking-wider">
                        Título de la Sala
                    </label>
                    <input
                        name="title"
                        type="text"
                        required
                        placeholder="Ej: Noche especial..."
                        className="w-full px-4 py-3 rounded-lg border border-gray-200 bg-gray-50 text-base outline-none text-gray-900 transition-all focus:border-black focus:bg-white focus:ring-1 focus:ring-black/5"
                    />
                </div>

                {state?.error && (
                    <div className="text-red-500 text-sm text-center font-medium">
                        {state.error}
                    </div>
                )}

                <StyledButton type="submit" variant="primary" fullWidth disabled={isPending}>
                    {isPending ? 'Iniciando...' : 'COMENZAR LIVE'}
                </StyledButton>
            </form>
        </div>
    )
}
