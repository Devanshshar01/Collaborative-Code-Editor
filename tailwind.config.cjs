/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            colors: {
                background: {
                    DEFAULT: '#0f1117',
                    secondary: '#161b22',
                    tertiary: '#21262d',
                },
                primary: {
                    DEFAULT: '#3b82f6', // Bright Blue
                    hover: '#2563eb',
                    light: '#60a5fa',
                },
                secondary: {
                    DEFAULT: '#8b5cf6', // Violet
                    hover: '#7c3aed',
                },
                accent: {
                    teal: '#14b8a6',
                    pink: '#ec4899',
                    orange: '#f97316',
                },
                surface: {
                    DEFAULT: '#1e293b',
                    light: '#334155',
                    lighter: '#475569',
                },
                border: {
                    DEFAULT: '#30363d',
                    light: '#4b5563',
                },
                text: {
                    primary: '#f1f5f9',
                    secondary: '#94a3b8',
                    muted: '#64748b',
                }
            },
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
            },
            boxShadow: {
                'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.37)',
                'glow': '0 0 15px rgba(59, 130, 246, 0.5)',
            },
            animation: {
                'fade-in': 'fadeIn 0.3s ease-out',
                'slide-up': 'slideUp 0.4s ease-out',
                'pulse-slow': 'pulse 3s infinite',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(20px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                }
            }
        },
    },
    plugins: [],
    darkMode: 'class'
}