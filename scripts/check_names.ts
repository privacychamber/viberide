import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function listExact() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    
    console.log("Listing /viberide.in/api:");
    console.log(await client.list("/viberide.in/api"));
    
    console.log("Listing /viberide.in/api/auth:");
    console.log(await client.list("/viberide.in/api/auth"));
    
    console.log("Listing /viberide.in/api/auth/register:");
    console.log(await client.list("/viberide.in/api/auth/register"));
    
  } catch (err) {
    console.error(err);
  }
  client.close();
}
listExact();
