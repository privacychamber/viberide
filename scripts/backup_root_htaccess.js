const ftp = require('basic-ftp');
const client = new ftp.Client();
client.access({
  host: '103.86.176.168',
  user: 'Viberideftp@viberide.in',
  password: '$trong@pa$$'
}).then(() => {
  return client.downloadTo('live_root_htaccess_backup.txt', '/.htaccess');
}).then(() => {
  return client.uploadFrom('live_root_htaccess_backup.txt', '/.htaccess.bak');
}).then(() => {
  client.close();
  console.log('Backed up successfully');
}).catch(err => {
  console.error('FTP Error:', err);
  client.close();
});
