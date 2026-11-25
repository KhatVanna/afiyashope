import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clearAdminSessionCookies,
  LARAVEL_API_ORIGIN,
  setAdminSessionCookies,
} from "@/lib/server/admin-session";

export const maxDuration = 30;

const ADMIN_ROLES = new Set(["super-admin", "admin", "staff"]);
const UPSTREAM_TIMEOUT_MS = 25_000;

type AuthUser = {
  roles?: Array<{ slug: string }>;
};

type AuthSuccess = {
  success: true;
  message: string;
  data: {
    user: AuthUser;
    token: string;
    refresh_token: string;
    token_type: string;
  };
};

function laravelUrl(path: string) {
  return `${LARAVEL_API_ORIGIN}/api/v1${path}`;
}

function hasAdminRole(user: AuthUser) {
  return Boolean(user.roles?.some((role) => ADMIN_ROLES.has(role.slug)));
}

export async function POST(request: NextRequest) {
  const body = await request.json();

  let upstream: Response;
  try {
    upstream = await fetch(laravelUrl("/auth/login"), {
      method: "POST",
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        ...body,
        portal: "admin",
      }),
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Laravel API unreachable. Check the service and LARAVEL_API_ORIGIN.",
      },
      { status: 503 }
    );
  }

  const payload = (await upstream.json()) as AuthSuccess | {
    success: false;
    message: string;
    errors?: Record<string, string[]>;
  };

  if (!upstream.ok || !payload.success) {
    return NextResponse.json(payload, { status: upstream.status });
  }

  if (!hasAdminRole(payload.data.user)) {
    return NextResponse.json(
      {
        success: false,
        message: "Only Super Admin, Admin, or Staff accounts can sign in here.",
        errors: {
          email: ["Only Super Admin, Admin, or Staff accounts can sign in here."],
        },
      },
      { status: 403 }
    );
  }

  if (!payload.data.token || !payload.data.refresh_token) {
    return NextResponse.json(
      {
        success: false,
        message: "The authentication service did not return a valid admin session.",
      },
      { status: 502 },
    );
  }

  const response = NextResponse.json({
    success: true,
    message: payload.message,
    data: {
      user: payload.data.user,
    },
  });

  setAdminSessionCookies(response, {
    accessToken: payload.data.token,
    refreshToken: payload.data.refresh_token,
  });
  return response;
}

export async function DELETE(request: NextRequest) {
  const accessToken = request.cookies.get("v2005_admin_token")?.value;
  const refreshToken = request.cookies.get("v2005_admin_refresh")?.value;
  let status = 200;
  let message = "Logged out successfully";

  if (refreshToken || accessToken) {
    const headers = new Headers({
      Accept: "application/json",
      "Content-Type": "application/json",
    });
    if (accessToken) {
      headers.set("Authorization", `Bearer ${accessToken}`);
    }

    try {
      const upstream = refreshToken
        ? await fetch(laravelUrl("/auth/admin-logout"), {
            method: "POST",
            headers,
            body: JSON.stringify({ refresh_token: refreshToken }),
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          })
        : await fetch(laravelUrl("/auth/logout"), {
            method: "POST",
            headers,
            signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
          });

      if (!upstream.ok && upstream.status !== 401) {
        status = 503;
        message = "Could not revoke the admin session. The local cookies were cleared.";
      }
    } catch {
      status = 503;
      message = "Authentication service unavailable. The local cookies were cleared.";
    }
  }

  const response = NextResponse.json(
    {
      success: status === 200,
      message,
      data: null,
    },
    { status },
  );

  clearAdminSessionCookies(response);
  return response;
}
