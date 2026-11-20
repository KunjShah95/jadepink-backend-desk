# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

React + Vite + TypeScript (user-selected). Zero backend change: the app consumes the existing Express API and/or Supabase directly. Built to `client/dist` and served as static files; no framework runtime on the server.

## Users

Two audiences share one system, and the interface must serve both without a mode switch.

**Store floor staff (primary, tablet).** Receivers, QC, Inward team, Floor team, Merchandisers. They stand at a packing bench or a rack with a garment in one hand and a tablet in the other, often under hard shop lighting, frequently interrupted. They scan, tick, count, photograph and move pieces. Their job is to move a parcel through the gate they own without breaking the chain.

**Back-office and head-office staff (secondary, desktop).** Store manager, Buyer, Accounts, Marketing, Management, HO team. They review lots, clear holds, answer merchandiser queries, approve gates, reconcile stock and close the day. Their job is to see the whole floor at once and unblock it.

Named individuals in the existing data model (`Ridham`, `Prateek`) are real approvers, not placeholders: `Prateek` approves write-offs.

## Product Purpose

A single operational record for every designer parcel that enters the store, from the moment the courier hands it over to the moment the designer is settled. It exists because the store currently runs this on paper, WhatsApp and memory, so pieces go missing, price disagreements surface weeks late, and nobody can answer "where is piece 47 of lot IN-261116-Q4V" without walking the floor.

Success is: no piece is ever untracked, every stage hand-off is signed by a named person, and a designer's settlement is backed by a record neither side can dispute.

## Positioning

The unit of truth is the **piece**, not the lot, and every stage is a **gate** that a named role must pass. Most retail back-of-house tools track an order or a shipment; this tracks each garment individually through eight gated hand-offs with an append-only audit log, and treats a "hold" as a first-class object with severity, an owning stage, and a resolution trail. The gate model is what makes the record defensible to a designer: nothing advances silently.

## Operating Context

- **Eight gated stages.** 1 Parcel receipt → 2 QC & price hold → 3 Ironing → 4 Tagging & inward → 5 Display → 6 Designer accept → 7 RTV (return to vendor) → 8 Settlement.
- **Physical scene.** A back room with a receiving bench, a QC table, an ironing station, a tagging bench, a rack floor, a storeroom with numbered boxes, and an RTV bench. Racks are `RACK`/`R01`; mannequins are `M0*`; storage boxes are numbered up to a configurable count (default 20).
- **Vocabulary that must survive.** Lot, piece, gate, hold, RTV, blind count, challan, PO, put-away, storeroom, HO (head office), SOR (sale-or-return), MRP, HSN, GST. These are the users' words; do not rename them into generic software language.
- **Holds are the exception path and the daily risk.** Severity A stops a piece, B is fixed in parallel, C is noted only. A daily close cannot pass while the hold shelf is unchecked.
- **The day has a ritual close.** System quantity versus scanned quantity, open transfer notes, hold shelf status, manager sign-off.
- **Interruption is normal.** A staff member will start a lot, get called away, and come back. State must be recoverable at a glance and never require re-entering what was already recorded.
- **Connectivity is not guaranteed.** The floor tablet may lose signal mid-scan. Local persistence and a clear offline signal are part of the product, not a nicety.

## Capabilities and Constraints

**Confirmed functionality (from the existing schema, seed data and API):**
- Users with role arrays; role-gated stage authority.
- Designers with GST/PAN/legal name/vendor code.
- Lookup-driven dropdowns seeded with the store's exact wording.
- Lots carrying per-stage fields; child records for checklist ticks, gates, approvals (marketing/accounts/management), HO queries, box photos, pieces, piece photos, holds, append-only events, daily close, settings.
- Piece lifecycle states: new, accepted, rejected, tagged, stored, on_floor, sold, loan, pulled, boxed, returned, written_off.
- Barcode scan on pieces; location put-away; refill between locations; loan out; sale.

**Technical constraints:**
- Existing API is header-authenticated: `x-user-id`, `x-user-roles`. A Supabase path exists via RLS and Edge Functions.
- The frontend must run without a live backend for demonstration and client review: a local adapter with a realistic seeded dataset backs every screen, and the same screens bind to the real API when configured. Never a dead button.
- Tablet-first touch targets, but dense enough for a desktop operator.

**Explicitly undecided (do not invent):** pricing policy, commission or margin rules beyond the fields that exist, notification channels, multi-store support, tax filing behaviour.

## Brand Commitments

The name **Jade Pink** is binding and is the palette's origin: jade green and a muted rose. The product is used by a designer-wear fashion house, so the visual register is editorial and exact rather than playful or corporate. Store staff are the audience, not customers: the interface should feel like the house's own ledger, not a generic SaaS product.

## Evidence on Hand

- Working Express API in `server.js` (all routes real).
- Supabase schema `schema-supabase.sql`, RLS in `rls-policies.sql`, seed wording in `seed-supabase.sql`, Edge Functions in `supabase/functions/`.
- Real seeded vocabulary for stock type, box condition, expected status, tag match, reject reasons, categories, severities, hold outcomes, tag destinations and piece states.
- A prior vanilla frontend in `public/` that establishes the eight-stage model and the "Working as" identity switcher. Treat it as evidence of the domain, not as visual authority.
- **Absence to respect:** no real photographs, no real designer names beyond the schema's `designers` table, no financial figures. Demonstration data must be labelled synthetic in the UI where a client could mistake it for live records.

## Product Principles

1. **The gate is the contract.** A stage advances only through a named person's explicit action, and the record shows who, when and what changed.
2. **Piece-level truth or nothing.** Any count shown must be reconcilable to individual pieces, not a typed total.
3. **Exceptions get the attention.** Holds, unanswered queries and failed counts rise to the top of the screen before happy-path work does.
4. **Interruption-tolerant.** Every screen reopens where the user left it, with nothing to re-enter.
5. **The floor is the source of truth, the desk is the mirror.** Desktop views summarise the floor; they never become a second place to enter the same fact.

## Accessibility & Inclusion

Shop-floor use implies glare, gloves, standing distance and one-handed operation. Required: WCAG 2.2 AA contrast, minimum 44×44 CSS-pixel touch targets on interactive controls, full keyboard operation on desktop, visible focus at all times, no information carried by colour alone (severity and state always carry a label), and respect for `prefers-reduced-motion`.
