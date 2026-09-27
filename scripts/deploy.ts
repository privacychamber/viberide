import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function deploy() {
  const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_PORT = "21", FTP_REMOTE_DIR = "/" } = process.env;

  if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
    console.error("Missing FTP credentials. Please ensure FTP_HOST, FTP_USER, and FTP_PASSWORD are set in .env.local.");
    process.exit(1);
  }

  const client = new ftp.Client();
  client.ftp.verbose = true;

  try {
    console.log("Connecting to FTP server...");
    await client.access({
      host: FTP_HOST,
      user: FTP_USER,
      password: FTP_PASSWORD,
      port: parseInt(FTP_PORT, 10),
      secure: false, 
    });

    console.log(`Connected. Navigating to ${FTP_REMOTE_DIR}...`);
    await client.ensureDir(FTP_REMOTE_DIR);

    // Upload 'out' directory contents directly to the remote root
    const outDir = path.resolve(process.cwd(), "out");
    if (fs.existsSync(outDir)) {
        console.log(`Uploading contents of /out to remote root...`);
        await client.uploadFromDir(outDir);
    } else {
        console.error("The /out directory doesn't exist. Did you run 'npm run build'?");
    }

    // Upload 'api' directory to remote /api
    const apiDir = path.resolve(process.cwd(), "api");
    if (fs.existsSync(apiDir)) {
        console.log(`Uploading /api directory to remote /api...`);
        await client.ensureDir(FTP_REMOTE_DIR === '/' ? '/api' : `${FTP_REMOTE_DIR}/api`);
        await client.uploadFromDir(apiDir);
    }

    console.log("\nDeployment via FTP completed successfully!");
    
  } catch (err) {
    console.error("FTP Deployment Error:", err);
  } finally {
    client.close();
  }
}

deploy();
