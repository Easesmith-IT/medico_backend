# Phase 06 Error Analysis

- totalRoutes: 18
- generatedAt: 2026-05-09T12:52:49.164Z

## 1. DELETE /api/v1/items/delete/:id
- Controller: controller/itemCategoryController.js#deleteCategory
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Category not found"}
- Error (normalized): Category not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: DELETE /api/v1/items/delete/699da06d063f7bf10e8ab446 using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 2. DELETE /api/v1/service/service/:id
- Controller: controller/serviceController.js#deleteService
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Service not found"}
- Error (normalized): Service not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: DELETE /api/v1/service/service/699da06d063f7bf10e8ab446 using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 3. GET /api/v1/items/active
- Controller: controller/itemCategoryController.js#getActiveCategories
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"count":3,"data":[{"_id":"699f17652bc20ff0ac61e749","name":"Equipment","type":"equipment","description":"Test equipment","items":[{"name":"equipment 1","unitPrice":50,"isActive":true,"_id":"69ac11870a717f1055edc96f"}]},{"_id":"699e9326434f727c4cb0aedc","name":"Medicine","type":"medicine","description":"Updated medicines used during service","items":[{"name":"test2","unitPrice":6,"isActive":true,"_id":"699ee4078bd3e3872470d5a3"},{"name":"Amoxicillin","unitPrice":15,"isActive":true,"_id":"699ee4078bd3e3872470d5a4"},{"name":"Ibuprofen","unitPrice":10,"isActive":true,"_id":"699ee4078bd3e3872470d5a5"},{"name":"Cough Syrup","unitPrice":65,"isActive":true,"_id":"699ee4078bd3e3872470d5a6"},{"name":"Vitamin C Tablets","unitPrice":12,"isActive":true,"_id":"699ee4078bd3e3872470d5a7"}]},{"_id":"699eba4d5f78f45a98f4febd","name":"Medicine","type":"medicine","description":"Medicines used during service","items":[{"name":"Paracetamol","unitPrice":5,"isActive":true,"_id":"699eba4d5f78f45a98f4febe"},{"name":"Amoxicillin","unitPrice":12,"isActive":true,"_id":"699eba4d5f78f45a98f4febf"},{"name":"Ibuprofen","unitPrice":8,"isActive":true,"_id":"699eba4d5f78f45a98f4fec0"},{"name":"Cough S...
- Error (normalized): {"success":true,"count":3,"data":[{"_id":"699f17652bc20ff0ac61e749","name":"Equipment","type":"equipment","description":"Test equipment","items":[{"name":"equipment 1","unitPrice":50,"isActive":true,"_id":"69ac11870a717f1055edc96f"}]},{"_id":"699e9326434f727c4cb0aedc","name":"Medicine","type":"medicine","description":"Updated medicines used during service","items":[{"name":"test2","unitPrice":6,"isActive":true,"_id":"699ee4078bd3e3872470d5a3"},{"name":"Amoxicillin","unitPrice":15,"isActive":true,"_id":"699ee4078bd3e3872470d5a4"},{"name":"Ibuprofen","unitPrice":10,"isActive":true,"_id":"699ee4078bd3e3872470d5a5"},{"name":"Cough Syrup","unitPrice":65,"isActive":true,"_id":"699ee4078bd3e3872470d5a6"},{"name":"Vitamin C Tablets","unitPrice":12,"isActive":true,"_id":"699ee4078bd3e3872470d5a7"}]},{"_id":"699eba4d5f78f45a98f4febd","name":"Medicine","type":"medicine","description":"Medicines used during service","items":[{"name":"Paracetamol","unitPrice":5,"isActive":true,"_id":"699eba4d5f78f45a98f4febe"},{"name":"Amoxicillin","unitPrice":12,"isActive":true,"_id":"699eba4d5f78f45a98f4febf"},{"name":"Ibuprofen","unitPrice":8,"isActive":true,"_id":"699eba4d5f78f45a98f4fec0"},{"name":"Cough S...
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/items/active using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 4. GET /api/v1/items/category/:id
- Controller: controller/itemCategoryController.js#getCategoryDetails
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Category 699da06d063f7bf10e8ab446 not found or deleted"}
- Error (normalized): Category 699da06d063f7bf10e8ab446 not found or deleted
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/items/category/699da06d063f7bf10e8ab446 using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 5. GET /api/v1/items/getAllCategories
- Controller: controller/itemCategoryController.js#getAllCategories
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"results":3,"totalPages":1,"currentPage":1,"totalRecords":3,"data":{"categories":[{"_id":"699f17652bc20ff0ac61e749","name":"Equipment","type":"equipment","description":"Test equipment","items":[{"name":"equipment 1","unitPrice":50,"isActive":true,"_id":"69ac11870a717f1055edc96f"}],"isActive":true,"createdAt":"2026-02-25T15:38:13.049Z"},{"_id":"699eba4d5f78f45a98f4febd","name":"Medicine","type":"medicine","description":"Medicines used during service","items":[{"name":"Paracetamol","unitPrice":5,"isActive":true,"_id":"699eba4d5f78f45a98f4febe"},{"name":"Amoxicillin","unitPrice":12,"isActive":true,"_id":"699eba4d5f78f45a98f4febf"},{"name":"Ibuprofen","unitPrice":8,"isActive":true,"_id":"699eba4d5f78f45a98f4fec0"},{"name":"Cough Syrup","unitPrice":60,"isActive":true,"_id":"699eba4d5f78f45a98f4fec1"},{"name":"Vitamin C Tablets","unitPrice":10,"isActive":true,"_id":"699eba4d5f78f45a98f4fec2"}],"isActive":true,"createdAt":"2026-02-25T09:01:01.593Z"},{"_id":"699e9326434f727c4cb0aedc","name":"Medicine","type":"medicine","description":"Updated medicines used during service","items":[{"name":"test2","unitPrice":6,"isActive":true,"_id":"699ee4078bd3e3872470d5a3"},{"name":"Amoxi...
- Error (normalized): {"success":true,"results":3,"totalPages":1,"currentPage":1,"totalRecords":3,"data":{"categories":[{"_id":"699f17652bc20ff0ac61e749","name":"Equipment","type":"equipment","description":"Test equipment","items":[{"name":"equipment 1","unitPrice":50,"isActive":true,"_id":"69ac11870a717f1055edc96f"}],"isActive":true,"createdAt":"2026-02-25T15:38:13.049Z"},{"_id":"699eba4d5f78f45a98f4febd","name":"Medicine","type":"medicine","description":"Medicines used during service","items":[{"name":"Paracetamol","unitPrice":5,"isActive":true,"_id":"699eba4d5f78f45a98f4febe"},{"name":"Amoxicillin","unitPrice":12,"isActive":true,"_id":"699eba4d5f78f45a98f4febf"},{"name":"Ibuprofen","unitPrice":8,"isActive":true,"_id":"699eba4d5f78f45a98f4fec0"},{"name":"Cough Syrup","unitPrice":60,"isActive":true,"_id":"699eba4d5f78f45a98f4fec1"},{"name":"Vitamin C Tablets","unitPrice":10,"isActive":true,"_id":"699eba4d5f78f45a98f4fec2"}],"isActive":true,"createdAt":"2026-02-25T09:01:01.593Z"},{"_id":"699e9326434f727c4cb0aedc","name":"Medicine","type":"medicine","description":"Updated medicines used during service","items":[{"name":"test2","unitPrice":6,"isActive":true,"_id":"699ee4078bd3e3872470d5a3"},{"name":"Amoxi...
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/items/getAllCategories using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 6. GET /api/v1/items/getItemCategoryById/:id
- Controller: controller/itemCategoryController.js#getItemsByCategory
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Category 699da06d063f7bf10e8ab446 not found or deleted"}
- Error (normalized): Category 699da06d063f7bf10e8ab446 not found or deleted
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/items/getItemCategoryById/699da06d063f7bf10e8ab446 using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 7. GET /api/v1/service/:id/price
- Controller: controller/serviceController.js#calculateServicePrice
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Service not found or inactive"}
- Error (normalized): Service not found or inactive
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/699da06d063f7bf10e8ab446/price using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 8. GET /api/v1/service/:serviceId/slots
- Controller: controller/serviceController.js#getAvailableSlots
- Final HTTP Status: 400
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Date is required"}
- Error (normalized): Date is required
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/6915d7cf9033f3ce1c0f322e/slots using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 9. GET /api/v1/service/admin/statistics
- Controller: controller/serviceController.js#getServiceStatistics
- Final HTTP Status: 403
- Classification: Confirmed Backend Bug
- Error (raw): {"status":"fail","error":{"statusCode":403,"status":"fail","isOperational":true},"message":"Access denied. Admin privileges required.","stack":"Error: Access denied. Admin privileges required.\n    at verifyAdminRole (E:\\easesmith\\medico\\medico_backend\\middleware\\auth.js:678:9)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:157:13)\n    at Route.dispatch (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\route.js:117:3)\n    at handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:435:11)\n    at Layer.handleRequest (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\lib\\layer.js:152:17)\n    at E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:295:15\n    at processParams (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:582:12)\n    at next (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:291:5)\n    at Function.handle (E:\\easesmith\\medico\\medico_backend\\node_modules\\router\\index.js:186:3)"}
- Error (normalized): Access denied. Admin privileges required.
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/admin/statistics using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 10. GET /api/v1/service/category/:category
- Controller: controller/serviceController.js#getServicesByCategory
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"count":0,"data":[]}
- Error (normalized): {"success":true,"count":0,"data":[]}
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/category/general using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 11. GET /api/v1/service/city/:cityId
- Controller: controller/serviceController.js#getServicesByCity
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"city":"Unknown","count":3,"data":[{"slotConfig":{"consultationSlots":{"enabled":true,"startTime":"09:00","endTime":"19:00","slotDuration":30}},"createdBy":{"userId":"6908572ba5d6f07ca60752a4","userModel":"SuperAdmin","name":"Admin User","email":"admin@medico.com"},"_id":"69200a03f94dd4c32856d886","name":"Doctor Visit","category":"consultation","nursingType":null,"description":"General medical consultation with experienced doctors","basePrice":500,"equipmentCharges":0,"taxPercentage":18,"modes":["Home Service"],"supportsDuration":true,"defaultDuration":30,"durationOptions":[],"cities":[{"_id":"690c456658dd2334d7cb9581","name":"kanpur","latitude":26.4609135,"longitude":80.3217588},{"_id":"691c6979160086905997cc1d","name":"vanaras","latitude":19.076,"longitude":72.8777},{"_id":"691d9aebeaae59d1db945598","name":"chhatrapati sambhajinagar","latitude":19.8758,"longitude":75.3393}],"paymentMode":"Both","isActive":true,"icon":"","image":"","isDeleted":false,"createdAt":"2025-11-21T06:43:15.102Z","updatedAt":"2025-12-03T13:08:48.274Z","__v":1,"formattedDuration":"0.5 hours","displayTimeFormat":"24-hour"},{"slotConfig":{"equipmentBooking":{"enabled":true,"minDuration":60,"ma...
- Error (normalized): {"success":true,"city":"Unknown","count":3,"data":[{"slotConfig":{"consultationSlots":{"enabled":true,"startTime":"09:00","endTime":"19:00","slotDuration":30}},"createdBy":{"userId":"6908572ba5d6f07ca60752a4","userModel":"SuperAdmin","name":"Admin User","email":"admin@medico.com"},"_id":"69200a03f94dd4c32856d886","name":"Doctor Visit","category":"consultation","nursingType":null,"description":"General medical consultation with experienced doctors","basePrice":500,"equipmentCharges":0,"taxPercentage":18,"modes":["Home Service"],"supportsDuration":true,"defaultDuration":30,"durationOptions":[],"cities":[{"_id":"690c456658dd2334d7cb9581","name":"kanpur","latitude":26.4609135,"longitude":80.3217588},{"_id":"691c6979160086905997cc1d","name":"vanaras","latitude":19.076,"longitude":72.8777},{"_id":"691d9aebeaae59d1db945598","name":"chhatrapati sambhajinagar","latitude":19.8758,"longitude":75.3393}],"paymentMode":"Both","isActive":true,"icon":"","image":"","isDeleted":false,"createdAt":"2025-11-21T06:43:15.102Z","updatedAt":"2025-12-03T13:08:48.274Z","__v":1,"formattedDuration":"0.5 hours","displayTimeFormat":"24-hour"},{"slotConfig":{"equipmentBooking":{"enabled":true,"minDuration":60,"ma...
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/city/6909ec0bb7dcc56ab86a9fa7 using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 12. GET /api/v1/service/getAllServices
- Controller: controller/serviceController.js#getAllServices
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"data":{"services":[{"slotConfig":{"consultationSlots":{"enabled":true,"startTime":"09:00","endTime":"19:00","slotDuration":30},"nursingSlots":{"enabled":true,"shiftTypes":["24-hour"],"minDuration":1440,"maxDuration":1440,"available24x7":true,"allowCustomDuration":true},"equipmentBooking":{"enabled":true,"minDuration":1,"maxDuration":1,"available24x7":false}},"createdBy":{"userId":"6908572ba5d6f07ca60752a4","userModel":"SuperAdmin","name":"Mansi","email":"admin@medico.com"},"_id":"69ac0acf0a717f1055edc801","name":"Nursing testee","category":"nursing","nursingType":"hourly","description":"Professional medical consultation and examination by qualified doctors","timeFormat":"12-hour","basePrice":500,"equipmentCharges":300,"taxPercentage":18,"modes":["Home Service","Visit Provider Location"],"supportsDuration":true,"defaultDuration":30,"durationOptions":[],"cities":[{"_id":"6952d4945304a59cd97531c2","name":"vadodara","latitude":22.3,"longitude":73.21},{"_id":"6978a5cc61626d4530eacc7a","name":"sambhaji nagar","latitude":26.5,"longitude":80.3}],"paymentMode":"Both","isActive":true,"icon":"https://storage.googleapis.com/medico_health_tech/1772883510480-Untitled design (22)...
- Error (normalized): {"success":true,"data":{"services":[{"slotConfig":{"consultationSlots":{"enabled":true,"startTime":"09:00","endTime":"19:00","slotDuration":30},"nursingSlots":{"enabled":true,"shiftTypes":["24-hour"],"minDuration":1440,"maxDuration":1440,"available24x7":true,"allowCustomDuration":true},"equipmentBooking":{"enabled":true,"minDuration":1,"maxDuration":1,"available24x7":false}},"createdBy":{"userId":"6908572ba5d6f07ca60752a4","userModel":"SuperAdmin","name":"Mansi","email":"admin@medico.com"},"_id":"69ac0acf0a717f1055edc801","name":"Nursing testee","category":"nursing","nursingType":"hourly","description":"Professional medical consultation and examination by qualified doctors","timeFormat":"12-hour","basePrice":500,"equipmentCharges":300,"taxPercentage":18,"modes":["Home Service","Visit Provider Location"],"supportsDuration":true,"defaultDuration":30,"durationOptions":[],"cities":[{"_id":"6952d4945304a59cd97531c2","name":"vadodara","latitude":22.3,"longitude":73.21},{"_id":"6978a5cc61626d4530eacc7a","name":"sambhaji nagar","latitude":26.5,"longitude":80.3}],"paymentMode":"Both","isActive":true,"icon":"https://storage.googleapis.com/medico_health_tech/1772883510480-Untitled design (22)...
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/getAllServices using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 13. GET /api/v1/service/getServiceById/:id
- Controller: controller/serviceController.js#getServiceById
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Service not found"}
- Error (normalized): Service not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/getServiceById/699da06d063f7bf10e8ab446 using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 14. GET /api/v1/service/nursing/:nursingType
- Controller: controller/serviceController.js#getNursingServicesByType
- Final HTTP Status: 400
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Invalid nursingType parameter"}
- Error (normalized): Invalid nursingType parameter
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/nursing/icu using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 15. GET /api/v1/service/search
- Controller: controller/serviceController.js#searchServices
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"count":4,"data":[{"slotConfig":{"consultationSlots":{"enabled":true,"startTime":"09:00","endTime":"19:00","slotDuration":30},"nursingSlots":{"enabled":true,"shiftTypes":["24-hour"],"minDuration":1440,"maxDuration":1440,"available24x7":true,"allowCustomDuration":false},"equipmentBooking":{"enabled":false,"minDuration":60,"maxDuration":720,"available24x7":true}},"createdBy":{"userId":"6908572ba5d6f07ca60752a4","userModel":"SuperAdmin","name":"Mansi","email":"admin@medico.com"},"_id":"694e2238e0d47328d79c08da","name":"Nursing test","category":"nursing","nursingType":"full-day","description":"Professional medical consultation and examination by qualified doctors","timeFormat":"12-hour","basePrice":500,"equipmentCharges":0,"taxPercentage":18,"modes":["Home Service","Visit Provider Location"],"supportsDuration":true,"defaultDuration":30,"durationOptions":[],"cities":[{"_id":"690c3adf6ac52e0495f62859","name":"lucknow","latitude":19.076,"longitude":72.8777},{"_id":"690c456658dd2334d7cb9581","name":"kanpur","latitude":26.4609135,"longitude":80.3217588}],"paymentMode":"Both","isActive":true,"icon":"","image":"","isDeleted":false,"createdAt":"2025-12-26T05:50:48.590Z","update...
- Error (normalized): {"success":true,"count":4,"data":[{"slotConfig":{"consultationSlots":{"enabled":true,"startTime":"09:00","endTime":"19:00","slotDuration":30},"nursingSlots":{"enabled":true,"shiftTypes":["24-hour"],"minDuration":1440,"maxDuration":1440,"available24x7":true,"allowCustomDuration":false},"equipmentBooking":{"enabled":false,"minDuration":60,"maxDuration":720,"available24x7":true}},"createdBy":{"userId":"6908572ba5d6f07ca60752a4","userModel":"SuperAdmin","name":"Mansi","email":"admin@medico.com"},"_id":"694e2238e0d47328d79c08da","name":"Nursing test","category":"nursing","nursingType":"full-day","description":"Professional medical consultation and examination by qualified doctors","timeFormat":"12-hour","basePrice":500,"equipmentCharges":0,"taxPercentage":18,"modes":["Home Service","Visit Provider Location"],"supportsDuration":true,"defaultDuration":30,"durationOptions":[],"cities":[{"_id":"690c3adf6ac52e0495f62859","name":"lucknow","latitude":19.076,"longitude":72.8777},{"_id":"690c456658dd2334d7cb9581","name":"kanpur","latitude":26.4609135,"longitude":80.3217588}],"paymentMode":"Both","isActive":true,"icon":"","image":"","isDeleted":false,"createdAt":"2025-12-26T05:50:48.590Z","update...
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/service/search?query=test using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 16. PATCH /api/v1/items/toggle-status/:id
- Controller: controller/itemCategoryController.js#toggleCategoryStatus
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Category not found"}
- Error (normalized): Category not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: PATCH /api/v1/items/toggle-status/699da06d063f7bf10e8ab446 using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 17. PATCH /api/v1/service/:id/toggle-status
- Controller: controller/serviceController.js#toggleServiceStatus
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Service not found"}
- Error (normalized): Service not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: PATCH /api/v1/service/699da06d063f7bf10e8ab446/toggle-status using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 18. PATCH /api/v1/service/services/:id
- Controller: controller/serviceController.js#updateService
- Final HTTP Status: 404
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Service not found"}
- Error (normalized): Service not found
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: PATCH /api/v1/service/services/699da06d063f7bf10e8ab446 using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium
