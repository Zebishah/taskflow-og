interface Environment {
  apiUrl: string;
}

function getRequiredEnvironmentVariable(
  name: keyof ImportMetaEnv,
): string {
  const value = import.meta.env[name];

  if (!value || value.trim().length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export const environment: Environment = {
  apiUrl: getRequiredEnvironmentVariable('VITE_API_URL'),
};
