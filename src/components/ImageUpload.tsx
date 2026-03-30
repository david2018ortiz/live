'use client'

import { useState } from 'react'
import { createClient } from '@/utils/supabase/client'
import { Upload, X } from 'lucide-react'

interface ImageUploadProps {
    bucket: 'avatars' | 'covers'
    onUpload?: (url: string) => void
    defaultUrl?: string
    label: string
}

export default function ImageUpload({ bucket, onUpload, defaultUrl, label }: ImageUploadProps) {
    const [imageUrl, setImageUrl] = useState(defaultUrl || '')
    const [uploading, setUploading] = useState(false)
    const supabase = createClient()

    const compressImage = (file: File): Promise<Blob> => {
        return new Promise((resolve, reject) => {
            const reader = new FileReader()
            reader.readAsDataURL(file)
            reader.onload = (event) => {
                const img = new Image()
                img.src = event.target?.result as string
                img.onload = () => {
                    const canvas = document.createElement('canvas')
                    const MAX_WIDTH = 800
                    const scaleSize = MAX_WIDTH / img.width
                    canvas.width = MAX_WIDTH
                    canvas.height = img.height * scaleSize

                    const ctx = canvas.getContext('2d')
                    ctx?.drawImage(img, 0, 0, canvas.width, canvas.height)

                    canvas.toBlob((blob) => {
                        if (blob) resolve(blob)
                        else reject(new Error('Canvas to Blob failed'))
                    }, 'image/jpeg', 0.8) // JPEG quality 0.8
                }
            }
            reader.onerror = (error) => reject(error)
        })
    }

    const handleUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            setUploading(true)
            if (!event.target.files || event.target.files.length === 0) {
                throw new Error('You must select an image to upload.')
            }

            const file = event.target.files[0]

            // Compress image
            const compressedBlob = await compressImage(file)
            const compressedFile = new File([compressedBlob], file.name, {
                type: 'image/jpeg',
            })

            const fileExt = 'jpg'
            const fileName = `${Math.random()}.${fileExt}`
            const filePath = `${fileName}`

            const { error: uploadError } = await supabase.storage
                .from(bucket)
                .upload(filePath, compressedFile)

            if (uploadError) {
                throw uploadError
            }

            const { data } = supabase.storage.from(bucket).getPublicUrl(filePath)
            setImageUrl(data.publicUrl)
            if (onUpload) onUpload(data.publicUrl)
        } catch (error) {
            alert('Error uploading image!')
            console.log(error)
        } finally {
            setUploading(false)
        }
    }

    return (
        <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: '500', marginBottom: '0.5rem', color: '#737373' }}>
                {label}
            </label>
            <div style={{
                position: 'relative',
                border: '1px dashed #e5e5e5',
                borderRadius: '8px',
                padding: '1rem',
                textAlign: 'center',
                background: '#fafafa',
                cursor: 'pointer',
                transition: 'all 0.2s',
                height: '200px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                overflow: 'hidden'
            }}
                onMouseOver={(e) => {
                    e.currentTarget.style.borderColor = '#a3a3a3'
                    e.currentTarget.style.background = '#f5f5f5'
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.borderColor = '#e5e5e5'
                    e.currentTarget.style.background = '#fafafa'
                }}
            >
                <input
                    type="file"
                    accept="image/*"
                    onChange={handleUpload}
                    style={{
                        position: 'absolute',
                        inset: 0,
                        width: '100%',
                        height: '100%',
                        opacity: 0,
                        cursor: 'pointer',
                        zIndex: 10
                    }}
                    disabled={uploading}
                />
                {imageUrl ? (
                    <div style={{ width: '100%', height: '100%', position: 'relative' }}>
                        <img src={imageUrl} alt="Uploaded" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <div style={{
                            position: 'absolute',
                            inset: 0,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: 'rgba(0,0,0,0.5)',
                            opacity: 0,
                            transition: 'opacity 0.2s',
                            color: 'white',
                            fontWeight: '500',
                            fontSize: '0.875rem'
                        }}
                            onMouseOver={(e) => e.currentTarget.style.opacity = '1'}
                            onMouseOut={(e) => e.currentTarget.style.opacity = '0'}
                        >
                            Change Image
                        </div>
                    </div>
                ) : (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#a3a3a3' }}>
                        <Upload style={{ width: '2rem', height: '2rem', marginBottom: '0.5rem', strokeWidth: 1.5 }} />
                        <span style={{ fontSize: '0.875rem', fontWeight: '500' }}>
                            {uploading ? 'Compressing & Uploading...' : 'Click to upload'}
                        </span>
                        {!uploading && (
                            <span style={{ fontSize: '0.75rem', marginTop: '0.25rem' }}>
                                Optimized automatically
                            </span>
                        )}
                    </div>
                )}
            </div>
            <input type="hidden" name={bucket === 'avatars' ? 'avatarUrl' : 'coverUrl'} value={imageUrl} />
        </div>
    )
}
