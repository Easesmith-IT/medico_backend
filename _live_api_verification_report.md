# Live API Verification Report

- generatedAt: 2026-05-09T12:11:16.845Z
- baseUrl: http://localhost:5005
- totalRoutes: 186
- mountedRoutes: 185
- unmountedRoutes: 1
- attemptedRoutes: 185
- status2xx: 44
- status400: 29
- status401: 0
- status403: 5
- status404: 20
- status5xx: 11
- controllerReached: 180

## Sessions
- patient: ok
- doctor: ok
- admin: ok
- serviceProvider: failed (ServiceProvider login failed)

## Route Checklist Execution
- [x] POST /api/v1/admin/addEquipments -> controller/adminController.js#addEquipment | 400 | admin | pass
  req.body: {}
  res.body: {"success":false,"message":"At least one city ID is required."}
- [x] POST /api/v1/admin/admin/booking/approve-cancellation/:bookingId -> controller/adminController.js#approveCancellation | 400 | admin | pass
  req.body: {}
  res.body: {"success":false,"message":"No pending cancellation request found"}
- [x] GET /api/v1/admin/admin/city/:cityId/doctors -> controller/adminController.js#getDoctorsByCity | 400 | admin | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"City ID is required","stack":"Error: City ID is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3779:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/admin/admin/doctor/:doctorId/cities -> controller/adminController.js#getDoctorCities | 200 | admin | pass
  req.body: null
  res.body: {"success":true,"data":{"doctor":{"id":"69083c7093634916321ed31d","firstName":"Ravi Prakash","email":"ravi@hospital.com","phone":"8707807722"},"cities":[{"_id":"690c456658dd2334d7cb9581","name":"kanpur","latitude":26.4609135,"longitude":80.3217588}],"totalCities":1}}
- [x] POST /api/v1/admin/admin/doctor/add-cities -> controller/adminController.js#addDoctorToCities | 400 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Doctor ID is required","stack":"Error: Doctor ID is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3471:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/admin/admin/doctor/remove-cities -> controller/adminController.js#removeDoctorFromCities | 400 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Doctor ID is required","stack":"Error: Doctor ID is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3600:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PUT /api/v1/admin/admin/doctor/update-cities -> controller/adminController.js#updateDoctorCities | 400 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Doctor ID is required","stack":"Error: Doctor ID is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3667:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PATCH /api/v1/admin/bookings/:bookingId/status -> controller/adminController.js#updateBookingStatus | 400 | public | pass
  req.body: {}
  res.body: {"success":false,"message":"Booking ID and new status are required"}
- [x] POST /api/v1/admin/bookings/create -> controller/adminController.js#createBookingByAdmin | 400 | admin | pass
  req.body: {}
  res.body: {"success":false,"message":"patientId, serviceId, appointmentDate and startTime are required"}
- [x] GET /api/v1/admin/bookings/export -> controller/adminController.js#exportAppointments | 200 | admin | pass
  req.body: null
  res.body: "patientName","patientPhone","serviceName","partnerName","appointmentDate","slot","status","totalAmount","createdAt"
"Sidd ","8707807701","Doctor Visit","Rahul Sharma","26/3/2026","12:30 - 13:00","Completed",590,"26/3/2026, 6:05:55 pm"
"Sidd ","8707807701","Doctor Visit","Rahul Sharma","27/3/2026","18:08 - 18:38","Completed",590,"26/3/2026, 6:08:19 pm"
"Sidd ","8707807701","Doctor Visit","Rahul Sharma","3/4/2026","09:00 - 19:00","Pending",590,"3/4/2026, 5:47:30 pm"
"Sidd ","8707807701","Doctor Visit","Rahul Sharma","3/4/2026","09:00 - 19:00","Completed",590,"3/4/2026, 6:16:08 pm"
"Sidd ","8707807701","Doctor Visit","Rahul Sharma","4/4/2026","09:00 - 19:00","In-Progress",590,"3/4/2026, 6:16:34 pm"
"Sidd ","8707807701","Doctor Visit","Rahul Sharma","5/4/2026","18:46 - 18:76","Pending",590,"3/4/2026, 6:46:39 pm"
"John ","6388966722","Attendant Care","Vivek Parde","7/4/2026","10:00 - 12:30","Approved",5310,"4/4/2026, 1:38:11 pm"
"John ","6388966722","Doctor Visit","Rahul Sharma","26/3/2026","14:30 - 18:30","Pending",590,"6/4/2026, 5:05:00 pm"
"John ","6388966722","Doctor Visit","Rahul Sharma","26/3/2026","12:30 - 18:30","Pending",590,"6/4/2026, 5:36:10 pm"
"John ","6388966722","Doctor Visit","Rahul Sharma","26/3/2026","13:30 - 18:30","Pending",590,"6/4/2026, 5:37:53 pm"
"John ","6388966722","Doctor Visit","Rahul Sharma","26/3/2026","8:30 - 18:30","Pending",590,"7/4/2026, 1:00:55 am"
"John ","6388966722","Doctor Visit","Rahul Sharma","26/3/2026","7:30 - 18:30","Pending...
- [x] PATCH /api/v1/admin/bookings/update/:bookingId -> controller/adminController.js#updateBookingByAdmin | 500 | admin | fail
  req.body: {}
  res.body: {"success":false,"message":"Error updating booking","error":"Booking validation failed: sessionNumber: Path `sessionNumber` is required."}
- [x] POST /api/v1/admin/check-auth -> controller/adminController.js#checkAuthStatus | 200 | public | pass
  req.body: {}
  res.body: {"success":true,"isAuthenticated":false}
- [x] GET /api/v1/admin/doctors -> controller/adminController.js#getAllDoctors | 200 | admin | pass
  req.body: null
  res.body: {"success":true,"results":7,"totalPages":1,"currentPage":1,"data":{"doctors":[{"verificationDocuments":{"degreesCertificates":[]},"availability":{"autoSlotGeneration":{"enabled":false,"defaultDuration":30,"bufferBetweenSlots":5,"advanceBookingDays":30},"days":[],"serviceAvailability":"both","timeSlots":[],"serviceCoverage":[],"dailySlots":[]},"_id":"69ff23f720f0cf0044c5c3f3","firstName":"Route Doctor","email":"route.doctor.1778328567670.598365@example.com","phone":"9567670970","profilePhoto":null,"cities":["6909ec0bb7dcc56ab86a9fa7"],"medicalRegistrationNumber":"MED-1778328567670","issuingMedicalCouncil":"Medical Council","yearsOfExperience":0,"specialization":"General","subSpecialties":[],"consultationFees":0,"degrees":[],"certifications":[],"residencies":[],"trainingsWorkshops":[],"verificationStatus":"pending","services":[],"role":"doctor","isPhoneVerified":false,"averageRating":0,"totalReviews":0,"followers":[],"followersCount":0,"isActive":true,"clinics":[],"createdAt":"2026-05-09T12:09:27.879Z","updatedAt":"2026-05-09T12:09:27.882Z","__v":0},{"address":{"street":"STREET NO. 6, NEAR, RAILWAY STATION BYPASS ROAD, near SHAMLI","city":"Shamli","state":"Uttar Pradesh","country":"India","pincode":"247776"},"verificationDocuments":{"degreesCertificates":[]},"availability":{"autoSlotGeneration":{"enabled":false,"defaultDuration":30,"bufferBetweenSlots":5,"advanceBookingDays":30},"days":[],"serviceAvailability":"both","timeSlots":[],"serviceCoverage":[],"dailySlots":[]},"_id":"6...
- [x] DELETE /api/v1/admin/doctors/:id -> controller/adminController.js#deleteDoctor | 404 | admin | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1954:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/admin/doctors/:id -> controller/adminController.js#getDoctorById | 404 | admin | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1903:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PUT /api/v1/admin/doctors/:id/approve -> controller/adminController.js#approveDoctor | 404 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1920:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PUT /api/v1/admin/doctors/:id/reject -> controller/adminController.js#rejectDoctor | 404 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1940:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PATCH /api/v1/admin/doctors/:id/toggle-status -> controller/adminController.js#toggleDoctorStatus | 404 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:4029:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/admin/doctors/create -> controller/adminController.js#createDoctor | 400 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization","stack":"Error: Required fields: firstName, email, phone, medicalRegistrationNumber, issuingMedicalCouncil, specialization\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1797:7\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/admin/login -> controller/adminController.js#adminLogin | 400 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Email and password required","stack":"Error: Email and password required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1414:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- [x] POST /api/v1/admin/logout -> controller/adminController.js#logout | 200 | public | pass
  req.body: {}
  res.body: {"success":true,"message":"Logged out successfully"}
- [x] POST /api/v1/admin/logout-all-devices -> controller/adminController.js#logoutAllDevices | 400 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Email required","stack":"Error: Email required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1511:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- [x] GET /api/v1/admin/me -> controller/adminController.js#getMyProfile | 200 | admin | pass
  req.body: null
  res.body: {"success":true,"data":{"admin":{"_id":"69ff2443ada007db7639559a","firstName":"Route","lastName":"Verifier","email":"route.admin.1778328642836.458560@example.com","phone":"9642836734","role":"superAdmin","isActive":true,"permissions":[],"status":"active","createdAt":"2026-05-09T12:10:43.015Z","updatedAt":"2026-05-09T12:10:44.700Z","__v":0}}}
- [x] DELETE /api/v1/admin/patient/:patientId/medications -> controller/adminController.js#adminRemoveMedication | 400 | admin | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Please provide medication details to remove","stack":"Error: Please provide medication details to remove\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:4165:7\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/admin/patient/:patientId/medications -> controller/adminController.js#adminAddMedication | 400 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Please provide medication details","stack":"Error: Please provide medication details\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:4137:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/admin/patients -> controller/adminController.js#getAllPatients | 200 | admin | pass
  req.body: null
  res.body: {"success":true,"results":1,"totalPages":1,"currentPage":1,"totalRecords":1,"filtersUsed":{"isActive":false},"data":{"patients":[{"address":null,"emergencyContact":{"name":null,"phone":null,"relation":null},"_id":"692b11ee8752a3500f1c98c9","firstName":"Ajay katariya","email":"aajay.katariya@gmail.com","phone":"7048263305","profilePhoto":null,"dateOfBirth":"2007-12-04T00:00:00.000Z","gender":"male","bloodGroup":null,"allergies":[],"currentMedications":[],"role":"patient","isVerified":true,"isActive":false,"following":[],"followingCount":0,"medicalHistory":[],"savedPosts":[],"createdAt":"2025-11-29T15:31:58.852Z","updatedAt":"2025-12-01T07:51:16.566Z","__v":0,"medicationHistory":[],"treatmentProgress":[],"mediaFiles":[]}]}}
- [x] DELETE /api/v1/admin/patients/:id -> controller/adminController.js#deletePatient | 404 | admin | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Patient not found","stack":"Error: Patient not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3410:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/admin/patients/:id -> controller/adminController.js#getPatientById | 404 | admin | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Patient not found","stack":"Error: Patient not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3379:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PUT /api/v1/admin/patients/:id/block -> controller/adminController.js#blockPatient | 404 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Patient not found","stack":"Error: Patient not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:3396:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PATCH /api/v1/admin/patients/:id/toggle-status -> controller/adminController.js#togglePatientStatus | 404 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Patient not found","stack":"Error: Patient not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:4057:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/admin/patients/create -> controller/adminController.js#createPatient | 400 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Please provide all required fields: firstName, email, phone, password","stack":"Error: Please provide all required fields: firstName, email, phone, password\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1987:7\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/admin/patients/export -> controller/adminController.js#exportPatients | 200 | admin | pass
  req.body: null
  res.body: "firstName","email","phone","dateOfBirth","gender","bloodGroup","city","state","country","emergencyName","emergencyPhone","emergencyRelation","isActive","createdAt"
"Riya","riya.sharma@example.com","9876543219","12/5/1998","female","O+","Lucknow","Uttar Pradesh","—","Ananya Sharma","9876501234","—","Active","4/11/2025, 11:03:06 am"
"John test edited","johntiim@example.com","9876543233","16/5/1990","male","O+","Mumbai","Maharashtra","India","Jane Doe","9876543212","Sister","Active","4/11/2025, 12:25:47 pm"
"John Updated","johntim.updateed@example.com","9876543212","15/5/1990","male","O+","Mumbai","Maharashtra","India","Jane Doe","9876543212","Sister","Active","4/11/2025, 1:14:40 pm"
"John ji","ravi@gmail.com","8707807700","15/5/1997","male","O+","Mumbai","Maharashtra","India","Jane Doe","9876543212","—","Active","14/11/2025, 12:20:28 pm"
"Ravi","ravi1234@gmail.com","8707807000","6/12/1997","male","AB+","—","—","—","—","—","—","Active","27/11/2025, 11:44:24 am"
"hitesh","katariyahiteshkumar@gmail.com","6353231475","—","—","—","—","—","—","—","—","—","Active","27/11/2025, 3:04:05 pm"
"Ajay katariya","aajay.katariya@gmail.com","7048263305","4/12/2007","male","—","—","—","—","—","—","—","Inactive","29/11/2025, 9:01:58 pm"
"John","johncena@example.com","6388966722","15/5/1990","male","O+","Mumbai","Maharashtra","India","Jane Doe","9123456789","Sister","Active","1/12/2025, 4:53:11 pm"
"Sidd","sidd@gmail.com","8707807701","7/12/1997","male","A-","Kanpur Nagar","Uttar Pradesh...
- [x] GET /api/v1/admin/patients/names -> controller/adminController.js#getPatientNames | 200 | public | pass
  req.body: null
  res.body: {"success":true,"count":9,"data":[{"_id":"692d7a9ff8d99699ddc9fada","firstName":"John"},{"_id":"6909aee8a15cd195e4cda971","firstName":"John Updated"},{"_id":"6916d13436be446373d52387","firstName":"John ji"},{"_id":"6909a373c21dc072f0dc1a87","firstName":"John test edited"},{"_id":"6927ec404619ff9ef06df478","firstName":"Ravi"},{"_id":"69099012606fc5a2ab07ae91","firstName":"Riya"},{"_id":"692e8652deff065cd6540a99","firstName":"Sidd"},{"_id":"69281b0dce29e3702e8ae2c9","firstName":"hitesh"},{"_id":"69a59e5de3e14f2bcc96c888","firstName":"kunal"}]}
- [x] GET /api/v1/admin/reports/dashboard -> controller/adminController.js#getDashboardStats | 200 | admin | pass
  req.body: null
  res.body: {"success":true,"data":{"totalDoctors":7,"totalPatients":9,"pendingDoctors":3,"approvedDoctors":4}}
- [x] GET /api/v1/admin/reports/doctors -> controller/adminController.js#getDoctorStats | 200 | admin | pass
  req.body: null
  res.body: {"success":true,"data":{"active":7,"inactive":0,"pending":3,"approved":4,"rejected":0}}
- [x] GET /api/v1/admin/service-providers/names -> controller/adminController.js#getServiceProviderNames | 200 | public | pass
  req.body: null
  res.body: {"success":true,"count":4,"data":[{"currentAddress":{"street":"123 Main St","locality":"Central","city":"Cityname","state":"Statename","country":"India","pincode":"123456"},"rating":{"average":0,"totalReviews":0},"_id":"692400095d6ef718d87f6d15","firstName":"John","lastName":"Doe","ownerName":"kunal","services":[{"serviceId":"69200a03f94dd4c32856d886","serviceName":"General Consultation","experienceYears":10,"specialization":"General Medicine","_id":"693269e0b64044319e140094"}],"yearsOfExperience":10,"approvalStatus":"Approved"},{"currentAddress":{"street":"Main Road","locality":"Hazratganj","city":"Lucknow","state":"Uttar Pradesh","pincode":"226001","country":"India"},"rating":{"average":0,"totalReviews":0},"_id":"6954b8661f9e10ca7a950d6a","firstName":"Rahul","lastName":"Sharma","services":[{"serviceId":"6915d7cf9033f3ce1c0f322e","experienceYears":5,"_id":"6954b8661f9e10ca7a950d6b"}],"yearsOfExperience":8,"approvalStatus":"Approved"},{"currentAddress":{"street":"test","locality":"df d fd f","city":"d fdd","state":"d fdf","country":"India","pincode":"123454"},"rating":{"average":0,"totalReviews":0},"_id":"6924043e64edd1391a8939a1","firstName":"Vivek","lastName":"Parde","ownerName":"Vivek","services":[{"serviceId":"69200a03f94dd4c32856d886","serviceName":"Doctor visit","experienceYears":3,"specialization":"test sep df","_id":"692569c3a8914bf257ad083f"}],"yearsOfExperience":6,"approvalStatus":"Approved"},{"currentAddress":{"street":"test","locality":"df d fd f","city":"d fdd","...
- [x] GET /api/v1/admin/services/names -> controller/adminController.js#getServiceNames | 200 | public | pass
  req.body: null
  res.body: {"success":true,"count":10,"data":[{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"6915d7cf9033f3ce1c0f322e","name":"Attendant Care"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"691d7886eaae59d1db94554c","name":"Physiotherapy test"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"69200a03f94dd4c32856d886","name":"Doctor Visit"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"6920177f7a8205f32a71eaf7","name":"Nursing"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"69201809a834428f8baa10ec","name":"Hourly Nursing"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"694e2238e0d47328d79c08da","name":"Nursing test"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"69539d3db87b048450310747","name":"Advanced Oxygen Concentrator"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"69539e4ace732ecbf3ca5b7f","name":"Advanced Oxygen Concentrator"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"69abd1c5f2ec85adbb6847e1","name":"test image service edit"},{"slotConfig":{"consultationSlots":{"startTime":"09:00","endTime":"19:00"}},"_id":"69ac0acf0a717f1055edc801","name":"Nursing testee"}]}
- [x] POST /api/v1/admin/signup -> controller/adminController.js#adminSignup | 201 | public | pass
  req.body: {"email":"route.admin.signup.1778328656757.777202@example.com","password":"RouteTest@123","firstName":"Route","lastName":"Signup","phone":"9656757416","role":"superAdmin"}
  res.body: {"success":true,"message":"Admin registered. OTP sent to your phone.","data":{"admin":{"id":"69ff2450ada007db763956a6","email":"route.admin.signup.1778328656757.777202@example.com","firstName":"Route","phone":"9656757416","role":"superAdmin"},"nextStep":"Verify OTP sent to your phone"}}
- [x] GET /api/v1/admin/subadmins -> controller/adminController.js#getSubAdmins | 200 | admin | pass
  req.body: null
  res.body: {"status":"success","results":6,"pagination":{"total":6,"page":1,"limit":20,"pages":1},"data":[{"_id":"69fc2d27f6ceabb434f33146","firstName":"errt","lastName":"ffdef","email":"vivekdev0e1@easesmith.com","phone":"7374838190","role":"subAdmin","isActive":true,"permissions":[],"status":"active","createdAt":"2026-05-07T06:11:51.054Z"},{"_id":"69facda5a2887e52c61648ff","firstName":"test","lastName":"test","email":"testadmin@codintern.com","phone":"7378838197","role":"subAdmin","isActive":true,"permissions":[],"status":"active","createdAt":"2026-05-06T05:12:05.409Z"},{"_id":"694e239755cb036ae58f62c0","firstName":"ee f","lastName":"dfdfd","email":"dev03lko@mavyax.com","phone":"7378838193","role":"subAdmin","isActive":true,"permissions":[],"status":"active","createdAt":"2025-12-26T05:56:39.171Z"},{"_id":"69381cfe6a5f84054e7cad00","firstName":"test","lastName":"tefdff","email":"admin@ddd.com","phone":"7378838194","role":"subAdmin","isActive":true,"permissions":[],"status":"active","createdAt":"2025-12-09T12:58:38.299Z"},{"_id":"6938196d6a5f84054e7cacf7","firstName":"test","lastName":"testedf","email":"admin@test.com","phone":"8707807701","role":"subAdmin","isActive":true,"permissions":[],"status":"active","createdAt":"2025-12-09T12:43:25.239Z"},{"_id":"69084c5c9248b76f43cc26d5","firstName":"Vivek","email":"vivekdev01@easesmith.com","phone":"7378838190","role":"subAdmin","permissions":[],"isActive":true,"createdAt":"2025-11-03T06:31:56.045Z","lastName":"","status":"active"}]}
- [x] PATCH /api/v1/admin/subadmins/:id/toggle-status -> controller/adminController.js#toggleSubAdminStatus | 404 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Admin not found","stack":"Error: Admin not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1596:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PUT /api/v1/admin/updateProfile -> controller/adminController.js#updateProfile | 200 | admin | pass
  req.body: {}
  res.body: {"success":true,"message":"Profile updated","data":{"admin":{"_id":"69ff2443ada007db7639559a","firstName":"Route","lastName":"Verifier","email":"route.admin.1778328642836.458560@example.com","phone":"9642836734","role":"superAdmin","isActive":true,"permissions":[],"status":"active","createdAt":"2026-05-09T12:10:43.015Z","updatedAt":"2026-05-09T12:10:58.802Z","__v":0}}}
- [x] POST /api/v1/admin/verify-signup-otp -> controller/adminController.js#verifySignupOtp | 400 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone and OTP required","stack":"Error: Phone and OTP required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\adminController.js:1337:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- [x] DELETE /api/v1/article/:id -> unknown | 404 | doctor | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Article not found or you do not have permission","stack":"Error: Article not found or you do not have permission\n    at deleteArticle (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:534:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PATCH /api/v1/article/:id/publish -> unknown | 404 | doctor | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Article not found or you do not have permission","stack":"Error: Article not found or you do not have permission\n    at publishArticle (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:569:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/article/articles -> unknown | 200 | public | pass
  req.body: null
  res.body: {"success":true,"count":10,"total":12,"totalPages":2,"currentPage":1,"articles":[{"content":{"text":"this is test this is test this is test.\nthis is test this is test this is test this is test this is test this is test \n\n\nthis is test this is test this is test this is test this is test this is test this is test this is test this is test this is test.\n\n\nthis is test this is test this is test this is test this is test this is test this is test \n\nthis is test this is test.","images":[]},"_id":"691ab6fe5cfd8ffaf8ac470d","createdBy":{"_id":"69083c7093634916321ed31d","email":"ravi@hospital.com","specialization":"Cardiologist, Medicine Expert, Dermatologist"},"creatorModel":"Doctor","cityId":{"_id":"690c456658dd2334d7cb9581","name":"kanpur","latitude":26.4609135,"longitude":80.3217588},"category":"Microbiology","tags":["Hypertension","Cholesterol","Heart Disease"],"title":"this is test this is test","description":"this is test this is test this is test this is test this is test this is test this is test this is test","articleType":"article","status":"draft","views":0,"likes":0,"createdAt":"2025-11-17T05:47:42.954Z","updatedAt":"2025-11-17T05:47:42.954Z","__v":0,"articleUrl":"/articles/691ab6fe5cfd8ffaf8ac470d","cityName":"kanpur","id":"691ab6fe5cfd8ffaf8ac470d"},{"content":{"text":"this is test this is test this is test this is test this is test this is test this is test.\n\nthis is test this is test this is test this is test.\n\nthis is test this is test this is test this ...
- [x] POST /api/v1/article/create -> unknown | 400 | doctor | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"cityName, category, title, and articleType are required","stack":"Error: cityName, category, title, and articleType are required\n    at createArticle (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:181:19)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at uploadMiddleware (E:\\easesmith\\medico\\medico_backend\\route\\articleRoute.js:27:5)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/article/doctors/:doctorId/articles -> unknown | 200 | public | pass
  req.body: null
  res.body: {"success":true,"count":4,"total":4,"totalPages":1,"currentPage":1,"articles":[{"content":{"text":"this is test this is test this is test.\nthis is test this is test this is test this is test this is test this is test \n\n\nthis is test this is test this is test this is test this is test this is test this is test this is test this is test this is test.\n\n\nthis is test this is test this is test this is test this is test this is test this is test \n\nthis is test this is test.","images":[]},"_id":"691ab6fe5cfd8ffaf8ac470d","createdBy":{"_id":"69083c7093634916321ed31d","email":"ravi@hospital.com","specialization":"Cardiologist, Medicine Expert, Dermatologist"},"creatorModel":"Doctor","cityId":"690c456658dd2334d7cb9581","category":"Microbiology","tags":["Hypertension","Cholesterol","Heart Disease"],"title":"this is test this is test","description":"this is test this is test this is test this is test this is test this is test this is test this is test","articleType":"article","status":"draft","views":0,"likes":0,"createdAt":"2025-11-17T05:47:42.954Z","updatedAt":"2025-11-17T05:47:42.954Z","__v":0,"articleUrl":"/articles/691ab6fe5cfd8ffaf8ac470d","cityName":"Unknown","id":"691ab6fe5cfd8ffaf8ac470d"},{"content":{"text":"this is test this is test this is test this is test this is test this is test this is test.\n\nthis is test this is test this is test this is test.\n\nthis is test this is test this is test this is test this is test this is test this is test this is test this is te...
- [x] GET /api/v1/article/getallarticle -> unknown | 200 | public | pass
  req.body: null
  res.body: {"success":true,"count":10,"total":12,"totalPages":2,"currentPage":1,"articles":[{"content":{"text":"this is test this is test this is test.\nthis is test this is test this is test this is test this is test this is test \n\n\nthis is test this is test this is test this is test this is test this is test this is test this is test this is test this is test.\n\n\nthis is test this is test this is test this is test this is test this is test this is test \n\nthis is test this is test.","images":[]},"_id":"691ab6fe5cfd8ffaf8ac470d","createdBy":{"_id":"69083c7093634916321ed31d","email":"ravi@hospital.com","specialization":"Cardiologist, Medicine Expert, Dermatologist"},"creatorModel":"Doctor","cityId":{"_id":"690c456658dd2334d7cb9581","name":"kanpur","latitude":26.4609135,"longitude":80.3217588},"category":"Microbiology","tags":["Hypertension","Cholesterol","Heart Disease"],"title":"this is test this is test","description":"this is test this is test this is test this is test this is test this is test this is test this is test","articleType":"article","status":"draft","views":0,"likes":0,"createdAt":"2025-11-17T05:47:42.954Z","updatedAt":"2025-11-17T05:47:42.954Z","__v":0,"articleUrl":"/articles/691ab6fe5cfd8ffaf8ac470d","cityName":"kanpur","id":"691ab6fe5cfd8ffaf8ac470d"},{"content":{"text":"this is test this is test this is test this is test this is test this is test this is test.\n\nthis is test this is test this is test this is test.\n\nthis is test this is test this is test this ...
- [x] GET /api/v1/article/getArticleById/:id -> unknown | 404 | public | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Article not found","stack":"Error: Article not found\n    at getArticleById (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:463:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/article/my-articles -> unknown | 200 | doctor | pass
  req.body: null
  res.body: {"success":true,"count":0,"articles":[]}
- [x] PUT /api/v1/article/updateArticle/:id -> unknown | 404 | doctor | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Article not found or you do not have permission","stack":"Error: Article not found or you do not have permission\n    at updateArticle (E:\\easesmith\\medico\\medico_backend\\controller\\articleController.js:504:19)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/booking/bookings/:bookingId -> controller/bookingController.js#getByIdBooking | 200 | public | pass
  req.body: null
  res.body: {"success":true,"data":{"bookingId":"69c5282b8cf9e49defc29dd9","patient":{"_id":"692e8652deff065cd6540a99","firstName":"Sidd","email":"sidd@gmail.com","phone":"8707807701"},"service":{"_id":"69200a03f94dd4c32856d886","name":"Doctor Visit","category":"consultation","modes":["Home Service"]},"provider":{"id":"6954b8661f9e10ca7a950d6a","name":"Rahul Sharma","email":"rahull.provider@example.com","phone":"9876543241","city":["mumbai"]},"bookingCity":"kanpur","appointmentDate":"2026-03-26T00:00:00.000Z","slotTime":{"startTime":"12:30","endTime":"13:00"},"status":"Completed","pricing":{"basePrice":500,"equipmentCharges":0,"subtotal":500,"taxPercentage":18,"taxAmount":90,"totalAmount":590},"treatment":{"_id":"69c5282b8cf9e49defc29ddb","status":"Active","validTill":"2026-03-31T12:35:55.458Z"}}}
- [x] PUT /api/v1/booking/cancel/:bookingId -> controller/bookingController.js#cancelBooking | 500 | patient | fail
  req.body: {}
  res.body: {"success":false,"message":"Error processing cancellation request","error":"Cannot access 'booking' before initialization"}
- [x] POST /api/v1/booking/completed-details/:bookingId -> controller/bookingController.js#bookingCompletedDetails | 403 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":403,"status":"fail","isOperational":true},"message":"Access denied. Allowed roles: serviceprovider","stack":"Error: Access denied. Allowed roles: serviceprovider\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:604:7)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/booking/create -> controller/bookingController.js#createBooking | 400 | patient | pass
  req.body: {}
  res.body: {"success":false,"message":"patientId, serviceId, appointmentDate, startTime, and endTime are required"}
- [x] GET /api/v1/booking/getAllBookings -> controller/bookingController.js#getAllBookings | 200 | public | pass
  req.body: null
  res.body: {"success":true,"count":10,"totalCount":44,"totalPages":5,"page":1,"limit":10,"data":[{"_id":"69fc5d44a605afefbb99848b","treatmentId":"69fc5d43a605afefbb998489","patientId":"692e8652deff065cd6540a99","serviceId":"69200a03f94dd4c32856d886","category":"consultation","modes":["Home Service"],"servicePartnerId":"692400095d6ef718d87f6d15","sessionNumber":1,"appointmentDate":"2026-05-08T00:00:00.000Z","slotTime":{"startTime":"15:30","endTime":"16:00"},"duration":30,"status":"Rescheduled","notes":"this is test this","pricing":{"basePrice":500,"equipmentCharges":0,"subtotal":500,"taxPercentage":18,"taxAmount":90,"totalAmount":590},"invoiceUrl":null,"cancelledBy":null,"cancelledAt":null,"cancellationReason":null,"adminApprovalRequired":false,"requestedCancellationAt":null,"originalStatus":null,"timeRemainingAtRequest":null,"previousBookingId":null,"createdAt":"2026-05-07T09:37:08.076Z","updatedAt":"2026-05-07T10:09:32.072Z","__v":0,"patient":{"_id":"692e8652deff065cd6540a99","firstName":"Sidd","email":"sidd@gmail.com","phone":"8707807701","password":"$2b$12$noTvRL154ggFA7yzfX0CUOnBd.Er6Lo5RvBpGqgS8LS5bgoRal0Q2","profilePhoto":null,"dateOfBirth":"1997-12-07T00:00:00.000Z","gender":"male","address":{"street":"GT Road","city":"Kanpur Nagar","cityId":"690c456658dd2334d7cb9581","state":"Uttar Pradesh","country":"India"},"bloodGroup":"A-","allergies":[],"currentMedications":["test medication 1","test medication 2"],"emergencyContact":{"name":"","phone":""},"role":"patient","isVerified":true...
- [x] GET /api/v1/booking/my-bookings -> unknown | 200 | patient | pass
  req.body: null
  res.body: {"success":true,"count":0,"data":[],"detailsUsed":"basic","invoicesGenerated":0,"generateInvoiceUsed":false}
- [x] GET /api/v1/booking/my-bookings/:providerId -> controller/bookingController.js#getBookingsByServiceProvider | 403 | admin | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":403,"status":"fail","isOperational":true},"message":"Access denied. Allowed roles: serviceprovider","stack":"Error: Access denied. Allowed roles: serviceprovider\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:604:7)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/booking/patient/:patientId/bookings -> controller/bookingController.js#getBookedServicesByPatientId | 200 | patient | pass
  req.body: null
  res.body: {"success":true,"count":0,"data":[],"detailsUsed":"basic","invoicesGenerated":0,"generateInvoiceUsed":false}
- [x] GET /api/v1/booking/patient/:treatmentId -> controller/bookingController.js#getTreatmentById | 403 | doctor | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":403,"status":"fail","isOperational":true},"message":"Access denied. Allowed roles: patient","stack":"Error: Access denied. Allowed roles: patient\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:604:7)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/booking/providerBookings -> controller/bookingController.js#createProviderBooking | 403 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":403,"status":"fail","isOperational":true},"message":"Access denied. Allowed roles: serviceprovider","stack":"Error: Access denied. Allowed roles: serviceprovider\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:604:7)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PUT /api/v1/booking/reschedule/:bookingId -> controller/bookingController.js#rescheduleBooking | 400 | patient | pass
  req.body: {}
  res.body: {"success":false,"message":"Booking ID, appointmentDate, startTime, and endTime are required","received":[]}
- [x] GET /api/v1/booking/service-summary/:serviceId -> controller/bookingController.js#getServiceSummaryByServiceId | 200 | public | pass
  req.body: null
  res.body: {"success":true,"count":1,"data":[{"slotTime":{"startTime":"10:00","endTime":"12:30"},"pricing":{"basePrice":4500,"equipmentCharges":0,"subtotal":4500,"taxPercentage":18,"taxAmount":810,"totalAmount":5310},"createdBy":{"userId":"6908572ba5d6f07ca60752a4","userModel":"Admin"},"_id":"69d0c6ebb5081a1e3705f67f","treatmentStatus":"Active","patientId":{"_id":"692d7a9ff8d99699ddc9fada","email":"johncena@example.com","phone":"6388966722"},"serviceId":"6915d7cf9033f3ce1c0f322e","category":"nursing","modes":["Home Service"],"servicePartnerId":{"_id":"694e37c317dbd053f092e5fd","email":"superadmin@example.com"},"appointmentDate":"2026-04-07T00:00:00.000Z","duration":150,"status":"Approved","notes":"","city":"690c3adf6ac52e0495f62859","invoiceUrl":null,"cancelledBy":null,"cancelledAt":null,"cancellationReason":null,"adminApprovalRequired":false,"requestedCancellationAt":null,"originalStatus":null,"timeRemainingAtRequest":null,"previousBookingId":null,"isInvoiceGenerated":false,"paymentStatus":"Unpaid","paymentMethod":"None","advanceAmount":0,"paidAmount":0,"dueAmount":0,"isAdvancePaid":false,"isFinalPaymentDone":false,"lastRazorpayOrderId":null,"lastRazorpayPaymentId":null,"paymentHistory":[],"createdAt":"2026-04-04T08:08:11.991Z","updatedAt":"2026-04-04T08:08:11.991Z","__v":0}]}
- [x] PUT /api/v1/booking/update-status/:bookingId -> controller/bookingController.js#updateServiceStatus | 403 | admin | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":403,"status":"fail","isOperational":true},"message":"Access denied. Allowed roles: doctor, serviceprovider","stack":"Error: Access denied. Allowed roles: doctor, serviceprovider\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:604:7)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PATCH /api/v1/city/:cityId/toggle -> controller/cityController.js#toggleCityStatus | 500 | public | fail
  req.body: {}
  res.body: {"success":false,"message":"Error toggling status","error":"City validation failed: area.coordinates: Path `area.coordinates` is required."}
- [x] POST /api/v1/city/admin/cities -> controller/cityController.js#addCity | 400 | admin | pass
  req.body: {}
  res.body: {"success":false,"message":"Name and valid polygon are required"}
- [x] DELETE /api/v1/city/admin/cities/:cityId -> controller/cityController.js#deleteCity | 200 | admin | pass
  req.body: null
  res.body: {"success":true,"message":"City deleted successfully","data":{"area":{"type":"Polygon"},"_id":"6909ec0bb7dcc56ab86a9fa7","name":"mumbai","latitude":19.076,"longitude":72.8777,"createdAt":"2025-11-04T12:05:31.702Z","updatedAt":"2025-12-06T15:10:20.907Z","__v":0,"isActive":true}}
- [x] PUT /api/v1/city/admin/cities/:cityId -> controller/cityController.js#updateCity | 404 | admin | pass
  req.body: {}
  res.body: {"success":false,"message":"City not found"}
- [x] PATCH /api/v1/city/admin/cities/toggle/:cityId -> controller/cityController.js#toggleCityStatus | 404 | admin | pass
  req.body: {}
  res.body: {"success":false,"message":"City not found"}
- [x] GET /api/v1/city/cities/:cityId -> controller/cityController.js#getCityById | 404 | public | pass
  req.body: null
  res.body: {"success":false,"message":"City not found"}
- [x] GET /api/v1/city/find/by-location -> controller/cityController.js#findCityByLocation | 400 | public | pass
  req.body: null
  res.body: {"success":false,"message":"lat and lng are required"}
- [x] GET /api/v1/city/getAllCities -> controller/cityController.js#getAllCities | 200 | public | pass
  req.body: null
  res.body: {"success":true,"total":9,"data":[{"area":{"type":"Polygon"},"_id":"6952d6d57f6785a6601b645b","name":"ahmadabad","latitude":0,"longitude":0,"isActive":true,"createdAt":"2025-12-29T19:30:29.388Z","updatedAt":"2025-12-29T19:30:29.388Z","__v":0},{"area":{"type":"Polygon"},"_id":"691d9aebeaae59d1db945598","name":"chhatrapati sambhajinagar","latitude":19.8758,"longitude":75.3393,"createdAt":"2025-11-19T10:24:43.213Z","updatedAt":"2026-01-27T10:35:41.851Z","__v":0,"isActive":true},{"area":{"type":"Polygon","coordinates":[[[80.20038853395629,26.497876588405802],[80.17772618733707,26.387316658357577],[80.45791520008392,26.380556779977702],[80.464095840071,26.470860628118963],[80.32537480925025,26.52795507165419],[80.20038853395629,26.497876588405802]]]},"_id":"690c456658dd2334d7cb9581","name":"kanpur","latitude":26.4609135,"longitude":80.3217588,"createdAt":"2025-11-06T06:51:18.244Z","updatedAt":"2026-04-04T07:03:00.779Z","__v":0,"isActive":true},{"area":{"type":"Polygon"},"isActive":true,"_id":"690c3adf6ac52e0495f62859","name":"lucknow","latitude":19.076,"longitude":72.8777,"createdAt":"2025-11-06T06:06:23.149Z","updatedAt":"2025-11-06T06:06:23.149Z","__v":0},{"area":{"type":"Polygon"},"isActive":true,"_id":"692e6fdb20213c5420b2e20c","name":"noida","latitude":0,"longitude":0,"createdAt":"2025-12-02T04:49:31.492Z","updatedAt":"2025-12-02T04:49:31.492Z","__v":0},{"area":{"type":"Polygon","coordinates":[[[73.9875509106962,18.580635164455778],[73.99235807513061,18.52470594878284],[73.91...
- [x] POST /api/v1/crash-report/create -> controller/crashController.js#createCrashReport | 201 | public | pass
  req.body: {"userType":"patient","message":"Route verification synthetic crash record"}
  res.body: {"success":true,"message":"Crash report saved successfully","data":{"crashId":"69ff245cada007db76395750","severity":"MEDIUM","crashAt":"2026-05-09T12:11:08.315Z"}}
- [x] GET /api/v1/crash-report/get -> controller/crashController.js#getCrashReports | 500 | public | fail
  req.body: null
  res.body: {"status":"error","error":{"statusCode":500,"status":"error"},"message":"Schema hasn't been registered for model \"patient\".\nUse mongoose.model(name, schema)","stack":"MissingSchemaError: Schema hasn't been registered for model \"patient\".\nUse mongoose.model(name, schema)\n    at NativeConnection.model (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\connection.js:1497:13)\n    at _getModelFromConn (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\helpers\\populate\\getModelsMapForPopulate.js:579:15)\n    at addModelNamesToMap (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\helpers\\populate\\getModelsMapForPopulate.js:507:17)\n    at getModelsMapForPopulate (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\helpers\\populate\\getModelsMapForPopulate.js:208:7)\n    at _populatePath (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\model.js:4471:21)\n    at Function.populate (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\model.js:4438:21)\n    at model.Query._find (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\query.js:2452:23)\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)\n    at async model.Query.exec (E:\\easesmith\\medico\\medico_backend\\node_modules\\mongoose\\lib\\query.js:4627:63)\n    at async Promise.all (index 0)"}
- [x] GET /api/v1/crash-report/get/:crashId -> controller/crashController.js#getSingleCrashReport | 200 | public | pass
  req.body: null
  res.body: {"success":true,"message":"Crash report fetched successfully","data":{"_id":"697b3aad99352ad4b3028bf2","appName":"Admin Panel","appVersion":"1.0.0","environment":"development","errorName":"Error","errorId":"ERR_1769683629406","source":"FRONTEND","errorMessage":"Admins is not defined","stackTrace":"Error: Admins is not defined\n    at fetchApi (http://localhost:3000/_next/static/chunks/src_c600b7dc._.js:1529:29)\n    at async useApiQuery.useQuery (http://localhost:3000/_next/static/chunks/src_c600b7dc._.js:1550:28)","severity":"HIGH","request":{"method":"GET","url":"/admin/subadmins?page=1&limit=10"},"device":{"platform":"web","os":"Windows","browser":"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/144.0.0.0 Safari/537.36"},"userId":null,"userType":"Admin","resolved":false,"crashAt":"2026-01-29T10:47:09.408Z","createdAt":"2026-01-29T10:47:09.410Z","updatedAt":"2026-01-29T10:47:09.410Z","__v":0}}
- [x] GET /api/v1/doctor/:doctorId/service-availability -> controller/doctorController.js#getServiceAvailability | 200 | public | pass
  req.body: null
  res.body: {"success":true,"data":{"doctorInfo":{"id":"69083c7093634916321ed31d","name":"Ravi Prakash","email":"ravi@hospital.com","phone":"8707807722","specialization":"Cardiologist, Medicine Expert, Dermatologist","consultationFees":1000},"services":[{"_id":"6915d7cf9033f3ce1c0f322e","name":"Attendant Care","description":"Professional medical consultation and examination by qualified doctors"}],"availability":{"days":["Monday","Tuesday","Wednesday"],"timeSlots":[{"start":"09:00","end":"12:00","_id":"691ae719a45fcae4a84a7fdc"},{"start":"14:00","end":"18:00","_id":"691ae719a45fcae4a84a7fdd"}],"serviceAvailability":"both","serviceCoverage":[],"autoSlotGeneration":{"advanceBookingDays":30,"bufferBetweenSlots":5,"defaultDuration":30,"enabled":false}},"dailySlots":[{"date":"2025-11-17T00:00:00.000Z","dayOfWeek":"Monday","isAvailable":true,"slots":[{"startTime":"10:00","endTime":"11:00","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f7f"},{"startTime":"11:10","endTime":"12:10","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f80"},{"startTime":"12:20","endTime":"13:20","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f81"},{"startTime":"13:30","endTime":"14:30","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f82"},{"startTime":"14:40","endTime":"15:40","duration":60,"isBooked"...
- [x] POST /api/v1/doctor/availability -> controller/doctorController.js#configureAvailability | 200 | doctor | pass
  req.body: {}
  res.body: {"success":true,"message":"Availability configured successfully","data":{"availability":{"autoSlotGeneration":{"advanceBookingDays":30,"bufferBetweenSlots":5,"defaultDuration":30,"enabled":false},"days":["Monday","Tuesday","Wednesday"],"timeSlots":[{"start":"09:00","end":"12:00","_id":"691ae719a45fcae4a84a7fdc"},{"start":"14:00","end":"18:00","_id":"691ae719a45fcae4a84a7fdd"}],"dailySlots":[{"date":"2025-11-17T00:00:00.000Z","dayOfWeek":"Monday","isAvailable":true,"slots":[{"startTime":"10:00","endTime":"11:00","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f7f"},{"startTime":"11:10","endTime":"12:10","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f80"},{"startTime":"12:20","endTime":"13:20","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f81"},{"startTime":"13:30","endTime":"14:30","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f82"},{"startTime":"14:40","endTime":"15:40","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f83"},{"startTime":"15:50","endTime":"16:50","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f84"},{"startTime":"17:00","endTime":"18:00","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fc...
- [x] PUT /api/v1/doctor/availability -> controller/doctorController.js#updateAvailability | 400 | doctor | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Please provide days and timeSlots","stack":"Error: Please provide days and timeSlots\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1090:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at verifyAccessToken (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:628:5)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)"}
- [x] DELETE /api/v1/doctor/break-time -> controller/doctorController.js#removeBreakTime | 500 | doctor | fail
  req.body: null
  res.body: {"status":"error","error":{"statusCode":500,"status":"error"},"message":"Cannot destructure property 'date' of 'req.body' as it is undefined.","stack":"TypeError: Cannot destructure property 'date' of 'req.body' as it is undefined.\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1910:11\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at authorizeAndContinue (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:615:3)\n    at E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:295:20\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/doctor/break-time -> controller/doctorController.js#addBreakTime | 500 | doctor | fail
  req.body: {}
  res.body: {"success":false,"message":"doctor.addBreakTime is not a function","error":"doctor.addBreakTime is not a function"}
- [x] PUT /api/v1/doctor/bulk-manage-slots -> controller/doctorController.js#bulkManageSlots | 404 | doctor | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"No slots found for this date","stack":"Error: No slots found for this date\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:2061:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] POST /api/v1/doctor/check-auth -> controller/doctorController.js#checkAuthStatus | 200 | public | pass
  req.body: {}
  res.body: {"success":true,"isAuthenticated":false,"message":"refresh token expired","shouldLogout":true}
- [x] POST /api/v1/doctor/clinic -> controller/doctorController.js#addClinic | 400 | doctor | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Please provide clinic firstName and address","stack":"Error: Please provide clinic firstName and address\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1118:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at verifyAccessToken (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:628:5)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)"}
- [x] DELETE /api/v1/doctor/clinic/:clinicId -> controller/doctorController.js#deleteClinic | 200 | doctor | pass
  req.body: null
  res.body: {"success":true,"message":"Clinic deleted successfully","data":null}
- [x] PUT /api/v1/doctor/clinic/:clinicId -> controller/doctorController.js#updateClinic | 404 | doctor | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Clinic not found","stack":"Error: Clinic not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1150:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/doctor/doctor/cities/by-name/:doctorId/:cityName -> controller/doctorController.js#getDoctorCitiesByName | 500 | public | fail
  req.body: null
  res.body: {"status":"error","error":{"statusCode":500,"status":"error"},"message":"mongoose is not defined","stack":"ReferenceError: mongoose is not defined\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1279:3\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:600:14)\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:610:14)"}
- [x] GET /api/v1/doctor/doctor/my-cities/:doctorId -> controller/doctorController.js#getDoctorCities | 500 | public | fail
  req.body: null
  res.body: {"status":"error","error":{"statusCode":500,"status":"error"},"message":"mongoose is not defined","stack":"ReferenceError: mongoose is not defined\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1235:3\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:600:14)\n    at param (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:610:14)"}
- [x] GET /api/v1/doctor/doctors/city/:cityName -> controller/doctorController.js#getDoctorsByCityName | 200 | public | pass
  req.body: null
  res.body: {"success":true,"message":"1 doctor(s) found in Lucknow","data":{"city":{"id":"690c3adf6ac52e0495f62859","name":"lucknow","latitude":19.076,"longitude":72.8777},"totalDoctors":1,"doctors":[{"id":"6984506e772be643087318b0","firstName":"Dr. mansi","email":"dr.yadavmansi@hospital.com","phone":"6388966722","medicalRegistrationNumber":"MCI2023003","specialization":"Cardiology","cities":[{"_id":"690c3adf6ac52e0495f62859","name":"lucknow","latitude":19.076,"longitude":72.8777}],"totalCities":1}]}}
- [x] GET /api/v1/doctor/getAllDoctors -> controller/doctorController.js#getAllDoctors | 200 | public | pass
  req.body: null
  res.body: {"success":true,"results":4,"totalPages":1,"currentPage":1,"data":{"doctors":[{"availability":{"autoSlotGeneration":{"enabled":false,"defaultDuration":30,"bufferBetweenSlots":5,"advanceBookingDays":30},"days":[],"serviceAvailability":"both","timeSlots":[],"serviceCoverage":[],"dailySlots":[]},"_id":"6986e431ccdcddc78d94b5bf","firstName":"Ravi Doctor","email":"testravi@gmail.com","phone":"8707807701","profilePhoto":null,"dateOfBirth":"1997-02-12T00:00:00.000Z","gender":"male","cities":["6909ec0bb7dcc56ab86a9fa7"],"medicalRegistrationNumber":"1234567890","issuingMedicalCouncil":"MEdical Council of India ","yearsOfExperience":12,"specialization":"Cardiology, Hematology ","subSpecialties":[],"currentWorkplace":"Metro Noida","designation":"Senior Doctor ","professionalBio":"This is test this is test this is test this is test this is test this is test this is test this is test this is test ","consultationFees":1000,"degrees":["MDS","DNB","MBBS (Hons)"],"university":"India University of Medical science ","graduationYear":2005,"certifications":[],"residencies":[],"trainingsWorkshops":[],"verificationStatus":"approved","services":[],"role":"doctor","isPhoneVerified":true,"averageRating":0,"totalReviews":0,"followers":[],"followersCount":0,"isActive":true,"clinics":[],"createdAt":"2026-02-07T07:05:21.846Z","updatedAt":"2026-05-07T13:34:20.225Z","__v":0},{"availability":{"autoSlotGeneration":{"enabled":false,"defaultDuration":30,"bufferBetweenSlots":5,"advanceBookingDays":30},"days":[],...
- [x] GET /api/v1/doctor/getDoctorById/:id -> controller/doctorController.js#getDoctorById | 404 | public | pass
  req.body: null
  res.body: {"status":"fail","error":{"statusCode":404,"status":"fail","isOperational":true},"message":"Doctor not found","stack":"Error: Doctor not found\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1005:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/doctor/getMyProfile -> controller/doctorController.js#getMyProfile | 200 | doctor | pass
  req.body: null
  res.body: {"success":true,"data":{"doctor":{"address":"123, ABC Street, City, Country","verificationDocuments":{"degreesCertificates":[]},"availability":{"autoSlotGeneration":{"advanceBookingDays":30,"bufferBetweenSlots":5,"defaultDuration":30,"enabled":false},"days":["Monday","Tuesday","Wednesday"],"timeSlots":[{"start":"09:00","end":"12:00","_id":"691ae719a45fcae4a84a7fdc"},{"start":"14:00","end":"18:00","_id":"691ae719a45fcae4a84a7fdd"}],"dailySlots":[{"date":"2025-11-17T00:00:00.000Z","dayOfWeek":"Monday","isAvailable":true,"slots":[{"startTime":"10:00","endTime":"11:00","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f7f"},{"startTime":"11:10","endTime":"12:10","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f80"},{"startTime":"12:20","endTime":"13:20","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f81"},{"startTime":"13:30","endTime":"14:30","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f82"},{"startTime":"14:40","endTime":"15:40","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f83"},{"startTime":"15:50","endTime":"16:50","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f84"},{"startTime":"17:00","endTime":"18:00","duration":60,"isBooked":false,"isSlotAv...
- [x] POST /api/v1/doctor/login -> controller/doctorController.js#doctorLogin | 200 | public | pass
  req.body: {"phone":"8707807722","role":"doctor"}
  res.body: {"success":true,"message":"OTP sent successfully to your registered phone","data":{"phone":"8707807722","role":"doctor","nextStep":"Verify OTP"}}
- [x] POST /api/v1/doctor/logout -> controller/doctorController.js#logout | 200 | doctor | pass
  req.body: {}
  res.body: {"success":true,"message":"Logged out successfully"}
- [x] POST /api/v1/doctor/logout-all-devices -> controller/doctorController.js#logoutAllDevices | 400 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone number is required","stack":"Error: Phone number is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:807:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- [x] GET /api/v1/doctor/my-availability -> controller/doctorController.js#getMyAvailability | 200 | doctor | pass
  req.body: null
  res.body: {"success":true,"data":{"autoSlotGeneration":{"advanceBookingDays":30,"bufferBetweenSlots":5,"defaultDuration":30,"enabled":false},"days":["Monday","Tuesday","Wednesday"],"timeSlots":[{"start":"09:00","end":"12:00","_id":"691ae719a45fcae4a84a7fdc"},{"start":"14:00","end":"18:00","_id":"691ae719a45fcae4a84a7fdd"}],"dailySlots":[{"date":"2025-11-17T00:00:00.000Z","dayOfWeek":"Monday","isAvailable":true,"slots":[{"startTime":"10:00","endTime":"11:00","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f7f"},{"startTime":"11:10","endTime":"12:10","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f80"},{"startTime":"12:20","endTime":"13:20","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f81"},{"startTime":"13:30","endTime":"14:30","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f82"},{"startTime":"14:40","endTime":"15:40","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f83"},{"startTime":"15:50","endTime":"16:50","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f84"},{"startTime":"17:00","endTime":"18:00","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f85"}],"_id":"691ae696a45fcae4a84a7f7e","breakTimes":[]},...
- [x] POST /api/v1/doctor/resend-login-otp -> controller/doctorController.js#resendLoginOtp | 400 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone number is required","stack":"Error: Phone number is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:758:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- [x] POST /api/v1/doctor/resend-signup-otp -> controller/doctorController.js#resendSignupOtp | 400 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone number is required","stack":"Error: Phone number is required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:493:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- [x] PUT /api/v1/doctor/service-availability -> controller/doctorController.js#updateServiceAvailability | 500 | doctor | fail
  req.body: {}
  res.body: {"status":"error","error":{"statusCode":500,"status":"error"},"message":"doctor.availability.serviceAvailability.findIndex is not a function","stack":"TypeError: doctor.availability.serviceAvailability.findIndex is not a function\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:1984:64\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] PUT /api/v1/doctor/service-coverage -> controller/doctorController.js#updateServiceCoverage | 200 | doctor | pass
  req.body: {}
  res.body: {"success":true,"message":"Service coverage updated successfully","data":{}}
- [x] POST /api/v1/doctor/signup -> controller/doctorController.js#doctorSignup | 400 | public | pass
  req.body: {"firstName":"Route Doctor","email":"route.doctor.1778328673920.729526@example.com","phone":"9673920319","medicalRegistrationNumber":"MED-1778328673920","issuingMedicalCouncil":"Medical Council","specialization":"General","cityId":"6909ec0bb7dcc56ab86a9fa7","password":"RouteTest@123"}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Selected city does not exist in available cities","stack":"Error: Selected city does not exist in available cities\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:342:17\n    at process.processTicksAndRejections (node:internal/process/task_queues:95:5)"}
- [x] GET /api/v1/doctor/slots/:doctorId -> controller/doctorController.js#getAvailableSlots | 500 | public | fail
  req.body: null
  res.body: {"success":false,"message":"Error fetching available slots","error":"doctor.getAvailableSlotsByDateRange is not a function"}
- [x] GET /api/v1/doctor/specialization/:specialization -> controller/doctorController.js#getDoctorsBySpecialization | 200 | public | pass
  req.body: null
  res.body: {"success":true,"results":0,"totalPages":0,"currentPage":1,"data":{"doctors":[]}}
- [x] PUT /api/v1/doctor/toggle-slot -> controller/doctorController.js#toggleSlotAvailability | 500 | doctor | fail
  req.body: {}
  res.body: {"success":false,"message":"doctor.toggleSlotAvailability is not a function","error":"doctor.toggleSlotAvailability is not a function"}
- [x] PUT /api/v1/doctor/updateProfile -> controller/doctorController.js#updateProfile | 200 | doctor | pass
  req.body: {}
  res.body: {"success":true,"message":"Profile updated successfully","data":{"doctor":{"address":"123, ABC Street, City, Country","verificationDocuments":{"degreesCertificates":[]},"availability":{"autoSlotGeneration":{"advanceBookingDays":30,"bufferBetweenSlots":5,"defaultDuration":30,"enabled":false},"days":["Monday","Tuesday","Wednesday"],"timeSlots":[{"start":"09:00","end":"12:00","_id":"691ae719a45fcae4a84a7fdc"},{"start":"14:00","end":"18:00","_id":"691ae719a45fcae4a84a7fdd"}],"dailySlots":[{"date":"2025-11-17T00:00:00.000Z","dayOfWeek":"Monday","isAvailable":true,"slots":[{"startTime":"10:00","endTime":"11:00","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f7f"},{"startTime":"11:10","endTime":"12:10","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f80"},{"startTime":"12:20","endTime":"13:20","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f81"},{"startTime":"13:30","endTime":"14:30","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f82"},{"startTime":"14:40","endTime":"15:40","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f83"},{"startTime":"15:50","endTime":"16:50","duration":60,"isBooked":false,"isSlotAvailable":true,"status":"available","_id":"691ae696a45fcae4a84a7f84"},{"startTime":"17:00","endTime":"18:00"...
- [x] POST /api/v1/doctor/verification-documents -> controller/doctorController.js#uploadVerificationDocuments | 200 | doctor | pass
  req.body: {}
  res.body: {"success":true,"message":"Verification documents uploaded successfully","data":{"verificationDocuments":{"degreesCertificates":[]}}}
- [x] POST /api/v1/doctor/verify-login-otp -> controller/doctorController.js#verifyLoginOtp | 400 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone number and OTP are required","stack":"Error: Phone number and OTP are required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:662:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- [x] POST /api/v1/doctor/verify-signup-otp -> controller/doctorController.js#verifySignupOtp | 400 | public | pass
  req.body: {}
  res.body: {"status":"fail","error":{"statusCode":400,"status":"fail","isOperational":true},"message":"Phone number and OTP are required","stack":"Error: Phone number and OTP are required\n    at E:\\easesmith\\medico\\medico_backend\\controller\\doctorController.js:409:17\n    at E:\\easesmith\\medico\\medico_backend\\utils\\catchAsync.js:3:5\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)"}
- [x] POST /api/v1/geo/check-location -> controller/geoController.js#checkAddressInPolygon | 400 | public | pass
  req.body: {"latitude":26.8467,"longitude":80.9462}
  res.body: {"success":false,"message":"Request failed with status code 400"}
- [x] GET /api/v1/invoice/:invoiceId -> controller/invoiceController.js#getInvoice | 200 | public | pass
  req.body: null
  res.body: {"billingDetails":{"serviceName":"Attendant Care","shiftType":null,"durationMinutes":30,"basePrice":1500,"calculatedBase":1500,"taxPercentage":18},"totals":{"subtotal":2000,"gstAmount":339,"cgst":169.5,"sgst":169.5,"grandTotal":2339},"invoiceUrl":null,"isInvoiceGenerated":false,"_id":"69536c0b9e9b76709658b78b","invoiceNumber":"INV-1767074827960-5040","bookingId":"694e788e2b3d2593a0f7feb7","patientId":{"address":{"street":"GT Road","city":"Kanpur Nagar","cityId":"690c456658dd2334d7cb9581","state":"Uttar Pradesh","country":"India"},"emergencyContact":{"name":"","phone":""},"_id":"692e8652deff065cd6540a99","firstName":"Sidd","email":"sidd@gmail.com","phone":"8707807701","profilePhoto":null,"dateOfBirth":"1997-12-07T00:00:00.000Z","gender":"male","bloodGroup":"A-","allergies":[],"currentMedications":["test medication 1","test medication 2"],"role":"patient","isVerified":true,"isActive":true,"following":[],"followingCount":0,"medicalHistory":[],"savedPosts":[],"createdAt":"2025-12-02T06:25:22.213Z","updatedAt":"2026-05-07T11:07:21.349Z","__v":9,"mediaFiles":[],"medicationHistory":[],"treatmentProgress":[]},"doctorId":{"currentAddress":{"street":"test","locality":"df d fd f","city":"d fdd","state":"d fdf","country":"India","pincode":"123456","landmark":"test"},"permanentAddress":{"street":"test","locality":"df d fd f","city":"d fdd","state":"d fdf","country":"India","pincode":"123456","landmark":"test","sameAsCurrent":true},"workAddress":{"clinicName":"","street":"","locality":"","...
- [x] GET /api/v1/invoice/download/:invoiceId -> controller/invoiceController.js#downloadInvoice | 0 | admin | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/invoice/generate -> controller/invoiceController.js#generateInvoice | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/invoice/generateinv/:patientId -> controller/invoiceController.js#getPatientInvoicesByServiceProvider | 0 | admin | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/items/active -> controller/itemCategoryController.js#getActiveCategories | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/items/category/:id -> controller/itemCategoryController.js#getCategoryDetails | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/items/create -> controller/itemCategoryController.js#createCategory | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] DELETE /api/v1/items/delete/:id -> controller/itemCategoryController.js#deleteCategory | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/items/getAllCategories -> controller/itemCategoryController.js#getAllCategories | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/items/getItemCategoryById/:id -> controller/itemCategoryController.js#getItemsByCategory | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] PATCH /api/v1/items/toggle-status/:id -> controller/itemCategoryController.js#toggleCategoryStatus | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] PUT /api/v1/items/update/:id -> controller/itemCategoryController.js#updateCategory | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] DELETE /api/v1/patient/allergies -> controller/patientController.js#removeAllergy | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/patient/allergies -> controller/patientController.js#addAllergy | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/patient/check-auth -> controller/patientController.js#checkAuthStatus | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/patient/follow/:doctorId -> controller/patientController.js#followDoctor | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/patient/getById/:patientId -> controller/patientController.js#getPatientById | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/patient/login -> controller/patientController.js#patientLogin | 0 | doctor | fail
  req.body: {"phone":"9876543233"}
  res.body: null
- [x] POST /api/v1/patient/logout -> controller/patientController.js#logout | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/patient/logout-all -> controller/patientController.js#patientLogoutAll | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/patient/medical-history -> controller/patientController.js#updateMedicalHistory | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] DELETE /api/v1/patient/medical-history/:historyId -> controller/patientController.js#deleteMedicalHistory | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] DELETE /api/v1/patient/medications -> controller/patientController.js#removeMedication | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/patient/medications -> controller/patientController.js#addMedication | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/patient/myTreatmentHistory -> controller/patientController.js#getCompletePatientTreatmentHistory | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/patient/profile -> controller/patientController.js#getMyProfile | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/patient/resend-login-otp -> controller/patientController.js#resendLoginOtp | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/patient/resend-signup-otp -> controller/patientController.js#resendSignupOtp | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/patient/signup -> controller/patientController.js#patientSignup | 0 | doctor | fail
  req.body: {"firstName":"Route Patient","email":"route.patient.1778328676632.726737@example.com","phone":"9676632544","password":"RouteTest@123"}
  res.body: null
- [x] DELETE /api/v1/patient/unfollow/:doctorId -> controller/patientController.js#unfollowDoctor | 0 | doctor | fail
  req.body: null
  res.body: null
- [x] PATCH /api/v1/patient/updateProfile/:id -> controller/patientController.js#updatePatient | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/patient/verify-login-otp -> controller/patientController.js#verifyLoginOtp | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/patient/verify-signup-otp -> controller/patientController.js#verifySignupOtp | 0 | doctor | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/payments/treatments/:treatmentId/ledger -> controller/payController.js#getTreatmentPaymentLedger | 0 | admin | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/payments/treatments/:treatmentId/manual-collection -> controller/payController.js#recordManualPayment | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/payments/treatments/:treatmentId/online/order -> controller/payController.js#createTreatmentOnlineOrder | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/payments/treatments/:treatmentId/online/verify -> controller/payController.js#verifyTreatmentOnlinePayment | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/payments/treatments/:treatmentId/refunds/manual -> controller/payController.js#recordManualRefund | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/service/:id/price -> controller/serviceController.js#calculateServicePrice | 0 | patient | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/service/:id/restore -> controller/serviceController.js#restoreService | 0 | patient | fail
  req.body: {}
  res.body: null
- [x] PATCH /api/v1/service/:id/toggle-status -> controller/serviceController.js#toggleServiceStatus | 0 | patient | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/service/:serviceId/slots -> controller/serviceController.js#getAvailableSlots | 0 | patient | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/service/admin/bulk-update -> controller/serviceController.js#bulkUpdateServices | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/service/admin/statistics -> controller/serviceController.js#getServiceStatistics | 0 | admin | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/service/category/:category -> controller/serviceController.js#getServicesByCategory | 0 | patient | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/service/city/:cityId -> controller/serviceController.js#getServicesByCity | 0 | patient | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/service/createService -> controller/serviceController.js#createService | 0 | patient | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/service/getAllServices -> controller/serviceController.js#getAllServices | 0 | patient | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/service/getServiceById/:id -> controller/serviceController.js#getServiceById | 0 | patient | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/service/nursing/:nursingType -> controller/serviceController.js#getNursingServicesByType | 0 | patient | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/service/search -> controller/serviceController.js#searchServices | 0 | patient | fail
  req.body: null
  res.body: null
- [x] DELETE /api/v1/service/service/:id -> controller/serviceController.js#deleteService | 0 | patient | fail
  req.body: null
  res.body: null
- [x] PATCH /api/v1/service/services/:id -> controller/serviceController.js#updateService | 0 | patient | fail
  req.body: {}
  res.body: null
- [x] PATCH /api/v1/serviceProvider/:id/toggle-status -> controller/providerController.js#toggleStatus | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/serviceProvider/createservice-provider -> controller/providerController.js#createServiceProvider | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/serviceProvider/getAllServiceProviders -> controller/providerController.js#getAllServiceProviders | 0 | admin | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/serviceProvider/login -> controller/providerController.js#loginServiceProvider | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] DELETE /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#deleteServiceProvider | 0 | admin | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#getServiceProviderById | 0 | admin | fail
  req.body: null
  res.body: null
- [x] PUT /api/v1/serviceProvider/service-provider/:id -> controller/providerController.js#updateServiceProvider | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/serviceProvider/service-provider/appointments -> controller/providerController.js#getServiceProviderAppointments | 0 | admin | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/serviceProvider/service-provider/appointments/:id -> controller/providerController.js#getSingleAppointment | 0 | admin | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/serviceProvider/service-providers/by-service/:serviceId -> controller/providerController.js#getProvidersByServiceId | 0 | admin | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/socialPost/addComment/:id -> controller/socialmediaController.js#addComment | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/socialPost/commentPost/:id -> controller/socialmediaController.js#addComment | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] POST /api/v1/socialPost/createPost -> unknown | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/socialPost/feed -> controller/socialmediaController.js#getSocialFeed | 0 | admin | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/socialPost/follow-stats/me -> controller/socialmediaController.js#getMyFollowStats | 0 | admin | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/socialPost/followDoctor -> controller/socialmediaController.js#toggleFollowDoctor | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/socialPost/getPostByAdmin/:id -> controller/socialmediaController.js#getPostByIdByAdmin | 0 | admin | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/socialPost/getPostById/:id -> controller/socialmediaController.js#getPostById | 0 | admin | fail
  req.body: null
  res.body: null
- [x] GET /api/v1/socialPost/getPosts -> controller/socialmediaController.js#getPosts | 0 | admin | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/socialPost/likePost/:id/toggle -> controller/socialmediaController.js#toggleLikePost | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] DELETE /api/v1/socialPost/posts/:id -> controller/socialmediaController.js#deletePost | 0 | admin | fail
  req.body: null
  res.body: null
- [x] PATCH /api/v1/socialPost/posts/:id/hide -> controller/socialmediaController.js#toggleHidePost | 0 | admin | fail
  req.body: {}
  res.body: null
- [x] GET /api/v1/socialPost/search -> controller/socialmediaController.js#searchSocialPosts | 0 | admin | fail
  req.body: null
  res.body: null
- [x] POST /api/v1/uploadfile/upload -> unknown | 0 | admin | fail
  req.body: {}
  res.body: null