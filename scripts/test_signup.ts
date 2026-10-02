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
    
    console.log("Renaming register to signup via FTP...");
    await client.ensureDir("/viberide.in/api/auth/signup");
    await client.uploadFrom("api/auth/register/index.php", "/viberide.in/api/auth/signup/index.php");
    console.log("Signup Upload complete.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadApi();
