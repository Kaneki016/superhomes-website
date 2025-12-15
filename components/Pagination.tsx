'use client'

interface PaginationProps {
    currentPage: number
    totalPages: number
    onPageChange: (page: number) => void
    className?: string
}

export default function Pagination({ currentPage, totalPages, onPageChange, className = '' }: PaginationProps) {
    if (totalPages <= 1) return null

    // Generate page numbers to display
    const getPageNumbers = () => {
        const pages: (number | 'ellipsis')[] = []

        // Always show first page
        pages.push(1)

        if (totalPages <= 7) {
            // Show all pages if 7 or less
            for (let i = 2; i <= totalPages; i++) {
                pages.push(i)
            }
        } else {
            // Show ellipsis logic for many pages
            if (currentPage <= 3) {
                // Near the start
                pages.push(2, 3, 4)
                pages.push('ellipsis')
                pages.push(totalPages)
            } else if (currentPage >= totalPages - 2) {
                // Near the end
                pages.push('ellipsis')
                pages.push(totalPages - 3, totalPages - 2, totalPages - 1, totalPages)
            } else {
                // In the middle
                pages.push('ellipsis')
                pages.push(currentPage - 1, currentPage, currentPage + 1)
                pages.push('ellipsis')
                pages.push(totalPages)
            }
        }

        return pages
    }

    const pageNumbers = getPageNumbers()

    return (
        <div className={`pagination-container ${className}`}>
            <nav className="pagination-wrapper" aria-label="Pagination">
                {/* First Page */}
                <button
                    onClick={() => onPageChange(1)}
                    disabled={currentPage === 1}
                    className="pagination-nav-btn"
                    aria-label="First page"
                    title="First page"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                </button>

                {/* Previous Page */}
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="pagination-nav-btn"
                    aria-label="Previous page"
                    title="Previous page"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                </button>

                {/* Page Numbers */}
                <div className="pagination-pages">
                    {pageNumbers.map((page, index) => (
                        page === 'ellipsis' ? (
                            <span key={`ellipsis-${index}`} className="pagination-ellipsis">
                                ...
                            </span>
                        ) : (
                            <button
                                key={page}
                                onClick={() => onPageChange(page)}
                                className={`pagination-page-btn ${currentPage === page ? 'active' : ''}`}
                                aria-current={currentPage === page ? 'page' : undefined}
                            >
                                {page}
                            </button>
                        )
                    ))}
                </div>

                {/* Next Page */}
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="pagination-nav-btn"
                    aria-label="Next page"
                    title="Next page"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                </button>

                {/* Last Page */}
                <button
                    onClick={() => onPageChange(totalPages)}
                    disabled={currentPage === totalPages}
                    className="pagination-nav-btn"
                    aria-label="Last page"
                    title="Last page"
                >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                </button>
            </nav>
        </div>
    )
}
