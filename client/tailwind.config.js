/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "sans-serif"],
        mono: ["JetBrains Mono", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        canvas: "#F7F6F3",
        surface: "#FFFFFF",
        ink: {
          DEFAULT: "#1C1B1A",
          muted: "#6B6862",
          faint: "#A9A69F",
        },
        line: "#E7E5E1",
        brand: {
          50: "#EEF3F1",
          100: "#DCE7E2",
          200: "#C1D6CD",
          300: "#9BBFB1",
          400: "#4B8677",
          500: "#3F7566",
          600: "#2F5D50",
          700: "#254A40",
        },
        amber: {
          50: "#FFF7ED",
          600: "#B45309",
        },
        good: {
          50: "#F0FDF4",
          600: "#15803D",
        },
        bad: {
          50: "#FEF2F2",
          600: "#B91C1C",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(28,27,26,0.04), 0 1px 8px rgba(28,27,26,0.04)",
        popover: "0 4px 16px rgba(28,27,26,0.10), 0 1px 4px rgba(28,27,26,0.06)",
      },
      borderRadius: {
        md: "10px",
        lg: "14px",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(4px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.15s ease-out",
      },
    },
  },
  plugins: [],
};
