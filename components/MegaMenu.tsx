import Link from 'next/link'
import { useState, useRef, useEffect } from 'react'

interface MegaMenuProps {
    title: string
    basePath: string
    items: {
        locations: string[]
        propertyTypes: {
            title: string
            types: string[]
        }[]
        resources?: {
            title: string
            items: { label: string; href: string }[]
        }
    }
}

export default function MegaMenu({ title, basePath, items }: MegaMenuProps) {
    const [isOpen, setIsOpen] = useState(false)
    const timeoutRef = useRef<NodeJS.Timeout | null>(null)

    const handleMouseEnter = () => {
        if (timeoutRef.current) clearTimeout(timeoutRef.current)
        setIsOpen(true)
    }

    const handleMouseLeave = () => {
        timeoutRef.current = setTimeout(() => {
            setIsOpen(false)
        }, 150) // Small delay to prevent flickering when moving cursor
    }

    // Helper to format slug
    const toSlug = (str: string) => str.toLowerCase().replace(/ /g, '-')

    return (
        <div
            className="relative"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={handleMouseLeave}
        >
            <Link
                href={basePath}
                className={`text-gray-700 hover:text-primary-600 font-medium transition-colors flex items-center gap-1 ${isOpen ? 'text-primary-600' : ''}`}
            >
                {title}
                <svg
                    className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
            </Link>

            {/* Dropdown Content */}
            <div
                className={`absolute top-full left-0 mt-0 w-[800px] bg-white rounded-xl shadow-xl border border-gray-100 p-8 z-50 transform transition-all duration-200 origin-top-left ${isOpen
                    ? 'opacity-100 translate-y-0 visible'
                    : 'opacity-0 translate-y-2 invisible'
                    }`}
            >
                <div className="grid grid-cols-4 gap-8">
                    {/* Locations Column */}
                    <div>
                        <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">Locations</h3>
                        <div className="flex flex-col gap-2">
                            {items.locations.map((loc) => (
                                <Link
                                    key={loc}
                                    href={`${basePath}/${toSlug(loc)}`} // e.g. /properties/kuala-lumpur
                                    className="text-gray-600 hover:text-primary-600 text-sm transition-colors"
                                >
                                    {loc}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Property Types Columns (Span 2) */}
                    {items.propertyTypes.map((category, idx) => (
                        <div key={idx}>
                            <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">
                                {category.title}
                            </h3>
                            <div className="flex flex-col gap-2">
                                {category.types.map((type) => (
                                    <Link
                                        key={type}
                                        href={`${basePath}/${toSlug(type)}`} // e.g. /properties/condo
                                        className="text-gray-600 hover:text-primary-600 text-sm transition-colors"
                                    >
                                        {/* Pluralize logic if needed, but 'Condo' is fine usually */}
                                        {/* PropertyGuru uses Plurals e.g. 'Condos', 'Apartments' */}
                                        {type}
                                    </Link>
                                ))}
                            </div>
                        </div>
                    ))}

                    {/* Resources / Extra Column */}
                    {items.resources && (
                        <div className="bg-gray-50 -my-8 -mr-8 p-8 rounded-r-xl">
                            <h3 className="font-bold text-gray-900 mb-4 uppercase text-xs tracking-wider">
                                {items.resources.title}
                            </h3>
                            <div className="flex flex-col gap-3">
                                {items.resources.items.map((item) => (
                                    <Link
                                        key={item.label}
                                        href={item.href}
                                        className="text-gray-600 hover:text-primary-600 text-sm transition-colors flex items-center justify-between group"
                                    >
                                        {item.label}
                                        <svg className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity -ml-4 group-hover:ml-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                        </svg>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>

                {/* View All Link */}
                <div className="mt-6 pt-6 border-t border-gray-100 flex justify-end">
                    <Link
                        href={basePath}
                        className="inline-flex items-center gap-2 text-primary-600 font-semibold hover:text-primary-700 transition-colors group/link"
                    >
                        View All {title}
                        <svg className="w-4 h-4 transition-transform group-hover/link:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                    </Link>
                </div>
            </div>
        </div>
    )
}
