const https = require('https');

https.get('http://localhost:3001/api/lookups', (res) => {
  let data = '';
  res.on('data', chunk => data += chunk);
  res.on('end', () => {
    console.log('Status:', res.statusCode);
    console.log('Response:', data.substring(0, 500));
  });
}).on('error', (err) => {
  console.log('Error:', err.message);
});