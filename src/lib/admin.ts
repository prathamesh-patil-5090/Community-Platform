import { auth } from "@/auth";
import { NextResponse } from "next/server";

/**
 * Checks whether the current session belongs to an admin user.
 *
 * @returns The session if the user is an admin, or null otherwise.
 */
export async function getAdminSession() {
  const session = await auth();

  if (!session?.user?.id) {
    return null;
  }

  if (session.user.role !== "admin") {
    return null;
  }

  return session;
}

/**
 * Returns a 401 JSON response for unauthenticated requests.
 */
export function unauthorizedResponse() {
  return NextResponse.json(
    { error: "You must be signed in." },
    { status: 401 },
  );
}

/**
 * Returns a 403 JSON response for non-admin users.
 */
export function forbiddenResponse() {
  return NextResponse.json(
    { error: "You do not have permission to access this resource." },
    { status: 403 },
  );
}

/**
 * Validates that the current request is from an authenticated admin.
 * Returns the session on success, or a NextResponse error on failure.
 */
export async function requireAdmin() {
  const session = await auth();

  if (!session?.user?.id) {
    return { session: null, error: unauthorizedResponse() };
  }

  if (session.user.role !== "admin") {
    return { session: null, error: forbiddenResponse() };
  }

  return { session, error: null };
}
