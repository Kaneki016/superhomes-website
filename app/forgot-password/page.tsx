'use client'

import Link from 'next/link'
import Image from 'next/image'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'

export default function ForgotPasswordPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-primary-50/20">
            <Navbar />

            <div className="container-custom py-12">
                <div className="max-w-md mx-auto">
                    <div className="glass p-8 rounded-2xl text-center">
                        {/* Header */}
                        <div className="w-20 h-20 mx-auto mb-6">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_DO_SPACE_URL}/logo-icon.svg`}
                                alt="SuperHomes Logo"
                                width={80}
                                height={80}
                                className="w-full h-full"
                            />
                        </div>
                        <h1 className="font-heading font-bold text-3xl text-gray-900 mb-4">Forgot Password?</h1>
                        <p className="text-gray-600 mb-8">
                            No worries! You can log in instantly using your phone number via WhatsApp OTP.
                        </p>

                        <div className="space-y-4">
                            <Link href="/login" className="btn-primary w-full flex items-center justify-center">
                                Login with Phone OTP
                            </Link>

                            <p className="text-sm text-gray-500">
                                Once logged in, you can reset your password in your Profile settings.
                            </p>

                            <div className="pt-4 border-t border-gray-100">
                                <Link href="/login" className="text-primary-600 hover:text-primary-700 font-medium">
                                    Back to Login
                                </Link>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
