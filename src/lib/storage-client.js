// S3-compatible operations shared by the app and maintenance scripts.
// Existing MinIO buckets, keys, credentials and public URLs remain compatible.
const { S3Client, PutObjectCommand, GetObjectCommand, HeadObjectCommand,
  DeleteObjectCommand, HeadBucketCommand, CreateBucketCommand, PutBucketPolicyCommand } = require('@aws-sdk/client-s3');

class Client {
  constructor({ endPoint, port, useSSL, accessKey, secretKey }) {
    this.s3 = new S3Client({
      endpoint: `${useSSL ? 'https' : 'http'}://${endPoint}:${port}`,
      region: process.env.MINIO_REGION || 'us-east-1', forcePathStyle: true,
      credentials: { accessKeyId: accessKey, secretAccessKey: secretKey },
    });
  }
  async putObject(bucket, key, body, length, metadata) {
    return this.s3.send(new PutObjectCommand({ Bucket: bucket, Key: key, Body: body, ContentLength: length, ContentType: metadata['Content-Type'] }));
  }
  async statObject(bucket, key) {
    const result = await this.s3.send(new HeadObjectCommand({ Bucket: bucket, Key: key }));
    return { metaData: { 'content-type': result.ContentType || 'application/octet-stream' } };
  }
  async getObject(bucket, key) {
    const result = await this.s3.send(new GetObjectCommand({ Bucket: bucket, Key: key }));
    if (!result.Body) throw new Error('Empty object body');
    return result.Body;
  }
  async removeObject(bucket, key) {
    await this.s3.send(new DeleteObjectCommand({ Bucket: bucket, Key: key }));
  }
  async bucketExists(bucket) {
    try { await this.s3.send(new HeadBucketCommand({ Bucket: bucket })); return true; }
    catch (error) { if (error.$metadata?.httpStatusCode === 404) return false; throw error; }
  }
  async makeBucket(bucket) {
    await this.s3.send(new CreateBucketCommand({ Bucket: bucket }));
  }
  async setBucketPolicy(bucket, policy) {
    await this.s3.send(new PutBucketPolicyCommand({ Bucket: bucket, Policy: policy }));
  }
}
module.exports = { Client };
