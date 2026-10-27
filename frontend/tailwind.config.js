/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        page: "#e9e6df",
        surface: "#f4f2ec",
        sunk: "#dcd8cd",
        line: "#bdb7a8",
        line2: "#9a9484",
        char: "#161513",
        fg: "#161513",
        fg2: "#38352e",
        fg3: "#514d44",
        fg4: "#625d52",
        bone: "#ece8df",
        'ash-300': "#c9c3b6",
        'ash-400': "#a8a193",
        'ash-500': "#857f72",
        'ink-900': "#161513",
        'ink-800': "#1d1b18",
        'ink-600': "#33302b",
        'ink-500': "#47433c",
        amber: {
          300: "#f6c067",
          400: "#f0a23a",
          700: "#8c5409",
        },
        rust: "#e2572f",
        rustink: "#b23a17",
        sage: "#93a88a",
      },
      fontFamily: {
        sans: ['"IBM Plex Sans"', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'ui-monospace', 'Menlo', 'monospace'],
        display: ['"Archivo"', 'Arial Narrow', 'Impact', 'sans-serif'],
      },
      keyframes: {
        blink: {
          '0%, 60%': { opacity: '1' },
          '80%, 100%': { opacity: '0.25' },
        },
        sweep: {
          '0%': { transform: 'translate(-100%)' },
          '100%': { transform: 'translate(350%)' },
        },
        rise: {
          '0%': { opacity: '0', transform: 'translateY(8px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        fade: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
      },
      animation: {
        blink: 'blink 1.6s steps(1) infinite',
        sweep: 'sweep 1.1s ease-in-out infinite',
        rise: 'rise .45s cubic-bezier(.22,1,.36,1) both',
        fade: 'fade .3s ease-out both',
      },
    },
  },
  plugins: [],
}
