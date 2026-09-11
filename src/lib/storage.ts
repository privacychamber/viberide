import path from "path";
import fs from "fs";
import { writeFile, mkdir, readFile } from "fs/promises";
import crypto from "crypto";

export type AssetCategory = "vehicle" | "kyc" | "document";

export interface UploadResult {
  url: string;
  filename: string;
  isPrivate: boolean;
}

export interface PrivateAssetResult {
  type: "buffer" | "redirect";
  buffer?: Buffer;
  mimeType?: string;
  redirectUrl?: string;
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
// Cloudinary Storage Driver (Zero-dependency signed API)
// -------------------------------------------------------------
export class CloudinaryStorageDriver implements IStorageDriver {
  private cloudName: string;
  private apiKey: string;
  private apiSecret: string;

  constructor(cloudName: string, apiKey: string, apiSecret: string) {
    this.cloudName = cloudName;
    this.apiKey = apiKey;
    this.apiSecret = apiSecret;
  }

  async uploadFile(params: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    category: AssetCategory;
    userId: string;
  }): Promise<UploadResult> {
    const isPrivate = params.category === "kyc" || params.category === "document";
    const timestamp = Math.floor(Date.now() / 1000);
    const folder = isPrivate ? `viberide/${params.category}` : "viberide/vehicles";
    const publicId = `${params.userId}_${Date.now()}_${path.parse(params.filename).name}`;

    // Prepare parameters for signed upload
    const signParams: Record<string, string> = {
      folder,
      public_id: publicId,
      timestamp: timestamp.toString(),
    };

    if (isPrivate) {
      signParams.type = "authenticated";
    }

    // Sort keys alphabetically for Cloudinary signature
    const sortedKeys = Object.keys(signParams).sort();
    const stringToSign = sortedKeys.map((k) => `${k}=${signParams[k]}`).join("&") + this.apiSecret;
    const signature = crypto.createHash("sha1").update(stringToSign).digest("hex");

    // Build form data
    const formData = new FormData();
    const base64Data = `data:${params.mimeType};base64,${params.buffer.toString("base64")}`;
    formData.append("file", base64Data);
    formData.append("api_key", this.apiKey);
    formData.append("timestamp", timestamp.toString());
    formData.append("folder", folder);
    formData.append("public_id", publicId);
    formData.append("signature", signature);

    if (isPrivate) {
      formData.append("type", "authenticated");
    }

    const endpoint = `https://api.cloudinary.com/v1_1/${this.cloudName}/auto/upload`;
    const response = await fetch(endpoint, {
      method: "POST",
      body: formData,
    });

    if (!response.ok) {
      const errText = await response.text();
      console.error("Cloudinary upload failed:", errText);
      throw new Error("Failed to upload file to cloud storage.");
    }

    const json = (await response.json()) as { secure_url: string; public_id: string; format?: string };

    if (isPrivate) {
      // Return authenticated proxy URL for private documents
      const safeFilename = `${encodeURIComponent(json.public_id)}.${json.format || "pdf"}`;
      return {
        url: `/api/documents/${safeFilename}`,
        filename: safeFilename,
        isPrivate: true,
      };
    }

    return {
      url: json.secure_url,
      filename: publicId,
      isPrivate: false,
    };
  }

  async getPrivateDocument(filename: string): Promise<PrivateAssetResult | null> {
    // Generate short-lived signed Cloudinary URL (valid for 5 minutes)
    const expiresAt = Math.floor(Date.now() / 1000) + 300;
    const publicId = decodeURIComponent(filename.replace(/\.[^/.]+$/, ""));
    const toSign = `public_id=${publicId}&timestamp=${expiresAt}${this.apiSecret}`;
    const signature = crypto.createHash("sha1").update(toSign).digest("hex");

    const signedUrl = `https://res.cloudinary.com/${this.cloudName}/image/authenticated/s--${signature.slice(0, 8)}--/v1/${publicId}`;

    return {
      type: "redirect",
      redirectUrl: signedUrl,
    };
  }
}

// -------------------------------------------------------------
// Local Storage Driver (Secure Development & Offline Fallback)
// -------------------------------------------------------------
export class LocalStorageDriver implements IStorageDriver {
  private publicDir: string;
  private privateDir: string;

  constructor() {
    this.publicDir = path.join(process.cwd(), "public", "uploads");
    this.privateDir = path.join(process.cwd(), ".private_uploads");
  }

  async uploadFile(params: {
    buffer: Buffer;
    filename: string;
    mimeType: string;
    category: AssetCategory;
    userId: string;
  }): Promise<UploadResult> {
    const isPrivate = params.category === "kyc" || params.category === "document";
    const targetDir = isPrivate ? this.privateDir : this.publicDir;

    await mkdir(targetDir, { recursive: true });
    const filepath = path.join(targetDir, params.filename);
    await writeFile(filepath, params.buffer);

    if (isPrivate) {
      // Private documents are routed through the authenticated /api/documents endpoint
      return {
        url: `/api/documents/${params.filename}`,
        filename: params.filename,
        isPrivate: true,
      };
    }

    // Public vehicle images are served directly from /uploads/
    return {
      url: `/uploads/${params.filename}`,
      filename: params.filename,
      isPrivate: false,
    };
  }

  async getPrivateDocument(filename: string): Promise<PrivateAssetResult | null> {
    // Path traversal check
    const sanitized = path.basename(filename);
    const filepath = path.join(this.privateDir, sanitized);

    if (!fs.existsSync(filepath)) {
      // Also check fallback to public/uploads in case it was uploaded prior to Phase 2
      const fallbackPublicPath = path.join(this.publicDir, sanitized);
      if (fs.existsSync(fallbackPublicPath)) {
        const buffer = await readFile(fallbackPublicPath);
        return {
          type: "buffer",
          buffer,
          mimeType: this.guessMimeType(sanitized),
        };
      }
      return null;
    }

    const buffer = await readFile(filepath);
    return {
      type: "buffer",
      buffer,
      mimeType: this.guessMimeType(sanitized),
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
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  const apiSecret = process.env.CLOUDINARY_API_SECRET;

  if (cloudName && apiKey && apiSecret) {
    return new CloudinaryStorageDriver(cloudName, apiKey, apiSecret);
  }

  return new LocalStorageDriver();
}
