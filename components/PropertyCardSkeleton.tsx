'use client'

export default function PropertyCardSkeleton() {
    return (
        <div className="property-card-v2 animate-pulse">
            {/* Agent Header Skeleton */}
            <div className="property-card-header">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="property-card-avatar bg-gray-200"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
                <div className="h-8 bg-gray-200 rounded-full w-20"></div>
            </div>

            {/* Image Skeleton */}
            <div className="property-card-gallery">
                <div className="w-full h-full bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] animate-shimmer"></div>
            </div>

            {/* Content Skeleton */}
            <div className="property-card-content">
                {/* Price */}
                <div className="price-section">
                    <div className="h-6 bg-gray-200 rounded w-32 mb-1"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>

                {/* Title & Address */}
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-4 bg-gray-200 rounded w-full mb-4"></div>

                {/* Features */}
                <div className="property-features">
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <div className="h-4 bg-gray-200 rounded w-12"></div>
                    <span className="feature-divider"></span>
                    <div className="h-4 bg-gray-200 rounded w-16"></div>
                    <span className="feature-divider"></span>
                    <div className="h-4 bg-gray-200 rounded w-20"></div>
                </div>

                {/* Recency */}
                <div className="property-recency">
                    <div className="w-4 h-4 bg-gray-200 rounded"></div>
                    <div className="h-4 bg-gray-200 rounded w-24"></div>
                </div>
            </div>
        </div>
    )
}
