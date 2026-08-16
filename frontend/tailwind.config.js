/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        // "Late-night study lamp" palette — dark ink surfaces, warm amber glow
        ink: "#12141C", // primary background
        paper: "#1B1F2A", // card/surface background
        paperLight: "#242938", // elevated surface (hover, inputs)
        chalk: "#E8E6DF", // primary text (warm off-white, like chalk on a board)
        muted: "#8B90A0", // secondary text
        amber: {
          DEFAULT: "#F2A93B", // signature accent - lamp glow
          light: "#FFC670",
          dark: "#C6821F",
        },
        teal: {
          DEFAULT: "#4FD1C5", // resolved / success / verified
          dark: "#2CA89C",
        },
        coral: "#F2685C", // errors / urgent
        border: "#2C3244",
      },
      fontFamily: {
        display: ["Space Grotesk", "sans-serif"],
        body: ["Inter", "sans-serif"],
        mono: ["JetBrains Mono", "monospace"],
      },
      boxShadow: {
        glow: "0 0 24px rgba(242, 169, 59, 0.25)",
        card: "0 4px 20px rgba(0, 0, 0, 0.25)",
      },
      backgroundImage: {
        "lamp-radial": "radial-gradient(circle at top center, rgba(242,169,59,0.12), transparent 60%)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
};
