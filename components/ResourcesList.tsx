'use client'

import { useState, useMemo } from 'react'
import { ResourcePost } from '@/lib/blog'
import Link from 'next/link'
import Image from 'next/image'

interface ResourcesListProps {
    initialResources: ResourcePost[]
    categories: string[]
}

export default function ResourcesList({ initialResources, categories }: ResourcesListProps) {
    const [searchQuery, setSearchQuery] = useState('')
    const [selectedCategory, setSelectedCategory] = useState('')

    const filteredResources = useMemo(() => {
        return initialResources.filter((post) => {
            const matchesSearch =
                post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                post.description.toLowerCase().includes(searchQuery.toLowerCase())
            const matchesCategory = selectedCategory ? post.category === selectedCategory : true

            return matchesSearch && matchesCategory
        })
    }, [initialResources, searchQuery, selectedCategory])

    return (
        <div>
            {/* Filter Section */}
            <div className="mb-12 space-y-4 md:space-y-0 md:flex md:items-center md:justify-between bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                {/* Search */}
                <div className="relative flex-1 max-w-md">
                    <input
                        type="text"
                        placeholder="Search articles..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-rose-500 focus:border-transparent transition-all"
                    />
                    <svg
                        className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                        />
                    </svg>
                </div>

                {/* Category Filter */}
                <div className="flex items-center space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
                    <button
                        onClick={() => setSelectedCategory('')}
                        className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${!selectedCategory
                                ? 'bg-rose-600 text-white shadow-md'
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                    >
                        All
                    </button>
                    {categories.map((category) => (
                        <button
                            key={category}
                            onClick={() => setSelectedCategory(category)}
                            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${selectedCategory === category
                                    ? 'bg-rose-600 text-white shadow-md'
                                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                                }`}
                        >
                            {category}
                        </button>
                    ))}
                </div>
            </div>

            {/* Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredResources.length > 0 ? (
                    filteredResources.map((post) => (
                        <Link
                            key={post.slug}
                            href={`/resources/${post.slug}`}
                            className="group bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 overflow-hidden border border-gray-100 flex flex-col h-full"
                        >
                            <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                                <Image
                                    src={post.image || '/images/resources/default-cover.jpg'}
                                    alt={post.title}
                                    fill
                                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                    onError={(e) => {
                                        // Fallback logic handled by next/image? 
                                        // No, standard next/image doesn't have easy onError fallback for src
                                        // So we rely on Short-circuit evaluation above.
                                        // Ideally we use a wrapper, but simple OR is fine if the path is missing.
                                        // If file is missing (404), it won't trigger standard JS logic in SSR easily.
                                        // But valid path + missing file = broken image. 
                                        // For now we assume user will provide images or default exists.
                                    }}
                                />
                                <div className="absolute top-4 left-4">
                                    <span className="bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-xs font-semibold text-rose-600 shadow-sm">
                                        {post.category}
                                    </span>
                                </div>
                            </div>
                            <div className="p-6 flex-1 flex flex-col">
                                <div className="text-sm text-gray-500 mb-2">{post.date}</div>
                                <h2 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-rose-600 transition-colors line-clamp-2">
                                    {post.title}
                                </h2>
                                <p className="text-gray-600 line-clamp-3 mb-4 flex-1">
                                    {post.description}
                                </p>
                                <div className="flex items-center text-rose-600 font-medium text-sm mt-auto">
                                    Read Article
                                    <svg
                                        className="w-4 h-4 ml-1 group-hover:translate-x-1 transition-transform"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M17 8l4 4m0 0l-4 4m4-4H3"
                                        />
                                    </svg>
                                </div>
                            </div>
                        </Link>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-gray-500 bg-white rounded-2xl border border-dashed border-gray-200">
                        <svg className="w-12 h-12 mx-auto text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg">No articles found matching your criteria.</p>
                        <button
                            onClick={() => { setSearchQuery(''); setSelectedCategory('') }}
                            className="mt-4 text-rose-600 hover:text-rose-700 font-medium"
                        >
                            Clear filters
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
