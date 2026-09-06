/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#351226",
        brand: {
          berry: "#9D174D",
          raspberry: "#E31E64",
        },
        rose: {
          50: "#FFF5F8",
          100: "#FCE7EF",
        },
        surface: "#FFFFFF",
        border: "#F1D7E1",
        status: {
          success: "#179B73",
          info: "#2769D7",
          warning: "#D98900",
          danger: "#D63B4D",
          neutral: "#667085",
        }
      },
      fontFamily: {
        sans: ["Manrope", "Inter", "ui-sans-serif", "system-ui", "sans-serif"],
        mono: ["'DM Mono'", "ui-monospace", "monospace"],
      },
      borderRadius: {
        DEFAULT: "12px",
        card: "12px",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgba(53, 18, 38, 0.05), 0 1px 2px -1px rgba(53, 18, 38, 0.05)",
        overlay: "0 10px 25px -5px rgba(53, 18, 38, 0.1), 0 8px 10px -6px rgba(53, 18, 38, 0.1)",
      }
    },
  },
  plugins: [],
}
