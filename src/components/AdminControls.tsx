'use client'

import { useActionState } from 'react'
import { endRoom, revokeAccessCode } from '@/app/admin/actions'
import { SmallButton } from './StyledButtons'
import { logout } from '@/app/actions'

async function endRoomAction(prevState: any, roomId: string) {
    try {
        await endRoom(roomId)
        return { success: true }
    } catch (e) {
        return { error: 'Error al finalizar' }
    }
}

export function EndRoomButton({ roomId }: { roomId: string }) {
    const actionWithId = endRoomAction.bind(null, null, roomId)
    const [state, dispatch, isPending] = useActionState(actionWithId, null)

    return (
        <form action={dispatch}>
            <SmallButton type="submit" variant="danger" disabled={isPending}>
                {isPending ? 'Cerrando...' : 'FINALIZAR'}
            </SmallButton>
            {state?.error && <span className="text-red-500 text-xs ml-2">Error</span>}
        </form>
    )
}

async function revokeCodeAction(prevState: any, codeId: string) {
    try {
        await revokeAccessCode(codeId)
        return { success: true }
    } catch (e) {
        return { error: 'Error' }
    }
}

export function RevokeButton({ codeId }: { codeId: string }) {
    const actionWithId = revokeCodeAction.bind(null, null, codeId)
    const [state, dispatch, isPending] = useActionState(actionWithId, null)

    return (
        <form action={dispatch}>
            <SmallButton type="submit" variant="danger" disabled={isPending}>
                {isPending ? '...' : 'REVOCAR'}
            </SmallButton>
        </form>
    )
}

export function LogoutButton() {
    const [state, dispatch, isPending] = useActionState(async () => {
        await logout()
    }, null)

    return (
        <form action={dispatch}>
            <SmallButton
                type="submit"
                variant="danger"
                disabled={isPending}
                className={isPending ? "opacity-70 cursor-wait" : ""}
            >
                {isPending ? 'Saliendo...' : 'Cerrar Sesión'}
            </SmallButton>
        </form>
    )
}
