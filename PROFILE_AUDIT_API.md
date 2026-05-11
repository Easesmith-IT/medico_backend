g# Profile Audit API

This document covers the Phase-1 profile audit trail implementation.

## What Gets Logged

Profile audit logs are written automatically after successful profile updates for:

- Admin profile updates
- Doctor profile updates
- Patient profile updates

Each audit row stores:

- `actorId`
- `actorRole`
- `targetModel`
- `targetId`
- `action`
- `changedFields`
- `before`
- `after`
- `ip`
- `userAgent`
- `createdAt`

## Query Profile Changes

### API

```http
GET /api/v1/admin/audit/profile-changes
```

### Auth

Requires an authenticated admin user:

- `superadmin`
- `subadmin`
- `admin`

### Query Params

| Param | Required | Description |
| --- | --- | --- |
| `targetRole` | No | Filter logs by changed profile role. Supported values: `admin`, `superadmin`, `subadmin`, `doctor`, `patient`. |
| `targetId` | No | Filter logs for one changed profile id. |
| `from` | No | Start date/time filter for `createdAt`. Any valid date string, for example `2026-05-01` or ISO date. |
| `to` | No | End date/time filter for `createdAt`. Any valid date string, for example `2026-05-11` or ISO date. |
| `actorId` | No | Filter logs by the user/admin/doctor/patient who made the change. |
| `page` | No | Page number. Default: `1`. |
| `limit` | No | Page size. Default: `20`, max: `100`. |

### Example Request

```http
GET /api/v1/admin/audit/profile-changes?targetRole=patient&targetId=663c9d4f3d8b2e0012a12345&page=1&limit=10
```

### Example Success Response

```json
{
  "success": true,
  "results": 1,
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 1,
    "totalPages": 1
  },
  "data": {
    "logs": [
      {
        "_id": "6640a1112223334445556666",
        "actorId": "663c9d4f3d8b2e0012a99999",
        "actorRole": "admin",
        "targetModel": "Patient",
        "targetId": "663c9d4f3d8b2e0012a12345",
        "action": "update",
        "changedFields": ["firstName", "phone"],
        "before": {
          "_id": "663c9d4f3d8b2e0012a12345",
          "firstName": "Old Name",
          "email": "patient@example.com",
          "phone": "9876543210"
        },
        "after": {
          "_id": "663c9d4f3d8b2e0012a12345",
          "firstName": "New Name",
          "email": "patient@example.com",
          "phone": "9876543211"
        },
        "ip": "127.0.0.1",
        "userAgent": "PostmanRuntime/7.39.0",
        "createdAt": "2026-05-11T12:00:00.000Z"
      }
    ]
  }
}
```

## Profile Update APIs That Create Audit Logs

These existing update APIs now create audit rows after successful updates.

### Admin Profile Update

```http
PUT /api/v1/admin/updateProfile
Content-Type: application/json
```

Example payload:

```json
{
  "firstName": "Mansi",
  "lastName": "Admin",
  "phone": "9876543210"
}
```

### Doctor Profile Update

```http
PUT /api/v1/doctor/updateProfile
Content-Type: application/json
```

Example payload:

```json
{
  "firstName": "Rahul",
  "lastName": "Sharma",
  "specialization": "Physiotherapy",
  "consultationFees": 700
}
```

### Patient Profile Update

```http
PATCH /api/v1/patient/updateProfile/:id
Content-Type: application/json
```

Example payload:

```json
{
  "firstName": "Anita",
  "phone": "9876543211",
  "bloodGroup": "O+",
  "emergencyContact": {
    "name": "Ravi",
    "phone": "9876543212",
    "relation": "Brother"
  }
}
```

## Error Responses

Invalid `targetRole`:

```json
{
  "status": "fail",
  "message": "Invalid targetRole. Use admin, doctor, or patient."
}
```

Invalid `targetId`:

```json
{
  "status": "fail",
  "message": "Invalid targetId"
}
```

Invalid `actorId`:

```json
{
  "status": "fail",
  "message": "Invalid actorId"
}
```
