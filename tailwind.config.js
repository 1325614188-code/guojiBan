/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./App.tsx",
        "./index.tsx",
        "./views/**/*.{js,ts,jsx,tsx}",
        "./components/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                'brand': {
                    pink: '#ff4d6d',
                    rose: '#ff6b9d',
                    light: '#fff5f7',
                }
            }
        },
    },
    plugins: [],
}
