import { SecretsManagerClient, GetSecretValueCommand } from "@aws-sdk/client-secrets-manager";

const secret_name = "arn:aws:secretsmanager:ap-south-1:051826731408:secret:genymede-admin-54jafY";
const region = "ap-south-1";

const client = new SecretsManagerClient({ region });

export async function getSecrets() {
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
    
    // Binary secrets are not supported in this helper
    throw new Error("Secret is not in string format");
  } catch (error) {
    console.error("Error retrieving secrets from AWS Secrets Manager:", error.message);
    // Return empty object or handle as needed
    return {};
  }
}
