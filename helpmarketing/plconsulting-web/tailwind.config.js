/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        corporate: {
          blue:      '#0B1B3D',   // Deep Navy  — primary brand
          navy:      '#0F172A',   // Darker navy — hover states
          gold:      '#C5A059',   // Prestige Gold — accents & CTAs
          lightGold: '#E9C176',   // Gold hover
          bgGold:    '#EDE0C4',   // Subtle gold tint
          gray:      '#F7F9FB',   // Warm off-white background
          surface:   '#FFFFFF',   // Cards
          text:      '#191C1E',   // Primary text (dark)
          muted:     '#45464E',   // Body copy
          slate:     '#75777F',   // Tertiary / borders
          stroke:    '#C5C6CF',   // Default border/divider
        },
      },
      fontFamily: {
        // Headings — elegant, authoritative serif (Executive Precision)
        serif:  ['"Noto Serif"', '"Cormorant Garamond"', 'Georgia', 'serif'],
        // Body / UI — clean, modern sans
        sans:   ['"Work Sans"', '"DM Sans"', 'Inter', 'system-ui', 'sans-serif'],
        // Logo tagline — wide-spaced small caps feel
        display: ['"Noto Serif"', 'serif'],
      },
      letterSpacing: {
        widest2: '0.2em',
      },
      boxShadow: {
        'hard': '4px 4px 0px 0px rgba(11, 27, 61, 0.20)',
        'card': '0 1px 3px 0 rgba(0,0,0,0.08)',
      },
      borderRadius: {
        DEFAULT: '0px',
        none: '0px',
        sm: '0px',
        md: '2px',    // Barely-there radius for inputs only
        lg: '2px',
        xl: '2px',
        '2xl': '2px',
        full: '9999px',
      },
    },
  },
  plugins: [],
}
