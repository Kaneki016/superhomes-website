'use client'

import { useState, useRef, useEffect, useMemo, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { ChevronDown, Search, X, Check } from 'lucide-react'

interface SearchableSelectProps {
    options: string[]
    value: string
    onChange: (value: string) => void
    placeholder?: string
    searchPlaceholder?: string
    label?: string
    disabled?: boolean
    className?: string
}

// Position of the floating dropdown anchored to the trigger button
interface DropdownPos {
    top: number
    left: number
    width: number
    openUp: boolean
}

export default function SearchableSelect({
    options,
    value,
    onChange,
    placeholder = 'Select option',
    searchPlaceholder = 'Search...',
    label,
    disabled = false,
    className = ''
}: SearchableSelectProps) {
    const [isOpen, setIsOpen] = useState(false)
    const [query, setQuery] = useState('')
    const [dropdownPos, setDropdownPos] = useState<DropdownPos | null>(null)
    const [isMobile, setIsMobile] = useState(false)
    const [mounted, setMounted] = useState(false)

    const containerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)
    const dropdownRef = useRef<HTMLDivElement>(null)

    // Filter options based on query
    const filteredOptions = useMemo(() => {
        if (!query) return options
        return options.filter(option =>
            option.toLowerCase().includes(query.toLowerCase())
        )
    }, [options, query])

    // Mount check (for portal)
    useEffect(() => {
        setMounted(true)
        setIsMobile(window.innerWidth < 768)

        const onResize = () => setIsMobile(window.innerWidth < 768)
        window.addEventListener('resize', onResize)
        return () => window.removeEventListener('resize', onResize)
    }, [])

    // Calculate dropdown anchor position from the trigger button rect
    const computePosition = useCallback(() => {
        if (!containerRef.current) return
        const rect = containerRef.current.getBoundingClientRect()
        const spaceBelow = window.innerHeight - rect.bottom
        const spaceAbove = rect.top
        const dropdownH = Math.min(320, options.length * 40 + 60) // estimate

        // Open upward if not enough space below but enough above
        const openUp = spaceBelow < dropdownH && spaceAbove > spaceBelow

        // Clamp left so dropdown never exceeds right viewport edge
        const idealLeft = rect.left
        const dropW = Math.max(rect.width, 220)
        const clampedLeft = Math.min(idealLeft, window.innerWidth - dropW - 8)

        setDropdownPos({
            top: openUp ? rect.top - 4 : rect.bottom + 4,
            left: Math.max(8, clampedLeft),
            width: Math.max(rect.width, 220),
            openUp,
        })
    }, [options.length])

    const openDropdown = () => {
        if (disabled) return
        computePosition()
        setIsOpen(true)
    }

    const closeDropdown = useCallback(() => {
        setIsOpen(false)
        setQuery('')
    }, [])

    // Re-focus search on open
    useEffect(() => {
        if (isOpen && searchInputRef.current && !isMobile) {
            // Small delay to let portal render first
            const t = setTimeout(() => searchInputRef.current?.focus(), 50)
            return () => clearTimeout(t)
        }
        if (isOpen && searchInputRef.current && isMobile) {
            const t = setTimeout(() => searchInputRef.current?.focus(), 100)
            return () => clearTimeout(t)
        }
    }, [isOpen, isMobile])

    // Close on click outside (covers both dropdown portal and trigger)
    useEffect(() => {
        if (!isOpen) return
        const handle = (e: MouseEvent | TouchEvent) => {
            const target = e.target as Node
            const inContainer = containerRef.current?.contains(target)
            const inDropdown = dropdownRef.current?.contains(target)
            if (!inContainer && !inDropdown) {
                closeDropdown()
            }
        }
        document.addEventListener('mousedown', handle)
        document.addEventListener('touchstart', handle)
        return () => {
            document.removeEventListener('mousedown', handle)
            document.removeEventListener('touchstart', handle)
        }
    }, [isOpen, closeDropdown])

    // Recompute position on scroll/resize while open (desktop)
    useEffect(() => {
        if (!isOpen || isMobile) return
        const update = () => computePosition()
        window.addEventListener('scroll', update, true)
        window.addEventListener('resize', update)
        return () => {
            window.removeEventListener('scroll', update, true)
            window.removeEventListener('resize', update)
        }
    }, [isOpen, isMobile, computePosition])

    const handleSelect = (option: string) => {
        onChange(option)
        closeDropdown()
    }

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
        closeDropdown()
    }

    // ── Shared list content ──────────────────────────────────────────────────
    const OptionsList = (
        <>
            {/* Search Input */}
            <div className="p-2 border-b border-gray-100 bg-gray-50/70">
                <div className="relative">
                    <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input
                        ref={searchInputRef}
                        type="text"
                        className="w-full text-sm py-2 pl-8 pr-3 border border-gray-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
                        placeholder={searchPlaceholder}
                        value={query}
                        onChange={(e) => setQuery(e.target.value)}
                        onKeyDown={(e) => e.stopPropagation()}
                    />
                </div>
            </div>

            {/* Options */}
            <div className="overflow-y-auto overflow-x-hidden" style={{ maxHeight: isMobile ? '55vh' : '240px' }}>
                {filteredOptions.length > 0 ? (
                    <div className="py-1">
                        {filteredOptions.map((option) => (
                            <button
                                key={option}
                                type="button"
                                onMouseDown={(e) => e.preventDefault()} // prevent blur before click
                                onClick={() => handleSelect(option)}
                                className={`w-full text-left px-4 py-2.5 text-sm flex items-center justify-between transition-colors
                                    ${value === option
                                        ? 'bg-primary-50 text-primary-900 font-medium'
                                        : 'text-gray-700 hover:bg-gray-50 active:bg-gray-100'
                                    }
                                `}
                            >
                                <span className="truncate">{option}</span>
                                {value === option && (
                                    <Check size={14} className="text-primary-600 flex-shrink-0 ml-2" />
                                )}
                            </button>
                        ))}
                    </div>
                ) : (
                    <div className="px-4 py-8 text-center">
                        <p className="text-xs text-gray-400">No results found.</p>
                    </div>
                )}
            </div>
        </>
    )

    // ── Mobile Bottom Sheet Portal ────────────────────────────────────────────
    const MobileSheet = mounted ? createPortal(
        <div className="fixed inset-0 z-[9000] flex flex-col justify-end">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/40 backdrop-blur-[2px] animate-in fade-in duration-200"
                onMouseDown={closeDropdown}
                onTouchStart={closeDropdown}
            />
            {/* Sheet */}
            <div
                ref={dropdownRef}
                className="relative bg-white rounded-t-2xl shadow-2xl animate-in slide-in-from-bottom duration-300 flex flex-col"
                style={{ maxHeight: '80dvh', paddingBottom: 'env(safe-area-inset-bottom)' }}
            >
                {/* Handle bar */}
                <div className="flex justify-center pt-3 pb-1">
                    <div className="w-10 h-1 bg-gray-200 rounded-full" />
                </div>

                {/* Title */}
                <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
                    <span className="font-semibold text-gray-900 text-base">{placeholder}</span>
                    <button
                        type="button"
                        onMouseDown={closeDropdown}
                        className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {OptionsList}
            </div>
        </div>,
        document.body
    ) : null

    // ── Desktop Floating Dropdown Portal ─────────────────────────────────────
    const DesktopDropdown = mounted && dropdownPos ? createPortal(
        <div
            ref={dropdownRef}
            className="fixed z-[9000] bg-white rounded-lg shadow-2xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-150"
            style={{
                top: dropdownPos.openUp ? undefined : dropdownPos.top,
                // openUp: anchor to bottom so the list grows upward from the trigger
                bottom: dropdownPos.openUp
                    ? (typeof window !== 'undefined' ? window.innerHeight - dropdownPos.top : 0)
                    : undefined,
                left: dropdownPos.left,
                width: dropdownPos.width,
                transformOrigin: dropdownPos.openUp ? 'bottom' : 'top',
            }}
        >
            {OptionsList}
        </div>,
        document.body
    ) : null

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={openDropdown}
                disabled={disabled}
                className={`w-full text-left px-3 py-2 bg-white border rounded-lg shadow-sm flex items-center justify-between transition-all text-sm
                    ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 border-gray-300'}
                    ${isOpen ? 'border-primary-500 ring-2 ring-primary-100' : ''}
                `}
            >
                <span className={`block truncate ${!value ? 'text-gray-500 text-xs' : 'text-gray-900 font-medium text-xs'}`}>
                    {value || placeholder}
                </span>

                <div className="flex items-center gap-0.5 flex-shrink-0">
                    {value && !disabled && (
                        <div
                            role="button"
                            onMouseDown={clearSelection}
                            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={12} />
                        </div>
                    )}
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Portal Dropdowns */}
            {isOpen && !disabled && (
                isMobile ? MobileSheet : DesktopDropdown
            )}
        </div>
    )
}
