import Link from 'next/link'

interface EmptyStateProps {
    type: 'properties' | 'agents' | 'favorites'
    title?: string
    description?: string
    actionLabel?: string
    actionHref?: string
    suggestions?: string[]
}

export default function EmptyState({
    type,
    title,
    description,
    actionLabel,
    actionHref,
    suggestions
}: EmptyStateProps) {
    // Default content based on type
    const defaults = {
        properties: {
            title: 'No Properties Found',
            description: "We couldn't find any properties matching your search criteria.",
            actionLabel: 'Browse All Properties',
            actionHref: '/properties',
            icon: (
                <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
            ),
            suggestions: [
                'Try adjusting your filters',
                'Search in different locations',
                'Expand your price range'
            ]
        },
        agents: {
            title: 'No Agents Found',
            description: "We couldn't find any agents matching your search.",
            actionLabel: 'View All Agents',
            actionHref: '/agents',
            icon: (
                <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            ),
            suggestions: [
                'Try a different search term',
                'Browse top-rated agents',
                'Search by agency name'
            ]
        },
        favorites: {
            title: 'No Saved Properties Yet',
            description: "You haven't saved any properties to your favorites list.",
            actionLabel: 'Explore Properties',
            actionHref: '/properties',
            icon: (
                <svg className="w-24 h-24 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
            ),
            suggestions: [
                'Click the heart icon on properties you like',
                'Build your shortlist to compare later',
                'Save properties to share with family'
            ]
        }
    }

    const content = defaults[type]
    const finalTitle = title || content.title
    const finalDescription = description || content.description
    const finalActionLabel = actionLabel || content.actionLabel
    const finalActionHref = actionHref || content.actionHref
    const finalSuggestions = suggestions || content.suggestions

    return (
        <div className="flex flex-col items-center justify-center py-16 px-4">
            {/* Icon */}
            <div className="mb-6 animate-fade-in">
                {content.icon}
            </div>

            {/* Title */}
            <h3 className="font-heading font-bold text-2xl text-gray-900 mb-3 text-center">
                {finalTitle}
            </h3>

            {/* Description */}
            <p className="text-gray-600 text-center max-w-md mb-8">
                {finalDescription}
            </p>

            {/* Action Button */}
            {finalActionHref && (
                <Link
                    href={finalActionHref}
                    className="inline-flex items-center gap-2 bg-gradient-primary text-white font-semibold px-6 py-3 rounded-lg hover:shadow-lg hover:scale-105 transition-all duration-300 mb-8"
                >
                    {finalActionLabel}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </Link>
            )}

            {/* Helpful Suggestions */}
            {finalSuggestions && finalSuggestions.length > 0 && (
                <div className="bg-gray-50 rounded-xl p-6 max-w-lg w-full">
                    <h4 className="font-semibold text-gray-900 mb-3 text-sm">💡 Helpful Tips:</h4>
                    <ul className="space-y-2">
                        {finalSuggestions.map((suggestion, index) => (
                            <li key={index} className="flex items-start gap-2 text-sm text-gray-600">
                                <svg className="w-5 h-5 text-rose-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                                </svg>
                                <span>{suggestion}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    )
}
