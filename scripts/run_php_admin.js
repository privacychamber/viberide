const ftp = require('basic-ftp');

async function uploadAndRun() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: '103.86.176.168',
      user: 'Viberideftp@viberide.in',
      password: '$trong@pa$$'
    });
    console.log('Connected to FTP');
    await client.uploadFrom('create_superadmin.php', '/create_superadmin.php');
    console.log('Uploaded create_superadmin.php');
    
    // Make HTTP request to execute the script
    const res = await fetch('http://viberide.in/create_superadmin.php');
    const text = await res.text();
    console.log('Response:', text);
    
    // Clean up
    await client.remove('/create_superadmin.php');
    console.log('Removed create_superadmin.php');
  } catch (err) {
    console.error('Error:', err);
  } finally {
    client.close();
  }
}

uploadAndRun();
