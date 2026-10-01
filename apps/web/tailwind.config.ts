import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          950: '#05060f',
          900: '#0a0b1e',
          850: '#0f1129',
          800: '#141738',
          700: '#1e224f',
          600: '#2b306e',
        },
        neon: {
          cyan: '#00f0ff',
          pink: '#ff2bd6',
          purple: '#8b5cf6',
          yellow: '#f9f002',
          green: '#39ff14',
          blue: '#3b82f6',
        },
        brand: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#00f0ff',
          600: '#0284c7',
          700: '#0369a1',
          800: '#075985',
          900: '#0c4a6e',
          950: '#082f49',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        orbitron: ['Orbitron', 'Rajdhani', 'sans-serif'],
        rajdhani: ['Rajdhani', 'sans-serif'],
        mono: ['JetBrains Mono', 'monospace'],
      },
      boxShadow: {
        'neon-cyan': '0 0 15px rgba(0, 240, 255, 0.4), 0 0 30px rgba(0, 240, 255, 0.15)',
        'neon-pink': '0 0 15px rgba(255, 43, 214, 0.4), 0 0 30px rgba(255, 43, 214, 0.15)',
        'neon-purple': '0 0 15px rgba(139, 92, 246, 0.4), 0 0 30px rgba(139, 92, 246, 0.15)',
        'glass': '0 8px 32px 0 rgba(0, 0, 0, 0.4)',
        'glass-hover': '0 12px 40px 0 rgba(0, 240, 255, 0.25)',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        'pulse-glow': {
          '0%, 100%': { opacity: '0.6', transform: 'scale(1)' },
          '50%': { opacity: '1', transform: 'scale(1.03)' },
        },
        'gradient-shift': {
          '0%': { backgroundPosition: '0% 50%' },
          '50%': { backgroundPosition: '100% 50%' },
          '100%': { backgroundPosition: '0% 50%' },
        },
        flicker: {
          '0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%': { opacity: '0.99', filter: 'drop-shadow(0 0 8px rgba(0,240,255,0.6))' },
          '20%, 21.999%, 63%, 63.999%, 65%, 69.999%': { opacity: '0.4', filter: 'none' },
        },
      },
      animation: {
        float: 'float 6s ease-in-out infinite',
        'pulse-glow': 'pulse-glow 3s ease-in-out infinite',
        'gradient-shift': 'gradient-shift 8s ease infinite',
        flicker: 'flicker 4s infinite',
      },
    },
  },
  plugins: [],
};

export default config;
