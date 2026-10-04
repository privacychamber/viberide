import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function deploy() {
  const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_PORT = "21", FTP_REMOTE_DIR = "/" } = process.env;
  const client = new ftp.Client();
  try {
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      port: parseInt(FTP_PORT, 10),
      secure: false, 
    });

    const apiDir = path.resolve(process.cwd(), "api");
    if (fs.existsSync(apiDir)) {
        await client.ensureDir(FTP_REMOTE_DIR === '/' ? '/api' : `${FTP_REMOTE_DIR}/api`);
        await client.uploadFromDir(apiDir);
    }
  } catch (err) {
    console.error("FTP Deployment Error:", err);
  } finally {
    client.close();
  }
}
deploy();
