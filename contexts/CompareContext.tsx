'use client'

import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Property } from '@/lib/supabase'

const MAX_COMPARE = 3
const STORAGE_KEY = 'superhomes_compare'

interface CompareContextType {
    compareList: Property[]
    addToCompare: (property: Property) => boolean
    removeFromCompare: (propertyId: string) => void
    isInCompare: (propertyId: string) => boolean
    clearCompare: () => void
    canAddMore: boolean
}

const CompareContext = createContext<CompareContextType | undefined>(undefined)

export function CompareProvider({ children }: { children: ReactNode }) {
    const [compareList, setCompareList] = useState<Property[]>([])
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

    const addToCompare = (property: Property): boolean => {
        if (compareList.length >= MAX_COMPARE) {
            return false
        }
        if (compareList.some(p => p.id === property.id)) {
            return false
        }
        setCompareList(prev => [...prev, property])
        return true
    }

    const removeFromCompare = (propertyId: string) => {
        setCompareList(prev => prev.filter(p => p.id !== propertyId))
    }

    const isInCompare = (propertyId: string): boolean => {
        return compareList.some(p => p.id === propertyId)
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
