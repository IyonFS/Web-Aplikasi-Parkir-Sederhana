/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        display: ['"DM Serif Display"', 'Georgia', 'serif'],
        body:    ['"DM Sans"', 'system-ui', 'sans-serif'],
        mono:    ['"DM Mono"', 'monospace'],
      },
      colors: {
        park: {
          bg:           '#0a0f1a',
          surface:      '#111827',
          card:         '#141d2e',
          border:       '#1e2d45',
          accent:       '#00c896',
          'accent-dim': '#00a37a',
          warn:         '#f59e0b',
          danger:       '#ef4444',
          muted:        '#4b6080',
          text:         '#e2eaf5',
          'text-dim':   '#8ba3bf',
        },
      },
      transitionTimingFunction: {
        spring:  'cubic-bezier(0.34, 1.56, 0.64, 1)',
        smooth:  'cubic-bezier(0.4, 0, 0.2, 1)',
        'out-expo': 'cubic-bezier(0.16, 1, 0.3, 1)',
        'in-back':  'cubic-bezier(0.36, 0, 0.66, -0.56)',
      },
      transitionDuration: {
        '50':  '50ms',
        '80':  '80ms',
        '400': '400ms',
        '600': '600ms',
        '800': '800ms',
      },
      keyframes: {
        fadeUp:      { from: { opacity: 0, transform: 'translateY(18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeDown:    { from: { opacity: 0, transform: 'translateY(-18px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
        fadeIn:      { from: { opacity: 0 }, to: { opacity: 1 } },
        fadeOut:     { from: { opacity: 1 }, to: { opacity: 0 } },
        slideIn:     { from: { opacity: 0, transform: 'translateX(-16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        slideInRight:{ from: { opacity: 0, transform: 'translateX(16px)' }, to: { opacity: 1, transform: 'translateX(0)' } },
        pulse2:      { '0%,100%': { opacity: 1 }, '50%': { opacity: 0.35 } },
        shimmer:     { from: { backgroundPosition: '200% 0' }, to: { backgroundPosition: '-200% 0' } },
        float:       { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-8px)' } },
        floatSlow:   { '0%,100%': { transform: 'translateY(0px)' }, '50%': { transform: 'translateY(-4px)' } },
        scaleIn:     { from: { opacity: 0, transform: 'scale(0.92)' }, to: { opacity: 1, transform: 'scale(1)' } },
        scaleOut:    { from: { opacity: 1, transform: 'scale(1)' }, to: { opacity: 0, transform: 'scale(0.92)' } },
        spin:        { from: { transform: 'rotate(0deg)' }, to: { transform: 'rotate(360deg)' } },
        // Tada — untuk success state
        tada:        {
          '0%':    { transform: 'scale(1)' },
          '10%,20%':{ transform: 'scale(0.9) rotate(-3deg)' },
          '30%,50%,70%,90%': { transform: 'scale(1.1) rotate(3deg)' },
          '40%,60%,80%': { transform: 'scale(1.1) rotate(-3deg)' },
          '100%':  { transform: 'scale(1) rotate(0)' },
        },
        // Bounce gentle
        bounceGentle: {
          '0%,100%': { transform: 'translateY(0)',  animationTimingFunction: 'cubic-bezier(0.8,0,1,1)' },
          '50%':     { transform: 'translateY(-8px)', animationTimingFunction: 'cubic-bezier(0,0,0.2,1)' },
        },
        // Heartbeat
        heartbeat: {
          '0%,100%': { transform: 'scale(1)' },
          '14%': { transform: 'scale(1.08)' },
          '28%': { transform: 'scale(1)' },
          '42%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(1)' },
        },
        // Slide up from bottom
        slideUpFade: { from: { opacity: 0, transform: 'translateY(24px) scale(0.97)' }, to: { opacity: 1, transform: 'translateY(0) scale(1)' } },
        // Number count up effect
        countUp: { from: { opacity: 0, transform: 'translateY(10px)' }, to: { opacity: 1, transform: 'translateY(0)' } },
      },
      animation: {
        fadeUp:        'fadeUp 0.45s cubic-bezier(0, 0, 0.2, 1) both',
        fadeDown:      'fadeDown 0.45s cubic-bezier(0, 0, 0.2, 1) both',
        fadeIn:        'fadeIn 0.3s ease both',
        fadeOut:       'fadeOut 0.2s ease both',
        slideIn:       'slideIn 0.35s cubic-bezier(0, 0, 0.2, 1) both',
        slideInRight:  'slideInRight 0.35s cubic-bezier(0, 0, 0.2, 1) both',
        pulse2:        'pulse2 2.5s ease-in-out infinite',
        shimmer:       'shimmer 1.8s linear infinite',
        float:         'float 3.5s ease-in-out infinite',
        floatSlow:     'floatSlow 5s ease-in-out infinite',
        scaleIn:       'scaleIn 0.25s cubic-bezier(0.34, 1.56, 0.64, 1) both',
        scaleOut:      'scaleOut 0.2s ease both',
        tada:          'tada 0.8s ease both',
        bounceGentle:  'bounceGentle 1s ease-in-out infinite',
        heartbeat:     'heartbeat 1.5s ease-in-out infinite',
        slideUpFade:   'slideUpFade 0.4s cubic-bezier(0.34, 1.2, 0.64, 1) both',
        countUp:       'countUp 0.4s cubic-bezier(0, 0, 0.2, 1) both',
        spin:          'spin 1s linear infinite',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [],
};

