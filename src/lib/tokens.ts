import RefreshToken from "@/models/RefreshToken";
import crypto from "crypto";
import connectDB from "./mongodb";

function parseDurationMs(duration: string): number {
  const match = duration.match(/^(\d+)(d|h|m|s)?$/);
  if (!match) return 7 * 24 * 60 * 60 * 1000;

  const value = parseInt(match[1], 10);
  const unit = match[2] ?? "d";

  switch (unit) {
    case "d":
      return value * 24 * 60 * 60 * 1000;
    case "h":
      return value * 60 * 60 * 1000;
    case "m":
      return value * 60 * 1000;
    case "s":
      return value * 1000;
    default:
      return 7 * 24 * 60 * 60 * 1000;
  }
}

export function generateRefreshToken(): string {
  return crypto.randomBytes(64).toString("hex");
}

export async function storeRefreshToken(
  userId: string,
  token: string,
): Promise<void> {
  await connectDB();

  const durationStr = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
  const expiresAt = new Date(Date.now() + parseDurationMs(durationStr));

  await RefreshToken.deleteMany({ userId });

  await RefreshToken.create({ userId, token, expiresAt });
}

export async function validateRefreshToken(
  token: string,
): Promise<string | null> {
  await connectDB();

  const record = await RefreshToken.findOne({
    token,
    expiresAt: { $gt: new Date() },
  });

  return record ? (record.userId as string) : null;
}

export async function rotateRefreshToken(
  oldToken: string,
  userId: string,
): Promise<string> {
  await connectDB();

  await RefreshToken.deleteOne({ token: oldToken });

  const newToken = generateRefreshToken();
  const durationStr = process.env.JWT_REFRESH_EXPIRES_IN ?? "7d";
  const expiresAt = new Date(Date.now() + parseDurationMs(durationStr));

  await RefreshToken.create({ userId, token: newToken, expiresAt });

  return newToken;
}

export async function revokeRefreshToken(token: string): Promise<void> {
  await connectDB();
  await RefreshToken.deleteOne({ token });
}

export async function revokeAllUserRefreshTokens(
  userId: string,
): Promise<void> {
  await connectDB();
  await RefreshToken.deleteMany({ userId });
}
