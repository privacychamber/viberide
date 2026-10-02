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
    console.log("Listing permissions...");
    const files = await client.list("/viberide.in/api/auth/register");
    for(const f of files) {
      console.log(`${f.name} - ${f.permissions || 'N/A'}`);
    }
    const dirs = await client.list("/viberide.in/api/auth");
    for(const d of dirs) {
      console.log(`[DIR] ${d.name} - ${d.permissions || 'N/A'}`);
    }
  } catch (err) {
    console.error(err);
  }
  client.close();
}
check();
