'use client'

import { useState, useEffect } from 'react'

interface GalleryImage {
    id: string
    url: string
}

export default function HomeGallery({ images }: { images: GalleryImage[] }) {
    const [displayImages, setDisplayImages] = useState<GalleryImage[]>([])
    const [queue, setQueue] = useState<GalleryImage[]>([])
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
        // Ensure we always have at least 7 images for the layout
        let initialImages = [...images]
        if (initialImages.length < 7) {
            const placeholders = [
                'https://images.unsplash.com/photo-1534528741775-53994a69daeb?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1517841905240-472988babdf9?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1529626455594-4ff0802cfb7e?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1494790108377-be9c29b29330?q=80&w=1000&auto=format&fit=crop',
                'https://images.unsplash.com/photo-1503185912284-5271ff81b9a8?q=80&w=1000&auto=format&fit=crop'
            ]
            while (initialImages.length < 7) {
                initialImages.push({
                    id: `placeholder-${initialImages.length}`,
                    url: placeholders[initialImages.length % placeholders.length]
                })
            }
        }

        setDisplayImages(initialImages.slice(0, 7))
        setQueue(initialImages.slice(7))
    }, [images])

    useEffect(() => {
        if (queue.length === 0) return

        const interval = setInterval(() => {
            const slotToSwap = Math.floor(Math.random() * 7)
            const nextImage = queue[0]

            setDisplayImages(prev => {
                const newVisible = [...prev]
                const oldImage = newVisible[slotToSwap]
                setQueue(q => [...q.slice(1), oldImage])
                newVisible[slotToSwap] = nextImage
                return newVisible
            })

        }, 4000)

        return () => clearInterval(interval)
    }, [queue])

    if (!isMounted) return null

    return (
        <section className="py-8 px-4 sm:px-8 bg-white mb-0">
            <div className="max-w-[1400px] mx-auto grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-6 h-[600px]">
                {/* Column 1 */}
                <div className="hidden lg:flex flex-col gap-6 h-full">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-100 w-full flex-[1.5]">
                        <GalleryItem url={displayImages[0]?.url} />
                    </div>
                    <div className="relative overflow-hidden rounded-3xl bg-gray-100 w-full flex-1">
                        <GalleryItem url={displayImages[1]?.url} />
                    </div>
                </div>

                {/* Column 2 */}
                <div className="hidden md:flex flex-col gap-6 h-full">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-100 w-full h-full flex-1">
                        <GalleryItem url={displayImages[2]?.url} />
                    </div>
                </div>

                {/* Column 3 (Center) */}
                <div className="flex flex-col justify-center items-center gap-6 h-full">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-100 w-full aspect-[3/4] flex-none shadow-xl">
                        <GalleryItem url={displayImages[3]?.url} />
                    </div>
                </div>

                {/* Column 4 */}
                <div className="hidden md:flex flex-col gap-6 h-full">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-100 w-full h-full flex-1">
                        <GalleryItem url={displayImages[4]?.url} />
                    </div>
                </div>

                {/* Column 5 */}
                <div className="hidden lg:flex flex-col gap-6 h-full">
                    <div className="relative overflow-hidden rounded-3xl bg-gray-100 w-full flex-1">
                        <GalleryItem url={displayImages[5]?.url} />
                    </div>
                    <div className="relative overflow-hidden rounded-3xl bg-gray-100 w-full flex-[1.5]">
                        <GalleryItem url={displayImages[6]?.url} />
                    </div>
                </div>
            </div>
        </section>
    )
}

function GalleryItem({ url }: { url: string }) {
    const [opacity, setOpacity] = useState(0)

    useEffect(() => {
        setOpacity(0)
        const timer = setTimeout(() => setOpacity(1), 50)
        return () => clearTimeout(timer)
    }, [url])

    return (
        <div className="w-full h-full relative">
            <div
                className="w-full h-full bg-cover bg-center transition-opacity duration-700 ease-in-out transform scale-[1.01]"
                style={{
                    backgroundImage: `url(${url})`,
                    opacity: opacity
                }}
            />
        </div>
    )
}
