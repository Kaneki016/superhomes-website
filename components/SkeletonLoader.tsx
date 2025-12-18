/**
 * Reusable Skeleton Loader Components
 * PropertyGuru-inspired loading states for better UX
 */

interface SkeletonProps {
    className?: string
}

// Base Skeleton Component
export function Skeleton({ className = '' }: SkeletonProps) {
    return (
        <div className={`animate-pulse bg-gray-200 rounded ${className}`} />
    )
}

// Property Card Skeleton (PropertyGuru style)
export function PropertyCardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            {/* Image Skeleton */}
            <div className="relative h-56 bg-gray-200 animate-pulse" />

            {/* Content Skeleton */}
            <div className="p-4 space-y-3">
                {/* Price */}
                <div className="h-6 bg-gray-200 rounded w-2/3 animate-pulse" />

                {/* Title */}
                <div className="h-5 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-5 bg-gray-200 rounded w-4/5 animate-pulse" />

                {/* Address */}
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />

                {/* Features */}
                <div className="flex gap-3 pt-2">
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-16 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-20 animate-pulse" />
                </div>
            </div>
        </div>
    )
}

// Agent Card Skeleton
export function AgentCardSkeleton() {
    return (
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden p-6">
            <div className="flex items-start gap-4">
                {/* Avatar */}
                <div className="w-16 h-16 rounded-full bg-gray-200 animate-pulse flex-shrink-0" />

                {/* Info */}
                <div className="flex-1 space-y-2">
                    <div className="h-5 bg-gray-200 rounded w-3/4 animate-pulse" />
                    <div className="h-4 bg-gray-200 rounded w-1/2 animate-pulse" />
                    <div className="h-3 bg-gray-200 rounded w-2/3 animate-pulse" />
                </div>
            </div>

            {/* Contact Info */}
            <div className="mt-4 pt-4 border-t border-gray-100 space-y-2">
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-4/5 animate-pulse" />
            </div>

            {/* Buttons */}
            <div className="mt-4 flex gap-2">
                <div className="flex-1 h-10 bg-gray-200 rounded-lg animate-pulse" />
                <div className="h-10 w-32 bg-gray-200 rounded-lg animate-pulse" />
            </div>
        </div>
    )
}

// Property Detail Skeleton
export function PropertyDetailSkeleton() {
    return (
        <div className="space-y-6">
            {/* Hero Image */}
            <div className="h-96 bg-gray-200 rounded-xl animate-pulse" />

            {/* Title & Price */}
            <div className="space-y-3">
                <div className="h-8 bg-gray-200 rounded w-3/4 animate-pulse" />
                <div className="h-6 bg-gray-200 rounded w-1/3 animate-pulse" />
            </div>

            {/* Features Grid */}
            <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="h-20 bg-gray-200 rounded-lg animate-pulse" />
                ))}
            </div>

            {/* Description */}
            <div className="space-y-2">
                <div className="h-5 bg-gray-200 rounded w-1/4 animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-full animate-pulse" />
                <div className="h-4 bg-gray-200 rounded w-3/4 animate-pulse" />
            </div>
        </div>
    )
}

// Search Bar Skeleton
export function SearchBarSkeleton() {
    return (
        <div className="h-14 bg-gray-200 rounded-xl animate-pulse w-full" />
    )
}

// List Skeleton - Renders multiple skeleton items
interface ListSkeletonProps {
    count?: number
    type: 'property' | 'agent'
}

export function ListSkeleton({ count = 6, type }: ListSkeletonProps) {
    const SkeletonComponent = type === 'property' ? PropertyCardSkeleton : AgentCardSkeleton

    return (
        <div className={
            type === 'property'
                ? 'grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6'
                : 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6'
        }>
            {Array.from({ length: count }).map((_, i) => (
                <SkeletonComponent key={i} />
            ))}
        </div>
    )
}
