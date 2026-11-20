# Jade Pink Backend Desk — Design

## Scene

Shop-floor tablet + back-office desktop. One responsive system: big touch targets on a
1024 px tablet, dense tables on a 1440 px desktop. The rail collapses to a bottom bar
below 992 px; tables reflow to stacked rows via `@container`.

## Aesthetic

**Atelier ledger.** Warm paper ground (`--paper #f4f0e8`), ink typography, jade and rose
accents, hairline rules, sharp corners (`--r-xs 2px`). Editorial serif (Bodoni Moda) for
stage titles and lot numbers; Schibsted Grotesk for UI; JetBrains Mono for piece IDs,
barcodes and lot numbers. No gradients, no coloured border-left over 1 px, no hard offset
shadows, no emoji icons.

## Signature

The **cutting-room bundle ticket** — candidate 6 from the `impeccable concept-seed`
(seed `00dedb06`, mode `operate`), disciplined by the emission-line rail challenger:

- a punched hole at the top,
- a dashed tear line with a notch bitten out of the paper edge,
- a numbered contents index with leader dots and counts as page numbers,
- eight gates as beads on one continuous vertical rule — state carried by **form**, not
  hue: pending = hairline ring, live = jade bead, blocked = oxblood bead.

The rule passes behind each bead (the bead has `--rail-bg` so it interrupts the line).
Colour only marks severity; it never carries state alone.

## Tokens

Three layers: primitive palette (`--paper`, `--ink`, `--jade`, `--rose` …), semantic
(`--rail-bg`, `--rail-ink`, `--spine-live` …), component (`.chip--moss`,
`.stamp`). 4 px space rhythm, type scale from `--fs-3xs` (12 px) to `--fs-5xl`.
Dark theme is a separate palette, not an inversion.

## Accessibility

WCAG 2.2 AA. Touch targets ≥ 44 px (`--target`), scaled to 48 px on coarse pointers.
Native `<dialog>` for modals. `prefers-reduced-motion` zeroes transitions. All functional
text ≥ 11 px (impeccable `undersized-ui-text` floor). Focus ring `--focus-ring`.

## Anti-patterns deliberately retained

- `cream-palette`: the warm paper ground is the ledger world, not a reflex.
- `monotonous-spacing`: the 4 px grid is the rhythm; variation lives in grouping, not in
  ad-hoc values.

## Data modes

Three adapters behind one `Store` interface: `local` (default, seeded demo, persists to
`jp.desk.v2`), `api` (Express `/api/*` with `x-user-id`/`x-user-roles`),
`supabase` (not implemented; Express is the ready path).

## Running

```
cd client && npm run dev      # Vite on :5173, proxies /api to :3001
cd .. && node server.js      # Express on :3001 (needs Postgres)
```

`npm run build` emits `client/dist`; `server.js` serves it as the SPA.
