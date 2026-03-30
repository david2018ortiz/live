'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { RevokeButton } from './AdminControls'

interface AccessCode {
    id: string
    code: string
    phone: string
    created_at: string
    expires_at: string | null
    duration_minutes: number
    is_active: boolean
}

export default function ActiveUsersList({ initialCodes }: { initialCodes: any[] }) {
    const [codes, setCodes] = useState<AccessCode[]>(initialCodes)
    const [now, setNow] = useState(Date.now())
    const supabase = createClient()

    useEffect(() => {
        // Update timer every second
        const interval = setInterval(() => setNow(Date.now()), 1000)
        return () => clearInterval(interval)
    }, [])

    useEffect(() => {
        // Realtime subscription for new/updated codes
        const channel = supabase
            .channel('admin_codes')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'access_codes'
            }, (payload) => {
                if (payload.eventType === 'INSERT') {
                    setCodes(prev => [payload.new as AccessCode, ...prev])
                } else if (payload.eventType === 'UPDATE') {
                    setCodes(prev => prev.map(c => c.id === payload.new.id ? payload.new as AccessCode : c))
                } else if (payload.eventType === 'DELETE') {
                    setCodes(prev => prev.filter(c => c.id !== payload.old.id))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    // Filter only active codes
    const activeCodes = codes.filter(c => c.is_active)

    const getTimeLeft = (code: AccessCode) => {
        let expiresAt = 0
        if (code.expires_at) {
            expiresAt = new Date(code.expires_at).getTime()
        } else {
            expiresAt = new Date(code.created_at).getTime() + (code.duration_minutes * 60000)
        }

        const diff = expiresAt - now
        if (diff <= 0) return "Expirado"

        const minutes = Math.floor(diff / 60000)
        const seconds = Math.floor((diff % 60000) / 1000)
        return `${minutes}m ${seconds}s`
    }

    const getProgressColor = (code: AccessCode) => {
        let expiresAt = 0
        if (code.expires_at) {
            expiresAt = new Date(code.expires_at).getTime()
        } else {
            expiresAt = new Date(code.created_at).getTime() + (code.duration_minutes * 60000)
        }

        const totalDuration = code.duration_minutes * 60000
        const timeLeft = expiresAt - now
        const percentage = (timeLeft / totalDuration) * 100

        if (percentage > 50) return 'bg-green-500'
        if (percentage > 20) return 'bg-yellow-500'
        return 'bg-red-500'
    }

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {activeCodes.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                    {activeCodes.map((code) => (
                        <li key={code.id} className="p-3 md:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="w-full sm:w-auto">
                                <div className="flex items-center gap-2">
                                    <div className={`w-2 h-2 rounded-full ${getProgressColor(code)} animate-pulse`}></div>
                                    <div className="font-mono font-semibold text-sm md:text-base">{code.code}</div>
                                </div>
                                <div className="text-xs md:text-sm text-gray-500 mt-1">
                                    {code.phone}
                                </div>
                                <div className="mt-2 w-full sm:w-48 bg-gray-100 rounded-full h-1.5 overflow-hidden">
                                    <div
                                        className={`h-full ${getProgressColor(code)} transition-all duration-1000`}
                                        style={{
                                            width: `${Math.max(0, Math.min(100, (
                                                (new Date(code.expires_at || 0).getTime() - now) / (code.duration_minutes * 60000)
                                            ) * 100))}%`
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end">
                                <div className="text-right">
                                    <div className="text-xs text-gray-400 uppercase font-bold tracking-wider">Tiempo Restante</div>
                                    <div className="font-mono font-bold text-lg md:text-xl text-gray-800">
                                        {getTimeLeft(code)}
                                    </div>
                                </div>
                                <RevokeButton codeId={code.id} />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-6 text-center text-gray-400 text-sm">
                    No hay usuarios activos en este momento.
                </div>
            )}
        </div>
    )
}
