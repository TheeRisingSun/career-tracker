import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secret_name = process.env.AWS_SECRETS_ARN;
const region = process.env.AWS_REGION || "ap-south-1";

const client = new SecretsManagerClient({ region });

export async function getSecrets() {
  // If we're on Vercel/Render and already have our main secrets, or if we don't have an ARN, skip this entirely
  if ((process.env.MONGO_URI && process.env.JWT_SECRET) || !secret_name) {
    return {};
  }

  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT",
      })
    );

    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    
    throw new Error("Secret is not in string format");
  } catch (error) {
    // Only log error in development to avoid noisy production logs if we don't need AWS
    if (process.env.NODE_ENV !== 'production' && secret_name) {
      console.error("Error retrieving secrets from AWS Secrets Manager:", error.message);
    }
    return {};
  }
}
