import { S3Client, ListObjectsV2Command, GetObjectCommand } from "@aws-sdk/client-s3";
import * as fs from "fs";
import * as path from "path";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });

// User must provide these in .env.local or terminal
const BUCKET_NAME = process.env.AWS_S3_BUCKET_NAME || "your-bucket-name";
const REGION = process.env.AWS_REGION || "us-east-1"; // Or ap-northeast-1, etc.
const PREFIX = process.env.AWS_S3_PREFIX || ""; // e.g., "backups/2026-02/" (leave empty for root)
const DOWNLOAD_DIR = path.resolve(process.cwd(), "ihotel_backup");

// Ensure download directory exists
if (!fs.existsSync(DOWNLOAD_DIR)) {
  fs.mkdirSync(DOWNLOAD_DIR, { recursive: true });
}

// Ensure credentials exist
if (!process.env.AWS_ACCESS_KEY_ID || !process.env.AWS_SECRET_ACCESS_KEY) {
    console.error("❌ Error: Missing AWS credentials in .env.local");
    console.error("Please add AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY to your .env.local file.");
    process.exit(1);
}

const s3Client = new S3Client({ region: REGION });

async function downloadS3Folder(bucket: string, prefix: string, localDir: string) {
  try {
    let isTruncated = true;
    let continuationToken: string | undefined = undefined;
    let totalFiles = 0;

    console.log(`🔍 Scanning bucket: ${bucket}, prefix: ${prefix || '(root)'}...`);

    while (isTruncated) {
      const listCommand = new ListObjectsV2Command({
        Bucket: bucket,
        Prefix: prefix,
        ContinuationToken: continuationToken,
      });

      const response = await s3Client.send(listCommand);

      if (!response.Contents || response.Contents.length === 0) {
        console.log("No files found matching the prefix.");
        return;
      }

      for (const item of response.Contents) {
        if (!item.Key) continue;
        
        // Skip directories in S3 (they often end with / and have size 0)
        if (item.Key.endsWith("/")) continue;

        const relativePath = prefix ? item.Key.replace(prefix, "") : item.Key;
        const localFilePath = path.join(localDir, relativePath);

        // Ensure subdirectories exist locally
        const fileDir = path.dirname(localFilePath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        console.log(`⬇️  Downloading: ${item.Key} -> ${localFilePath}`);

        const getObjectCommand = new GetObjectCommand({
          Bucket: bucket,
          Key: item.Key,
        });

        const data = await s3Client.send(getObjectCommand);

        if (data.Body) {
             // Use pipeline to stream the data to a file
             await new Promise((resolve, reject) => {
                const writeStream = fs.createWriteStream(localFilePath);
                if (data.Body instanceof require('stream').Readable) {
                     data.Body.pipe(writeStream)
                     .on('error', reject)
                     .on('close', resolve);
                } else {
                     reject(new Error("Unknown stream type"));
                }
             });
        }
        totalFiles++;
      }

      isTruncated = response.IsTruncated || false;
      continuationToken = response.NextContinuationToken;
    }

    console.log(`\n✅ Download complete! Downloaded ${totalFiles} files to ${localDir}`);

  } catch (error) {
    console.error("❌ Error downloading from S3:", error);
  }
}

// Run the download
downloadS3Folder(BUCKET_NAME, PREFIX, DOWNLOAD_DIR);
