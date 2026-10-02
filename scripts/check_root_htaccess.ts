import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function run() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Downloading root .htaccess");
    await client.downloadTo("root_htaccess.txt", "/viberide.in/.htaccess");
    console.log("Downloaded.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
run();
