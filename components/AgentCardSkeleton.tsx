'use client'

export default function AgentCardSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-start gap-4">
                {/* Agent Photo Skeleton */}
                <div className="w-20 h-20 bg-gradient-to-br from-gray-200 via-gray-100 to-gray-200 bg-[length:200%_200%] animate-shimmer rounded-full flex-shrink-0"></div>

                <div className="flex-1 min-w-0">
                    {/* Name */}
                    <div className="h-5 bg-gray-200 rounded w-32 mb-2"></div>

                    {/* Agency */}
                    <div className="h-4 bg-gray-200 rounded w-40 mb-3"></div>

                    {/* Stats */}
                    <div className="flex gap-4">
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                        <div className="h-4 bg-gray-200 rounded w-24"></div>
                    </div>
                </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 mt-4">
                <div className="h-9 bg-gray-200 rounded-lg flex-1"></div>
                <div className="h-9 bg-gray-200 rounded-lg w-20"></div>
            </div>
        </div>
    )
}
