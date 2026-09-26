/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        // Theme-aware neutrals: values live in CSS variables (src/index.css,
        // :root vs .dark) so light/dark mode is one class toggle instead of
        // a `dark:` variant on every one of the ~350 places these are used.
        // Most brand accents (terracota/olive/sunset) stay flat hex — brand
        // identity, not surface/text neutrals, and used as backgrounds or
        // large/graphical elements where they read fine unchanged. `accent`
        // is the one exception: it's chile-rojo used as small foreground
        // text/icons (error banners, links, active states), which needs a
        // brighter dark-mode value or it nearly disappears against a near-
        // black page — see the CSS variable comments for the contrast math.
        "on-surface": "rgb(var(--color-on-surface) / <alpha-value>)",
        "on-surface-variant": "rgb(var(--color-on-surface-variant) / <alpha-value>)",
        "surface-elevated": "rgb(var(--color-surface-elevated) / <alpha-value>)",
        "surface-container-low": "rgb(var(--color-surface-container-low) / <alpha-value>)",
        "surface-container": "rgb(var(--color-surface-container) / <alpha-value>)",
        "surface-container-high": "rgb(var(--color-surface-container-high) / <alpha-value>)",
        "outline-variant": "rgb(var(--color-outline-variant) / <alpha-value>)",
        "accent": "rgb(var(--color-accent) / <alpha-value>)",
        // Fixed, theme-invariant near-black — for scrims that darken a
        // *photograph* (hero gradient, "Sold Out" badge overlays) rather
        // than a page surface. These must never invert with the theme, or
        // dark mode turns them into a wash of near-white light over the
        // photo instead of a darkening scrim.
        "ink": "#1d1c16",

        // Design Token Colors
        "on-error-container": "#93000a",
        "on-secondary-fixed": "#2d1600",
        "primary-fixed-dim": "#ffb59e",
        "on-tertiary-fixed-variant": "#494a00",
        "on-error": "#ffffff",
        "surface-container-highest": "#e7e2d9",
        "secondary-fixed": "#ffdcc0",
        "tertiary-container": "#8a8b35",
        "inverse-surface": "#32302a",
        "primary-fixed": "#ffdbd0",
        "on-background": "#1d1c16",
        "surface-bright": "#fef9f0",
        "tertiary": "#8a8b35",
        "surface-dim": "#ded9d1",
        "primary": "#ae431e",
        "on-primary-fixed-variant": "#842501",
        "surface-variant": "#e7e2d9",
        "secondary-container": "#d68224",
        "secondary-fixed-dim": "#ffb875",
        "on-tertiary-container": "#ffffff",
        "on-secondary-container": "#ffffff",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed": "#3a0b00",
        "on-tertiary-fixed": "#1c1d00",
        "tertiary-fixed": "#e7e887",
        "inverse-on-surface": "#f5f0e7",
        "on-primary-container": "#ffdcd2",
        "inverse-primary": "#ffb59e",
        "on-primary": "#ffffff",
        "surface-tint": "#ae431e",
        "outline": "#8b716a",
        "surface": "#fef9f0",
        "on-tertiary": "#ffffff",
        "on-secondary-fixed-variant": "#6b3b00",
        "tertiary-fixed-dim": "#cbcb6e",
        "secondary": "#d68224",
        "on-secondary": "#ffffff",
        "error-container": "#ffdad6",
        "primary-container": "#ae431e",
        "background": "#fef9f0",
        "error": "#ba1a1a",
        "chile-rojo": "#ae431e",
        "terracota": "#d68224",
        // Same hue, deep enough for body-size text on the light cream/white
        // surfaces (4.9:1 / 5.3:1; plain terracota is ~2.8:1, below WCAG
        // AA's 4.5:1). Used for prices in light mode, `dark:text-terracota`.
        "terracota-deep": "#9a5e1a",
        "olive": "#8a8b35",
        "sunset": "#eac891",
        "gradient-primary-start": "#ae431e",
        "gradient-primary-end": "#d68224",

        // Original Sand & Terracotta Palette
        sand: {
          DEFAULT: "rgb(var(--color-sand) / <alpha-value>)",
          50: '#FAF6F0',
          100: '#F6F1EB',
          200: '#EDE4D8',
          300: '#E2D5C3',
          400: '#C5B49D',
          500: '#A49077',
        },
        terracotta: {
          50: '#FAF0EB',
          100: '#F4DDD2',
          200: '#E5B7A0',
          300: '#D48C6B',
          400: '#BA532F',
          500: '#9B3B1C',
          600: '#852E15',
          700: '#6F240E',
          800: '#551A09',
        },
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
        espresso: {
          DEFAULT: '#261C14',
          muted: '#625448',
          light: '#857568',
        },
      },
      spacing: {
        "margin-desktop": "64px",
        "margin-mobile": "20px",
        "container-max": "1280px",
        "gutter": "24px",
        "unit": "8px",
      },
      fontFamily: {
        "body-md": ["Manrope", "sans-serif"],
        "display-lg": ['"Libre Caslon Text"', "serif"],
        "body-lg": ["Manrope", "sans-serif"],
        "headline-lg-mobile": ['"Libre Caslon Text"', "serif"],
        "label-md": ["Manrope", "sans-serif"],
        "label-caps": ["Manrope", "sans-serif"],
        "label-sm": ["Manrope", "sans-serif"],
        "headline-sm": ['"Libre Caslon Text"', "serif"],
        "display-lg-mobile": ['"Libre Caslon Text"', "serif"],
        "headline-md": ['"Libre Caslon Text"', "serif"],
        "headline-lg": ['"Libre Caslon Text"', "serif"],
        serif: ['Fraunces', '"Libre Caslon Text"', '"Playfair Display"', 'Cormorant Garamond', 'Georgia', 'serif'],
        sans: ['Inter', 'Manrope', 'system-ui', '-apple-system', 'sans-serif'],
        // Matches the actual logo artwork's "ACUA" lettering — a flat-
        // topped, cut-terminal geometric sans, confirmed by rendering
        // several Google Fonts candidates side by side against the real
        // logo photo (Unica One was the clear closest match; standard
        // pointed-apex geometric sans like Montserrat/Poppins don't have
        // this font's distinctive flat A). Scoped to just the standalone
        // wordmark next to the icon (Navbar, splash screen), not the
        // site's general serif heading font used everywhere else.
        wordmark: ['"Unica One"', 'sans-serif'],
      },
      fontSize: {
        "body-md": ["16px", { lineHeight: "24px", fontWeight: "400" }],
        "display-lg": ["64px", { lineHeight: "72px", letterSpacing: "-0.02em", fontWeight: "400" }],
        "body-lg": ["18px", { lineHeight: "28px", fontWeight: "400" }],
        "headline-lg-mobile": ["32px", { lineHeight: "40px", fontWeight: "400" }],
        "label-md": ["14px", { lineHeight: "20px", letterSpacing: "0.05em", fontWeight: "600" }],
        "label-caps": ["12px", { lineHeight: "16px", letterSpacing: "0.1em", fontWeight: "600" }],
        "label-sm": ["11px", { lineHeight: "14px", fontWeight: "500" }],
        "headline-sm": ["24px", { lineHeight: "32px", fontWeight: "500" }],
        "display-lg-mobile": ["40px", { lineHeight: "48px", letterSpacing: "-0.01em", fontWeight: "400" }],
        "headline-md": ["32px", { lineHeight: "40px", fontWeight: "400" }],
        "headline-lg": ["48px", { lineHeight: "56px", fontWeight: "400" }],
      },
      boxShadow: {
        "soft-ambient": "0px 10px 30px rgba(174, 67, 30, 0.08)",
        "soft-ambient-hover": "0px 20px 40px rgba(174, 67, 30, 0.14)",
        'cloud-sm': '0 4px 20px -2px rgba(38, 28, 20, 0.04)',
        'cloud': '0 20px 60px -15px rgba(38, 28, 20, 0.06)',
        'cloud-lg': '0 30px 80px -20px rgba(38, 28, 20, 0.08)',
        'terracotta-glow': '0 15px 40px -10px rgba(155, 59, 28, 0.38)',
        'input-inset': 'inset 0 1px 2px rgba(38, 28, 20, 0.03)',
      },
      backgroundImage: {
        'terracotta-gradient': 'linear-gradient(135deg, #BA532F 0%, #9B3B1C 50%, #7A2B12 100%)',
        'terracotta-subtle': 'linear-gradient(135deg, #FAF0EB 0%, #F5E1D5 100%)',
        'cloud-card': 'linear-gradient(180deg, rgba(255, 255, 255, 0.95) 0%, rgba(250, 246, 240, 0.85) 100%)',
        'sand-radial': 'radial-gradient(circle at 50% 0%, #FAF6F0 0%, #F6F1EB 100%)',
      },
    },
  },
  plugins: [],
}
