import { heroui } from "@heroui/react";

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "./node_modules/@heroui/theme/dist/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
    },
  },
  darkMode: "class",
  plugins: [
    heroui({
      themes: {
        dark: {
          colors: {
            background: "#090d16",
            foreground: "#f3f4f6",
            primary: {
              DEFAULT: "#6366f1",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#a855f7",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#10b981",
              foreground: "#ffffff",
            },
          },
        },
        light: {
          colors: {
            background: "#f8fafc",
            foreground: "#0f172a",
            primary: {
              DEFAULT: "#4f46e5",
              foreground: "#ffffff",
            },
            secondary: {
              DEFAULT: "#9333ea",
              foreground: "#ffffff",
            },
            success: {
              DEFAULT: "#059669",
              foreground: "#ffffff",
            },
          },
        },
      },
    }),
  ],
};
