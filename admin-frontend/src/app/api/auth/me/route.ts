import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clearAdminSessionCookies,
  fetchAdminWithRefresh,
  LARAVEL_API_ORIGIN,
  setAdminSessionCookies,
} from "@/lib/server/admin-session";

export const maxDuration = 30;

const ADMIN_ROLES = new Set(["super-admin", "admin", "staff"]);

type AuthUser = {
  roles?: Array<{ slug: string }>;
};

export async function GET(request: NextRequest) {
  try {
    const result = await fetchAdminWithRefresh(
      request,
      `${LARAVEL_API_ORIGIN}/api/v1/auth/me`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
        signal: AbortSignal.timeout(25_000),
      },
    );
    const upstream = result.response;

    let payload: unknown = null;
    try {
      payload = await upstream.json();
    } catch {
      payload = {
        success: false,
        message: "Invalid auth response from API",
      };
    }

    if (!upstream.ok) {
      const response = NextResponse.json(payload, { status: upstream.status });
      if (result.clearCookies) {
        clearAdminSessionCookies(response);
      } else if (result.renewedTokens) {
        setAdminSessionCookies(response, result.renewedTokens);
      }
      return response;
    }

    const user = (payload as { data?: { user?: AuthUser } })?.data?.user;
    const isAdminUser = Boolean(
      user?.roles?.some((role) => ADMIN_ROLES.has(role.slug))
    );

    if (!isAdminUser) {
      const response = NextResponse.json(
        {
          success: false,
          message:
            "Only Super Admin, Admin, or Staff accounts can use the admin portal.",
        },
        { status: 403 }
      );
      clearAdminSessionCookies(response);
      return response;
    }

    const response = NextResponse.json(payload);
    if (result.renewedTokens) {
      setAdminSessionCookies(response, result.renewedTokens);
    }
    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Authentication service temporarily unavailable",
      },
      { status: 503 }
    );
  }
}
