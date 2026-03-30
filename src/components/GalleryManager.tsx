'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/utils/supabase/client'
import { uploadGalleryImage, deleteGalleryImage } from '@/app/admin/actions'
import { Trash2, Upload, Loader2 } from 'lucide-react'

interface GalleryImage {
    id: string
    url: string
}

export default function GalleryManager() {
    const [images, setImages] = useState<GalleryImage[]>([])
    const [isUploading, setIsUploading] = useState(false)
    const supabase = createClient()

    useEffect(() => {
        fetchImages()
    }, [])

    const fetchImages = async () => {
        const { data } = await supabase.from('gallery_images').select('*').order('created_at', { ascending: false })
        if (data) setImages(data)
    }

    const compressImage = (file: File): Promise<string> => {
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
                    const maxWidth = 1200

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

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setIsUploading(true)
            try {
                const file = e.target.files[0]
                const compressed = await compressImage(file)
                const formData = new FormData()
                formData.append('image', compressed)

                const result = await uploadGalleryImage(formData)
                if (result.success) {
                    fetchImages()
                } else {
                    alert('Error uploading image')
                }
            } catch (error) {
                console.error(error)
                alert('Error processing image')
            } finally {
                setIsUploading(false)
            }
        }
    }

    const handleDelete = async (id: string) => {
        if (confirm('¿Estás seguro de eliminar esta imagen?')) {
            await deleteGalleryImage(id)
            fetchImages()
        }
    }

    return (
        <div>
            <div className="mb-6 flex justify-between items-center">
                <div className="text-sm text-gray-500">
                    {images.length} imágenes en galería
                </div>
                <label className={`flex items-center gap-2 px-4 py-2 bg-gray-900 text-white rounded-md text-sm font-semibold cursor-pointer transition-opacity ${isUploading ? 'opacity-70' : 'hover:opacity-90'}`}>
                    {isUploading ? <Loader2 className="animate-spin" size={16} /> : <Upload size={16} />}
                    {isUploading ? 'Subiendo...' : 'Subir Imagen'}
                    <input type="file" onChange={handleUpload} accept="image/*" className="hidden" disabled={isUploading} />
                </label>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
                {images.map((img) => (
                    <div key={img.id} className="relative aspect-[9/16] rounded-lg overflow-hidden group bg-gray-100">
                        <img src={img.url} alt="Gallery" className="w-full h-full object-cover" />
                        <button
                            onClick={() => handleDelete(img.id)}
                            className="absolute top-2 right-2 p-2 bg-red-500/90 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600 flex items-center justify-center"
                        >
                            <Trash2 size={14} />
                        </button>
                    </div>
                ))}
            </div>
        </div>
    )
}
