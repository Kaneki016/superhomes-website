'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase-browser'
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
        if (!user) {
            setFavorites([])
            setLoading(false)
            return
        }

        // Wait for profile to be loaded
        if (!profile) {
            // Profile loading or not found yet, don't set loading false yet if we have a user
            // allow a retry or wait? 
            // For now, let's log
            console.log('FavoritesContext: User present but profile missing, waiting...')
            return
        }

        console.log('FavoritesContext: Fetching favorites for buyer:', profile.id)

        try {
            const { data, error } = await supabase
                .from('favorites')
                .select('property_id')
                .eq('buyer_id', profile.id)

            if (error) {
                console.error('Error fetching favorites:', error)
                setFavorites([])
            } else {
                console.log('FavoritesContext: Fetched favorites:', data)
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
        if (!user) {
            // alert('Please logging in to save favorites.')
            return false
        }

        if (!profile) {
            console.log('FavoritesContext: Cannot add favorite, profile missing')
            alert('Your profile is still loading. Please try again in a moment.')
            return false
        }

        console.log('FavoritesContext: Adding favorite:', propertyId, 'for buyer:', profile.id)

        try {
            const { error } = await supabase
                .from('favorites')
                .insert({
                    buyer_id: profile.id,
                    property_id: propertyId,
                })

            if (error) {
                // If it's a duplicate, that's fine
                if (error.code === '23505') {
                    console.log('FavoritesContext: Favorite already exists')
                    return true
                }
                console.error('Error adding favorite (full):', JSON.stringify(error, null, 2))
                console.error('Error details:', { message: error.message, code: error.code, details: error.details, hint: error.hint })
                alert(`Error saving favorite: ${error.message || 'Unknown error'}`)
                return false
            }

            console.log('FavoritesContext: Favorite added successfully')
            // Update local state
            setFavorites(prev => [...prev, propertyId])
            return true
        } catch (error: any) {
            console.error('Error adding favorite:', error)
            alert(`Error saving favorite: ${error.message || error}`)
            return false
        }
    }

    // Remove a property from favorites
    const removeFavorite = async (propertyId: string): Promise<boolean> => {
        if (!user || !profile) return false

        console.log('FavoritesContext: Removing favorite:', propertyId)

        try {
            const { error } = await supabase
                .from('favorites')
                .delete()
                .eq('buyer_id', profile.id)
                .eq('property_id', propertyId)

            if (error) {
                console.error('Error removing favorite:', error)
                return false
            }

            console.log('FavoritesContext: Favorite removed successfully')
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
