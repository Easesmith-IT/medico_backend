const axios = require('axios');
const dotenv = require('dotenv');

dotenv.config();

async function runUploadTest() {
  try {
    console.log("Sending mock multipart/form-data upload request to local server...");
    
    // Create a dummy file buffer using FormData
    // Since we are running in Node, we can build a simple Form-data payload using standard format or 'form-data' package
    // Wait, axios 1.x supports native FormData or plain object with blob. Since we have standard boundaries, we can use Form-data package if installed, or craft a manual boundary request:
    
    const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
    const filename = 'test_health_report.pdf';
    const content = '%PDF-1.4 ... mock pdf content ...';
    
    let payload = '';
    payload += `--${boundary}\r\n`;
    payload += `Content-Disposition: form-data; name="file"; filename="${filename}"\r\n`;
    payload += 'Content-Type: application/pdf\r\n\r\n';
    payload += content + '\r\n';
    payload += `--${boundary}--\r\n`;

    const response = await axios.post('http://localhost:5005/api/v1/uploadfile/upload', payload, {
      headers: {
        'Content-Type': `multipart/form-data; boundary=${boundary}`
      }
    });

    console.log("Response status:", response.status);
    console.log("Response data:", response.data);
    
    if (response.data.success && response.data.fileName === filename && typeof response.data.fileSize === 'number') {
      console.log("✅ UPLOAD TEST PASSED!");
    } else {
      console.log("❌ UPLOAD TEST FAILED: Response fields did not match expected values.");
    }
  } catch (error) {
    console.error("❌ Upload test failed with error:", error.response ? error.response.data : error.message);
  }
}

runUploadTest();
