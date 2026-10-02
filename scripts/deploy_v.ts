import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function fix() {
  const client = new ftp.Client();
  client.ftp.verbose = true;
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Creating remote folder and uploading v/index.php...");
    await client.ensureDir("/viberide.in/api/process/v");
    await client.uploadFrom("api/process/v/index.php", "/viberide.in/api/process/v/index.php");
    console.log("Uploaded.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
fix();
