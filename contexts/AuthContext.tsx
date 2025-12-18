'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'

interface UserProfile {
    id: string
    email: string
    user_type: 'buyer' | 'agent'
    name?: string
    phone?: string
    whatsapp?: string
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, userData: { name: string; userType: 'buyer' | 'agent'; phone?: string }) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    signInWithGoogle: () => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null)
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [session, setSession] = useState<Session | null>(null)
    const [loading, setLoading] = useState(true)

    // Memoized fetch profile function with timeout
    const fetchProfile = useCallback(async (userId: string, userEmail: string) => {
        try {
            // Add timeout to prevent hanging
            const controller = new AbortController()
            const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

            const { data, error } = await supabase
                .from('users')
                .select('*')
                .eq('id', userId)
                .single()

            clearTimeout(timeoutId)

            if (error) {
                // Profile doesn't exist - create a default one for OAuth users
                if (error.code === 'PGRST116') {
                    // No profile found, create one
                    const { data: newProfile, error: insertError } = await supabase
                        .from('users')
                        .insert({
                            id: userId,
                            email: userEmail,
                            user_type: 'buyer',
                        })
                        .select()
                        .single()

                    if (!insertError && newProfile) {
                        setProfile(newProfile)
                    } else {
                        // If insert fails, just set a minimal profile from auth data
                        setProfile({
                            id: userId,
                            email: userEmail,
                            user_type: 'buyer',
                        })
                    }
                } else {
                    console.error('Error fetching profile:', error)
                    // Set minimal profile from auth data
                    setProfile({
                        id: userId,
                        email: userEmail,
                        user_type: 'buyer',
                    })
                }
                return
            }

            if (data) {
                // If user is an agent, also fetch agent details
                if (data.user_type === 'agent') {
                    const { data: agentData } = await supabase
                        .from('agents')
                        .select('name, phone, whatsapp')
                        .eq('user_id', userId)
                        .single()

                    setProfile({
                        ...data,
                        name: agentData?.name,
                        phone: agentData?.phone,
                        whatsapp: agentData?.whatsapp,
                    })
                } else {
                    setProfile(data)
                }
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            // Set minimal profile on error
            setProfile({
                id: userId,
                email: userEmail,
                user_type: 'buyer',
            })
        }
    }, [])

    useEffect(() => {
        let mounted = true

        // Get initial session
        const initAuth = async () => {
            try {
                const { data: { session } } = await supabase.auth.getSession()

                if (!mounted) return

                setSession(session)
                setUser(session?.user ?? null)

                if (session?.user) {
                    await fetchProfile(session.user.id, session.user.email || '')
                }
            } catch (error) {
                console.error('Auth init error:', error)
            } finally {
                if (mounted) {
                    setLoading(false)
                }
            }
        }

        initAuth()

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (!mounted) return

                setSession(session)
                setUser(session?.user ?? null)

                if (event === 'SIGNED_OUT') {
                    setProfile(null)
                    setLoading(false)
                } else if (session?.user) {
                    await fetchProfile(session.user.id, session.user.email || '')
                    setLoading(false)
                } else {
                    setProfile(null)
                    setLoading(false)
                }
            }
        )

        return () => {
            mounted = false
            subscription.unsubscribe()
        }
    }, [fetchProfile])

    const signIn = async (email: string, password: string) => {
        try {
            const { error } = await supabase.auth.signInWithPassword({
                email,
                password,
            })
            return { error }
        } catch (error) {
            return { error: error as Error }
        }
    }

    const signUp = async (
        email: string,
        password: string,
        userData: { name: string; userType: 'buyer' | 'agent'; phone?: string }
    ) => {
        try {
            // 1. Create auth user (trigger will auto-create profile in users table)
            const { data: authData, error: authError } = await supabase.auth.signUp({
                email,
                password,
                options: {
                    data: {
                        name: userData.name,
                        user_type: userData.userType,
                    }
                }
            })

            if (authError) return { error: authError }

            if (authData.user) {
                // 2. Update user_type if agent (trigger creates as 'buyer' by default)
                if (userData.userType === 'agent') {
                    // Wait a moment for the trigger to complete
                    await new Promise(resolve => setTimeout(resolve, 500))

                    const { error: updateError } = await supabase
                        .from('users')
                        .update({ user_type: 'agent' })
                        .eq('id', authData.user.id)

                    if (updateError) {
                        console.error('User type update error:', updateError)
                        // Don't fail registration, just log the error
                    }

                    // 3. Create agent profile
                    if (userData.phone) {
                        const { error: agentError } = await supabase
                            .from('agents')
                            .insert({
                                user_id: authData.user.id,
                                name: userData.name,
                                phone: userData.phone,
                                whatsapp: userData.phone,
                            })

                        if (agentError) {
                            console.error('Agent creation error:', agentError)
                            // Don't fail registration for agent profile error
                        }
                    }
                }
            }

            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    const signOut = async () => {
        try {
            // Clear state immediately for better UX
            setUser(null)
            setProfile(null)
            setSession(null)

            // Then sign out from Supabase
            const { error } = await supabase.auth.signOut()

            if (error) {
                console.error('Sign out error:', error)
            }

            // Force a hard refresh to clear all cached state
            if (typeof window !== 'undefined') {
                window.location.href = '/'
            }
        } catch (error) {
            console.error('Sign out error:', error)
            // Force refresh even on error
            if (typeof window !== 'undefined') {
                window.location.href = '/'
            }
        }
    }

    const signInWithGoogle = async () => {
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: `${window.location.origin}/auth/callback`,
                }
            })
            return { error }
        } catch (error) {
            return { error: error as Error }
        }
    }

    return (
        <AuthContext.Provider value={{
            user,
            profile,
            session,
            loading,
            signIn,
            signUp,
            signOut,
            signInWithGoogle,
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
