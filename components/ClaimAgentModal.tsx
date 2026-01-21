'use client'

import { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Agent } from '@/lib/supabase'

interface ClaimAgentModalProps {
    isOpen: boolean
    onClose: () => void
    agent: Agent
}

export default function ClaimAgentModal({ isOpen, onClose, agent }: ClaimAgentModalProps) {
    const [step, setStep] = useState<'confirm' | 'otp' | 'success'>('confirm')
    const [otp, setOtp] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!isOpen) return null

    // Mask phone number for privacy/security display
    const maskedPhone = agent.phone
        ? agent.phone.replace(/(\d{3})\d{4}(\d+)/, '$1****$2')
        : 'Unknown Number'

    const handleSendOtp = async () => {
        if (!agent.phone) {
            setError('This agent profile does not have a phone number to verify.')
            return
        }

        setLoading(true)
        setError('')

        try {
            const { error } = await supabase.auth.signInWithOtp({
                phone: agent.phone,
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

        try {
            const { error, data } = await supabase.auth.verifyOtp({
                phone: agent.phone,
                token: otp,
                type: 'sms',
            })

            if (error) {
                setError('Invalid code. Please try again.')
            } else {
                // Determine if we need to link the account in the database (custom logic likely needed here)
                // For now, we assume success means auth is done
                setStep('success')
            }
        } catch (err) {
            console.error('Verification error:', err)
            setError('Verification failed.')
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

                {step === 'confirm' && (
                    <div>
                        <p className="text-gray-600 text-sm mb-4 text-center">
                            We will send a 6-digit verification code to the phone number associated with this profile:
                            <br />
                            <span className="font-mono font-bold text-gray-900 block mt-2 text-lg">{maskedPhone}</span>
                        </p>
                        <button
                            onClick={handleSendOtp}
                            disabled={loading || !agent.phone}
                            className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading ? 'Sending...' : 'Send Verification Code'}
                        </button>
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
                            <button onClick={() => setStep('confirm')} className="text-gray-500 hover:text-gray-700">Change Number</button>
                            <button onClick={handleSendOtp} className="text-primary-600 hover:text-primary-700 font-medium">Resend Code</button>
                        </div>
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
