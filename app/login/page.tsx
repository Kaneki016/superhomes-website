'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { RecaptchaVerifier, signInWithPhoneNumber } from 'firebase/auth'
import { auth } from '@/lib/firebase'
import { useRef, useEffect } from 'react' // Ensure hooks are imported

export default function LoginPage() {
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [rememberMe, setRememberMe] = useState(true)

    // Phone Auth State
    const [loginMethod, setLoginMethod] = useState<'email' | 'phone'>('email')
    const [phone, setPhone] = useState('')
    const [otp, setOtp] = useState('')
    const [otpSent, setOtpSent] = useState(false)

    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const router = useRouter()
    // Firebase Auth
    const { signIn, signInWithGoogle, signInWithOtp } = useAuth()
    const [confirmationResult, setConfirmationResult] = useState<any>(null)
    const recaptchaContainerRef = useRef<HTMLDivElement>(null)

    // Init Recaptcha
    useEffect(() => {
        if (loginMethod !== 'phone' || otpSent || !recaptchaContainerRef.current) return

        try {
            if (!window.recaptchaVerifier) {
                window.recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerRef.current, {
                    'size': 'invisible',
                    'callback': () => { },
                    'expired-callback': () => { }
                })
            }
        } catch (e) {
            console.error('Recaptcha Init Error', e)
        }

        return () => {
            if (window.recaptchaVerifier) {
                window.recaptchaVerifier.clear()
                window.recaptchaVerifier = undefined
            }
        }
    }, [loginMethod, otpSent])

    const handleSendOtp = async () => {
        if (!phone || phone.length < 8) return
        setLoading(true)
        setError('')

        // Auto-format phone
        let phoneToSend = phone.replace(/\D/g, '')
        if (phoneToSend.startsWith('0')) phoneToSend = '60' + phoneToSend.substring(1)
        if (!phoneToSend.startsWith('60')) phoneToSend = '60' + phoneToSend // Default assumption
        phoneToSend = '+' + phoneToSend

        try {
            if (!window.recaptchaVerifier) throw new Error('Recaptcha not initialized')

            const confirmation = await signInWithPhoneNumber(auth, phoneToSend, window.recaptchaVerifier)
            setConfirmationResult(confirmation)
            setOtpSent(true)
        } catch (err: any) {
            console.error(err)
            setError(err.message || 'Failed to send OTP')
            // Reset recaptcha if needed (removed aggressive clear)
        } finally {
            setLoading(false)
        }
    }

    const handleVerifyOtp = async () => {
        if (!otp || otp.length < 6 || !confirmationResult) return
        setLoading(true)
        setError('')

        try {
            const result = await confirmationResult.confirm(otp)
            const idToken = await result.user.getIdToken()

            // Format phone again (NextAuth OTP provider expects it for lookup)
            let phoneToSend = phone.replace(/\D/g, '')
            if (phoneToSend.startsWith('0')) phoneToSend = '60' + phoneToSend.substring(1)
            if (!phoneToSend.startsWith('60')) phoneToSend = '60' + phoneToSend
            phoneToSend = '+' + phoneToSend

            const { error } = await signInWithOtp(phoneToSend, idToken)

            if (error) throw error

            // Logged in successfully
            router.push('/')
        } catch (err: any) {
            setError(err.message || 'Invalid code')
            setLoading(false)
        }
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')
        setLoading(true)

        const { error } = await signIn(email, password)

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            router.push('/')
        }
    }

    const handleGoogleSignIn = async () => {
        setError('')
        const { error } = await signInWithGoogle()
        if (error) {
            setError(error.message)
        }
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/20">
            <Navbar />

            <div className="container-custom py-12">
                <div className="max-w-md mx-auto">
                    <div className="glass p-8 rounded-2xl">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-20 h-20 mx-auto mb-4">
                                <Image
                                    src="/logo-icon.svg"
                                    alt="SuperHomes Logo"
                                    width={80}
                                    height={80}
                                    className="w-full h-full"
                                />
                            </div>
                            <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">Welcome Back</h1>
                            <p className="text-gray-600">Sign in to your SuperHomes account</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* Social Login (Primary) */}
                        <button
                            onClick={handleGoogleSignIn}
                            className="w-full flex items-center justify-center px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors mb-8"
                            disabled={loading}
                        >
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                            </svg>
                            Continue with Google
                        </button>

                        {/* Divider */}
                        <div className="relative mb-8">
                            <div className="absolute inset-0 flex items-center">
                                <div className="w-full border-t border-gray-300"></div>
                            </div>
                            <div className="relative flex justify-center text-sm">
                                <span className="px-4 bg-white text-gray-500">Or continue with email</span>
                            </div>
                        </div>

                        {/* Login Method Toggle */}
                        <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('email'); setError(''); }}
                                className={`flex-1 py-3 rounded-lg font-medium transition-all ${loginMethod === 'email'
                                    ? 'bg-white text-primary-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Email
                            </button>
                            <button
                                type="button"
                                onClick={() => { setLoginMethod('phone'); setError(''); }}
                                className={`flex-1 py-3 rounded-lg font-medium transition-all ${loginMethod === 'phone'
                                    ? 'bg-white text-primary-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Phone (Agents)
                            </button>
                        </div>

                        {loginMethod === 'email' ? (
                            /* Email Form */
                            <form onSubmit={handleSubmit} className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                    <input
                                        type="email"
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        placeholder="Enter your email"
                                        className="input-field"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                    <input
                                        type="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        placeholder="Enter your password"
                                        className="input-field"
                                        required
                                        disabled={loading}
                                    />
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center">
                                        <input
                                            type="checkbox"
                                            checked={rememberMe}
                                            onChange={(e) => setRememberMe(e.target.checked)}
                                            className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                                        />
                                        <span className="ml-2 text-sm text-gray-600">Remember me</span>
                                    </label>
                                    <Link href="/forgot-password" className="text-sm text-primary-600 hover:text-primary-700">
                                        Forgot password?
                                    </Link>
                                </div>

                                <button
                                    type="submit"
                                    className="btn-primary w-full flex items-center justify-center"
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                            Signing in...
                                        </>
                                    ) : (
                                        'Sign In'
                                    )}
                                </button>
                            </form>
                        ) : (
                            /* Phone Form */
                            <div className="space-y-6">
                                {/* Step 1: Request OTP */}
                                {!otpSent ? (
                                    <>
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
                                                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 outline-none transition-all"
                                                    autoFocus
                                                />
                                            </div>
                                            <p className="text-xs text-gray-500 mt-2">Enter your registered phone number</p>
                                        </div>

                                        <button
                                            onClick={handleSendOtp}
                                            className="btn-primary w-full flex items-center justify-center"
                                            disabled={loading || phone.length < 8}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Sending OTP...
                                                </>
                                            ) : (
                                                'Send Login Code'
                                            )}
                                        </button>
                                        <div ref={recaptchaContainerRef}></div>
                                    </>
                                ) : (
                                    /* Step 2: Verify OTP */
                                    <>
                                        <div>
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
                                            className="btn-primary w-full flex items-center justify-center"
                                            disabled={loading || otp.length < 6}
                                        >
                                            {loading ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Verifying...
                                                </>
                                            ) : (
                                                'Verify & Login'
                                            )}
                                        </button>

                                        <button
                                            onClick={() => setOtpSent(false)}
                                            className="w-full text-sm text-gray-500 hover:text-gray-700 mt-2"
                                        >
                                            Change Phone Number
                                        </button>
                                    </>
                                )}
                            </div>
                        )}

                        {/* Agent Notice */}
                        <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <p className="text-xs text-blue-700 text-center">
                                <strong>Are you a property agent?</strong><br />
                                Please <Link href="/register" className="underline font-medium hover:text-blue-800">register here</Link> with your phone number to verify your agent profile.
                            </p>
                        </div>

                        {/* Register Link */}
                        <p className="mt-8 text-center text-sm text-gray-600">
                            Don&apos;t have an account?{' '}
                            <Link href="/register" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Register here
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div >
    )
}
