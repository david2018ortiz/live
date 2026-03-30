'use client'

import { useState, useRef } from 'react'
import { updateProfile } from '@/app/model/actions'
import { Camera, Image as ImageIcon, Save } from 'lucide-react'

export default function ModelProfileEditor({ initialAvatar, initialCover, initialName }: { initialAvatar?: string, initialCover?: string, initialName?: string }) {
    const [avatar, setAvatar] = useState(initialAvatar)
    const [cover, setCover] = useState(initialCover)
    const [fullName, setFullName] = useState(initialName || '')
    const [isSaving, setIsSaving] = useState(false)

    const avatarInputRef = useRef<HTMLInputElement>(null)
    const coverInputRef = useRef<HTMLInputElement>(null)

    const compressImage = (file: File, maxWidth: number): Promise<string> => {
        return new Promise((resolve) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    let width = img.width
                    let height = img.height

                    if (width > maxWidth) {
                        height = (height * maxWidth) / width
                        width = maxWidth
                    }

                    canvas.width = width
                    canvas.height = height
                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, width, height)
                    resolve(canvas.toDataURL('image/jpeg', 0.8))
                }
            }
        })
    }

    const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const compressed = await compressImage(file, 400)
            setAvatar(compressed)
            await saveProfile(compressed, cover, fullName)
        }
    }

    const handleCoverChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0]
            const compressed = await compressImage(file, 1280)
            setCover(compressed)
            await saveProfile(avatar, compressed, fullName)
        }
    }

    const handleNameBlur = async () => {
        if (fullName !== initialName) {
            await saveProfile(avatar, cover, fullName)
        }
    }

    const saveProfile = async (newAvatar?: string, newCover?: string, newName?: string) => {
        setIsSaving(true)
        const formData = new FormData()
        if (newAvatar) formData.append('avatarUrl', newAvatar)
        if (newCover) formData.append('coverUrl', newCover)
        if (newName) formData.append('fullName', newName)

        await updateProfile(formData)
        setIsSaving(false)
    }

    return (
        <div style={{ marginBottom: '3rem', background: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid #e5e5e5' }}>
            {/* Cover Image - 16:9 Aspect Ratio */}
            <div
                style={{
                    width: '100%',
                    paddingTop: '56.25%', // 16:9 Aspect Ratio
                    background: cover ? `url(${cover}) center/cover` : '#f3f4f6',
                    position: 'relative',
                    cursor: 'pointer'
                }}
                onClick={() => coverInputRef.current?.click()}
            >
                <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(0,0,0,0.1)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    opacity: 0,
                    transition: 'opacity 0.2s',
                    ':hover': { opacity: 1 }
                } as any}>
                    <span style={{ background: 'rgba(0,0,0,0.6)', color: 'white', padding: '0.5rem 1rem', borderRadius: '20px', fontSize: '0.875rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <ImageIcon size={16} /> Cambiar Portada
                    </span>
                </div>
                <input
                    type="file"
                    ref={coverInputRef}
                    onChange={handleCoverChange}
                    accept="image/*"
                    style={{ display: 'none' }}
                />
            </div>

            {/* Avatar Image & Name */}
            <div style={{ padding: '0 2rem 2rem', marginTop: '-60px', display: 'flex', alignItems: 'flex-end', gap: '1.5rem', position: 'relative' }}>
                <div
                    style={{
                        width: '120px',
                        height: '120px',
                        borderRadius: '50%',
                        border: '4px solid white',
                        background: avatar ? `url(${avatar}) center/cover` : '#e5e5e5',
                        position: 'relative',
                        cursor: 'pointer',
                        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                        flexShrink: 0
                    }}
                    onClick={() => avatarInputRef.current?.click()}
                >
                    <div style={{
                        position: 'absolute',
                        inset: 0,
                        borderRadius: '50%',
                        background: 'rgba(0,0,0,0.3)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        opacity: 0,
                        transition: 'opacity 0.2s',
                        ':hover': { opacity: 1 }
                    } as any}>
                        <Camera size={24} color="white" />
                    </div>
                    <input
                        type="file"
                        ref={avatarInputRef}
                        onChange={handleAvatarChange}
                        accept="image/*"
                        style={{ display: 'none' }}
                    />
                </div>

                <div style={{ paddingBottom: '0.5rem', flex: 1 }}>
                    <div style={{ fontSize: '0.75rem', color: '#737373', marginBottom: '0.25rem' }}>Nombre de Modelo</div>
                    <input
                        type="text"
                        value={fullName}
                        onChange={(e) => setFullName(e.target.value)}
                        onBlur={handleNameBlur}
                        placeholder="Tu Nombre"
                        style={{
                            fontSize: '1.5rem',
                            fontWeight: '700',
                            color: '#171717',
                            border: 'none',
                            borderBottom: '1px dashed #ccc',
                            background: 'transparent',
                            width: '100%',
                            outline: 'none',
                            padding: '0.25rem 0'
                        }}
                    />
                </div>
            </div>

            {isSaving && (
                <div style={{ padding: '0.5rem 1.5rem', fontSize: '0.75rem', color: '#f59e0b', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <Save size={12} /> Guardando cambios...
                </div>
            )}
        </div>
    )
}
