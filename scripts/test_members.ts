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
    
    console.log("Creating members/join...");
    await client.ensureDir("/viberide.in/api/members/join");
    await client.uploadFrom("api/auth/register/index.php", "/viberide.in/api/members/join/index.php");

    console.log("Creating members/enter...");
    await client.ensureDir("/viberide.in/api/members/enter");
    await client.uploadFrom("api/auth/login/index.php", "/viberide.in/api/members/enter/index.php");

    console.log("Uploads complete.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadApi();
