import { chromium } from 'playwright-core'
import { resolve } from 'node:path'

const BASE = 'http://localhost:5173'
const OUT = resolve(process.cwd(), '..', 'shots')
const browser = await chromium.launch({ channel: 'msedge', headless: true })
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1.25 })
await ctx.addInitScript(() => localStorage.setItem('jp.desk.theme', 'light'))
const page = await ctx.newPage()
const errors = []
page.on('pageerror', (e) => errors.push(String(e)))
page.on('console', (m) => m.type() === 'error' && errors.push(m.text()))

const settle = async () => {
  await page.evaluate(async () => {
    for (let y = 0; y < document.documentElement.scrollHeight; y += 500) { scrollTo(0, y); await new Promise((r) => setTimeout(r, 50)) }
    scrollTo(0, 0)
  })
  await page.waitForTimeout(900)
}

for (const [name, path, full] of [
  ['light-01-home', '/', true], ['light-02-pricing', '/pricing', true], ['light-03-features', '/features', false],
  ['light-04-contact', '/contact', false], ['light-05-signin', '/signin', false],
  ['light-10-desk', '/app', false], ['light-11-lots', '/app/lots', false], ['light-12-holds', '/app/holds', false],
  ['light-13-close', '/app/close', false], ['light-14-setup', '/app/setup', false],
]) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(1000)
  if (path === '/') await page.mouse.move(980, 260)
  if (full) await settle()
  await page.screenshot({ path: resolve(OUT, `${name}.png`), fullPage: full })
  console.log('shot', name, '| theme:', await page.evaluate(() => document.documentElement.dataset.theme))
}
// lot detail
await page.goto(BASE + '/app/lots', { waitUntil: 'networkidle' })
await page.locator('tbody tr').nth(3).click()
await page.waitForTimeout(800)
await page.screenshot({ path: resolve(OUT, 'light-15-lot.png') })

// toggle round-trip from the marketing nav
await page.goto(BASE + '/', { waitUntil: 'networkidle' })
await page.locator('.mx-theme').click()
console.log('after nav toggle:', await page.evaluate(() => document.documentElement.dataset.theme), await page.evaluate(() => localStorage.getItem('jp.desk.theme')))
await page.goto(BASE + '/app', { waitUntil: 'networkidle' })
console.log('desk follows:', await page.evaluate(() => document.documentElement.dataset.theme))
await browser.close()
console.log('errors', errors.length, errors.slice(0, 5))
