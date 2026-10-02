import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function list() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Checking for error_log...");
    const files = await client.list("/viberide.in/api");
    for (const f of files) {
      if (f.name === 'error_log') {
        console.log("Found error_log! Downloading...");
        await client.downloadTo("api/error_log", "/viberide.in/api/error_log");
        console.log("Downloaded.");
      }
    }
  } catch (err) {
    console.error(err);
  }
  client.close();
}
list();
