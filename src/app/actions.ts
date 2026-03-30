'use server'

import { createClient } from '@/utils/supabase/server'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'

export async function validateAccessCode(formData: FormData) {
    const phone = formData.get('phone') as string
    const code = formData.get('code') as string

    if (!phone || !code) {
        return { error: 'Phone and code are required' }
    }

    const supabase = await createClient()

    // Check code
    const { data: accessCode, error } = await supabase
        .from('access_codes')
        .select('*')
        .eq('code', code)
        .eq('phone', phone)
        .single()

    if (error || !accessCode) {
        return { error: 'Invalid code or phone number' }
    }

    if (!accessCode.is_active) {
        return { error: 'Code has been deactivated' }
    }

    // Check expiration
    const now = new Date()
    if (accessCode.expires_at && new Date(accessCode.expires_at) < now) {
        return { error: 'Code has expired' }
    }

    // If first use (no expires_at yet? or maybe admin sets duration but it starts on first use?)
    // "asignarle el tiempo en el momento de crearlo" -> Admin sets duration.
    // "al pasar el tiempo que el admin le asigno sea sacado".
    // Usually this means expires_at is set when created.
    // But if it's "time desired 15min", maybe it starts when they enter?
    // "asignarle el tiempo en el momento de crearlo".
    // I'll assume expires_at is set at creation for simplicity, OR I set it now if null.
    // Let's assume admin sets `expires_at` directly or `duration`.
    // If I stored `duration_minutes` and `expires_at` is null, I could set it now.
    // But the prompt says "asignarle el tiempo en el momento de crearlo".
    // I'll assume `expires_at` is already set or calculated.
    // Let's check my schema: `duration_minutes`, `expires_at`.
    // I'll update `used_at` if null.

    if (!accessCode.used_at) {
        const expiresAt = new Date(now.getTime() + accessCode.duration_minutes * 60000)
        await supabase
            .from('access_codes')
            .update({ used_at: now.toISOString(), expires_at: expiresAt.toISOString() })
            .eq('id', accessCode.id)
    } else {
        // Already used, check if expired
        if (accessCode.expires_at && new Date(accessCode.expires_at) < now) {
            return { error: 'Time limit exceeded' }
        }
    }

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('access_code', code, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: accessCode.duration_minutes * 60 // seconds
    })

    cookieStore.set('client_phone', phone, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        maxAge: accessCode.duration_minutes * 60
    })

    return { success: true }
}

export async function logout() {
    const cookieStore = await cookies()
    cookieStore.delete('access_code')
    cookieStore.delete('client_phone')
    redirect('/')
}
