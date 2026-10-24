/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      screens: { nav: '800px' },
      colors: {
        canvas: '#fbfaf7',
        cream: '#f5ecd8',
        surface: '#ffffff',
        primary: { DEFAULT: '#00271e', soft: '#e8efe9', strong: '#001a14' },
        accent: { DEFAULT: '#c8a563', soft: '#f6edd8', strong: '#a88748' },
        rose: { DEFAULT: '#762f3b', soft: '#f5e6e9', strong: '#5a2028' },
        ink: '#292a24',
        muted: '#6b6540',
        line: '#e6e3dc',
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'Georgia', 'serif'],
        script: ['"Great Vibes"', '"Snell Roundhand"', 'cursive'],
        sans: ['Arial', 'Helvetica', 'sans-serif'],
      },
      borderRadius: { field: '8px', card: '20px', pill: '999px' },
      boxShadow: {
        soft: '0 1px 2px rgba(41,42,36,0.04)',
        lift: '0 12px 32px -18px rgba(0,39,30,0.28)',
      },
      backgroundImage: {
        brand: 'linear-gradient(90deg, #00271e, #a88748)',
        'rule-gold': 'linear-gradient(90deg, transparent, #c8a563, transparent)',
      },
    },
  },
  plugins: [],
}