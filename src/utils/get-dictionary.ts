'use server'

import { cookies } from 'next/headers'
import { dictionaries } from './dictionaries'

export async function getDictionary() {
    const cookieStore = await cookies()
    const lang = cookieStore.get('NEXT_LOCALE')?.value || 'es'
    return dictionaries[lang as keyof typeof dictionaries] || dictionaries.es
}
