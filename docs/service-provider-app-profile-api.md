# Service Provider App Profile APIs - Integration Sheet

Scope: App-side self-profile APIs for logged-in service providers.

Base URL: `/api/v1/serviceProvider`

## Authentication

- Both APIs require an authenticated `serviceprovider` session.
- Use the existing provider login API first:

### POST `/login`

Request:

```json
{
  "email": "provider@example.com",
  "password": "your-password"
}
```

Success response:

```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "id": "6a3bd55b894f1dfdb281e094",
    "firstName": "Codex",
    "role": "serviceprovider",
    "accessToken": "jwt-token",
    "refreshToken": "jwt-token"
  }
}
```

Notes:

- Backend also sets auth cookies on successful login.
- For app integration, send the auth cookie or bearer token according to your app auth setup.

## 1) GET `/profile`

Purpose: Fetch logged-in service provider's own profile.

Auth:

- Required
- Role: `serviceprovider`

Request body:

- None

Query params:

- None

Success response:

```json
{
  "success": true,
  "message": "Profile fetched successfully",
  "data": {
    "_id": "6a3bd55b894f1dfdb281e094",
    "firstName": "Codex",
    "lastName": "Provider",
    "ownerName": "Codex Test",
    "age": 30,
    "dateOfBirth": "1995-01-01T00:00:00.000Z",
    "gender": "Male",
    "mobile": "9191919191",
    "alternateNumber": "",
    "landline": "",
    "email": "codex.provider.test@example.com",
    "currentAddress": {
      "street": "A-1",
      "locality": "Center",
      "city": "Lucknow",
      "state": "UP",
      "country": "India",
      "pincode": "226001",
      "landmark": "Near Test"
    },
    "permanentAddress": {
      "street": "A-1",
      "locality": "Center",
      "city": "Lucknow",
      "state": "UP",
      "country": "India",
      "pincode": "226001",
      "landmark": "Near Test",
      "sameAsCurrent": true
    },
    "workAddress": {
      "clinicName": "Codex Test Desk",
      "street": "B-2",
      "locality": "Center",
      "city": "Lucknow",
      "state": "UP",
      "country": "India",
      "pincode": "226001",
      "landmark": "Near Test"
    },
    "services": [
      {
        "_id": "subdoc-id",
        "serviceId": {
          "_id": "6a03248b28ee1195704f4542",
          "name": "Home Nursing Care"
        },
        "serviceName": "Home Nursing Care",
        "experienceYears": 3,
        "specialization": "General"
      }
    ],
    "qualification": "BSc Nursing",
    "registrationNumber": "CODEX-SP-TEST-001",
    "registrationCouncil": "State Council",
    "yearsOfExperience": 5,
    "documents": {
      "profilePhoto": "https://cdn.example.com/profile.jpg",
      "identityProof": {
        "verified": false
      },
      "addressProof": {
        "verified": false
      },
      "registrationCertificate": {
        "verified": false
      },
      "policeVerification": {
        "verified": false
      },
      "educationalCertificates": [],
      "professionalCertificates": [],
      "experienceCertificates": []
    },
    "bankDetails": {
      "accountHolderName": "Codex Provider",
      "accountNumber": "123456789012",
      "ifscCode": "SBIN0001234",
      "bankName": "State Bank",
      "branchName": "Main",
      "upiId": "codex@testupi"
    },
    "availability": {
      "days": ["Monday", "Tuesday"],
      "timeSlots": [
        {
          "_id": "timeslot-subdoc-id",
          "startTime": "09:00",
          "endTime": "12:00"
        }
      ],
      "available24x7": false
    },
    "serviceCities": [
      {
        "_id": "6a02f3dea924e2b2a433f28a",
        "name": "Lucknow"
      }
    ],
    "approvalStatus": "Approved",
    "isActive": true,
    "isVerified": true,
    "isAvailable": true,
    "emergencyContact": {
      "name": "Emergency Contact",
      "relationship": "Brother",
      "mobile": "9090909090"
    },
    "languages": ["Hindi", "English"],
    "about": "",
    "rating": {
      "average": 0,
      "totalReviews": 0
    },
    "averageRating": 0,
    "totalReviews": 0,
    "createdAt": "2026-06-24T13:03:23.000Z",
    "updatedAt": "2026-06-24T13:03:23.000Z"
  }
}
```

Notes:

- `password` is not returned.
- `services.serviceId` is populated.
- `serviceCities` is populated.
- This API does not return `bookingStats` or `upcomingBookings`.

Common errors:

```json
{
  "success": false,
  "message": "Authentication required"
}
```

```json
{
  "success": false,
  "message": "Service provider not found"
}
```

## 2) PATCH `/profile`

Purpose: Partially update logged-in service provider's own profile.

Auth:

- Required
- Role: `serviceprovider`

Supported content types:

- `application/json`
- `multipart/form-data` when uploading `profilePhoto`

### Editable Fields

Top-level string fields:

- `firstName`
- `lastName`
- `ownerName`
- `alternateNumber`
- `landline`
- `about`

Array fields:

- `languages`

Object fields:

- `currentAddress`
- `permanentAddress`
- `workAddress`
- `availability`
- `emergencyContact`
- `bankDetails`

Upload field:

- `profilePhoto`

### Child Keys Allowed Inside Object Fields

`currentAddress`

- `street`
- `locality`
- `city`
- `state`
- `country`
- `pincode`
- `landmark`

`permanentAddress`

- `street`
- `locality`
- `city`
- `state`
- `country`
- `pincode`
- `landmark`
- `sameAsCurrent`

`workAddress`

- `clinicName`
- `street`
- `locality`
- `city`
- `state`
- `country`
- `pincode`
- `landmark`

`availability`

- `days`
- `timeSlots`
- `available24x7`

`emergencyContact`

- `name`
- `relationship`
- `mobile`

`bankDetails`

- `accountHolderName`
- `accountNumber`
- `ifscCode`
- `bankName`
- `branchName`
- `upiId`

### JSON Request Example

```json
{
  "firstName": "Codex",
  "about": "Experienced home-care provider",
  "languages": ["Hindi", "English"],
  "availability": {
    "days": ["Monday", "Tuesday", "Wednesday"],
    "timeSlots": [
      {
        "startTime": "09:00",
        "endTime": "13:00"
      }
    ],
    "available24x7": false
  },
  "bankDetails": {
    "branchName": "Hazratganj Branch",
    "accountHolderName": "Codex Provider"
  }
}
```

### Multipart Request Example

Use `multipart/form-data` if updating `profilePhoto`.

Fields example:

- `firstName`: `Codex`
- `about`: `Experienced home-care provider`
- `bankDetails`: `{"branchName":"Hazratganj Branch","accountHolderName":"Codex Provider"}`
- `profilePhoto`: binary file

Example `curl`:

```bash
curl --request PATCH "http://localhost:5000/api/v1/serviceProvider/profile" \
  --header "Cookie: accessToken=...; refreshToken=..." \
  --form "firstName=Codex" \
  --form "about=Experienced home-care provider" \
  --form "bankDetails={\"branchName\":\"Hazratganj Branch\",\"accountHolderName\":\"Codex Provider\"}" \
  --form "profilePhoto=@/path/to/profile.jpg"
```

### Success Response

```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "provider": {
      "_id": "6a3bd55b894f1dfdb281e094",
      "firstName": "Codex",
      "lastName": "Provider",
      "ownerName": "Codex Test",
      "about": "Experienced home-care provider",
      "bankDetails": {
        "accountHolderName": "Codex Provider",
        "accountNumber": "123456789012",
        "ifscCode": "SBIN0001234",
        "bankName": "State Bank",
        "branchName": "Hazratganj Branch",
        "upiId": "codex@testupi"
      },
      "languages": ["Hindi", "English"]
    },
    "updatedFields": [
      "firstName",
      "about",
      "bankDetails",
      "languages"
    ]
  }
}
```

Notes:

- `updatedFields` contains only the fields actually accepted and updated.
- Nested object updates are merged. Omitted child keys are preserved.
- Example: if you send only `bankDetails.branchName`, other bank fields like `accountNumber` remain unchanged.
- If `bankDetails.ifscCode` is sent, backend stores it in uppercase.
- If `permanentAddress.sameAsCurrent` is `true`, backend copies the current address into permanent address.

## Validation Rules

### Phone and Contact

- `alternateNumber`: must be 10 digits if sent
- `emergencyContact.mobile`: must be 10 digits if sent
- `landline`: must be 6 to 12 digits if sent

### Address

- `currentAddress.pincode`: must be 6 digits if sent
- `permanentAddress.pincode`: must be 6 digits if sent
- `workAddress.pincode`: must be 6 digits if sent

### Languages

- Must be an array of strings

### Availability

`days` allowed values:

- `Monday`
- `Tuesday`
- `Wednesday`
- `Thursday`
- `Friday`
- `Saturday`
- `Sunday`

`timeSlots`:

- must be an array
- each item must contain:
  - `startTime`
  - `endTime`

### Bank Details

- `bankDetails` must be an object
- empty object is rejected
- if these keys are sent, they cannot be empty:
  - `accountHolderName`
  - `accountNumber`
  - `ifscCode`

## Restricted Fields

These are blocked from this API and return `400`:

- `email`
- `mobile`
- `password`
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
- `tokenVersion`
- all KYC/certificate document fields other than `profilePhoto`

Example restricted-field error:

```json
{
  "success": false,
  "message": "This field is not editable from app profile API"
}
```

## Common Error Responses

No valid fields:

```json
{
  "success": false,
  "message": "No valid fields provided for update"
}
```

Invalid JSON for multipart object field:

```json
{
  "success": false,
  "message": "Invalid JSON payload for bankDetails"
}
```

Invalid `languages`:

```json
{
  "success": false,
  "message": "languages must be an array of strings"
}
```

Invalid `availability`:

```json
{
  "success": false,
  "message": "Each availability.timeSlots entry must include startTime and endTime"
}
```

Empty bank details:

```json
{
  "success": false,
  "message": "bankDetails cannot be empty"
}
```

Provider missing:

```json
{
  "success": false,
  "message": "Service provider not found"
}
```

Server error:

```json
{
  "success": false,
  "message": "Internal server error message"
}
```

## Integration Notes For App Team

- Use `GET /profile` to hydrate the provider profile screen.
- Use `PATCH /profile` for partial saves only.
- Do not send blocked fields from the app profile edit form.
- For object fields in multipart requests, send JSON strings.
- For JSON requests, send nested objects directly.
- If app edits only one bank field, send only that key inside `bankDetails`; backend preserves the rest.
