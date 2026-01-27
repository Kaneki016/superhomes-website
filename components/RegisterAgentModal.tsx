'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase-browser'
import { useAuth } from '@/contexts/AuthContext'

interface RegisterAgentModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function RegisterAgentModal({ isOpen, onClose }: RegisterAgentModalProps) {
    // Steps: phone -> otp -> details -> success
    const [step, setStep] = useState<'phone' | 'otp' | 'details' | 'success'>('phone')

    // Form State
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [details, setDetails] = useState({
        name: '',
        agency: '',
        renNumber: '',
        email: '',
        password: ''
    })

    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const { user, signUp, refreshProfile, profile } = useAuth()

    // Auto-advance to details if user is already logged in (Ghost state handling)
    // or if they just verified OTP and the parent didn't unmount
    useEffect(() => {
        if (isOpen && user && !profile) {
            console.log('User is authenticated but has no profile (Ghost). Advancing to details.')
            setStep('details')
        }
    }, [isOpen, user, profile])

    if (!isOpen) return null

    // Helper: Normalize Phone
    const getFormattedPhone = () => {
        let p = phone.replace(/\D/g, '')
        if (p.startsWith('0')) p = '60' + p.substring(1)
        if (!p.startsWith('60')) p = '60' + p
        return '+' + p
    }

    const handleSendOtp = async () => {
        if (phone.length < 8) return
        setLoading(true)
        setError('')
        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: getFormattedPhone() // Use default channel (SMS/WhatsApp based on settings) or force one?
                // Let's expect the default provider settings or user choice?
                // For simplicity, let's just call signInWithOtp.
            })
            if (error) throw error
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
            const { error } = await supabase.auth.verifyOtp({
                phone: getFormattedPhone(),
                token: otp,
                type: 'sms'
            })
            if (error) throw error

            // Should be logged in now?
            // Verify session
            const { data: { session } } = await supabase.auth.getSession()
            if (!session) throw new Error('Login failed after verification')

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

            // 1. Update Auth User with Email & Password
            console.log('Updating user auth...')
            const { error: updateError } = await supabase.auth.updateUser({
                email: details.email,
                password: details.password
            })
            if (updateError) {
                console.error('Update User Error:', updateError)
                if (updateError.message.includes('already been registered')) {
                    throw new Error('This email is already taken. Please use a different email.')
                }
                throw updateError
            }
            console.log('User auth updated.')

            // 2. Create or Claim Profile via Server Action
            // This bypasses RLS issues
            const formattedPhone = getFormattedPhone()

            // Dynamic import to avoid server components in client bundle issues? 
            // Standard import works in Next.js 14+ usually.
            // We need to import it at the top of file, but for replace_file_content we can't add imports easily.
            // We'll rely on the user/IDE or add it in a separate step? 
            // Wait, I should add the import.
            // I'll assume the import is added or I'll add it in a subsequent step if needed.
            // Actually, I can use the existing imports if I modify the top.
            // I'll proceed with logic replacement and then add import.

            const { registerOrClaimAgent } = await import('@/app/actions/agent-claiming')

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
                        <button onClick={() => setStep('phone')} className="w-full text-sm text-gray-500 hover:text-gray-700">
                            Change Number
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
                                    <input
                                        type="email"
                                        value={details.email}
                                        onChange={(e) => setDetails({ ...details, email: e.target.value })}
                                        className="input-field"
                                        placeholder="you@email.com"
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
                            disabled={loading || !details.name || !details.renNumber || !details.email || !details.password}
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
                            <strong>Check your inbox!</strong>
                            <br />
                            We sent a verification link to <u>{details.email}</u>.
                            <br />
                            Please click it to activate your email login.
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
