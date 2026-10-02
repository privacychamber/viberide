import * as ftp from 'basic-ftp';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function run() {
  const client = new ftp.Client();
  await client.access({ host: process.env.FTP_HOST, user: process.env.FTP_USER, password: process.env.FTP_PASSWORD, secure: false });
  await client.remove('/public_html/api/.htaccess').catch(e => console.log('not found'));
  client.close();
}
run();