# Route Error Diff

- generatedAt: 2026-05-09T12:11:16.852Z
- totalErrorRoutes: 142

- POST /api/v1/admin/addEquipments -> controller/adminController.js#addEquipment | status=400 | category=validation
  error: At least one city ID is required.
  reproducibility: POST /api/v1/admin/addEquipments using context=admin
- POST /api/v1/admin/admin/booking/approve-cancellation/:bookingId -> controller/adminController.js#approveCancellation | status=400 | category=validation
  error: No pending cancellation request found
  reproducibility: POST /api/v1/admin/admin/booking/approve-cancellation/69c5282b8cf9e49defc29dd9 using context=admin
- GET /api/v1/admin/admin/city/:cityId/doctors -> controller/adminController.js#getDoctorsByCity | status=400 | category=validation
  error: City ID is required
  reproducibility: GET /api/v1/admin/admin/city/6909ec0bb7dcc56ab86a9fa7/doctors using context=admin
- POST /api/v1/admin/admin/doctor/add-cities -> controller/adminController.js#addDoctorToCities | status=400 | category=validation
  error: Doctor ID is required
  reproducibility: POST /api/v1/admin/admin/doctor/add-cities using context=admin
- POST /api/v1/admin/admin/doctor/remove-cities -> controller/adminController.js#removeDoctorFromCities | status=400 | category=validation
  error: Doctor ID is required
  reproducibility: POST /api/v1/admin/admin/doctor/remove-cities using context=admin
- PUT /api/v1/admin/admin/doctor/update-cities -> controller/adminController.js#updateDoctorCities | status=400 | category=validation
  error: Doctor ID is required
  reproducibility: PUT /api/v1/admin/admin/doctor/update-cities using context=admin
- PATCH /api/v1/admin/bookings/:bookingId/status -> controller/adminController.js#updateBookingStatus | status=400 | category=validation
  error: Booking ID and new status are required
  reproducibility: PATCH /api/v1/admin/bookings/69c5282b8cf9e49defc29dd9/status using context=public
- POST /api/v1/admin/bookings/create -> controller/adminController.js#createBookingByAdmin | status=400 | category=validation
  error: patientId, serviceId, appointmentDate and startTime are required
  reproducibility: POST /api/v1/admin/bookings/create using context=admin
- PATCH /api/v1/admin/bookings/update/:bookingId -> controller/adminController.js#updateBookingByAdmin | status=500 | category=server-bug
  error: Error updating booking
  reproducibility: PATCH /api/v1/admin/bookings/update/69c5282b8cf9e49defc29dd9 using context=admin
- DELETE /api/v1/admin/doctors/:id -> controller/adminController.js#deleteDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: DELETE /api/v1/admin/doctors/699da06d063f7bf10e8ab446 using context=admin
- GET /api/v1/admin/doctors/:id -> controller/adminController.js#getDoctorById | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/admin/doctors/699da06d063f7bf10e8ab446 using context=admin
- PUT /api/v1/admin/doctors/:id/approve -> controller/adminController.js#approveDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PUT /api/v1/admin/doctors/699da06d063f7bf10e8ab446/approve using context=admin
- PUT /api/v1/admin/doctors/:id/reject -> controller/adminController.js#rejectDoctor | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PUT /api/v1/admin/doctors/699da06d063f7bf10e8ab446/reject using context=admin
- PATCH /api/v1/admin/doctors/:id/toggle-status -> controller/adminController.js#toggleDoctorStatus | status=404 | category=not-found
  error: Doctor not found
  reproducibility: PATCH /api/v1/admin/doctors/699da06d063f7bf10e8ab446/toggle-status using context=admin
- POST /api/v1/admin/doctors/create -> controller/adminController.js#createDoctor | status=400 | category=validation
  error: Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization
  reproducibility: POST /api/v1/admin/doctors/create using context=admin
- POST /api/v1/admin/login -> controller/adminController.js#adminLogin | status=400 | category=validation
  error: Email and password required
  reproducibility: POST /api/v1/admin/login using context=public
- POST /api/v1/admin/logout-all-devices -> controller/adminController.js#logoutAllDevices | status=400 | category=validation
  error: Email required
  reproducibility: POST /api/v1/admin/logout-all-devices using context=public
- DELETE /api/v1/admin/patient/:patientId/medications -> controller/adminController.js#adminRemoveMedication | status=400 | category=validation
  error: Please provide medication details to remove
  reproducibility: DELETE /api/v1/admin/patient/6909a373c21dc072f0dc1a87/medications using context=admin
- POST /api/v1/admin/patient/:patientId/medications -> controller/adminController.js#adminAddMedication | status=400 | category=validation
  error: Please provide medication details
  reproducibility: POST /api/v1/admin/patient/6909a373c21dc072f0dc1a87/medications using context=admin
- DELETE /api/v1/admin/patients/:id -> controller/adminController.js#deletePatient | status=404 | category=not-found
  error: Patient not found
  reproducibility: DELETE /api/v1/admin/patients/699da06d063f7bf10e8ab446 using context=admin
- GET /api/v1/admin/patients/:id -> controller/adminController.js#getPatientById | status=404 | category=not-found
  error: Patient not found
  reproducibility: GET /api/v1/admin/patients/699da06d063f7bf10e8ab446 using context=admin
- PUT /api/v1/admin/patients/:id/block -> controller/adminController.js#blockPatient | status=404 | category=not-found
  error: Patient not found
  reproducibility: PUT /api/v1/admin/patients/699da06d063f7bf10e8ab446/block using context=admin
- PATCH /api/v1/admin/patients/:id/toggle-status -> controller/adminController.js#togglePatientStatus | status=404 | category=not-found
  error: Patient not found
  reproducibility: PATCH /api/v1/admin/patients/699da06d063f7bf10e8ab446/toggle-status using context=admin
- POST /api/v1/admin/patients/create -> controller/adminController.js#createPatient | status=400 | category=validation
  error: Please provide all required fields: firstName, email, phone, password
  reproducibility: POST /api/v1/admin/patients/create using context=admin
- PATCH /api/v1/admin/subadmins/:id/toggle-status -> controller/adminController.js#toggleSubAdminStatus | status=404 | category=not-found
  error: Admin not found
  reproducibility: PATCH /api/v1/admin/subadmins/699da06d063f7bf10e8ab446/toggle-status using context=public
- POST /api/v1/admin/verify-signup-otp -> controller/adminController.js#verifySignupOtp | status=400 | category=validation
  error: Phone and OTP required
  reproducibility: POST /api/v1/admin/verify-signup-otp using context=public
- DELETE /api/v1/article/:id -> unknown | status=404 | category=not-found
  error: Article not found or you do not have permission
  reproducibility: DELETE /api/v1/article/699da06d063f7bf10e8ab446 using context=doctor
- PATCH /api/v1/article/:id/publish -> unknown | status=404 | category=not-found
  error: Article not found or you do not have permission
  reproducibility: PATCH /api/v1/article/699da06d063f7bf10e8ab446/publish using context=doctor
- POST /api/v1/article/create -> unknown | status=400 | category=validation
  error: cityName, category, title, and articleType are required
  reproducibility: POST /api/v1/article/create using context=doctor
- GET /api/v1/article/getArticleById/:id -> unknown | status=404 | category=not-found
  error: Article not found
  reproducibility: GET /api/v1/article/getArticleById/699da06d063f7bf10e8ab446 using context=public
- PUT /api/v1/article/updateArticle/:id -> unknown | status=404 | category=not-found
  error: Article not found or you do not have permission
  reproducibility: PUT /api/v1/article/updateArticle/699da06d063f7bf10e8ab446 using context=doctor
- PUT /api/v1/booking/cancel/:bookingId -> controller/bookingController.js#cancelBooking | status=500 | category=server-bug
  error: Error processing cancellation request
  reproducibility: PUT /api/v1/booking/cancel/69c5282b8cf9e49defc29dd9 using context=patient
- POST /api/v1/booking/completed-details/:bookingId -> controller/bookingController.js#bookingCompletedDetails | status=403 | category=auth
  error: Access denied. Allowed roles: serviceprovider
  reproducibility: POST /api/v1/booking/completed-details/69c5282b8cf9e49defc29dd9 using context=admin
- POST /api/v1/booking/create -> controller/bookingController.js#createBooking | status=400 | category=validation
  error: patientId, serviceId, appointmentDate, startTime, and endTime are required
  reproducibility: POST /api/v1/booking/create using context=patient
- GET /api/v1/booking/my-bookings/:providerId -> controller/bookingController.js#getBookingsByServiceProvider | status=403 | category=auth
  error: Access denied. Allowed roles: serviceprovider
  reproducibility: GET /api/v1/booking/my-bookings/69083c7093634916321ed31d using context=admin
- GET /api/v1/booking/patient/:treatmentId -> controller/bookingController.js#getTreatmentById | status=403 | category=auth
  error: Access denied. Allowed roles: patient
  reproducibility: GET /api/v1/booking/patient/69984a296152d24784923e03 using context=doctor
- POST /api/v1/booking/providerBookings -> controller/bookingController.js#createProviderBooking | status=403 | category=auth
  error: Access denied. Allowed roles: serviceprovider
  reproducibility: POST /api/v1/booking/providerBookings using context=admin
- PUT /api/v1/booking/reschedule/:bookingId -> controller/bookingController.js#rescheduleBooking | status=400 | category=validation
  error: Booking ID, appointmentDate, startTime, and endTime are required
  reproducibility: PUT /api/v1/booking/reschedule/69c5282b8cf9e49defc29dd9 using context=patient
- PUT /api/v1/booking/update-status/:bookingId -> controller/bookingController.js#updateServiceStatus | status=403 | category=auth
  error: Access denied. Allowed roles: doctor, serviceprovider
  reproducibility: PUT /api/v1/booking/update-status/69c5282b8cf9e49defc29dd9 using context=admin
- PATCH /api/v1/city/:cityId/toggle -> controller/cityController.js#toggleCityStatus | status=500 | category=server-bug
  error: Error toggling status
  reproducibility: PATCH /api/v1/city/6909ec0bb7dcc56ab86a9fa7/toggle using context=public
- POST /api/v1/city/admin/cities -> controller/cityController.js#addCity | status=400 | category=validation
  error: Name and valid polygon are required
  reproducibility: POST /api/v1/city/admin/cities using context=admin
- PUT /api/v1/city/admin/cities/:cityId -> controller/cityController.js#updateCity | status=404 | category=not-found
  error: City not found
  reproducibility: PUT /api/v1/city/admin/cities/6909ec0bb7dcc56ab86a9fa7 using context=admin
- PATCH /api/v1/city/admin/cities/toggle/:cityId -> controller/cityController.js#toggleCityStatus | status=404 | category=not-found
  error: City not found
  reproducibility: PATCH /api/v1/city/admin/cities/toggle/6909ec0bb7dcc56ab86a9fa7 using context=admin
- GET /api/v1/city/cities/:cityId -> controller/cityController.js#getCityById | status=404 | category=not-found
  error: City not found
  reproducibility: GET /api/v1/city/cities/6909ec0bb7dcc56ab86a9fa7 using context=public
- GET /api/v1/city/find/by-location -> controller/cityController.js#findCityByLocation | status=400 | category=validation
  error: lat and lng are required
  reproducibility: GET /api/v1/city/find/by-location using context=public
- GET /api/v1/crash-report/get -> controller/crashController.js#getCrashReports | status=500 | category=server-bug
  error: Schema hasn't been registered for model "patient".
Use mongoose.model(name, schema)
  reproducibility: GET /api/v1/crash-report/get using context=public
- PUT /api/v1/doctor/availability -> controller/doctorController.js#updateAvailability | status=400 | category=validation
  error: Please provide days and timeSlots
  reproducibility: PUT /api/v1/doctor/availability using context=doctor
- DELETE /api/v1/doctor/break-time -> controller/doctorController.js#removeBreakTime | status=500 | category=server-bug
  error: Cannot destructure property 'date' of 'req.body' as it is undefined.
  reproducibility: DELETE /api/v1/doctor/break-time using context=doctor
- POST /api/v1/doctor/break-time -> controller/doctorController.js#addBreakTime | status=500 | category=server-bug
  error: doctor.addBreakTime is not a function
  reproducibility: POST /api/v1/doctor/break-time using context=doctor
- PUT /api/v1/doctor/bulk-manage-slots -> controller/doctorController.js#bulkManageSlots | status=404 | category=not-found
  error: No slots found for this date
  reproducibility: PUT /api/v1/doctor/bulk-manage-slots using context=doctor
- POST /api/v1/doctor/clinic -> controller/doctorController.js#addClinic | status=400 | category=validation
  error: Please provide clinic firstName and address
  reproducibility: POST /api/v1/doctor/clinic using context=doctor
- PUT /api/v1/doctor/clinic/:clinicId -> controller/doctorController.js#updateClinic | status=404 | category=not-found
  error: Clinic not found
  reproducibility: PUT /api/v1/doctor/clinic/507f1f77bcf86cd799439016 using context=doctor
- GET /api/v1/doctor/doctor/cities/by-name/:doctorId/:cityName -> controller/doctorController.js#getDoctorCitiesByName | status=500 | category=server-bug
  error: mongoose is not defined
  reproducibility: GET /api/v1/doctor/doctor/cities/by-name/69083c7093634916321ed31d/Lucknow using context=public
- GET /api/v1/doctor/doctor/my-cities/:doctorId -> controller/doctorController.js#getDoctorCities | status=500 | category=server-bug
  error: mongoose is not defined
  reproducibility: GET /api/v1/doctor/doctor/my-cities/69083c7093634916321ed31d using context=public
- GET /api/v1/doctor/getDoctorById/:id -> controller/doctorController.js#getDoctorById | status=404 | category=not-found
  error: Doctor not found
  reproducibility: GET /api/v1/doctor/getDoctorById/699da06d063f7bf10e8ab446 using context=public
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
  error: doctor.availability.serviceAvailability.findIndex is not a function
  reproducibility: PUT /api/v1/doctor/service-availability using context=doctor
- POST /api/v1/doctor/signup -> controller/doctorController.js#doctorSignup | status=400 | category=validation
  error: Selected city does not exist in available cities
  reproducibility: POST /api/v1/doctor/signup using context=public
- GET /api/v1/doctor/slots/:doctorId -> controller/doctorController.js#getAvailableSlots | status=500 | category=server-bug
  error: Error fetching available slots
  reproducibility: GET /api/v1/doctor/slots/69083c7093634916321ed31d?date=2026-05-09 using context=public
- PUT /api/v1/doctor/toggle-slot -> controller/doctorController.js#toggleSlotAvailability | status=500 | category=server-bug
  error: doctor.toggleSlotAvailability is not a function
  reproducibility: PUT /api/v1/doctor/toggle-slot using context=doctor
- POST /api/v1/doctor/verify-login-otp -> controller/doctorController.js#verifyLoginOtp | status=400 | category=validation
  error: Phone number and OTP are required
  reproducibility: POST /api/v1/doctor/verify-login-otp using context=public
- POST /api/v1/doctor/verify-signup-otp -> controller/doctorController.js#verifySignupOtp | status=400 | category=validation
  error: Phone number and OTP are required
  reproducibility: POST /api/v1/doctor/verify-signup-otp using context=public
- POST /api/v1/geo/check-location -> controller/geoController.js#checkAddressInPolygon | status=400 | category=validation
  error: Request failed with status code 400
  reproducibility: POST /api/v1/geo/check-location using context=public
- GET /api/v1/invoice/download/:invoiceId -> controller/invoiceController.js#downloadInvoice | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/invoice/download/69536c0b9e9b76709658b78b using context=admin
- POST /api/v1/invoice/generate -> controller/invoiceController.js#generateInvoice | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/invoice/generate using context=admin
- GET /api/v1/invoice/generateinv/:patientId -> controller/invoiceController.js#getPatientInvoicesByServiceProvider | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/invoice/generateinv/6909a373c21dc072f0dc1a87 using context=admin
- GET /api/v1/items/active -> controller/itemCategoryController.js#getActiveCategories | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/items/active using context=doctor
- GET /api/v1/items/category/:id -> controller/itemCategoryController.js#getCategoryDetails | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/items/category/699da06d063f7bf10e8ab446 using context=doctor
- POST /api/v1/items/create -> controller/itemCategoryController.js#createCategory | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/items/create using context=doctor
- DELETE /api/v1/items/delete/:id -> controller/itemCategoryController.js#deleteCategory | status=0 | category=server-bug
  error: Error
  reproducibility: DELETE /api/v1/items/delete/699da06d063f7bf10e8ab446 using context=doctor
- GET /api/v1/items/getAllCategories -> controller/itemCategoryController.js#getAllCategories | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/items/getAllCategories using context=doctor
- GET /api/v1/items/getItemCategoryById/:id -> controller/itemCategoryController.js#getItemsByCategory | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/items/getItemCategoryById/699da06d063f7bf10e8ab446 using context=doctor
- PATCH /api/v1/items/toggle-status/:id -> controller/itemCategoryController.js#toggleCategoryStatus | status=0 | category=server-bug
  error: Error
  reproducibility: PATCH /api/v1/items/toggle-status/699da06d063f7bf10e8ab446 using context=doctor
- PUT /api/v1/items/update/:id -> controller/itemCategoryController.js#updateCategory | status=0 | category=server-bug
  error: Error
  reproducibility: PUT /api/v1/items/update/699da06d063f7bf10e8ab446 using context=doctor
- DELETE /api/v1/patient/allergies -> controller/patientController.js#removeAllergy | status=0 | category=server-bug
  error: Error
  reproducibility: DELETE /api/v1/patient/allergies using context=doctor
- POST /api/v1/patient/allergies -> controller/patientController.js#addAllergy | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/allergies using context=doctor
- POST /api/v1/patient/check-auth -> controller/patientController.js#checkAuthStatus | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/check-auth using context=doctor
- POST /api/v1/patient/follow/:doctorId -> controller/patientController.js#followDoctor | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/follow/69083c7093634916321ed31d using context=doctor
- GET /api/v1/patient/getById/:patientId -> controller/patientController.js#getPatientById | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/patient/getById/6909a373c21dc072f0dc1a87 using context=doctor
- POST /api/v1/patient/login -> controller/patientController.js#patientLogin | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/login using context=doctor
- POST /api/v1/patient/logout -> controller/patientController.js#logout | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/logout using context=doctor
- POST /api/v1/patient/logout-all -> controller/patientController.js#patientLogoutAll | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/logout-all using context=doctor
- POST /api/v1/patient/medical-history -> controller/patientController.js#updateMedicalHistory | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/medical-history using context=doctor
- DELETE /api/v1/patient/medical-history/:historyId -> controller/patientController.js#deleteMedicalHistory | status=0 | category=server-bug
  error: Error
  reproducibility: DELETE /api/v1/patient/medical-history/507f1f77bcf86cd799439017 using context=doctor
- DELETE /api/v1/patient/medications -> controller/patientController.js#removeMedication | status=0 | category=server-bug
  error: Error
  reproducibility: DELETE /api/v1/patient/medications using context=doctor
- POST /api/v1/patient/medications -> controller/patientController.js#addMedication | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/medications using context=doctor
- GET /api/v1/patient/myTreatmentHistory -> controller/patientController.js#getCompletePatientTreatmentHistory | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/patient/myTreatmentHistory using context=doctor
- GET /api/v1/patient/profile -> controller/patientController.js#getMyProfile | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/patient/profile using context=doctor
- POST /api/v1/patient/resend-login-otp -> controller/patientController.js#resendLoginOtp | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/resend-login-otp using context=doctor
- POST /api/v1/patient/resend-signup-otp -> controller/patientController.js#resendSignupOtp | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/resend-signup-otp using context=doctor
- POST /api/v1/patient/signup -> controller/patientController.js#patientSignup | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/signup using context=doctor
- DELETE /api/v1/patient/unfollow/:doctorId -> controller/patientController.js#unfollowDoctor | status=0 | category=server-bug
  error: Error
  reproducibility: DELETE /api/v1/patient/unfollow/69083c7093634916321ed31d using context=doctor
- PATCH /api/v1/patient/updateProfile/:id -> controller/patientController.js#updatePatient | status=0 | category=server-bug
  error: Error
  reproducibility: PATCH /api/v1/patient/updateProfile/699da06d063f7bf10e8ab446 using context=doctor
- POST /api/v1/patient/verify-login-otp -> controller/patientController.js#verifyLoginOtp | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/verify-login-otp using context=doctor
- POST /api/v1/patient/verify-signup-otp -> controller/patientController.js#verifySignupOtp | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/patient/verify-signup-otp using context=doctor
- GET /api/v1/payments/treatments/:treatmentId/ledger -> controller/payController.js#getTreatmentPaymentLedger | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/payments/treatments/69984a296152d24784923e03/ledger using context=admin
- POST /api/v1/payments/treatments/:treatmentId/manual-collection -> controller/payController.js#recordManualPayment | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/payments/treatments/69984a296152d24784923e03/manual-collection using context=admin
- POST /api/v1/payments/treatments/:treatmentId/online/order -> controller/payController.js#createTreatmentOnlineOrder | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/payments/treatments/69984a296152d24784923e03/online/order using context=admin
- POST /api/v1/payments/treatments/:treatmentId/online/verify -> controller/payController.js#verifyTreatmentOnlinePayment | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/payments/treatments/69984a296152d24784923e03/online/verify using context=admin
- POST /api/v1/payments/treatments/:treatmentId/refunds/manual -> controller/payController.js#recordManualRefund | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/payments/treatments/69984a296152d24784923e03/refunds/manual using context=admin
- GET /api/v1/service/:id/price -> controller/serviceController.js#calculateServicePrice | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/699da06d063f7bf10e8ab446/price using context=patient
- POST /api/v1/service/:id/restore -> controller/serviceController.js#restoreService | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/service/699da06d063f7bf10e8ab446/restore using context=patient
- PATCH /api/v1/service/:id/toggle-status -> controller/serviceController.js#toggleServiceStatus | status=0 | category=server-bug
  error: Error
  reproducibility: PATCH /api/v1/service/699da06d063f7bf10e8ab446/toggle-status using context=patient
- GET /api/v1/service/:serviceId/slots -> controller/serviceController.js#getAvailableSlots | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/6915d7cf9033f3ce1c0f322e/slots using context=patient
- POST /api/v1/service/admin/bulk-update -> controller/serviceController.js#bulkUpdateServices | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/service/admin/bulk-update using context=admin
- GET /api/v1/service/admin/statistics -> controller/serviceController.js#getServiceStatistics | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/admin/statistics using context=admin
- GET /api/v1/service/category/:category -> controller/serviceController.js#getServicesByCategory | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/category/general using context=patient
- GET /api/v1/service/city/:cityId -> controller/serviceController.js#getServicesByCity | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/city/6909ec0bb7dcc56ab86a9fa7 using context=patient
- POST /api/v1/service/createService -> controller/serviceController.js#createService | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/service/createService using context=patient
- GET /api/v1/service/getAllServices -> controller/serviceController.js#getAllServices | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/getAllServices using context=patient
- GET /api/v1/service/getServiceById/:id -> controller/serviceController.js#getServiceById | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/getServiceById/699da06d063f7bf10e8ab446 using context=patient
- GET /api/v1/service/nursing/:nursingType -> controller/serviceController.js#getNursingServicesByType | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/nursing/icu using context=patient
- GET /api/v1/service/search -> controller/serviceController.js#searchServices | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/service/search?query=test using context=patient
- DELETE /api/v1/service/service/:id -> controller/serviceController.js#deleteService | status=0 | category=server-bug
  error: Error
  reproducibility: DELETE /api/v1/service/service/699da06d063f7bf10e8ab446 using context=patient
- PATCH /api/v1/service/services/:id -> controller/serviceController.js#updateService | status=0 | category=server-bug
  error: Error
  reproducibility: PATCH /api/v1/service/services/699da06d063f7bf10e8ab446 using context=patient
- PATCH /api/v1/serviceProvider/:id/toggle-status -> controller/providerController.js#toggleStatus | status=0 | category=server-bug
  error: Error
  reproducibility: PATCH /api/v1/serviceProvider/699da06d063f7bf10e8ab446/toggle-status using context=admin
- POST /api/v1/serviceProvider/createservice-provider -> controller/providerController.js#createServiceProvider | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/serviceProvider/createservice-provider using context=admin
- GET /api/v1/serviceProvider/getAllServiceProviders -> controller/providerController.js#getAllServiceProviders | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/serviceProvider/getAllServiceProviders using context=admin
- POST /api/v1/serviceProvider/login -> controller/providerController.js#loginServiceProvider | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/serviceProvider/login using context=admin
- DELETE /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#deleteServiceProvider | status=0 | category=server-bug
  error: Error
  reproducibility: DELETE /api/v1/serviceProvider/service-provider/699da06d063f7bf10e8ab446 using context=admin
- GET /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#getServiceProviderById | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/serviceProvider/service-provider/699da06d063f7bf10e8ab446 using context=admin
- PUT /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#updateServiceProvider | status=0 | category=server-bug
  error: Error
  reproducibility: PUT /api/v1/serviceProvider/service-provider/699da06d063f7bf10e8ab446 using context=admin
- GET /api/v1/serviceProvider/service-provider/appointments -> controller/providerController.js#getServiceProviderAppointments | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/serviceProvider/service-provider/appointments using context=admin
- GET /api/v1/serviceProvider/service-provider/appointments/:id -> controller/providerController.js#getSingleAppointment | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/serviceProvider/service-provider/appointments/699da06d063f7bf10e8ab446 using context=admin
- GET /api/v1/serviceProvider/service-providers/by-service/:serviceId -> controller/providerController.js#getProvidersByServiceId | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/serviceProvider/service-providers/by-service/6915d7cf9033f3ce1c0f322e using context=admin
- POST /api/v1/socialPost/addComment/:id -> controller/socialmediaController.js#addComment | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/socialPost/addComment/699da06d063f7bf10e8ab446 using context=admin
- POST /api/v1/socialPost/commentPost/:id -> controller/socialmediaController.js#addComment | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/socialPost/commentPost/699da06d063f7bf10e8ab446 using context=admin
- POST /api/v1/socialPost/createPost -> unknown | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/socialPost/createPost using context=admin
- GET /api/v1/socialPost/feed -> controller/socialmediaController.js#getSocialFeed | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/socialPost/feed using context=admin
- GET /api/v1/socialPost/follow-stats/me -> controller/socialmediaController.js#getMyFollowStats | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/socialPost/follow-stats/me using context=admin
- POST /api/v1/socialPost/followDoctor -> controller/socialmediaController.js#toggleFollowDoctor | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/socialPost/followDoctor using context=admin
- GET /api/v1/socialPost/getPostByAdmin/:id -> controller/socialmediaController.js#getPostByIdByAdmin | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/socialPost/getPostByAdmin/699da06d063f7bf10e8ab446 using context=admin
- GET /api/v1/socialPost/getPostById/:id -> controller/socialmediaController.js#getPostById | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/socialPost/getPostById/699da06d063f7bf10e8ab446 using context=admin
- GET /api/v1/socialPost/getPosts -> controller/socialmediaController.js#getPosts | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/socialPost/getPosts using context=admin
- POST /api/v1/socialPost/likePost/:id/toggle -> controller/socialmediaController.js#toggleLikePost | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/socialPost/likePost/699da06d063f7bf10e8ab446/toggle using context=admin
- DELETE /api/v1/socialPost/posts/:id -> controller/socialmediaController.js#deletePost | status=0 | category=server-bug
  error: Error
  reproducibility: DELETE /api/v1/socialPost/posts/699da06d063f7bf10e8ab446 using context=admin
- PATCH /api/v1/socialPost/posts/:id/hide -> controller/socialmediaController.js#toggleHidePost | status=0 | category=server-bug
  error: Error
  reproducibility: PATCH /api/v1/socialPost/posts/699da06d063f7bf10e8ab446/hide using context=admin
- GET /api/v1/socialPost/search -> controller/socialmediaController.js#searchSocialPosts | status=0 | category=server-bug
  error: Error
  reproducibility: GET /api/v1/socialPost/search?query=test using context=admin
- POST /api/v1/uploadfile/upload -> unknown | status=0 | category=server-bug
  error: Error
  reproducibility: POST /api/v1/uploadfile/upload using context=admin
- GET /api/v1/check-status -> controller/authController.js#checkAuthStatus | status=N/A | category=unmounted
  error: Route file exists but not mounted in route/index.js
  reproducibility: n/a