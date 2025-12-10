'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'

export default function RegisterPage() {
    const [userType, setUserType] = useState<'buyer' | 'agent'>('buyer')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    })
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()
    const { signUp } = useAuth()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError('')

        // Validate passwords match
        if (formData.password !== formData.confirmPassword) {
            setError('Passwords do not match')
            return
        }

        // Validate password length
        if (formData.password.length < 6) {
            setError('Password must be at least 6 characters')
            return
        }

        // Validate phone for agents
        if (userType === 'agent' && !formData.phone) {
            setError('Phone number is required for agents')
            return
        }

        setLoading(true)

        const { error } = await signUp(formData.email, formData.password, {
            name: formData.name,
            userType: userType,
            phone: formData.phone || undefined,
        })

        if (error) {
            setError(error.message)
            setLoading(false)
        } else {
            setSuccess(true)
        }
    }

    if (success) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/20">
                <Navbar />
                <div className="container-custom py-12">
                    <div className="max-w-md mx-auto">
                        <div className="glass p-8 rounded-2xl text-center">
                            <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
                                <svg className="w-10 h-10 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                            <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">
                                Check Your Email!
                            </h2>
                            <p className="text-gray-600 mb-6">
                                We&apos;ve sent a confirmation link to <strong>{formData.email}</strong>.
                                Please click the link to verify your account.
                            </p>
                            <Link href="/login" className="btn-primary inline-block">
                                Go to Login
                            </Link>
                        </div>
                    </div>
                </div>
                <Footer />
            </div>
        )
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
                            <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">Create Account</h1>
                            <p className="text-gray-600">Join SuperHomes today</p>
                        </div>

                        {/* Error Message */}
                        {error && (
                            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-600 text-sm">
                                {error}
                            </div>
                        )}

                        {/* User Type Toggle */}
                        <div className="flex mb-8 bg-gray-100 rounded-lg p-1">
                            <button
                                type="button"
                                onClick={() => setUserType('buyer')}
                                className={`flex-1 py-3 rounded-lg font-medium transition-all ${userType === 'buyer'
                                    ? 'bg-white text-primary-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Buyer
                            </button>
                            <button
                                type="button"
                                onClick={() => setUserType('agent')}
                                className={`flex-1 py-3 rounded-lg font-medium transition-all ${userType === 'agent'
                                    ? 'bg-white text-primary-600 shadow-md'
                                    : 'text-gray-600 hover:text-gray-900'
                                    }`}
                            >
                                Agent
                            </button>
                        </div>

                        {/* Form */}
                        <form onSubmit={handleSubmit} className="space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Enter your full name"
                                    className="input-field"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={formData.email}
                                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                    placeholder="Enter your email"
                                    className="input-field"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            {userType === 'agent' && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">Phone / WhatsApp</label>
                                    <input
                                        type="tel"
                                        value={formData.phone}
                                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                        placeholder="+60 12-345 6789"
                                        className="input-field"
                                        required
                                        disabled={loading}
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Create a password (min 6 characters)"
                                    className="input-field"
                                    required
                                    disabled={loading}
                                    minLength={6}
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Confirm Password</label>
                                <input
                                    type="password"
                                    value={formData.confirmPassword}
                                    onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                                    placeholder="Confirm your password"
                                    className="input-field"
                                    required
                                    disabled={loading}
                                />
                            </div>

                            <div className="flex items-start">
                                <input type="checkbox" className="mt-1 rounded border-gray-300 text-primary-600 focus:ring-primary-500" required />
                                <span className="ml-2 text-sm text-gray-600">
                                    I agree to the{' '}
                                    <a href="#" className="text-primary-600 hover:text-primary-700">Terms of Service</a>
                                    {' '}and{' '}
                                    <a href="#" className="text-primary-600 hover:text-primary-700">Privacy Policy</a>
                                </span>
                            </div>

                            <button
                                type="submit"
                                className="btn-primary w-full flex items-center justify-center"
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                        Creating Account...
                                    </>
                                ) : (
                                    'Create Account'
                                )}
                            </button>
                        </form>

                        {/* Login Link */}
                        <p className="mt-8 text-center text-sm text-gray-600">
                            Already have an account?{' '}
                            <Link href="/login" className="text-primary-600 hover:text-primary-700 font-semibold">
                                Sign in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
