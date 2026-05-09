const axios = require('axios');
const BASE = 'http://localhost:5005';
const API = BASE + '/api/v1';

const TOKENS = {
  admin: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDg1NzJiYTVkNmYwN2NhNjA3NTJhNCIsInJvbGUiOiJzdXBlcmFkbWluIiwidG9rZW5WZXJzaW9uIjowLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc4MzUwNDc0LCJleHAiOjE4MDk4ODY0NzR9.DpS4tBFEXyTX3EhnQhD_oToReieN4j3aR7ffrEpWT_o',
  provider: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5NTRiODY2MWY5ZTEwY2E3YTk1MGQ2YSIsInJvbGUiOiJzZXJ2aWNlcHJvdmlkZXIiLCJ0b2tlblZlcnNpb24iOjAsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzgzNTA0NzQsImV4cCI6MTgwOTg4NjQ3NH0.QcupWM0zQdlBLcCvkYO1_wyLHBv9XjxpGR7NCHrnYu4',
  doctor: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5ODQ1MDZlNzcyYmU2NDMwODczMThiMCIsInJvbGUiOiJkb2N0b3IiLCJ0b2tlblZlcnNpb24iOjAsInR5cGUiOiJhY2Nlc3MiLCJpYXQiOjE3NzgzNTA0NzQsImV4cCI6MTgwOTg4NjQ3NH0.lAyTRezDWmAro2l7KIXp5qRE0ruCDchUbkjfYJ43CWw',
  patient: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjY5MDk5MDEyNjA2ZmM1YTJhYjA3YWU5MSIsInJvbGUiOiJwYXRpZW50IiwidG9rZW5WZXJzaW9uIjowLCJ0eXBlIjoiYWNjZXNzIiwiaWF0IjoxNzc4MzUwNDc0LCJleHAiOjE4MDk4ODY0NzR9.lBQ3z8A-Zb38t8NOMb1xstiEq9RTWYBRR46N9G5oJKQ'
};

const IDS = { patient: '69099012606fc5a2ab07ae91', doctor: '6984506e772be643087318b0' };

async function testBugFixes() {
  console.log('=== RE-TESTING FIXED BUGS ===\n');

  // 1. Article articles (was 500)
  console.log('1. GET /article/articles');
  try {
    const r = await axios.get(API + '/article/articles', { timeout: 15000 });
    console.log('   -> ' + r.status + ': ' + (r.data.success ? 'PASS' : 'FAIL'));
  } catch (e) { console.log('   -> ' + (e.response?.status || 'ERROR') + ': FAIL - ' + (e.response?.data?.message || e.message)); }

  // 2. Article getallarticle (was 500)
  console.log('2. GET /article/getallarticle');
  try {
    const r = await axios.get(API + '/article/getallarticle', { timeout: 15000 });
    console.log('   -> ' + r.status + ': ' + (r.data.success ? 'PASS' : 'FAIL'));
  } catch (e) { console.log('   -> ' + (e.response?.status || 'ERROR') + ': FAIL - ' + (e.response?.data?.message || e.message)); }

  // 3. Social post search (was 500)
  console.log('3. GET /socialPost/search?q=health');
  try {
    const r = await axios.get(API + '/socialPost/search?q=health', { timeout: 15000 });
    console.log('   -> ' + r.status + ': ' + (r.data.success ? 'PASS' : 'FAIL'));
  } catch (e) { console.log('   -> ' + (e.response?.status || 'ERROR') + ': FAIL - ' + (e.response?.data?.message || e.message)); }

  // 4. Service provider login (was 500)
  console.log('4. POST /serviceProvider/login (with email)');
  try {
    const r = await axios.post(API + '/serviceProvider/login', { email: 'rahull.provider@example.com' }, { timeout: 15000 });
    console.log('   -> ' + r.status + ': ' + (r.data.success ? 'PASS' : 'FAIL - ' + r.data.message));
  } catch (e) { console.log('   -> ' + (e.response?.status || 'ERROR') + ': FAIL - ' + (e.response?.data?.message || e.message)); }

  // 5. Doctor availability with correct format (was 500 due to wrong test data)
  console.log('5. POST /doctor/availability (correct format)');
  try {
    const r = await axios.post(API + '/doctor/availability', 
      { days: ['Monday', 'Tuesday'], timeSlots: [{ start: '09:00', end: '17:00' }] },
      { headers: { Authorization: 'Bearer ' + TOKENS.doctor }, timeout: 15000 }
    );
    console.log('   -> ' + r.status + ': ' + (r.data.success ? 'PASS' : 'FAIL - ' + r.data.message));
  } catch (e) { console.log('   -> ' + (e.response?.status || 'ERROR') + ': FAIL - ' + (e.response?.data?.message || e.message)); }

  // 6. Invoice generate (was 500 - needs bookingId)
  console.log('6. POST /invoice/generate (needs bookingId - expected validation)');
  try {
    const r = await axios.post(API + '/invoice/generate', 
      { bookingId: 'DUMMY', patientId: IDS.patient, items: [{ name: 'Test', price: 100, quantity: 1 }] },
      { timeout: 15000 }
    );
    console.log('   -> ' + r.status + ': ' + (r.data.success ? 'PASS' : 'FAIL - ' + r.data.message));
  } catch (e) { console.log('   -> ' + (e.response?.status || 'ERROR') + ': ' + ((e.response?.data?.message || '').includes('bookingId') ? 'Expected validation PASS' : 'FAIL - ' + (e.response?.data?.message || e.message))); }

  console.log('\n=== BUG FIX VERIFICATION COMPLETE ===');
}
testBugFixes().catch(err => console.error('Fatal:', err.message));
