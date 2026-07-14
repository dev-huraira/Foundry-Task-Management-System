/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        foundry: {
          sidebar: '#181A1C',      // Deeper graphite sidebar
          bg: '#F9F8F6',           // Extremely clean, modern off-white background
          surface: '#FFFFFF',      // Pure white card/sheet surfaces for maximum contrast
          border: '#E4E2DC',       // Modern thin border
          borderLight: '#F1EFEA',  // Lighter grid separator border
          text: '#1C1E21',         // High contrast graphite text
          textMuted: '#686D73',    // Modern neutral muted text
          
          // Accent colors specified in instructions (made slightly more vibrant and refined)
          steel: '#2A4D6C',        // Refined steel-blue for primary states
          amber: '#D27C2D',        // Refined amber for in-progress
          sage: '#4D6B53',         // Clean sage-green for done
          rust: '#C0432E',         // Clean rust-red for high priority
          low: '#808790',          // Refined low priority
          medium: '#B88B42',       // Refined medium priority
        }
      },
      fontFamily: {
        sans: ['"Inter"', '"IBM Plex Sans"', 'sans-serif'],
        mono: ['"SF Mono"', '"IBM Plex Mono"', 'Courier New', 'monospace'],
      },
      boxShadow: {
        'foundry-sm': '0 1px 2px 0 rgba(0, 0, 0, 0.03)',
        'foundry-md': '0 4px 12px -2px rgba(28, 30, 33, 0.05), 0 2px 6px -1px rgba(28, 30, 33, 0.03)',
        'foundry-lg': '0 12px 24px -4px rgba(28, 30, 33, 0.08), 0 4px 12px -2px rgba(28, 30, 33, 0.04)',
      }
    },
  },
  plugins: [],
}
