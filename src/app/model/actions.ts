'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function startStream(formData: FormData) {
    const title = formData.get('title') as string
    const coverUrl = formData.get('coverUrl') as string || null

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    // Fetch user profile to get the cover URL
    const { data: profile } = await supabase
        .from('profiles')
        .select('cover_url')
        .eq('id', user.id)
        .single()

    const finalCoverUrl = coverUrl || profile?.cover_url

    // Close any existing live rooms for this user first
    await supabase
        .from('rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('host_id', user.id)
        .eq('status', 'live')

    const { data, error } = await supabase
        .from('rooms')
        .insert({
            host_id: user.id,
            title,
            cover_url: finalCoverUrl,
            status: 'live'
        })
        .select()
        .single()

    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/admin')
    redirect(`/room/${data.id}`)
}

export async function updateProfile(formData: FormData) {
    const avatarUrl = formData.get('avatarUrl') as string
    const coverUrl = formData.get('coverUrl') as string
    const fullName = formData.get('fullName') as string

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) return { error: 'Not authenticated' }

    const updates: any = {}
    if (avatarUrl) updates.avatar_url = avatarUrl
    if (coverUrl) updates.cover_url = coverUrl
    if (fullName) updates.full_name = fullName

    const { error } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id)

    if (error) return { error: error.message }

    revalidatePath('/model')
    return { success: true }
}
