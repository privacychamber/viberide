import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function check() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Checking detailed permissions...");
    const files = await client.list("/viberide.in/api");
    for(const f of files) {
      // The basic-ftp FileInfo object has raw permissions in f.raw or f.permissions
      console.log(`Name: ${f.name}, Type: ${f.type}, Perms: ${f.permissions}`);
    }
  } catch (err) {
    console.error(err);
  }
  client.close();
}
check();
