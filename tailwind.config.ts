import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "Georgia", "serif"],
      },
      colors: {
        paper: {
          DEFAULT: "#f6f2ea",
          100: "#faf8f2",
          200: "#efe9dd",
          300: "#e5ddcd",
        },
        ink: {
          DEFAULT: "#1c1a16",
          900: "#26231d",
          700: "#4a453c",
          muted: "#6f695d",
        },
        sage: {
          DEFAULT: "#5c7a68",
          dark: "#47604f",
          light: "#8fa998",
        },
      },
      backgroundImage: {
        "grid-faint":
          "linear-gradient(to right, rgba(255,255,255,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.05) 1px, transparent 1px)",
      },
      keyframes: {
        float: {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-14px)" },
        },
        floatSlow: {
          "0%,100%": { transform: "translateY(0) translateX(0)" },
          "50%": { transform: "translateY(18px) translateX(8px)" },
        },
        auroraMove: {
          "0%": { transform: "translate(0,0) scale(1)" },
          "50%": { transform: "translate(40px,-30px) scale(1.15)" },
          "100%": { transform: "translate(0,0) scale(1)" },
        },
        marquee: {
          from: { transform: "translateX(0)" },
          to: { transform: "translateX(-50%)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        scan: {
          "0%": { top: "-10%", opacity: "0" },
          "20%": { opacity: "1" },
          "80%": { opacity: "1" },
          "100%": { top: "110%", opacity: "0" },
        },
        gradientMove: {
          "0%,100%": { backgroundPosition: "0% 50%" },
          "50%": { backgroundPosition: "100% 50%" },
        },
        spinSlow: {
          to: { transform: "rotate(360deg)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        floatSlow: "floatSlow 9s ease-in-out infinite",
        aurora: "auroraMove 18s ease-in-out infinite",
        marquee: "marquee 32s linear infinite",
        shimmer: "shimmer 2.5s ease-in-out infinite",
        scan: "scan 3.4s ease-in-out infinite",
        gradient: "gradientMove 8s ease infinite",
        spinSlow: "spinSlow 22s linear infinite",
      },
    },
  },
  plugins: [],
};

export default config;
