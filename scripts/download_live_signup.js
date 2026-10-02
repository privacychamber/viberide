const ftp = require('basic-ftp');
const client = new ftp.Client();
client.access({
  host: '103.86.176.168',
  user: 'Viberideftp@viberide.in',
  password: '$trong@pa$$'
}).then(() => {
  return client.downloadTo('live_signup.html', '/signup.html');
}).then(() => {
  client.close();
  console.log('Downloaded');
}).catch(err => {
  console.error('FTP Error:', err);
  client.close();
});
