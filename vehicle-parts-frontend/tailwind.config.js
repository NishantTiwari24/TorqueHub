/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#006a69',
          container: '#0ea5a4',
          on: '#ffffff',
          'on-container': '#003333',
        },
        secondary: {
          DEFAULT: '#4648d4',
          container: '#6063ee',
          on: '#ffffff',
          'on-container': '#fffbff',
        },
        tertiary: {
          DEFAULT: '#95491d',
          container: '#d87d4d',
          on: '#ffffff',
          'on-container': '#511e00',
        },
        error: {
          DEFAULT: '#ba1a1a',
          container: '#ffdad6',
          on: '#ffffff',
          'on-container': '#93000a',
        },
        surface: {
          DEFAULT: '#f5faf9',
          dim: '#d5dbda',
          bright: '#f5faf9',
          container: {
            lowest: '#ffffff',
            low: '#eff5f4',
            DEFAULT: '#e9efee',
            high: '#e4e9e8',
            highest: '#dee4e3',
          },
          'on': '#171d1c',
          'on-variant': '#3d4949',
        },
        outline: {
          DEFAULT: '#6d7a79',
          variant: '#bcc9c8',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        'base': '0.5rem',
      },
      spacing: {
        'xs': '0.25rem',
        'sm': '0.5rem',
        'md': '1rem',
        'lg': '1.5rem',
        'xl': '2.5rem',
      }
    },
  },
  plugins: [],
}
