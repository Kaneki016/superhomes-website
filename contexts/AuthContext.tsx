'use client'

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { SessionProvider, useSession, signIn as nextAuthSignIn, signOut as nextAuthSignOut } from "next-auth/react"
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "@/lib/firebase";

interface UserProfile {
    id: string
    email: string
    user_type: 'buyer' | 'agent'
    name?: string
    phone?: string
    photo_url?: string
    agent_id?: string
}

interface AuthContextType {
    user: any | null // NextAuth user
    profile: UserProfile | null
    session: any | null
    loading: boolean
    signIn: (email: string, password: string) => Promise<{ error: Error | null }>
    signUp: (email: string, password: string, userData: any) => Promise<{ error: Error | null }>
    signOut: () => Promise<void>
    signInWithGoogle: () => Promise<{ error: Error | null }>
    refreshProfile: () => Promise<void>
    signInWithOtp: (phone: string, code: string) => Promise<{ error: Error | null }>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Internal component to use hooks
function AuthContextContent({ children }: { children: ReactNode }) {
    const { data: session, status } = useSession()
    const [profile, setProfile] = useState<UserProfile | null>(null)
    const [loading, setLoading] = useState(true)

    const fetchProfile = useCallback(async (userId: string) => {
        try {
            const res = await fetch(`/api/user/profile?userId=${userId}`)
            if (res.ok) {
                const data = await res.json()
                setProfile(data)
            } else {
                setProfile(null)
            }
        } catch (error) {
            console.error('Error fetching profile:', error)
            setProfile(null)
        }
    }, [])

    useEffect(() => {
        if (status === 'loading') return

        if (session?.user) {
            fetchProfile((session.user as any).id).finally(() => setLoading(false))
        } else {
            setProfile(null)
            setLoading(false)
        }
    }, [session, status, fetchProfile])

    const refreshProfile = async () => {
        if (session?.user) {
            await fetchProfile((session.user as any).id)
        }
    }

    const signIn = async (email: string, password: string) => {
        try {
            const res = await nextAuthSignIn('credentials', {
                email,
                password,
                redirect: false
            })
            if (res?.error) {
                return { error: new Error('Invalid credentials') }
            }
            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    const signInWithOtp = async (phone: string, code: string) => {
        try {
            const res = await nextAuthSignIn('otp', {
                phone,
                code,
                redirect: false
            })
            if (res?.error) {
                return { error: new Error('Invalid code') }
            }
            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    const signUp = async (email: string, password: string, userData: any) => {
        try {
            const res = await fetch('/api/auth/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password, ...userData })
            })
            const data = await res.json()
            if (!res.ok) {
                return { error: new Error(data.error || 'Registration failed') }
            }

            // Auto login after signup?
            await signIn(email, password)

            return { error: null }
        } catch (error) {
            return { error: error as Error }
        }
    }

    const signOut = async () => {
        await nextAuthSignOut({ redirect: false })
        setProfile(null)
        window.location.href = '/'
    }


    // Google Auth Implementation
    const signInWithGoogle = async () => {
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            const idToken = await user.getIdToken();

            const res = await nextAuthSignIn('google-token', {
                idToken,
                redirect: false
            });

            if (res?.error) {
                return { error: new Error(res.error) };
            }

            return { error: null };
        } catch (error: any) {
            console.error("Google Sign In Error:", error);
            return { error: error };
        }
    }

    return (
        <AuthContext.Provider value={{
            user: session?.user ?? null,
            profile,
            session,
            loading,
            signIn,
            signUp,
            signOut,
            signInWithGoogle,
            refreshProfile,
            signInWithOtp
        }}>
            {children}
        </AuthContext.Provider>
    )
}

export function AuthProvider({ children }: { children: ReactNode }) {
    return (
        <SessionProvider>
            <AuthContextContent>{children}</AuthContextContent>
        </SessionProvider>
    )
}

export function useAuth() {
    const context = useContext(AuthContext)
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider')
    }
    return context
}
