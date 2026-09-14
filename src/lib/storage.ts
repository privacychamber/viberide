import path from "path";
import fs from "fs";
import { writeFile, mkdir } from "fs/promises";
import crypto from "crypto";

export type AssetCategory = "vehicle" | "kyc" | "document";

export interface UploadResult {
  url: string;
  filename: string;
  isPrivate: boolean;
}

export interface PrivateAssetResult {
  type: "stream" | "buffer"; // buffer for fallback legacy, stream for optimal delivery
  stream?: NodeJS.ReadableStream;
  buffer?: Buffer;
  mimeType?: string;
}

export interface IStorageDriver {
  uploadFile(params: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    category: AssetCategory;
    userId: string;
  }): Promise<UploadResult>;

  getPrivateDocument(filename: string): Promise<PrivateAssetResult | null>;
}

// -------------------------------------------------------------
// Local Persistent Storage Driver (cPanel / Standalone Node)
// -------------------------------------------------------------
export class LocalPersistentStorageDriver implements IStorageDriver {
  private publicDir: string;
  private privateDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), "public", "uploads", "vehicles");
    // CRITICAL: .private_kyc is explicitly outside the public web root
    this.privateDir = path.join(process.cwd(), ".private_kyc");

    this.verifyStorageAccess();
  }

  /**
   * Fail-Safe: Verify storage paths are writable on initialization.
   * If this fails in production, the application will refuse to start
   * rather than silently failing to store KYC or saving it insecurely.
   */
  private verifyStorageAccess() {
    try {
      if (!fs.existsSync(this.publicDir)) {
        fs.mkdirSync(this.publicDir, { recursive: true });
      }
      if (!fs.existsSync(this.privateDir)) {
        fs.mkdirSync(this.privateDir, { recursive: true });
      }

      // Test write access (this throws if read-only or permission denied)
      fs.accessSync(this.publicDir, fs.constants.W_OK);
      fs.accessSync(this.privateDir, fs.constants.W_OK);
    } catch (error) {
      if (process.env.NODE_ENV === "production") {
        console.error("FATAL: Cannot write to persistent storage directories. Please verify cPanel permissions.");
        console.error("Public Dir:", this.publicDir);
        console.error("Private Dir:", this.privateDir);
        throw new Error("STORAGE ACCESS DENIED IN PRODUCTION.");
      } else {
        console.warn("WARN: Cannot write to storage directories. Uploads will fail.");
      }
    }
  }

  async uploadFile(params: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    category: AssetCategory;
    userId: string;
  }): Promise<UploadResult> {
    const isPrivate = params.category === "kyc" || params.category === "document";
    const ext = path.extname(params.filename).toLowerCase();
    const uniqueId = crypto.randomUUID();
    
    // Server-side object keys securely namespaced
    const objectKey = isPrivate 
      ? `${params.userId}/${uniqueId}${ext}`
      : `${params.userId}/${uniqueId}${ext}`;
      
    const targetDir = isPrivate ? this.privateDir : this.publicDir;
    const filepath = path.join(targetDir, objectKey);
    
    // Ensure nested user directories exist
    await mkdir(path.dirname(filepath), { recursive: true });
    await writeFile(filepath, params.buffer);

    if (isPrivate) {
      // Return safe internal proxy URL
      return {
        url: `/api/documents/kyc/${encodeURIComponent(objectKey)}`,
        filename: objectKey,
        isPrivate: true,
      };
    }

    // Public vehicles fallback
    return {
      url: `/uploads/vehicles/${objectKey}`,
      filename: objectKey,
      isPrivate: false,
    };
  }

  async getPrivateDocument(objectKey: string): Promise<PrivateAssetResult | null> {
    // Path traversal check
    if (objectKey.includes("..") || path.isAbsolute(objectKey)) {
        return null;
    }
    
    const filepath = path.join(this.privateDir, objectKey);

    if (!fs.existsSync(filepath)) {
      return null;
    }

    // Use streams to avoid buffering large files into memory
    const stream = fs.createReadStream(filepath);
    return {
      type: "stream",
      stream,
      mimeType: this.guessMimeType(objectKey),
    };
  }

  private guessMimeType(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
    if (ext === ".pdf") return "application/pdf";
    if (ext === ".png") return "image/png";
    if (ext === ".webp") return "image/webp";
    return "image/jpeg";
  }
}

// -------------------------------------------------------------
// Storage Factory
// -------------------------------------------------------------
export function getStorageDriver(): IStorageDriver {
  return new LocalPersistentStorageDriver();
}
