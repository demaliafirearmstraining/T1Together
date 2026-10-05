# T1DReach V1 test pass

Use a provisioned disposable backend for smoke tests. Historical migrations were
applied manually; do not replay them against production or run a blanket database
push. In particular, migration 041 deletes community activity. The existing
development EAS environment points at production, so confirm backend isolation
before creating load-test data or testing deletion.

For next-update validation and the automated checks, see
[next-update-readiness.md](docs/next-update-readiness.md).

## Smoke test order
1. Sign in and confirm an existing completed profile opens Home rather than Onboarding.
2. Edit Profile & Settings; toggle Helper Mode.
3. Create a Community post; open it; add Support and a comment.
4. Search for the post and for another member.
5. Open Nearby; toggle Helpers only; open a member profile.
6. Start a private conversation; send messages in both directions.
7. Create a normal Supply request and a T1 Beacon request.
8. From a second account, respond “I can help.”
9. From the request owner, open View responses and start a message with the responder.
10. Mark the request resolved.
11. Report a post/member and test block/unblock.
12. Confirm blocked members disappear from profile/community/help discovery.

## Expected privacy behavior
- Public/community UI shows city/region, never exact GPS or home address.
- Beacon responses are visible only to the requester and responder.
- A blocked relationship prevents new conversations and hides community discovery/content.
- Adult accounts represent minors.

## Known pre-release work
- Production email-confirmation deep link/redirect.
- Push notification registration and delivery.
- App-store assets, legal/privacy documents, and moderation/admin tooling.
- True proximity ranking using privacy-preserving approximate location data.
