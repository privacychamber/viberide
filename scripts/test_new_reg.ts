import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkNewReg() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Creating /public_html/api/auth/new_reg/test.php...");
    await client.ensureDir("/public_html/api/auth/new_reg");
    fs.writeFileSync('test_new_reg.php', '<?php echo "NEW REG"; ?>');
    await client.uploadFrom("test_new_reg.php", "/public_html/api/auth/new_reg/test.php");
    await client.send('SITE CHMOD 755 /public_html/api/auth/new_reg');
    await client.send('SITE CHMOD 644 /public_html/api/auth/new_reg/test.php');
    console.log("Uploaded new_reg/test.php");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
checkNewReg();
