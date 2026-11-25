import type { ApiResponse } from "@/types/api";

export async function adminApi<T>(
  path: string,
  init?: RequestInit
): Promise<{ ok: boolean; status: number; payload: ApiResponse<T> }> {
  const headers = new Headers(init?.headers);
  headers.set("Accept", "application/json");
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  if (isFormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  const response = await fetch(`/api/proxy/v1${path}`, {
    ...init,
    credentials: "include",
    headers,
    cache: "no-store",
  });

  const payload = (await response.json()) as ApiResponse<T>;
  return { ok: response.ok, status: response.status, payload };
}
