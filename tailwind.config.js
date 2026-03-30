/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
      colors: {
        background: "#FFFFFF",
        foreground: "#000000",
        muted: "#F3F4F6", // gray-100
        mutedForeground: "#4B5563", // gray-600
        primary: "#000000",
        primaryForeground: "#FFFFFF",
        border: "#E5E7EB", // gray-200
        accent: "#2563EB", // blue-600 (used sparingly)
      }
    },
  },
  plugins: [],
}
