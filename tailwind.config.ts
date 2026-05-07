import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
      },
      keyframes: {
        "fade-in": { from: { opacity: "0" }, to: { opacity: "1" } },
        "zoom-in-95": { from: { transform: "scale(0.95)" }, to: { transform: "scale(1)" } },
        "zoom-out-95": { from: { transform: "scale(1)" }, to: { transform: "scale(0.95)" } },
        "slide-in-from-left-1/2": { from: { transform: "translateX(-50%)" }, to: { transform: "translateX(-50%)" } },
        "slide-in-from-top-48": { from: { transform: "translate(-50%, -52%)" }, to: { transform: "translate(-50%, -50%)" } },
      },
      animation: {
        "in": "fade-in 150ms ease",
        "out": "fade-in 150ms ease reverse",
      },
    },
  },
  plugins: [],
};
export default config;
