import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'

// One global rule for readable text across the website and the admin panel.
// Any font size below TEXT_SCALE_UP_TO is enlarged; the smallest text becomes TEXT_MIN.
// Change these two numbers to make all small text bigger or smaller everywhere.
const TEXT_MIN = 13.5
const TEXT_SCALE_UP_TO = 15

function readableTextSizes() {
  const scale = (px) => {
    if (px >= TEXT_SCALE_UP_TO) return px
    const from = Math.max(px, 8)
    return Number((TEXT_MIN + (from - 8) * ((TEXT_SCALE_UP_TO - TEXT_MIN) / (TEXT_SCALE_UP_TO - 8))).toFixed(2))
  }
  // PostCSS visits a declaration again after it changes, so remember which ones are already done.
  const done = new WeakSet()
  return {
    postcssPlugin: 'captora-readable-text-sizes',
    Declaration: {
      'font-size'(declaration) {
        if (done.has(declaration)) return
        done.add(declaration)
        declaration.value = declaration.value.replace(/(\d*\.?\d+)(px|rem)\b/g, (match, number, unit) => {
          const px = unit === 'rem' ? Number(number) * 16 : Number(number)
          if (px < 6) return match
          const next = scale(px)
          return unit === 'rem' ? `${Number((next / 16).toFixed(4))}rem` : `${next}px`
        })
      },
    },
  }
}
readableTextSizes.postcss = true

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [tailwindcss(), react()],
    css: {
      postcss: { plugins: [readableTextSizes()] },
    },
    // On Vercel (it sets VERCEL=1) the site is built into frontend/dist and the API is reached through vercel.json.
    // Everywhere else the Node server serves the site from backend/public, so the build lands there.
    build: {
      outDir: process.env.VERCEL ? 'dist' : '../backend/public',
      emptyOutDir: true,
    },
    server: {
      proxy: {
        '/api': {
          target: env.VITE_API_URL || 'http://localhost:4000',
          changeOrigin: true,
        },
      },
    },
  }
})
