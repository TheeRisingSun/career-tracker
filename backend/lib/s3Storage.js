import { S3Client, PutObjectCommand, GetObjectCommand, ListObjectsV2Command, DeleteObjectCommand } from "@aws-sdk/client-s3";
import { Upload } from "@aws-sdk/lib-storage";
import { loadConfig } from "../config/index.js";

async function getS3Client() {
  const config = await loadConfig();
  if (!config.aws.accessKeyId || !config.aws.secretAccessKey) {
    throw new Error("AWS credentials not found in configuration (Secrets Manager)");
  }
  return new S3Client({
    region: config.aws.region,
    credentials: {
      accessKeyId: config.aws.accessKeyId,
      secretAccessKey: config.aws.secretAccessKey,
    },
  });
}

export async function uploadToS3(key, buffer, contentType) {
  const config = await loadConfig();
  const client = await getS3Client();
  
  const upload = new Upload({
    client,
    params: {
      Bucket: config.aws.s3Bucket,
      Key: key,
      Body: buffer,
      ContentType: contentType,
    },
  });

  return upload.done();
}

export async function downloadFromS3(key) {
  const config = await loadConfig();
  const client = await getS3Client();
  
  const response = await client.send(
    new GetObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
    })
  );

  return response.Body; // Returns a stream
}

export async function listS3Objects(prefix) {
  const config = await loadConfig();
  const client = await getS3Client();
  
  const response = await client.send(
    new ListObjectsV2Command({
      Bucket: config.aws.s3Bucket,
      Prefix: prefix,
    })
  );

  return response.Contents || [];
}

export async function deleteFromS3(key) {
  const config = await loadConfig();
  const client = await getS3Client();
  
  return client.send(
    new DeleteObjectCommand({
      Bucket: config.aws.s3Bucket,
      Key: key,
    })
  );
}
