'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/utils/supabase/client'
import TikTokChat from './TikTokChat'
import VideoStream from './VideoStream'
import ViewerCounter from './ViewerCounter'
import { X } from 'lucide-react'

interface Room {
    id: string
    title: string
    cover_url: string | null
    profiles: {
        full_name: string
    } | null
}

interface RoomViewProps {
    roomId: string
    userId: string
    userName: string
    isModel: boolean
    role: string
}

export default function RoomView({ roomId, userId, userName, isModel, role }: RoomViewProps) {
    const [room, setRoom] = useState<Room | null>(null)
    const [isActive, setIsActive] = useState(true)
    const router = useRouter()
    const supabase = createClient()

    const [timeLeftDisplay, setTimeLeftDisplay] = useState<string | null>(null)

    useEffect(() => {
        fetchRoom()

        // Check expiration for guests
        let expirationTimer: NodeJS.Timeout | undefined
        let validationInterval: NodeJS.Timeout | undefined
        let countdownInterval: NodeJS.Timeout | undefined

        if (!isModel && userId.startsWith('guest_')) {
            const code = userId.split('_')[1]

            // CRITICAL: Active polling every 2 seconds to verify code status
            validationInterval = setInterval(async () => {
                const { data } = await supabase
                    .from('access_codes')
                    .select('is_active, expires_at, duration_minutes, created_at')
                    .eq('code', code)
                    .single()

                console.log('[GUEST POLLING] Code:', code, 'Data:', data)

                if (!data || data.is_active === false) {
                    console.log('[GUEST KICKED] Code revoked or not found!')
                    alert('Tu código de acceso ha sido revocado.')
                    window.location.href = '/'
                    clearInterval(validationInterval)
                    return
                }

                // Calculate expiration if missing (fallback)
                let expiresAtTime = 0
                if (data.expires_at) {
                    expiresAtTime = new Date(data.expires_at).getTime()
                } else if (data.created_at && data.duration_minutes) {
                    expiresAtTime = new Date(data.created_at).getTime() + (data.duration_minutes * 60000)
                }

                if (expiresAtTime > 0) {
                    const now = Date.now()

                    if (now >= expiresAtTime) {
                        console.log('[GUEST KICKED] Time expired!')
                        alert('Tu tiempo ha terminado.')
                        window.location.href = '/'
                        clearInterval(validationInterval)
                    }
                }
            }, 2000)

            // Countdown Timer Logic
            const startCountdown = async () => {
                console.log('[TIMER] Starting countdown for code:', code)
                const { data } = await supabase
                    .from('access_codes')
                    .select('expires_at, duration_minutes, created_at')
                    .eq('code', code)
                    .single()

                console.log('[TIMER] Data received:', data)

                let expiresAt = 0
                if (data?.expires_at) {
                    expiresAt = new Date(data.expires_at).getTime()
                    console.log('[TIMER] Using expires_at:', data.expires_at)
                } else if (data?.created_at && data?.duration_minutes) {
                    expiresAt = new Date(data.created_at).getTime() + (data.duration_minutes * 60000)
                    console.log('[TIMER] Calculated from created_at:', data.created_at, '+', data.duration_minutes, 'minutes')
                }

                if (expiresAt > 0) {
                    console.log('[TIMER] Expires at timestamp:', expiresAt, 'Current:', Date.now())
                    countdownInterval = setInterval(() => {
                        const now = Date.now()
                        const diff = expiresAt - now

                        if (diff <= 0) {
                            setTimeLeftDisplay("00:00")
                            clearInterval(countdownInterval)
                        } else {
                            const minutes = Math.floor(diff / 60000)
                            const seconds = Math.floor((diff % 60000) / 1000)
                            const displayTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
                            setTimeLeftDisplay(displayTime)
                        }
                    }, 1000)
                } else {
                    console.error('[TIMER] Could not calculate expiration time!')
                }
            }
            startCountdown()
        }

        // Subscribe to room status changes (UPDATE and DELETE)
        const roomChannel = supabase
            .channel(`room_status:${roomId}`)
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'rooms',
                filter: `id=eq.${roomId}`
            }, (payload) => {
                if (payload.eventType === 'DELETE') {
                    setIsActive(false)
                    alert('La sala ha sido eliminada')
                    router.push('/')
                    return
                }

                const updatedRoom = payload.new as any
                if (updatedRoom && updatedRoom.status !== 'live') {
                    setIsActive(false)
                    alert('La sala ha terminado')
                    router.push('/')
                }
            })
            .subscribe()

        // Subscribe to access code changes (if user is guest)
        let codeChannel: any = null
        if (!isModel && userId.startsWith('guest_')) {
            const code = userId.split('_')[1]
            codeChannel = supabase
                .channel(`code_status:${code}`)
                .on('postgres_changes', {
                    event: 'UPDATE',
                    schema: 'public',
                    table: 'access_codes',
                    filter: `code=eq.${code}`
                }, (payload) => {
                    const updatedCode = payload.new as any
                    if (updatedCode.is_active === false) {
                        console.log('[REALTIME] Code revoked via subscription!')
                        alert('Tu código de acceso ha sido revocado.')
                        window.location.href = '/'
                    }
                })
                .subscribe()
        }

        return () => {
            supabase.removeChannel(roomChannel)
            if (codeChannel) supabase.removeChannel(codeChannel)
            if (expirationTimer) clearTimeout(expirationTimer)
            if (validationInterval) clearInterval(validationInterval)
            if (countdownInterval) clearInterval(countdownInterval)
        }
    }, [roomId, isModel, userId])

    const fetchRoom = async () => {
        const { data } = await supabase
            .from('rooms')
            .select('*, profiles(full_name)')
            .eq('id', roomId)
            .single()

        if (data) {
            setRoom(data as Room)
            if (data.status !== 'live') {
                setIsActive(false)
                router.push('/')
            }
        }
    }

    const exitRoom = async () => {
        if (isModel) {
            try {
                await fetch('/api/end-stream', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ roomId })
                })
            } catch (e) {
                console.error('Error ending stream:', e)
            }
        }
        router.push('/')
    }

    if (!isActive || !room) {
        return (
            <div className="w-full h-screen flex items-center justify-center bg-black text-white">
                Cargando sala...
            </div>
        )
    }

    return (
        <div className="w-full h-screen relative bg-black overflow-hidden">
            {/* Exit Button */}
            <button
                onClick={exitRoom}
                className="absolute top-2 sm:top-4 right-2 sm:right-4 w-10 h-10 sm:w-11 sm:h-11 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center cursor-pointer z-10 transition-all hover:bg-black/60"
            >
                <X className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>

            {/* Room Title & Live Badge */}
            <div className="absolute top-2 sm:top-4 left-2 sm:left-4 z-10 max-w-[calc(100%-5rem)] sm:max-w-[calc(100%-6rem)]">
                <div className="bg-black/40 backdrop-blur-md px-2 py-1.5 sm:px-3 sm:py-2 rounded-lg">
                    <div className="flex items-center gap-1.5 sm:gap-2 mb-0.5 sm:mb-1">
                        <span className="bg-red-500 text-white px-1.5 py-0.5 sm:px-2 sm:py-1 rounded text-[10px] sm:text-xs font-bold uppercase tracking-wider animate-pulse">
                            LIVE
                        </span>
                        <ViewerCounter roomId={roomId} userId={userId} role={role} />
                        <h2 className="text-white text-sm sm:text-base md:text-lg font-bold m-0 truncate">
                            {room.title}
                        </h2>
                    </div>
                    <div className="text-gray-300 text-[10px] sm:text-xs">
                        {/* @ts-ignore */}
                        Host: {room.profiles?.full_name}
                    </div>
                    {timeLeftDisplay && (
                        <div className="mt-1 text-yellow-400 font-mono text-xs sm:text-sm font-bold tracking-wider">
                            ⏱ {timeLeftDisplay}
                        </div>
                    )}
                </div>
            </div>

            {/* Video Stream */}
            <VideoStream isModel={isModel} roomId={roomId} userId={userId} />

            {/* TikTok-style Chat */}
            <TikTokChat roomId={roomId} userId={userId} userName={userName} isModel={isModel} />

            <style jsx global>{`
                @keyframes pulse {
                    0% { opacity: 1; }
                    50% { opacity: 0.5; }
                    100% { opacity: 1; }
                }
            `}</style>
        </div>
    )
}
