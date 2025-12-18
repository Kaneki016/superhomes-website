'use client'

import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'

export default function SellPropertyPage() {
    const { user, profile, loading } = useAuth()
    const isLoggedIn = !!user

    // Show loading spinner while checking auth
    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50">
                <Navbar />
                <div className="flex items-center justify-center py-32">
                    <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
                <Footer />
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container-custom py-12">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="font-heading font-bold text-4xl md:text-5xl text-gray-900 mb-4">
                        Sell Your Property
                    </h1>
                    <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                        List your property on SuperHomes and reach thousands of potential buyers
                    </p>
                </div>

                {!isLoggedIn ? (
                    /* Not Logged In - Show Benefits */
                    <div className="max-w-4xl mx-auto">
                        {/* Benefits Section */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
                            <div className="glass p-8 rounded-2xl text-center">
                                <div className="w-16 h-16 bg-gradient-primary rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-bold text-xl mb-2">Maximum Visibility</h3>
                                <p className="text-gray-600 text-sm">Your listing reaches thousands of active property seekers daily</p>
                            </div>

                            <div className="glass p-8 rounded-2xl text-center">
                                <div className="w-16 h-16 bg-gradient-accent rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-bold text-xl mb-2">Affordable Credits</h3>
                                <p className="text-gray-600 text-sm">Pay-per-listing model with competitive pricing</p>
                            </div>

                            <div className="glass p-8 rounded-2xl text-center">
                                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                    </svg>
                                </div>
                                <h3 className="font-heading font-bold text-xl mb-2">Quick & Easy</h3>
                                <p className="text-gray-600 text-sm">Simple listing process with instant publishing</p>
                            </div>
                        </div>

                        {/* CTA Card */}
                        <div className="glass p-10 rounded-2xl text-center">
                            <h2 className="font-heading font-bold text-2xl text-gray-900 mb-4">
                                Ready to List Your Property?
                            </h2>
                            <p className="text-gray-600 mb-8 max-w-lg mx-auto">
                                Register as an agent to start posting your properties. It only takes a few minutes!
                            </p>
                            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                                <a href="/register" className="btn-primary">
                                    Register as Agent
                                </a>
                                <a href="/login" className="btn-secondary">
                                    Already have an account? Login
                                </a>
                            </div>
                        </div>

                        {/* Pricing Section */}
                        <div className="mt-16">
                            <h2 className="font-heading font-bold text-3xl text-center text-gray-900 mb-8">
                                Credit Packages
                            </h2>
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                                <div className="glass p-8 rounded-2xl text-center">
                                    <h3 className="font-heading font-bold text-xl mb-2">Starter</h3>
                                    <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">RM 50</p>
                                    <p className="text-gray-600 mb-4">10 Credits</p>
                                    <p className="text-sm text-gray-500">RM 5 per listing</p>
                                </div>
                                <div className="glass p-8 rounded-2xl text-center border-2 border-primary-400 relative">
                                    <span className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-gradient-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
                                        Popular
                                    </span>
                                    <h3 className="font-heading font-bold text-xl mb-2">Professional</h3>
                                    <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">RM 120</p>
                                    <p className="text-gray-600 mb-4">30 Credits</p>
                                    <p className="text-sm text-gray-500">RM 4 per listing</p>
                                </div>
                                <div className="glass p-8 rounded-2xl text-center">
                                    <h3 className="font-heading font-bold text-xl mb-2">Enterprise</h3>
                                    <p className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent mb-2">RM 250</p>
                                    <p className="text-gray-600 mb-4">100 Credits</p>
                                    <p className="text-sm text-gray-500">RM 2.50 per listing</p>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Logged In - Show Post Form */
                    <div className="max-w-3xl mx-auto">
                        <div className="glass p-8 rounded-2xl">
                            <h2 className="font-heading font-bold text-2xl mb-6">Post a New Property</h2>
                            <p className="text-gray-600">Property posting form will be available after authentication is set up.</p>
                        </div>
                    </div>
                )}
            </div>

            <Footer />
        </div>
    )
}
