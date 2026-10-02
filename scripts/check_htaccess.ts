import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkHtaccess() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Checking for .htaccess...");
    const root = await client.list("/viberide.in");
    console.log("ROOT:", root.filter(f => f.name.includes('htaccess')).map(f => f.name));
    
    const api = await client.list("/viberide.in/api");
    console.log("API:", api.filter(f => f.name.includes('htaccess')).map(f => f.name));
    
    const auth = await client.list("/viberide.in/api/auth");
    console.log("AUTH:", auth.filter(f => f.name.includes('htaccess')).map(f => f.name));
    
    const register = await client.list("/viberide.in/api/auth/register");
    console.log("REGISTER:", register.filter(f => f.name.includes('htaccess')).map(f => f.name));
    
  } catch (err) {
    console.error(err);
  }
  client.close();
}
checkHtaccess();
