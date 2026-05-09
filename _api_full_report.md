# Medico Backend - Full API Test Report

**Date:** 2026-05-09T18:35:04.657Z

## Summary

| Metric | Value |
|--------|-------|
| Total Routes | 93 |
| Passed | 69 |
| Failed | 0 |
| Warning (4xx) | 24 |

## Errors & Failures

| # | Category | Method | Endpoint | Code | Error |
|---|----------|--------|----------|------|-------|
| 7 | Doctor | GET | /doctor/doctors/city/ahmadabad | 404 | {'status':'fail','error':{'statusCode':404,'status':'fail','isOperational':true},'message':'City not found: ahmadabad','stack':'Error: City not found: |
| 9 | Doctor | POST | /doctor/login | 400 | {'status':'fail','error':{'statusCode':400,'status':'fail','isOperational':true},'message':'Phone number is required','stack':'Error: Phone number is  |
| 17 | Doctor | POST | /doctor/availability | 403 | {'status':'fail','error':{'statusCode':403,'status':'fail','isOperational':true},'message':'Account disabled','stack':'Error: Account disabled\n    at |
| 18 | Doctor | GET | /doctor/my-availability | 403 | {'status':'fail','error':{'statusCode':403,'status':'fail','isOperational':true},'message':'Account disabled','stack':'Error: Account disabled\n    at |
| 19 | Patient | POST | /patient/login | 403 | {'status':'fail','error':{'statusCode':403,'status':'fail','isOperational':true},'message':'Please complete signup verification first','stack':'Error: |
| 20 | Patient | POST | /patient/login | 403 | {'status':'fail','error':{'statusCode':403,'status':'fail','isOperational':true},'message':'Please complete signup verification first','stack':'Error: |
| 26 | Patient | POST | /patient/allergies | 400 | {'status':'fail','error':{'statusCode':400,'status':'fail','isOperational':true},'message':'Please provide allergy details','stack':'Error: Please pro |
| 28 | Patient | POST | /patient/medical-history | 400 | {'status':'fail','error':{'statusCode':400,'status':'fail','isOperational':true},'message':'Please provide condition details','stack':'Error: Please p |
| 29 | Admin | POST | /admin/login | 400 | {'status':'fail','error':{'statusCode':400,'status':'fail','isOperational':true},'message':'Email and password required','stack':'Error: Email and pas |
| 30 | Admin | POST | /admin/login | 400 | {'status':'fail','error':{'statusCode':400,'status':'fail','isOperational':true},'message':'Email and password required','stack':'Error: Email and pas |
| 51 | Admin | POST | /admin/doctors/create | 400 | {'status':'fail','error':{'statusCode':400,'status':'fail','isOperational':true},'message':'Required fields: firstName, email, phone, medicalRegistrat |
| 52 | Admin | POST | /admin/patients/create | 400 | {'status':'fail','error':{'statusCode':400,'status':'fail','isOperational':true},'message':'Please provide all required fields: firstName, email, phon |
| 54 | Admin | PATCH | /admin/bookings/status/DUMMY | 404 | {'status':'fail','error':{'statusCode':404,'status':'fail','isOperational':true},'message':'Can't find /api/v1/admin/bookings/status/DUMMY on this ser |
| 57 | Admin | GET | /admin/admin/city/6952d6d57f6785a6601b645b/doctors | 400 | {'status':'fail','error':{'statusCode':400,'status':'fail','isOperational':true},'message':'City ID is required','stack':'Error: City ID is required\n |
| 58 | Admin | POST | /admin/addEquipments | 400 | {'success':false,'message':'At least one city ID is required.'} |
| 61 | City | GET | /city/find/by-location?lat=19.076&lng=72.8777 | 404 | {'success':false,'message':'Service not available in this area'} |
| 63 | City | POST | /city/admin/cities | 400 | {'success':false,'message':'Name and valid polygon are required'} |
| 79 | SocialPost | GET | /socialPost/follow-stats/me | 403 | {'status':'fail','error':{'statusCode':403,'status':'fail','isOperational':true},'message':'Account disabled','stack':'Error: Account disabled\n    at |
| 80 | SocialPost | POST | /socialPost/followDoctor | 400 | {'success':false,'message':'targetDoctorId required'} |
| 81 | Geo | POST | /geo/check-location | 400 | {'success':false,'message':'Request failed with status code 400'} |
| 86 | Item | GET | /items/getItemCategoryById/6952d6d57f6785a6601b645b | 404 | {'success':false,'message':'Category 6952d6d57f6785a6601b645b not found or deleted'} |
| 87 | Invoice | POST | /invoice/generate | 400 | {'success':false,'message':'bookingId is required'} |
| 88 | ServiceProvider | POST | /serviceProvider/login | 400 | {'success':false,'message':'Password is required'} |
| 89 | ServiceProvider | POST | /serviceProvider/login | 401 | {'success':false,'message':'Invalid email/mobile or password'} |

## All Route Results

| # | Category | Method | Endpoint | Auth | Code | Status | Time |
|---|----------|--------|----------|------|------|--------|------|
| 1 | Root | GET | / | none | 200 | PASS | 0.04s |
| 2 | Root | GET | /health | none | 200 | PASS | 0.00s |
| 3 | Root | GET | /api/test-cookies | none | 200 | PASS | 0.00s |
| 4 | Auth | GET | /check-status | none | 200 | PASS | 0.01s |
| 5 | Doctor | GET | /doctor/getAllDoctors | none | 200 | PASS | 0.12s |
| 6 | Doctor | GET | /doctor/getDoctorById/6984506e772be643087318b0 | none | 200 | PASS | 0.05s |
| 7 | Doctor | GET | /doctor/doctors/city/ahmadabad | none | 404 | WARN | 0.12s |
| 8 | Doctor | GET | /doctor/specialization/General | none | 200 | PASS | 0.11s |
| 9 | Doctor | POST | /doctor/login | none | 400 | WARN | 0.08s |
| 10 | Doctor | POST | /doctor/login | none | 200 | PASS | 1.32s |
| 11 | Doctor | POST | /doctor/check-auth | none | 200 | PASS | 0.01s |
| 12 | Doctor | GET | /doctor/slots/6984506e772be643087318b0 | none | 200 | PASS | 0.05s |
| 13 | Doctor | GET | /doctor/6984506e772be643087318b0/service-availability | none | 200 | PASS | 0.06s |
| 14 | Doctor | GET | /doctor/getMyProfile | bearer | 200 | PASS | 0.05s |
| 15 | Doctor | PUT | /doctor/updateProfile | bearer | 200 | PASS | 0.06s |
| 16 | Doctor | POST | /doctor/logout | bearer | 200 | PASS | 0.00s |
| 17 | Doctor | POST | /doctor/availability | bearer | 403 | WARN | 0.06s |
| 18 | Doctor | GET | /doctor/my-availability | bearer | 403 | WARN | 0.06s |
| 19 | Patient | POST | /patient/login | none | 403 | WARN | 0.10s |
| 20 | Patient | POST | /patient/login | none | 403 | WARN | 0.10s |
| 21 | Patient | POST | /patient/check-auth | none | 200 | PASS | 0.00s |
| 22 | Patient | GET | /patient/getById/69099012606fc5a2ab07ae91 | none | 200 | PASS | 0.05s |
| 23 | Patient | GET | /patient/profile | bearer | 200 | PASS | 0.09s |
| 24 | Patient | POST | /patient/logout | bearer | 200 | PASS | 0.00s |
| 25 | Patient | PATCH | /patient/updateProfile/69099012606fc5a2ab07ae91 | bearer | 200 | PASS | 0.16s |
| 26 | Patient | POST | /patient/allergies | bearer | 400 | WARN | 0.05s |
| 27 | Patient | DELETE | /patient/allergies | bearer | 200 | PASS | 0.14s |
| 28 | Patient | POST | /patient/medical-history | bearer | 400 | WARN | 0.05s |
| 29 | Admin | POST | /admin/login | none | 400 | WARN | 0.06s |
| 30 | Admin | POST | /admin/login | none | 400 | WARN | 0.06s |
| 31 | Admin | POST | /admin/check-auth | none | 200 | PASS | 0.00s |
| 32 | Admin | GET | /admin/services/names | none | 200 | PASS | 0.07s |
| 33 | Admin | GET | /admin/patients/names | none | 200 | PASS | 0.07s |
| 34 | Admin | GET | /admin/service-providers/names | none | 200 | PASS | 0.06s |
| 35 | Admin | GET | /admin/me | bearer | 200 | PASS | 0.09s |
| 36 | Admin | GET | /admin/subadmins | bearer | 200 | PASS | 0.14s |
| 37 | Admin | PUT | /admin/updateProfile | bearer | 200 | PASS | 0.10s |
| 38 | Admin | GET | /admin/doctors | bearer | 200 | PASS | 0.18s |
| 39 | Admin | GET | /admin/doctors/6984506e772be643087318b0 | bearer | 200 | PASS | 0.10s |
| 40 | Admin | GET | /admin/patients | bearer | 200 | PASS | 0.14s |
| 41 | Admin | GET | /admin/patients/69099012606fc5a2ab07ae91 | bearer | 200 | PASS | 0.09s |
| 42 | Admin | GET | /admin/reports/dashboard | bearer | 200 | PASS | 0.23s |
| 43 | Admin | GET | /admin/reports/doctors | bearer | 200 | PASS | 0.27s |
| 44 | Admin | PUT | /admin/doctors/6984506e772be643087318b0/approve | bearer | 200 | PASS | 0.10s |
| 45 | Admin | PUT | /admin/doctors/6984506e772be643087318b0/reject | bearer | 200 | PASS | 0.10s |
| 46 | Admin | PATCH | /admin/doctors/6984506e772be643087318b0/toggle-status | bearer | 200 | PASS | 0.14s |
| 47 | Admin | PUT | /admin/patients/69099012606fc5a2ab07ae91/block | bearer | 200 | PASS | 0.10s |
| 48 | Admin | PATCH | /admin/patients/69099012606fc5a2ab07ae91/toggle-status | bearer | 200 | PASS | 0.14s |
| 49 | Admin | PATCH | /admin/subadmins/69084c5c9248b76f43cc26d5/toggle-status | bearer | 200 | PASS | 0.09s |
| 50 | Admin | POST | /admin/logout | bearer | 200 | PASS | 0.00s |
| 51 | Admin | POST | /admin/doctors/create | bearer | 400 | WARN | 0.10s |
| 52 | Admin | POST | /admin/patients/create | bearer | 400 | WARN | 0.10s |
| 53 | Admin | GET | /admin/patients/export | bearer | 200 | PASS | 0.17s |
| 54 | Admin | PATCH | /admin/bookings/status/DUMMY | bearer | 404 | WARN | 0.06s |
| 55 | Admin | GET | /admin/bookings/export | bearer | 200 | PASS | 0.21s |
| 56 | Admin | GET | /admin/admin/doctor/6984506e772be643087318b0/cities | bearer | 200 | PASS | 0.14s |
| 57 | Admin | GET | /admin/admin/city/6952d6d57f6785a6601b645b/doctors | bearer | 400 | WARN | 0.10s |
| 58 | Admin | POST | /admin/addEquipments | bearer | 400 | WARN | 0.05s |
| 59 | City | GET | /city/getAllCities | none | 200 | PASS | 0.05s |
| 60 | City | GET | /city/cities/6952d6d57f6785a6601b645b | none | 200 | PASS | 0.04s |
| 61 | City | GET | /city/find/by-location?lat=19.076&lng=72.8777 | none | 404 | WARN | 0.05s |
| 62 | City | PATCH | /city/6952d6d57f6785a6601b645b/toggle | none | 200 | PASS | 0.09s |
| 63 | City | POST | /city/admin/cities | bearer | 400 | WARN | 0.05s |
| 64 | City | PUT | /city/admin/cities/6952d6d57f6785a6601b645b | bearer | 200 | PASS | 0.10s |
| 65 | City | PATCH | /city/admin/cities/toggle/6952d6d57f6785a6601b645b | bearer | 200 | PASS | 0.14s |
| 66 | Service | GET | /service/getAllServices | none | 200 | PASS | 0.14s |
| 67 | Service | GET | /service/search?q=consultation | none | 200 | PASS | 0.14s |
| 68 | Service | GET | /service/category/consultation | none | 200 | PASS | 0.11s |
| 69 | Service | GET | /service/getServiceById/69ff6f91a42b48079782cb4e | none | 200 | PASS | 0.14s |
| 70 | Service | GET | /service/city/6952d6d57f6785a6601b645b | none | 200 | PASS | 0.09s |
| 71 | Service | GET | /service/69ff6f91a42b48079782cb4e/price | none | 200 | PASS | 0.05s |
| 72 | Booking | GET | /booking/getAllBookings | none | 200 | PASS | 0.08s |
| 73 | Article | GET | /article/articles | none | 200 | PASS | 0.15s |
| 74 | Article | GET | /article/getallarticle | none | 200 | PASS | 0.14s |
| 75 | Article | GET | /article/doctors/6984506e772be643087318b0/articles | none | 200 | PASS | 0.09s |
| 76 | SocialPost | GET | /socialPost/getPosts | none | 200 | PASS | 0.18s |
| 77 | SocialPost | GET | /socialPost/feed | none | 200 | PASS | 0.10s |
| 78 | SocialPost | GET | /socialPost/search?q=health | none | 200 | PASS | 0.23s |
| 79 | SocialPost | GET | /socialPost/follow-stats/me | bearer | 403 | WARN | 0.05s |
| 80 | SocialPost | POST | /socialPost/followDoctor | bearer | 400 | WARN | 0.05s |
| 81 | Geo | POST | /geo/check-location | none | 400 | WARN | 0.15s |
| 82 | CrashReport | POST | /crash-report/create | none | 201 | PASS | 0.06s |
| 83 | CrashReport | GET | /crash-report/get | none | 200 | PASS | 0.10s |
| 84 | Item | GET | /items/active | none | 200 | PASS | 0.07s |
| 85 | Item | GET | /items/getAllCategories | none | 200 | PASS | 0.10s |
| 86 | Item | GET | /items/getItemCategoryById/6952d6d57f6785a6601b645b | none | 404 | WARN | 0.04s |
| 87 | Invoice | POST | /invoice/generate | none | 400 | WARN | 0.00s |
| 88 | ServiceProvider | POST | /serviceProvider/login | none | 400 | WARN | 0.05s |
| 89 | ServiceProvider | POST | /serviceProvider/login | none | 401 | WARN | 0.44s |
| 90 | ServiceProvider | GET | /serviceProvider/getAllServiceProviders | none | 200 | PASS | 0.16s |
| 91 | ServiceProvider | GET | /serviceProvider/service-provider/6954b8661f9e10ca7a950d6a | none | 200 | PASS | 0.12s |
| 92 | ServiceProvider | GET | /serviceProvider/service-providers/by-service/69ff6f91a42b48079782cb4e | none | 200 | PASS | 0.05s |
| 93 | ServiceProvider | GET | /serviceProvider/service-provider/appointments | bearer | 200 | PASS | 0.22s |
