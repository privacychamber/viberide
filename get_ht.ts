import * as ftp from 'basic-ftp';
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function run() {
  const client = new ftp.Client();
  await client.access({ host: process.env.FTP_HOST, user: process.env.FTP_USER, password: process.env.FTP_PASSWORD, secure: false });
  await client.downloadTo('downloaded_htaccess.txt', '/public_html/api/.htaccess');
  console.log(fs.readFileSync('downloaded_htaccess.txt', 'utf8'));
  client.close();
}
run();