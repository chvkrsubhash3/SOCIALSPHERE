import type { Config } from 'tailwindcss';

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // ─── SocialSphere Brand Palette ───
        brand: {
          50:  '#f0f4ff',
          100: '#e0eaff',
          200: '#c7d7fe',
          300: '#a5b9fd',
          400: '#818cf8',
          500: '#6366f1',  // Primary
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
          950: '#1e1b4b',
        },
        accent: {
          pink: '#ec4899',
          purple: '#a855f7',
          cyan: '#06b6d4',
          amber: '#f59e0b',
          emerald: '#10b981',
        },
        // Dark mode surface colors
        surface: {
          0: '#0a0a0f',   // Deepest background
          1: '#111118',   // Primary background
          2: '#16161f',   // Card background
          3: '#1c1c28',   // Elevated card
          4: '#242435',   // Input/control
          5: '#2e2e42',   // Hover state
        },
        // Border colors
        border: {
          DEFAULT: '#2a2a3a',
          light: '#3a3a4a',
          focus: '#6366f1',
        },
      },

      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Cal Sans', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },

      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
        'brand-gradient': 'linear-gradient(135deg, #6366f1 0%, #a855f7 50%, #ec4899 100%)',
        'dark-gradient': 'linear-gradient(180deg, #111118 0%, #0a0a0f 100%)',
        'card-gradient': 'linear-gradient(145deg, #16161f 0%, #1c1c28 100%)',
        'glass-gradient': 'linear-gradient(145deg, rgba(255,255,255,0.05), rgba(255,255,255,0.01))',
      },

      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
        'scale-in': 'scaleIn 0.2s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
        'shimmer': 'shimmer 1.5s infinite',
        'float': 'float 3s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
        'bounce-subtle': 'bounceSubtle 0.6s ease-out',
        'typing': 'typing 1s steps(3) infinite',
      },

      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideDown: {
          '0%': { opacity: '0', transform: 'translateY(-16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
        shimmer: {
          '0%': { backgroundPosition: '-200% 0' },
          '100%': { backgroundPosition: '200% 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-8px)' },
        },
        glow: {
          '0%': { boxShadow: '0 0 5px rgba(99, 102, 241, 0.4)' },
          '100%': { boxShadow: '0 0 20px rgba(99, 102, 241, 0.8), 0 0 40px rgba(99, 102, 241, 0.4)' },
        },
        bounceSubtle: {
          '0%': { transform: 'scale(1)' },
          '30%': { transform: 'scale(1.1)' },
          '60%': { transform: 'scale(0.95)' },
          '100%': { transform: 'scale(1)' },
        },
        typing: {
          '0%, 100%': { content: '●' },
          '33%': { content: '●●' },
          '66%': { content: '●●●' },
        },
      },

      backdropBlur: {
        xs: '2px',
      },

      boxShadow: {
        'brand': '0 0 0 2px rgba(99, 102, 241, 0.3)',
        'card': '0 4px 24px rgba(0, 0, 0, 0.4)',
        'card-hover': '0 8px 40px rgba(0, 0, 0, 0.5)',
        'glow-brand': '0 0 20px rgba(99, 102, 241, 0.4)',
        'glow-pink': '0 0 20px rgba(236, 72, 153, 0.4)',
        'inner-glow': 'inset 0 1px 0 rgba(255, 255, 255, 0.05)',
      },

      borderRadius: {
        '2xl': '1rem',
        '3xl': '1.5rem',
        '4xl': '2rem',
      },

      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
};

export default config;
