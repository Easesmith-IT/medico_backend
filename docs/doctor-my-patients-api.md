# Doctor's Patients API Documentation

This API allows an authenticated doctor to retrieve a list of patients they have interacted with (i.e. patients who have booked appointments with them). The results are grouped by patient, sorted by priority (active patients first) and interaction date, and support filtering, searching, and pagination.

## Endpoint Details

*   **HTTP Method:** `GET`
*   **Path:** `/api/v1/doctor-appointments/doctor/my-patients`
*   **Authentication:** Required (Bearer Token)
*   **User Role Required:** `doctor`

---

## Request

### Headers

| Header | Type | Description | Required |
| :--- | :--- | :--- | :--- |
| `Authorization` | `string` | Must be in the format `Bearer <JWT_ACCESS_TOKEN>` | **Yes** |
| `Content-Type` | `string` | `application/json` | No |

### Query Parameters

| Parameter | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `bucket` | `string` | `"all"` | Filters patients by their relationship status with the doctor. Valid values are:<br>- `"all"`: Returns all patients.<br>- `"serving"`: Returns patients with active/upcoming appointments.<br>- `"served"`: Returns patients with only completed/past appointments. |
| `search` | `string` | `""` | Search query to filter patients. It matches case-insensitively against the patient's:<br>- First Name<br>- Last Name<br>- Email<br>- Primary Phone Number<br>- Mobile Number |
| `page` | `integer` | `1` | The page number for pagination (minimum: `1`). |
| `limit` | `integer` | `20` | The number of results per page (allowed range: `1` to `100`). |

### Request Body
None.

---

## Response

### Response Fields Description

| Field | Type | Description |
| :--- | :--- | :--- |
| `success` | `boolean` | Indicates if the request was processed successfully. |
| `page` | `integer` | The current page number. |
| `limit` | `integer` | The limit of records returned per page. |
| `total` | `integer` | The total number of unique patients matching the filters. |
| `totalPages` | `integer` | The total number of pages available. |
| `count` | `integer` | The number of patient items in the current response `data` array. |
| `filters` | `object` | The active filter configuration (`bucket` and `search`). |
| `data` | `array[object]` | List of patient records matching the query. |

#### Patient Record Fields (`data[]`)

| Field | Type | Description |
| :--- | :--- | :--- |
| `patientId` | `string` | The unique ID of the patient. |
| `relationshipStatus` | `string` | The status of the relationship: `"serving"` (if there is at least 1 active appointment) or `"served"`. |
| `activeAppointmentsCount` | `integer` | Count of active (pending, scheduled, etc.) appointments with this doctor. |
| `completedAppointmentsCount`| `integer` | Count of completed appointments with this doctor. |
| `totalAppointmentsCount` | `integer` | Total number of appointments (both active and completed) with this doctor. |
| `lastInteractionAt` | `string` | ISO timestamp of the latest appointment date. |
| `latestAppointment` | `object` | Details of the most recent appointment (sorted by appointment date and creation time). |
| `latestActiveAppointment` | `object` | Details of the most recent active/pending appointment, if any. |
| `lastCompletedAppointment` | `object` | Details of the most recent completed appointment, if any. |
| `patient` | `object` | Patient profile info containing `_id`, `firstName`, `lastName`, `fullName`, `phone`, `email`, and `profilePhoto`. |

---

## Real API Examples (from localhost:5005)

### 1. Retrieve All Patients (Success)
*   **Request URL:** `GET http://localhost:5005/api/v1/doctor-appointments/doctor/my-patients`
*   **Headers:** `Authorization: Bearer eyJhbGciOiJIUzI1Ni...`
*   **Response Status:** `200 OK`
*   **Response Body:**

```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "total": 1,
  "totalPages": 1,
  "filters": {
    "bucket": "all",
    "search": ""
  },
  "count": 1,
  "data": [
    {
      "activeAppointmentsCount": 5,
      "completedAppointmentsCount": 3,
      "totalAppointmentsCount": 8,
      "lastInteractionAt": "2026-06-23T00:00:00.000Z",
      "relationshipStatus": "serving",
      "latestAppointment": {
        "_id": "6a39163ee9502bcf08200ae0",
        "appointmentDate": "2026-06-23T00:00:00.000Z",
        "slotTime": {
          "startTime": "09:35",
          "endTime": "10:05"
        },
        "status": "Pending",
        "city": "6a02f3dea924e2b2a433f28a",
        "createdAt": "2026-06-22T11:02:23.731Z"
      },
      "latestActiveAppointment": {
        "_id": "6a39163ee9502bcf08200ae0",
        "appointmentDate": "2026-06-23T00:00:00.000Z",
        "slotTime": {
          "startTime": "09:35",
          "endTime": "10:05"
        },
        "status": "Pending",
        "city": "6a02f3dea924e2b2a433f28a",
        "createdAt": "2026-06-22T11:02:23.731Z"
      },
      "lastCompletedAppointment": {
        "_id": "6a311f8e4752c0531f4af331",
        "appointmentDate": "2026-06-16T00:00:00.000Z",
        "slotTime": {
          "startTime": "17:30",
          "endTime": "18:00"
        },
        "status": "Completed",
        "city": "6a02f3dea924e2b2a433f28a",
        "createdAt": "2026-06-16T10:03:59.853Z"
      },
      "patient": {
        "_id": "6a0416adb219a37f171c8cb0",
        "firstName": "Ravi Kumar",
        "fullName": "Ravi Kumar",
        "phone": "8707807701",
        "email": "testravi@gmail.com",
        "profilePhoto": null
      },
      "patientId": "6a0416adb219a37f171c8cb0"
    }
  ]
}
```

### 2. Search Patients (Empty Result Example)
*   **Request URL:** `GET http://localhost:5005/api/v1/doctor-appointments/doctor/my-patients?search=Riya`
*   **Headers:** `Authorization: Bearer eyJhbGciOiJIUzI1Ni...`
*   **Response Status:** `200 OK`
*   **Response Body:**

```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "total": 0,
  "totalPages": 0,
  "filters": {
    "bucket": "all",
    "search": "Riya"
  },
  "count": 0,
  "data": []
}
```

### 3. Invalid or Missing Token (Failure)
*   **Request URL:** `GET http://localhost:5005/api/v1/doctor-appointments/doctor/my-patients`
*   **Headers:** `Authorization: Bearer invalid_or_missing_token`
*   **Response Status:** `401 Unauthorized`
*   **Response Body:**

```json
{
  "status": "fail",
  "message": "Authentication required"
}
```
