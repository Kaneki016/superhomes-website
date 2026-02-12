'use client'

import { useState, useEffect, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { registerOrClaimAgent } from '@/app/actions/agent-claiming'
import { updateUserCredentials } from '@/app/actions/user-profile'
import { RecaptchaVerifier, signInWithPhoneNumber, ConfirmationResult } from 'firebase/auth'
import { auth } from '@/lib/firebase'

interface RegisterAgentModalProps {
    isOpen: boolean
    onClose: () => void
}

declare global {
    interface Window {
        recaptchaVerifier?: RecaptchaVerifier
    }
}

export default function RegisterAgentModal({ isOpen, onClose }: RegisterAgentModalProps) {
    // Steps: phone -> otp -> details -> success
    const [step, setStep] = useState<'phone' | 'otp' | 'details' | 'success'>('phone')

    // Form State
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [confirmationResult, setConfirmationResult] = useState<ConfirmationResult | null>(null)
    const [details, setDetails] = useState({
        name: '',
        agency: '',
        renNumber: '',
        email: '',
        password: ''
    })
    const [countdown, setCountdown] = useState(0)

    // Refs for Recaptcha
    const recaptchaContainerRef = useRef<HTMLDivElement>(null)

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { user, signUp, refreshProfile, profile, signInWithOtp, signOut } = useAuth()

    // Auto-advance to details if user is already logged in (Ghost state handling)
    // or if they just verified OTP and the parent didn't unmount
    useEffect(() => {
        if (isOpen && user && !profile) {
            console.log('Ghost user detected (Auth but no Profile). Signing out to ensure fresh registration flow.')
            signOut()
            setStep('phone')
        }
    }, [isOpen, user, profile, signOut])

    // Helper: Normalize Phone
    const getFormattedPhone = () => {
        const raw = phone.replace(/\D/g, '')
        let p = ''

        if (raw.startsWith('60')) {
            p = '+' + raw
        } else if (raw.startsWith('0')) {
            p = '+60' + raw.substring(1)
        } else {
            p = '+60' + raw
        }

        console.log('RegisterAgent: Sending OTP to', p)
        return p
    }

    // Initialize Recaptcha
    // Initialize Recaptcha
    // Initialize Recaptcha
    useEffect(() => {
        if (!isOpen || !recaptchaContainerRef.current) return

        // Robust cleanup before init
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear()
            } catch (e) {
                console.warn('Cleanup error', e)
            }
            window.recaptchaVerifier = undefined
        }

        try {
            console.log('Initializing RecaptchaVerifier...')
            window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                'size': 'invisible',
                'callback': (response: any) => {
                    console.log('reCAPTCHA solved:', response)
                    // reCAPTCHA solved
                },
                'expired-callback': () => {
                    console.warn('reCAPTCHA expired')
                }
            });
        } catch (e) {
            console.error('Recaptcha Init Error', e)
        }

        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear()
                } catch (e) {
                    console.error('Error clearing recaptcha', e)
                }
                window.recaptchaVerifier = undefined
            }
        }
    }, [isOpen])

    // Countdown Timer
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(c => c - 1), 1000)
            return () => clearTimeout(timer)
        }
    }, [countdown])

    const handleSendOtp = async () => {
        if (phone.length < 8) return
        setLoading(true)
        setError('')
        try {
            if (!window.recaptchaVerifier) {
                throw new Error('Recaptcha not initialized')
            }

            const formatPhone = getFormattedPhone()
            const confirmation = await signInWithPhoneNumber(auth, formatPhone, window.recaptchaVerifier)
            setConfirmationResult(confirmation)
            console.log('OTP Sent Successfully. Moving to OTP step.')
            setStep('otp')
            setCountdown(60)
        } catch (err: any) {
            console.error('Detailed OTP Error:', err)
            console.error('Error Code:', err.code || 'unknown')
            console.error('Error Message:', err.message)
            setError(err.message || 'Failed to send OTP')
            // Don't destroy the verifier on error, just let user retry.
            // if (window.recaptchaVerifier) {
            //    window.recaptchaVerifier.render().then(widgetId => window.grecaptcha.reset(widgetId))
            // }
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (otp.length < 6 || !confirmationResult) return
        setLoading(true)
        setError('')
        try {
            // Verify via Firebase
            const result = await confirmationResult.confirm(otp)
            const idToken = await result.user.getIdToken()

            // Sign in via NextAuth with the ID Token
            // We need a custom Credential Provider that accepts idToken
            // Or we use the existing one but pass idToken as 'code' and a special flag?
            // Let's modify signInWithOtp to accept idToken

            // Using existing signInWithOtp but passing correct params for our modified backend
            // We will modify AuthContext to support this or just call signIn directly here

            // Actually, let's use the AuthContext helper if updated, strictly we must ensure backend matches
            // Ideally: signIn('firebase', { idToken })
            // For now, let's look at how we can pass this.
            // We'll update AuthContext to take an opt 'firebaseToken' or similar.

            // Temporary: Reuse 'code' field to pass idToken? No, token is huge.
            // Let's call signIn from next-auth/react directly?
            // But we need to update session...

            // Let's use the 'otp' provider but overload it:
            // phone: formattedPhone
            // code: idToken  <-- backend will distinguish based on length or prefix?

            const { error } = await signInWithOtp(getFormattedPhone(), idToken) // We will update AuthContext and lib/auth.ts to handle this

            if (error) throw new Error(error.message)

            // AuthContext handles setting user/session state
            setStep('details')
        } catch (err: any) {
            console.error(err)
            let errorMessage = 'Failed to verify code. Please try again.'

            // Map Firebase error codes to user-friendly messages
            if (err.code === 'auth/invalid-verification-code') {
                errorMessage = 'Incorrect code. Please check and try again.'
            } else if (err.code === 'auth/code-expired') {
                errorMessage = 'This code has expired. Please resend a new one.'
            } else if (err.code === 'auth/user-disabled') {
                errorMessage = 'This account has been disabled. Please contact support.'
            } else if (err.message) {
                errorMessage = err.message
            }

            setError(errorMessage)
        } finally {
            setLoading(false)
        }
    }

    const handleSaveDetails = async () => {
        console.log('Starting handleSaveDetails', details)
        if (!details.name || !details.renNumber || !details.email || !details.password) {
            setError('All fields including Password are required.')
            return
        }
        if (details.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Use user from context instead of fetching again
            if (!user) {
                console.error('No authenticated user in context')
                throw new Error('No authenticated user found. Please try refreshing the page.')
            }
            console.log('User found in context:', user.id)

            // 1. Update Auth User with Email & Password via Server Action
            console.log('Updating user credentials...')
            const credResult = await updateUserCredentials(details.email, details.password)

            if (!credResult.success) {
                if (credResult.error?.includes('already in use')) {
                    throw new Error('This email is already taken. Please use a different email.')
                }
                throw new Error(credResult.error)
            }
            console.log('User auth updated.')

            // 2. Create or Claim Profile via Server Action
            const formattedPhone = getFormattedPhone()

            const result = await registerOrClaimAgent({
                name: details.name,
                agency: details.agency,
                renNumber: details.renNumber,
                email: details.email,
                phone: formattedPhone
            })

            if (!result.success) {
                throw new Error(result.error)
            }

            console.log('Profile saved successfully:', result.mode)

            // Refresh profile so the UI knows we are now an agent
            await refreshProfile()

            setStep('success')
        } catch (err: any) {
            console.error('Catch Error:', err)
            setError(err.message || 'Failed to save profile')
        } finally {
            console.log('Finally block reached, setting loading false')
            setLoading(false)
        }
    }

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200 max-h-[85vh] overflow-y-auto custom-scrollbar">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Join as Agent</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Create your professional profile on SuperHomes.
                    </p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
                        {error}
                    </div>
                )}

                {step === 'phone' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-medium">+60</span>
                                </div>
                                <input
                                    type="tel"
                                    value={phone}
                                    onChange={(e) => setPhone(e.target.value.replace(/\D/g, ''))}
                                    placeholder="12 345 6789"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                    autoFocus
                                />
                            </div>
                        </div>
                        <button
                            onClick={handleSendOtp}
                            disabled={loading || phone.length < 8}
                            className="btn-primary w-full"
                        >
                            {loading ? 'Sending...' : 'Verify Phone Number'}
                        </button>

                    </div>
                )}

                {step === 'otp' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-xl focus:ring-primary-500 outline-none"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length < 6}
                            className="btn-primary w-full"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <div className="mt-4 flex justify-between items-center text-sm">
                            <button onClick={() => setStep('phone')} className="text-gray-500 hover:text-gray-700">Change Number</button>
                            <button onClick={handleSendOtp} disabled={countdown > 0} className={`font-medium ${countdown > 0 ? 'text-gray-400 cursor-not-allowed' : 'text-primary-600 hover:text-primary-700'}`}>
                                {countdown > 0 ? `Resend Code (${countdown}s)` : 'Resend Code'}
                            </button>
                        </div>
                    </div>
                )}

                {step === 'details' && (
                    <form
                        onSubmit={(e) => {
                            e.preventDefault()
                            handleSaveDetails()
                        }}
                        className="space-y-4"
                    >
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input
                                type="text"
                                value={details.name}
                                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                                className="input-field"
                                placeholder="e.g. Ali Baba"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Agency Name</label>
                            <input
                                type="text"
                                value={details.agency}
                                onChange={(e) => setDetails({ ...details, agency: e.target.value })}
                                className="input-field"
                                placeholder="e.g. IQI Realty"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">REN Number *</label>
                            <input
                                type="text"
                                value={details.renNumber}
                                onChange={(e) => setDetails({ ...details, renNumber: e.target.value })}
                                className="input-field"
                                placeholder="e.g. REN 12345"
                                required
                            />
                        </div>

                        {/* Credentials Setup */}
                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 mb-3">Login Credentials</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <input
                                        type="email"
                                        value={details.email}
                                        onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                        className="input-field"
                                        placeholder="you@email.com"
                                        autoComplete="email"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                                    <input
                                        type="password"
                                        value={details.password}
                                        onChange={(e) => setDetails({ ...details, password: e.target.value })}
                                        className="input-field"
                                        placeholder="Min 6 characters"
                                        autoComplete="new-password"
                                        required
                                        minLength={6}
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !details.name || !details.renNumber || !details.email || !details.password}
                            className="btn-primary w-full mt-2"
                        >
                            {loading ? 'Creating Profile...' : 'Complete Registration'}
                        </button>
                    </form>
                )}

                {step === 'success' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Welcome Aboard!</h3>
                        <p className="text-gray-600 mb-2">
                            Your agent profile has been created successfully.
                        </p>
                        <div className="bg-blue-50 p-3 rounded-lg mb-6 text-sm text-blue-800">
                            <strong>Login Ready!</strong>
                            <br />
                            You can now login with your email: <u>{details.email}</u>.
                        </div>
                        <button
                            onClick={() => window.location.href = '/dashboard'}
                            className="btn-primary w-full"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}

                {step !== 'success' && (
                    <button onClick={onClose} className="mt-4 w-full text-sm text-gray-500">Cancel</button>
                )}
                <div ref={recaptchaContainerRef}></div>
            </div>
        </div>
    )
}
