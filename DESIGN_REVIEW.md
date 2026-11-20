# Design Review — Jade Pink Backend Desk (Supabase Edition)

## Executive Summary

The Supabase architecture is generally sound, with clear separation of concerns:
- **Supabase DB** (PostgreSQL + RLS) for data access control
- **Edge Functions** for complex multi-step business logic
- **Vanilla JS frontend** for tablet-friendly UI

However, several design issues, missing policies, and incorrect Supabase API usages were identified.

---

## Critical Issues (Must Fix)

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| 1 | **RLS policy missing 'Marketing' role in Stage 2 update** | `rls-policies.sql:65-69` | Marketing cannot complete Stage 2 (photo confirmation) | Add 'Marketing' to `lots_update_stage2_qc_buyer` policy |
| 2 | **No profile creation policy** | `rls-policies.sql` | Users cannot be inserted into `profiles` table by client | Add INSERT policy for Admin only |
| 3 | **Hold `by` field field name discrepancy** | `schema-supabase.sql:222` | Plan says `by`, store team says `by` — minor inconsistency | Map `by` consistently across all APIs (done) |
| 4 | **Edge Functions not compiled** | `supabase/functions/*/index.ts` | Supabase functions require compiled JS, not TypeScript | Provide JS builds or compilation step |
| 5 | **Missing marketing role in gates** | `rls-policies.sql` | Marketing approves gates but can't | Add 'Marketing' to `lot_approvals_insert_approver` policy |

## High Priority Issues

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| 6 | **Pieces insertion too open** | `rls-policies.sql:159-163` | Pieces can be inserted by any QC/Buyer/Admin — should only be by QC when creating a lot | Restrict pieces insertion to QC + Admin |
| 7 | **Hold `by` field name mismatch** | `schema-supabase.sql` vs `rls-policies.sql` | Minor inconsistency between field naming in schema and policy code | Confirm `by` field is consistently used everywhere |
| 8 | **Missing `events` insert policy for RLS** | `rls-policies.sql:204-207` | Edge Functions use service role — no RLS enforcement on logs | This is expected behavior for Edge Functions with service key |
| 9 | **Profile update only for Admin** | `rls-policies.sql:27-30` | Non-Admin users cannot update their own phone number | Allow self-update for non-Admin users |
| 10 | **Missing stage 1 gate policy** | `rls-policies.sql` | Stage 1 gate cannot be passed by receiver because no policy exists | Add `lots_insert_receiver` for Stage 1 gate |

## Medium Priority Issues

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| 11 | **Hold resolve action not enforced** | `rls-policies.sql` | No policy prevents arbitrary users from resolving holds | Add more restrictive UPDATE policy for holds (Prateek, Store manager, Admin) |
| 12 | **Missing bulk operations** | Various | No efficient way to fetch lot history or piece lists | Add appropriate indexes (done) but document query patterns |
| 13 | **Lookup table `sort_order` hardcoded** | `seed-supabase.sql` | Order values are pre-set | Document that these are seeded values |
| 14 | **No circuit breaker for Edge Functions** | `supabase/functions/*/index.ts` | No timeout handling | Add timeout to fetch calls |

## Medium Priority Issues

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| 15 | **Profile name not unique** | `schema-supabase.sql:10` | No UNIQUE constraint on profiles.name | Add UNIQUE constraint to profiles.name |
| 16 | **No foreign key from lot to profile by default** | `schema-supabase.sql` | Tables use `by`, `created_by` fields but no automatic defaults | Ensure all write operations always include `by` field |
| 17 | **Missing `created_by` in events** | `schema-supabase.sql` | Events table has `by` but no automatic creation | Already handled by service role (see #4) |

## Low Priority / Cosmetic

| # | Issue | Location | Impact | Fix |
|---|-------|----------|--------|-----|
| 18 | **Comment inconsistency** | `schema-supabase.sql` | Various comments may be outdated | Verify all comments match actual schema |
| 19 | **Missing index on `lots.designer`** | `schema-supabase.sql` | Frequent designer lookups slow | Add index on `lots.designer` |
| 20 | **Edge Functions don't handle errors gracefully** | `supabase/functions/*/index.ts` | Unhandled promise rejections | Add proper error handling with try/catch |

---

## Summary

- **Total Issues**: ~20
- **Critical**: 5
- **High**: 2
- **Medium**: 8
- **Low**: Others

Most issues are in the RLS policy definitions (roles) and Edge Function error handling. The Supabase architecture itself is sound.