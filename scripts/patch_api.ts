import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function uploadApi() {
  const client = new ftp.Client();
  try {
    await client.access({
      host: process.env.FTP_HOST,
      user: process.env.FTP_USER,
      password: process.env.FTP_PASSWORD,
      port: 21,
      secure: false,
    });
    
    const remoteApiDir = process.env.FTP_REMOTE_DIR + "/api";
    console.log(`Uploading api directory to ${remoteApiDir}...`);
    const apiDir = path.resolve(process.cwd(), "api");
    await client.ensureDir(remoteApiDir);
    await client.uploadFromDir(apiDir);
    console.log("API Upload complete.");
  } catch (err) {
    console.error(err);
  }
  client.close();
}
uploadApi();
