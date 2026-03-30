'use client'

import { logout } from '@/app/actions'

export default function UserLogoutButton() {
    return (
        <form action={logout}>
            <button
                type="submit"
                className="bg-transparent hover:bg-gray-50 border border-gray-200 hover:border-black px-4 py-2 text-xs font-bold uppercase text-gray-900 rounded transition-all duration-200 cursor-pointer"
            >
                Cerrar Sesión
            </button>
        </form>
    )
}
