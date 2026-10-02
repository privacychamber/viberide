import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

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
    
    console.log("Uploading to public_html...");
    const processDir = path.resolve(process.cwd(), "api/process");
    await client.ensureDir("/public_html/api/process");
    await client.uploadFromDir(processDir);
    
    console.log("Setting permissions...");
    await client.send('SITE CHMOD 755 /public_html/api/process/r');
    await client.send('SITE CHMOD 644 /public_html/api/process/r/index.php');
    await client.send('SITE CHMOD 755 /public_html/api/process/l');
    await client.send('SITE CHMOD 644 /public_html/api/process/l/index.php');

    console.log("Upload complete.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadApi();
