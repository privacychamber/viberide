import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function checkRoots() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    
    console.log("Checking public_html:");
    try {
        console.log(await client.list("/public_html"));
    } catch (e) {
        console.log("No public_html");
    }
    
    console.log("Checking htdocs:");
    try {
        console.log(await client.list("/htdocs"));
    } catch (e) {
        console.log("No htdocs");
    }
    
    console.log("Checking root files:");
    console.log(await client.list("/"));
    
  } catch (err) {
    console.error(err);
  }
  client.close();
}
checkRoots();
