# Comprehensive API Test Script for Medico Backend
$baseUrl = "http://localhost:5005"
$apiBase = "$baseUrl/api/v1"

# Tokens (generated from DB)
$patientToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDk5MDEyNjA2ZmM1YTJhYjA3YWU5MSIsInJvbGUiOiJwYXRpZW50IiwidG9rZW5WZXJzaW9uIjowLCJpYXQiOjE3NzgzNTAyMDUsImV4cCI6MTc3ODQzNjYwNX0.29514xMV-Vg0LbDKX_mH296ANqJRX5Y_s7r5kQiyR24"
$doctorToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODZlNDMxY2NkY2RkYzc4ZDk0YjViZiIsInJvbGUiOiJkb2N0b3IiLCJ0b2tlblZlcnNpb24iOjAsImlhdCI6MTc3ODM1MDIwNSwiZXhwIjoxNzc4NDM2NjA1fQ.OgJqQJbWqEn2rOTPsIUudRUKC0rDVDnzqasy65h0_nw"
$adminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDg1NzJiYTVkNmYwN2NhNjA3NTJhNCIsInJvbGUiOiJzdXBlckFkbWluIiwidG9rZW5WZXJzaW9uIjowLCJpYXQiOjE3NzgzNTAyMDUsImV4cCI6MTc3ODQzNjYwNX0.yU-3ZCG-Em1V5JdUfgIMLLbCq0yirFbKRpuc28H8oBM"
$providerToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTRiODY2MWY5ZTEwY2E3YTk1MGQ2YSIsInJvbGUiOiJzZXJ2aWNlcHJvdmlkZXIiLCJ0b2tlblZlcnNpb24iOjAsImlhdCI6MTc3ODM1MDIwNSwiZXhwIjoxNzc4NDM2NjA1fQ.pokvLBtoED4hpJv2_uH9uqflLLNMYYRaSGsnsumazAA"
$subAdminToken = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDg0YzVjOTI0OGI3NmY0M2NjMjZkNSIsInJvbGUiOiJzdWJBZG1pbiIsInRva2VuVmVyc2lvbiI6MCwibmFtZSI6IlZpdmVrIiwiaWF0IjoxNzc4MzUwMjA1LCJleHAiOjE3Nzg0MzY2MDV9.4DBbG-YlQht9k7jKLCpWxQC5sF3ov5j6Kh_UJcOHS24"

$patientId = "69099012606fc5a2ab07ae91"
$doctorId = "6986e431ccdcddc78d94b5bf"
$adminId = "6908572ba5d6f07ca60752a4"
$providerId = "6954b8661f9e10ca7a950d6a"
$subAdminId = "69084c5c9248b76f43cc26d5"

$results = @()
$errors = @()
$routeCount = 0
$passCount = 0
$failCount = 0

function Invoke-ApiTest {
    param(
        [string]$method = "GET",
        [string]$endpoint,
        [string]$category,
        [string]$description,
        [object]$body = $null,
        [string]$token = $null,
        [int]$expectedStatus = 200,
        [string]$authType = "none" # none, bearer, cookie
    )
    
    $routeCount++
    $url = "$apiBase$endpoint"
    $headers = @{}
    $cookies = @{}
    
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }
    
    $params = @{
        Uri = $url
        Method = $method
        Headers = $headers
        UseBasicParsing = $true
        ContentType = "application/json"
    }
    
    if ($body) {
        $bodyJson = $body | ConvertTo-Json -Depth 10 -Compress
        $params["Body"] = $bodyJson
    }
    
    $startTime = Get-Date
    
    try {
        if ($method -eq "GET" -or $method -eq "DELETE") {
            $response = Invoke-WebRequest @params -TimeoutSec 20
        } else {
            $response = Invoke-WebRequest @params -TimeoutSec 20
        }
        
        $elapsed = (Get-Date) - $startTime
        $statusCode = [int]$response.StatusCode
        $content = $response.Content
        
        if ($content.Length -gt 500) {
            $displayContent = $content.Substring(0, 500) + "... [truncated]"
        } else {
            $displayContent = $content
        }
        
        $entry = @{
            "#" = $routeCount
            "Category" = $category
            "Method" = $method
            "Endpoint" = $endpoint
            "Description" = $description
            "Auth" = $authType
            "StatusCode" = $statusCode
            "Status" = if ($statusCode -eq $expectedStatus) { "PASS" } else { "WARN (expected $expectedStatus)" }
            "ResponseTime" = "$($elapsed.TotalSeconds.ToString('0.00'))s"
            "ResponsePreview" = $displayContent
        }
        
        if ($body) {
            $entry["RequestBody"] = ($body | ConvertTo-Json -Depth 10 -Compress)
        }
        
        if ($statusCode -ge 200 -and $statusCode -lt 500) {
            $passCount++
        } else {
            $failCount++
        }
        
        $results += $entry
        
        if ($statusCode -ge 400) {
            $errors += @{
                "#" = $routeCount
                "Category" = $category
                "Method" = $method
                "Endpoint" = $endpoint
                "StatusCode" = $statusCode
                "Error" = $content
            }
        }
        
        Write-Host "[$($entry.Status)] $method $endpoint -> $statusCode ($($elapsed.TotalSeconds.ToString('0.00'))s)"
        
    } catch {
        $elapsed = (Get-Date) - $startTime
        $statusCode = 0
        $errorMsg = $_.Exception.Message
        
        $entry = @{
            "#" = $routeCount
            "Category" = $category
            "Method" = $method
            "Endpoint" = $endpoint
            "Description" = $description
            "Auth" = $authType
            "StatusCode" = "ERROR"
            "Status" = "FAIL"
            "ResponseTime" = "$($elapsed.TotalSeconds.ToString('0.00'))s"
            "Error" = $errorMsg
        }
        
        $failCount++
        $results += $entry
        
        $errors += @{
            "#" = $routeCount
            "Category" = $category
            "Method" = $method
            "Endpoint" = $endpoint
            "StatusCode" = "ERROR"
            "Error" = $errorMsg
        }
        
        Write-Host "[FAIL] $method $endpoint -> ERROR: $errorMsg" -ForegroundColor Red
    }
}

Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "   MEDICO BACKEND - FULL API TEST SUITE" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host ""

# ============================================================
# SECTION: SERVER ROOT ENDPOINTS
# ============================================================
Write-Host "`n=== SERVER ROOT ENDPOINTS ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "" -category "Root" -description "Root welcome" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/health" -category "Root" -description "Health check" -authType "none" -expectedStatus 200 -baseOverride "$baseUrl"
# Override for /health since it's not under /api/v1
$routeCount--
$url2 = "$baseUrl/health"
try {
    $resp2 = Invoke-WebRequest -Uri $url2 -UseBasicParsing -TimeoutSec 10
    $passCount++
    Write-Host "[PASS] GET /health -> $($resp2.StatusCode)"
} catch {
    $failCount++
    Write-Host "[FAIL] GET /health -> ERROR: $($_.Exception.Message)" -ForegroundColor Red
}

# ============================================================
# SECTION: AUTH ROUTES
# ============================================================
Write-Host "`n=== AUTH ROUTES ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/check-status" -category "Auth" -description "Check auth status (no token)" -authType "none"

# ============================================================
# SECTION: DOCTOR ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== DOCTOR ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/doctor/getAllDoctors" -category "Doctor" -description "Get all doctors" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/doctor/getDoctorById/$doctorId" -category "Doctor" -description "Get doctor by ID" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/doctor/doctors/city/ahmadabad" -category "Doctor" -description "Get doctors by city name" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/doctor/specialization/General" -category "Doctor" -description "Get doctors by specialization" -authType "none"
Invoke-ApiTest -method "POST" -endpoint "/doctor/signup" -category "Doctor" -description "Doctor signup" -authType "none" -body @{firstName="Test";lastName="Doctor";email="test.api.doctor@example.com";phone="9999999999";password="Test@123"} -expectedStatus 201
Invoke-ApiTest -method "POST" -endpoint "/doctor/login" -category "Doctor" -description "Doctor login (email)" -authType "none" -body @{email="testravi@gmail.com"} -expectedStatus 200
Invoke-ApiTest -method "POST" -endpoint "/doctor/login" -category "Doctor" -description "Doctor login (phone)" -authType "none" -body @{phone="8707807701"} -expectedStatus 200
Invoke-ApiTest -method "POST" -endpoint "/doctor/check-auth" -category "Doctor" -description "Doctor check auth" -authType "none" -body @{}

# ============================================================
# SECTION: DOCTOR ROUTES - PROTECTED
# ============================================================
Write-Host "`n=== DOCTOR ROUTES (PROTECTED) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/doctor/getMyProfile" -category "Doctor" -description "Doctor get my profile" -authType "bearer" -token $doctorToken
Invoke-ApiTest -method "PUT" -endpoint "/doctor/updateProfile" -category "Doctor" -description "Doctor update profile" -authType "bearer" -token $doctorToken -body @{firstName="Ravi Updated"}
Invoke-ApiTest -method "POST" -endpoint "/doctor/logout" -category "Doctor" -description "Doctor logout" -authType "bearer" -token $doctorToken
Invoke-ApiTest -method "GET" -endpoint "/doctor/slots/$doctorId" -category "Doctor" -description "Get doctor available slots" -authType "none"
Invoke-ApiTest -method "POST" -endpoint "/doctor/availability" -category "Doctor" -description "Configure availability" -authType "bearer" -token $doctorToken -body @{availability=@(@{day="Monday";startTime="09:00";endTime="17:00"})}
Invoke-ApiTest -method "GET" -endpoint "/doctor/my-availability" -category "Doctor" -description "Get my availability" -authType "bearer" -token $doctorToken
Invoke-ApiTest -method "GET" -endpoint "/doctor/$doctorId/service-availability" -category "Doctor" -description "Get service availability" -authType "none"

# ============================================================
# SECTION: PATIENT ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== PATIENT ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "POST" -endpoint "/patient/signup" -category "Patient" -description "Patient signup" -authType "none" -body @{firstName="TestApi";lastName="Patient";email="test.api.patient@example.com";phone="8888888888"} -expectedStatus 201
Invoke-ApiTest -method "POST" -endpoint "/patient/login" -category "Patient" -description "Patient login (email)" -authType "none" -body @{email="riya.sharma@example.com"}
Invoke-ApiTest -method "POST" -endpoint "/patient/login" -category "Patient" -description "Patient login (phone)" -authType "none" -body @{phone="9876543219"}
Invoke-ApiTest -method "POST" -endpoint "/patient/check-auth" -category "Patient" -description "Patient check auth" -authType "none" -body @{}

# ============================================================
# SECTION: PATIENT ROUTES - PROTECTED
# ============================================================
Write-Host "`n=== PATIENT ROUTES (PROTECTED) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/patient/profile" -category "Patient" -description "Patient get profile" -authType "bearer" -token $patientToken
Invoke-ApiTest -method "GET" -endpoint "/patient/getById/$patientId" -category "Patient" -description "Get patient by ID" -authType "none"
Invoke-ApiTest -method "POST" -endpoint "/patient/logout" -category "Patient" -description "Patient logout" -authType "bearer" -token $patientToken
Invoke-ApiTest -method "PATCH" -endpoint "/patient/updateProfile/$patientId" -category "Patient" -description "Patient update profile" -authType "bearer" -token $patientToken -body @{firstName="RiyaUpdated"}
Invoke-ApiTest -method "POST" -endpoint "/patient/allergies" -category "Patient" -description "Patient add allergy" -authType "bearer" -token $patientToken -body @{allergies=@("Dust","Pollen")}
Invoke-ApiTest -method "DELETE" -endpoint "/patient/allergies" -category "Patient" -description "Patient remove allergy" -authType "bearer" -token $patientToken -body @{allergy="Dust"}

# ============================================================
# SECTION: ADMIN ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== ADMIN ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "POST" -endpoint "/admin/signup" -category "Admin" -description "Admin signup" -authType "none" -body @{firstName="TestAdmin";lastName="Api";email="test.admin.api@example.com";phone="7777777777"} -expectedStatus 201
Invoke-ApiTest -method "POST" -endpoint "/admin/login" -category "Admin" -description "Admin login (email)" -authType "none" -body @{email="admin@medico.com"}
Invoke-ApiTest -method "POST" -endpoint "/admin/login" -category "Admin" -description "Admin login (phone)" -authType "none" -body @{phone="6388966722"}
Invoke-ApiTest -method "POST" -endpoint "/admin/check-auth" -category "Admin" -description "Admin check auth" -authType "none" -body @{}

# ============================================================
# SECTION: ADMIN ROUTES - PROTECTED (superAdmin)
# ============================================================
Write-Host "`n=== ADMIN ROUTES (PROTECTED - superAdmin) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/admin/me" -category "Admin" -description "Admin get my profile" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/subadmins" -category "Admin" -description "Get subadmins list" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "PUT" -endpoint "/admin/updateProfile" -category "Admin" -description "Admin update profile" -authType "bearer" -token $adminToken -body @{firstName="MansiUpdated"}
Invoke-ApiTest -method "GET" -endpoint "/admin/doctors" -category "Admin" -description "Admin get all doctors" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/doctors/$doctorId" -category "Admin" -description "Admin get doctor by ID" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/patients" -category "Admin" -description "Admin get all patients" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/patients/$patientId" -category "Admin" -description "Admin get patient by ID" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/reports/dashboard" -category "Admin" -description "Admin dashboard stats" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/reports/doctors" -category "Admin" -description "Admin doctor stats" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/services/names" -category "Admin" -description "Admin get service names" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/patients/names" -category "Admin" -description "Admin get patient names" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "GET" -endpoint "/admin/service-providers/names" -category "Admin" -description "Admin get provider names" -authType "bearer" -token $adminToken
Invoke-ApiTest -method "POST" -endpoint "/admin/logout" -category "Admin" -description "Admin logout" -authType "bearer" -token $adminToken

# ============================================================
# SECTION: CITY ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== CITY ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/city/getAllCities" -category "City" -description "Get all cities" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/city/cities/6952d6d57f6785a6601b645b" -category "City" -description "Get city by ID" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/city/find/by-location?lat=19.076&lng=72.8777" -category "City" -description "Find city by location" -authType "none"

# ============================================================
# SECTION: SERVICE ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== SERVICE ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/service/getAllServices" -category "Service" -description "Get all services" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/service/search?q=consultation" -category "Service" -description "Search services" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/service/category/consultation" -category "Service" -description "Get services by category" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/service/nursing/home" -category "Service" -description "Get nursing services by type" -authType "none"

# ============================================================
# SECTION: BOOKING ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== BOOKING ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/booking/getAllBookings" -category "Booking" -description "Get all bookings" -authType "none"

# ============================================================
# SECTION: ARTICLE ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== ARTICLE ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/article/articles" -category "Article" -description "Get all articles" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/article/getallarticle" -category "Article" -description "Get all articles (alt)" -authType "none"

# ============================================================
# SECTION: SOCIAL POST ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== SOCIAL POST ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/socialPost/getPosts" -category "SocialPost" -description "Get all posts" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/socialPost/feed" -category "SocialPost" -description "Get social feed" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/socialPost/search?q=health" -category "SocialPost" -description "Search social posts" -authType "none"

# ============================================================
# SECTION: GEO ROUTES
# ============================================================
Write-Host "`n=== GEO ROUTES ===" -ForegroundColor Yellow

Invoke-ApiTest -method "POST" -endpoint "/geo/check-location" -category "Geo" -description "Check address in polygon" -authType "none" -body @{latitude=19.076;longitude=72.8777}

# ============================================================
# SECTION: CRASH REPORT ROUTES
# ============================================================
Write-Host "`n=== CRASH REPORT ROUTES ===" -ForegroundColor Yellow

Invoke-ApiTest -method "POST" -endpoint "/crash-report/create" -category "CrashReport" -description "Create crash report" -authType "none" -body @{message="Test crash report from API test";stack="Error: test error";url="/api/test"}
Invoke-ApiTest -method "GET" -endpoint "/crash-report/get" -category "CrashReport" -description "Get all crash reports" -authType "none"

# ============================================================
# SECTION: ITEM CATEGORY ROUTES - PUBLIC
# ============================================================
Write-Host "`n=== ITEM CATEGORY ROUTES (PUBLIC) ===" -ForegroundColor Yellow

Invoke-ApiTest -method "GET" -endpoint "/items/active" -category "Item" -description "Get active categories" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/items/getAllCategories" -category "Item" -description "Get all categories" -authType "none"

# ============================================================
# SECTION: INVOICE ROUTES
# ============================================================
Write-Host "`n=== INVOICE ROUTES ===" -ForegroundColor Yellow

Invoke-ApiTest -method "POST" -endpoint "/invoice/generate" -category "Invoice" -description "Generate invoice" -authType "none" -body @{patientId=$patientId;items=@(@{name="Consultation";price=500;quantity=1})}

# ============================================================
# SECTION: PAYMENT ROUTES
# ============================================================
Write-Host "`n=== PAYMENT ROUTES ===" -ForegroundColor Yellow

# Get a treatment ID first
try {
    $treatmentsResp = Invoke-WebRequest -Uri "$apiBase/booking/getAllBookings" -UseBasicParsing -TimeoutSec 10
    $treatmentsData = $treatmentsResp.Content | ConvertFrom-Json
    Write-Host "[INFO] Fetched bookings for treatment IDs"
} catch {
    Write-Host "[INFO] Could not fetch treatments"
}

# ============================================================
# SECTION: SERVICE PROVIDER ROUTES
# ============================================================
Write-Host "`n=== SERVICE PROVIDER ROUTES ===" -ForegroundColor Yellow

Invoke-ApiTest -method "POST" -endpoint "/serviceProvider/login" -category "ServiceProvider" -description "Provider login (email)" -authType "none" -body @{email="rahull.provider@example.com"}
Invoke-ApiTest -method "GET" -endpoint "/serviceProvider/getAllServiceProviders" -category "ServiceProvider" -description "Get all providers" -authType "none"
Invoke-ApiTest -method "GET" -endpoint "/serviceProvider/service-provider/$providerId" -category "ServiceProvider" -description "Get provider by ID" -authType "none"

# ============================================================
# GENERATE REPORT
# ============================================================
Write-Host "`n==========================================" -ForegroundColor Cyan
Write-Host "   TEST SUMMARY" -ForegroundColor Cyan
Write-Host "==========================================" -ForegroundColor Cyan
Write-Host "Total Routes Tested: $routeCount"
Write-Host "Passed: $passCount"
Write-Host "Failed: $failCount"
Write-Host ""

$report = @{
    "testTimestamp" = (Get-Date -Format "yyyy-MM-dd HH:mm:ss")
    "baseUrl" = $baseUrl
    "apiBase" = $apiBase
    "summary" = @{
        "totalRoutes" = $routeCount
        "passed" = $passCount
        "failed" = $failCount
    }
    "errors" = $errors
    "results" = $results
}

$report | ConvertTo-Json -Depth 10 | Out-File -FilePath "E:\easesmith\medico\medico_backend\_api_test_report.json" -Encoding utf8

# Generate a readable markdown report
$md = @"
# Medico Backend - API Test Report

**Date:** $(Get-Date -Format "yyyy-MM-dd HH:mm:ss")
**Base URL:** $baseUrl
**API Base:** $apiBase

## Summary
| Metric | Value |
|--------|-------|
| Total Routes Tested | $routeCount |
| Passed | $passCount |
| Failed | $failCount |

"@

if ($errors.Count -gt 0) {
    $md += "`n## Errors / Failures`n`n"
    $md += "| # | Category | Method | Endpoint | Status | Error |`n"
    $md += "|---|----------|--------|----------|--------|-------|`n"
    foreach ($e in $errors) {
        $errPreview = ($e.Error -replace '"', "'").Substring(0, [Math]::Min(100, $e.Error.Length))
        $md += "| $($e.'#') | $($e.Category) | $($e.Method) | $($e.Endpoint) | $($e.StatusCode) | $errPreview |`n"
    }
}

$md += "`n## All Route Results`n`n"
$md += "| # | Category | Method | Endpoint | Auth | Status | Response Time |`n"
$md += "|---|----------|--------|----------|------|--------|---------------|`n"

foreach ($r in $results) {
    $status = if ($r.StatusCode -eq "ERROR") { "💥 ERROR" } else { "$($r.StatusCode)" }
    $md += "| $($r.'#') | $($r.Category) | $($r.Method) | $($r.Endpoint) | $($r.Auth) | $status | $($r.ResponseTime) |`n"
}

$md | Out-File -FilePath "E:\easesmith\medico\medico_backend\_api_test_report.md" -Encoding utf8

Write-Host "Report saved to _api_test_report.json and _api_test_report.md" -ForegroundColor Green
Write-Host ""
Write-Host "If there are errors, check _api_test_report.md for details" -ForegroundColor Yellow
