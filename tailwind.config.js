/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: ["class"],
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          bg: "#0D0F1A",        // Fondo ultra oscuro
          card: "#161926",      // Tarjetas
          primary: "#5D2EEF",   // Violeta principal
          secondary: "#2E3145", // Botones secundarios
          accent: "#00FAD9",    // Turquesa acento
          success: "#10B981",   // Verde totales
          danger: "#FF4E4E",    // Rojo borrar
          muted: "#8E94AF",     // Texto secundario
        },
      },
      borderRadius: {
        '2xl': '1.25rem',
        '3xl': '1.75rem',
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      fontSize: {
        // Tipografía fluida: clamp(min, preferred, max)
        'fluid-xs': 'clamp(0.65rem, 2vw, 0.75rem)',
        'fluid-sm': 'clamp(0.8rem, 2.5vw, 0.9rem)',
        'fluid-base': 'clamp(0.9rem, 3vw, 1rem)',
        'fluid-lg': 'clamp(1.1rem, 4vw, 1.3rem)',
        'fluid-xl': 'clamp(1.5rem, 6vw, 2rem)',
        'fluid-2xl': 'clamp(2rem, 9vw, 3.5rem)',
      },
      animation: {
        "slide-in-bottom": "slide-in-bottom 0.4s cubic-bezier(0.16, 1, 0.3, 1)",
        "fade-in": "fade-in 0.3s ease-in",
        "scale-up": "scale-up 0.2s ease-out",
      },
      keyframes: {
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)", opacity: "0" },
          "100%": { transform: "translateY(0)", opacity: "1" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "scale-up": {
          "0%": { transform: "scale(0.95)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        }
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}