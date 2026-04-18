# Payment API

Base URL:

```text
http://localhost:5000/api/v1/payments
```

This API follows the treatment-ledger model:

- `Treatment` is the business entity
- `Booking` is scheduling only
- `Payment` is the single financial ledger per treatment
- `Invoice` is generated from treatment/payment state

## Auth

Use bearer auth in the `Authorization` header:

```text
Authorization: Bearer <TOKEN>
```

Role access:

- Patient:
  - create online order
  - verify online payment
  - view own ledger
- Admin / SuperAdmin / SubAdmin:
  - record manual collection
  - record manual refund
  - view ledger
- ServiceProvider:
  - view ledger for assigned treatment

## Endpoints

### 1. Get Payment Ledger

`GET /treatments/:treatmentId/ledger`

Returns the payment ledger for a treatment.

Allowed roles:

- `patient`
- `serviceprovider`
- `admin`
- `superadmin`
- `subadmin`

#### cURL

```bash
curl -X GET "http://localhost:5000/api/v1/payments/treatments/TREATMENT_ID/ledger" \
  -H "Authorization: Bearer TOKEN"
```

#### Success Response

```json
{
  "success": true,
  "message": "Payment ledger fetched successfully",
  "data": {
    "paymentId": "665f1d...",
    "treatmentId": "665f1c...",
    "patientId": "665f1b...",
    "servicePartnerId": "665f1a...",
    "bookingIds": ["665f11...", "665f12..."],
    "invoiceId": null,
    "currency": "INR",
    "totalBillAmount": 5000,
    "totalPaid": 2000,
    "totalRefunded": 0,
    "remainingBalance": 3000,
    "paymentStatus": "Partially Paid",
    "transactions": [],
    "refunds": [],
    "updatedAt": "2026-04-18T10:30:00.000Z"
  }
}
```

---

### 2. Create Online Payment Order

`POST /treatments/:treatmentId/online/order`

Creates a Razorpay order for an online payment against the treatment ledger.

Allowed roles:

- `patient`

#### Request Body

```json
{
  "amount": 2000
}
```

#### cURL

```bash
curl -X POST "http://localhost:5000/api/v1/payments/treatments/TREATMENT_ID/online/order" \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 2000
  }'
```

#### Success Response

```json
{
  "success": true,
  "message": "Online payment order created successfully",
  "data": {
    "paymentId": "665f1d...",
    "treatmentId": "665f1c...",
    "orderId": "order_Qabc123",
    "amount": 200000,
    "currency": "INR",
    "stage": "Advance"
  }
}
```

Notes:

- `amount` in response is returned by Razorpay in paise
- request `amount` is sent in rupees

---

### 3. Verify Online Payment

`POST /treatments/:treatmentId/online/verify`

Verifies a Razorpay payment and updates `Payment.transactions[]`.

Allowed roles:

- `patient`

#### Request Body

```json
{
  "razorpay_order_id": "order_Qabc123",
  "razorpay_payment_id": "pay_Qabc123",
  "razorpay_signature": "generated_signature"
}
```

#### cURL

```bash
curl -X POST "http://localhost:5000/api/v1/payments/treatments/TREATMENT_ID/online/verify" \
  -H "Authorization: Bearer PATIENT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "razorpay_order_id": "order_Qabc123",
    "razorpay_payment_id": "pay_Qabc123",
    "razorpay_signature": "generated_signature"
  }'
```

#### Success Response

```json
{
  "success": true,
  "message": "Online payment verified successfully",
  "data": {
    "paymentId": "665f1d...",
    "treatmentId": "665f1c...",
    "patientId": "665f1b...",
    "servicePartnerId": "665f1a...",
    "bookingIds": ["665f11...", "665f12..."],
    "invoiceId": null,
    "currency": "INR",
    "totalBillAmount": 5000,
    "totalPaid": 2000,
    "totalRefunded": 0,
    "remainingBalance": 3000,
    "paymentStatus": "Partially Paid",
    "transactions": [
      {
        "type": "Charge",
        "stage": "Advance",
        "method": "Online",
        "amountPaid": 2000,
        "status": "Paid",
        "razorpayOrderId": "order_Qabc123",
        "razorpayPaymentId": "pay_Qabc123"
      }
    ],
    "refunds": []
  }
}
```

---

### 4. Record Manual Collection

`POST /treatments/:treatmentId/manual-collection`

Records an admin-managed manual payment such as cash, UPI, card, or bank transfer.

Allowed roles:

- `admin`
- `superadmin`
- `subadmin`

#### Request Body

```json
{
  "amount": 3000,
  "method": "Cash",
  "stage": "Final",
  "note": "Collected at clinic desk",
  "referenceNumber": "cash-rcpt-1001"
}
```

#### Fields

- `amount`: required, rupees
- `method`: required, one of:
  - `Cash`
  - `UPI`
  - `Card`
  - `BankTransfer`
- `stage`: optional but recommended, one of:
  - `Advance`
  - `Partial`
  - `Final`
- `note`: optional
- `referenceNumber`: optional receipt/reference number

#### cURL

```bash
curl -X POST "http://localhost:5000/api/v1/payments/treatments/TREATMENT_ID/manual-collection" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 3000,
    "method": "Cash",
    "stage": "Final",
    "note": "Collected at clinic desk",
    "referenceNumber": "cash-rcpt-1001"
  }'
```

#### Success Response

```json
{
  "success": true,
  "message": "Manual payment recorded successfully",
  "data": {
    "paymentId": "665f1d...",
    "treatmentId": "665f1c...",
    "totalBillAmount": 5000,
    "totalPaid": 5000,
    "totalRefunded": 0,
    "remainingBalance": 0,
    "paymentStatus": "Paid"
  }
}
```

---

### 5. Record Manual Refund

`POST /treatments/:treatmentId/refunds/manual`

Records an admin-managed manual refund against the treatment ledger.

Allowed roles:

- `admin`
- `superadmin`
- `subadmin`

#### Request Body

```json
{
  "amount": 500,
  "reason": "Session cancelled adjustment",
  "mode": "Cash",
  "refundType": "Partial",
  "note": "Manual refund issued",
  "referenceTransactionId": null
}
```

#### Fields

- `amount`: required, rupees
- `reason`: required
- `mode`: required, one of:
  - `Cash`
  - `BankTransfer`
  - `UPI`
  - `Adjustment`
- `refundType`: optional, `Full` or `Partial`
- `note`: optional
- `referenceTransactionId`: optional related transaction id

#### cURL

```bash
curl -X POST "http://localhost:5000/api/v1/payments/treatments/TREATMENT_ID/refunds/manual" \
  -H "Authorization: Bearer ADMIN_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 500,
    "reason": "Session cancelled adjustment",
    "mode": "Cash",
    "refundType": "Partial",
    "note": "Manual refund issued",
    "referenceTransactionId": null
  }'
```

#### Success Response

```json
{
  "success": true,
  "message": "Manual refund recorded successfully",
  "data": {
    "paymentId": "665f1d...",
    "treatmentId": "665f1c...",
    "totalBillAmount": 5000,
    "totalPaid": 5000,
    "totalRefunded": 500,
    "remainingBalance": 500,
    "paymentStatus": "PartialRefund"
  }
}
```

## Common Errors

### 400 Bad Request

```json
{
  "success": false,
  "message": "A valid amount is required"
}
```

### 403 Forbidden

```json
{
  "success": false,
  "message": "Only admins can record manual payments"
}
```

### 404 Not Found

```json
{
  "success": false,
  "message": "Treatment not found"
}
```

### 500 Server Error

```json
{
  "success": false,
  "message": "Failed to create online payment order",
  "error": "Actual error message"
}
```

## Suggested Test Order

1. Get ledger
2. Create online order
3. Verify online payment
4. Record manual collection
5. Record manual refund
6. Get ledger again

## File References

- Routes: [route/paymentRoute.js](/E:/easesmith/medico/medico_backend/route/paymentRoute.js:1)
- Controller: [controller/payController.js](/E:/easesmith/medico/medico_backend/controller/payController.js:1)
- Model: [models/paymentModel.js](/E:/easesmith/medico/medico_backend/models/paymentModel.js:1)
