/**
 * env.ts
 *
 * Centralised, type-safe access to every environment variable declared in
 * .env.example.  Import `env` wherever you need a variable instead of
 * accessing `process.env` directly.
 *
 * Validation runs once at module-load time and throws a descriptive error
 * listing every missing/invalid variable so you can fix them all at once.
 */

function get(key: string): string | undefined {
  return process.env[key];
}

function requireString(key: string, errors: string[]): string {
  const value = get(key);
  if (!value || value.trim() === "") {
    errors.push(`  • ${key} is required but was not set`);
    return "";
  }
  return value.trim();
}

function optionalString(key: string, defaultValue = ""): string {
  return get(key)?.trim() || defaultValue;
}

function requireUrl(key: string, errors: string[]): string {
  const value = get(key)?.trim();
  if (!value || value === "") {
    errors.push(`  • ${key} is required but was not set`);
    return "";
  }
  try {
    new URL(value);
  } catch {
    errors.push(`  • ${key} must be a valid URL (got "${value}")`);
  }
  return value;
}

function parseDuration(value: string): string {
  if (/^(\d+)(s|m|h|d)?$/.test(value.trim())) return value.trim();
  return value.trim();
}

function requireDuration(key: string, errors: string[]): string {
  const raw = get(key);
  if (!raw || raw.trim() === "") {
    errors.push(`  • ${key} is required but was not set`);
    return "";
  }
  return parseDuration(raw);
}

function validate() {
  const errors: string[] = [];

  const PORT = optionalString("PORT", "3000");
  const portNum = parseInt(PORT, 10);
  if (isNaN(portNum) || portNum <= 0 || portNum > 65535) {
    errors.push(`  • PORT must be a valid port number (got "${PORT}")`);
  }

  const DATABASE_URL = requireString("DATABASE_URL", errors);

  const BCRYPT_ROUNDS_RAW = optionalString("BCRYPT_ROUNDS", "10");
  const BCRYPT_ROUNDS = parseInt(BCRYPT_ROUNDS_RAW, 10);
  if (isNaN(BCRYPT_ROUNDS) || BCRYPT_ROUNDS < 4 || BCRYPT_ROUNDS > 31) {
    errors.push(
      `  • BCRYPT_ROUNDS must be an integer between 4 and 31 (got "${BCRYPT_ROUNDS_RAW}")`,
    );
  }

  const NEXTAUTH_URL = requireUrl("NEXTAUTH_URL", errors);
  const NEXTAUTH_SECRET = requireString("NEXTAUTH_SECRET", errors);

  const JWT_SECRET = requireString("JWT_SECRET", errors);
  const JWT_EXPIRES_IN = requireDuration("JWT_EXPIRES_IN", errors);
  const JWT_REFRESH_SECRET = requireString("JWT_REFRESH_SECRET", errors);
  const JWT_REFRESH_EXPIRES_IN = requireDuration(
    "JWT_REFRESH_EXPIRES_IN",
    errors,
  );

  const GOOGLE_CLIENT_ID = requireString("GOOGLE_CLIENT_ID", errors);
  const GOOGLE_CLIENT_SECRET = requireString("GOOGLE_CLIENT_SECRET", errors);
  const GOOGLE_CALLBACK_URL = requireUrl("GOOGLE_CALLBACK_URL", errors);

  // ── GitHub OAuth ──────────────────────────────────────────────────────────
  const GITHUB_CLIENT_ID = requireString("GITHUB_CLIENT_ID", errors);
  const GITHUB_CLIENT_SECRET = requireString("GITHUB_CLIENT_SECRET", errors);
  const GITHUB_CALLBACK_URL = requireUrl("GITHUB_CALLBACK_URL", errors);

  if (errors.length > 0) {
    throw new Error(
      `\n\n❌  Missing or invalid environment variables:\n\n${errors.join("\n")}\n\n` +
        `Copy .env.example → .env.local and fill in the missing values.\n`,
    );
  }

  return {
    PORT: portNum,
    DATABASE_URL,
    BCRYPT_ROUNDS,

    NEXTAUTH_URL,
    NEXTAUTH_SECRET,

    JWT_SECRET,
    JWT_EXPIRES_IN,
    JWT_REFRESH_SECRET,
    JWT_REFRESH_EXPIRES_IN,

    GOOGLE_CLIENT_ID,
    GOOGLE_CLIENT_SECRET,
    GOOGLE_CALLBACK_URL,

    GITHUB_CLIENT_ID,
    GITHUB_CLIENT_SECRET,
    GITHUB_CALLBACK_URL,

    IS_PRODUCTION: process.env.NODE_ENV === "production",
    IS_DEVELOPMENT: process.env.NODE_ENV === "development",
    NODE_ENV: (process.env.NODE_ENV ?? "development") as
      | "development"
      | "production"
      | "test",
  } as const;
}

export const env = validate();

export type Env = typeof env;
