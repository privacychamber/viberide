import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkFoo() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Creating /api/foo/test.php...");
    await client.ensureDir("/viberide.in/api/foo");
    fs.writeFileSync('test_foo2.php', '<?php echo "FOO2"; ?>');
    await client.uploadFrom("test_foo2.php", "/viberide.in/api/foo/test.php");
    await client.send('SITE CHMOD 755 /viberide.in/api/foo');
    await client.send('SITE CHMOD 644 /viberide.in/api/foo/test.php');
    console.log("Uploaded api/foo/test.php");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
checkFoo();
