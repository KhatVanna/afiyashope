import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import {
  clearAdminSessionCookies,
  fetchAdminWithRefresh,
  LARAVEL_API_ORIGIN,
  setAdminSessionCookies,
} from "@/lib/server/admin-session";

export const maxDuration = 30;

const UPSTREAM_TIMEOUT_MS = 25_000;

type RouteContext = {
  params: Promise<{ path: string[] }>;
};

async function proxy(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  const targetPath = path.join("/");
  if (targetPath === "v1/auth/refresh") {
    return NextResponse.json(
      { success: false, message: "This endpoint is available only to the server." },
      { status: 404 },
    );
  }

  const url = new URL(request.url);
  const target = `${LARAVEL_API_ORIGIN}/api/${targetPath}${url.search}`;

  const headers = new Headers();
  headers.set("Accept", "application/json");

  const contentType = request.headers.get("content-type");
  if (contentType) {
    headers.set("Content-Type", contentType);
  }

  const hasBody = !["GET", "HEAD"].includes(request.method);
  const body = hasBody ? await request.arrayBuffer() : undefined;

  try {
    const result = await fetchAdminWithRefresh(request, target, {
      method: request.method,
      headers,
      body,
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    });

    const text = await result.response.text();
    const responseHeaders = new Headers();
    const upstreamContentType = result.response.headers.get("content-type");
    if (upstreamContentType) {
      responseHeaders.set("content-type", upstreamContentType);
    }

    const response = new NextResponse(text, {
      status: result.response.status,
      headers: responseHeaders,
    });
    if (result.clearCookies) {
      clearAdminSessionCookies(response);
    } else if (result.renewedTokens) {
      setAdminSessionCookies(response, result.renewedTokens);
    }

    return response;
  } catch {
    return NextResponse.json(
      {
        success: false,
        message: "Laravel API unreachable. Check the service and LARAVEL_API_ORIGIN.",
      },
      { status: 503 }
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
