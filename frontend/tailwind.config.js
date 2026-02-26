/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: "#256AF4",
          foreground: "#ffffff",
          light: "#60A5FA",
          dark: "#012254",
        },
        secondary: {
          DEFAULT: "#FF7CE9",
          foreground: "#000000",
          light: "#FFB7F3",
          dark: "#FF7CE9",
        },
        accent: {
          DEFAULT: "#60A5FA",
          foreground: "#000000",
          light: "#FFB7F3",
          dark: "#256AF4",
        },
        darkblue: {
          DEFAULT: "#012254",
          light: "#256AF4",
          dark: "#000000",
        },
      },
      boxShadow: {
        glow: "0 0 10px 2px rgba(37, 106, 244, 0.7)",
        header: "0 4px 6px -1px rgba(1, 34, 84, 0.3)",
        "button-glow": "0 0 15px rgba(37, 106, 244, 0.5)",
        "button-glow-secondary": "0 0 15px rgba(255, 124, 233, 0.5)",
      },
    },
  },
  plugins: [],
};
