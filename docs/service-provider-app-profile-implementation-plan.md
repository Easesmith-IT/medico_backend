# Service Provider App Profile API - Final Implementation Plan

Scope: Add app-side self-profile APIs for logged-in service providers without changing any existing API contract, schema, or current admin/provider flow.

Base URL: `/api/v1/serviceProvider`

## Non-Negotiable Constraints

- Do not change existing route paths.
- Do not change existing request/response shapes of current APIs.
- Do not change any schema in `models/`.
- Do not change auth/token behavior.
- Do not change admin-side provider APIs.
- Do not change provider login flow.
- Add only new app-side self-profile APIs.

## New APIs To Add

### GET `/profile`

- Purpose: fetch logged-in service provider's own profile for app use.
- Auth: `protect("serviceprovider")`
- Provider source: `req.user.id` or `req.user._id`
- Notes:
  - Must not accept provider id in params or query.
  - Must not include admin analytics payload like booking stats or upcoming bookings.

Success response:

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {}
}
```

### PATCH `/profile`

- Purpose: partial self-profile edit for app use.
- Auth: `protect("serviceprovider")`
- Content-Type:
  - `application/json`
  - `multipart/form-data` when uploading `profilePhoto`
- Provider source: `req.user.id` or `req.user._id`
- Notes:
  - Must update only allowed fields.
  - Must not overwrite omitted nested fields.
  - Must reject restricted fields explicitly with `400`.

Success response:

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "provider": {},
    "updatedFields": []
  }
}
```

## File-By-File Checklist

### 1) `route/serviceProvider.js`

Add only these routes:

- `router.get("/profile", protect("serviceprovider"), serviceProviderController.getMyProfile);`
- `router.patch("/profile", protect("serviceprovider"), serviceProviderImageUpload, serviceProviderController.updateMyProfile);`

Rules:

- Reuse existing `serviceProviderImageUpload`.
- Do not modify any existing route path, middleware, or controller mapping.
- Do not replace current admin `GET /service-provider/:id` or `PUT /service-provider/:id`.

### 2) `controller/providerController.js`

Add only these new controller methods:

- `exports.getMyProfile`
- `exports.updateMyProfile`

Do not modify behavior of:

- `exports.loginServiceProvider`
- `exports.getServiceProviderById`
- `exports.updateServiceProvider`
- `exports.updateServiceProviderWorkflow`
- `exports.deleteServiceProvider`
- appointment APIs

#### `getMyProfile` Checklist

- Resolve provider id from token.
- Query `ServiceProvider.findById(...)`.
- Populate:
  - `services.serviceId`
  - `serviceCities`
- Exclude:
  - `password`
- Return profile-only payload.
- Do not attach:
  - `bookingStats`
  - `upcomingBookings`

#### `updateMyProfile` Checklist

- Resolve provider id from token only.
- Load existing provider first.
- Parse multipart JSON-string fields safely.
- Build update object only from whitelisted fields actually present in request.
- Never default omitted fields to `{}` or `[]`.
- Merge nested objects instead of replacing entire object unless fully provided.
- If `permanentAddress.sameAsCurrent === true`, copy from updated/current address shape.
- If `req.files.profilePhoto` exists:
  - upload file using existing upload flow
  - set `documents.profilePhoto`
- Return updated provider plus `updatedFields`.

## Exact Allowed Fields In `PATCH /profile`

### Direct Scalar Fields

- `firstName`
- `lastName`
- `ownerName`
- `alternateNumber`
- `landline`
- `about`

### Direct Array Fields

- `languages`

### Direct Nested Object Fields

#### `currentAddress`

- `street`
- `locality`
- `city`
- `state`
- `country`
- `pincode`
- `landmark`

#### `permanentAddress`

- `street`
- `locality`
- `city`
- `state`
- `country`
- `pincode`
- `landmark`
- `sameAsCurrent`

#### `workAddress`

- `clinicName`
- `street`
- `locality`
- `city`
- `state`
- `country`
- `pincode`
- `landmark`

#### `availability`

- `days`
- `timeSlots`
- `available24x7`

#### `emergencyContact`

- `name`
- `relationship`
- `mobile`

#### `bankDetails`

- `accountHolderName`
- `accountNumber`
- `ifscCode`
- `bankName`
- `branchName`
- `upiId`

### Allowed Upload Field

- `profilePhoto`

## Restricted Fields In `PATCH /profile`

Reject with `400` if request tries to update any of these:

- `_id`
- `id`
- `password`
- `email`
- `mobile`
- `registrationNumber`
- `qualification`
- `registrationCouncil`
- `yearsOfExperience`
- `services`
- `serviceCities`
- `approvalStatus`
- `approvedBy`
- `rejectionReason`
- `suspensionReason`
- `isActive`
- `isVerified`
- `isAvailable`
- `rating`
- `averageRating`
- `totalReviews`
- `following`
- `followingCount`
- `savedPosts`
- `isDeleted`
- `deletedAt`
- `deletedBy`
- `createdAt`
- `updatedAt`
- `__v`
- `tokenVersion`
- `documents.identityProof`
- `documents.addressProof`
- `documents.educationalCertificates`
- `documents.professionalCertificates`
- `documents.registrationCertificate`
- `documents.experienceCertificates`
- `documents.policeVerification`

Recommended error:

```json
{
  "success": false,
  "message": "This field is not editable from app profile API"
}
```

## Validation Checklist For `updateMyProfile`

### Strings

- Trim string inputs where applicable.
- Reject empty strings for fields that are explicitly provided but required to be meaningful, such as:
  - `firstName`
  - `lastName`
  - `accountHolderName`
  - `accountNumber`
  - `ifscCode`

### Phone Fields

- `alternateNumber`: validate 10 digits if provided.
- `emergencyContact.mobile`: validate 10 digits if provided.
- `landline`: validate only if provided using current schema-compatible pattern.

### Address Fields

- Validate `pincode` as 6 digits when present.
- Do not require full object if only partial address patch is sent.

### Languages

- Must be an array of strings.

### Availability

- `days` must contain only:
  - `Monday`
  - `Tuesday`
  - `Wednesday`
  - `Thursday`
  - `Friday`
  - `Saturday`
  - `Sunday`
- `timeSlots` must be an array of objects with:
  - `startTime`
  - `endTime`

### Bank Details

- Allow partial update.
- Merge only provided child keys into existing `bankDetails`.
- Reject empty object: `{}`.
- Normalize `ifscCode` with `trim()` and uppercase before save.

### Empty Payload

- Reject request with no valid allowed fields.

Recommended error:

```json
{
  "success": false,
  "message": "No valid fields provided for update"
}
```

## Safe Merge Rules

### General Rule

- Only update fields present in request.
- Omitted fields must remain unchanged in DB.

### Nested Objects

Merge these field-by-field:

- `currentAddress`
- `permanentAddress`
- `workAddress`
- `availability`
- `emergencyContact`
- `bankDetails`

### Arrays

Replace only if field is present:

- `languages`

### Documents

- Only allow changing `documents.profilePhoto`.
- Do not touch any other document keys in this phase.

## Internal Helper Checklist In `controller/providerController.js`

Add small private helpers if needed, but keep them local to this file unless reuse is clearly necessary.

Suggested helpers:

- `parseJsonIfNeeded(value, fallback)`
- `pickAllowedProfilePatch(body)`
- `mergeAllowedKeys(existing, incoming, allowedKeys)`
- `validateProfilePatch(updateData)`
- `hasRestrictedFields(body)`
- `sanitizeProviderProfileResponse(provider)`

## Files That Must Not Change

Do not edit these for this implementation:

- `models/serviceProviderModel.js`
- `models/profileAuditLogModel.js`
- `utils/profileAudit.js`
- `middleware/auth.js`
- any other route file

Reason:

- current auth already supports `serviceprovider`
- schema already contains required fields
- audit/schema changes are outside this phase

## Verification Checklist

### Existing Flow Safety

- Provider login still works unchanged.
- Existing admin provider APIs still work unchanged.
- Existing appointment APIs still work unchanged.

### New API Validation

- `GET /api/v1/serviceProvider/profile` returns logged-in provider only.
- `PATCH /api/v1/serviceProvider/profile` updates only whitelisted fields.
- Partial `currentAddress` patch does not wipe untouched address keys.
- Partial `bankDetails` patch does not wipe untouched bank fields.
- `profilePhoto` upload works through multipart patch.
- Restricted fields return `400`.
- Empty payload returns `400`.

## Final Delivery Boundary

This phase delivers only:

- `GET /api/v1/serviceProvider/profile`
- `PATCH /api/v1/serviceProvider/profile`

with support for:

- basic profile fields
- address fields
- availability
- emergency contact
- `bankDetails`
- `profilePhoto`

This phase does not deliver:

- email/mobile change flow
- KYC document edits
- professional detail edits
- service/service-city remapping
- approval workflow updates
- audit model/schema updates
