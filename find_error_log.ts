import * as ftp from 'basic-ftp';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
async function run() {
  const client = new ftp.Client();
  await client.access({ host: process.env.FTP_HOST, user: process.env.FTP_USER, password: process.env.FTP_PASSWORD, secure: false });
  console.log("Looking for error_log in public_html...");
  const list1 = await client.list('/public_html');
  console.log(list1.filter(f => f.name.includes('error')));
  console.log("Looking for error_log in public_html/api...");
  const list2 = await client.list('/public_html/api');
  console.log(list2.filter(f => f.name.includes('error')));
  console.log("Looking for error_log in public_html/api/process/r...");
  const list3 = await client.list('/public_html/api/process/r');
  console.log(list3.filter(f => f.name.includes('error')));
  client.close();
}
run();