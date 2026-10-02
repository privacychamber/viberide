import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function list() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });

    console.log("Root directory contents:");
    const rootList = await client.list("/");
    console.log(rootList.map(item => `${item.isDirectory ? 'DIR' : 'FILE'} ${item.name}`).join("\n"));

    console.log("\n/viberide.in/api directory contents:");
    const vibList = await client.list("/viberide.in/api");
    console.log(vibList.map(item => `${item.isDirectory ? 'DIR' : 'FILE'} ${item.name}`).join("\n"));

  } catch (err) {
    console.error(err);
  }
  client.close();
}
list();
