import { Readable } from 'node:stream';
export class Client {
  constructor(options: { endPoint: string; port: number; useSSL: boolean; accessKey: string; secretKey: string });
  putObject(bucket: string, key: string, body: Buffer, length: number, metadata: Record<string, string>): Promise<unknown>;
  statObject(bucket: string, key: string): Promise<{ metaData: Record<string, string> }>;
  getObject(bucket: string, key: string): Promise<Readable>;
  removeObject(bucket: string, key: string): Promise<void>;
  bucketExists(bucket: string): Promise<boolean>;
  makeBucket(bucket: string): Promise<void>;
  setBucketPolicy(bucket: string, policy: string): Promise<void>;
}
