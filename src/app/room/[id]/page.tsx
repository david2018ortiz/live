import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import RoomView from '@/components/RoomView'

export default async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = await params
    const supabase = await createClient()
    const cookieStore = await cookies()

    // Check authentication
    const { data: { user } } = await supabase.auth.getUser()
    const accessCode = cookieStore.get('access_code')?.value
    const clientPhone = cookieStore.get('client_phone')?.value

    let userId: string
    let userName: string
    let role = 'guest'
    let isModel = false

    if (user) {
        const { data: profile } = await supabase.from('profiles').select('full_name, role').eq('id', user.id).single()
        userId = user.id
        userName = profile?.full_name || 'User'
        role = profile?.role || 'client'
        isModel = role === 'model'
    } else if (accessCode && clientPhone) {
        // Validate code
        const { data: code } = await supabase
            .from('access_codes')
            .select('*')
            .eq('code', accessCode)
            .eq('is_active', true)
            .single()

        if (!code) {
            redirect('/')
        }

        userId = `guest_${accessCode}`
        userName = `Guest-${clientPhone.slice(-4)}`
        role = 'guest'
    } else {
        redirect('/')
    }

    // Fetch room
    const { data: room, error } = await supabase
        .from('rooms')
        .select('*')
        .eq('id', id)
        .single()

    if (error || !room || room.status !== 'live') {
        redirect('/')
    }

    return <RoomView roomId={id} userId={userId} userName={userName} isModel={isModel} role={role} />
}
