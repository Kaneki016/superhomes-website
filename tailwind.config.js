/** @type {import('tailwindcss').Config} */
module.exports = {
    darkMode: 'class',
    content: [
        './pages/**/*.{js,ts,jsx,tsx,mdx}',
        './components/**/*.{js,ts,jsx,tsx,mdx}',
        './app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            colors: {
                primary: {
                    50: '#fff1f4',
                    100: '#ffe4e9',
                    200: '#ffcdd8',
                    300: '#ffa3b8',
                    400: '#ff6b9d',
                    500: '#ff3d7f',
                    600: '#ed1461',
                    700: '#c44569',
                    800: '#a31d4d',
                    900: '#8a1b44',
                },
                accent: {
                    50: '#f0fdf6',
                    100: '#dcfce9',
                    200: '#bbf7d3',
                    300: '#a8e6cf',
                    400: '#6ee7b7',
                    500: '#34d399',
                    600: '#10b981',
                    700: '#059669',
                    800: '#047857',
                    900: '#065f46',
                },
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                heading: ['Poppins', 'system-ui', 'sans-serif'],
            },
            backgroundImage: {
                'gradient-primary': 'linear-gradient(135deg, #FF6B9D 0%, #C44569 100%)',
                'gradient-accent': 'linear-gradient(135deg, #A8E6CF 0%, #6ee7b7 100%)',
            },
            animation: {
                'shimmer': 'shimmer 2s infinite linear',
            },
            keyframes: {
                shimmer: {
                    '0%': { backgroundPosition: '200% 0' },
                    '100%': { backgroundPosition: '-200% 0' },
                },
            },
        },
    },
    plugins: [
        require('@tailwindcss/typography'),
    ],
}
