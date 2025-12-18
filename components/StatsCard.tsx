'use client'

import { useEffect, useState } from 'react'

interface StatsCardProps {
    icon: React.ReactNode
    value: string
    label: string
    delay?: number
}

export default function StatsCard({ icon, value, label, delay = 0 }: StatsCardProps) {
    const [isVisible, setIsVisible] = useState(false)

    useEffect(() => {
        const timer = setTimeout(() => setIsVisible(true), delay)
        return () => clearTimeout(timer)
    }, [delay])

    return (
        <div
            className={`
                bg-white/80 backdrop-blur-lg border border-white/40 rounded-2xl p-6 shadow-xl
                transform transition-all duration-700 hover:scale-105 hover:shadow-2xl
                ${isVisible ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            `}
            style={{
                animation: 'float 3s ease-in-out infinite',
                animationDelay: `${delay}ms`,
            }}
        >
            <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-primary flex items-center justify-center flex-shrink-0 shadow-md">
                    {icon}
                </div>
                <div>
                    <div className="text-2xl font-bold text-gray-900">{value}</div>
                    <div className="text-sm text-gray-600">{label}</div>
                </div>
            </div>
        </div>
    )
}

// Add to globals.css if not already there
/*
@keyframes float {
    0%, 100% {
        transform: translateY(0px);
    }
    50% {
        transform: translateY(-10px);
    }
}
*/
