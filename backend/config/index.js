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
  const MONGO_URI = process.env.MONGO_URI;
  const JWT_SECRET = process.env.JWT_SECRET;

  // 2. Optimization: If we already have the core secrets from Env Vars (like in Vercel/Render), 
  // skip the slow AWS Secrets Manager call to improve performance/UX.
  let secrets = {};
  if (!MONGO_URI || !JWT_SECRET) {
    console.log("Fetching secrets from AWS Secrets Manager...");
    secrets = await getSecrets();
  }

  loadedConfig = {
    env: NODE_ENV,
    isDev: NODE_ENV === 'development',
    isProd: NODE_ENV === 'production',
    port: PORT,
    mongoUri: MONGO_URI || secrets.MONGO_URI || 'mongodb://localhost:27017/upsc-tracker',
    jwtSecret: JWT_SECRET || secrets.JWT_SECRET || 'dev-secret-key',
    
    // AWS / S3 Config from Secrets Manager or direct Env Vars
    aws: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID || secrets.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || secrets.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION || secrets.AWS_REGION || 'ap-south-1',
      s3Bucket: process.env.AWS_S3_BUCKET || secrets.AWS_S3_BUCKET,
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
