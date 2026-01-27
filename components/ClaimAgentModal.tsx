'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Agent } from '@/lib/supabase'
import { claimAgentProfile } from '@/app/actions/agent-claiming'

interface ClaimAgentModalProps {
    isOpen: boolean
    onClose: () => void
    agent: Agent
}

export default function ClaimAgentModal({ isOpen, onClose, agent }: ClaimAgentModalProps) {
    const [step, setStep] = useState<'verify-phone' | 'otp' | 'setup-credentials' | 'success'>('verify-phone')
    const [phoneInput, setPhoneInput] = useState('')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')
    const [useWhatsapp, setUseWhatsapp] = useState(true) // Default to WhatsApp
    const [credentials, setCredentials] = useState({ email: '', password: '' })


    if (!isOpen) return null

    // Mask phone number for privacy/security display
    const maskedPhone = agent.phone
        ? agent.phone.replace(/(\d{2})(\d+)(\d{4})/, '$1***$3')
        : 'Unknown Number'

    // Normalize phone number for comparison (remove spaces, dashes, etc.)
    // Also handles Malaysia format: ensures 60 prefix
    const normalizePhone = (phone: string) => {
        let p = phone.replace(/\D/g, '') // Remove non-digits
        // If it starts with 0, change to 60 (Malaysia)
        if (p.startsWith('0')) {
            p = '60' + p.substring(1)
        }
        return p
    }

    const handleVerifyPhone = async () => {
        if (!agent.phone) {
            setError('This agent profile does not have a phone number to verify.')
            return
        }

        // Check if input phone matches stored phone
        // Logic: Input is likely without country code (e.g. 123456789) because of the prefix in UI
        const fullInput = '60' + phoneInput.replace(/^0+/, '') // Remove leading zeros if user typed them, add 60
        const normalizedInput = normalizePhone(fullInput)
        const normalizedStored = normalizePhone(agent.phone)

        if (normalizedInput !== normalizedStored) {
            console.log('Mismatch:', normalizedInput, normalizedStored)
            setError('Phone number does not match. Please enter the correct phone number for this agent.')
            return
        }

        // Ensure the phone number sent to Supabase is in E.164 format (e.g., +60...)
        // Our normalizePhone removes all non-digits, so we should add '+' back if it looks like a full international number.
        // Assuming Malaysian numbers for now or general international format.
        let phoneToSend = agent.phone || ''
        if (phoneToSend && !phoneToSend.startsWith('+')) {
            // Check if it starts with '60' (Malaysia) or other country codes, if not, might need heuristic or force user input?
            // For scraped data, it might be '60123456789' or '0123456789'.
            // If it starts with '0', replace with '+60' (defaulting to Malaysia for this app context).
            if (phoneToSend.startsWith('0')) {
                phoneToSend = '+60' + phoneToSend.substring(1)
            } else if (phoneToSend.startsWith('60')) {
                phoneToSend = '+' + phoneToSend
            } else {
                // If it doesn't start with 0 or 60, assume it might need + if it's full length, or user needs to fix data.
                // Let's safe-add '+'
                phoneToSend = '+' + phoneToSend
            }
        }

        // Also ensure the input phone is formatted similarly for the API call if needed, 
        // but verifyOtp usually just needs the phone number that received the code.
        // Actually, verifyOtp takes the phone number too.

        try {
            console.log('Sending OTP to:', phoneToSend)
            const { error } = await supabase.auth.signInWithOtp({
                phone: phoneToSend,
                options: {
                    channel: useWhatsapp ? 'whatsapp' : 'sms'
                }
            })

            if (error) {
                console.error('Error sending OTP:', error)
                setError(error.message)
            } else {
                setStep('otp')
            }
        } catch (err) {
            console.error('Unexpected error:', err)
            setError('Failed to send OTP. Please try again.')
        } finally {
            setLoading(false)
        }
    }



    const handleVerifyOtp = async () => {
        if (!agent.phone || !otp) return

        setLoading(true)
        setError('')

        // Format phone again for verification to match what was sent
        let phoneToSend = agent.phone || ''
        if (phoneToSend && !phoneToSend.startsWith('+')) {
            if (phoneToSend.startsWith('0')) {
                phoneToSend = '+60' + phoneToSend.substring(1)
            } else if (phoneToSend.startsWith('60')) {
                phoneToSend = '+' + phoneToSend
            } else {
                phoneToSend = '+' + phoneToSend
            }
        }

        try {
            const { error, data } = await supabase.auth.verifyOtp({
                phone: phoneToSend,
                token: otp,
                type: 'sms',
            })

            if (error) {
                setError('Invalid code. Please try again.')
                setLoading(false)
            } else {
                // Auth successful
                // Move to password setup step instead of claiming immediately
                setStep('setup-credentials')
                setLoading(false)
            }
        } catch (err) {
            console.error('Verification error:', err)
            setError('Verification failed.')
            setLoading(false)
        }
    }

    const handleSetupCredentials = async () => {
        if (!credentials.email || !credentials.password) {
            setError('Please enter both email and password.')
            return
        }
        if (credentials.password.length < 6) {
            setError('Password must be at least 6 characters.')
            return
        }

        setLoading(true)
        setError('')

        try {
            // Update the user with email and password
            const { error: updateError } = await supabase.auth.updateUser({
                email: credentials.email,
                password: credentials.password
            })

            if (updateError) throw updateError

            // Now perform the claim
            const result = await claimAgentProfile(agent.id)

            if (result.success) {
                // Also update the contact email in DB if it was empty
                if (!agent.email) {
                    await supabase
                        .from('contacts')
                        .update({ email: credentials.email })
                        .eq('id', agent.id)
                }
                setStep('success')
            } else {
                setError(result.error || 'Failed to link account')
            }
        } catch (err: any) {
            console.error('Setup error:', err)
            setError(err.message || 'Failed to set credentials')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
                <div className="text-center mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">Claim Profile</h2>
                    <p className="text-gray-500 text-sm mt-1">
                        Verify your identity to manage this agent profile.
                    </p>
                </div>

                {/* Agent Info Preview */}
                <div className="flex items-center gap-4 bg-gray-50 p-4 rounded-xl mb-6">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
                        {agent.photo_url ? (
                            <img src={agent.photo_url} alt={agent.name} className="w-full h-full object-cover" />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center text-gray-400 font-bold text-xl">
                                {agent.name.charAt(0)}
                            </div>
                        )}
                    </div>
                    <div>
                        <div className="font-semibold text-gray-900">{agent.name}</div>
                        <div className="text-xs text-gray-500">{agent.agency || 'Independent Agent'}</div>
                    </div>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-lg flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                        {error}
                    </div>
                )}

                {step === 'verify-phone' && (
                    <div>
                        <p className="text-gray-600 text-sm mb-2 text-center">
                            To verify you are the owner of this profile, please enter the phone number associated with:
                        </p>
                        <p className="font-mono font-bold text-gray-900 text-center mb-4 text-sm">
                            {maskedPhone}
                        </p>

                        <div className="mb-4">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <span className="text-gray-500 font-medium">+60</span>
                                </div>
                                <input
                                    type="tel"
                                    value={phoneInput}
                                    onChange={(e) => setPhoneInput(e.target.value.replace(/\D/g, ''))} // Only allow digits
                                    placeholder="12 345 6789"
                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                    autoFocus
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">Enter the full phone number to continue</p>
                        </div>

                        <button
                            onClick={handleVerifyPhone}
                            disabled={loading || !phoneInput || phoneInput.length < 10}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify & Send OTP'}
                        </button>

                        <div className="mt-4 flex items-center justify-center gap-2">
                            <input
                                type="checkbox"
                                id="useWhatsapp"
                                checked={useWhatsapp}
                                onChange={(e) => setUseWhatsapp(e.target.checked)}
                                className="w-4 h-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                            />
                            <label htmlFor="useWhatsapp" className="text-sm text-gray-600 flex items-center gap-1 cursor-pointer select-none">
                                <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z" /></svg>
                                Send verification code via WhatsApp
                            </label>
                        </div>
                        <button
                            onClick={onClose}
                            className="w-full mt-3 text-gray-500 hover:text-gray-700 font-medium py-2 transition-colors text-sm"
                        >
                            Cancel
                        </button>
                    </div>
                )}

                {step === 'otp' && (
                    <div>
                        <div className="mb-6">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Verification Code</label>
                            <input
                                type="text"
                                value={otp}
                                onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
                                placeholder="123456"
                                className="w-full px-4 py-3 text-center text-2xl font-mono tracking-widest border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={handleVerifyOtp}
                            disabled={loading || otp.length < 6}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Verifying...' : 'Verify Code'}
                        </button>
                        <div className="mt-4 flex justify-between items-center text-sm">
                            <button onClick={() => { setPhoneInput(''); setOtp(''); setStep('verify-phone'); }} className="text-gray-500 hover:text-gray-700">Change Number</button>
                            <button onClick={handleVerifyPhone} className="text-primary-600 hover:text-primary-700 font-medium">Resend Code</button>
                        </div>
                    </div>
                )}

                {step === 'setup-credentials' && (
                    <div className="space-y-4">
                        <div className="text-center mb-4">
                            <p className="text-green-600 font-semibold">Verification Successful!</p>
                            <p className="text-gray-600 text-sm">Now set up your login details for easier access next time.</p>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                            <input
                                type="email"
                                value={credentials.email}
                                onChange={(e) => setCredentials({ ...credentials, email: e.target.value })}
                                placeholder="your@email.com"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Create Password</label>
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(e) => setCredentials({ ...credentials, password: e.target.value })}
                                placeholder="Min 6 characters"
                                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 outline-none"
                            />
                        </div>
                        <button
                            onClick={handleSetupCredentials}
                            disabled={loading}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50"
                        >
                            {loading ? 'Saving...' : 'Save & Login'}
                        </button>
                    </div>
                )}

                {step === 'success' && (
                    <div className="text-center py-4">
                        <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Account Claimed!</h3>
                        <p className="text-gray-600 mb-6">
                            You have successfully verified your identity. You can now manage your listings and profile.
                        </p>
                        <button
                            onClick={() => window.location.href = '/dashboard'} // Assuming dashboard exists
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all"
                        >
                            Go to Dashboard
                        </button>
                    </div>
                )}
            </div>
        </div>
    )
}
