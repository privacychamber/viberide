import * as ftp from "basic-ftp";
import * as dotenv from "dotenv";
import * as path from "path";
import * as fs from "fs";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

async function deploy() {
  const { FTP_HOST, FTP_USER, FTP_PASSWORD, FTP_PORT = "21", FTP_REMOTE_DIR = "/" } = process.env;

  if (!FTP_HOST || !FTP_USER || !FTP_PASSWORD) {
    console.error("Missing FTP credentials.");
    process.exit(1);
  }

  const client = new ftp.Client();
  // client.ftp.verbose = true; // Turn off verbose to reduce noise

  const filesToDeploy = [
    "patch.zip",
    "unzip_patch.php"
  ];

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

    const outDir = path.resolve(process.cwd(), "out");
    
    for (const file of filesToDeploy) {
        const localPath = path.join(outDir, file);
        if (fs.existsSync(localPath)) {
            console.log(`Uploading ${file}...`);
            await client.uploadFrom(localPath, file);
            console.log(`✅ ${file} uploaded.`);
        } else {
            console.warn(`⚠️ ${file} not found locally.`);
        }
    }
    
    console.log("\nSurgical deployment via FTP completed successfully!");
    
  } catch (err) {
    console.error("FTP Deployment Error:", err);
  } finally {
    client.close();
  }
}

deploy();
