import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "#F7F7F5",
        foreground: "#111111",
        card: {
          DEFAULT: "#FFFFFF",
          foreground: "#111111",
        },
        popover: {
          DEFAULT: "#FFFFFF",
          foreground: "#111111",
        },
        primary: {
          DEFAULT: "#111111",
          foreground: "#FFFFFF",
        },
        secondary: {
          DEFAULT: "#EFEFED",
          foreground: "#111111",
        },
        muted: {
          DEFAULT: "#ECECE9",
          foreground: "#666666",
        },
        accent: {
          DEFAULT: "#FF5A36",
          foreground: "#FFFFFF",
          hover: "#E04826",
        },
        destructive: {
          DEFAULT: "#E5484D",
          foreground: "#FFFFFF",
        },
        success: {
          DEFAULT: "#18A66A",
          foreground: "#FFFFFF",
        },
        warning: {
          DEFAULT: "#F2A900",
          foreground: "#111111",
        },
        border: "#E2E2DF",
        input: "#E2E2DF",
        ring: "#111111",
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
        mono: ["JetBrains Mono", "Menlo", "Monaco", "Consolas", "monospace"],
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
        card: "0 1px 3px 0 rgba(0, 0, 0, 0.06), 0 1px 2px -1px rgba(0, 0, 0, 0.06)",
        float: "0 10px 25px -5px rgba(0, 0, 0, 0.08), 0 8px 10px -6px rgba(0, 0, 0, 0.04)",
      },
    },
  },
  plugins: [],
};

export default config;
