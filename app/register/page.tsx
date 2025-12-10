'use client'

import { useState } from 'react'
import Link from 'next/link'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function RegisterPage() {
    const [userType, setUserType] = useState<'buyer' | 'agent'>('buyer')
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
    })

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault()
        // TODO: Implement Supabase registration
        alert('Registration functionality will be available after Supabase is configured')
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/20">
            <Navbar />

            <div className="container-custom py-12">
                <div className="max-w-md mx-auto">
                    <div className="glass p-8 rounded-2xl">
                        {/* Header */}
                        <div className="text-center mb-8">
                            <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                                <span className="text-white font-bold text-2xl">SH</span>
                            </div>
                            <h1 className="font-heading font-bold text-3xl text-gray-900 mb-2">Create Account</h1>
                            <p className="text-gray-600">Join SuperHomes today</p>
                        </div>

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
                                    />
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
                                <input
                                    type="password"
                                    value={formData.password}
                                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                                    placeholder="Create a password"
                                    className="input-field"
                                    required
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

                            <button type="submit" className="btn-primary w-full">
                                Create Account
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
