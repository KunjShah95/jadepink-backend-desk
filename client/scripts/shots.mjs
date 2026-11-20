import { chromium } from 'playwright-core'
import { mkdirSync } from 'node:fs'
import { resolve } from 'node:path'

const BASE = 'http://localhost:5173'
const OUT = resolve(process.cwd(), '..', 'shots')
mkdirSync(OUT, { recursive: true })

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
})

const context = await browser.newContext({
  viewport: { width: 1440, height: 940 },
  deviceScaleFactor: 1.5,
  colorScheme: 'dark',
})

const page = await context.newPage()
const errors = []
page.on('console', (m) => {
  if (m.type() === 'error') errors.push(m.text())
})
page.on('pageerror', (e) => errors.push(String(e)))

async function shot(name, path, opts = {}) {
  await page.goto(BASE + path, { waitUntil: 'networkidle' })
  await page.waitForTimeout(700)
  await page.screenshot({
    path: resolve(OUT, `${name}.png`),
    fullPage: opts.fullPage ?? false,
  })
  console.log('shot', name, path)
}

// Seed the demo once, then find interesting lots.
await page.goto(BASE + '/app', { waitUntil: 'networkidle' })
await page.waitForTimeout(900)

const lots = await page.evaluate(() => {
  const raw = localStorage.getItem('jp.desk.v2')
  if (!raw) return []
  const db = JSON.parse(raw)
  const gateCount = (id) => db.gates.filter((g) => g.lot_id === id).length
  return db.lots.map((l) => ({
    id: l.id,
    lot_no: l.lot_no,
    designer: l.designer,
    gates: gateCount(l.id),
  }))
})

const atSix = lots.find((l) => l.gates === 6) ?? lots.find((l) => l.gates === 5)
const atTwo = lots.find((l) => l.gates === 2)

await shot('01-desk', '/app')
await shot('02-lots', '/app/lots')
await shot('03-lot-detail', `/app/lots/${atSix.id}?stage=s6`, { fullPage: true })
await shot('04-lot-qc', `/app/lots/${atTwo.id}?stage=s2`, { fullPage: true })
await shot('05-holds', '/app/holds')
await shot('06-daily-close', '/app/close')
await shot('07-setup', '/app/setup')

// Command palette, opened with the real shortcut.
await page.goto(BASE + '/app', { waitUntil: 'networkidle' })
await page.waitForTimeout(500)
await page.keyboard.press('Control+k')
await page.waitForTimeout(400)
await page.keyboard.type('aarohi')
await page.waitForTimeout(400)
await page.screenshot({ path: resolve(OUT, '08-palette.png') })
console.log('shot 08-palette')

// Identity switcher.
await page.keyboard.press('Escape')
await page.waitForTimeout(250)
await page.keyboard.press('Control+i')
await page.waitForTimeout(450)
await page.screenshot({ path: resolve(OUT, '09-identity.png') })
console.log('shot 09-identity')

// New parcel dialog.
await page.keyboard.press('Escape')
await page.goto(BASE + '/app/lots?new=1', { waitUntil: 'networkidle' })
await page.waitForTimeout(700)
await page.screenshot({ path: resolve(OUT, '10-new-parcel.png') })
console.log('shot 10-new-parcel')

// Light theme.
const dark = await browser.newContext({
  viewport: { width: 1440, height: 940 },
  deviceScaleFactor: 2,
  colorScheme: 'dark',
})
const darkPage = await dark.newPage()
await darkPage.goto(BASE + '/app', { waitUntil: 'networkidle' })
await darkPage.evaluate(() => localStorage.setItem('jp.desk.theme', 'light'))
await darkPage.reload({ waitUntil: 'networkidle' })
await darkPage.waitForTimeout(800)
await darkPage.screenshot({ path: resolve(OUT, '11-desk-light.png') })
console.log('shot 11-desk-light')

// Tablet: the shop-floor width.
const tablet = await browser.newContext({
  viewport: { width: 1024, height: 768 },
  deviceScaleFactor: 2,
})
const tabletPage = await tablet.newPage()
await tabletPage.goto(BASE + `/app/lots/${atSix.id}?stage=s6`, { waitUntil: 'networkidle' })
await tabletPage.waitForTimeout(800)
await tabletPage.screenshot({ path: resolve(OUT, '12-tablet-lot.png') })
console.log('shot 12-tablet-lot')

// Phone: rail becomes a bottom bar.
const phone = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2 })
const phonePage = await phone.newPage()
phonePage.on('pageerror', (e) => errors.push(String(e)))
await phonePage.goto(BASE + '/app', { waitUntil: 'networkidle' })
await phonePage.waitForTimeout(800)
await phonePage.screenshot({ path: resolve(OUT, '13-phone-desk.png') })
console.log('phone overflow px:', await phonePage.evaluate(() => document.documentElement.scrollWidth - innerWidth))

await browser.close()

console.log('\nconsole errors:', errors.length)
for (const e of errors.slice(0, 20)) console.log(' -', e)
