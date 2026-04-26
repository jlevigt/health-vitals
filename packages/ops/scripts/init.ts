import {
  S3Client,
  CreateBucketCommand,
  HeadBucketCommand,
  PutBucketCorsCommand,
} from "@aws-sdk/client-s3";
import { Buckets, env } from "@health-vitals/infra";

async function initStorage() {
  const endpoint = env.STORAGE_ENDPOINT;
  const region = env.STORAGE_REGION;
  const accessKeyId = env.STORAGE_ACCESS_KEY;
  const secretAccessKey = env.STORAGE_SECRET_KEY;

  console.log(`🔌 Connecting to storage at ${endpoint}...`);

  const s3 = new S3Client({
    endpoint,
    region,
    credentials: {
      accessKeyId,
      secretAccessKey,
    },
    forcePathStyle: true,
  });

  const bucketName = Buckets.UPLOADS;

  try {
    // 1. Check if bucket exists
    try {
      await s3.send(new HeadBucketCommand({ Bucket: bucketName }));
      console.log(`✅ Bucket '${bucketName}' already exists.`);
    } catch (error: any) {
      if (error.name === "NotFound" || error.$metadata?.httpStatusCode === 404) {
        // 2. Create bucket
        console.log(`🛠️ Creating bucket '${bucketName}'...`);
        await s3.send(new CreateBucketCommand({ Bucket: bucketName }));
        console.log(`✅ Bucket '${bucketName}' created.`);
      } else {
        throw error;
      }
    }

    // 3. Set CORS policy
    try {
      console.log(`🔐 Setting CORS policy for '${bucketName}'...`);
      await s3.send(
        new PutBucketCorsCommand({
          Bucket: bucketName,
          CORSConfiguration: {
            CORSRules: [
              {
                AllowedHeaders: ["*"],
                AllowedMethods: ["PUT", "POST", "GET", "HEAD"],
                AllowedOrigins: ["*"],
                ExposeHeaders: ["ETag"],
                MaxAgeSeconds: 3000,
              },
            ],
          },
        })
      );
      console.log(`✅ CORS policy set.`);
    } catch (corsError: any) {
      if (corsError.name === "NotImplemented") {
        console.log(
          `ℹ️ CORS policy not supported by this storage provider (NotImplemented). ` +
            `Ensure CORS is handled by the server environment (e.g., MINIO_API_CORS_ALLOW_ORIGIN).`
        );
      } else {
        console.warn(
          `⚠️ Warning: Failed to set CORS policy. Client uploads might fail if running in browser.\n` +
            `Message: ${corsError.message}`
        );
      }
    }
  } catch (error) {
    console.error("❌ Error initializing storage:", error);
    process.exit(1);
  }
}

initStorage();
