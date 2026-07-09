require("dotenv").config({ quiet: true });

const Minio = require("minio");

const bucketName = "products";

const client = new Minio.Client({
  endPoint: process.env.MINIO_ENDPOINT || "127.0.0.1",
  port: Number(process.env.MINIO_PORT || process.env.MINIO_API_PORT || 9000),
  useSSL: false,
  accessKey: process.env.MINIO_ACCESS_KEY || process.env.MINIO_ROOT_USER,
  secretKey: process.env.MINIO_SECRET_KEY || process.env.MINIO_ROOT_PASSWORD,
});

const downloadPolicy = {
  Version: "2012-10-17",
  Statement: [
    {
      Effect: "Allow",
      Principal: { AWS: ["*"] },
      Action: ["s3:GetObject"],
      Resource: [`arn:aws:s3:::${bucketName}/*`],
    },
  ],
};

async function main() {
  const exists = await client.bucketExists(bucketName);

  if (!exists) {
    await client.makeBucket(bucketName);
    console.log(`Created MinIO bucket: ${bucketName}`);
  } else {
    console.log(`MinIO bucket already exists: ${bucketName}`);
  }

  await client.setBucketPolicy(bucketName, JSON.stringify(downloadPolicy));
  console.log(`Public download policy is ready: ${bucketName}`);
}

main().catch((error) => {
  console.error("MinIO initialization failed:", error.message);
  process.exit(1);
});
