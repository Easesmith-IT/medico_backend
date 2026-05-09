# Unresolved Route Recheck (No Fix)

- generatedAt: 2026-05-09T17:23:04.404Z
- baseUrl: http://localhost:5005
- totalRoutesRetested: 11

## 1. POST /api/v1/admin/bookings/create
- Context used: serviceProvider
- Executed URL: /api/v1/admin/bookings/create
- Response status: 403
- Issue: Auth/role restriction
- Request body: `{"patientId":"6927ec404619ff9ef06df478","serviceId":"69ff38769f29739c4bf095f4","appointmentDate":"2026-05-10","startTime":"11:00","endTime":"11:30","duration":30,"cityId":"691d9aebeaae59d1db945598"}`
- Response body: `{"status":"fail","error":{"statusCode":403,"status":"fail","isOperational":true},"message":"Access denied. Allowed roles: superadmin, subadmin","stack":"Error: Access denied. Allowed roles: superadmin, subadmin\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:612:7)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}`

## 2. PATCH /api/v1/admin/bookings/update/:bookingId
- Context used: serviceProvider
- Executed URL: /api/v1/admin/bookings/update/69ff42989d7c3398cf4b5520
- Response status: 403
- Issue: Auth/role restriction
- Request body: `{"patientId":"6927ec404619ff9ef06df478","appointmentDate":"2026-05-10","startTime":"11:00","endTime":"11:30","duration":30,"status":"Approved","notes":"phase update","cityId":"691d9aebeaae59d1db945598"}`
- Response body: `{"status":"fail","error":{"statusCode":403,"status":"fail","isOperational":true},"message":"Access denied. Allowed roles: superadmin, subadmin","stack":"Error: Access denied. Allowed roles: superadmin, subadmin\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:612:7)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}`

## 3. GET /api/v1/doctor/doctor/cities/by-name/:doctorId/:cityName
- Context used: doctor
- Executed URL: /api/v1/doctor/doctor/cities/by-name/69104ae53f18864f8d196806/chhatrapati sambhajinagar
- Response status: 200
- Issue: No issue (route passed in this retest)
- Request body: `{}`
- Response body: `{"success":true,"message":"Cities matching \"chhatrapati sambhajinagar\" retrieved successfully","data":{"doctor":{"id":"69104ae53f18864f8d196806","firstName":"hitesh","specialization":"mbbs","totalCities":1,"cities":[{"_id":"691d9aebeaae59d1db945598","name":"chhatrapati sambhajinagar","latitude":19.8758,"longitude":75.3393}]}}}`

## 4. POST /api/v1/booking/create
- Context used: patient
- Executed URL: /api/v1/booking/create
- Response status: 409
- Issue: Business-rule conflict (slot/state conflict)
- Request body: `{"patientId":"6927ec404619ff9ef06df478","serviceId":"69ff38769f29739c4bf095f4","appointmentDate":"2026-05-10","startTime":"16:00","endTime":"16:30","duration":30,"cityId":"691d9aebeaae59d1db945598"}`
- Response body: `{"success":false,"message":"Slot is already reserved for this service"}`

## 5. POST /api/v1/booking/providerBookings
- Context used: serviceProvider
- Executed URL: /api/v1/booking/providerBookings
- Response status: 400
- Issue: Validation/input/precondition failure
- Request body: `{"patientId":"6927ec404619ff9ef06df478","previousBookingId":"69ff61b5c3fc64eb76de29bb","serviceId":"69ff38769f29739c4bf095f4","appointmentDate":"2026-05-10","startTime":"11:00","endTime":"11:30","duration":30,"cityId":"691d9aebeaae59d1db945598"}`
- Response body: `{"success":false,"message":"Booking validation failed: sessionNumber: Path `sessionNumber` is required."}`

## 6. PUT /api/v1/booking/reschedule/:bookingId
- Context used: patient
- Executed URL: /api/v1/booking/reschedule/69ff61b5c3fc64eb76de29b6
- Response status: 409
- Issue: Business-rule conflict (slot/state conflict)
- Request body: `{"appointmentDate":"2026-05-10","startTime":"16:00","endTime":"16:30","reason":"phase reschedule","duration":30}`
- Response body: `{"success":false,"message":"The selected slot is already booked. Choose another slot."}`

## 7. PUT /api/v1/booking/update-status/:bookingId
- Context used: public
- Executed URL: /api/v1/booking/update-status/69ff61b5c3fc64eb76de29b6
- Response status: 401
- Issue: Auth/role restriction
- Request body: `{"status":"In-Progress","notes":"phase status update"}`
- Response body: `{"status":"fail","error":{"statusCode":401,"status":"fail","isOperational":true},"message":"Authentication required","stack":"Error: Authentication required\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:346:19\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:600:14)\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:610:14)\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:664:3)"}`

## 8. POST /api/v1/geo/check-location
- Context used: public
- Executed URL: /api/v1/geo/check-location
- Response status: 400
- Issue: Validation/input/precondition failure
- Request body: `{"address":"chhatrapati sambhajinagar, India","polygon":[[80.94,26.84],[80.95,26.84],[80.95,26.85],[80.94,26.85]]}`
- Response body: `{"success":false,"message":"Location not found"}`

## 9. PATCH /api/v1/city/:cityId/toggle
- Context used: public
- Executed URL: /api/v1/city/691d9aebeaae59d1db945598/toggle
- Response status: 500
- Issue: Backend bug (unhandled/runtime/server-side failure)
- Request body: `{}`
- Response body: `{"success":false,"message":"Error toggling status","error":"City validation failed: area.coordinates: Path `area.coordinates` is required."}`

## 10. POST /api/v1/article/create
- Context used: doctor
- Executed URL: /api/v1/article/create
- Response status: 500
- Issue: Backend bug (unhandled/runtime/server-side failure)
- Request body: `{"cityName":"chhatrapati sambhajinagar","category":"General Health","title":"Phase Article 1778344402559","articleType":"article","textContent":"Phase article content","location":"Lucknow","tags":["phase","health"]}`
- Response body: `{"status":"error","error":{"errors":{"creatorModel":{"name":"ValidatorError","message":"Path `creatorModel` is required.","properties":{"message":"Path `creatorModel` is required.","type":"required","path":"creatorModel"},"kind":"required","path":"creatorModel"}},"_message":"Article validation failed","statusCode":500,"status":"error","name":"ValidationError","message":"Article validation failed: creatorModel: Path `creatorModel` is required."},"message":"Article validation failed: creatorModel: Path `creatorModel` is required.","stack":"ValidationError: Article validation failed: creatorModel: Path `creatorModel` is required.\n    at Document.invalidate (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\document.js:3362:32)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\document.js:3123:17\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\schemaType.js:1420:9\n    at process.processTicksAndRejections (node:internal/process/task_queues:77:11)"}`

## 11. POST /api/v1/payments/treatments/:treatmentId/online/verify
- Context used: patient
- Executed URL: /api/v1/payments/treatments/69ff42979d7c3398cf4b551d/online/verify
- Response status: 404
- Issue: Data precondition missing / referenced resource not found
- Request body: `{"razorpay_order_id":"order_test_phase","razorpay_payment_id":"pay_test_phase","razorpay_signature":"sig_test_phase"}`
- Response body: `{"success":false,"message":"Pending online transaction not found for this order"}`
