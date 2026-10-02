const https = require('https');

https.get('https://api.mail.tm/domains', (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(data));
}).on('error', (err) => {
  console.log('Error: ' + err.message);
});
