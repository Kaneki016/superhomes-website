'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import { User, Session } from '@supabase/supabase-js'
// Types are defined inline in this file

interface UserProfile {
    id: string
    email: string
    user_type: 'buyer' | 'agent'
    name?: string
    phone?: string
    agent_id?: string // For agents: their PropertyGuru agent ID
}

interface AuthContextType {
    user: User | null
    profile: UserProfile | null
    session: Session | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, userData: { name: string; userType: 'buyer' | 'agent'; phone?: string; agency?: string }) => Promise<{ error: Error | null }>
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
            // First check if user is a buyer
            const { data: buyerData } = await supabase
                .from('buyers')
                .select('*')
                .eq('auth_id', userId)
                .single()

            if (buyerData) {
                setProfile({
                    id: buyerData.id,
                    email: buyerData.email,
                    user_type: 'buyer',
                    name: buyerData.name,
                    phone: buyerData.phone,
                })
                return
            }

            // If not a buyer, check if user is an agent
            const { data: agentData } = await supabase
                .from('dup_agents')
                .select('*')
                .eq('auth_id', userId)
                .single()

            if (agentData) {
                setProfile({
                    id: agentData.id,
                    email: agentData.email || userEmail,
                    user_type: 'agent',
                    name: agentData.name,
                    phone: agentData.phone,
                })
                return
            }

            // If neither exists, create a buyer profile (OAuth case)
            const { data: newBuyer, error: insertError } = await supabase
                .from('buyers')
                .insert({
                    auth_id: userId,
                    email: userEmail,
                })
                .select()
                .single()

            if (!insertError && newBuyer) {
                setProfile({
                    id: newBuyer.id,
                    email: newBuyer.email,
                    user_type: 'buyer',
                })
            } else {
                // Fallback minimal profile
                setProfile({
                    id: userId,
                    email: userEmail,
                    user_type: 'buyer',
                })
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
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
        userData: { name: string; userType: 'buyer' | 'agent'; phone?: string; agency?: string }
    ) => {
        try {
            // 1. Create auth user
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
            if (!authData.user) return { error: new Error('No user data returned') }

            // 2. Create profile based on user type
            if (userData.userType === 'buyer') {
                // Create buyer profile
                const { error: buyerError } = await supabase
                    .from('buyers')
                    .insert({
                        auth_id: authData.user.id,
                        email: email,
                        name: userData.name,
                        phone: userData.phone,
                    })

                if (buyerError) {
                    console.error('Buyer creation error:', buyerError)
                    return { error: new Error('Failed to create buyer profile') }
                }
            } else if (userData.userType === 'agent') {
                // Check if agent with this phone/email already exists (from scraping)
                let existingAgent = null

                // FIRST: Check by phone (most reliable for scraped agents)
                if (userData.phone) {
                    const { data } = await supabase
                        .from('dup_agents')
                        .select('*')
                        .eq('phone', userData.phone)
                        .is('auth_id', null)
                        .single()
                    existingAgent = data
                }

                // FALLBACK: Check by email if phone didn't match
                if (!existingAgent && email) {
                    const { data } = await supabase
                        .from('dup_agents')
                        .select('*')
                        .eq('email', email)
                        .is('auth_id', null)
                        .single()
                    existingAgent = data
                }

                if (existingAgent) {
                    // Agent exists - claim the profile
                    const { error: updateError } = await supabase
                        .from('dup_agents')
                        .update({
                            auth_id: authData.user.id,
                            email: email, // Add email to the scraped profile
                            name: userData.name || existingAgent.name, // Keep existing name if not provided
                            phone: userData.phone || existingAgent.phone,
                            agency: userData.agency || existingAgent.agency,
                        })
                        .eq('id', existingAgent.id)

                    if (updateError) {
                        console.error('Agent profile claim error:', updateError)
                        return { error: new Error('Failed to claim agent profile') }
                    }
                } else {
                    // Create new agent profile
                    const { error: agentError } = await supabase
                        .from('dup_agents')
                        .insert({
                            auth_id: authData.user.id,
                            agent_id: `agent_${authData.user.id.substring(0, 8)}`,
                            email: email,
                            name: userData.name,
                            phone: userData.phone,
                            agency: userData.agency,
                        })

                    if (agentError) {
                        console.error('Agent creation error:', agentError)
                        return { error: new Error('Failed to create agent profile') }
                    }
                }
            }

            return { error: null }
        } catch (error) {
            console.error('SignUp error:', error)
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
