# Medico Platform SRS (Consolidated)

Source: `C:\Users\kunal\Downloads\Medico app SRS.pdf` (27 pages)

## 1. Product Scope
The platform includes three connected products:
- Doctor App (mobile)
- Patient App (mobile)
- Admin Panel (web)

Shared goals:
- Secure onboarding and authentication
- Appointment lifecycle management
- Medical record handling
- Payment, settlement, refund, and receipts
- Notifications and auditability

## 2. Actors and Access Levels
- Doctor (verified): full doctor features
- Junior Doctor / Student: limited doctor features
- Patient / Public user: patient app features
- Admin: verification, moderation, dispute handling, analytics, system controls

## 3. Suggested Tech Direction (from SRS)
- Frontend: Flutter (Doctor/Patient apps)
- Backend: Node.js + Express.js
- Data: PostgreSQL (structured), MongoDB (social/research)
- Auth: Firebase/Auth0 (+ OTP/Google options)
- Cloud: Microsoft Azure
- Real-time: Socket.io

## 4. Doctor App Requirements
### 4.1 Authentication & Verification
- Sign-up via email/mobile
- Strong password policy
- Mandatory credential uploads (license, degree, ID)
- Admin verification states: Pending / Approved / Rejected
- MFA/2FA support
- Profile edit audit trail

### 4.2 Doctor Profile
- Personal details: name, photo, DOB, gender, contact, address
- Professional details: registration number, council, specialization, experience, fees
- Education details and document uploads
- Verification indicators and compliance reminders

### 4.3 Clinic/Hospital Management
- Multi-clinic support per doctor
- Clinic details: name, address, contacts
- Per-day operating hours and exceptions
- Location support (map tagging)
- Clinic-level services and payment methods

### 4.4 Appointment Management
- Slot setup per clinic and weekday
- Accept / reject / reschedule / cancel flows
- Pending/upcoming/completed dashboard views
- Post-appointment uploads: prescription, notes, reports
- Automated reminders and notifications

### 4.5 Doctor Social / Research / Messaging
- Post formats: text, images, video, articles
- Follow, like, comment, save
- Research paper upload and metadata
- Threaded academic discussion
- Doctor-to-doctor secure messaging with media sharing
- Moderation queue for flagged content

### 4.6 Payments
- Gateway + QR support
- Transaction logs with invoice/receipt generation
- Settlement request workflow
- Refund workflow with audit trail
- Financial dashboard and exportable reports

## 5. Patient App Requirements
### 5.1 Registration & Profile
- Account creation with personal details
- Email/OTP and Google auth options
- Profile edits and optional medical history
- Emergency contact support

### 5.2 Doctor Discovery
- Search by specialization, location, availability, rating
- View detailed doctor and clinic profiles

### 5.3 Appointment Booking
- Select doctor and slot
- Optional reason for visit
- Booking status starts as Pending
- Reschedule/cancel from patient dashboard
- Pre-visit reminders and post-visit record access

### 5.4 Medical Records
- Access prescriptions/reports/case documents
- Filtered and chronological listing
- Secure sharing options with selected doctors
- New upload notifications

### 5.5 Payments & Reviews
- UPI, cards, net banking, QR payments
- Payment status and digital receipts
- Payment history and refund tracking
- Post-appointment doctor/clinic ratings and reviews

### 5.6 Help Center
- FAQ module
- Support ticket creation and status tracking
- Email/phone support (no in-app chat)

### 5.7 Patient-Side Social Engagement
- Follow doctors
- Personalized feed from followed doctors
- Like and save posts
- Patient restrictions: no external sharing/comments in this module

## 6. Admin Panel (Web) Requirements
### 6.1 Verification & User Governance
- Doctor/clinic registration review and approval
- Search/filter queues for pending approvals
- Credential review and rejection feedback loop

### 6.2 Moderation
- Review flagged doctor posts and research content
- Moderate content quality and policy violations

### 6.3 Payment & Dispute Operations
- Manage settlement approvals
- Handle dispute/refund requests
- Track pending/completed/failed transactions

### 6.4 Analytics & Reporting
- Engagement metrics
- Appointment trends and operational KPIs
- Financial summaries and dispute insights
- Exportable reports

### 6.5 Security & Administration
- Multi-tier role-based admin access
- Full admin action logging (audit trails)
- System health/alerts monitoring (Azure integrated)

## 7. Non-Functional Requirements
### 7.1 Security
- Encryption at rest and in transit
- Strong authentication and authorization
- Sensitive data protection for personal/medical/payment information

### 7.2 Performance
- Target response: 2-3 seconds for typical interactions
- Scalable architecture and load-balanced infrastructure

### 7.3 Usability
- Intuitive UI for mixed technical users
- Accessibility support
- Localization/multi-language support

### 7.4 Reliability & Availability
- High availability target (~99.9% uptime)
- Backup and disaster recovery
- Continuous monitoring and alerting

## 8. Delivery Phasing (SRS-aligned)
1. Development and integration testing
2. Beta rollout with selected users
3. Production launch
4. Ongoing maintenance and security updates

## 9. Admin-Panel-First Build Priority
1. Doctor/clinic verification module
2. Appointment and payment operational dashboards
3. Settlement/refund/dispute console
4. Moderation center (posts/research)
5. RBAC + admin audit logs + reporting exports

---
This markdown is a normalized implementation reference derived from the SRS PDF.
