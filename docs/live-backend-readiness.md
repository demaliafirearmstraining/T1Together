# Compatible backend changes — live 2026-10-05

The owner authorized live backend changes that work with the submitted App Store build. No app build, App Store action, EAS update, or client source/configuration change occurred. Client improvements remain in draft PR #1 until approval of the submitted app.

## Deployment record

Project: T1Together (`ovjjrjsupnehjtkalaho`).

| Change | Live identifier |
| --- | --- |
| Query indexes, freshness access, restricted update grants, photo visibility, privileged function access | migration `20261005175731_compatible_backend_readiness` |
| Cache request identity in 41 public/storage policies without changing predicates | migration `20261005180222_cache_request_identity_in_policies` |
| Account deletion cleanup | `delete-account` version 3, JWT required |
| Push lookup error handling and HTTP deadline | `push-dispatch` version 8, existing custom secret authentication retained |

Migration files were created with the CLI, then renamed to the actual versions returned by the migration service. Apply these files individually to another environment. **Do not run a blanket database push:** the historical migration backlog includes destructive prelaunch cleanup and does not match the production migration history.

## Behavior

- 19 indexes support conversation history, feeds, comments, unread counts, ownership/FK lookups, blocks, Supply Locker, and photo authorization. Existing indexes remain.
- A member can read only their own location update timestamp and ID. Coordinate columns remain inaccessible through direct authenticated reads. This fixes the existing client's freshness check.
- Direct membership updates may change only `last_read_at`; direct notification updates may change only `read_at`. Existing read-marking RPCs and the notification screen's direct updates remain available.
- Private Community photo signing follows visible posts/comments or the uploader's own folder, including drafts. Existing signed links retain their expiration; public avatars remain compatible.
- Anonymous execution of public privileged functions is revoked. Signed-in application RPCs retain their grants; trigger functions are internal.
- Request identity is evaluated once per policy statement, avoiding repeated calls for every row.
- Account deletion drains first-page batches of 100 objects, including nested folders and placeholders. Listing/removal failures stop deletion before removing the profile/sign-in account; a retry can continue cleanup. A 40-second budget, nesting bound, and batch bound avoid unbounded work.
- Push lookups for preferences, follow muting, Help status, and tokens propagate database errors into the existing retry path. Expo requests have a 10-second abort deadline. Branding, routes, categories, quiet-hours behavior, five-attempt policy, batch size, and schedule remain as before.
- Edge Functions use Supabase JS 2.116.0 with a checked-in Deno dependency lock.

## Verification

- 11 mocked regression tests passed, including 1,205-photo cleanup, nested objects, storage failure handling, account isolation, failed push lookups, successful push payload handling, and custom authentication.
- Deno 2.9.6 type checks passed for both deployed entrypoints.
- Live authenticated SQL compatibility checks passed: 19 indexes present, owner-only timestamp reads, coordinate read denial, membership/notification key update denial, read-marking RPCs, unread count, Community stats, Nearby, Supply Locker, and Storage policy query.
- Both live endpoints return HTTP 401 without authorization.
- Three recent scheduled dispatcher HTTP responses were 200 with dispatcher result bodies; the queue had zero pending jobs. This verifies an idle dispatch, not device delivery under load.
- The performance advisor's 36 request-identity warnings cleared. Remaining notices: 16 currently unused indexes (expected on a tiny database) and one overlapping permissive policy warning.
- Security advisor: no anonymous privileged-function warning; 23 signed-in privileged functions remain by design, a service-only outbox has no client policies by design, and leaked-password protection remains disabled.
- No real account was deleted and no synthetic notifications were sent to members. SQL checks roll back their transaction. There was no load test or physical-device notification/deletion test.

## Work still needed

**Launch priority:** review the full private-profile visibility boundary with a compatible identity model; configure/verify production email delivery; enable paid-plan password protection/backups and establish monitoring. Billing and Auth service settings were not changed.

**Next app update, after approval:** foreground polling, coalesced Realtime refresh, chat pagination, Help-response batching, batch photo signing, and bounded image compression from draft PR #1. Further privacy/schema changes must preserve author identity joins used by the submitted app.

**Further backend work:** push job claiming/leases, retry backoff, per-device ticket/receipt tracking, batching/concurrency with rate budgets, idempotent conversation creation, abuse limits, background fan-out, measured spatial query improvements, and reviewed retention/media cleanup. These need additional design and failure/load tests; this deployment does not claim to solve them.

The current Free plan remains the next capacity constraint: published 200 peak Realtime connections and 100 messages/second. These are connection/message limits, not a registered-user cap. The dispatcher still reads at most 100 jobs per one-minute scheduled run: 1,000 eligible recipient jobs need at least ten runs if no other jobs are queued, and slow requests can take longer. Indexes do not change those service/worker limits.

Sources: [Realtime limits](https://supabase.com/docs/guides/realtime/limits), [RLS identity caching](https://supabase.com/docs/guides/database/postgres/row-level-security#call-functions-with-select), [privileged-function advisor](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable), [password protection](https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection).

## Recovery

Before deployment, live versions 2 (account deletion) and 7 (push dispatch) were saved in the owner's local audit outputs. Redeploy those exact files with their original authentication settings if an Edge Function regression appears. Database changes are non-destructive; avoid reverting permissions casually. Indexes can be removed independently if measured write cost warrants it. Restore a specific policy/grant only after identifying the affected client request. No user rows were deleted by either migration.
