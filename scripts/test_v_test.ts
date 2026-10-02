import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as fs from "fs";

dotenv.config({ path: ".env.local" });

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
    
    fs.writeFileSync("v_test.php", "<?php echo 'HELLO V TEST'; ?>");
    await client.uploadFrom("v_test.php", "/viberide.in/api/v_test.php");
    await client.send('SITE CHMOD 644 /viberide.in/api/v_test.php');
    console.log("Upload complete.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadApi();
