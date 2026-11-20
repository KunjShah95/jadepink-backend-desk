# Jade Pink Backend Desk — Supabase Edition

Production module for the Jade Pink Backend Desk — 8 gated stages from parcel receipt to settlement, piece-level scanning, holds, store map, storage and daily close.

**This is the Supabase-native implementation.** The custom Express server and legacy PostgreSQL schema are retained for reference. New development uses:

- **PostgreSQL** (via Supabase) with **RLS** for role-based access
- **Edge Functions** for complex business logic
- **Vanilla HTML/CSS/JS** tablet-friendly UI

---

## Supabase Architecture

- **Database**: PostgreSQL + RLS policies for authorization
- **Auth**: Supabase Auth (email providers for tablet users)
- **Edge Functions**: Deno-based functions for multi-step operations
- **Storage**: Supabase Storage for box photos and piece photos

## Key Features

- 8 gated stages with role-based gate authorization
- Piece-level scanning (QC, tagging, put-away)
- Holds with severity A/B/C management
- Store map with racks, mannequins, storage boxes
- Daily close with hold shelf monitoring
- Audit log (append-only)

## Setup

See [SUPABASE_SETUP.md](SUPABASE_SETUP.md) for detailed instructions.

## Database Tables

| Table | Purpose |
|-------|---------|
| `users` | Store staff with roles (replaces prototype "Working as" dropdown) |
| `designers` | Designer master data (replaces free-text designer field) |
| `lookups` | Seeded dropdown values (section 4 exact text) |
| `lots` | One per designer parcel, stages 1–8 fields |
| `lot_checks` | Ticked checklist lines per stage |
| `lot_gates` | Passed gates per stage |
| `lot_approvals` | Marketing / Accounts / Management approvals |
| `lot_queries` | HO questions to merchandiser |
| `lot_photos` | Box photos |
| `pieces` | One per garment, with QC, tagging, location, lifecycle |
| `piece_photos` | Product/tag photos per piece |
| `upcoming` | Expected parcels from designers |
| `holds` | Flagged problems with severity A/B/C |
| `events` | Append-only audit log with structured before/after |
| `daily_close` | Per-day store close record |
| `settings` | Store settings (box count, etc.) |

## API Routes

### Users
- `GET /api/users` — List users
- `POST /api/users` — Create user (Admin only)
- `PATCH /api/users/:id` — Update user (Admin only)

### Lookups
- `GET /api/lookups?list_name=<name>` — Get dropdown values for a list

### Designers
- `GET /api/designers` — List active designers
- `POST /api/designers` — Create designer (Admin only)

### Lots
- `GET /api/lots` — List lots
- `GET /api/lots/:id` — Get lot with all child data
- `POST /api/lots` — Create lot (Stage 1: parcel receipt)
- `PATCH /api/lots/:id` — Update lot fields (stages 2–8)

### Lot Child Tables
- `POST/DELETE /api/lots/:lotId/checks` — Tick/untick checklist
- `POST/DELETE /api/lots/:lotId/gates` — Pass/reopen gate
- `POST/DELETE /api/lots/:lotId/approvals` — Add/withdraw approval
- `POST/PATCH /api/lots/:lotId/queries` — HO queries and answers
- `POST /api/lots/:lotId/photos` — Upload box photo
- `POST /api/lots/:lotId/pieces` — Create pieces for a lot

### Pieces
- `PATCH /api/pieces/:pieceId/qc` — QC accept/reject
- `PATCH /api/pieces/:pieceId/tag` — Tag scan
- `PATCH /api/pieces/:pieceId/location` — Put-away / move

### Holds
- `GET /api/holds` — List holds (filter by status, severity, piece)
- `POST /api/holds` — Create hold
- `PATCH /api/holds/:id/resolve` — Resolve hold

### Upcoming
- `GET /api/upcoming` — List expected parcels
- `POST /api/upcoming` — Add expected parcel

### Events
- `GET /api/events` — Audit log

### Daily Close
- `GET /api/dailyclose` — List daily closes
- `POST /api/dailyclose` — Save daily close (Admin only)

### Settings
- `GET /api/settings` — Get store settings
- `PATCH /api/settings` — Update settings (Admin only)

## Authentication

The API uses header-based auth for the tablet kiosk model:
- `x-user-id`: Signed-in user ID
- `x-user-roles`: Comma-separated role list

Roles: `Receiver`, `Marketing`, `QC`, `Buyer`, `Accounts`, `Management`, `Floor team`, `HO team`, `Inward team`, `Merchandiser`, `Store manager`, `Ridham`, `Prateek`, `Admin`

Gate permissions follow the role matrix from the execution plan.

## Setup

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create the PostgreSQL database:
   ```bash
   psql -U postgres -c "CREATE DATABASE jadepink;"
   psql -U postgres -d jadepink -f schema.sql
   psql -U postgres -d jadepink -f seed.sql
   ```

3. Set environment variables (create `.env`):
   ```
   DATABASE_URL=postgresql://localhost:5432/jadepink
   PORT=3001
   ```

4. Start the server:
   ```bash
   npm start
   ```

5. Open `http://localhost:3001` in a browser and select a user from the "Working as" dropdown.

## Key Design Decisions

- **Relational schema**: Child tables (checks, gates, approvals, queries, photos) are split from lots for auditability and querying.
- **Field names preserved**: All field names match the prototype (e.g., `by`, `at`, `lot_no`, `blind_count`) so JSON export maps directly.
- **Role-based access**: Replaces the prototype's "anyone can do anything" model with proper RBAC.
- **Severity A holds**: Move piece to "On hold" state while the rest of the lot continues.
- **Test mode**: Admin-only, separate test environment (not per-browser like the prototype).