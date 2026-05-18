import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  darkMode: ['class', '[data-theme="dark"]'],
  theme: {
    extend: {
      colors: {
        bg: 'var(--color-bg)',
        surface: 'var(--color-surface)',
        'surface-2': 'var(--color-surface-2)',
        'surface-offset': 'var(--color-surface-offset)',
        border: 'var(--color-border)',
        divider: 'var(--color-divider)',
        text: 'var(--color-text)',
        'text-muted': 'var(--color-text-muted)',
        'text-faint': 'var(--color-text-faint)',
        primary: 'var(--color-primary)',
        'primary-hover': 'var(--color-primary-hover)',
        'primary-highlight': 'var(--color-primary-highlight)',
        success: 'var(--color-success)',
        'success-highlight': 'var(--color-success-highlight)',
        error: 'var(--color-error)',
        'error-highlight': 'var(--color-error-highlight)',
        warning: 'var(--color-warning)',
        'warning-highlight': 'var(--color-warning-highlight)',
        accent: 'var(--color-accent)',
        'accent-highlight': 'var(--color-accent-highlight)',
      },
      fontFamily: {
        sans: ['var(--font-body)', 'system-ui', 'sans-serif'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      borderRadius: {
        sm: 'var(--radius-sm)',
        md: 'var(--radius-md)',
        lg: 'var(--radius-lg)',
        xl: 'var(--radius-xl)',
      },
      boxShadow: {
        sm: 'var(--shadow-sm)',
        md: 'var(--shadow-md)',
        lg: 'var(--shadow-lg)',
      },
      maxWidth: {
        narrow: '640px',
        content: '960px',
        wide: '1200px',
      },
    },
  },
  plugins: [],
};

export default config;
