# Treatment Alternative And Doctor Recommendation Integration

This document covers the treatment detail screen section shown in the app:

- Alternative Treatments
- Recommended Doctors for the same treatment/service specialization
- FAQ
- Book Appointment

## Current Backend Support

Treatment records do not store doctor specialization directly.

Current relation:

```text
Treatment -> serviceId -> Service
Service -> recommendedSpecializations / recommendedSubSpecialties
Doctor -> specialization / subSpecialties / services
```

So the app should recommend doctors by resolving the treatment service first, then matching doctors from that service recommendation metadata.

## Data Setup

The `Service` model now supports:

```json
{
  "recommendedSpecializations": ["Dentist", "Orthodontist"],
  "recommendedSubSpecialties": ["Laser Dentistry", "Dental Care"]
}
```

These fields are managed through the existing service create/update APIs.

Example for a dental treatment service:

```json
{
  "name": "Laser Dentistry",
  "category": "consultation",
  "recommendedSpecializations": ["Dentist"],
  "recommendedSubSpecialties": ["Laser Dentistry", "Dental Care"]
}
```

## Seeded Backend Entries

Two real service entries were updated for testing.

### Lucknow Doctor Consultation

Service ID:

```text
6a03248b28ee1195704f4546
```

Recommendation metadata:

```json
{
  "recommendedSpecializations": ["General", "Cardiology", "Neurology"],
  "recommendedSubSpecialties": [
    "Doctor Consultation",
    "General Consultation",
    "Follow-up Consultation"
  ]
}
```

### Noida Home Nursing Care

Service ID:

```text
6a03248b28ee1195704f4550
```

Recommendation metadata:

```json
{
  "recommendedSpecializations": ["General", "Pulmonology"],
  "recommendedSubSpecialties": [
    "Home Nursing Care",
    "Post Operative Care",
    "Patient Monitoring"
  ]
}
```

## Screen Integration

Recommended order on the treatment detail screen:

```text
Treatment Details
Alternative Treatments
Recommended Doctors
Frequently Asked Questions
Book Appointment
```

## Alternative Treatments Section

There is no dedicated backend endpoint named `alternative treatments` yet.

For now, the frontend can render alternative treatment cards from one of these sources:

1. Treatment detail response service information.
2. Service list filtered by the same operational category.
3. A frontend/manual mapping until a dedicated backend relation is added.

Example existing API for same category services:

```http
GET /api/v1/service/category/:category
```

Example:

```http
GET /api/v1/service/category/consultation
```

Use this when the current treatment service category is `consultation`.

Example service card fields:

```json
{
  "_id": "serviceId",
  "name": "Laser Dentistry",
  "description": "Short treatment description",
  "image": "image-url",
  "basePrice": 900,
  "category": "consultation"
}
```

For the UI shown in the screenshot:

```text
Alternative Treatments
- Holistic Dentistry
- Laser Dentistry
- Ayurvedic Dental Care
```

Each card should open treatment/service details and can use the service ID for doctor recommendation.

## Recommended Doctors By Treatment

Use this when the screen has a `treatmentId`.

```http
GET /api/v1/doctor/recommended/treatment/:treatmentId?limit=5
```

Real test examples:

```http
GET /api/v1/doctor/recommended/treatment/6a04660df58f93df710d2719?limit=5
GET /api/v1/doctor/recommended/treatment/6a04663cf58f93df710d272d?limit=5
```

Optional filters:

```http
GET /api/v1/doctor/recommended/treatment/:treatmentId?limit=5&ratingMin=4
GET /api/v1/doctor/recommended/treatment/:treatmentId?limit=5&cityId=:cityId
GET /api/v1/doctor/recommended/treatment/:treatmentId?limit=5&availableDate=2026-07-01
```

## Recommended Doctors By Service

Use this when the screen has only a `serviceId`, not a `treatmentId`.

```http
GET /api/v1/doctor/recommended/service/:serviceId?limit=5
```

Real test examples:

```http
GET /api/v1/doctor/recommended/service/6a03248b28ee1195704f4550?limit=5
GET /api/v1/doctor/recommended/service/6a03248b28ee1195704f4546?limit=5
```

## Recommendation Priority

The backend returns doctors in this order:

1. Doctors matching `Service.recommendedSpecializations`.
2. Doctors linked to the same service in `Doctor.services`.
3. Doctors matching `Service.recommendedSubSpecialties`.
4. Top-rated approved doctors as fallback.

Each doctor response includes:

```json
{
  "recommendationMatchedBy": "specialization"
}
```

Possible values:

```text
specialization
linkedService
subSpecialty
topRatedFallback
```

## Response Shape

Example response:

```json
{
  "success": true,
  "results": 2,
  "data": {
    "doctors": [
      {
        "_id": "doctorId",
        "firstName": "Dr. Rahul",
        "lastName": "Deshmukh",
        "specialization": "Pulmonology",
        "subSpecialties": [],
        "profilePhoto": "image-url",
        "averageRating": 4.2,
        "consultationFees": 900,
        "recommendationMatchedBy": "specialization"
      }
    ],
    "recommendation": {
      "serviceId": "6a03248b28ee1195704f4550",
      "serviceName": "Noida Home Nursing Care",
      "recommendedSpecializations": ["General", "Pulmonology"],
      "recommendedSubSpecialties": [
        "Home Nursing Care",
        "Post Operative Care",
        "Patient Monitoring"
      ],
      "matchedBy": ["specialization"],
      "fallbackUsed": false,
      "treatmentId": "6a04660df58f93df710d2719"
    }
  }
}
```

## Frontend Flow

Treatment detail page:

```text
1. Load treatment details.
2. Read treatment.serviceId.
3. Render Alternative Treatments.
4. Call recommended doctor API with treatmentId.
5. Render Recommended Doctors below Alternative Treatments.
6. Render FAQ below Recommended Doctors.
```

Pseudo flow:

```js
const treatment = await getTreatmentById(treatmentId);

const recommendedDoctors = await api.get(
  `/api/v1/doctor/recommended/treatment/${treatmentId}?limit=5`
);

const alternativeTreatments = await api.get(
  `/api/v1/service/category/${treatment.serviceId.category}`
);
```

## Admin Setup

When admin creates or updates a treatment-related service, send:

```json
{
  "recommendedSpecializations": ["Dentist"],
  "recommendedSubSpecialties": ["Laser Dentistry", "Dental Care"]
}
```

For multipart form-data, these can be sent as JSON strings:

```text
recommendedSpecializations=["Dentist","Orthodontist"]
recommendedSubSpecialties=["Laser Dentistry","Dental Care"]
```

or comma-separated:

```text
recommendedSpecializations=Dentist,Orthodontist
recommendedSubSpecialties=Laser Dentistry,Dental Care
```

## UI Notes

For the screenshot screen:

```text
Alternative Treatments
Recommended Doctors
Frequently Asked Questions
Book Appointment
```

If recommended doctor API returns empty data, show:

```text
No recommended doctors available right now.
```

If `fallbackUsed` is true, the doctors are general top-rated approved doctors, not exact same-specialization matches.

