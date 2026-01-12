'use client'

import { useEffect, useState, useCallback } from 'react'

interface ImageLightboxProps {
    images: string[]
    initialIndex?: number
    isOpen: boolean
    onClose: () => void
}

export default function ImageLightbox({ images, initialIndex = 0, isOpen, onClose }: ImageLightboxProps) {
    const [currentIndex, setCurrentIndex] = useState(initialIndex)
    const [isLoading, setIsLoading] = useState(true)

    useEffect(() => {
        setCurrentIndex(initialIndex)
    }, [initialIndex])

    const goToPrevious = useCallback(() => {
        setIsLoading(true)
        setCurrentIndex((prev) => (prev - 1 + images.length) % images.length)
    }, [images.length])

    const goToNext = useCallback(() => {
        setIsLoading(true)
        setCurrentIndex((prev) => (prev + 1) % images.length)
    }, [images.length])

    useEffect(() => {
        if (!isOpen) return

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') onClose()
            if (e.key === 'ArrowLeft') goToPrevious()
            if (e.key === 'ArrowRight') goToNext()
        }

        window.addEventListener('keydown', handleKeyDown)
        // Prevent body scroll when lightbox is open
        document.body.style.overflow = 'hidden'

        return () => {
            window.removeEventListener('keydown', handleKeyDown)
            document.body.style.overflow = 'unset'
        }
    }, [isOpen, onClose, goToPrevious, goToNext])

    if (!isOpen) return null

    return (
        <div
            className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
            onClick={onClose}
        >
            {/* Close button */}
            <button
                onClick={onClose}
                className="absolute top-4 right-4 z-[110] w-10 h-10 flex items-center justify-center text-white hover:bg-white/10 rounded-full transition-colors"
                aria-label="Close lightbox"
            >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
            </button>

            {/* Image counter */}
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[110] bg-black/60 text-white px-4 py-2 rounded-full text-sm font-medium">
                {currentIndex + 1} / {images.length}
            </div>

            {/* Previous button */}
            {images.length > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        goToPrevious()
                    }}
                    className="absolute left-4 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 flex items-center justify-center text-white bg-black/50 hover:bg-black/70 rounded-full transition-all"
                    aria-label="Previous image"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>
            )}

            {/* Main image */}
            <div
                className="relative w-full h-full flex items-center justify-center p-0 md:p-4"
                onClick={(e) => e.stopPropagation()}
            >
                {isLoading && (
                    <div className="absolute inset-0 flex items-center justify-center">
                        <div className="w-12 h-12 border-4 border-white/20 border-t-white rounded-full animate-spin"></div>
                    </div>
                )}
                <img
                    src={images[currentIndex]}
                    alt={`Property image ${currentIndex + 1}`}
                    className="max-w-full max-h-full object-contain"
                    onLoad={() => setIsLoading(false)}
                />
            </div>

            {/* Next button */}
            {images.length > 1 && (
                <button
                    onClick={(e) => {
                        e.stopPropagation()
                        goToNext()
                    }}
                    className="absolute right-4 top-1/2 -translate-y-1/2 z-[110] w-12 h-12 flex items-center justify-center text-white bg-black/50 hover:bg-black/70 rounded-full transition-all"
                    aria-label="Next image"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>
            )}

            {/* Thumbnail strip (optional, for mobile swipe hint) */}
            {images.length > 1 && (
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-[110] flex gap-2 max-w-full overflow-x-auto px-4">
                    {images.slice(0, 8).map((_, idx) => (
                        <button
                            key={idx}
                            onClick={(e) => {
                                e.stopPropagation()
                                setIsLoading(true)
                                setCurrentIndex(idx)
                            }}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex
                                ? 'bg-white w-8'
                                : 'bg-white/50 hover:bg-white/75'
                                }`}
                            aria-label={`Go to image ${idx + 1}`}
                        />
                    ))}
                    {images.length > 8 && (
                        <span className="text-white/60 text-xs self-center ml-1">+{images.length - 8}</span>
                    )}
                </div>
            )}
        </div>
    )
}
