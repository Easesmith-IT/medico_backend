# Full List API Stability Retest

- GeneratedAt: 2026-05-09T21:10:43.521Z
- BaseURL: http://localhost:5005
- TotalChecks: 13
- Non2xxChecks: 3

## Checklist

- [x] POST /api/v1/doctor/availability | 200 | area=doctor-availability-hardening
  - req: {"days":["Monday","Tuesday"],"timeSlots":[{"start":"09:00","end":"11:00"}],"slotDuration":30,"startDate":"2026-05-10","endDate":"2026-05-11","serviceAvailability":{"consultation":true},"serviceCoverage":{"mode":"Home Service"}}
  - res: {"success":true,"message":"Availability configured successfully","data":{"availability":{"autoSlotGeneration":{"enabled":false,"defaultDuration":30,"bufferBetweenSlots":5,"advanceBookingDays":30},"days":["Monday","Tuesday"],"serviceAvailability":{"consultation":true},"timeSlots":[{"start":"09:00","end":"11:00","_id":"69ffa2d09fce833a9aabba66"}],"serviceCoverage":{"mode":"Home Service"},"dailySlots":[{"date":"2026-05-11T00:00:00.000Z","dayOfWeek":"Monday","isAvailable":true,"slots":[{"startTime":"09:00","endTime":"09:30","duration":30,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"69ffa2d09fce833a9aabba68"},{"startTime":"09:30","endTime":"10:00","duration":30,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"69ffa2d09fce833a9aabba69"},{"startTime":"10:00","endTime":"10:30","duration":30,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"69ffa2d09fce833a9aabba6a"},{"startTime":"10:30","endTime":"11:00","duration":30,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"69ffa2d09fce833a9aabba6b"}],"_id":"69ffa2d09fce833a9aabba67","breakTimes":[]}]},"slotsGenerated":true}}
- [x] PUT /api/v1/doctor/availability | 200 | area=route-conflict-verification
  - req: {"days":["Monday"],"timeSlots":[{"start":"10:00","end":"12:00"}]}
  - res: {"success":true,"message":"Availability updated successfully","data":{"doctor":{"verificationDocuments":{"degreesCertificates":[]},"availability":{"autoSlotGeneration":{"enabled":false,"defaultDuration":30,"bufferBetweenSlots":5,"advanceBookingDays":30},"serviceAvailability":"both","days":["Monday"],"timeSlots":[{"start":"10:00","end":"12:00","_id":"69ffa2d09fce833a9aabba6d"}],"serviceCoverage":[],"dailySlots":[]},"_id":"69ff983f51558d56a410ccfa","firstName":"AdmDoc1778358335020","email":"adm.doc.1778358335020.618012@example.com","phone":"9335020223","profilePhoto":null,"cities":["69ff3546921dd1f3626cc373"],"medicalRegistrationNumber":"ADM-MED-1778358335020","issuingMedicalCouncil":"Medical Council","yearsOfExperience":0,"specialization":"General","subSpecialties":[],"consultationFees":0,"degrees":[],"certifications":[],"residencies":[],"trainingsWorkshops":[],"verificationStatus":"rejected","services":[],"role":"doctor","isPhoneVerified":true,"averageRating":0,"totalReviews":0,"followers":[],"followersCount":0,"isActive":true,"clinics":[],"createdAt":"2026-05-09T20:25:35.021Z","updatedAt":"2026-05-09T21:10:40.817Z","__v":1}}}
- [x] GET /api/v1/article/articles?longitude&latitude | 200 | area=article-geo-filter
  - req: {}
  - res: {"success":true,"count":0,"total":0,"totalPages":0,"currentPage":1,"articles":[]}
- [x] GET /api/v1/article/articles?cityId | 200 | area=article-city-filter
  - req: {}
  - res: {"success":true,"count":0,"total":0,"totalPages":0,"currentPage":1,"articles":[]}
- [x] GET /api/v1/article/getallarticle?cityId | 200 | area=article-city-filter-alias
  - req: {}
  - res: {"success":true,"count":0,"total":0,"totalPages":0,"currentPage":1,"articles":[]}
- [x] GET /api/v1/article/articles?cityName | 200 | area=article-cityname-filter
  - req: {}
  - res: {"success":true,"count":0,"total":0,"totalPages":0,"currentPage":1,"articles":[]}
- [x] GET /api/v1/socialPost/search?q=health | 200 | area=social-search-regression
  - req: {}
  - res: {"success":true,"data":{"posts":{"data":[{"_id":"6939481b5bb0cb4978b66e6c","doctor":null,"type":"TEXT","content":"Feeling great after a successful surgery today! #medicine #healthcare","hashtags":[],"mentions":["64f8b1234567890abcdef123"],"createdAt":"2025-12-10T10:14:51.350Z","isHidden":false},{"_id":"6939488b20dc6d43b0421ebd","doctor":null,"type":"TEXT","content":"Feeling great after a successful surgery today! #medicine #healthcare","hashtags":[],"mentions":["64f8b1234567890abcdef123"],"createdAt":"2025-12-10T10:16:43.678Z","isHidden":false},{"_id":"69394b6963343bf440ff7e9c","doctor":null,"type":"TEXT","content":"Feeling great after a successful surgery today! #medicine #healthcare","hashtags":[],"mentions":["64f8b1234567890abcdef123"],"createdAt":"2025-12-10T10:28:58.003Z","isHidden":false}],"total":3}},"pagination":{"page":1,"limit":5,"totalResults":3}}
- [x] POST /api/v1/serviceProvider/login (email only) | 200 | area=provider-login-regression
  - req: {"email":"phase.create.provider.1778358351955.372163@example.com","password":"Stability@123"}
  - res: {"success":true,"message":"Login successful","data":{"id":"69ff98503dfe2cc4bfac7fd3","role":"serviceprovider","accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmY5ODUwM2RmZTJjYzRiZmFjN2ZkMyIsInJvbGUiOiJzZXJ2aWNlcHJvdmlkZXIiLCJ0b2tlblZlcnNpb24iOjAsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzgzNjEwNDEsImV4cCI6MTgwOTg5NzA0MX0.tkhYWlQE62TDJozbE88Buf1hpV7FbEjMDAJV-Zqqdxk","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmY5ODUwM2RmZTJjYzRiZmFjN2ZkMyIsInJvbGUiOiJzZXJ2aWNlcHJvdmlkZXIiLCJ0b2tlblZlcnNpb24iOjAsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc4MzYxMDQxLCJleHAiOjE3ODYxMzcwNDF9.movX3ZYkHMgYdG3QOHzVGS2ua_a5FfqKxiopGi3ztuQ"}}
- [x] POST /api/v1/serviceProvider/login (mobile only) | 200 | area=provider-login-regression
  - req: {"mobile":"9351955421","password":"Stability@123"}
  - res: {"success":true,"message":"Login successful","data":{"id":"69ff98503dfe2cc4bfac7fd3","role":"serviceprovider","accessToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmY5ODUwM2RmZTJjYzRiZmFjN2ZkMyIsInJvbGUiOiJzZXJ2aWNlcHJvdmlkZXIiLCJ0b2tlblZlcnNpb24iOjAsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzgzNjEwNDIsImV4cCI6MTgwOTg5NzA0Mn0.33EVi2Soc6FUpZlKCu5JWwHOBJB6ueoCXLFmmsW8aNY","refreshToken":"eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ZmY5ODUwM2RmZTJjYzRiZmFjN2ZkMyIsInJvbGUiOiJzZXJ2aWNlcHJvdmlkZXIiLCJ0b2tlblZlcnNpb24iOjAsInR5cGUiOiJyZWZyZXNoIiwiaWF0IjoxNzc4MzYxMDQyLCJleHAiOjE3ODYxMzcwNDJ9.tngUEB4k7LaYhnfnggqJQEaLcvSva63oMGHuBo8Y5LM"}}
- [ ] POST /api/v1/serviceProvider/login (neither email/mobile) | 400 | area=provider-login-regression
  - req: {"password":"Stability@123"}
  - res: {"success":false,"message":"Email or mobile is required"}
- [ ] POST /api/v1/serviceProvider/login (wrong credential) | 401 | area=provider-login-regression
  - req: {"email":"phase.create.provider.1778358351955.372163@example.com","password":"Stability@123_wrong"}
  - res: {"success":false,"message":"Invalid email/mobile or password"}
- [ ] POST /api/v1/serviceProvider/login (inactive provider) | 403 | area=provider-login-regression
  - req: {"email":"phase.create.provider.1778358351955.372163@example.com","password":"Stability@123"}
  - res: {"success":false,"message":"Your account is currently inactive"}
- [x] POST /api/v1/invoice/generate | 201 | area=invoice-generate-resilience
  - req: {"bookingId":"69ffa2d2444fff64c731ee9b","patientId":"69099012606fc5a2ab07ae91","doctorId":"69ff98503dfe2cc4bfac7fd3","serviceId":"6915d7cf9033f3ce1c0f322e","billingDetails":{"category":"consultation","serviceName":"Attendant Care","shiftType":"hourly","durationMinutes":30,"basePrice":150,"calculatedBase":150,"taxPercentage":0},"medicines":[{"name":"Pain Relief","quantity":1,"pricePerUnit":50,"gstPercentage":0}],"additionalEquipment":[]}
  - res: {"success":true,"message":"Invoice generated successfully","data":{"invoiceNumber":"INV-1778361042980-6709","bookingId":"69ffa2d2444fff64c731ee9b","patientId":"69099012606fc5a2ab07ae91","doctorId":"69ff98503dfe2cc4bfac7fd3","billingDetails":{"category":"consultation","serviceName":"Attendant Care","shiftType":"hourly","durationMinutes":30,"basePrice":150,"calculatedBase":150,"taxPercentage":0},"medicines":[{"name":"Pain Relief","quantity":1,"pricePerUnit":50,"gstPercentage":0,"total":50,"addedDate":"2026-05-09T21:10:42.980Z","_id":"69ffa2d29fce833a9aabba85"}],"additionalEquipment":[],"invoiceUrl":"/uploads/1778361043477-INV-1778361042980-6709.pdf","isInvoiceGenerated":true,"totals":{"subtotal":200,"gstAmount":0,"cgst":0,"sgst":0,"grandTotal":200},"paymentStatus":"Unpaid","_id":"69ffa2d29fce833a9aabba84","issuedAt":"2026-05-09T21:10:42.982Z","createdAt":"2026-05-09T21:10:42.983Z","updatedAt":"2026-05-09T21:10:43.479Z","__v":0}}