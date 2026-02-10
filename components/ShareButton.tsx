'use client'

import { useState } from 'react'
import { Check, Share2, Link as LinkIcon } from 'lucide-react'
import { trackShare } from '@/lib/gtag'

interface ShareButtonProps {
    url: string
    title?: string
    className?: string
    variant?: 'default' | 'icon'
}

export default function ShareButton({
    url,
    title = 'Check out this property',
    className = '',
    variant = 'default'
}: ShareButtonProps) {
    const [copied, setCopied] = useState(false)

    const handleShare = async () => {
        trackShare('share_button', 'property', url)
        // Check if Web Share API is available (mobile)
        if (navigator.share) {
            try {
                await navigator.share({
                    title: title,
                    url: url,
                })
            } catch (error) {
                // User cancelled share or error occurred - silently ignore
            }
        } else {
            // Fallback to clipboard copy (desktop)
            try {
                await navigator.clipboard.writeText(url)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
            } catch (error) {
                console.error('Failed to copy:', error)
            }
        }
    }

    if (variant === 'icon') {
        return (
            <button
                onClick={handleShare}
                className={`flex items-center justify-center transition-all ${className}`}
                title={copied ? 'Line Copied' : 'Share'}
            >
                {copied ? <Check size={20} className="text-green-600" /> : <Share2 size={20} />}
            </button>
        )
    }

    return (
        <button
            onClick={handleShare}
            className={`inline-flex items-center gap-2 px-4 py-2 bg-white border-2 border-gray-300 hover:border-primary-500 text-gray-700 hover:text-primary-600 rounded-lg font-medium transition-all shadow-sm hover:shadow-md ${className}`}
        >
            {copied ? (
                <>
                    <Check size={18} />
                    <span>Link Copied!</span>
                </>
            ) : (
                <>
                    <Share2 size={18} />
                    <span>Share</span>
                </>
            )}
        </button>
    )
}
