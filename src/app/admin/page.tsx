import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { approveModel, cleanOldRooms } from './actions'
import { SmallButton } from '@/components/StyledButtons'
import CreateCodeForm from '@/components/CreateCodeForm'
import { EndRoomButton, RevokeButton, LogoutButton } from '@/components/AdminControls'
import GalleryManager from '@/components/GalleryManager'
import ActiveUsersList from '@/components/ActiveUsersList'
import ActiveRoomsList from '@/components/ActiveRoomsList'

export default async function AdminPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'admin') redirect('/')

    // Fetch data
    const { data: activeRooms } = await supabase
        .from('rooms')
        .select('*, profiles(full_name)')
        .eq('status', 'live')
        .order('created_at', { ascending: false })

    const { data: activeCodes } = await supabase
        .from('access_codes')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false })

    const { data: pendingModels } = await supabase
        .from('profiles')
        .select('*')
        .eq('role', 'user')
        .order('created_at', { ascending: false })

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-6 md:p-8">
            <div className="max-w-5xl mx-auto">
                <header className="mb-6 md:mb-8 border-b border-gray-200 pb-4 md:pb-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                    <h1 className="text-xl md:text-2xl font-bold tracking-tight">
                        Panel de Administración
                    </h1>
                    <div className="flex gap-2 sm:gap-3">
                        <form action={cleanOldRooms}>
                            <SmallButton type="submit" variant="secondary">
                                Limpiar Salas
                            </SmallButton>
                        </form>
                        <LogoutButton />
                    </div>
                </header>

                <div className="space-y-6 md:space-y-8">

                    {/* Pending Models Section */}
                    <section>
                        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 md:mb-4">
                            Solicitudes Pendientes
                        </h2>
                        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                            {pendingModels && pendingModels.length > 0 ? (
                                <ul className="divide-y divide-gray-100">
                                    {pendingModels.map((model) => (
                                        <li key={model.id} className="p-3 md:p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                                            <div>
                                                <div className="font-semibold text-sm md:text-base">{model.full_name || 'Sin Nombre'}</div>
                                                <div className="text-xs md:text-sm text-gray-500">{model.email}</div>
                                            </div>
                                            <form action={approveModel.bind(null, model.id)}>
                                                <SmallButton type="submit" variant="primary">Aprobar</SmallButton>
                                            </form>
                                        </li>
                                    ))}
                                </ul>
                            ) : (
                                <div className="p-6 text-center text-gray-400 text-sm">
                                    No hay solicitudes pendientes.
                                </div>
                            )}
                        </div>
                    </section>

                    {/* Active Rooms Section */}
                    <section>
                        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 md:mb-4">
                            Salas en Vivo ({activeRooms?.length || 0})
                        </h2>
                        <ActiveRoomsList initialRooms={activeRooms || []} />
                    </section>

                    {/* Gallery Management Section */}
                    <section>
                        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 md:mb-4">
                            Galería del Home
                        </h2>
                        <div className="bg-white border border-gray-200 rounded-lg p-4 md:p-6">
                            <GalleryManager />
                        </div>
                    </section>

                    {/* Access Codes Section */}
                    <section>
                        <h2 className="text-xs sm:text-sm font-bold uppercase tracking-wide text-gray-500 mb-3 md:mb-4">
                            Generar Código de Acceso
                        </h2>

                        <CreateCodeForm />

                        <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 mb-3 md:mb-4">
                            Códigos Activos
                        </h3>
                        <ActiveUsersList initialCodes={activeCodes || []} />
                    </section>

                </div>
            </div>
        </main>
    )
}
