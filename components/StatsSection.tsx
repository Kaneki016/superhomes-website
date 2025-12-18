'use client'

import { useEffect, useState } from 'react'
import { getPlatformStats } from '@/lib/database'

export default function StatsSection() {
    const [stats, setStats] = useState({
        propertyCount: 0,
        agentCount: 0,
        citiesCount: 0,
        recentListings: 0
    })
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        async function loadStats() {
            try {
                const data = await getPlatformStats()
                setStats(data)
            } catch (error) {
                console.error('Error loading stats:', error)
            } finally {
                setLoading(false)
            }
        }
        loadStats()
    }, [])

    const formatNumber = (num: number) => {
        if (num >= 1000) {
            return `${(num / 1000).toFixed(1)}k+`
        }
        return num.toString()
    }

    if (loading) {
        return (
            <div className="border-t border-gray-100 py-8">
                <div className="container-custom">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {[1, 2, 3, 4].map((i) => (
                            <div key={i} className="text-center animate-pulse">
                                <div className="h-8 bg-gray-200 rounded w-16 mx-auto mb-2"></div>
                                <div className="h-4 bg-gray-200 rounded w-24 mx-auto"></div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    return (
        <div className="border-t border-gray-100 py-8 bg-gray-50/50">
            <div className="container-custom">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                    {/* Properties */}
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                            {formatNumber(stats.propertyCount)}
                        </div>
                        <div className="text-sm text-gray-600">Properties Listed</div>
                    </div>

                    {/* Agents */}
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                            {formatNumber(stats.agentCount)}
                        </div>
                        <div className="text-sm text-gray-600">Verified Agents</div>
                    </div>

                    {/* Locations */}
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                            {stats.citiesCount}
                        </div>
                        <div className="text-sm text-gray-600">Locations</div>
                    </div>

                    {/* Recent Listings */}
                    <div className="text-center">
                        <div className="text-3xl md:text-4xl font-bold text-gray-900 mb-1">
                            {formatNumber(stats.recentListings)}
                        </div>
                        <div className="text-sm text-gray-600">New This Month</div>
                    </div>
                </div>
            </div>
        </div>
    )
}
