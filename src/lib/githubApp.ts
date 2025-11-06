import { Octokit } from "@octokit/rest";
import { createAppAuth } from "@octokit/auth-app";

let cachedOctokit: Octokit | null = null;

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} environment variable is required`);
  }
  return value;
}

function parsePositiveInteger(value: string, name: string): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed <= 0) {
    throw new Error(`${name} must be set to a positive integer`);
  }
  return parsed;
}

export async function getInstallationOctokit(): Promise<Octokit> {
  if (cachedOctokit) {
    return cachedOctokit;
  }

  const appIdValue = requireEnv("GITHUB_APP_ID");
  const installationIdValue = requireEnv("GITHUB_APP_INSTALLATION_ID");
  const privateKeyBase64 = requireEnv("GITHUB_APP_PRIVATE_KEY_B64");

  const appId = parsePositiveInteger(appIdValue, "GITHUB_APP_ID");
  const installationId = parsePositiveInteger(
    installationIdValue,
    "GITHUB_APP_INSTALLATION_ID"
  );

  const privateKey = Buffer.from(privateKeyBase64, "base64").toString("utf8");
  if (!privateKey.trim()) {
    throw new Error(
      "GITHUB_APP_PRIVATE_KEY_B64 must decode to a non-empty private key"
    );
  }

  const auth = createAppAuth({
    appId,
    privateKey,
  });

  const { token } = await auth({
    type: "installation",
    installationId,
  });

  cachedOctokit = new Octokit({ auth: token });
  return cachedOctokit;
}

