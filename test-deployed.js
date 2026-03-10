import http from 'http';
import https from 'https';

const data = JSON.stringify({
  url: 'https://www.nvidia.com/gtc/',
  language: 'zh'
});

const req = https.request({
  hostname: 'ais-dev-pftg4go5x2yu7ajnaqmrsr-152995178683.europe-west1.run.app',
  port: 443,
  path: '/api/process',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': data.length
  }
}, (res) => {
  let body = '';
  res.on('data', (chunk) => body += chunk);
  res.on('end', () => console.log('Response:', res.statusCode, body));
});

req.on('error', (e) => console.error('Error:', e));
req.write(data);
req.end();
