'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { registerOrClaimAgent } from '@/app/actions/agent-claiming'
import { updateUserCredentials } from '@/app/actions/user-profile'

interface RegisterAgentModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function RegisterAgentModal({ isOpen, onClose }: RegisterAgentModalProps) {
    // Steps: email -> otp -> details -> success
    const [step, setStep] = useState<'email' | 'otp' | 'details' | 'success'>('email')

    // Form State
    const [emailInput, setEmailInput] = useState('')
    const [otp, setOtp] = useState('')
    const [details, setDetails] = useState({
        name: '',
        agency: '',
        renNumber: '',
        phone: '', // Added phone to details
        password: ''
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { user, signUp, refreshProfile, profile, sendOtp, signInWithOtp } = useAuth()

    // Auto-advance to details if user is already logged in (Ghost state handling)
    // or if they just verified OTP and the parent didn't unmount
    useEffect(() => {
        if (isOpen && user && !profile) {
            console.log('User is authenticated but has no profile (Ghost). Advancing to details.')
            setStep('details')
        }
    }, [isOpen, user, profile])

    if (!isOpen) return null

    // Removed getFormattedPhone helper as we use email directly

    const handleSendOtp = async () => {
        if (!emailInput.includes('@')) return
        setLoading(true)
        setError('')
        try {
            // Use AuthContext sendOtp (overloaded to accept email)
            const { error } = await sendOtp(emailInput)
            if (error) throw new Error(error.message)
            setStep('otp')
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to send OTP')
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (otp.length < 6) return
        setLoading(true)
        setError('')
        try {
            // Use AuthContext signInWithOtp
            const { error } = await signInWithOtp(emailInput, otp)

            if (error) throw new Error(error.message)

            // Pre-fill email in details (hidden or read-only)
            setDetails(prev => ({ ...prev, email: emailInput }))
            setStep('details')
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Invalid code')
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
            // Note: User is already created with Email via OTP.
            // We just need to set the password now.
            console.log('Updating user credentials...')
            // We pass the SAME email to verify consistency
            const credResult = await updateUserCredentials(details.email || emailInput, details.password)

            if (!credResult.success) {
                // Ignore "already in use" if it's just because we just created it via OTP?
                // Actually updateUserCredentials might fail if it tries to CREATE a new user with same email.
                // We should check if the server action handles "update existing user" correctly.
                // Assuming it does (it takes email to find user).
                if (credResult.error?.includes('already in use')) {
                    // This is expected if we registered via OTP, we invoke it to set password?
                    // Or maybe we don't need to call this if we are already logged in?
                    // We DO need to set the password though.
                } else {
                    throw new Error(credResult.error)
                }
            }
            console.log('User auth updated.')

            // 2. Create or Claim Profile via Server Action
            const result = await registerOrClaimAgent({
                name: details.name,
                agency: details.agency,
                renNumber: details.renNumber,
                email: details.email || emailInput,
                phone: details.phone // Now passing the manually entered phone
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

                {step === 'email' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Email Address</label>
                            <input
                                type="email"
                                value={emailInput}
                                onChange={(e) => setEmailInput(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleSendOtp}
                            disabled={loading || !emailInput.includes('@')}
                            className="btn-primary w-full"
                        >
                            {loading ? 'Sending...' : 'Verify Email'}
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
                        <button onClick={() => setStep('email')} className="w-full text-sm text-gray-500 hover:text-gray-700">
                            Change Email
                        </button>
                    </div>
                )}

                {step === 'details' && (
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                            <input
                                type="text"
                                value={details.name}
                                onChange={(e) => setDetails({ ...details, name: e.target.value })}
                                className="input-field"
                                placeholder="e.g. Ali Baba"
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
                            />
                        </div>

                        {/* Credentials Setup */}
                        <div className="pt-2 border-t border-gray-100">
                            <p className="text-sm font-semibold text-gray-900 mb-3">Login Credentials</p>
                            <div className="space-y-3">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                                    <div className="p-3 bg-gray-100 rounded-lg text-gray-600 border border-gray-200">
                                        {emailInput || details.email}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                                    <input
                                        type="tel"
                                        value={details.phone}
                                        onChange={(e) => setDetails({ ...details, phone: e.target.value })}
                                        className="input-field"
                                        placeholder="+60 12 345 6789"
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
                                    />
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={handleSaveDetails}
                            disabled={loading || !details.name || !details.renNumber || !details.password || !details.phone}
                            className="btn-primary w-full mt-2"
                        >
                            {loading ? 'Creating Profile...' : 'Complete Registration'}
                        </button>
                    </div>
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
                            You can now login with your email: <u>{emailInput || details.email}</u>.
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
            </div>
        </div>
    )
}
