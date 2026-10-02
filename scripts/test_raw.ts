import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function uploadRaw() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    fs.writeFileSync('test_raw.php', '<?php echo "RAW TEST"; ?>');
    await client.uploadFrom("test_raw.php", "/viberide.in/api/auth/register/index.php");
    await client.send('SITE CHMOD 644 /viberide.in/api/auth/register/index.php');
    console.log("Uploaded RAW test to register/index.php");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadRaw();
