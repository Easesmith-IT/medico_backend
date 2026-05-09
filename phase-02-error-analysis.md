# Phase 02 Error Analysis

- totalRoutes: 18
- generatedAt: 2026-05-09T12:52:49.160Z

## 1. POST /api/v1/admin/logout-all-devices
- Controller: controller/adminController.js#logoutAllDevices
- Final HTTP Status: 400
- Classification: Validation/Contract Failure | Spillover from Phase 01 for balance
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Email required","stack":"Error: Email required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1511:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- Error (normalized): Email required
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/admin/logout-all-devices using context=public
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 2. POST /api/v1/admin/patient/:patientId/medications
- Controller: controller/adminController.js#adminAddMedication
- Final HTTP Status: 400
- Classification: Validation/Contract Failure | Spillover from Phase 01 for balance
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Please provide medication details","stack":"Error: Please provide medication details\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:4137:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Please provide medication details
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/admin/patient/6909a373c21dc072f0dc1a87/medications using context=admin
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 3. POST /api/v1/admin/patients/create
- Controller: controller/adminController.js#createPatient
- Final HTTP Status: 400
- Classification: Validation/Contract Failure | Spillover from Phase 01 for balance
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Please provide all required fields: firstName, email, phone, password","stack":"Error: Please provide all required fields: firstName, email, phone, password\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1987:7\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Please provide all required fields: firstName, email, phone, password
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/admin/patients/create using context=admin
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 4. POST /api/v1/admin/verify-signup-otp
- Controller: controller/adminController.js#verifySignupOtp
- Final HTTP Status: 400
- Classification: Validation/Contract Failure | Spillover from Phase 01 for balance
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone and OTP required","stack":"Error: Phone and OTP required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1337:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- Error (normalized): Phone and OTP required
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/admin/verify-signup-otp using context=public
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 5. PUT /api/v1/admin/admin/doctor/update-cities
- Controller: controller/adminController.js#updateDoctorCities
- Final HTTP Status: 400
- Classification: Validation/Contract Failure | Spillover from Phase 01 for balance
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Doctor ID is required","stack":"Error: Doctor ID is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3667:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Doctor ID is required
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: PUT /api/v1/admin/admin/doctor/update-cities using context=admin
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 6. PUT /api/v1/admin/doctors/:id/approve
- Controller: controller/adminController.js#approveDoctor
- Final HTTP Status: 404
- Classification: Not Found/Data Missing | Spillover from Phase 01 for balance
- Error (raw): {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1920:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Doctor not found
- Root-cause hypothesis: Requested entity/resource ID was not found in DB for this route.
- Repro request shape: PUT /api/v1/admin/doctors/699da06d063f7bf10e8ab446/approve using context=admin
- Fix recommendation: Use existing IDs from DB fixtures or improve not-found handling/test data seeding.
- Priority: P3
- Confidence: High

## 7. PUT /api/v1/admin/doctors/:id/reject
- Controller: controller/adminController.js#rejectDoctor
- Final HTTP Status: 404
- Classification: Not Found/Data Missing | Spillover from Phase 01 for balance
- Error (raw): {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1940:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Doctor not found
- Root-cause hypothesis: Requested entity/resource ID was not found in DB for this route.
- Repro request shape: PUT /api/v1/admin/doctors/699da06d063f7bf10e8ab446/reject using context=admin
- Fix recommendation: Use existing IDs from DB fixtures or improve not-found handling/test data seeding.
- Priority: P3
- Confidence: High

## 8. PUT /api/v1/admin/patients/:id/block
- Controller: controller/adminController.js#blockPatient
- Final HTTP Status: 404
- Classification: Not Found/Data Missing | Spillover from Phase 01 for balance
- Error (raw): {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Patient not found","stack":"Error: Patient not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3396:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Patient not found
- Root-cause hypothesis: Requested entity/resource ID was not found in DB for this route.
- Repro request shape: PUT /api/v1/admin/patients/699da06d063f7bf10e8ab446/block using context=admin
- Fix recommendation: Use existing IDs from DB fixtures or improve not-found handling/test data seeding.
- Priority: P3
- Confidence: High

## 9. DELETE /api/v1/doctor/break-time
- Controller: controller/doctorController.js#removeBreakTime
- Final HTTP Status: 500
- Classification: Confirmed Backend Bug
- Error (raw): {"status":"error","error":{"statusCode":500,"status":"error"},"message":"Cannot destructure property 'date' of 'req.body' as it is undefined.","stack":"TypeError: Cannot destructure property 'date' of 'req.body' as it is undefined.\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1910:11\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Cannot destructure property 'date' of 'req.body' as it is undefined.
- Root-cause hypothesis: Controller destructures fields from undefined request body.
- Repro request shape: DELETE /api/v1/doctor/break-time using context=doctor
- Fix recommendation: Guard req.body before destructuring and return clear 400 validation error.
- Priority: P1
- Confidence: High

## 10. GET /api/v1/doctor/doctor/cities/by-name/:doctorId/:cityName
- Controller: controller/doctorController.js#getDoctorCitiesByName
- Final HTTP Status: 500
- Classification: Confirmed Backend Bug
- Error (raw): {"status":"error","error":{"statusCode":500,"status":"error"},"message":"mongoose is not defined","stack":"ReferenceError: mongoose is not defined\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1279:3\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:600:14)\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:610:14)"}
- Error (normalized): mongoose is not defined
- Root-cause hypothesis: Missing variable/model import referenced in controller at runtime.
- Repro request shape: GET /api/v1/doctor/doctor/cities/by-name/69083c7093634916321ed31d/Lucknow using context=public
- Fix recommendation: Import the missing symbol in controller and add a startup/unit guard test.
- Priority: P0
- Confidence: High

## 11. GET /api/v1/doctor/doctor/my-cities/:doctorId
- Controller: controller/doctorController.js#getDoctorCities
- Final HTTP Status: 500
- Classification: Confirmed Backend Bug
- Error (raw): {"status":"error","error":{"statusCode":500,"status":"error"},"message":"mongoose is not defined","stack":"ReferenceError: mongoose is not defined\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1235:3\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:600:14)\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:610:14)"}
- Error (normalized): mongoose is not defined
- Root-cause hypothesis: Missing variable/model import referenced in controller at runtime.
- Repro request shape: GET /api/v1/doctor/doctor/my-cities/69083c7093634916321ed31d using context=public
- Fix recommendation: Import the missing symbol in controller and add a startup/unit guard test.
- Priority: P0
- Confidence: High

## 12. GET /api/v1/doctor/getDoctorById/:id
- Controller: controller/doctorController.js#getDoctorById
- Final HTTP Status: 404
- Classification: Not Found/Data Missing
- Error (raw): {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1005:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- Error (normalized): Doctor not found
- Root-cause hypothesis: Requested entity/resource ID was not found in DB for this route.
- Repro request shape: GET /api/v1/doctor/getDoctorById/699da06d063f7bf10e8ab446 using context=public
- Fix recommendation: Use existing IDs from DB fixtures or improve not-found handling/test data seeding.
- Priority: P3
- Confidence: High

## 13. GET /api/v1/doctor/slots/:doctorId
- Controller: controller/doctorController.js#getAvailableSlots
- Final HTTP Status: 500
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Error fetching available slots","error":"doctor.getAvailableSlotsByDateRange is not a function"}
- Error (normalized): Error fetching available slots
- Root-cause hypothesis: Controller assumes object/method shape that does not exist in current schema/model instance.
- Repro request shape: GET /api/v1/doctor/slots/69083c7093634916321ed31d?date=2026-05-09 using context=public
- Fix recommendation: Align controller logic with current schema shape or add missing helper methods.
- Priority: P1
- Confidence: High

## 14. POST /api/v1/doctor/break-time
- Controller: controller/doctorController.js#addBreakTime
- Final HTTP Status: 500
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"doctor.addBreakTime is not a function","error":"doctor.addBreakTime is not a function"}
- Error (normalized): doctor.addBreakTime is not a function
- Root-cause hypothesis: Controller assumes object/method shape that does not exist in current schema/model instance.
- Repro request shape: POST /api/v1/doctor/break-time using context=doctor
- Fix recommendation: Align controller logic with current schema shape or add missing helper methods.
- Priority: P1
- Confidence: High

## 15. POST /api/v1/doctor/clinic
- Controller: controller/doctorController.js#addClinic
- Final HTTP Status: 400
- Classification: Validation/Contract Failure
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Please provide clinic firstName and address","stack":"Error: Please provide clinic firstName and address\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1118:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at verifyAccessToken (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:628:5)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)"}
- Error (normalized): Please provide clinic firstName and address
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/doctor/clinic using context=doctor
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 16. POST /api/v1/doctor/logout-all-devices
- Controller: controller/doctorController.js#logoutAllDevices
- Final HTTP Status: 400
- Classification: Validation/Contract Failure
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone number is required","stack":"Error: Phone number is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:807:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- Error (normalized): Phone number is required
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/doctor/logout-all-devices using context=public
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 17. POST /api/v1/doctor/resend-login-otp
- Controller: controller/doctorController.js#resendLoginOtp
- Final HTTP Status: 400
- Classification: Validation/Contract Failure
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone number is required","stack":"Error: Phone number is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:758:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- Error (normalized): Phone number is required
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/doctor/resend-login-otp using context=public
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High

## 18. POST /api/v1/doctor/resend-signup-otp
- Controller: controller/doctorController.js#resendSignupOtp
- Final HTTP Status: 400
- Classification: Validation/Contract Failure
- Error (raw): {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone number is required","stack":"Error: Phone number is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:493:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- Error (normalized): Phone number is required
- Root-cause hypothesis: Controller input validation rejected missing/invalid request fields for this payload.
- Repro request shape: POST /api/v1/doctor/resend-signup-otp using context=public
- Fix recommendation: Document required fields clearly and send complete payload; relax validation only if API contract requires it.
- Priority: P3
- Confidence: High
