# Route Error Diff

- generatedAt: 2026-05-09T21:37:27.656Z
- totalErrorRoutes: 79

- POST /api/v1/admin/admin/booking/approve-cancellation/:bookingId -> controller/adminController.js#approveCancellation | status=400 | category=validation
  error: No pending cancellation request found
  reproducibility: POST /api/v1/admin/admin/booking/approve-cancellation/69ffa3d99c75101f5978f39a using context=admin
- GET /api/v1/admin/admin/city/:cityId/doctors -> controller/adminController.js#getDoctorsByCity | status=400 | category=validation
  error: City ID is required
  reproducibility: GET /api/v1/admin/admin/city/69ff3b98830a1994a761a1ee/doctors using context=admin
- POST /api/v1/admin/bookings/create -> controller/adminController.js#createBookingByAdmin | status=400 | category=validation
  error: Patient city not set. Please update patient address first.
  reproducibility: POST /api/v1/admin/bookings/create using context=admin
- PATCH /api/v1/admin/bookings/update/:bookingId -> controller/adminController.js#updateBookingByAdmin | status=400 | category=validation
  error: Patient city not set. Please update patient address first.
  reproducibility: PATCH /api/v1/admin/bookings/update/69ffa3d99c75101f5978f39a using context=admin
- GET /api/v1/admin/doctors/:id -> controller/adminController.js#getDoctorById | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/admin/doctors/69ff3915c8fa24866d65b379 using context=admin
- PUT /api/v1/admin/doctors/:id/approve -> controller/adminController.js#approveDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PUT /api/v1/admin/doctors/69ff3915c8fa24866d65b379/approve using context=admin
- PUT /api/v1/admin/doctors/:id/reject -> controller/adminController.js#rejectDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PUT /api/v1/admin/doctors/69ff3915c8fa24866d65b379/reject using context=admin
- PATCH /api/v1/admin/doctors/:id/toggle-status -> controller/adminController.js#toggleDoctorStatus | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PATCH /api/v1/admin/doctors/69ff3915c8fa24866d65b379/toggle-status using context=admin
- POST /api/v1/admin/doctors/create -> controller/adminController.js#createDoctor | status=400 | category=validation
  error: Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization
  reproducibility: POST /api/v1/admin/doctors/create using context=admin
- POST /api/v1/admin/login -> controller/adminController.js#adminLogin | status=400 | category=validation
  error: Email and password required
  reproducibility: POST /api/v1/admin/login using context=public
- POST /api/v1/admin/logout-all-devices -> controller/adminController.js#logoutAllDevices | status=400 | category=validation
  error: Email required
  reproducibility: POST /api/v1/admin/logout-all-devices using context=public
- GET /api/v1/admin/patients/:id -> controller/adminController.js#getPatientById | status=404 | category=not-found
  error: Patient not found
  reproducibility: GET /api/v1/admin/patients/69a59e5de3e14f2bcc96c888 using context=admin
- PUT /api/v1/admin/patients/:id/block -> controller/adminController.js#blockPatient | status=404 | category=not-found
  error: Patient not found
  reproducibility: PUT /api/v1/admin/patients/69a59e5de3e14f2bcc96c888/block using context=admin
- PATCH /api/v1/admin/patients/:id/toggle-status -> controller/adminController.js#togglePatientStatus | status=404 | category=not-found
  error: Patient not found
  reproducibility: PATCH /api/v1/admin/patients/69a59e5de3e14f2bcc96c888/toggle-status using context=admin
- PATCH /api/v1/admin/subadmins/:id/toggle-status -> controller/adminController.js#toggleSubAdminStatus | status=404 | category=not-found
  error: Admin not found
  reproducibility: PATCH /api/v1/admin/subadmins/69ff41cf4e5853f8a36a4622/toggle-status using context=public
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
  reproducibility: POST /api/v1/booking/completed-details/69ffa3d99c75101f5978f39a using context=serviceProvider
- POST /api/v1/booking/create -> controller/bookingController.js#createBooking | status=400 | category=validation
  error: sessionNumber is required
  reproducibility: POST /api/v1/booking/create using context=patient
- GET /api/v1/booking/patient/:treatmentId -> controller/bookingController.js#getTreatmentById | status=403 | category=auth
  error: Access denied. Allowed roles: patient
  reproducibility: GET /api/v1/booking/patient/69ffa3d99c75101f5978f398 using context=doctor
- POST /api/v1/booking/providerBookings -> controller/bookingController.js#createProviderBooking | status=400 | category=validation
  error: Patient not found
  reproducibility: POST /api/v1/booking/providerBookings using context=serviceProvider
- PUT /api/v1/booking/update-status/:bookingId -> controller/bookingController.js#updateServiceStatus | status=400 | category=validation
  error: Valid: "In-Progress", "TreatmentCompleted"
  reproducibility: PUT /api/v1/booking/update-status/69ffa3d99c75101f5978f39a using context=serviceProvider
- POST /api/v1/city/admin/cities -> controller/cityController.js#addCity | status=400 | category=validation
  error: Name and valid polygon are required
  reproducibility: POST /api/v1/city/admin/cities using context=admin
- PUT /api/v1/city/admin/cities/:cityId -> controller/cityController.js#updateCity | status=404 | category=not-found
  error: City not found
  reproducibility: PUT /api/v1/city/admin/cities/69ff3b98830a1994a761a1ee using context=admin
- PATCH /api/v1/city/admin/cities/toggle/:cityId -> controller/cityController.js#toggleCityStatus | status=404 | category=not-found
  error: City not found
  reproducibility: PATCH /api/v1/city/admin/cities/toggle/69ff3b98830a1994a761a1ee using context=admin
- GET /api/v1/city/cities/:cityId -> controller/cityController.js#getCityById | status=404 | category=not-found
  error: City not found
  reproducibility: GET /api/v1/city/cities/69ff3b98830a1994a761a1ee using context=public
- GET /api/v1/city/find/by-location -> controller/cityController.js#findCityByLocation | status=400 | category=validation
  error: lat and lng are required
  reproducibility: GET /api/v1/city/find/by-location?latitude=26.8467&longitude=80.9462 using context=public
- GET /api/v1/doctor/:doctorId/service-availability -> controller/doctorController.js#getServiceAvailability | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/69ff3915c8fa24866d65b379/service-availability using context=public
- DELETE /api/v1/doctor/break-time -> controller/doctorController.js#removeBreakTime | status=404 | category=not-found
  error: No slots found for this date
  reproducibility: DELETE /api/v1/doctor/break-time using context=doctor
- PUT /api/v1/doctor/bulk-manage-slots -> controller/doctorController.js#bulkManageSlots | status=404 | category=not-found
  error: No slots found for this date
  reproducibility: PUT /api/v1/doctor/bulk-manage-slots using context=doctor
- PUT /api/v1/doctor/clinic/:clinicId -> controller/doctorController.js#updateClinic | status=404 | category=not-found
  error: Clinic not found
  reproducibility: PUT /api/v1/doctor/clinic/69ffa8839fce833a9aabd152 using context=doctor
- GET /api/v1/doctor/doctor/cities/by-name/:doctorId/:cityName -> controller/doctorController.js#getDoctorCitiesByName | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/doctor/cities/by-name/69ff3915c8fa24866d65b379/Lucknow using context=public
- GET /api/v1/doctor/doctor/my-cities/:doctorId -> controller/doctorController.js#getDoctorCities | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/doctor/my-cities/69ff3915c8fa24866d65b379 using context=public
- GET /api/v1/doctor/getDoctorById/:id -> controller/doctorController.js#getDoctorById | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/getDoctorById/69ff41cf4e5853f8a36a4622 using context=public
- POST /api/v1/doctor/logout-all-devices -> controller/doctorController.js#logoutAllDevices | status=400 | category=validation
  error: Phone number is required
  reproducibility: POST /api/v1/doctor/logout-all-devices using context=public
- POST /api/v1/doctor/resend-login-otp -> controller/doctorController.js#resendLoginOtp | status=400 | category=validation
  error: Phone number is required
  reproducibility: POST /api/v1/doctor/resend-login-otp using context=public
- POST /api/v1/doctor/resend-signup-otp -> controller/doctorController.js#resendSignupOtp | status=400 | category=validation
  error: Phone number is required
  reproducibility: POST /api/v1/doctor/resend-signup-otp using context=public
- POST /api/v1/doctor/signup -> controller/doctorController.js#doctorSignup | status=400 | category=validation
  error: Selected city does not exist in available cities
  reproducibility: POST /api/v1/doctor/signup using context=public
- GET /api/v1/doctor/slots/:doctorId -> controller/doctorController.js#getAvailableSlots | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/slots/69ff3915c8fa24866d65b379?date=2026-05-09 using context=public
- PUT /api/v1/doctor/toggle-slot -> controller/doctorController.js#toggleSlotAvailability | status=404 | category=not-found
  error: Slot not found
  reproducibility: PUT /api/v1/doctor/toggle-slot using context=doctor
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
  error: Category 69ff41cf4e5853f8a36a4622 not found or deleted
  reproducibility: GET /api/v1/items/getItemCategoryById/69ff41cf4e5853f8a36a4622 using context=public
- PATCH /api/v1/items/toggle-status/:id -> controller/itemCategoryController.js#toggleCategoryStatus | status=404 | category=not-found
  error: Category not found
  reproducibility: PATCH /api/v1/items/toggle-status/69ff41cf4e5853f8a36a4622 using context=admin
- PUT /api/v1/items/update/:id -> controller/itemCategoryController.js#updateCategory | status=404 | category=not-found
  error: Category not found
  reproducibility: PUT /api/v1/items/update/69ff41cf4e5853f8a36a4622 using context=admin
- POST /api/v1/patient/follow/:doctorId -> controller/patientController.js#followDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: POST /api/v1/patient/follow/69ff3915c8fa24866d65b379 using context=patient
- GET /api/v1/patient/getById/:patientId -> controller/patientController.js#getPatientById | status=404 | category=not-found
  error: Patient not found
  reproducibility: GET /api/v1/patient/getById/69a59e5de3e14f2bcc96c888 using context=public
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
  error: Address with cityId is required
  reproducibility: POST /api/v1/patient/signup using context=public
- DELETE /api/v1/patient/unfollow/:doctorId -> controller/patientController.js#unfollowDoctor | status=400 | category=validation
  error: Not following this doctor
  reproducibility: DELETE /api/v1/patient/unfollow/69ff3915c8fa24866d65b379 using context=patient
- PATCH /api/v1/patient/updateProfile/:id -> controller/patientController.js#updatePatient | status=404 | category=not-found
  error: The patient does not exist
  reproducibility: PATCH /api/v1/patient/updateProfile/69a59e5de3e14f2bcc96c888 using context=patient
- POST /api/v1/patient/verify-login-otp -> controller/patientController.js#verifyLoginOtp | status=400 | category=validation
  error: Please provide phone and OTP
  reproducibility: POST /api/v1/patient/verify-login-otp using context=public
- POST /api/v1/patient/verify-signup-otp -> controller/patientController.js#verifySignupOtp | status=400 | category=validation
  error: Please provide phone and OTP
  reproducibility: POST /api/v1/patient/verify-signup-otp using context=public
- POST /api/v1/payments/treatments/:treatmentId/online/order -> controller/payController.js#createTreatmentOnlineOrder | status=403 | category=auth
  error: Access denied. Allowed roles: patient
  reproducibility: POST /api/v1/payments/treatments/69ffa3d99c75101f5978f398/online/order using context=serviceProvider
- POST /api/v1/payments/treatments/:treatmentId/online/verify -> controller/payController.js#verifyTreatmentOnlinePayment | status=403 | category=auth
  error: Access denied. Allowed roles: patient
  reproducibility: POST /api/v1/payments/treatments/69ffa3d99c75101f5978f398/online/verify using context=serviceProvider
- GET /api/v1/service/:id/price -> controller/serviceController.js#calculateServicePrice | status=404 | category=not-found
  error: Service not found or inactive
  reproducibility: GET /api/v1/service/69ff41cf4e5853f8a36a4622/price using context=public
- POST /api/v1/service/:id/restore -> controller/serviceController.js#restoreService | status=404 | category=not-found
  error: Deleted service not found
  reproducibility: POST /api/v1/service/69ff41cf4e5853f8a36a4622/restore using context=admin
- PATCH /api/v1/service/:id/toggle-status -> controller/serviceController.js#toggleServiceStatus | status=404 | category=not-found
  error: Service not found
  reproducibility: PATCH /api/v1/service/69ff41cf4e5853f8a36a4622/toggle-status using context=admin
- GET /api/v1/service/:serviceId/slots -> controller/serviceController.js#getAvailableSlots | status=400 | category=validation
  error: Date is required
  reproducibility: GET /api/v1/service/6915d7cf9033f3ce1c0f322e/slots using context=public
- POST /api/v1/service/admin/bulk-update -> controller/serviceController.js#bulkUpdateServices | status=400 | category=validation
  error: Service IDs array is required
  reproducibility: POST /api/v1/service/admin/bulk-update using context=admin
- POST /api/v1/service/createService -> controller/serviceController.js#createService | status=400 | category=validation
  error: Invalid city IDs: 69ff3b98830a1994a761a1ee
  reproducibility: POST /api/v1/service/createService using context=admin
- GET /api/v1/service/getServiceById/:id -> controller/serviceController.js#getServiceById | status=404 | category=not-found
  error: Service not found
  reproducibility: GET /api/v1/service/getServiceById/69ff41cf4e5853f8a36a4622 using context=public
- GET /api/v1/service/nursing/:nursingType -> controller/serviceController.js#getNursingServicesByType | status=400 | category=validation
  error: Invalid nursingType parameter
  reproducibility: GET /api/v1/service/nursing/icu using context=public
- PATCH /api/v1/service/services/:id -> controller/serviceController.js#updateService | status=404 | category=not-found
  error: Service not found
  reproducibility: PATCH /api/v1/service/services/6915d7cf9033f3ce1c0f322e using context=admin
- PATCH /api/v1/serviceProvider/:id/toggle-status -> controller/providerController.js#toggleStatus | status=404 | category=not-found
  error: Service provider not found
  reproducibility: PATCH /api/v1/serviceProvider/69ff41cf4e5853f8a36a4622/toggle-status using context=admin
- POST /api/v1/serviceProvider/createservice-provider -> controller/providerController.js#createServiceProvider | status=400 | category=validation
  error: One or more selected cities are invalid or inactive
  reproducibility: POST /api/v1/serviceProvider/createservice-provider using context=admin
- GET /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#getServiceProviderById | status=404 | category=not-found
  error: Service provider not found
  reproducibility: GET /api/v1/serviceProvider/service-provider/69ffa8fa99b8eb3226f7813c using context=public
- PUT /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#updateServiceProvider | status=404 | category=not-found
  error: Service provider not found
  reproducibility: PUT /api/v1/serviceProvider/service-provider/69ffa8fa99b8eb3226f7813c using context=admin
- GET /api/v1/serviceProvider/service-provider/appointments -> controller/providerController.js#getServiceProviderAppointments | status=404 | category=not-found
  error: Service provider not found or inactive
  reproducibility: GET /api/v1/serviceProvider/service-provider/appointments using context=admin
- GET /api/v1/serviceProvider/service-provider/appointments/:id -> controller/providerController.js#getSingleAppointment | status=404 | category=not-found
  error: Appointment not found or not assigned to you
  reproducibility: GET /api/v1/serviceProvider/service-provider/appointments/69ffa8fa99b8eb3226f7813c using context=admin
- POST /api/v1/socialPost/followDoctor -> controller/socialmediaController.js#toggleFollowDoctor | status=400 | category=validation
  error: targetDoctorId required
  reproducibility: POST /api/v1/socialPost/followDoctor using context=patient
- PATCH /api/v1/socialPost/posts/:id/hide -> controller/socialmediaController.js#toggleHidePost | status=404 | category=not-found
  error: Post not found
  reproducibility: PATCH /api/v1/socialPost/posts/69ffa8929fce833a9aabd333/hide using context=admin
- POST /api/v1/uploadfile/upload -> unknown | status=400 | category=validation
  error: File is required in form-data field 'file'
  reproducibility: POST /api/v1/uploadfile/upload using context=public