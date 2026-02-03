'use client'
import Link from 'next/link'
import { ChevronRightIcon } from '@heroicons/react/20/solid'

export interface BreadcrumbItem {
    label: string
    href?: string
}

interface BreadcrumbsProps {
    items: BreadcrumbItem[]
}

export default function Breadcrumbs({ items }: BreadcrumbsProps) {
    return (
        <nav className="flex" aria-label="Breadcrumb">
            <ol role="list" className="flex items-center space-x-2">
                <li>
                    <div>
                        <Link href="/" className="text-gray-400 hover:text-gray-500">
                            <span className="sr-only">Home</span>
                            <svg className="h-5 w-5 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                <path fillRule="evenodd" d="M9.293 2.293a1 1 0 011.414 0l7 7A1 1 0 0117 11h-1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-3a1 1 0 00-1-1H9a1 1 0 00-1 1v3a1 1 0 01-1 1H5a1 1 0 01-1-1v-6H3a1 1 0 01-.707-1.707l7-7z" clipRule="evenodd" />
                            </svg>
                        </Link>
                    </div>
                </li>
                {items.map((item, index) => (
                    <li key={item.label}>
                        <div className="flex items-center">
                            <ChevronRightIcon className="h-5 w-5 flex-shrink-0 text-gray-400" aria-hidden="true" />
                            {item.href ? (
                                <Link
                                    href={item.href}
                                    className="ml-2 text-sm font-medium text-gray-500 hover:text-gray-700 capitalize"
                                >
                                    {item.label}
                                </Link>
                            ) : (
                                <span className="ml-2 text-sm font-medium text-gray-700 capitalize" aria-current="page">
                                    {item.label}
                                </span>
                            )}
                        </div>
                    </li>
                ))}
            </ol>
        </nav>
    )
}
