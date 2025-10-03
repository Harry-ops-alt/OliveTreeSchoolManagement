const baseColors = {
  primary: {
    DEFAULT: "#14532d",
    foreground: "#ffffff",
  },
  secondary: {
    DEFAULT: "#0f172a",
    foreground: "#e2e8f0",
  },
  accent: {
    DEFAULT: "#f97316",
    foreground: "#111827",
  },
  muted: {
    DEFAULT: "#f1f5f9",
    foreground: "#1e293b",
  },
};

/** @type {import('tailwindcss').Config} */
module.exports = {
  theme: {
    extend: {
      colors: {
        ...baseColors,
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      borderRadius: {
        xl: "1rem",
      },
      fontFamily: {
        sans: ["var(--font-geist-sans)", "sans-serif"],
        mono: ["var(--font-geist-mono)", "monospace"],
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
