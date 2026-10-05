# T1DReach next-update improvements

Based on repository `c3d7d89` and read-only backend inspection on October 5, 2026.
Changes are on a separate branch. No App Store build, submission, EAS Update,
production migration, function deployment, or billing change was performed.

## Included app changes

- Tab badges and the focused notifications screen poll every 15 seconds, pause in
  the background, refresh on foreground, and wait for completion before the next
  scheduled request. Navigation and manual refresh still work. Badge freshness
  during idle foreground use is now up to 15 seconds rather than three seconds.
- Help checks the current user's responses in batches of 100 displayed request
  IDs instead of sending one RPC for every request.
- Community/Home/comment photo signing batches up to 100 distinct paths per
  request. Errors leave text content available.
- Community and post-detail Realtime bursts coalesce refresh requests and
  serialize the event-driven follow-up. This reduces repeated HTTP reads but
  does not reduce the underlying Realtime deliveries or RLS authorization work.
- Chats initially load 50 messages with a stable `(created_at,id)` cursor. The
  "Load earlier messages" control retrieves more, preserves realtime arrivals
  when appending, deduplicates IDs, and rejects stale page responses after blur.
- New Community photos use JPEG at at most 1600 pixels on their longest edge;
  new profile photos use JPEG at at most 512 pixels. Smaller images are not
  enlarged. Existing photos are retained. Conversion failure shows an error
  rather than uploading the original full-resolution asset.

## Validation

`node node_modules/typescript/bin/tsc --noEmit` passes.
`node --test tests/*.test.cjs` passes all 16 tests, including foreground lifecycle,
slow requests, event bursts, cursor timestamp ties, deduplication, batched signing,
batched Help reads and access failures. These use mocked service boundaries;
they do not assert live photo encoding, device layout, APNs delivery or backend
capacity. No production write was used for testing.

An optional local iOS JavaScript export was stopped after Metro startup; bundle
validation is unverified. No native Apple build was created.

Before building the next version, use an internal development build to check
portrait/landscape/HEIC photo selection, avatar replacement, a conversation with
more than 50 messages, simultaneous incoming messages and older-page loading,
blur/refocus while a request is pending, Help response indicators, notification
navigation, and background/foreground refresh. The repository's existing
`TESTING.md` contains historical SQL instructions; do not replay them against
production.

## Approval-dependent work

The full production-readiness audit was delivered separately. Backend policies,
push queue lifecycle and receipts, indexed feed statistics, remaining list
pagination, moderation/rate controls, backup/restore and plan choices require
additional reviewed work. The index candidate file in `docs/proposals/` is a
review artifact and is deliberately outside `supabase/migrations/`. It has not
been executed or tested against a disposable Postgres instance.

Never run a blanket `supabase db push` here: historical manual schema changes
are not completely represented in migration history, and
`041_prelaunch_test_data_cleanup.sql` contains destructive deletions. Reconcile
a safe schema baseline and apply only explicitly approved changes.
