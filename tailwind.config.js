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
          bg: "#0D0F1A",        // Fondo ultra oscuro de las fotos
          card: "#161926",      // Color de las tarjetas
          primary: "#5D2EEF",   // Violeta principal
          secondary: "#2E3145", // Botones secundarios
          accent: "#00FAD9",    // Turquesa de acento
          success: "#10B981",   // Verde para totales
          danger: "#FF4E4E",    // Rojo para borrar
          muted: "#8E94AF",     // Texto secundario
        },
      },
      borderRadius: {
        '4xl': '2rem',
        '5xl': '2.5rem',
      },
      animation: {
        "slide-in-bottom": "slide-in-bottom 0.4s ease-out",
        "fade-in": "fade-in 0.3s ease-in",
      },
      keyframes: {
        "slide-in-bottom": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
}