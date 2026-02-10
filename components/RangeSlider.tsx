'use client'

import React, { useState, useEffect, useRef, useCallback } from 'react'
import { trackDrag } from '@/lib/gtag'

interface RangeSliderProps {
    min: number
    max: number
    step?: number
    value: [number, number]
    onChange: (value: [number, number]) => void
    className?: string
}

export default function RangeSlider({
    min,
    max,
    step = 1,
    value,
    onChange,
    className = ''
}: RangeSliderProps) {
    const [isDragging, setIsDragging] = useState<'min' | 'max' | null>(null)
    const sliderRef = useRef<HTMLDivElement>(null)

    // Convert value to percentage
    const getPercent = useCallback((val: number) => {
        return Math.round(((val - min) / (max - min)) * 100)
    }, [min, max])

    const handleMouseDown = (event: React.MouseEvent, thumb: 'min' | 'max') => {
        event.preventDefault()
        setIsDragging(thumb)
    }

    const handleTouchStart = (event: React.TouchEvent, thumb: 'min' | 'max') => {
        setIsDragging(thumb)
    }

    useEffect(() => {
        const handleMove = (clientX: number) => {
            if (!isDragging || !sliderRef.current) return

            const sliderRect = sliderRef.current.getBoundingClientRect()
            const width = sliderRect.width
            const percent = Math.min(Math.max((clientX - sliderRect.left) / width, 0), 1)

            let newValue = Math.round(min + percent * (max - min))

            // Apply step
            if (step > 1) {
                newValue = Math.round(newValue / step) * step
            }

            // Clamp and prevent crossing
            if (isDragging === 'min') {
                newValue = Math.min(Math.max(newValue, min), value[1] - step)
                onChange([newValue, value[1]])
            } else {
                newValue = Math.max(Math.min(newValue, max), value[0] + step)
                onChange([value[0], newValue])
            }
        }

        const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX)
        const handleTouchMove = (e: TouchEvent) => handleMove(e.touches[0].clientX)

        const handleEnd = () => {
            if (isDragging) {
                // Tracking the end of a drag event
                trackDrag('Price Range Slider', isDragging === 'min' ? value[0].toString() : value[1].toString(), 'Filter')
            }
            setIsDragging(null)
        }

        if (isDragging) {
            document.addEventListener('mousemove', handleMouseMove)
            document.addEventListener('mouseup', handleEnd)
            document.addEventListener('touchmove', handleTouchMove)
            document.addEventListener('touchend', handleEnd)
        }

        return () => {
            document.removeEventListener('mousemove', handleMouseMove)
            document.removeEventListener('mouseup', handleEnd)
            document.removeEventListener('touchmove', handleTouchMove)
            document.removeEventListener('touchend', handleEnd)
        }
    }, [isDragging, min, max, step, value, onChange])

    const minPercent = getPercent(value[0])
    const maxPercent = getPercent(value[1])

    return (
        <div className={`relative h-6 flex items-center select-none ${className}`}>
            <div ref={sliderRef} className="relative w-full h-1.5 bg-gray-200 rounded-full">
                {/* Active Range Track */}
                <div
                    className="absolute h-full bg-primary-500 rounded-full"
                    style={{
                        left: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`
                    }}
                />

                {/* Min Thumb */}
                <div
                    className="absolute w-5 h-5 bg-white border-2 border-primary-500 rounded-full shadow cursor-grab active:cursor-grabbing top-1/2 -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform z-10"
                    style={{ left: `${minPercent}%` }}
                    onMouseDown={(e) => handleMouseDown(e, 'min')}
                    onTouchStart={(e) => handleTouchStart(e, 'min')}
                />

                {/* Max Thumb */}
                <div
                    className="absolute w-5 h-5 bg-white border-2 border-primary-500 rounded-full shadow cursor-grab active:cursor-grabbing top-1/2 -translate-x-1/2 -translate-y-1/2 hover:scale-110 transition-transform z-10"
                    style={{ left: `${maxPercent}%` }}
                    onMouseDown={(e) => handleMouseDown(e, 'max')}
                    onTouchStart={(e) => handleTouchStart(e, 'max')}
                />
            </div>
        </div>
    )
}
