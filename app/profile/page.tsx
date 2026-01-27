'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Navbar from '@/components/Navbar'
import Footer from '@/components/Footer'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/lib/supabase-browser'

export default function ProfilePage() {
    const { user, profile, loading, refreshProfile } = useAuth()
    const router = useRouter()
    const [formData, setFormData] = useState({
        name: '',
        phone: '',
    })
    const [shouldRefresh, setShouldRefresh] = useState(false)
    const [saving, setSaving] = useState(false)
    const [saveMessage, setSaveMessage] = useState('')
    const [uploading, setUploading] = useState(false)

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
    }, [user, profile])

    // Effect to handle profile refresh
    useEffect(() => {
        let mounted = true

        const doRefresh = async () => {
            if (shouldRefresh && mounted) {
                try {
                    await refreshProfile()
                } catch (error) {
                    console.error('Error refreshing profile:', error)
                } finally {
                    if (mounted) setShouldRefresh(false)
                }
            }
        }

        doRefresh()

        return () => { mounted = false }
    }, [shouldRefresh, refreshProfile])

    const handleSave = async () => {
        if (!user || !profile) return

        setSaving(true)
        setSaveMessage('')

        console.log('Profile save started for:', user.id)

        try {
            if (profile.user_type === 'buyer') {
                // Use upsert to handle both create and update in one call
                // This avoids RLS issues with SELECT that might block reads
                console.log('Upserting buyer profile...')
                const { data, error } = await supabase
                    .from('buyers')
                    .upsert({
                        id: profile.id, // Use the profile.id which should equal user.id
                        auth_id: user.id,
                        email: user.email,
                        user_type: 'buyer',
                        name: formData.name || null,
                        phone: formData.phone || null,
                        updated_at: new Date().toISOString(),
                    }, {
                        onConflict: 'id'
                    })
                    .select()

                if (error) {
                    console.error('Error saving profile:', error)
                    setSaveMessage(`Failed to save profile: ${error.message}`)
                } else {
                    console.log('Profile saved:', data)
                    setSaveMessage('Profile saved successfully!')
                    setShouldRefresh(true) // Trigger refresh safely via effect
                    setTimeout(() => setSaveMessage(''), 3000)
                }
            } else if (profile.user_type === 'agent') {
                console.log('Updating agent profile...')
                const { data, error } = await supabase
                    .from('contacts')
                    .update({
                        name: formData.name,
                        phone: formData.phone,
                        updated_at: new Date().toISOString(),
                    })
                    .eq('id', profile.id)
                    .select()

                if (error) {
                    console.error('Error saving agent profile:', error)
                    setSaveMessage(`Failed to save profile: ${error.message}`)
                } else {
                    console.log('Agent profile saved:', data)
                    setSaveMessage('Profile saved successfully!')
                    setShouldRefresh(true)
                    setTimeout(() => setSaveMessage(''), 3000)
                }
            }
        } catch (error) {
            console.error('Error:', error)
            setSaveMessage('An error occurred. Please try again.')
        } finally {
            console.log('Profile save finished, setting saving to false')
            setSaving(false)
        }
    }

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        try {
            if (!event.target.files || event.target.files.length === 0) {
                return
            }
            if (!user) return

            const file = event.target.files[0]
            const fileExt = file.name.split('.').pop()
            const filePath = `${user.id}-${Math.random()}.${fileExt}`

            setUploading(true)
            setSaveMessage('')

            // 1. Upload to Supabase Storage
            const { error: uploadError } = await supabase.storage
                .from('avatars')
                .upload(filePath, file, { upsert: true })

            if (uploadError) {
                throw uploadError
            }

            // 2. Get Public URL
            const { data: { publicUrl } } = supabase.storage
                .from('avatars')
                .getPublicUrl(filePath)

            // 3. Update Profile
            if (profile?.user_type === 'agent') {
                const { error: updateError } = await supabase
                    .from('contacts')
                    .update({ photo_url: publicUrl })
                    .eq('id', profile?.id)

                if (updateError) throw updateError
            } else {
                const { error: updateError } = await supabase.auth.updateUser({
                    data: { avatar_url: publicUrl }
                })

                if (updateError) throw updateError
            }

            setSaveMessage('Profile photo updated!')
            setShouldRefresh(true)

        } catch (error: any) {
            console.error('Error uploading image:', error)
            setSaveMessage(`Error uploading image: ${error.message}`)
        } finally {
            setUploading(false)
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
                        {/* Profile Header */}
                        <div className="flex items-center mb-8 pb-8 border-b border-gray-200">
                            <div className="relative group">
                                <div className="w-20 h-20 rounded-full overflow-hidden border-4 border-white shadow-lg bg-gray-200">
                                    {profile?.photo_url || user.user_metadata?.avatar_url ? (
                                        <img
                                            src={profile?.photo_url || user.user_metadata?.avatar_url || ''}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                            referrerPolicy="no-referrer"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-primary flex items-center justify-center text-white font-bold text-3xl">
                                            {profile?.name?.charAt(0).toUpperCase() || user.email?.charAt(0).toUpperCase()}
                                        </div>
                                    )}
                                </div>
                                <label className="absolute inset-0 flex items-center justify-center bg-black/50 text-white opacity-0 group-hover:opacity-100 rounded-full cursor-pointer transition-opacity">
                                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                                    </svg>
                                    <input
                                        type="file"
                                        className="hidden"
                                        accept="image/*"
                                        onChange={handleImageUpload}
                                        disabled={uploading}
                                    />
                                </label>
                                {uploading && (
                                    <div className="absolute inset-0 flex items-center justify-center bg-black/50 rounded-full">
                                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                    </div>
                                )}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input-field"
                                            placeholder="Enter your username"
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
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Display Name</label>
                                        <input
                                            type="text"
                                            value={formData.name}
                                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                            className="input-field"
                                            placeholder="Your full name"
                                        />
                                    </div>

                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">Phone / WhatsApp</label>
                                        <input
                                            type="tel"
                                            value={formData.phone}
                                            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                            className="input-field"
                                            placeholder="+60 12-345 6789"
                                        />
                                    </div>

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
