const axios = require('axios');
const fs = require('fs');

const BASE = 'http://localhost:5005';
const API = 'http://localhost:5005/api/v1';

const TOKENS = {
  patient: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDk5MDEyNjA2ZmM1YTJhYjA3YWU5MSIsInJvbGUiOiJwYXRpZW50IiwidG9rZW5WZXJzaW9uIjowLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc4MzUwNDc0LCJleHAiOjE4MDk4ODY0NzR9.lBQ3z8A-Zb38t8NOMb1xstiEq9RTWYBRR46N9G5oJKQ',
  doctor: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODQ1MDZlNzcyYmU2NDMwODczMThiMCIsInJvbGUiOiJkb2N0b3IiLCJ0b2tlblZlcnNpb24iOjAsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzgzNTA0NzQsImV4cCI6MTgwOTg4NjQ3NH0.lAyTRezDWmAro2l7KIXp5qRE0ruCDchUbkjfYJ43CWw',
  admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDg1NzJiYTVkNmYwN2NhNjA3NTJhNCIsInJvbGUiOiJzdXBlcmFkbWluIiwidG9rZW5WZXJzaW9uIjowLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc4MzUwNDc0LCJleHAiOjE4MDk4ODY0NzR9.DpS4tBFEXyTX3EhnQhD_oToReieN4j3aR7ffrEpWT_o',
  provider: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTRiODY2MWY5ZTEwY2E3YTk1MGQ2YSIsInJvbGUiOiJzZXJ2aWNlcHJvdmlkZXIiLCJ0b2tlblZlcnNpb24iOjAsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzgzNTA0NzQsImV4cCI6MTgwOTg4NjQ3NH0.QcupWM0zQdlBLcCvkYO1_wyLHBv9XjxpGR7NCHrnYu4',
  subadmin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDg0YzVjOTI0OGI3NmY0M2NjMjZkNSIsInJvbGUiOiJzdWJhZG1pbiIsInRva2VuVmVyc2lvbiI6MCwidHlwZSI6ImFjY2VzcyIsImlhdCI6MTc3ODM1MDQ3NCwiZXhwIjoxODA5ODg2NDc0fQ.s_T7hBm5cVRHz7dAXwm8DRQdmHeoNUhHTRwI7qU6WI0'
};

const IDS = {
  patient: '69099012606fc5a2ab07ae91',
  doctor: '6984506e772be643087318b0',
  admin: '6908572ba5d6f07ca60752a4',
  provider: '6954b8661f9e10ca7a950d6a',
  subadmin: '69084c5c9248b76f43cc26d5',
  city: '6952d6d57f6785a6601b645b',
  service: '69ff6f91a42b48079782cb4e'
};

const results = [];
const errors = [];
let count = 0;

async function test(method, url, desc, opts = {}) {
  count++;
  const headers = { 'Content-Type': 'application/json' };
  if (opts.token) headers['Authorization'] = 'Bearer ' + opts.token;

  const config = { method, url, headers, timeout: 15000, validateStatus: false };
  if (opts.data) config.data = opts.data;

  const start = Date.now();
  try {
    const res = await axios(config);
    const time = ((Date.now() - start) / 1000).toFixed(2);
    const displayUrl = url.replace(API, '').replace(BASE, '');
    const statusCode = res.status;
    
    let content = '';
    try { content = JSON.stringify(res.data); } catch(e) { content = res.data ? res.data.toString() : ''; }
    
    const entry = {
      '#': count, Category: opts.category || '', Method: method, Endpoint: displayUrl,
      Description: desc, Auth: opts.token ? 'bearer' : 'none',
      StatusCode: statusCode, Status: statusCode < 400 ? 'PASS' : (statusCode < 500 ? 'WARN' : 'FAIL'),
      ResponseTime: time + 's',
      ResponsePreview: content.length > 300 ? content.substring(0, 300) + '...' : content
    };
    if (opts.data) entry.RequestBody = JSON.stringify(opts.data);
    if (statusCode >= 400) {
      entry.Error = content.substring(0, 500);
      errors.push({ '#': count, Category: opts.category, Method: method, Endpoint: displayUrl, StatusCode: statusCode, Error: content.substring(0, 500) });
    }
    results.push(entry);
    console.log('[' + entry.Status + '] ' + method + ' ' + displayUrl + ' -> ' + statusCode + ' (' + time + 's)');
  } catch (err) {
    const time = ((Date.now() - start) / 1000).toFixed(2);
    const displayUrl = url.replace(API, '').replace(BASE, '');
    const statusCode = err.response ? err.response.status : 0;
    const errMsg = err.response ? (JSON.stringify(err.response.data) || err.message) : err.message;
    
    const entry = {
      '#': count, Category: opts.category || '', Method: method, Endpoint: displayUrl,
      Description: desc, Auth: opts.token ? 'bearer' : 'none',
      StatusCode: statusCode || 'NETWORK_ERROR', Status: 'FAIL',
      ResponseTime: time + 's', Error: errMsg.substring(0, 500)
    };
    results.push(entry);
    errors.push({ '#': count, Category: opts.category, Method: method, Endpoint: displayUrl, StatusCode: statusCode || 'NETWORK_ERROR', Error: errMsg.substring(0, 500) });
    console.log('[FAIL] ' + method + ' ' + displayUrl + ' -> ' + (statusCode || 'NETWORK_ERROR') + ' (' + time + 's)');
  }
}

async function run() {
  console.log('\n=== ROOT ENDPOINTS ===');
  await test('GET', BASE + '/', 'Root welcome', { category: 'Root' });
  await test('GET', BASE + '/health', 'Health check', { category: 'Root' });
  await test('GET', BASE + '/api/test-cookies', 'Test cookies', { category: 'Root' });

  console.log('\n=== AUTH ROUTES ===');
  await test('GET', API + '/check-status', 'Auth status check', { category: 'Auth' });

  console.log('\n=== DOCTOR ROUTES - PUBLIC ===');
  await test('GET', API + '/doctor/getAllDoctors', 'Get all doctors', { category: 'Doctor' });
  await test('GET', API + '/doctor/getDoctorById/' + IDS.doctor, 'Get doctor by ID', { category: 'Doctor' });
  await test('GET', API + '/doctor/doctors/city/ahmadabad', 'Get doctors by city name', { category: 'Doctor' });
  await test('GET', API + '/doctor/specialization/General', 'Get doctors by specialization', { category: 'Doctor' });
  await test('POST', API + '/doctor/login', 'Doctor login by email', { category: 'Doctor', data: { email: 'testravi@gmail.com' } });
  await test('POST', API + '/doctor/login', 'Doctor login by phone', { category: 'Doctor', data: { phone: '8707807701' } });
  await test('POST', API + '/doctor/check-auth', 'Doctor check auth', { category: 'Doctor', data: {} });
  await test('GET', API + '/doctor/slots/' + IDS.doctor, 'Get doctor slots', { category: 'Doctor' });
  await test('GET', API + '/doctor/' + IDS.doctor + '/service-availability', 'Get service availability', { category: 'Doctor' });

  console.log('\n=== DOCTOR ROUTES - PROTECTED ===');
  await test('GET', API + '/doctor/getMyProfile', 'Get my profile', { category: 'Doctor', token: TOKENS.doctor });
  await test('PUT', API + '/doctor/updateProfile', 'Update profile', { category: 'Doctor', token: TOKENS.doctor, data: { firstName: 'DrMansiUpdated' } });
  await test('POST', API + '/doctor/logout', 'Doctor logout', { category: 'Doctor', token: TOKENS.doctor });
  await test('POST', API + '/doctor/availability', 'Configure availability', { category: 'Doctor', token: TOKENS.doctor, data: { days: ['Monday', 'Tuesday'], timeSlots: [{ start: '09:00', end: '17:00' }] } });
  await test('GET', API + '/doctor/my-availability', 'Get my availability', { category: 'Doctor', token: TOKENS.doctor });

  console.log('\n=== PATIENT ROUTES - PUBLIC ===');
  await test('POST', API + '/patient/login', 'Patient login by email', { category: 'Patient', data: { email: 'riya.sharma@example.com' } });
  await test('POST', API + '/patient/login', 'Patient login by phone', { category: 'Patient', data: { phone: '9876543219' } });
  await test('POST', API + '/patient/check-auth', 'Patient check auth', { category: 'Patient', data: {} });
  await test('GET', API + '/patient/getById/' + IDS.patient, 'Get patient by ID', { category: 'Patient' });

  console.log('\n=== PATIENT ROUTES - PROTECTED ===');
  await test('GET', API + '/patient/profile', 'Profile', { category: 'Patient', token: TOKENS.patient });
  await test('POST', API + '/patient/logout', 'Logout', { category: 'Patient', token: TOKENS.patient });
  await test('PATCH', API + '/patient/updateProfile/' + IDS.patient, 'Update profile', { category: 'Patient', token: TOKENS.patient, data: { firstName: 'RiyaUpdated' } });
  await test('POST', API + '/patient/allergies', 'Add allergy', { category: 'Patient', token: TOKENS.patient, data: { allergies: ['Dust', 'Pollen'] } });
  await test('DELETE', API + '/patient/allergies', 'Remove allergy', { category: 'Patient', token: TOKENS.patient, data: { allergy: 'Dust' } });
  await test('POST', API + '/patient/medical-history', 'Add medical history', { category: 'Patient', token: TOKENS.patient, data: { conditions: ['Asthma'] } });

  console.log('\n=== ADMIN ROUTES - PUBLIC ===');
  await test('POST', API + '/admin/login', 'Admin login by email', { category: 'Admin', data: { email: 'admin@medico.com' } });
  await test('POST', API + '/admin/login', 'Admin login by phone', { category: 'Admin', data: { phone: '6388966722' } });
  await test('POST', API + '/admin/check-auth', 'Admin check auth', { category: 'Admin', data: {} });
  await test('GET', API + '/admin/services/names', 'Service names', { category: 'Admin' });
  await test('GET', API + '/admin/patients/names', 'Patient names', { category: 'Admin' });
  await test('GET', API + '/admin/service-providers/names', 'Provider names', { category: 'Admin' });

  console.log('\n=== ADMIN ROUTES - PROTECTED ===');
  await test('GET', API + '/admin/me', 'My profile', { category: 'Admin', token: TOKENS.admin });
  await test('GET', API + '/admin/subadmins', 'Subadmins list', { category: 'Admin', token: TOKENS.admin });
  await test('PUT', API + '/admin/updateProfile', 'Update profile', { category: 'Admin', token: TOKENS.admin, data: { firstName: 'MansiUpdated2' } });
  await test('GET', API + '/admin/doctors', 'All doctors', { category: 'Admin', token: TOKENS.admin });
  await test('GET', API + '/admin/doctors/' + IDS.doctor, 'Doctor by ID', { category: 'Admin', token: TOKENS.admin });
  await test('GET', API + '/admin/patients', 'All patients', { category: 'Admin', token: TOKENS.admin });
  await test('GET', API + '/admin/patients/' + IDS.patient, 'Patient by ID', { category: 'Admin', token: TOKENS.admin });
  await test('GET', API + '/admin/reports/dashboard', 'Dashboard stats', { category: 'Admin', token: TOKENS.admin });
  await test('GET', API + '/admin/reports/doctors', 'Doctor stats', { category: 'Admin', token: TOKENS.admin });
  await test('PUT', API + '/admin/doctors/' + IDS.doctor + '/approve', 'Approve doctor', { category: 'Admin', token: TOKENS.admin });
  await test('PUT', API + '/admin/doctors/' + IDS.doctor + '/reject', 'Reject doctor', { category: 'Admin', token: TOKENS.admin });
  await test('PATCH', API + '/admin/doctors/' + IDS.doctor + '/toggle-status', 'Toggle doctor status', { category: 'Admin', token: TOKENS.admin });
  await test('PUT', API + '/admin/patients/' + IDS.patient + '/block', 'Block patient', { category: 'Admin', token: TOKENS.admin, data: { reason: 'Test' } });
  await test('PATCH', API + '/admin/patients/' + IDS.patient + '/toggle-status', 'Toggle patient status', { category: 'Admin', token: TOKENS.admin });
  await test('PATCH', API + '/admin/subadmins/' + IDS.subadmin + '/toggle-status', 'Toggle subadmin', { category: 'Admin', token: TOKENS.admin });
  await test('POST', API + '/admin/logout', 'Admin logout', { category: 'Admin', token: TOKENS.admin });

  console.log('\n=== ADMIN - CREATE DOCTOR/PATIENT ===');
  await test('POST', API + '/admin/doctors/create', 'Create doctor', { category: 'Admin', token: TOKENS.admin, data: { firstName: 'AdminCreated', lastName: 'Doc', email: 'admin.created.doc@example.com', phone: '6666666666' } });
  await test('POST', API + '/admin/patients/create', 'Create patient', { category: 'Admin', token: TOKENS.admin, data: { firstName: 'AdminCreated', lastName: 'Patient', email: 'admin.created.patient@example.com', phone: '5555555555' } });
  await test('GET', API + '/admin/patients/export', 'Export patients', { category: 'Admin', token: TOKENS.admin });

  console.log('\n=== ADMIN - BOOKING MANAGEMENT ===');
  await test('PATCH', API + '/admin/bookings/status/DUMMY', 'Update booking status', { category: 'Admin', token: TOKENS.admin, data: { status: 'confirmed' } });
  await test('GET', API + '/admin/bookings/export', 'Export appointments', { category: 'Admin', token: TOKENS.admin });

  console.log('\n=== ADMIN - DOCTOR CITIES ===');
  await test('GET', API + '/admin/admin/doctor/' + IDS.doctor + '/cities', 'Get doctor cities', { category: 'Admin', token: TOKENS.admin });
  await test('GET', API + '/admin/admin/city/' + IDS.city + '/doctors', 'Doctors by city', { category: 'Admin', token: TOKENS.admin });

  console.log('\n=== ADMIN - EQUIPMENT ===');
  await test('POST', API + '/admin/addEquipments', 'Add equipment', { category: 'Admin', token: TOKENS.admin, data: { name: 'TestEq', description: 'Test', price: 100 } });

  console.log('\n=== CITY ROUTES ===');
  await test('GET', API + '/city/getAllCities', 'Get all cities', { category: 'City' });
  await test('GET', API + '/city/cities/' + IDS.city, 'Get city by ID', { category: 'City' });
  await test('GET', API + '/city/find/by-location?lat=19.076&lng=72.8777', 'Find by location', { category: 'City' });
  await test('PATCH', API + '/city/' + IDS.city + '/toggle', 'Toggle city status', { category: 'City', data: {} });

  console.log('\n=== CITY ROUTES - PROTECTED ===');
  await test('POST', API + '/city/admin/cities', 'Add city', { category: 'City', token: TOKENS.admin, data: { name: 'TestCity', latitude: 19, longitude: 72 } });
  await test('PUT', API + '/city/admin/cities/' + IDS.city, 'Update city', { category: 'City', token: TOKENS.admin, data: { name: 'UpdatedCity' } });
  await test('PATCH', API + '/city/admin/cities/toggle/' + IDS.city, 'Toggle city admin', { category: 'City', token: TOKENS.admin });

  console.log('\n=== SERVICE ROUTES ===');
  await test('GET', API + '/service/getAllServices', 'Get all services', { category: 'Service' });
  await test('GET', API + '/service/search?q=consultation', 'Search services', { category: 'Service' });
  await test('GET', API + '/service/category/consultation', 'By category', { category: 'Service' });
  await test('GET', API + '/service/getServiceById/' + IDS.service, 'Get service by ID', { category: 'Service' });
  await test('GET', API + '/service/city/' + IDS.city, 'By city', { category: 'Service' });
  await test('GET', API + '/service/' + IDS.service + '/price', 'Get price', { category: 'Service' });

  console.log('\n=== BOOKING ROUTES ===');
  await test('GET', API + '/booking/getAllBookings', 'Get all bookings', { category: 'Booking' });

  console.log('\n=== ARTICLE ROUTES ===');
  await test('GET', API + '/article/articles', 'Get all articles', { category: 'Article' });
  await test('GET', API + '/article/getallarticle', 'Get all articles alt', { category: 'Article' });
  await test('GET', API + '/article/doctors/' + IDS.doctor + '/articles', 'By doctor', { category: 'Article' });

  console.log('\n=== SOCIAL POST ROUTES ===');
  await test('GET', API + '/socialPost/getPosts', 'Get all posts', { category: 'SocialPost' });
  await test('GET', API + '/socialPost/feed', 'Get feed', { category: 'SocialPost' });
  await test('GET', API + '/socialPost/search?q=health', 'Search posts', { category: 'SocialPost' });
  await test('GET', API + '/socialPost/follow-stats/me', 'Follow stats (doctor)', { category: 'SocialPost', token: TOKENS.doctor });
  await test('POST', API + '/socialPost/followDoctor', 'Toggle follow', { category: 'SocialPost', token: TOKENS.patient, data: { doctorId: IDS.doctor } });

  console.log('\n=== GEO ROUTES ===');
  await test('POST', API + '/geo/check-location', 'Check location', { category: 'Geo', data: { lat: 19.076, lng: 72.8777 } });

  console.log('\n=== CRASH REPORT ROUTES ===');
  await test('POST', API + '/crash-report/create', 'Create crash report', { category: 'CrashReport', data: { message: 'Test crash', stack: 'Error: test', url: '/api/test' } });
  await test('GET', API + '/crash-report/get', 'Get crash reports', { category: 'CrashReport' });

  console.log('\n=== ITEM ROUTES ===');
  await test('GET', API + '/items/active', 'Active items', { category: 'Item' });
  await test('GET', API + '/items/getAllCategories', 'All categories', { category: 'Item' });
  await test('GET', API + '/items/getItemCategoryById/' + IDS.city, 'Items by category', { category: 'Item' });

  console.log('\n=== INVOICE ROUTES ===');
  await test('POST', API + '/invoice/generate', 'Generate invoice', { category: 'Invoice', data: { patientId: IDS.patient, items: [{ name: 'Consultation', price: 500, quantity: 1 }] } });

  console.log('\n=== SERVICE PROVIDER ROUTES ===');
  await test('POST', API + '/serviceProvider/login', 'Provider login (no password - validation)', { category: 'ServiceProvider', data: { email: 'rahull.provider@example.com' } });
  await test('POST', API + '/serviceProvider/login', 'Provider login (with password)', { category: 'ServiceProvider', data: { email: 'rahull.provider@example.com', password: 'test123' } });
  await test('GET', API + '/serviceProvider/getAllServiceProviders', 'All providers', { category: 'ServiceProvider' });
  await test('GET', API + '/serviceProvider/service-provider/' + IDS.provider, 'Provider by ID', { category: 'ServiceProvider' });
  await test('GET', API + '/serviceProvider/service-providers/by-service/' + IDS.service, 'By service', { category: 'ServiceProvider' });
  await test('GET', API + '/serviceProvider/service-provider/appointments', 'Provider appointments', { category: 'ServiceProvider', token: TOKENS.provider });

  // ========== GENERATE REPORT ==========
  const report = {
    testTimestamp: new Date().toISOString(),
    baseUrl: BASE,
    apiBase: API,
    summary: {
      totalRoutes: count,
      passed: results.filter(r => r.Status === 'PASS').length,
      failed: results.filter(r => r.Status === 'FAIL').length,
      warned: results.filter(r => r.Status === 'WARN').length
    },
    errors: errors,
    results: results
  };

  fs.writeFileSync('_api_full_report.json', JSON.stringify(report, null, 2));

  let md = '# Medico Backend - Full API Test Report\n\n';
  md += '**Date:** ' + new Date().toISOString() + '\n\n';
  md += '## Summary\n\n';
  md += '| Metric | Value |\n|--------|-------|\n';
  md += '| Total Routes | ' + report.summary.totalRoutes + ' |\n';
  md += '| Passed | ' + report.summary.passed + ' |\n';
  md += '| Failed | ' + report.summary.failed + ' |\n';
  md += '| Warning (4xx) | ' + report.summary.warned + ' |\n\n';

  if (errors.length > 0) {
    md += '## Errors & Failures\n\n';
    md += '| # | Category | Method | Endpoint | Code | Error |\n';
    md += '|---|----------|--------|----------|------|-------|\n';
    errors.forEach(e => {
      const errStr = (e.Error || '').replace(/"/g, "'").replace(/\n/g, ' ').substring(0, 150);
      md += '| ' + e['#'] + ' | ' + e.Category + ' | ' + e.Method + ' | ' + e.Endpoint + ' | ' + e.StatusCode + ' | ' + errStr + ' |\n';
    });
    md += '\n';
  }

  md += '## All Route Results\n\n';
  md += '| # | Category | Method | Endpoint | Auth | Code | Status | Time |\n';
  md += '|---|----------|--------|----------|------|------|--------|------|\n';
  results.forEach(r => {
    md += '| ' + r['#'] + ' | ' + r.Category + ' | ' + r.Method + ' | ' + r.Endpoint + ' | ' + r.Auth + ' | ' + r.StatusCode + ' | ' + r.Status + ' | ' + r.ResponseTime + ' |\n';
  });

  fs.writeFileSync('_api_full_report.md', md);

  console.log('\n========================================');
  console.log('TEST SUMMARY');
  console.log('========================================');
  console.log('Total Routes: ' + report.summary.totalRoutes);
  console.log('Passed: ' + report.summary.passed);
  console.log('Failed: ' + report.summary.failed);
  console.log('Warnings: ' + report.summary.warned);
  console.log('\nReports saved to _api_full_report.json and _api_full_report.md');
}

run().catch(err => { console.error('FATAL:', err.message); process.exit(1); });
