'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <nav className="glass sticky top-0 z-50">
            <div className="container-custom">
                <div className="flex items-center justify-between h-20">
                    {/* Logo */}
                    <Link href="/" className="flex items-center space-x-2">
                        <Image
                            src="/logo-icon.svg"
                            alt="SuperHomes Logo"
                            width={40}
                            height={40}
                            className="w-10 h-10"
                        />
                        <span className="font-heading font-bold text-2xl bg-gradient-primary bg-clip-text text-transparent">
                            SuperHomes
                        </span>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-8">
                        <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Home
                        </Link>
                        <Link href="/properties" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Properties
                        </Link>
                        <Link href="/agents" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Agents
                        </Link>
                        <Link href="/sell" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Sell Property
                        </Link>
                    </div>

                    {/* Auth Buttons */}
                    <div className="hidden md:flex items-center space-x-4">
                        <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Login
                        </Link>
                        <Link href="/register" className="btn-primary">
                            Register
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                        className="md:hidden p-2 rounded-lg hover:bg-gray-100"
                    >
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            {mobileMenuOpen ? (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            ) : (
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                            )}
                        </svg>
                    </button>
                </div>

                {/* Mobile Menu */}
                {mobileMenuOpen && (
                    <div className="md:hidden py-4 border-t border-gray-200 animate-fade-in">
                        <div className="flex flex-col space-y-4">
                            <Link href="/" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                Home
                            </Link>
                            <Link href="/properties" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                Properties
                            </Link>
                            <Link href="/agents" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                Agents
                            </Link>
                            <Link href="/sell" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                Sell Property
                            </Link>
                            <div className="pt-4 border-t border-gray-200 flex flex-col space-y-2">
                                <Link href="/login" className="btn-secondary text-center">
                                    Login
                                </Link>
                                <Link href="/register" className="btn-primary text-center">
                                    Register
                                </Link>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
