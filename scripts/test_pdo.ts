import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function upload() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    fs.writeFileSync('test_pdo.php', '<?php if(class_exists("PDO")) echo "PDO is enabled"; else echo "PDO is MISSING"; ?>');
    await client.uploadFrom("test_pdo.php", "/viberide.in/api/test_pdo.php");
    console.log("Uploaded test_pdo.php.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
upload();
