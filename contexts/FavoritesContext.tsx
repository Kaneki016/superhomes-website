'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { useAuth } from './AuthContext'

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
    const { user, profile } = useAuth()
    const [favorites, setFavorites] = useState<string[]>([])
    const [loading, setLoading] = useState(true)

    // Fetch user's favorites
    const fetchFavorites = useCallback(async () => {
        if (!user || !profile) {
            setFavorites([])
            setLoading(false)
            return
        }

        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('property_id')
                .eq('buyer_id', profile.id) // Use profile.id (buyer database ID), not user.id (auth_id)

            if (error) {
                console.error('Error fetching favorites:', error)
                setFavorites([])
            } else {
                setFavorites(data?.map(f => f.property_id) || [])
            }
        } catch (error) {
            console.error('Error fetching favorites:', error)
            setFavorites([])
        } finally {
            setLoading(false)
        }
    }, [user, profile])

    // Fetch favorites when user changes
    useEffect(() => {
        fetchFavorites()
    }, [fetchFavorites])

    // Add a property to favorites
    const addFavorite = async (propertyId: string): Promise<boolean> => {
        if (!user || !profile) return false

        try {
            const { error } = await supabase
                .from('favorites')
                .insert({
                    buyer_id: profile.id, // Use profile.id (buyer database ID)
                    property_id: propertyId,
                })

            if (error) {
                // If it's a duplicate, that's fine
                if (error.code === '23505') {
                    return true
                }
                console.error('Error adding favorite:', error)
                return false
            }

            // Update local state
            setFavorites(prev => [...prev, propertyId])
            return true
        } catch (error) {
            console.error('Error adding favorite:', error)
            return false
        }
    }

    // Remove a property from favorites
    const removeFavorite = async (propertyId: string): Promise<boolean> => {
        if (!user || !profile) return false

        try {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('buyer_id', profile.id) // Use profile.id (buyer database ID)
                .eq('property_id', propertyId)

            if (error) {
                console.error('Error removing favorite:', error)
                return false
            }

            // Update local state
            setFavorites(prev => prev.filter(id => id !== propertyId))
            return true
        } catch (error) {
            console.error('Error removing favorite:', error)
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
