'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Users } from 'lucide-react'

interface ViewerCounterProps {
    roomId: string
    userId: string
    role: string
}

export default function ViewerCounter({ roomId, userId, role }: ViewerCounterProps) {
    const [count, setCount] = useState(0)
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase.channel(`room_presence:${roomId}`)

        channel
            .on('presence', { event: 'sync' }, () => {
                const state = channel.presenceState()

                // Count unique users who are NOT models or admins
                // We assume 'guest' and 'client' are the ones to count.
                const uniqueUsers = new Set()

                Object.values(state).forEach((presences: any) => {
                    presences.forEach((presence: any) => {
                        if (presence.role === 'client' || presence.role === 'guest') {
                            uniqueUsers.add(presence.userId)
                        }
                    })
                })

                setCount(uniqueUsers.size)
            })
            .subscribe(async (status) => {
                if (status === 'SUBSCRIBED') {
                    await channel.track({
                        userId,
                        role,
                        online_at: new Date().toISOString(),
                    })
                }
            })

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, userId, role])

    return (
        <div className="flex items-center gap-1.5 bg-black/40 backdrop-blur-md px-2 py-1 rounded-full text-white/90 border border-white/10">
            <Users className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="text-xs sm:text-sm font-medium font-mono">
                {count}
            </span>
        </div>
    )
}
