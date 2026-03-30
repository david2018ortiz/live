import { createClient } from '@/utils/supabase/server'
import { NextResponse } from 'next/server'
import { revalidatePath } from 'next/cache'

export async function POST(request: Request) {
    // Use try-catch for JSON parsing as beacon might send different content type or empty body if not careful, 
    // though we sent JSON blob.
    try {
        const { roomId } = await request.json()
        const supabase = await createClient()

        const { error } = await supabase
            .from('rooms')
            .update({ status: 'ended', ended_at: new Date().toISOString() })
            .eq('id', roomId)
            .eq('status', 'live')

        if (error) {
            return NextResponse.json({ error: error.message }, { status: 500 })
        }

        // Revalidate home page and admin page so the list updates
        revalidatePath('/')
        revalidatePath('/admin')

        return NextResponse.json({ success: true })
    } catch (e) {
        console.error('Error in end-stream:', e)
        return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
    }
}
