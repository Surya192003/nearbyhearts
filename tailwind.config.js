/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: { nav: '800px' },
      colors: {
        // High-end warm cream canvas base
        canvas: '#fdfbf7', 
        cream: '#faf2e3',
        surface: '#ffffff',
        // Deep Indigo Blue (Western Professional meets Traditional Indian Indigo Dye)
        primary: { DEFAULT: '#1a2e40', soft: '#e8eff5', strong: '#0f1c28' },
        // Warm Terracotta / Marigold Accent
        accent: { DEFAULT: '#d47a55', soft: '#fcf0ea', strong: '#b05934' },
        // Deep Royal Garnet / Vermillion Accent
        rose: { DEFAULT: '#8c2d38', soft: '#f6ebec', strong: '#641d24' },
        // Clean high-contrast typography colors
        ink: '#22262a',
        muted: '#656e77',
        line: '#eaeaee',
      },
      fontFamily: {
        serif: ['"Federo"', 'Georgia', 'serif'],
        script: ['"Great Vibes"', '"Snell Roundhand"', 'cursive'],
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      borderRadius: { field: '6px', card: '16px', pill: '999px' }, // Slightly sharper for modern professionalism
      boxShadow: {
        soft: '0 2px 8px rgba(26,46,64,0.04)',
        lift: '0 16px 40px -20px rgba(26,46,64,0.18)',
      },
      backgroundImage: {
        brand: 'linear-gradient(135deg, #1a2e40, #d47a55)',
        'rule-gold': 'linear-gradient(90deg, transparent, #d47a55, transparent)',
      },
    },
  },
  plugins: [],
}
