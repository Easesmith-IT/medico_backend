# Phase 09 Error Analysis

- totalRoutes: 8
- generatedAt: 2026-05-09T12:52:49.166Z

## 1. GET /api/v1/invoice/download/:invoiceId
- Controller: controller/invoiceController.js#downloadInvoice
- Final HTTP Status: 0
- Classification: Confirmed Backend Bug
- Error (raw): ECONNRESET: read ECONNRESET
- Error (normalized): ECONNRESET: read ECONNRESET
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/invoice/download/69536c0b9e9b76709658b78b using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 2. GET /api/v1/invoice/generateinv/:patientId
- Controller: controller/invoiceController.js#getPatientInvoicesByServiceProvider
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"count":0,"stats":{"totalSessions":0,"completedSessions":0,"pendingSessions":0,"inProgressSessions":0},"data":[]}
- Error (normalized): {"success":true,"count":0,"stats":{"totalSessions":0,"completedSessions":0,"pendingSessions":0,"inProgressSessions":0},"data":[]}
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/invoice/generateinv/6909a373c21dc072f0dc1a87 using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 3. GET /api/v1/payments/treatments/:treatmentId/ledger
- Controller: controller/payController.js#getTreatmentPaymentLedger
- Final HTTP Status: 200
- Classification: Confirmed Backend Bug
- Error (raw): {"success":true,"message":"Payment ledger fetched successfully","data":{"paymentId":"69e3197ac3ca89effabc5670","treatmentId":"69984a296152d24784923e03","patientId":"692d7a9ff8d99699ddc9fada","servicePartnerId":"6954b8661f9e10ca7a950d6a","bookingIds":[],"invoiceId":null,"currency":"INR","totalBillAmount":0,"totalPaid":0,"totalRefunded":0,"remainingBalance":0,"paymentStatus":"Unpaid","transactions":[],"refunds":[],"updatedAt":"2026-04-18T05:41:14.571Z"}}
- Error (normalized): Payment ledger fetched successfully
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: GET /api/v1/payments/treatments/69984a296152d24784923e03/ledger using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 4. POST /api/v1/invoice/generate
- Controller: controller/invoiceController.js#generateInvoice
- Final HTTP Status: 500
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Invoice validation failed: bookingId: Path `bookingId` is required."}
- Error (normalized): Invoice validation failed: bookingId: Path `bookingId` is required.
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/invoice/generate using context=doctor
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 5. POST /api/v1/payments/treatments/:treatmentId/manual-collection
- Controller: controller/payController.js#recordManualPayment
- Final HTTP Status: 400
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"A valid amount is required"}
- Error (normalized): A valid amount is required
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/payments/treatments/69984a296152d24784923e03/manual-collection using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 6. POST /api/v1/payments/treatments/:treatmentId/online/order
- Controller: controller/payController.js#createTreatmentOnlineOrder
- Final HTTP Status: 403
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"Only the treatment owner can create an online payment order"}
- Error (normalized): Only the treatment owner can create an online payment order
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/payments/treatments/69984a296152d24784923e03/online/order using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 7. POST /api/v1/payments/treatments/:treatmentId/online/verify
- Controller: controller/payController.js#verifyTreatmentOnlinePayment
- Final HTTP Status: 400
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"razorpay_order_id, razorpay_payment_id and razorpay_signature are required"}
- Error (normalized): razorpay_order_id, razorpay_payment_id and razorpay_signature are required
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/payments/treatments/69984a296152d24784923e03/online/verify using context=patient
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium

## 8. POST /api/v1/payments/treatments/:treatmentId/refunds/manual
- Controller: controller/payController.js#recordManualRefund
- Final HTTP Status: 400
- Classification: Confirmed Backend Bug
- Error (raw): {"success":false,"message":"A valid refund amount is required"}
- Error (normalized): A valid refund amount is required
- Root-cause hypothesis: Unhandled backend runtime failure in controller/middleware path.
- Repro request shape: POST /api/v1/payments/treatments/69984a296152d24784923e03/refunds/manual using context=admin
- Fix recommendation: Add targeted logging/guards in controller branch and cover route with regression test.
- Priority: P1
- Confidence: Medium
