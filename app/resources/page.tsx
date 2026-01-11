
import { getAllResources, getAllCategories } from '@/lib/blog'
import Navbar from '@/components/Navbar'
import ResourcesList from '@/components/ResourcesList'

export const metadata = {
    title: 'Property Resources & Guides | SuperHomes',
    description: 'Expert guides, checklists, and tips for buying, selling, and owning property in Malaysia.',
}

export default function ResourcesPage() {
    const resources = getAllResources()
    const categories = getAllCategories()

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col">
            <Navbar />

            {/* Header Section */}
            <div className="bg-white border-b border-gray-100 py-16">
                <div className="container mx-auto px-4 text-center">
                    <h1 className="text-4xl md:text-5xl font-bold font-heading text-gray-900 mb-4">
                        Property Resources
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Your trusted guide to navigating the Malaysian property market.
                        Find checklists, tax guides, and investment tips here.
                    </p>
                </div>
            </div>

            {/* Content Section */}
            <div className="flex-1 container mx-auto px-4 py-12">
                <ResourcesList initialResources={resources} categories={categories} />
            </div>

            {/* Simple Footer */}
            <div className="bg-white border-t border-gray-100 py-8 text-center text-gray-500 text-sm">
                &copy; 2026 SuperHomes. All rights reserved.
            </div>
        </div>
    )
}
