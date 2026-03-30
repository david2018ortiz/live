'use client'

import Link from 'next/link'

interface RoomCardProps {
    room: any
    isAuthenticated: boolean
}

export default function RoomCard({ room, isAuthenticated }: RoomCardProps) {
    const handleClick = (e: React.MouseEvent) => {
        if (!isAuthenticated) {
            e.preventDefault()
            const input = document.querySelector('input[name="phone"]') as HTMLInputElement
            if (input) {
                input.focus()
                input.scrollIntoView({ behavior: 'smooth', block: 'center' })
                input.parentElement?.parentElement?.animate([
                    { transform: 'translateX(0)' },
                    { transform: 'translateX(-5px)' },
                    { transform: 'translateX(5px)' },
                    { transform: 'translateX(0)' }
                ], { duration: 300 })
            } else {
                alert('Por favor ingresa tu código de acceso arriba para entrar.')
            }
        }
    }

    return (
        <Link
            href={isAuthenticated ? `/room/${room.id}` : '#'}
            onClick={handleClick}
            className={`block h-full no-underline text-inherit ${isAuthenticated ? 'cursor-pointer' : 'cursor-default'}`}
        >
            <div className="bg-white rounded-xl overflow-hidden border border-gray-200 transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-gray-300 flex flex-col h-full group">
                {/* Cover */}
                <div className="relative aspect-video bg-gray-100">
                    {room.cover_url ? (
                        <img src={room.cover_url} alt={room.title} className="w-full h-full object-cover" />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400">No Cover</div>
                    )}

                    {!isAuthenticated && (
                        <div className="absolute inset-0 bg-white/10 backdrop-blur-[4px] flex items-center justify-center">
                            <span className="bg-black text-white px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2">
                                🔒 Requiere Acceso
                            </span>
                        </div>
                    )}

                    <div className="absolute top-4 left-4 bg-red-500 text-white px-2 py-1 rounded text-[10px] font-bold uppercase tracking-wider">
                        Live
                    </div>
                </div>

                {/* Content */}
                <div className="p-6 flex-1 flex flex-col">
                    <h3 className="text-lg font-semibold mb-2 leading-tight group-hover:text-black transition-colors">
                        {room.title}
                    </h3>
                    <div className="flex items-center gap-3 mt-auto">
                        <div className="w-8 h-8 rounded-full bg-gray-100 overflow-hidden border border-gray-200">
                            {/* @ts-ignore */}
                            {room.profiles?.avatar_url && <img src={room.profiles.avatar_url} className="w-full h-full object-cover" />}
                        </div>
                        <div>
                            {/* @ts-ignore */}
                            <div className="text-sm font-medium text-gray-900">{room.profiles?.full_name}</div>
                            <div className="text-xs text-gray-500">Host</div>
                        </div>
                    </div>
                </div>
            </div>
        </Link>
    )
}
