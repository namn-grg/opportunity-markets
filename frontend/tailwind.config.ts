import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
    './lib/**/*.{js,ts,jsx,tsx}',
    './providers/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        midnight: '#0f172a',
        ocean: '#0ea5e9',
        slate: '#cbd5e1'
      }
    }
  },
  plugins: []
};

export default config;
