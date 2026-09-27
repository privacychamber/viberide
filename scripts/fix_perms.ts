import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function fixPerms() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    console.log("Fixing permissions...");
    
    async function fixDir(dir: string) {
      console.log(`Setting 755 on ${dir}`);
      await client.send(`SITE CHMOD 755 ${dir}`).catch(e => console.log(e.message));
      
      const items = await client.list(dir);
      for(const item of items) {
        if(item.isDirectory) {
          await fixDir(`${dir}/${item.name}`);
        } else {
          console.log(`Setting 644 on ${dir}/${item.name}`);
          await client.send(`SITE CHMOD 644 ${dir}/${item.name}`).catch(e => console.log(e.message));
        }
      }
    }
    
    const remoteDir = process.env.FTP_REMOTE_DIR || "/viberide.in";
    await fixDir(`${remoteDir}/api`);
    
    console.log("Permissions fixed.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
fixPerms();
