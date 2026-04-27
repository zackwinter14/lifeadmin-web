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
          DEFAULT: "#3EA758",
          light: "#5dd377",
          dark: "#2e7d40",
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
        "brand-gradient": "linear-gradient(135deg, #3EA758, #5dd377)",
      },
    },
  },
  plugins: [],
};

export default config;
