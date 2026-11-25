import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

export const LARAVEL_API_ORIGIN =
  process.env.LARAVEL_API_ORIGIN ?? "http://localhost:8000";

const ACCESS_COOKIE = "v2005_admin_token";
const REFRESH_COOKIE = "v2005_admin_refresh";
const ACCESS_COOKIE_MAX_AGE = 15 * 60;
const REFRESH_COOKIE_MAX_AGE = 30 * 24 * 60 * 60;
const UPSTREAM_TIMEOUT_MS = 25_000;

export type AdminSessionTokens = {
  accessToken: string;
  refreshToken: string;
};

export type AdminAuthenticatedFetch = {
  response: Response;
  renewedTokens?: AdminSessionTokens;
  clearCookies?: boolean;
};

function cookieOptions(maxAge: number) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge,
  };
}

export function setAdminSessionCookies(
  response: NextResponse,
  tokens: AdminSessionTokens,
) {
  response.cookies.set(ACCESS_COOKIE, tokens.accessToken, cookieOptions(ACCESS_COOKIE_MAX_AGE));
  response.cookies.set(REFRESH_COOKIE, tokens.refreshToken, cookieOptions(REFRESH_COOKIE_MAX_AGE));
}

export function clearAdminSessionCookies(response: NextResponse) {
  response.cookies.set(ACCESS_COOKIE, "", cookieOptions(0));
  response.cookies.set(REFRESH_COOKIE, "", cookieOptions(0));
}

function serviceUnavailableResponse() {
  return NextResponse.json(
    {
      success: false,
      message: "Authentication service temporarily unavailable.",
    },
    { status: 503 },
  );
}

function tokensFromPayload(payload: unknown): AdminSessionTokens | null {
  if (!payload || typeof payload !== "object" || !("data" in payload)) {
    return null;
  }

  const data = payload.data;
  if (!data || typeof data !== "object" || !("token" in data) || !("refresh_token" in data)) {
    return null;
  }

  const accessToken = data.token;
  const refreshToken = data.refresh_token;
  if (typeof accessToken !== "string" || typeof refreshToken !== "string") {
    return null;
  }

  return { accessToken, refreshToken };
}

export async function fetchAdminWithRefresh(
  request: NextRequest,
  target: string,
  init: RequestInit,
): Promise<AdminAuthenticatedFetch> {
  const accessToken = request.cookies.get(ACCESS_COOKIE)?.value;
  const refreshToken = request.cookies.get(REFRESH_COOKIE)?.value;
  const headers = new Headers(init.headers);
  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const upstream = await fetch(target, {
    ...init,
    headers,
    cache: "no-store",
  });

  if (upstream.status !== 401) {
    return { response: upstream };
  }

  if (!refreshToken) {
    return {
      response: upstream,
      clearCookies: Boolean(accessToken),
    };
  }

  const refreshResponse = await fetch(`${LARAVEL_API_ORIGIN}/api/v1/auth/refresh`, {
    method: "POST",
    headers: {
      Accept: "application/json",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ refresh_token: refreshToken }),
    cache: "no-store",
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  });

  if (refreshResponse.status === 401) {
    return { response: refreshResponse, clearCookies: true };
  }

  if (!refreshResponse.ok) {
    return { response: serviceUnavailableResponse() };
  }

  let tokens: AdminSessionTokens | null = null;
  try {
    tokens = tokensFromPayload(await refreshResponse.json());
  } catch {
    return { response: serviceUnavailableResponse() };
  }

  if (!tokens) {
    return { response: serviceUnavailableResponse() };
  }

  const retryHeaders = new Headers(init.headers);
  retryHeaders.set("Authorization", `Bearer ${tokens.accessToken}`);

  try {
    const retry = await fetch(target, {
      ...init,
      headers: retryHeaders,
      cache: "no-store",
    });

    return {
      response: retry,
      renewedTokens: tokens,
      clearCookies: retry.status === 401,
    };
  } catch {
    return {
      response: serviceUnavailableResponse(),
      renewedTokens: tokens,
    };
  }
}
