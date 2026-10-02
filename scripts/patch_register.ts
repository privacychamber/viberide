import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function fix() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Uploading patched register/index.php...");
    await client.uploadFrom("api/auth/register/index.php", "/viberide.in/api/auth/register/index.php");
    console.log("Uploaded.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
fix();
