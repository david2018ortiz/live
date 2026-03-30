import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import StartStreamForm from '@/components/StartStreamForm'
import ModelProfileEditor from '@/components/ModelProfileEditor'
import { logout } from '@/app/actions'

export default async function ModelPage() {
    const supabase = await createClient()

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) redirect('/login')

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single()

    if (profile?.role !== 'model' && profile?.role !== 'admin') redirect('/')

    // Auto-close any previous live sessions for this model to prevent ghost rooms
    await supabase
        .from('rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('host_id', user.id)
        .eq('status', 'live')

    return (
        <main className="min-h-screen bg-gray-50 text-gray-900 font-sans p-4 sm:p-8">
            <div className="max-w-2xl mx-auto">
                <header className="mb-12 text-center">
                    <h1 className="text-2xl font-bold tracking-tight mb-2">
                        Panel de Modelo
                    </h1>
                    <p className="text-gray-500">
                        Bienvenida, {profile.full_name || 'Modelo'}
                    </p>
                </header>

                {/* Profile Editor */}
                <ModelProfileEditor
                    initialAvatar={profile.avatar_url}
                    initialCover={profile.cover_url}
                    initialName={profile.full_name}
                />

                <div className="mt-8">
                    <StartStreamForm />
                </div>

                <div className="mt-8 text-center">
                    <form action={logout}>
                        <button type="submit" className="text-red-500 bg-transparent border-none cursor-pointer text-sm font-semibold hover:text-red-600 transition-colors">
                            Cerrar Sesión
                        </button>
                    </form>
                </div>
            </div>
        </main>
    )
}
