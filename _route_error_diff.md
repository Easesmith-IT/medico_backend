# Route Error Diff

- generatedAt: 2026-06-23T07:41:09.375Z
- totalErrorRoutes: 148

- POST /api/v1/admin/admin/booking/approve-cancellation/:bookingId -> controller/adminController.js#approveCancellation | status=400 | category=validation
  error: No pending cancellation request found
  reproducibility: POST /api/v1/admin/admin/booking/approve-cancellation/6a38e30005494ed2c91e6d9f using context=admin
- GET /api/v1/admin/admin/city/:cityId/doctors -> controller/adminController.js#getDoctorsByCity | status=400 | category=validation
  error: City ID is required
  reproducibility: GET /api/v1/admin/admin/city/6a02f3dea924e2b2a433f289/doctors using context=admin
- POST /api/v1/admin/admin/doctor/add-cities -> controller/adminController.js#addDoctorToCities | status=500 | category=server-bug
  error: Doctor validation failed: clinics.0.cityId: Path `cityId` is required., clinics.0.doctorId: Path `doctorId` is required.
  reproducibility: POST /api/v1/admin/admin/doctor/add-cities using context=admin
- POST /api/v1/admin/admin/doctor/remove-cities -> controller/adminController.js#removeDoctorFromCities | status=500 | category=server-bug
  error: Doctor validation failed: clinics.0.cityId: Path `cityId` is required., clinics.0.doctorId: Path `doctorId` is required.
  reproducibility: POST /api/v1/admin/admin/doctor/remove-cities using context=admin
- PUT /api/v1/admin/admin/doctor/update-cities -> controller/adminController.js#updateDoctorCities | status=500 | category=server-bug
  error: Doctor validation failed: clinics.0.cityId: Path `cityId` is required., clinics.0.doctorId: Path `doctorId` is required.
  reproducibility: PUT /api/v1/admin/admin/doctor/update-cities using context=admin
- POST /api/v1/admin/bookings/create -> controller/adminController.js#createBookingByAdmin | status=500 | category=server-bug
  error: Error creating booking by admin
  reproducibility: POST /api/v1/admin/bookings/create using context=admin
- PATCH /api/v1/admin/bookings/update/:bookingId -> controller/adminController.js#updateBookingByAdmin | status=500 | category=server-bug
  error: Error updating booking
  reproducibility: PATCH /api/v1/admin/bookings/update/6a38e30005494ed2c91e6d9f using context=admin
- GET /api/v1/admin/doctors/:id -> controller/adminController.js#getDoctorById | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/admin/doctors/6a02f50da924e2b2a433f2ae using context=admin
- PUT /api/v1/admin/doctors/:id/approve -> controller/adminController.js#approveDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PUT /api/v1/admin/doctors/6a02f50da924e2b2a433f2ae/approve using context=admin
- PUT /api/v1/admin/doctors/:id/reject -> controller/adminController.js#rejectDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PUT /api/v1/admin/doctors/6a02f50da924e2b2a433f2ae/reject using context=admin
- PATCH /api/v1/admin/doctors/:id/toggle-status -> controller/adminController.js#toggleDoctorStatus | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PATCH /api/v1/admin/doctors/6a02f50da924e2b2a433f2ae/toggle-status using context=admin
- PATCH /api/v1/admin/doctors/:id/verification-review -> controller/doctorVerificationController.js#reviewDoctorVerification | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PATCH /api/v1/admin/doctors/6a02f50da924e2b2a433f2ae/verification-review using context=admin
- POST /api/v1/admin/doctors/create -> controller/adminController.js#createDoctor | status=400 | category=validation
  error: Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization
  reproducibility: POST /api/v1/admin/doctors/create using context=admin
- POST /api/v1/admin/login -> controller/adminController.js#adminLogin | status=400 | category=validation
  error: Email and password required
  reproducibility: POST /api/v1/admin/login using context=public
- POST /api/v1/admin/logout-all-devices -> controller/adminController.js#logoutAllDevices | status=400 | category=validation
  error: Email required
  reproducibility: POST /api/v1/admin/logout-all-devices using context=public
- POST /api/v1/admin/mfa/verify -> controller/adminGovernanceController.js#verifyMfa | status=400 | category=validation
  error: OTP is required
  reproducibility: POST /api/v1/admin/mfa/verify using context=admin
- GET /api/v1/admin/patients/:id -> controller/adminController.js#getPatientById | status=404 | category=not-found
  error: Patient not found
  reproducibility: GET /api/v1/admin/patients/6a031fdd05fb2370df312453 using context=admin
- PUT /api/v1/admin/patients/:id/block -> controller/adminController.js#blockPatient | status=404 | category=not-found
  error: Patient not found
  reproducibility: PUT /api/v1/admin/patients/6a031fdd05fb2370df312453/block using context=admin
- PATCH /api/v1/admin/patients/:id/toggle-status -> controller/adminController.js#togglePatientStatus | status=404 | category=not-found
  error: Patient not found
  reproducibility: PATCH /api/v1/admin/patients/6a031fdd05fb2370df312453/toggle-status using context=admin
- GET /api/v1/admin/patients/:patientId/treatments -> controller/adminController.js#getPatientTreatmentsForBooking | status=404 | category=not-found
  error: Patient not found
  reproducibility: GET /api/v1/admin/patients/6a031fdd05fb2370df312453/treatments using context=admin
- POST /api/v1/admin/payments/disputes -> controller/adminPaymentController.js#createDisputeCase | status=400 | category=validation
  error: paymentId, treatmentId and description are required
  reproducibility: POST /api/v1/admin/payments/disputes using context=admin
- PATCH /api/v1/admin/payments/disputes/:disputeId/status -> controller/adminPaymentController.js#updateDisputeStatus | status=400 | category=validation
  error: Invalid dispute ID format
  reproducibility: PATCH /api/v1/admin/payments/disputes/:disputeId/status using context=admin
- GET /api/v1/admin/payments/ledgers/:paymentId -> controller/adminPaymentController.js#getPaymentLedgerDetail | status=400 | category=validation
  error: Invalid payment ID format
  reproducibility: GET /api/v1/admin/payments/ledgers/:paymentId using context=admin
- POST /api/v1/admin/payments/settlements -> controller/adminPaymentController.js#createSettlementRequest | status=400 | category=validation
  error: paymentId, treatmentId and servicePartnerId are required
  reproducibility: POST /api/v1/admin/payments/settlements using context=admin
- PATCH /api/v1/admin/payments/settlements/:id -> controller/adminPaymentController.js#updateSettlementStatus | status=404 | category=not-found
  error: Settlement request not found
  reproducibility: PATCH /api/v1/admin/payments/settlements/6a09c29284898a15f0c04841 using context=admin
- PATCH /api/v1/admin/payments/settlements/:settlementId/status -> controller/adminPaymentController.js#updateSettlementStatus | status=400 | category=validation
  error: Invalid settlement ID format
  reproducibility: PATCH /api/v1/admin/payments/settlements/:settlementId/status using context=admin
- PATCH /api/v1/admin/profile/password -> controller/adminGovernanceController.js#updateMyPassword | status=400 | category=validation
  error: currentPassword and newPassword are required
  reproducibility: PATCH /api/v1/admin/profile/password using context=admin
- GET /api/v1/admin/reports/runs/:runId/download -> controller/adminReportController.js#downloadReportRun | status=400 | category=validation
  error: Invalid run ID format
  reproducibility: GET /api/v1/admin/reports/runs/:runId/download using context=admin
- POST /api/v1/admin/reports/schedules -> controller/adminReportController.js#createReportSchedule | status=400 | category=validation
  error: name is required
  reproducibility: POST /api/v1/admin/reports/schedules using context=admin
- PATCH /api/v1/admin/reports/schedules/:scheduleId -> controller/adminReportController.js#updateReportSchedule | status=400 | category=validation
  error: Invalid schedule ID format
  reproducibility: PATCH /api/v1/admin/reports/schedules/:scheduleId using context=admin
- POST /api/v1/admin/reports/schedules/:scheduleId/run -> controller/adminReportController.js#runReportSchedule | status=400 | category=validation
  error: Invalid schedule ID format
  reproducibility: POST /api/v1/admin/reports/schedules/:scheduleId/run using context=admin
- PATCH /api/v1/admin/reviews/:id/moderation -> controller/reviewController.js#moderateReview | status=404 | category=not-found
  error: Review not found
  reproducibility: PATCH /api/v1/admin/reviews/6a09c29284898a15f0c04841/moderation using context=admin
- DELETE /api/v1/admin/sessions/:sessionId -> controller/adminGovernanceController.js#revokeMySessionById | status=500 | category=server-bug
  error: {"status":"error","error":{"stringValue":"\":sessionId\"","valueType":"string","kind":"ObjectId","value":":sessionId","path":"_id","reason":{},"name":"CastError","message":"Cast to ObjectId failed for value \":sessionId\" (type string) at path \"_id\" for model \"AdminSession\""},"message":"Cast to ObjectId failed for value \":sessionId\" (type string) at path \"_id\" for model \"AdminSession\"","stack":"CastError: Cast to ObjectId failed for value \":sessionId\" (type string) at path \"_id\" for model \"AdminSession\"\n    at SchemaObjectId.cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schema\\objectId.js:251:11)\n    at SchemaType.applySetters (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schemaType.js:1262:12)\n    at SchemaType.castForQuery (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schemaType.js:1698:17)\n    at cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\cast.js:390:32)\n    at Query.cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:5060:12)\n    at Query._castConditions (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:2374:10)\n    at model.Query._findOne (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:2697:8)\n    at model.Query.exec (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:4627:80)\n    at process.processTicksAndRejections (node:internal/process/task_queues:9...
  reproducibility: DELETE /api/v1/admin/sessions/:sessionId using context=admin
- DELETE /api/v1/admin/subadmins/:id -> controller/adminController.js#deleteSubAdmin | status=404 | category=not-found
  error: Admin not found
  reproducibility: DELETE /api/v1/admin/subadmins/6a09c29284898a15f0c04841 using context=admin
- GET /api/v1/admin/subadmins/:id -> controller/adminController.js#getSubAdminById | status=404 | category=not-found
  error: Admin not found
  reproducibility: GET /api/v1/admin/subadmins/6a09c29284898a15f0c04841 using context=admin
- PATCH /api/v1/admin/subadmins/:id -> controller/adminController.js#updateSubAdmin | status=404 | category=not-found
  error: Admin not found
  reproducibility: PATCH /api/v1/admin/subadmins/6a09c29284898a15f0c04841 using context=admin
- POST /api/v1/admin/subadmins/:id/force-logout -> controller/adminGovernanceController.js#forceLogoutSubAdmin | status=404 | category=not-found
  error: Admin not found
  reproducibility: POST /api/v1/admin/subadmins/6a09c29284898a15f0c04841/force-logout using context=admin
- PATCH /api/v1/admin/subadmins/:id/toggle-status -> controller/adminController.js#toggleSubAdminStatus | status=404 | category=not-found
  error: Admin not found
  reproducibility: PATCH /api/v1/admin/subadmins/6a09c29284898a15f0c04841/toggle-status using context=admin
- PATCH /api/v1/admin/support/tickets/:id -> controller/supportController.js#updateTicket | status=404 | category=not-found
  error: Support ticket not found
  reproducibility: PATCH /api/v1/admin/support/tickets/6a09c29284898a15f0c04841 using context=admin
- PATCH /api/v1/admin/treatments/:treatmentId/status -> controller/adminTreatmentController.js#updateTreatmentStatus | status=400 | category=validation
  error: Transition not allowed from Completed to undefined
  reproducibility: PATCH /api/v1/admin/treatments/6a38e2ff05494ed2c91e6d9c/status using context=admin
- POST /api/v1/admin/verify-signup-otp -> controller/adminController.js#verifySignupOtp | status=400 | category=validation
  error: Phone and OTP required
  reproducibility: POST /api/v1/admin/verify-signup-otp using context=public
- DELETE /api/v1/article/:id -> unknown | status=404 | category=not-found
  error: Article not found or you do not have permission
  reproducibility: DELETE /api/v1/article/69ff98563dfe2cc4bfac8153 using context=doctor
- PATCH /api/v1/article/:id/publish -> unknown | status=404 | category=not-found
  error: Article not found or you do not have permission
  reproducibility: PATCH /api/v1/article/69ff98563dfe2cc4bfac8153/publish using context=doctor
- POST /api/v1/article/create -> unknown | status=400 | category=validation
  error: cityName, category, title, and articleType are required
  reproducibility: POST /api/v1/article/create using context=doctor
- PUT /api/v1/article/updateArticle/:id -> unknown | status=404 | category=not-found
  error: Article not found or you do not have permission
  reproducibility: PUT /api/v1/article/updateArticle/69ff98563dfe2cc4bfac8153 using context=doctor
- POST /api/v1/booking/completed-details/:bookingId -> controller/bookingController.js#bookingCompletedDetails | status=404 | category=not-found
  error: Booking not found
  reproducibility: POST /api/v1/booking/completed-details/6a38e30005494ed2c91e6d9f using context=serviceProvider
- POST /api/v1/booking/create -> controller/bookingController.js#createBooking | status=400 | category=validation
  error: sessionNumber is required
  reproducibility: POST /api/v1/booking/create using context=patient
- GET /api/v1/booking/patient/:treatmentId -> controller/bookingController.js#getTreatmentById | status=403 | category=auth
  error: Access denied. Allowed roles: patient
  reproducibility: GET /api/v1/booking/patient/6a38e2ff05494ed2c91e6d9c using context=doctor
- POST /api/v1/booking/providerBookings -> controller/bookingController.js#createProviderBooking | status=400 | category=validation
  error: Patient not found
  reproducibility: POST /api/v1/booking/providerBookings using context=serviceProvider
- PUT /api/v1/booking/update-status/:bookingId -> controller/bookingController.js#updateServiceStatus | status=400 | category=validation
  error: Valid: "In-Progress", "TreatmentCompleted"
  reproducibility: PUT /api/v1/booking/update-status/6a38e30005494ed2c91e6d9f using context=serviceProvider
- PATCH /api/v1/chats/:roomId/seen -> controller/chatController.js#markAsSeen | status=500 | category=server-bug
  error: {"status":"error","error":{"stringValue":"\":roomId\"","valueType":"string","kind":"ObjectId","value":":roomId","path":"_id","reason":{},"name":"CastError","message":"Cast to ObjectId failed for value \":roomId\" (type string) at path \"_id\" for model \"ChatRoom\""},"message":"Cast to ObjectId failed for value \":roomId\" (type string) at path \"_id\" for model \"ChatRoom\"","stack":"CastError: Cast to ObjectId failed for value \":roomId\" (type string) at path \"_id\" for model \"ChatRoom\"\n    at SchemaObjectId.cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schema\\objectId.js:251:11)\n    at SchemaType.applySetters (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schemaType.js:1262:12)\n    at SchemaType.castForQuery (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schemaType.js:1698:17)\n    at cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\cast.js:390:32)\n    at Query.cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:5060:12)\n    at Query._castConditions (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:2374:10)\n    at model.Query._findOne (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:2697:8)\n    at model.Query.exec (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:4627:80)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async E:\\medi...
  reproducibility: PATCH /api/v1/chats/:roomId/seen using context=patient
- PATCH /api/v1/chats/fcm-token -> controller/chatController.js#updateFcmToken | status=400 | category=validation
  error: Please provide an fcmToken in the request body
  reproducibility: PATCH /api/v1/chats/fcm-token using context=patient
- POST /api/v1/city/admin/cities -> controller/cityController.js#addCity | status=400 | category=validation
  error: Name and valid polygon are required
  reproducibility: POST /api/v1/city/admin/cities using context=admin
- PUT /api/v1/city/admin/cities/:cityId -> controller/cityController.js#updateCity | status=404 | category=not-found
  error: City not found
  reproducibility: PUT /api/v1/city/admin/cities/6a02f3dea924e2b2a433f289 using context=admin
- PATCH /api/v1/city/admin/cities/toggle/:cityId -> controller/cityController.js#toggleCityStatus | status=404 | category=not-found
  error: City not found
  reproducibility: PATCH /api/v1/city/admin/cities/toggle/6a02f3dea924e2b2a433f289 using context=admin
- GET /api/v1/city/cities/:cityId -> controller/cityController.js#getCityById | status=404 | category=not-found
  error: City not found
  reproducibility: GET /api/v1/city/cities/6a02f3dea924e2b2a433f289 using context=public
- GET /api/v1/city/find/by-location -> controller/cityController.js#findCityByLocation | status=400 | category=validation
  error: lat and lng are required
  reproducibility: GET /api/v1/city/find/by-location?latitude=26.8467&longitude=80.9462 using context=public
- GET /api/v1/doctor-appointments/:appointmentId -> controller/doctorAppointmentController.js#getDoctorAppointmentById | status=500 | category=server-bug
  error: Failed to fetch doctor appointment
  reproducibility: GET /api/v1/doctor-appointments/:appointmentId using context=patient
- PUT /api/v1/doctor-appointments/:appointmentId/cancel -> controller/doctorAppointmentController.js#cancelMyDoctorAppointment | status=500 | category=server-bug
  error: Failed to cancel doctor appointment
  reproducibility: PUT /api/v1/doctor-appointments/:appointmentId/cancel using context=patient
- PUT /api/v1/doctor-appointments/:appointmentId/reschedule -> controller/doctorAppointmentController.js#rescheduleDoctorAppointment | status=400 | category=validation
  error: appointmentId, appointmentDate, startTime and endTime are required
  reproducibility: PUT /api/v1/doctor-appointments/:appointmentId/reschedule using context=doctor
- PATCH /api/v1/doctor-appointments/:appointmentId/status -> controller/doctorAppointmentController.js#updateDoctorAppointmentStatus | status=400 | category=validation
  error: status is required
  reproducibility: PATCH /api/v1/doctor-appointments/:appointmentId/status using context=doctor
- POST /api/v1/doctor-appointments/create -> controller/doctorAppointmentController.js#createDoctorAppointment | status=400 | category=validation
  error: doctorId, appointmentDate, startTime and endTime are required
  reproducibility: POST /api/v1/doctor-appointments/create using context=patient
- GET /api/v1/doctor/:doctorId/service-availability -> controller/doctorController.js#getServiceAvailability | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/6a02f50da924e2b2a433f2ae/service-availability using context=public
- GET /api/v1/doctor/:id/public-profile -> controller/doctorDiscoveryController.js#getPublicProfile | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/6a09c29284898a15f0c04841/public-profile using context=public
- POST /api/v1/doctor/addClinic -> controller/doctorController.js#addClinic | status=400 | category=validation
  error: Please provide clinics array
  reproducibility: POST /api/v1/doctor/addClinic using context=doctor
- POST /api/v1/doctor/availability -> controller/doctorController.js#configureAvailability | status=500 | category=server-bug
  error: Error configuring availability
  reproducibility: POST /api/v1/doctor/availability using context=doctor
- DELETE /api/v1/doctor/break-time -> controller/doctorController.js#removeBreakTime | status=404 | category=not-found
  error: No slots found for this date
  reproducibility: DELETE /api/v1/doctor/break-time using context=doctor
- POST /api/v1/doctor/break-time -> controller/doctorController.js#addBreakTime | status=500 | category=server-bug
  error: Doctor validation failed: clinics.0.cityId: Path `cityId` is required., clinics.0.doctorId: Path `doctorId` is required.
  reproducibility: POST /api/v1/doctor/break-time using context=doctor
- PUT /api/v1/doctor/bulk-manage-slots -> controller/doctorController.js#bulkManageSlots | status=404 | category=not-found
  error: No slots found for this date
  reproducibility: PUT /api/v1/doctor/bulk-manage-slots using context=doctor
- POST /api/v1/doctor/clinic -> controller/doctorController.js#addClinic | status=400 | category=validation
  error: Please provide clinics array
  reproducibility: POST /api/v1/doctor/clinic using context=doctor
- DELETE /api/v1/doctor/clinic/:clinicId -> controller/doctorController.js#deleteClinic | status=500 | category=server-bug
  error: Doctor validation failed: clinics.0.cityId: Path `cityId` is required., clinics.0.doctorId: Path `doctorId` is required.
  reproducibility: DELETE /api/v1/doctor/clinic/6a02f50de68e7334fa333927 using context=doctor
- PUT /api/v1/doctor/clinic/:clinicId -> controller/doctorController.js#updateClinic | status=404 | category=not-found
  error: Clinic not found
  reproducibility: PUT /api/v1/doctor/clinic/6a02f50de68e7334fa333927 using context=doctor
- DELETE /api/v1/doctor/deleteClinic/:clinicId -> controller/doctorController.js#deleteClinic | status=500 | category=server-bug
  error: Doctor validation failed: clinics.0.cityId: Path `cityId` is required., clinics.0.doctorId: Path `doctorId` is required.
  reproducibility: DELETE /api/v1/doctor/deleteClinic/6a02f50de68e7334fa333927 using context=doctor
- GET /api/v1/doctor/doctor/cities/by-name/:doctorId/:cityName -> controller/doctorController.js#getDoctorCitiesByName | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/doctor/cities/by-name/6a02f50da924e2b2a433f2ae/Lucknow using context=public
- GET /api/v1/doctor/doctor/my-cities/:doctorId -> controller/doctorController.js#getDoctorCities | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/doctor/my-cities/6a02f50da924e2b2a433f2ae using context=public
- GET /api/v1/doctor/doctors/city/:cityName -> controller/doctorController.js#getDoctorsByCityName | status=404 | category=not-found
  error: City not found: Lucknow
  reproducibility: GET /api/v1/doctor/doctors/city/Lucknow using context=public
- GET /api/v1/doctor/getClinicById/:clinicId -> controller/doctorController.js#getClinicById | status=404 | category=not-found
  error: Clinic not found
  reproducibility: GET /api/v1/doctor/getClinicById/6a02f50de68e7334fa333927 using context=doctor
- GET /api/v1/doctor/getDoctorById/:id -> controller/doctorController.js#getDoctorById | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/getDoctorById/6a09c29284898a15f0c04841 using context=public
- POST /api/v1/doctor/logout-all-devices -> controller/doctorController.js#logoutAllDevices | status=400 | category=validation
  error: Phone number is required
  reproducibility: POST /api/v1/doctor/logout-all-devices using context=public
- POST /api/v1/doctor/resend-login-otp -> controller/doctorController.js#resendLoginOtp | status=400 | category=validation
  error: Phone number is required
  reproducibility: POST /api/v1/doctor/resend-login-otp using context=public
- POST /api/v1/doctor/resend-signup-otp -> controller/doctorController.js#resendSignupOtp | status=400 | category=validation
  error: Phone number is required
  reproducibility: POST /api/v1/doctor/resend-signup-otp using context=public
- PUT /api/v1/doctor/service-availability -> controller/doctorController.js#updateServiceAvailability | status=500 | category=server-bug
  error: Doctor validation failed: clinics.0.cityId: Path `cityId` is required., clinics.0.doctorId: Path `doctorId` is required.
  reproducibility: PUT /api/v1/doctor/service-availability using context=doctor
- PUT /api/v1/doctor/service-coverage -> controller/doctorController.js#updateServiceCoverage | status=500 | category=server-bug
  error: Doctor validation failed: clinics.0.cityId: Path `cityId` is required., clinics.0.doctorId: Path `doctorId` is required.
  reproducibility: PUT /api/v1/doctor/service-coverage using context=doctor
- POST /api/v1/doctor/signup -> controller/doctorController.js#doctorSignup | status=400 | category=validation
  error: Selected city does not exist in available cities
  reproducibility: POST /api/v1/doctor/signup using context=public
- GET /api/v1/doctor/slots/:doctorId -> controller/doctorController.js#getAvailableSlots | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/slots/6a02f50da924e2b2a433f2ae?date=2026-05-09 using context=public
- PUT /api/v1/doctor/toggle-slot -> controller/doctorController.js#toggleSlotAvailability | status=404 | category=not-found
  error: No slots found for this date
  reproducibility: PUT /api/v1/doctor/toggle-slot using context=doctor
- PUT /api/v1/doctor/updateClinic/:clinicId -> controller/doctorController.js#updateClinic | status=404 | category=not-found
  error: Clinic not found
  reproducibility: PUT /api/v1/doctor/updateClinic/6a02f50de68e7334fa333927 using context=doctor
- POST /api/v1/doctor/verify-login-otp -> controller/doctorController.js#verifyLoginOtp | status=400 | category=validation
  error: Phone number and OTP are required
  reproducibility: POST /api/v1/doctor/verify-login-otp using context=public
- POST /api/v1/doctor/verify-signup-otp -> controller/doctorController.js#verifySignupOtp | status=400 | category=validation
  error: Phone number and OTP are required
  reproducibility: POST /api/v1/doctor/verify-signup-otp using context=public
- POST /api/v1/geo/check-location -> controller/geoController.js#checkAddressInPolygon | status=400 | category=validation
  error: address is required
  reproducibility: POST /api/v1/geo/check-location using context=public
- GET /api/v1/items/getItemCategoryById/:id -> controller/itemCategoryController.js#getItemsByCategory | status=404 | category=not-found
  error: Category 6a09c29284898a15f0c04841 not found or deleted
  reproducibility: GET /api/v1/items/getItemCategoryById/6a09c29284898a15f0c04841 using context=public
- PATCH /api/v1/items/toggle-status/:id -> controller/itemCategoryController.js#toggleCategoryStatus | status=404 | category=not-found
  error: Category not found
  reproducibility: PATCH /api/v1/items/toggle-status/6a09c29284898a15f0c04841 using context=admin
- PUT /api/v1/items/update/:id -> controller/itemCategoryController.js#updateCategory | status=404 | category=not-found
  error: Category not found
  reproducibility: PUT /api/v1/items/update/6a09c29284898a15f0c04841 using context=admin
- POST /api/v1/medical-records/createMedicalRecord -> controller/medicalRecordController.js#createMedicalRecord | status=500 | category=server-bug
  error: {"status":"error","error":{"errors":{"patientId":{"name":"ValidatorError","message":"Path `patientId` is required.","properties":{"message":"Path `patientId` is required.","type":"required","path":"patientId"},"kind":"required","path":"patientId"},"recordType":{"name":"ValidatorError","message":"Path `recordType` is required.","properties":{"message":"Path `recordType` is required.","type":"required","path":"recordType"},"kind":"required","path":"recordType"},"title":{"name":"ValidatorError","message":"Path `title` is required.","properties":{"message":"Path `title` is required.","type":"required","path":"title"},"kind":"required","path":"title"}},"_message":"MedicalRecord validation failed","statusCode":500,"status":"error","name":"ValidationError","message":"MedicalRecord validation failed: patientId: Path `patientId` is required., recordType: Path `recordType` is required., title: Path `title` is required."},"message":"MedicalRecord validation failed: patientId: Path `patientId` is required., recordType: Path `recordType` is required., title: Path `title` is required.","stack":"ValidationError: MedicalRecord validation failed: patientId: Path `patientId` is required., recordType: Path `recordType` is required., title: Path `title` is required.\n    at Document.invalidate (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\document.js:3362:32)\n    at E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\document.js:3123:17\n    at E:\\medico-backen...
  reproducibility: POST /api/v1/medical-records/createMedicalRecord using context=doctor
- DELETE /api/v1/medical-records/deleteMedicalRecord/:id -> controller/medicalRecordController.js#deleteMedicalRecord | status=404 | category=not-found
  error: Medical record not found
  reproducibility: DELETE /api/v1/medical-records/deleteMedicalRecord/6a09c29284898a15f0c04841 using context=patient
- GET /api/v1/medical-records/prescriptions/appointment/:appointmentId -> controller/medicalRecordController.js#getPrescriptionsByAppointmentId | status=500 | category=server-bug
  error: {"status":"error","error":{"stringValue":"\":appointmentId\"","valueType":"string","kind":"ObjectId","value":":appointmentId","path":"appointmentId","reason":{},"name":"CastError","message":"Cast to ObjectId failed for value \":appointmentId\" (type string) at path \"appointmentId\" for model \"MedicalRecord\""},"message":"Cast to ObjectId failed for value \":appointmentId\" (type string) at path \"appointmentId\" for model \"MedicalRecord\"","stack":"CastError: Cast to ObjectId failed for value \":appointmentId\" (type string) at path \"appointmentId\" for model \"MedicalRecord\"\n    at SchemaObjectId.cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schema\\objectId.js:251:11)\n    at SchemaType.applySetters (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schemaType.js:1262:12)\n    at SchemaType.castForQuery (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\schemaType.js:1698:17)\n    at cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\cast.js:390:32)\n    at Query.cast (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:5060:12)\n    at Query._castConditions (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:2374:10)\n    at model.Query._find (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:2401:8)\n    at model.Query.exec (E:\\medico-backend\\medico_backend\\node_modules\\mongoose\\lib\\query.js:4627:80)\n    at process.pr...
  reproducibility: GET /api/v1/medical-records/prescriptions/appointment/:appointmentId using context=patient
- POST /api/v1/medical-records/shareMedicalRecord/:id/share -> controller/medicalRecordController.js#shareMedicalRecord | status=404 | category=not-found
  error: Medical record not found
  reproducibility: POST /api/v1/medical-records/shareMedicalRecord/6a09c29284898a15f0c04841/share using context=patient
- PATCH /api/v1/medical-records/updateMedicalRecord/:id -> controller/medicalRecordController.js#updateMedicalRecord | status=404 | category=not-found
  error: Medical record not found
  reproducibility: PATCH /api/v1/medical-records/updateMedicalRecord/6a09c29284898a15f0c04841 using context=patient
- POST /api/v1/patient/follow/:doctorId -> controller/patientController.js#followDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: POST /api/v1/patient/follow/6a02f50da924e2b2a433f2ae using context=patient
- GET /api/v1/patient/getById/:patientId -> controller/patientController.js#getPatientById | status=404 | category=not-found
  error: Patient not found
  reproducibility: GET /api/v1/patient/getById/6a031fdd05fb2370df312453 using context=public
- POST /api/v1/patient/logout-all -> controller/patientController.js#patientLogoutAll | status=400 | category=validation
  error: Please provide phone number
  reproducibility: POST /api/v1/patient/logout-all using context=public
- POST /api/v1/patient/resend-login-otp -> controller/patientController.js#resendLoginOtp | status=400 | category=validation
  error: Please provide phone number
  reproducibility: POST /api/v1/patient/resend-login-otp using context=public
- POST /api/v1/patient/resend-signup-otp -> controller/patientController.js#resendSignupOtp | status=400 | category=validation
  error: Please provide phone number
  reproducibility: POST /api/v1/patient/resend-signup-otp using context=public
- POST /api/v1/patient/signup -> controller/patientController.js#patientSignup | status=400 | category=validation
  error: At least one address is required
  reproducibility: POST /api/v1/patient/signup using context=public
- DELETE /api/v1/patient/unfollow/:doctorId -> controller/patientController.js#unfollowDoctor | status=400 | category=validation
  error: Not following this doctor
  reproducibility: DELETE /api/v1/patient/unfollow/6a02f50da924e2b2a433f2ae using context=patient
- PATCH /api/v1/patient/updateProfile/:id -> controller/patientController.js#updatePatient | status=404 | category=not-found
  error: The patient does not exist
  reproducibility: PATCH /api/v1/patient/updateProfile/6a031fdd05fb2370df312453 using context=patient
- POST /api/v1/patient/verify-login-otp -> controller/patientController.js#verifyLoginOtp | status=400 | category=validation
  error: Please provide phone and OTP
  reproducibility: POST /api/v1/patient/verify-login-otp using context=public
- POST /api/v1/patient/verify-signup-otp -> controller/patientController.js#verifySignupOtp | status=400 | category=validation
  error: Please provide phone and OTP
  reproducibility: POST /api/v1/patient/verify-signup-otp using context=public
- POST /api/v1/payments/booking/:bookingId/advance/order -> controller/payController.js#createBookingAdvanceOrderCompat | status=403 | category=auth
  error: Access denied. Allowed roles: patient
  reproducibility: POST /api/v1/payments/booking/6a38e30005494ed2c91e6d9f/advance/order using context=serviceProvider
- POST /api/v1/payments/qr/generate -> controller/payController.js#generateQrPaymentIntent | status=400 | category=validation
  error: entityId and valid amount are required
  reproducibility: POST /api/v1/payments/qr/generate using context=patient
- POST /api/v1/payments/qr/verify -> controller/payController.js#verifyQrPaymentIntent | status=404 | category=not-found
  error: QR payment intent not found
  reproducibility: POST /api/v1/payments/qr/verify using context=patient
- POST /api/v1/payments/settlements/request -> controller/payController.js#requestSettlement | status=400 | category=validation
  error: A valid amount is required
  reproducibility: POST /api/v1/payments/settlements/request using context=admin
- POST /api/v1/payments/treatments/:treatmentId/manual-collection -> controller/payController.js#recordManualPayment | status=400 | category=validation
  error: Amount exceeds the remaining treatment balance
  reproducibility: POST /api/v1/payments/treatments/6a38e2ff05494ed2c91e6d9c/manual-collection using context=admin
- POST /api/v1/payments/treatments/:treatmentId/online/order -> controller/payController.js#createTreatmentOnlineOrder | status=403 | category=auth
  error: Access denied. Allowed roles: patient
  reproducibility: POST /api/v1/payments/treatments/6a38e2ff05494ed2c91e6d9c/online/order using context=serviceProvider
- POST /api/v1/payments/treatments/:treatmentId/online/verify -> controller/payController.js#verifyTreatmentOnlinePayment | status=403 | category=auth
  error: Access denied. Allowed roles: patient
  reproducibility: POST /api/v1/payments/treatments/6a38e2ff05494ed2c91e6d9c/online/verify using context=serviceProvider
- PATCH /api/v1/reviews/admin/:id/moderation -> controller/reviewController.js#moderateReview | status=404 | category=not-found
  error: Review not found
  reproducibility: PATCH /api/v1/reviews/admin/6a09c29284898a15f0c04841/moderation using context=admin
- POST /api/v1/reviews/createReview -> controller/reviewController.js#createReview | status=404 | category=not-found
  error: Booking not found
  reproducibility: POST /api/v1/reviews/createReview using context=patient
- DELETE /api/v1/reviews/deleteReview/:id -> controller/reviewController.js#deleteReview | status=404 | category=not-found
  error: Review not found
  reproducibility: DELETE /api/v1/reviews/deleteReview/6a09c29284898a15f0c04841 using context=patient
- PATCH /api/v1/reviews/updateReview/:id -> controller/reviewController.js#updateReview | status=404 | category=not-found
  error: Review not found
  reproducibility: PATCH /api/v1/reviews/updateReview/6a09c29284898a15f0c04841 using context=patient
- GET /api/v1/service/:id/price -> controller/serviceController.js#calculateServicePrice | status=404 | category=not-found
  error: Service not found or inactive
  reproducibility: GET /api/v1/service/6a09c29284898a15f0c04841/price using context=public
- POST /api/v1/service/:id/restore -> controller/serviceController.js#restoreService | status=404 | category=not-found
  error: Deleted service not found
  reproducibility: POST /api/v1/service/6a09c29284898a15f0c04841/restore using context=admin
- PATCH /api/v1/service/:id/toggle-status -> controller/serviceController.js#toggleServiceStatus | status=404 | category=not-found
  error: Service not found
  reproducibility: PATCH /api/v1/service/6a09c29284898a15f0c04841/toggle-status using context=admin
- GET /api/v1/service/:serviceId/slots -> controller/serviceController.js#getAvailableSlots | status=400 | category=validation
  error: Date is required
  reproducibility: GET /api/v1/service/6a03248b28ee1195704f453f/slots using context=public
- POST /api/v1/service/admin/bulk-update -> controller/serviceController.js#bulkUpdateServices | status=400 | category=validation
  error: Service IDs array is required
  reproducibility: POST /api/v1/service/admin/bulk-update using context=admin
- POST /api/v1/service/createService -> controller/serviceController.js#createService | status=400 | category=validation
  error: Invalid city IDs: 6a02f3dea924e2b2a433f289
  reproducibility: POST /api/v1/service/createService using context=admin
- GET /api/v1/service/getServiceById/:id -> controller/serviceController.js#getServiceById | status=404 | category=not-found
  error: Service not found
  reproducibility: GET /api/v1/service/getServiceById/6a09c29284898a15f0c04841 using context=public
- GET /api/v1/service/nursing/:nursingType -> controller/serviceController.js#getNursingServicesByType | status=400 | category=validation
  error: Invalid nursingType parameter
  reproducibility: GET /api/v1/service/nursing/icu using context=public
- PATCH /api/v1/service/services/:id -> controller/serviceController.js#updateService | status=404 | category=not-found
  error: Service not found
  reproducibility: PATCH /api/v1/service/services/6a03248b28ee1195704f453f using context=admin
- PATCH /api/v1/serviceProvider/:id/toggle-status -> controller/providerController.js#toggleStatus | status=404 | category=not-found
  error: Service provider not found
  reproducibility: PATCH /api/v1/serviceProvider/6a09c29284898a15f0c04841/toggle-status using context=admin
- POST /api/v1/serviceProvider/createservice-provider -> controller/providerController.js#createServiceProvider | status=400 | category=validation
  error: One or more selected cities are invalid or inactive
  reproducibility: POST /api/v1/serviceProvider/createservice-provider using context=admin
- GET /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#getServiceProviderById | status=404 | category=not-found
  error: Service provider not found
  reproducibility: GET /api/v1/serviceProvider/service-provider/6a3a38454ce5f0f3979786f5 using context=public
- PUT /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#updateServiceProvider | status=404 | category=not-found
  error: Service provider not found
  reproducibility: PUT /api/v1/serviceProvider/service-provider/6a3a38454ce5f0f3979786f5 using context=admin
- PATCH /api/v1/serviceProvider/service-provider/:id/workflow -> controller/providerController.js#updateServiceProviderWorkflow | status=400 | category=validation
  error: Invalid workflow action
  reproducibility: PATCH /api/v1/serviceProvider/service-provider/6a3a38454ce5f0f3979786f5/workflow using context=admin
- GET /api/v1/serviceProvider/service-provider/appointments -> controller/providerController.js#getServiceProviderAppointments | status=404 | category=not-found
  error: Service provider not found or inactive
  reproducibility: GET /api/v1/serviceProvider/service-provider/appointments using context=admin
- GET /api/v1/serviceProvider/service-provider/appointments/:id -> controller/providerController.js#getSingleAppointment | status=404 | category=not-found
  error: Appointment not found or not assigned to you
  reproducibility: GET /api/v1/serviceProvider/service-provider/appointments/6a3a38454ce5f0f3979786f5 using context=admin
- POST /api/v1/socialPost/followDoctor -> controller/socialmediaController.js#toggleFollowDoctor | status=400 | category=validation
  error: targetDoctorId required
  reproducibility: POST /api/v1/socialPost/followDoctor using context=patient
- PATCH /api/v1/socialPost/posts/:id/hide -> controller/socialmediaController.js#toggleHidePost | status=404 | category=not-found
  error: Post not found
  reproducibility: PATCH /api/v1/socialPost/posts/6a32374973dc6dcb2d6b33a4/hide using context=admin
- POST /api/v1/socialPost/posts/:id/report -> controller/socialmediaController.js#reportPost | status=400 | category=validation
  error: Reason for reporting is required
  reproducibility: POST /api/v1/socialPost/posts/6a32374973dc6dcb2d6b33a4/report using context=patient
- PATCH /api/v1/socialPost/reports/:reportId/resolve -> controller/socialmediaController.js#resolvePostReport | status=400 | category=validation
  error: Status must be resolved or dismissed
  reproducibility: PATCH /api/v1/socialPost/reports/:reportId/resolve using context=admin
- POST /api/v1/socialPost/savePost/:id/toggle -> controller/socialmediaController.js#toggleSavePost | status=404 | category=not-found
  error: Post not found
  reproducibility: POST /api/v1/socialPost/savePost/6a32374973dc6dcb2d6b33a4/toggle using context=patient
- POST /api/v1/support/addMessageTickets/:id -> controller/supportController.js#addMessage | status=404 | category=not-found
  error: Support ticket not found
  reproducibility: POST /api/v1/support/addMessageTickets/6a09c29284898a15f0c04841 using context=patient
- POST /api/v1/support/createTicket -> controller/supportController.js#createTicket | status=400 | category=validation
  error: subject is required
  reproducibility: POST /api/v1/support/createTicket using context=patient
- POST /api/v1/uploadfile/upload -> unknown | status=400 | category=validation
  error: File is required in form-data field 'file'
  reproducibility: POST /api/v1/uploadfile/upload using context=public
- POST /api/v1/addPatientAddress -> controller/seperateAddressPatient.js#addPatientAddress | status=N/A | category=unmounted
  error: Route file exists but not mounted in route/index.js
  reproducibility: n/a
- DELETE /api/v1/deletePatientAddress/:addressId -> controller/seperateAddressPatient.js#deletePatientAddress | status=N/A | category=unmounted
  error: Route file exists but not mounted in route/index.js
  reproducibility: n/a
- GET /api/v1/getMyAddress -> controller/seperateAddressPatient.js#getMyAddresses | status=N/A | category=unmounted
  error: Route file exists but not mounted in route/index.js
  reproducibility: n/a
- PATCH /api/v1/setPrimaryAddress/:addressId/set-primary -> controller/seperateAddressPatient.js#setPrimaryAddress | status=N/A | category=unmounted
  error: Route file exists but not mounted in route/index.js
  reproducibility: n/a
- PATCH /api/v1/updatePatientAddress/:addressId -> controller/seperateAddressPatient.js#updatePatientAddress | status=N/A | category=unmounted
  error: Route file exists but not mounted in route/index.js
  reproducibility: n/a