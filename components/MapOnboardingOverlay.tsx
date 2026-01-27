'use client'

import { Map as MapIcon, Pencil } from 'lucide-react'

interface MapOnboardingOverlayProps {
    onStartDrawing: () => void
}

export default function MapOnboardingOverlay({ onStartDrawing }: MapOnboardingOverlayProps) {
    return (
        <div className="absolute inset-0 z-[500] flex items-center justify-center pointer-events-none">
            {/* Backdrop with slight blur/dim to emphasize the overlay content, but keep map visible */}
            {/* We want the map to be visible, so maybe just a centered card is better than full screen dimming which might look like a disabled state */}

            <div className="bg-white/90 backdrop-blur-md p-8 rounded-2xl shadow-xl border border-white/50 max-w-sm text-center pointer-events-auto transform transition-all animate-in fade-in zoom-in duration-300 mx-4">
                <div className="w-16 h-16 bg-primary-100 text-primary-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-inner">
                    <MapIcon size={32} />
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">Explore Transactions</h3>
                <p className="text-gray-600 mb-6 leading-relaxed">
                    Draw a custom area on the map to see real transaction data and property trends for that specific location.
                </p>

                <button
                    onClick={onStartDrawing}
                    className="w-full bg-primary-600 hover:bg-primary-700 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary-600/20 hover:shadow-primary-600/40 transition-all transform active:scale-95 flex items-center justify-center gap-2 group"
                >
                    <Pencil size={18} className="group-hover:rotate-12 transition-transform" />
                    <span>Start Drawing</span>
                </button>
            </div>
        </div>
    )
}
