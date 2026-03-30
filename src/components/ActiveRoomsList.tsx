'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import Link from 'next/link'
import { EndRoomButton } from './AdminControls'

interface Room {
    id: string
    title: string
    status: string
    created_at: string
    profiles: {
        full_name: string
    } | null
}

export default function ActiveRoomsList({ initialRooms }: { initialRooms: any[] }) {
    const [rooms, setRooms] = useState<Room[]>(initialRooms)
    const supabase = createClient()

    useEffect(() => {
        const channel = supabase
            .channel('admin_rooms')
            .on('postgres_changes', {
                event: '*',
                schema: 'public',
                table: 'rooms'
            }, async (payload) => {
                if (payload.eventType === 'INSERT') {
                    // Fetch the profile for the new room
                    const { data: newRoom } = await supabase
                        .from('rooms')
                        .select('*, profiles(full_name)')
                        .eq('id', payload.new.id)
                        .single()

                    if (newRoom && newRoom.status === 'live') {
                        setRooms(prev => [newRoom as Room, ...prev])
                    }
                } else if (payload.eventType === 'UPDATE') {
                    const updatedRoom = payload.new as Room
                    if (updatedRoom.status !== 'live') {
                        setRooms(prev => prev.filter(r => r.id !== updatedRoom.id))
                    } else {
                        // Update existing room if needed, though usually we just care about status
                        setRooms(prev => prev.map(r => r.id === updatedRoom.id ? { ...r, ...updatedRoom } : r))
                    }
                } else if (payload.eventType === 'DELETE') {
                    setRooms(prev => prev.filter(r => r.id !== payload.old.id))
                }
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [])

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            {rooms.length > 0 ? (
                <ul className="divide-y divide-gray-100">
                    {rooms.map((room) => (
                        <li key={room.id} className="p-3 md:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                            <div className="flex items-center gap-3">
                                <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
                                <div>
                                    <div className="font-semibold text-sm md:text-base">{room.title}</div>
                                    {/* @ts-ignore */}
                                    <div className="text-xs md:text-sm text-gray-500">por {room.profiles?.full_name}</div>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                <Link
                                    href={`/room/${room.id}`}
                                    className="px-3 py-1.5 text-xs font-bold uppercase cursor-pointer transition-colors duration-200 border rounded bg-black text-white border-black hover:bg-gray-800 flex items-center justify-center"
                                >
                                    Ver Sala
                                </Link>
                                <EndRoomButton roomId={room.id} />
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <div className="p-6 text-center text-gray-400 text-sm">
                    No hay salas activas.
                </div>
            )}
        </div>
    )
}
