/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        majalla: ['"Majalla"', 'Segoe UI', 'Tahoma', 'Arial', 'sans-serif'],
      },

      colors: {
        primary: {
          DEFAULT: '#F57C00',
          soft: '#FFB74D',
        },

        gray: {
          text: '#9AA3AF',
          subtle: '#6B7280',
          surface: {
            dark: '#171A21',
            light: '#FFFFFF',
          },
          border: {
            dark: '#242833',
            light: '#E6E8EC',
          },
        },

        background: {
          dark: '#0F1115',
          light: '#F6F7F9',
        },
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
      },

      spacing: {
        '8': '2rem',
        '12': '3rem',
        '16': '4rem',
        '24': '6rem',
      },

      boxShadow: {
        soft: '0 10px 30px rgba(0,0,0,0.06)',
        medium: '0 15px 40px rgba(0,0,0,0.08)',
        glow: '0 0 40px rgba(245,124,0,0.4)',
      },

      keyframes: {
        bgMove: {
          '0%,100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(-20px, -20px)' },
        },
        bgMoveSlow: {
          '0%,100%': { transform: 'translate(0, 0)' },
          '50%': { transform: 'translate(20px, 20px)' },
        },
      },

      animation: {
        bgMove: 'bgMove 28s ease-in-out infinite',
        bgMoveSlow: 'bgMoveSlow 55s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};
