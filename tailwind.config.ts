import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "rgb(var(--brand-rgb) / <alpha-value>)",
          light:   "rgb(var(--brand-light-rgb) / <alpha-value>)",
          dark:    "rgb(var(--brand-dark-rgb) / <alpha-value>)",
        },
        bg: {
          DEFAULT: "#0a0a0a",
          card: "#141414",
          border: "#222",
        },
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "Segoe UI", "Inter", "sans-serif"],
      },
      backgroundImage: {
        "brand-gradient": "var(--brand-gradient)",
      },
    },
  },
  plugins: [],
};

export default config;
