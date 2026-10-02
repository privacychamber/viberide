import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function uploadApi() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    
    fs.writeFileSync('root_test1.txt', 'This is viberide.in root');
    await client.uploadFrom("root_test1.txt", "/viberide.in/root_test1.txt");

    fs.writeFileSync('root_test2.txt', 'This is public_html root');
    await client.uploadFrom("root_test2.txt", "/public_html/root_test2.txt");

    console.log("Uploads complete.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadApi();
