/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    darkMode: ['class', '[data-theme="dark"]'],
    theme: {
        extend: {
            colors: {
                primary: {
                    DEFAULT: 'var(--color-primary)',
                    hover: 'var(--color-primary-hover)',
                    dark: 'var(--color-primary-dark)',
                    light: 'var(--color-primary)', // Accessing light var if needed or same
                },
                secondary: {
                    DEFAULT: 'var(--color-secondary)',
                },
                accent: {
                    DEFAULT: 'var(--color-accent)',
                    teal: '#14b8a6', // Keep for backward compat if needed
                    pink: '#ec4899',
                    orange: '#f97316',
                },
                background: {
                    DEFAULT: 'var(--color-bg)',
                    secondary: 'var(--color-surface)',
                    tertiary: 'var(--color-surface-hover)',
                },
                surface: {
                    DEFAULT: 'var(--color-surface)',
                    light: 'var(--color-surface-hover)',
                    lighter: 'var(--color-border)', // Approx
                    dark: 'var(--color-bg)',
                },
                text: {
                    primary: 'var(--color-text-primary)',
                    secondary: 'var(--color-text-secondary)',
                    tertiary: 'var(--color-text-tertiary)',
                    muted: 'var(--color-text-tertiary)',
                },
                border: {
                    DEFAULT: 'var(--color-border)',
                },
                success: 'var(--color-success)',
                warning: 'var(--color-warning)',
                error: 'var(--color-error)',
                info: 'var(--color-info)',
            },
            fontFamily: {
                sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
                mono: ['var(--font-mono)', 'monospace'],
            },
            borderRadius: {
                sm: 'var(--radius-sm)',
                md: 'var(--radius-md)',
                lg: 'var(--radius-lg)',
                full: 'var(--radius-full)',
            },
            boxShadow: {
                xs: 'var(--shadow-xs)',
                sm: 'var(--shadow-sm)',
                md: 'var(--shadow-md)',
                lg: 'var(--shadow-lg)',
                xl: 'var(--shadow-xl)',
            },
        },
    },
    plugins: [],
}