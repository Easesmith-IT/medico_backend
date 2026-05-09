# Post-Fix Route Failures

- generatedAt: 2026-05-09T17:32:08.595Z

## Phase 01
- totalRoutes: 18
- fixedRoutes: 16
- unresolvedRoutes: 2

- POST /api/v1/admin/bookings/create | status=403 | context=admin
  controller: controller/adminController.js#createBookingByAdmin
  category: Auth/role restriction
  error: Booking not allowed. Patient does not belong to the selected city.
  request: /api/v1/admin/bookings/create
- PATCH /api/v1/admin/bookings/update/:bookingId | status=403 | context=admin
  controller: controller/adminController.js#updateBookingByAdmin
  category: Auth/role restriction
  error: Booking not allowed: patient does not belong to the selected city
  request: /api/v1/admin/bookings/update/69ff42989d7c3398cf4b5520

## Phase 02
- totalRoutes: 18
- fixedRoutes: 17
- unresolvedRoutes: 1

- GET /api/v1/doctor/doctor/cities/by-name/:doctorId/:cityName | status=404 | context=doctor
  controller: controller/doctorController.js#getDoctorCitiesByName
  category: Data precondition missing
  error: Doctor is not available in city: chhatrapati sambhajinagar
  request: /api/v1/doctor/doctor/cities/by-name/69104ae53f18864f8d196806/chhatrapati sambhajinagar

## Phase 03
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 04
- totalRoutes: 18
- fixedRoutes: 17
- unresolvedRoutes: 1

- PUT /api/v1/booking/reschedule/:bookingId | status=400 | context=patient
  controller: controller/bookingController.js#rescheduleBooking
  category: Validation/contract mismatch
  error: Cannot reschedule cancelled or rejected bookings
  request: /api/v1/booking/reschedule/69ff42989d7c3398cf4b5520

## Phase 05
- totalRoutes: 11
- fixedRoutes: 10
- unresolvedRoutes: 1

- PUT /api/v1/booking/update-status/:bookingId | status=403 | context=doctor
  controller: controller/bookingController.js#updateServiceStatus
  category: Auth/role restriction
  error: Unauthorized provider
  request: /api/v1/booking/update-status/69ff6f6db9c84d5136e4c576

## Phase 06
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 07
- totalRoutes: 12
- fixedRoutes: 11
- unresolvedRoutes: 1

- POST /api/v1/geo/check-location | status=400 | context=public
  controller: controller/geoController.js#checkAddressInPolygon
  category: Validation/contract mismatch
  error: Location not found
  request: /api/v1/geo/check-location

## Phase 08
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 09
- totalRoutes: 8
- fixedRoutes: 8
- unresolvedRoutes: 0


## Phase 10
- totalRoutes: 3
- fixedRoutes: 3
- unresolvedRoutes: 0

