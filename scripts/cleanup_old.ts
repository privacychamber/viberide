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
    console.log("Removing conflicting old files...");
    await client.remove("/viberide.in/api/auth/register.php").catch(() => {});
    await client.remove("/viberide.in/api/auth/login.php").catch(() => {});
    console.log("Cleaned up old files.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
fix();
