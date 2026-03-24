import type { Config } from 'tailwindcss'

const config: Config = {
    darkMode: ['class'],
    content: [
    './index.html',
    './src/**/*.{ts,tsx}',
    '../blocks/**/*.tsx',
  ],
  theme: {
  	extend: {
  		colors: {
  			background: 'rgb(var(--background) / <alpha-value>)',
  			foreground: 'rgb(var(--foreground) / <alpha-value>)',
  			card: {
  				DEFAULT: 'rgb(var(--card) / <alpha-value>)',
  				foreground: 'rgb(var(--card-foreground) / <alpha-value>)'
  			},
  			muted: {
  				DEFAULT: 'rgb(var(--muted) / <alpha-value>)',
  				foreground: 'rgb(var(--muted-foreground) / <alpha-value>)'
  			},
  			border: 'rgb(var(--border) / <alpha-value>)',
  			input: 'rgb(var(--input) / <alpha-value>)',
  			ring: 'rgb(var(--ring) / <alpha-value>)',
			'ring-destructive': 'rgb(var(--ring-destructive) / <alpha-value>)',
  			primary: {
  				DEFAULT: 'rgb(var(--primary) / <alpha-value>)',
  				foreground: 'rgb(var(--primary-foreground) / <alpha-value>)'
  			},
  			destructive: {
  				DEFAULT: 'rgb(var(--destructive) / <alpha-value>)',
  				foreground: 'rgb(var(--destructive-foreground) / <alpha-value>)'
  			},
  			success: {
  				DEFAULT: 'rgb(var(--success) / <alpha-value>)',
  				foreground: 'rgb(var(--success-foreground) / <alpha-value>)',
  				text: 'rgb(var(--success-text) / <alpha-value>)'
  			},
  			warning: {
  				DEFAULT: 'rgb(var(--warning) / <alpha-value>)',
  				foreground: 'rgb(var(--warning-foreground) / <alpha-value>)',
  				text: 'rgb(var(--warning-text) / <alpha-value>)'
  			},
  			alert: {
  				DEFAULT: 'rgb(var(--alert) / <alpha-value>)',
  				foreground: 'rgb(var(--alert-foreground) / <alpha-value>)',
  				text: 'rgb(var(--alert-text) / <alpha-value>)'
  			},
  			accent: {
  				DEFAULT: 'rgb(var(--accent) / <alpha-value>)',
  				foreground: 'rgb(var(--accent-foreground) / <alpha-value>)'
  			}
  		},
  		fontSize: {
  			sm: [
  				'0.75rem',
  				{
  					lineHeight: '1rem'
  				}
  			],
  			base: [
  				'0.875rem',
  				{
  					lineHeight: '1.25rem'
  				}
  			],
  			lg: [
  				'1rem',
  				{
  					lineHeight: '1.5rem'
  				}
  			]
  		},
  		fontWeight: {
  			semibold: '500'
  		},
  		fontFamily: {
  			sans: [
  				'var(--font-sans)'
  			],
  			mono: [
  				'var(--font-mono)'
  			]
  		},
  		boxShadow: {
  			sm: 'rgba(99, 99, 99, 0.2) 0px 2px 8px 0px',
  			md: 'rgba(149, 157, 165, 0.2) 0px 8px 24px',
  		},
  		keyframes: {
  			'accordion-down': {
  				from: {
  					height: '0'
  				},
  				to: {
  					height: 'var(--radix-accordion-content-height)'
  				}
  			},
  			'accordion-up': {
  				from: {
  					height: 'var(--radix-accordion-content-height)'
  				},
  				to: {
  					height: '0'
  				}
  			}
  		},
  		animation: {
  			'accordion-down': 'accordion-down 0.2s ease-out',
  			'accordion-up': 'accordion-up 0.2s ease-out'
  		}
  	}
  },
  plugins: [],
}

export default config
