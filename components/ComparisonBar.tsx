import { ArrowRight, X, Scale } from 'lucide-react'

interface ComparisonBarProps {
    count: number
    onCompare: () => void
    onClear: () => void
}

export default function ComparisonBar({ count, onCompare, onClear }: ComparisonBarProps) {
    if (count === 0) return null

    return (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[2500] animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="bg-gray-900 text-white rounded-full shadow-2xl px-6 py-3 flex items-center gap-6 border border-gray-700">
                <div className="flex items-center gap-3">
                    <div className="bg-primary-600 text-white w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm">
                        {count}
                    </div>
                    <span className="font-medium text-sm">Properties Selected</span>
                </div>

                <div className="h-6 w-px bg-gray-700"></div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={onClear}
                        className="text-gray-400 hover:text-white text-sm font-medium transition-colors"
                    >
                        Clear
                    </button>
                    <button
                        onClick={onCompare}
                        className="bg-white text-gray-900 px-4 py-2 rounded-full text-sm font-bold hover:bg-gray-100 transition-colors flex items-center gap-2 active:scale-95"
                    >
                        <Scale size={16} />
                        Compare
                    </button>
                </div>
            </div>
        </div>
    )
}
