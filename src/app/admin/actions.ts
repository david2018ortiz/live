'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function createAccessCode(formData: FormData) {
    const phone = formData.get('phone') as string
    const duration = parseInt(formData.get('duration') as string)

    const supabase = await createClient()

    // Generate a random 6-digit code
    const code = Math.floor(100000 + Math.random() * 900000).toString()

    // Calculate expiration
    const expiresAt = new Date(Date.now() + duration * 60000).toISOString()

    const { error } = await supabase
        .from('access_codes')
        .insert({
            code,
            phone,
            duration_minutes: duration,
            expires_at: expiresAt,
            is_active: true
        })

    if (error) {
        return { error: error.message }
    }

    revalidatePath('/admin')
    return { success: true, code }
}

export async function revokeAccessCode(codeId: string) {
    const supabase = await createClient()

    await supabase
        .from('access_codes')
        .update({ is_active: false })
        .eq('id', codeId)

    revalidatePath('/admin')
}

export async function approveModel(userId: string) {
    const supabase = await createClient()

    await supabase
        .from('profiles')
        .update({ role: 'model' })
        .eq('id', userId)

    revalidatePath('/admin')
}

export async function endRoom(roomId: string) {
    const supabase = await createClient()

    await supabase
        .from('rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('id', roomId)

    revalidatePath('/admin')
}

export async function cleanOldRooms() {
    const supabase = await createClient()

    // End rooms older than 24 hours or stuck in 'live'
    await supabase
        .from('rooms')
        .update({ status: 'ended', ended_at: new Date().toISOString() })
        .eq('status', 'live')
        .lt('created_at', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString())

    revalidatePath('/admin')
}

export async function uploadGalleryImage(formData: FormData) {
    const image = formData.get('image') as string // Base64 string
    const supabase = await createClient()

    // Since we don't have a storage bucket set up easily, we'll store the base64 string directly in the table for now.
    // Ideally, we should upload to storage and save the URL.
    // But given the constraints and "optimizing images" request, storing small optimized base64 strings in a text column is a viable quick solution for a prototype.
    // However, for production, Storage is better.
    // Let's try to insert into 'gallery_images'.

    const { error } = await supabase
        .from('gallery_images')
        .insert({ url: image })

    if (error) return { error: error.message }

    revalidatePath('/')
    revalidatePath('/admin')
    return { success: true }
}

export async function deleteGalleryImage(id: string) {
    const supabase = await createClient()

    await supabase
        .from('gallery_images')
        .delete()
        .eq('id', id)

    revalidatePath('/')
    revalidatePath('/admin')
}
