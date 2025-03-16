import type { Config } from 'tailwindcss';
import { fontFamily } from 'tailwindcss/defaultTheme';

export default {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        background: 'var(--background)',
        foreground: 'var(--foreground)',
        customPurple: '#3D2683',
        customOrange: '#F15B4E',
      },
      fontFamily: {
        sans: ['"Be Vietnam Pro"', ...fontFamily.sans],
      },
    },
  },
  plugins: [],
} satisfies Config;
