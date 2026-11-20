# Supabase Setup Guide — Jade Pink Backend Desk

This guide walks you through setting up the Jade Pink Backend Desk on Supabase.

## 1. Create a Supabase Project

1. Go to [supabase.com](https://supabase.com) and create an account
2. Create a new project (e.g., "jadepink-desk")
3. Note your **Project URL** and **anon public** and **service role keys**

## 2. Configure Environment Variables

Create a `.env` file at the project root:

```env
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## 3. Run the Database Schema

Open the Supabase SQL editor (or `supabase login` + `supabase db push`) and run:

1. **schema-supabase.sql** — All tables (lots, pieces, users, looks, etc.)
2. **rls-policies.sql** — Row Level Security policies for role-based access
3. **seed-supabase.sql** — Seeded lookup values (dropdown lists from the plan)

Alternatively, use the Supabase CLI:
```bash
supabase status
supabase db push
```

## 4. Configure Authentication

1. In Supabase Dashboard > Authentication > Providers, enable **Email** (for now)
2. Email auth is required for user sessions

## 5. Set Up Supabase Vault for Service Role Key

The service role key is sensitive. Store it securely:
- In your local `.env` for development
- In Supabase Vault for production (Dashboard > Vault)

## 6. Edge Functions (Optional)

The Edge Functions (`generate-lot-no`, `validate-gate`, `log-event`, `create-lot`) are optional—they handle complex business logic that RLS policies can't enforce.

To deploy Edge Functions:
1. Install Supabase CLI: `npm install -g supabase`
2. Initialize: `supabase init`
3. Link your project: `supabase link --project-ref your-project-ref`
4. Push functions: `supabase functions deploy`

## 7. Install Dependencies

```bash
npm install
```

## 8. Test Locally

```bash
npm run dev
```
Then open `http://localhost:3000/public/index.html` in a browser.

## 9. Users Setup

In the Supabase Dashboard, create users in the `profiles` table:

```sql
INSERT INTO profiles (id, name, email, roles, active)
VALUES ('00000000-0000-0000-0000-000000000001', 'Receiver on Duty', 'receiver@jadepink.com', '{"Receiver"}', true);
```

Create users for each role defined in the plan:
- Receiver on duty (Stage 1)
- Marketing (Stage 2 unlock)
- QC person (Stage 2)
- Buyer (Stages 2, 6)
- Accounts (Stages 7, 8)
- Management (Stage 2)
- Floor team (Stages 3, 5, 6)
- HO team (Stage 4)
- Inward team (Stages 4, 7)
- Merchandiser (Stage 4 queries)
- Store manager (Daily close)
- Ridham (Stage 8)
- Prateek (Hold write-off)
- Admin (Setup)

## 10. Designers Setup

Add designers in the `designers` table:

```sql
INSERT INTO designers (name, legal_name, alpha_vendor_code, whatsapp_group)
VALUES ('Designer Name', 'Full Legal Name', 'ALPHA-XXXX', '+1234567890');
```

## Troubleshooting

**RLS errors:** Check the `profiles` table has `roles` array populated with the correct role names.

**Edge function errors:** Verify `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are set correctly in the function environment.

**Auth errors:** Ensure Auth provider is configured and `profiles` table has matching UUID primary keys.