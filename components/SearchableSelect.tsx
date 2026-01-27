'use client'

import { useState, useRef, useEffect, useMemo } from 'react'
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
    const containerRef = useRef<HTMLDivElement>(null)
    const searchInputRef = useRef<HTMLInputElement>(null)

    // Filter options based on query
    const filteredOptions = useMemo(() => {
        if (!query) return options
        return options.filter(option =>
            option.toLowerCase().includes(query.toLowerCase())
        )
    }, [options, query])

    // Close on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
                setIsOpen(false)
                setQuery('') // Reset query on close
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    // Focus input when opening
    useEffect(() => {
        if (isOpen && searchInputRef.current) {
            searchInputRef.current.focus()
        }
    }, [isOpen])

    const handleSelect = (option: string) => {
        onChange(option)
        setIsOpen(false)
        setQuery('')
    }

    const clearSelection = (e: React.MouseEvent) => {
        e.stopPropagation()
        onChange('')
        setIsOpen(false)
    }

    return (
        <div className={`relative ${className}`} ref={containerRef}>
            {label && (
                <label className="block text-xs font-medium text-gray-700 mb-1">{label}</label>
            )}

            {/* Trigger Button */}
            <button
                type="button"
                onClick={() => !disabled && setIsOpen(!isOpen)}
                disabled={disabled}
                className={`w-full text-left px-3 py-2 bg-white border rounded-lg shadow-sm flex items-center justify-between transition-all
                    ${disabled ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200' : 'hover:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100 border-gray-300'}
                    ${isOpen ? 'border-primary-500 ring-2 ring-primary-100' : ''}
                `}
            >
                <span className={`block truncate ${!value ? 'text-gray-500' : 'text-gray-900 font-medium'}`}>
                    {value || placeholder}
                </span>

                <div className="flex items-center gap-1">
                    {value && !disabled && (
                        <div
                            role="button"
                            onClick={clearSelection}
                            className="p-0.5 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                        >
                            <X size={14} />
                        </div>
                    )}
                    <ChevronDown size={16} className={`text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
                </div>
            </button>

            {/* Dropdown Menu */}
            {isOpen && !disabled && (
                <div className="absolute z-[3000] mt-1 w-full bg-white rounded-lg shadow-xl border border-gray-200 overflow-hidden animate-in fade-in zoom-in-95 duration-100 origin-top">
                    {/* Search Input */}
                    <div className="p-2 border-b border-gray-50 bg-gray-50/50">
                        <div className="relative">
                            <Search size={14} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" />
                            <input
                                ref={searchInputRef}
                                type="text"
                                className="w-full text-sm py-1.5 pl-8 pr-3 border border-gray-200 rounded-md focus:outline-none focus:border-primary-500 focus:ring-1 focus:ring-primary-500 bg-white"
                                placeholder={searchPlaceholder}
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                onKeyDown={(e) => e.stopPropagation()}
                            />
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto overflow-x-hidden custom-scrollbar">
                        {filteredOptions.length > 0 ? (
                            <div className="py-1">
                                {filteredOptions.map((option) => (
                                    <button
                                        key={option}
                                        type="button"
                                        onClick={() => handleSelect(option)}
                                        className={`w-full text-left px-3 py-2 text-sm flex items-center justify-between group transition-colors
                                            ${value === option
                                                ? 'bg-primary-50 text-primary-900 font-medium'
                                                : 'text-gray-700 hover:bg-gray-50'
                                            }
                                        `}
                                    >
                                        <span className="truncate">{option}</span>
                                        {value === option && (
                                            <Check size={14} className="text-primary-600" />
                                        )}
                                    </button>
                                ))}
                            </div>
                        ) : (
                            <div className="px-4 py-6 text-center">
                                <p className="text-xs text-gray-500">No results found.</p>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    )
}
