/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  corePlugins: {
    preflight: true, // This is enabled by default
  },
  theme: {
    extend: {
      transitionDuration: {
        '600': '600ms',
      },
    },
  },
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};
