/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        "./src/**/*.{js,jsx,ts,tsx}",
        "./public/index.html"
    ],
    theme: {
        extend: {
            colors: {
                sidebar: {
                    bg: '#1e1e1e',
                    hover: '#2d2d30',
                    active: '#007acc',
                    border: '#3e3e42'
                },
                chat: {
                    sent: '#007acc',
                    received: '#2d2d30',
                    system: '#4a4a4a'
                }
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
    darkMode: 'class'
}