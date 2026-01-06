'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { useFavorites } from '@/contexts/FavoritesContext'

export default function Navbar() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
    const [userMenuOpen, setUserMenuOpen] = useState(false)
    const { user, profile, loading, signOut } = useAuth()
    const { favorites } = useFavorites()

    const handleSignOut = async () => {
        setUserMenuOpen(false)
        await signOut()
    }
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
                            Buy
                        </Link>
                        <Link href="/rent" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Rent
                        </Link>
                        <Link href="/new-projects" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            New Projects
                        </Link>
                        <Link href="/agents" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                            Agents
                        </Link>
                    </div>

                    {/* Auth Section */}
                    <div className="hidden md:flex items-center space-x-4">
                        {loading ? (
                            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
                        ) : user ? (
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 transition-colors"
                                >
                                    <div className="w-10 h-10 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold">
                                        {user.email?.charAt(0).toUpperCase()}
                                    </div>
                                    <span className="text-gray-700 font-medium">
                                        {profile?.name || user.email?.split('@')[0]}
                                    </span>
                                    <svg className={`w-4 h-4 text-gray-500 transition-transform ${userMenuOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </button>

                                {/* User Dropdown */}
                                {userMenuOpen && (
                                    <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 animate-fade-in">
                                        <div className="px-4 py-3 border-b border-gray-100">
                                            <p className="text-sm font-medium text-gray-900">{user.email}</p>
                                            <p className="text-xs text-gray-500 capitalize">{profile?.user_type || 'User'}</p>
                                        </div>

                                        {profile?.user_type === 'agent' && (
                                            <Link
                                                href="/dashboard"
                                                className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                                                onClick={() => setUserMenuOpen(false)}
                                            >
                                                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                                                </svg>
                                                Dashboard
                                            </Link>
                                        )}

                                        <Link
                                            href="/profile"
                                            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                            </svg>
                                            Profile
                                        </Link>

                                        <Link
                                            href="/favorites"
                                            className="flex items-center justify-between px-4 py-2 text-gray-700 hover:bg-gray-50"
                                            onClick={() => setUserMenuOpen(false)}
                                        >
                                            <div className="flex items-center">
                                                <svg className="w-5 h-5 mr-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                                                </svg>
                                                Saved Properties
                                            </div>
                                            {favorites.length > 0 && (
                                                <span className="px-2 py-0.5 text-xs font-semibold bg-primary-100 text-primary-600 rounded-full">
                                                    {favorites.length}
                                                </span>
                                            )}
                                        </Link>

                                        <div className="border-t border-gray-100 mt-2 pt-2">
                                            <button
                                                onClick={handleSignOut}
                                                className="flex items-center w-full px-4 py-2 text-red-600 hover:bg-red-50"
                                            >
                                                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                                                </svg>
                                                Sign Out
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <>
                                <Link href="/login" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                    Login
                                </Link>
                                <Link href="/register" className="btn-primary">
                                    Register
                                </Link>
                            </>
                        )}
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
                                Buy
                            </Link>
                            <Link href="/rent" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                Rent
                            </Link>
                            <Link href="/new-projects" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                New Projects
                            </Link>
                            <Link href="/agents" className="text-gray-700 hover:text-primary-600 font-medium transition-colors">
                                Agents
                            </Link>
                            <div className="pt-4 border-t border-gray-200 flex flex-col space-y-2">
                                {user ? (
                                    <>
                                        <div className="flex items-center space-x-2 px-2 py-2">
                                            <div className="w-8 h-8 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                                                {user.email?.charAt(0).toUpperCase()}
                                            </div>
                                            <span className="text-gray-700 font-medium text-sm">
                                                {user.email}
                                            </span>
                                        </div>
                                        {profile?.user_type === 'agent' && (
                                            <Link href="/dashboard" className="btn-secondary text-center">
                                                Dashboard
                                            </Link>
                                        )}
                                        <button onClick={handleSignOut} className="btn-secondary text-center text-red-600 border-red-200 hover:bg-red-50">
                                            Sign Out
                                        </button>
                                    </>
                                ) : (
                                    <>
                                        <Link href="/login" className="btn-secondary text-center">
                                            Login
                                        </Link>
                                        <Link href="/register" className="btn-primary text-center">
                                            Register
                                        </Link>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </nav>
    )
}
