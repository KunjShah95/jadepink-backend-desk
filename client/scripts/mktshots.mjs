import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'http://localhost:5173'
const OUT = resolve(process.cwd(), '..', 'shots')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({ channel: 'msedge', headless: true })
const context = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.5, colorScheme: 'dark' })
const page = await context.newPage()
const errors = []
page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text()) })
page.on('pageerror', (e) => errors.push(String(e)))

/** Scroll the page through so every Reveal fires, then return to top. */
async function settle(p) {
  await p.evaluate(async () => {
    const h = document.documentElement.scrollHeight
    for (let y = 0; y < h; y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 60)) }
    window.scrollTo(0, 0)
  })
  await p.waitForTimeout(900)
}

const pages = [
  ['mkt-01-home', '/', true],
  ['mkt-02-features', '/features', true],
  ['mkt-03-pricing', '/pricing', true],
  ['mkt-04-about', '/about', true],
  ['mkt-05-contact', '/contact', false],
  ['mkt-06-signin', '/signin', false],
  ['mkt-07-register', '/register', false],
  ['mkt-08-terms', '/terms', false],
  ['mkt-10-404', '/nope', false],
]

for (const [name, path, full] of pages) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1200)
  if (path === '/' || path === '/signin') await page.mouse.move(path === '/' ? 980 : 1100, path === '/' ? 260 : 380)
  await page.waitForTimeout(500)
  await page.screenshot({ path: resolve(OUT, `${name}.png`) })
  if (full) {
    await settle(page)
    await page.screenshot({ path: resolve(OUT, `${name}-full.png`), fullPage: true })
  }
  console.log('shot', name)
}

const mob = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, colorScheme: 'dark' })
const mp = await mob.newPage()
mp.on('pageerror', (e) => errors.push(String(e)))
await mp.goto(BASE + '/', { waitUntil: 'networkidle' })
await mp.waitForTimeout(1200)
await mp.screenshot({ path: resolve(OUT, 'mkt-09-home-mobile.png') })
await settle(mp)
await mp.screenshot({ path: resolve(OUT, 'mkt-09-home-mobile-full.png'), fullPage: true })
await mp.click('.mx-nav__menu')
await mp.waitForTimeout(400)
await mp.screenshot({ path: resolve(OUT, 'mkt-11-mobile-menu.png') })
const overflow = await mp.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)
console.log('mobile horizontal overflow px:', overflow)
console.log('shot mobile')

// app shell must not render marketing chrome, and marketing must not render the rail
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
console.log('rail on marketing:', await page.locator('.rail').count())
await page.goto(BASE + '/app', { waitUntil: 'networkidle' })
console.log('rail on /app:', await page.locator('.rail').count(), '| mx nav on /app:', await page.locator('.mx-nav').count())

await browser.close()
console.log('console errors:', errors.length)
for (const e of errors.slice(0, 20)) console.log(' -', e)
