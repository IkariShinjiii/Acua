/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Soft warm cream/sand foundational canvas (Strictly NOT stark white)
        sand: {
          50: '#FAF6F0',   // Lightest warm ivory
          100: '#F6F1EB',  // Core page background canvas (from Figma mockup)
          200: '#EDE4D8',  // Soft surface layer
          300: '#E2D5C3',  // Subtle neutral tint
          400: '#C5B49D',  // Muted placeholder text
          500: '#A49077',  // Muted captions
        },
        // Deep, rich terracotta & burnt clay scale (Replaces washed-out orange)
        terracotta: {
          50: '#FAF0EB',
          100: '#F4DDD2',
          200: '#E5B7A0',
          300: '#D48C6B',
          400: '#BA532F',   // Vibrant warm clay
          500: '#9B3B1C',   // Core deep terracotta (primary brand accent)
          600: '#852E15',   // Rich burnt rust
          700: '#6F240E',   // Deepest earth tone
          800: '#551A09',
        },
        // Earthy secondary accents from the "Tierra Co" style board
        ochre: {
          DEFAULT: '#D48B47',
          light: '#E5AB6B',
          dark: '#B36D2E',
        },
        sage: {
          DEFAULT: '#8A8E75',
          light: '#A3A78C',
          dark: '#6E7259',
        },
        // High-contrast luxury espresso typography
        espresso: {
          DEFAULT: '#261C14', // Primary body & header text
          muted: '#625448',   // Secondary text
          light: '#857568',   // Captions & timestamps
        },
      },
      fontFamily: {
        serif: ['"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
      },
      borderRadius: {
        '2xl': '1rem',      // 16px
        '3xl': '1.5rem',    // 24px - standard card
        '4xl': '2rem',      // 32px - cloud card architecture
        '5xl': '2.5rem',    // 40px - hero & prominent containers
      },
      boxShadow: {
        // Exaggerated diffused "Cloud" shadows for borderless elevation
        'cloud-sm': '0 4px 20px -2px rgba(38, 28, 20, 0.04)',
        'cloud': '0 20px 60px -15px rgba(38, 28, 20, 0.06)',
        'cloud-lg': '0 30px 80px -20px rgba(38, 28, 20, 0.08)',
        'terracotta-glow': '0 15px 40px -10px rgba(155, 59, 28, 0.38)',
        'input-inset': 'inset 0 1px 2px rgba(38, 28, 20, 0.03)',
      },
      backgroundImage: {
        // Deep, rich terracotta gradient for buttons & hero accents
        'terracotta-gradient': 'linear-gradient(135deg, #BA532F 0%, #9B3B1C 50%, #7A2B12 100%)',
        'terracotta-subtle': 'linear-gradient(135deg, #FAF0EB 0%, #F5E1D5 100%)',
        // Subtle warm cloud card gradient fill
        'cloud-card': 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 246, 240, 0.85) 100%)',
        'sand-radial': 'radial-gradient(circle at 50% 0%, #FAF6F0 0%, #F6F1EB 100%)',
      },
    },
  },
  plugins: [],
}
