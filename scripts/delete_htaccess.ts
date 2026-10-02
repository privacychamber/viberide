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
    console.log("Deleting .htaccess on remote server to fix 500 errors...");
    await client.remove("/viberide.in/api/.htaccess");
    console.log("Deleted.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
fix();
