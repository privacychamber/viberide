import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function uploadTests() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    
    fs.writeFileSync('test1.php', '<?php echo "TEST 1"; ?>');
    await client.uploadFrom("test1.php", "/viberide.in/api/test1.php");
    await client.send('SITE CHMOD 644 /viberide.in/api/test1.php');
    
    fs.writeFileSync('test2.php', '<?php echo "TEST 2"; ?>');
    await client.uploadFrom("test2.php", "/viberide.in/api/auth/test2.php");
    await client.send('SITE CHMOD 644 /viberide.in/api/auth/test2.php');
    
    fs.writeFileSync('test3.php', '<?php echo "TEST 3"; ?>');
    await client.uploadFrom("test3.php", "/viberide.in/api/auth/register/test3.php");
    await client.send('SITE CHMOD 644 /viberide.in/api/auth/register/test3.php');
    
    console.log("Uploaded test files.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadTests();
