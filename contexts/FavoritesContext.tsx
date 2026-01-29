'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { useAuth } from './AuthContext'
import { getFavorites, addFavorite as addFavoriteAction, removeFavorite as removeFavoriteAction } from '@/app/actions/favorites'

interface FavoritesContextType {
    favorites: string[] // Array of property IDs
    loading: boolean
    addFavorite: (propertyId: string) => Promise<boolean>
    removeFavorite: (propertyId: string) => Promise<boolean>
    isFavorite: (propertyId: string) => boolean
    toggleFavorite: (propertyId: string) => Promise<boolean>
}

const FavoritesContext = createContext<FavoritesContextType | undefined>(undefined)

export function FavoritesProvider({ children }: { children: ReactNode }) {
    const { user } = useAuth()
    const [favorites, setFavorites] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch user's favorites
    const fetchFavorites = useCallback(async () => {
        if (!user) {
            setFavorites([])
            setLoading(false)
            return
        }

        try {
            const data = await getFavorites()
            console.log('FavoritesContext: Fetched favorites:', data)
            setFavorites(data)
        } catch (error) {
            console.error('Error fetching favorites:', error)
            setFavorites([])
        } finally {
            setLoading(false)
        }
    }, [user])

    // Fetch favorites when user changes
    useEffect(() => {
        fetchFavorites()
    }, [fetchFavorites])

    // Add a property to favorites
    const addFavorite = async (propertyId: string): Promise<boolean> => {
        if (!user) return false

        try {
            // Optimistic update
            setFavorites(prev => [...prev, propertyId])

            const result = await addFavoriteAction(propertyId)

            if (!result.success) {
                console.error('Error adding favorite:', result.error)
                // Revert optimistic update
                setFavorites(prev => prev.filter(id => id !== propertyId))
                return false
            }

            return true
        } catch (error: any) {
            console.error('Error adding favorite:', error)
            // Revert optimistic update
            setFavorites(prev => prev.filter(id => id !== propertyId))
            return false
        }
    }

    // Remove a property from favorites
    const removeFavorite = async (propertyId: string): Promise<boolean> => {
        if (!user) return false

        try {
            // Optimistic update
            setFavorites(prev => prev.filter(id => id !== propertyId))

            const result = await removeFavoriteAction(propertyId)

            if (!result.success) {
                console.error('Error removing favorite:', result.error)
                // Revert optimistic update
                setFavorites(prev => [...prev, propertyId])
                return false
            }

            return true
        } catch (error) {
            console.error('Error removing favorite:', error)
            // Revert optimistic update
            setFavorites(prev => [...prev, propertyId])
            return false
        }
    }

    // Check if a property is favorited
    const isFavorite = (propertyId: string): boolean => {
        return favorites.includes(propertyId)
    }

    // Toggle favorite status
    const toggleFavorite = async (propertyId: string): Promise<boolean> => {
        if (isFavorite(propertyId)) {
            return await removeFavorite(propertyId)
        } else {
            return await addFavorite(propertyId)
        }
    }

    return (
        <FavoritesContext.Provider value={{
            favorites,
            loading,
            addFavorite,
            removeFavorite,
            isFavorite,
            toggleFavorite,
        }}>
            {children}
        </FavoritesContext.Provider>
    )
}

export function useFavorites() {
    const context = useContext(FavoritesContext)
    if (context === undefined) {
        throw new Error('useFavorites must be used within a FavoritesProvider')
    }
    return context
}
