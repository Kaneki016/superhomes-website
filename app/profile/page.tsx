'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase'

export default function ProfilePage() {
    const { user, profile, loading } = useAuth()
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    })
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')

    useEffect(() => {
        if (!loading && !user) {
            router.push('/login')
        }
    }, [user, loading, router])

    useEffect(() => {
        if (profile) {
            setFormData({
                name: profile.name || '',
                phone: profile.phone || '',
            })
        }
    }, [profile])

    const handleSave = async () => {
        if (!user || !profile) return

        setSaving(true)
        setSaveMessage('')

        try {
            if (profile.user_type === 'buyer') {
                // Update buyer profile
                const { data, error } = await supabase
                    .from('buyers')
                    .update({
                        name: formData.name || null,
                        phone: formData.phone || null,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('auth_id', user.id)
                    .select()

                if (error) {
                    console.error('Error updating profile:', error)
                    setSaveMessage(`Failed to update profile: ${error.message}`)
                } else if (!data || data.length === 0) {
                    console.error('No buyer record found for auth_id:', user.id)
                    setSaveMessage('Profile not found. Please try logging out and back in.')
                } else {
                    setSaveMessage('Profile updated successfully!')
                    // Refresh the page after a brief delay to show updated data
                    setTimeout(() => {
                        window.location.reload()
                    }, 800)
                }
            }
        } catch (error) {
            console.error('Error:', error)
            setSaveMessage('An error occurred. Please try again.')
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <div className="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin"></div>
            </div>
        )
    }

    if (!user) {
        return null
    }

    return (
        <div className="min-h-screen bg-gray-50">
            <Navbar />

            <div className="container-custom py-12">
                <div className="max-w-2xl mx-auto">
                    <h1 className="font-heading font-bold text-3xl text-gray-900 mb-8">My Profile</h1>

                    <div className="glass p-8 rounded-2xl">
                        {/* Profile Header */}
                        <div className="flex items-center mb-8 pb-8 border-b border-gray-200">
                            <div className="w-20 h-20 rounded-full bg-gradient-primary flex items-center justify-center text-white font-bold text-3xl">
                                {user.email?.charAt(0).toUpperCase()}
                            </div>
                            <div className="ml-6">
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {profile?.name || user.email?.split('@')[0]}
                                </h2>
                                <p className="text-gray-600">{user.email}</p>
                                <span className="inline-block mt-2 px-3 py-1 bg-primary-100 text-primary-600 text-sm font-medium rounded-full capitalize">
                                    {profile?.user_type || 'Buyer'}
                                </span>
                            </div>
                        </div>

                        {/* Save Message */}
                        {saveMessage && (
                            <div className={`mb-6 p-4 rounded-lg ${saveMessage.includes('success') ? 'bg-green-50 border border-green-200 text-green-700' : 'bg-red-50 border border-red-200 text-red-700'}`}>
                                {saveMessage}
                            </div>
                        )}

                        {/* Profile Info */}
                        <div className="space-y-6">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                                <input
                                    type="email"
                                    value={user.email || ''}
                                    disabled
                                    className="input-field bg-gray-100 cursor-not-allowed"
                                />
                                <p className="text-xs text-gray-500 mt-1">Email cannot be changed</p>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">Account Type</label>
                                <input
                                    type="text"
                                    value={profile?.user_type || 'Buyer'}
                                    disabled
                                    className="input-field bg-gray-100 cursor-not-allowed capitalize"
                                />
                            </div>

                            {profile?.user_type === 'buyer' ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input-field"
                                            placeholder="Enter your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="input-field"
                                            placeholder="+60 12-345 6789"
                                        />
                                    </div>

                                    {/* Save Button */}
                                    <div className="pt-4">
                                        <button
                                            onClick={handleSave}
                                            disabled={saving}
                                            className="btn-primary w-full sm:w-auto flex items-center justify-center"
                                        >
                                            {saving ? (
                                                <>
                                                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                                                    Saving...
                                                </>
                                            ) : (
                                                <>
                                                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                                    </svg>
                                                    Save Changes
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            disabled
                                            className="input-field bg-gray-100 cursor-not-allowed"
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone / WhatsApp</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            disabled
                                            className="input-field bg-gray-100 cursor-not-allowed"
                                            placeholder="+60 12-345 6789"
                                        />
                                    </div>

                                    {/* Info Message for Agents */}
                                    <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                                        <div className="flex items-start">
                                            <svg className="w-5 h-5 text-blue-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <div className="text-sm text-blue-700">
                                                <p className="font-medium mb-1">Agent Profile Information</p>
                                                <p>Your agent profile is managed through PropertyGuru and cannot be edited directly here. To update your contact details or agency information, please contact our support team.</p>
                                            </div>
                                        </div>
                                    </div>
                                </>
                            )}
                        </div>

                        {/* Account Info */}
                        <div className="mt-8 pt-8 border-t border-gray-200">
                            <h3 className="font-semibold text-gray-900 mb-4">Account Information</h3>
                            <div className="text-sm text-gray-600 space-y-2">
                                <p>
                                    <span className="font-medium">Account created:</span>{' '}
                                    {new Date(user.created_at || '').toLocaleDateString('en-MY', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                    })}
                                </p>
                                <p>
                                    <span className="font-medium">Last sign in:</span>{' '}
                                    {new Date(user.last_sign_in_at || '').toLocaleDateString('en-MY', {
                                        year: 'numeric',
                                        month: 'long',
                                        day: 'numeric',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    })}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    )
}
