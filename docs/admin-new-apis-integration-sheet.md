# Admin New APIs - Frontend Integration Sheet

Scope: New admin-facing APIs added in recent backend updates (May 12-19, 2026) in `medico_backend`.
Base URL: `/api/v1`

## Integration Basics

- Auth: routes are protected with `protect(...)`; send the existing admin auth token/cookie used by your panel.
- Content-Type: `application/json` for request bodies unless endpoint is file-download.
- Common success envelope (most JSON endpoints):

```json
{
  "success": true,
  "message": "...",
  "data": {}
}
```

- Common error envelope (varies by controller):

```json
{
  "success": false,
  "message": "...",
  "code": "OPTIONAL_CODE"
}
```

## 1) Governance and Security APIs

### GET `/admin/sessions/me`
- Auth roles: `superadmin`, `subadmin`
- Query: none
- Body: none
- Success data keys:
  - `results`
  - `data[]`: `_id`, `userAgent`, `ipAddress`, `isCurrentSession`, `revokedAt`, `expiresAt`, `lastSeenAt`, `createdAt`

### DELETE `/admin/sessions/:sessionId`
- Auth roles: `superadmin`, `subadmin`
- Path params: `sessionId`
- Body: none
- Success: `message`, `success`

### DELETE `/admin/sessions/me/all`
- Auth roles: `superadmin`, `subadmin`
- Body: none
- Success data keys: `modifiedCount`

### POST `/admin/subadmins/:id/force-logout`
- Auth roles: `superadmin`, `subadmin`
- Path params: `id` (target admin id)
- Body: none
- Success data keys: `targetAdminId`, `revokedSessions`

### PATCH `/admin/profile/password`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "currentPassword": "string",
  "newPassword": "string (min 8)"
}
```

- Success: `message`, `success`

### POST `/admin/mfa/setup`
- Auth roles: `superadmin`, `subadmin`
- Body: none
- Success data keys:
  - `secret`, `algorithm`, `digits`, `periodSeconds`, `otpPreviewForTesting`

### POST `/admin/mfa/verify`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "otp": "string"
}
```

- Success data keys: `mfaEnabled`, `mfaVerifiedAt`

### POST `/admin/mfa/disable`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "otp": "string"
}
```

- Notes:
  - If policy enforces MFA, disable is rejected.
  - OTP required when MFA is currently enabled.

### PATCH `/admin/security-policy`
- Auth roles: route allows `superadmin`, `subadmin`, but controller enforces only `superadmin`
- Body (partial patch):

```json
{
  "passwordRotationDays": 90,
  "mfaRequiredForAdmins": true
}
```

- Validation:
  - `passwordRotationDays` between `1` and `365`
- Success data: updated policy document

### GET `/admin/audit-logs`
- Auth roles: `superadmin`, `subadmin`
- Query:
  - `page`, `limit`
  - `action`, `severity`, `actorAdminId`
  - `fromDate`, `toDate`
- Success data:
  - `results`
  - `pagination`: `total`, `page`, `limit`, `pages`
  - `data[]`: audit log rows

### GET `/admin/audit-logs/export`
- Auth roles: `superadmin`, `subadmin`
- Query:
  - `action`, `severity`, `actorAdminId`, `fromDate`, `toDate`
- Success data:
  - `data.total`
  - `data.rows[]` with flattened export rows

### GET `/admin/audit/profile-changes`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query:
  - `targetRole`, `targetId`, `actorId`
  - `from`, `to`
  - `page`, `limit`
- Success data:
  - `data[]`
  - `pagination`: `page`, `limit`, `total`, `totalPages`

## 2) Treatment Management APIs

### GET `/admin/patients/:patientId/treatments`
- Auth roles: `superadmin`, `subadmin`, `admin`
- Path params: `patientId`
- Query: `serviceId` (optional)
- Success data:
  - `count`
  - `data[]`: `_id`, `patientId`, `serviceId`, `servicePartnerId`, `status`, `currentBookingId`, `startDate`, `endDate`, `validTill`, `createdAt`, `updatedAt`, `sessionsCount`

### GET `/admin/treatments`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query filters:
  - `page`, `limit`
  - `status`, `patientId`, `serviceId`, `servicePartnerId`
  - `search`, `cityId`
  - `validFrom`, `validTo`
  - `hasCurrentBooking` (`true|false`)
  - `isActive` (`true|false`)
- Success data:
  - `page`, `limit`, `totalCount`, `totalPages`
  - `data[]` keys:
    - `_id`, `status`, `isActive`, `startDate`, `endDate`, `validTill`, `updatedAt`, `createdAt`
    - `patient`, `service`, `provider`, `currentBooking`
    - `sessions`: `total`, `completed`, `pending`
    - `progressPercentage`
    - `payment`: `paymentId`, `paymentStatus`, `remainingBalance`, `totalBillAmount`, `totalPaid`, `totalRefunded`
    - `invoice`
    - `allowedActions`

### GET `/admin/treatments/:treatmentId`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Path params: `treatmentId`
- Success data keys:
  - treatment base fields
  - `chain`: `previousBooking`, `currentBooking`, `nextBooking`, `sessions`
  - `sessions`: `total`, `completed`, `pending`
  - `progressPercentage`
  - `payment` summary
  - `invoice`
  - `allowedActions`
  - `recommendations`

### PATCH `/admin/treatments/:treatmentId/status`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "targetStatus": "Active|InProgress|Completed|Expired|Cancelled",
  "reason": "required when expiring",
  "validTill": "required when activating"
}
```

- Success data: `_id`, `status`, `validTill`

### POST `/admin/treatments/:treatmentId/complete`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "equipment": []
}
```

- Success data keys:
  - `alreadyCompleted`, `treatmentId`, `bookingId`, `invoiceId`, `status`

## 3) Reporting and Command Center APIs

### GET `/admin/reports/command-center`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: consumed by analytics builder (`buildCommandCenterPayload`) for dashboard filters
- Success data: command-center payload object

### GET `/admin/reports/filter-options`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Success data keys:
  - `cities[]`, `services[]`
  - `grains`: `day|week|month`
  - `formats`: `csv|json`
  - `scheduleFrequencies`: `daily|weekly|monthly`

### GET `/admin/reports/command-center/export`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query:
  - same filters as command-center payload
  - `format`: `csv|json` (default `csv`)
- Response: file download (`Content-Disposition` attachment)

### POST `/admin/reports/schedules`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "name": "Weekly Command Center",
  "reportType": "command-center",
  "filters": {},
  "frequency": "daily|weekly|monthly",
  "format": "csv|json",
  "active": true
}
```

- Success: `201`, `data` schedule document

### GET `/admin/reports/schedules`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: `page`, `limit`, `active=true|false`
- Success data:
  - `data[]` schedule docs with `latestRun`
  - `pagination`

### PATCH `/admin/reports/schedules/:scheduleId`
- Auth roles: `superadmin`, `subadmin`
- Body (partial): `name`, `frequency`, `format`, `filters`, `active`
- Success: updated schedule in `data`

### POST `/admin/reports/schedules/:scheduleId/run`
- Auth roles: `superadmin`, `subadmin`
- Body: none
- Success data: run document

### POST `/admin/reports/schedules/run-due`
- Auth roles: `superadmin`, `subadmin`
- Body: none
- Success data:
  - `total`, `completed`, `failed`, `results[]`

### GET `/admin/reports/runs`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: `page`, `limit`, `status`, `scheduleId`
- Success data: `data[]` run list + `pagination`

### GET `/admin/reports/runs/:runId/download`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Path params: `runId`
- Response: file download via `res.download(...)`

## 4) Admin Payment Workbench APIs

Base route prefix: `/api/v1/admin/payments`

### GET `/ledgers`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query:
  - pagination: `page`, `limit`
  - sort: `sortBy`, `sortOrder`
  - plus ledger filters consumed by aggregation base (`payment/treatment/patient/provider/service/city/status/date` filters)
- Success data:
  - `data[]` ledger rows
  - `pagination`

### GET `/ledgers/:paymentId`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Path params: `paymentId`
- Success data keys:
  - payment ledger core fields
  - `service`
  - `paymentHealth`
  - `settlementSummary`
  - `timeline[]`
  - `bookingSummaries[]`

### GET `/transactions`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query:
  - pagination: `page`, `limit`
  - filters: `status`, `method`, `stage`, `fromDate`, `toDate` + base ledger filters
- Success data:
  - `data[]`: `transactionId`, `paymentId`, `treatmentId`, patient/provider mini objects, `amountPaid`, `method`, `stage`, `status`, `currency`, timestamps
  - `pagination`

### GET `/refunds`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query:
  - pagination: `page`, `limit`
  - filters: `status`, `mode`, `refundType`, `fromDate`, `toDate` + base ledger filters
- Success data:
  - `data[]`: `refundId`, `paymentId`, `treatmentId`, patient/provider mini objects, `amount`, `status`, `mode`, `refundType`, `reason`, `note`, timestamps
  - `pagination`

### POST `/treatments/:treatmentId/manual-collection`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "amount": 500,
  "method": "Cash|UPI|Card|BankTransfer",
  "stage": "Advance|Partial|Final",
  "note": "optional",
  "referenceNumber": "optional"
}
```

- Success data: ledger response (`buildLedgerResponse(payment)`)

### POST `/treatments/:treatmentId/refunds/manual`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "amount": 300,
  "reason": "string",
  "mode": "string",
  "refundType": "Full|Partial",
  "note": "optional",
  "referenceTransactionId": "optional"
}
```

- Success data: ledger response (`buildLedgerResponse(payment)`)

### POST `/settlements`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "paymentId": "ObjectId",
  "treatmentId": "ObjectId",
  "servicePartnerId": "ObjectId",
  "amountRequested": 1000,
  "notes": "optional"
}
```

- Success: `201`, settlement request in `data`

### GET `/settlements`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: `page`, `limit`, `status`, `providerId`, `paymentId`
- Success data: settlement rows + pagination

### PATCH `/settlements/:settlementId/status`
### PATCH `/settlements/:id`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "status": "Approved|Rejected|Paid",
  "action": "approve|reject|mark-paid|markPaid",
  "amountApproved": 900,
  "payoutReference": "required when status=Paid",
  "notes": "optional"
}
```

- Notes:
  - Transition rules: `Pending -> Approved/Rejected`, `Approved -> Paid`.

### POST `/disputes`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "paymentId": "ObjectId",
  "treatmentId": "ObjectId",
  "referenceType": "ledger",
  "referenceId": "optional",
  "category": "General",
  "description": "required",
  "assignedToAdminId": "optional",
  "evidenceUrls": []
}
```

- Success: `201`, dispute in `data`

### GET `/disputes`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: `page`, `limit`, `status`, `category`, `paymentId`
- Success data: dispute rows + pagination

### PATCH `/disputes/:disputeId/status`
- Auth roles: `superadmin`, `subadmin`
- Body:

```json
{
  "status": "UnderReview|Resolved|Rejected",
  "resolution": "optional",
  "assignedToAdminId": "optional"
}
```

- Notes:
  - Transition rules: `Open -> UnderReview/Resolved/Rejected`, `UnderReview -> Resolved/Rejected`.

### GET `/summary`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Success data keys:
  - `ledger`: totals and payment-status counters
  - `settlement`: totals/counters + amount aggregates
  - `dispute`: totals/counters

### GET `/export`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query:
  - `type=ledgers|transactions|refunds|settlements|disputes`
  - plus relevant filters
- Response: CSV file download

## 5) Ops / Verification / Support / Moderation APIs

### GET `/admin/actions/logs`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query:
  - `page`, `limit`
  - `actorId`, `entityType`, `actionType`
  - `from`, `to`
- Success data: `data[]`, `pagination`

### GET `/admin/ops/queues`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: none
- Success data keys:
  - `verificationPending`, `settlementsPending`, `supportOpen`, `reviewsPending`, `totalPending`

### GET `/admin/doctors/verification-queue`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: `status` (default `pending`)
- Success data: doctor list (`data[]`)

### GET `/admin/doctors/verification-expiring`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: `days` (default `30`)
- Success data: doctors with expiring `verificationDocuments`

### PATCH `/admin/doctors/:id/verification-review`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Body:

```json
{
  "status": "approved|rejected|pending",
  "documentReviews": [
    {
      "docType": "license",
      "status": "approved|rejected|pending",
      "rejectionReason": "optional"
    }
  ],
  "verificationNotes": "optional",
  "rejectionReason": "optional"
}
```

- Success data: `data.doctor`

### GET `/admin/support/tickets`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Query: `status`, `priority`, `assignee`
- Success data: tickets list in `data[]`

### PATCH `/admin/support/tickets/:id`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Body (any of): `priority`, `status`, `assigneeId`, `category`
- Success data: `data.ticket`

### PATCH `/admin/reviews/:id/moderation`
- Auth roles: `admin`, `superadmin`, `subadmin`
- Body:

```json
{
  "status": "pending|approved|rejected|hidden"
}
```

- Success data: `data.review`

## Frontend Implementation Notes

- Handle both JSON APIs and file-download APIs separately in your API client.
- For settlement update, frontend should drive valid transitions only; backend rejects invalid transitions.
- For treatment status updates, enforce UI validations:
  - `validTill` required on activation.
  - `reason` required on expiry.
- For list endpoints, persist filter state and pagination state in URL query params for shareable admin views.
