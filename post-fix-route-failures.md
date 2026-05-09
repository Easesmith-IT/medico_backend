# Post-Fix Route Failures

- generatedAt: 2026-05-09T20:26:02.963Z

## Phase 01
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 02
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 03
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 04
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 05
- totalRoutes: 11
- fixedRoutes: 11
- unresolvedRoutes: 0


## Phase 06
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 07
- totalRoutes: 12
- fixedRoutes: 12
- unresolvedRoutes: 0


## Phase 08
- totalRoutes: 18
- fixedRoutes: 18
- unresolvedRoutes: 0


## Phase 09
- totalRoutes: 8
- fixedRoutes: 5
- unresolvedRoutes: 3

- POST /api/v1/invoice/generate | status=500 | context=public
  controller: controller/invoiceController.js#generateInvoice
  category: Backend bug / external block
  error: paymentHistory is not defined
  request: /api/v1/invoice/generate
- POST /api/v1/payments/treatments/:treatmentId/online/order | status=409 | context=patient
  controller: controller/payController.js#createTreatmentOnlineOrder
  category: Validation/contract mismatch
  error: A pending online payment already exists for this treatment
  request: /api/v1/payments/treatments/69ff42979d7c3398cf4b551d/online/order
- POST /api/v1/payments/treatments/:treatmentId/online/verify | status=404 | context=patient
  controller: controller/payController.js#verifyTreatmentOnlinePayment
  category: Data precondition missing
  error: Pending online transaction not found for this order
  request: /api/v1/payments/treatments/69ff42979d7c3398cf4b551d/online/verify

## Phase 10
- totalRoutes: 3
- fixedRoutes: 3
- unresolvedRoutes: 0

