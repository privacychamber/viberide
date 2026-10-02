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
    
    console.log("Replacing signup with hello...");
    fs.writeFileSync('signup_test.php', '<?php echo "HELLO SIGNUP"; ?>');
    await client.uploadFrom("signup_test.php", "/viberide.in/api/auth/signup/index.php");
    console.log("Upload complete.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadApi();
