import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: 'class',
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--color-bg)",
        foreground: "var(--color-text)",
        primary: {
          DEFAULT: "#00C896",
          dark: "#009970",
          light: "#00E8AE",
        },
        secondary: {
          DEFAULT: "#F5A623",
          dark: "#D4891A",
          light: "#FFD166",
        },
        surface: {
          DEFAULT: "#1A2E4A",
          dark: "#0F1E30",
        },
        navy: "#080F1E",
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      backdropBlur: {
        xs: '4px',
      },
    },
  },
  plugins: [],
};
export default config;
