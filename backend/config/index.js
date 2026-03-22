/**
 * Application config from environment and AWS Secrets Manager.
 */
import { getSecrets } from '../lib/secrets.js';

let loadedConfig = null;

export async function loadConfig() {
  if (loadedConfig) return loadedConfig;

  // 1. Load basic env vars first
  const NODE_ENV = process.env.NODE_ENV || 'development';
  const PORT = parseInt(process.env.PORT || '4000', 10);
  const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/upsc-tracker';
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-key';

  // 2. Fetch secrets from AWS Secrets Manager
  const secrets = await getSecrets();

  loadedConfig = {
    env: NODE_ENV,
    isDev: NODE_ENV === 'development',
    isProd: NODE_ENV === 'production',
    port: PORT,
    mongoUri: secrets.MONGO_URI || MONGO_URI,
    jwtSecret: secrets.JWT_SECRET || JWT_SECRET,
    
    // AWS / S3 Config from Secrets Manager
    aws: {
      accessKeyId: secrets.AWS_ACCESS_KEY_ID,
      secretAccessKey: secrets.AWS_SECRET_ACCESS_KEY,
      region: secrets.AWS_REGION || 'ap-south-1',
      s3Bucket: secrets.AWS_S3_BUCKET,
    }
  };

  return loadedConfig;
}

// Keep a static export for backward compatibility where possible, 
// though most things will now need to await loadConfig()
export const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '4000', 10),
  mongoUri: process.env.MONGO_URI,
  jwtSecret: process.env.JWT_SECRET,
};

export default config;
