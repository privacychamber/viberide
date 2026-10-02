const ftp = require('basic-ftp');

async function downloadEnv() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: '103.86.176.168',
      user: 'Viberideftp@viberide.in',
      password: '$trong@pa$$'
    });
    console.log('Connected to FTP');
    await client.downloadTo('live_env.txt', '/.env');
    console.log('Downloaded .env');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.close();
  }
}

downloadEnv();
