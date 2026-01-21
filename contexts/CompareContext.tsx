'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Property, Transaction } from '@/lib/supabase'

const MAX_COMPARE = 3
const STORAGE_KEY = 'superhomes_compare'

export type ComparableItem = Property | Transaction

interface CompareContextType {
    compareList: ComparableItem[]
    addToCompare: (item: ComparableItem) => string | null
    removeFromCompare: (itemId: string) => void
    isInCompare: (itemId: string) => boolean
    clearCompare: () => void
    canAddMore: boolean
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

export function CompareProvider({ children }: { children: ReactNode }) {
    const [compareList, setCompareList] = useState<ComparableItem[]>([])
    const [isLoaded, setIsLoaded] = useState(false)

    // Load from localStorage on mount
    useEffect(() => {
        try {
            const stored = localStorage.getItem(STORAGE_KEY)
            if (stored) {
                const parsed = JSON.parse(stored)
                if (Array.isArray(parsed)) {
                    setCompareList(parsed.slice(0, MAX_COMPARE))
                }
            }
        } catch (error) {
            console.error('Error loading compare list:', error)
        }
        setIsLoaded(true)
    }, [])

    // Save to localStorage when list changes
    useEffect(() => {
        if (isLoaded) {
            try {
                localStorage.setItem(STORAGE_KEY, JSON.stringify(compareList))
            } catch (error) {
                console.error('Error saving compare list:', error)
            }
        }
    }, [compareList, isLoaded])

    const addToCompare = (item: ComparableItem): string | null => {
        // Check duplicate
        if (compareList.some(p => p.id === item.id)) {
            return "Item already in comparison."
        }

        // Check if list is full
        if (compareList.length >= MAX_COMPARE) {
            return `You can compare up to ${MAX_COMPARE} items.`
        }

        // Check compatibility (Same Type)
        if (compareList.length > 0) {
            const firstItem = compareList[0]
            const isFirstProperty = 'listing_type' in firstItem
            const isItemProperty = 'listing_type' in item

            if (isFirstProperty !== isItemProperty) {
                return "You cannot compare Properties with Transactions. Please clear the list first."
            }
        }

        setCompareList(prev => [...prev, item])
        return null // No error, success
    }

    const removeFromCompare = (itemId: string) => {
        setCompareList(prev => prev.filter(p => p.id !== itemId))
    }

    const isInCompare = (itemId: string): boolean => {
        return compareList.some(p => p.id === itemId)
    }

    const clearCompare = () => {
        setCompareList([])
    }

    return (
        <CompareContext.Provider value={{
            compareList,
            addToCompare,
            removeFromCompare,
            isInCompare,
            clearCompare,
            canAddMore: compareList.length < MAX_COMPARE
        }}>
            {children}
        </CompareContext.Provider>
    )
}

export function useCompare() {
    const context = useContext(CompareContext)
    if (!context) {
        throw new Error('useCompare must be used within a CompareProvider')
    }
    return context
}
