'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Send } from 'lucide-react'

interface Message {
    id: string
    content: string
    sender_name: string
    created_at: string
    user_id?: string
}

interface ChatProps {
    roomId: string
    currentUser: {
        type: 'user' | 'client'
        id?: string
        name: string
    }
}

export default function Chat({ roomId, currentUser }: ChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        // Fetch initial messages
        const fetchMessages = async () => {
            const { data } = await supabase
                .from('messages')
                .select('*')
                .eq('room_id', roomId)
                .order('created_at', { ascending: true })

            if (data) setMessages(data)
        }

        fetchMessages()

        // Subscribe to new messages
        const channel = supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                setMessages(prev => [...prev, payload.new as Message])
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId, supabase])

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages])

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        const msg = {
            room_id: roomId,
            content: newMessage,
            sender_name: currentUser.name,
            user_id: currentUser.id || null
        }

        const { error } = await supabase.from('messages').insert(msg)

        if (!error) {
            setNewMessage('')
        }
    }

    return (
        <div className="flex flex-col h-full bg-black/60 backdrop-blur-md rounded-lg">
            <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-0.5">
                {messages.map((msg) => {
                    const isModel = msg.user_id !== null && msg.user_id !== undefined
                    const displayName = msg.sender_name || 'Anónimo'

                    return (
                        <div key={msg.id} className="py-0.5">
                            <span className="text-[10px] sm:text-xs uppercase tracking-wide font-semibold px-1.5 py-0.5 border rounded mr-1.5"
                                style={{
                                    borderColor: isModel ? '#171717' : '#737373',
                                    color: isModel ? '#171717' : '#737373',
                                    backgroundColor: 'rgba(255,255,255,0.9)'
                                }}
                            >
                                {isModel ? 'Modelo' : 'Cliente'}
                            </span>
                            <span className="text-xs sm:text-sm font-semibold text-white">
                                {displayName}:
                            </span>
                            <span className="text-xs sm:text-sm text-white/95 ml-1">
                                {msg.content}
                            </span>
                        </div>
                    )
                })}
                <div ref={messagesEndRef} />
            </div>

            <form onSubmit={sendMessage} className="p-2 relative">
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Escribe un mensaje..."
                    className="w-full bg-white/10 border border-white/20 rounded-full px-4 py-2 pr-10 text-white text-sm placeholder-white/60 outline-none focus:border-white/40 transition-colors"
                />
                <button
                    type="submit"
                    className="absolute right-4 top-1/2 -translate-y-1/2 bg-transparent border-none text-white cursor-pointer hover:text-white/80 transition-colors"
                >
                    <Send className="w-4 h-4" />
                </button>
            </form>
        </div>
    )
}
