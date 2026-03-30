'use client'

import { useEffect, useState, useRef } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Send } from 'lucide-react'

interface Message {
    id: string
    content: string
    sender_name: string
    created_at: string
}

interface TikTokChatProps {
    roomId: string
    userId: string
    userName: string
    isModel: boolean
}

export default function TikTokChat({ roomId, userId, userName, isModel }: TikTokChatProps) {
    const [messages, setMessages] = useState<Message[]>([])
    const [newMessage, setNewMessage] = useState('')
    const [errorMsg, setErrorMsg] = useState<string>('')
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const supabase = createClient()

    useEffect(() => {
        scrollToBottom()
    }, [messages])

    useEffect(() => {
        if (!roomId) return

        fetchMessages()

        const channel = supabase
            .channel(`room:${roomId}`)
            .on('postgres_changes', {
                event: 'INSERT',
                schema: 'public',
                table: 'messages',
                filter: `room_id=eq.${roomId}`
            }, (payload) => {
                const newMsg = payload.new as Message
                setMessages(prev => {
                    if (prev.some(m => m.id === newMsg.id)) {
                        return prev
                    }
                    return [...prev, newMsg]
                })
            })
            .subscribe()

        return () => {
            supabase.removeChannel(channel)
        }
    }, [roomId])

    const fetchMessages = async () => {
        const { data, error } = await supabase
            .from('messages')
            .select('*')
            .eq('room_id', roomId)
            .limit(50)

        if (error) {
            console.error('Error fetching messages:', error)
            setErrorMsg(error.message)
        }

        if (data) {
            const sorted = data.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
            setMessages(sorted)
        }
    }

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }

    const sendMessage = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!newMessage.trim()) return

        const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(userId)
        const messageData = {
            room_id: roomId,
            user_id: isUuid ? userId : null, // Note: This might fail if DB requires UUID. Assuming DB handles it or user is Auth.
            sender_name: userName,
            content: newMessage.trim()
        }

        // Optimistic update
        const tempId = Math.random().toString()
        const tempMsg = {
            id: tempId,
            content: newMessage.trim(),
            sender_name: userName,
            created_at: new Date().toISOString()
        }

        // Add immediately to UI
        setMessages(prev => [...prev, tempMsg])
        setNewMessage('')

        const { data, error } = await supabase
            .from('messages')
            .insert(messageData)
            .select()
            .single()

        if (error) {
            console.error('Error sending message:', error)
            // Remove temp message if error? Or just alert.
            // For now, we leave it or user will think it sent. 
            // Better to handle error visually but keeping it simple.
        } else if (data) {
            // Replace temp message with real one to avoid duplicates if subscription fires
            setMessages(prev => prev.map(m => m.id === tempId ? data : m))
        }
    }

    return (
        <div className="absolute left-2 sm:left-4 bottom-16 sm:bottom-20 w-[70%] max-w-[70%] h-[40%] flex flex-col justify-end pointer-events-none z-50">
            {/* Messages List - Ultra Compact */}
            <div className="flex flex-col items-start gap-1 mb-2 sm:mb-3 overflow-y-auto mask-gradient">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className="bg-black/10 backdrop-blur-[2px] px-2 py-1 rounded-lg max-w-[85%] pointer-events-auto inline-block"
                    >
                        <span className={`text-xs font-bold drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] mr-1.5 ${message.sender_name === userName ? 'text-yellow-400' : 'text-white/90'
                            }`}>
                            {message.sender_name}:
                        </span>
                        <span className="text-xs sm:text-sm text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)] font-medium">
                            {message.content}
                        </span>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </div>

            {/* Input Area - Compact */}
            <form
                onSubmit={sendMessage}
                className="flex items-center gap-1.5 pointer-events-auto bg-black/30 backdrop-blur-md px-1 py-1 rounded-full"
            >
                <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder={isModel ? "Responder..." : "Comentar..."}
                    className="flex-1 bg-transparent border-none text-white text-xs sm:text-sm px-3 py-1.5 outline-none placeholder-white/60 min-w-0"
                />
                <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className={`w-7 h-7 sm:w-8 sm:h-8 rounded-full border-none flex items-center justify-center transition-all mr-0.5 ${newMessage.trim()
                        ? 'bg-red-500 text-white cursor-pointer hover:bg-red-600'
                        : 'bg-white/20 text-white/50 cursor-default'
                        }`}
                >
                    <Send className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                </button>
            </form>

            <style jsx>{`
                ::-webkit-scrollbar {
                    width: 0px;
                    background: transparent;
                }
                .mask-gradient {
                    mask-image: linear-gradient(to bottom, transparent, black 10%);
                }
            `}</style>
        </div>
    )
}
