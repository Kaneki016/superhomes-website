import React from 'react'

interface PageBannerProps {
    title: string
    subtitle?: string
    backgroundImage?: string
}

export default function PageBanner({
    title,
    subtitle,
    backgroundImage = 'https://images.unsplash.com/photo-1564013799919-ab600027ffc6?auto=format&fit=crop&w=2000&q=80'
}: PageBannerProps) {
    return (
        <div className="relative h-64 md:h-80 w-full overflow-hidden">
            {/* Background Image */}
            <div
                className="absolute inset-0 bg-cover bg-center bg-no-repeat transition-transform duration-700 hover:scale-105"
                style={{ backgroundImage: `url(${backgroundImage})` }}
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/40 bg-gradient-to-t from-black/60 to-transparent" />

            {/* Content */}
            <div className="relative h-full container-custom flex flex-col justify-center items-center text-center text-white z-10">
                <h1 className="font-heading font-bold text-3xl md:text-4xl lg:text-5xl mb-4 drop-shadow-md animate-fade-in-up">
                    {title}
                </h1>
                {subtitle && (
                    <p className="text-lg md:text-xl font-medium text-white/90 max-w-2xl drop-shadow-sm animate-fade-in-up delay-100">
                        {subtitle}
                    </p>
                )}
            </div>
        </div>
    )
}
