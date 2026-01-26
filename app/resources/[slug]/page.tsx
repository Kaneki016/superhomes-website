
import { getResourceBySlug, getAllResources, getRelatedResources } from '@/lib/blog'
import Navbar from '@/components/Navbar'
import Link from 'next/link'
import Image from 'next/image'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import RelatedListings from '@/components/RelatedListings'
import { notFound } from 'next/navigation'
import { Metadata } from 'next'

interface PageProps {
    params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
    const { slug } = await params
    const post = getResourceBySlug(slug)

    if (!post) {
        return {
            title: 'Article Not Found',
        }
    }

    const ogImage = post.image || '/images/resources/default-cover.jpg'

    return {
        title: `${post.title} | SuperHomes Resources`,
        description: post.description,
        keywords: post.keywords,
        openGraph: {
            title: post.title,
            description: post.description,
            type: 'article',
            url: `https://superhomes.my/resources/${post.slug}`,
            images: [
                {
                    url: ogImage,
                    width: 1200,
                    height: 630,
                    alt: post.title,
                },
            ],
        },
        twitter: {
            card: 'summary_large_image',
            title: post.title,
            description: post.description,
            images: [ogImage],
        }
    }
}

export async function generateStaticParams() {
    const posts = getAllResources()
    return posts.map((post) => ({
        slug: post.slug,
    }))
}

export default async function ResourcePostPage({ params }: PageProps) {
    const { slug } = await params
    const post = getResourceBySlug(slug)

    if (!post) {
        notFound()
    }

    const relatedPosts = getRelatedResources(slug, post.category, 3)
    const coverImage = post.image || '/images/resources/default-cover.jpg'

    // JSON-LD for SEO
    const jsonLd = {
        '@context': 'https://schema.org',
        '@type': 'Article',
        headline: post.title,
        description: post.description,
        image: coverImage,
        datePublished: post.date,
        author: {
            '@type': 'Organization',
            name: 'SuperHomes Team',
        },
    }

    return (
        <div className="min-h-screen bg-white">
            <Navbar />

            {/* Structured Data */}
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
            />

            {/* Article Hero */}
            <div className="bg-gray-50 border-b border-gray-100">
                <div className="container mx-auto px-4 py-12 md:py-16 max-w-4xl">
                    <div className="flex items-center gap-2 text-sm text-gray-500 mb-6">
                        <Link href="/resources" className="hover:text-rose-600 transition-colors">
                            Resources
                        </Link>
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                        <span className="text-rose-600 font-medium">{post.category}</span>
                    </div>

                    <h1 className="text-3xl md:text-5xl font-bold font-heading text-gray-900 mb-6 leading-tight">
                        {post.title}
                    </h1>

                    <div className="flex items-center justify-between border-t border-gray-200 pt-6">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-full bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
                                SH
                            </div>
                            <div>
                                <div className="font-medium text-gray-900">SuperHomes Team</div>
                                <div className="text-sm text-gray-500">{post.date}</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Article Content */}
            <div className="container mx-auto px-4 py-12 max-w-4xl">
                {/* Cover Image */}
                <div className="rounded-2xl overflow-hidden shadow-lg mb-12 relative aspect-video bg-gray-200">
                    <Image
                        src={coverImage}
                        alt={post.title}
                        fill
                        className="object-cover"
                        priority
                    />
                </div>

                {/* Markdown Body */}
                <article className="prose prose-lg prose-rose max-w-none prose-headings:font-heading prose-headings:font-bold prose-headings:scroll-mt-24 prose-a:text-rose-600 hover:prose-a:text-rose-700 prose-img:rounded-xl prose-img:shadow-md prose-table:border-collapse prose-table:w-full prose-th:border prose-th:border-gray-200 prose-th:p-4 prose-th:bg-gray-50 prose-td:border prose-td:border-gray-200 prose-td:p-4">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{post.content}</ReactMarkdown>
                </article>

                {/* Live Property Listings */}
                {post.neighborhoods && post.neighborhoods.length > 0 && (
                    <RelatedListings neighborhoods={post.neighborhoods} />
                )}

                {/* Tags / Share / Back Link */}
                <div className="mt-16 pt-8 border-t border-gray-100 flex justify-between items-center">
                    <Link
                        href="/resources"
                        className="inline-flex items-center text-gray-600 font-medium hover:text-rose-600 transition-colors"
                    >
                        <svg className="w-5 h-5 mr-2 rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                        </svg>
                        Back to Resources
                    </Link>
                </div>
            </div>

            {/* Related Resources Section */}
            {relatedPosts.length > 0 && (
                <div className="bg-gray-50 py-16 border-t border-gray-100">
                    <div className="container mx-auto px-4">
                        <h3 className="text-2xl font-bold font-heading text-gray-900 mb-8 text-center">
                            Related Articles
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
                            {relatedPosts.map((related) => (
                                <Link
                                    key={related.slug}
                                    href={`/resources/${related.slug}`}
                                    className="group bg-white rounded-xl shadow-sm hover:shadow-lg transition-all overflow-hidden flex flex-col"
                                >
                                    <div className="relative h-48 w-full bg-gray-200 overflow-hidden">
                                        <Image
                                            src={related.image || '/images/resources/default-cover.jpg'}
                                            alt={related.title}
                                            fill
                                            className="object-cover group-hover:scale-105 transition-transform duration-500"
                                        />
                                    </div>
                                    <div className="p-5 flex-1 flex flex-col">
                                        <span className="text-rose-600 text-xs font-bold uppercase tracking-wider mb-2">
                                            {related.category}
                                        </span>
                                        <h4 className="text-lg font-bold text-gray-900 mb-2 group-hover:text-rose-600 transition-colors line-clamp-2">
                                            {related.title}
                                        </h4>
                                        <div className="mt-auto text-sm text-gray-500">
                                            {related.date}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}
