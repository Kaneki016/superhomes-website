'use client'

import { useState } from 'react'

interface ImageGalleryProps {
    images: string[] | null | undefined
    propertyName: string
    mainImage?: string | null
}

export default function ImageGallery({ images, propertyName, mainImage }: ImageGalleryProps) {
    const [currentIndex, setCurrentIndex] = useState(0)
    const [showModal, setShowModal] = useState(false)
    const [imageErrors, setImageErrors] = useState<Record<number, boolean>>({})

    // Ensure images is always an array (handle null/undefined from Supabase)
    const safeImages = images || []

    // Combine mainImage with images array, avoiding duplicates
    const allImages = mainImage && !safeImages.includes(mainImage)
        ? [mainImage, ...safeImages]
        : safeImages.length > 0 ? safeImages : []

    const handleImageError = (index: number) => {
        setImageErrors(prev => ({ ...prev, [index]: true }))
    }

    const navigateImage = (direction: 'prev' | 'next') => {
        if (direction === 'prev') {
            setCurrentIndex(prev => (prev - 1 + allImages.length) % allImages.length)
        } else {
            setCurrentIndex(prev => (prev + 1) % allImages.length)
        }
    }

    const openModal = (index?: number) => {
        if (index !== undefined) setCurrentIndex(index)
        setShowModal(true)
    }

    const closeModal = () => {
        setShowModal(false)
    }

    // Handle keyboard navigation in modal
    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'ArrowLeft') navigateImage('prev')
        if (e.key === 'ArrowRight') navigateImage('next')
        if (e.key === 'Escape') closeModal()
    }

    // No images available
    if (allImages.length === 0) {
        return (
            <div className="bg-gradient-to-br from-primary-100 to-accent-100 rounded-2xl h-96 mb-6 flex items-center justify-center">
                <svg className="w-32 h-32 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
            </div>
        )
    }

    // Grid layout - show up to 5 images (1 large + 4 small)
    const displayImages = allImages.slice(0, 5)
    const remainingCount = allImages.length - 5

    return (
        <>
            {/* PropertyGuru-Style Grid Gallery */}
            <div className="mb-6 rounded-2xl overflow-hidden">
                <div className="grid grid-cols-4 grid-rows-2 gap-1 h-[400px]">
                    {/* Main Large Image */}
                    <div
                        className="col-span-2 row-span-2 relative cursor-pointer group"
                        onClick={() => openModal(0)}
                    >
                        {!imageErrors[0] ? (
                            <img
                                src={displayImages[0]}
                                alt={`${propertyName} - Main`}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                                onError={() => handleImageError(0)}
                            />
                        ) : (
                            <div className="w-full h-full bg-gradient-to-br from-primary-100 to-accent-100 flex items-center justify-center">
                                <svg className="w-20 h-20 text-primary-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                            </div>
                        )}
                        {/* Image Counter Badge */}
                        <div className="absolute bottom-3 left-3 bg-black/70 text-white text-sm font-medium px-3 py-1.5 rounded-lg flex items-center gap-2">
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <span>1/{allImages.length}</span>
                        </div>
                        {/* Hover Overlay */}
                        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                    </div>

                    {/* Thumbnail Images */}
                    {displayImages.slice(1, 5).map((img, idx) => {
                        const actualIndex = idx + 1
                        const isLastWithMore = actualIndex === 4 && remainingCount > 0
                        return (
                            <div
                                key={actualIndex}
                                className="relative cursor-pointer group overflow-hidden"
                                onClick={() => openModal(actualIndex)}
                            >
                                {!imageErrors[actualIndex] ? (
                                    <img
                                        src={img}
                                        alt={`${propertyName} - ${actualIndex + 1}`}
                                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                                        onError={() => handleImageError(actualIndex)}
                                    />
                                ) : (
                                    <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                                        <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                        </svg>
                                    </div>
                                )}
                                {/* Show "+X more" overlay on last thumbnail */}
                                {isLastWithMore && (
                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                        <span className="text-white font-semibold text-lg">+{remainingCount} more</span>
                                    </div>
                                )}
                                {/* Hover Overlay */}
                                <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
                            </div>
                        )
                    })}

                    {/* Fill empty spots if less than 5 images */}
                    {displayImages.length < 5 && Array.from({ length: 5 - displayImages.length }).map((_, idx) => (
                        <div key={`empty-${idx}`} className="bg-gradient-to-br from-gray-100 to-gray-200 flex items-center justify-center">
                            <svg className="w-8 h-8 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                    ))}
                </div>

                {/* Show All Photos Button */}
                {allImages.length > 1 && (
                    <button
                        onClick={() => openModal(0)}
                        className="mt-3 w-full py-3 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium hover:bg-gray-50 hover:border-gray-300 transition-all flex items-center justify-center gap-2 shadow-sm"
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                        </svg>
                        Show all {allImages.length} photos
                    </button>
                )}
            </div>

            {/* Full Screen Modal */}
            {showModal && (
                <div
                    className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
                    onClick={closeModal}
                    onKeyDown={handleKeyDown}
                    tabIndex={0}
                >
                    {/* Close Button */}
                    <button
                        onClick={closeModal}
                        className="absolute top-4 right-4 z-10 w-12 h-12 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>

                    {/* Image Counter */}
                    <div className="absolute top-4 left-4 bg-black/50 text-white px-4 py-2 rounded-lg font-medium">
                        {currentIndex + 1} / {allImages.length}
                    </div>

                    {/* Previous Button */}
                    {allImages.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateImage('prev'); }}
                            className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                            </svg>
                        </button>
                    )}

                    {/* Main Image */}
                    <div className="max-w-5xl max-h-[80vh] px-16" onClick={(e) => e.stopPropagation()}>
                        <img
                            src={allImages[currentIndex]}
                            alt={`${propertyName} - ${currentIndex + 1}`}
                            className="max-w-full max-h-[80vh] object-contain mx-auto rounded-lg"
                            onError={() => handleImageError(currentIndex)}
                        />
                    </div>

                    {/* Next Button */}
                    {allImages.length > 1 && (
                        <button
                            onClick={(e) => { e.stopPropagation(); navigateImage('next'); }}
                            className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
                        >
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                            </svg>
                        </button>
                    )}

                    {/* Thumbnail Strip */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 overflow-x-auto max-w-[90vw] p-2 bg-black/50 rounded-xl">
                        {allImages.map((img, idx) => (
                            <button
                                key={idx}
                                onClick={(e) => { e.stopPropagation(); setCurrentIndex(idx); }}
                                className={`flex-shrink-0 w-16 h-12 rounded-lg overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-white opacity-100' : 'border-transparent opacity-60 hover:opacity-100'
                                    }`}
                            >
                                <img
                                    src={img}
                                    alt={`Thumbnail ${idx + 1}`}
                                    className="w-full h-full object-cover"
                                />
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </>
    )
}
