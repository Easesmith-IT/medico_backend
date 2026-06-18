const fs = require('fs');
try {
  const content = fs.readFileSync('_authenticated_retest_report.json', 'utf8');
  const matches = content.match(/https?:\/\/[a-zA-Z0-9.-]+/g);
  if (matches) {
    console.log('Unique Domains in Test Report:', [...new Set(matches)]);
  } else {
    console.log('No domains found in test report');
  }
} catch (e) {
  console.log('Error reading test report:', e.message);
}
