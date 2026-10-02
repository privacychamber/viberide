import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkWaf() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Creating /api/auth/foo/test.php...");
    await client.ensureDir("/viberide.in/api/auth/foo");
    fs.writeFileSync('test_foo.php', '<?php echo "FOO"; ?>');
    await client.uploadFrom("test_foo.php", "/viberide.in/api/auth/foo/test.php");
    await client.send('SITE CHMOD 755 /viberide.in/api/auth/foo');
    await client.send('SITE CHMOD 644 /viberide.in/api/auth/foo/test.php');
    console.log("Uploaded foo/test.php");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
checkWaf();
