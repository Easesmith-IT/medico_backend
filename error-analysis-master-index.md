# Error Analysis Master Index

- generatedAt: 2026-05-09T12:52:49.167Z
- totalErrorRoutes: 142

## Totals by Classification
- Validation/Contract Failure: 29
- Confirmed Backend Bug: 87
- Not Found/Data Missing: 20
- Auth/Role Restriction: 5
- Unmounted Route: 1

## Totals by Priority
- P0: 3
- P1: 84
- P2: 6
- P3: 49

## Phase Mapping and Completion
- Phase 01: Completed | routes=18 | modules=admin
- Phase 02: Completed | routes=18 | modules=admin, doctor
- Phase 03: Completed | routes=18 | modules=doctor, patient
- Phase 04: Completed | routes=18 | modules=patient, booking
- Phase 05: Completed | routes=11 | modules=booking, serviceProvider
- Phase 06: Completed | routes=18 | modules=items, service
- Phase 07: Completed | routes=12 | modules=items, service, city, geo
- Phase 08: Completed | routes=18 | modules=article, socialPost
- Phase 09: Completed | routes=8 | modules=invoice, payments
- Phase 10: Completed | routes=3 | modules=check-status, crash-report, uploadfile

## Cross-Phase Deduplicated Bug Clusters
- (77) Unhandled backend runtime failure in controller/middleware path.
- (29) Controller input validation rejected missing/invalid request fields for this payload.
- (20) Requested entity/resource ID was not found in DB for this route.
- (5) Route is protected by role middleware and current role/session is not allowed.
- (4) Controller assumes object/method shape that does not exist in current schema/model instance.
- (3) Missing variable/model import referenced in controller at runtime.
- (1) Referenced mongoose model is not imported/registered before use.
- (1) Controller destructures fields from undefined request body.
- (1) Route param/query is being parsed as ObjectId where literal/invalid value is passed.
- (1) Route exists in route file but is not mounted in route/index.js.