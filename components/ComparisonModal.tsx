'use client'

import { X } from 'lucide-react'
import ComparisonTable from './ComparisonTable'
import { useCompare } from '@/contexts/CompareContext'

interface ComparisonModalProps {
    isOpen: boolean
    onClose: () => void
}

export default function ComparisonModal({ isOpen, onClose }: ComparisonModalProps) {
    const { clearCompare } = useCompare()

    if (!isOpen) return null

    return (
        <div className="fixed inset-0 z-[3000]">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
                onClick={onClose}
            ></div>

            {/* Modal Content */}
            <div className="absolute inset-4 md:inset-10 bg-white rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in scale-in-95 duration-200">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 bg-gray-50 flex-shrink-0">
                    <div>
                        <h2 className="text-xl font-bold text-gray-900">Compare Properties</h2>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={clearCompare}
                            className="text-sm text-red-600 hover:text-red-700 font-medium"
                        >
                            Clear All
                        </button>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-200 transition-colors"
                        >
                            <X size={24} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div className="flex-grow overflow-y-auto p-4 md:p-6">
                    <ComparisonTable />
                </div>
            </div>
        </div>
    )
}
