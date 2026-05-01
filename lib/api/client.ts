/**
 * Tiny client-side fetch wrapper used by the hooks.
 *
 * - Throws `ApiError` on non-2xx with the server's `error` code (e.g.
 *   "insufficient_funds") so UI can switch on it for specific toasts.
 * - Auto-parses JSON.
 * - Adds `Content-Type` for body-bearing methods.
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    public status: number,
    public body: unknown,
  ) {
    super(`${code} (${status})`);
    this.name = 'ApiError';
  }
}

interface ErrorBody {
  error?: string;
  message?: string;
}

async function parseError(res: Response): Promise<{ code: string; body: unknown }> {
  let body: ErrorBody = {};
  try {
    body = (await res.json()) as ErrorBody;
  } catch {
    // ignore — non-JSON or empty body
  }
  return {
    code: body.error ?? `http_${res.status}`,
    body,
  };
}

export async function apiGet<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { method: 'GET', ...init });
  if (!res.ok) {
    const { code, body } = await parseError(res);
    throw new ApiError(code, res.status, body);
  }
  return (await res.json()) as T;
}

export async function apiSend<T>(
  path: string,
  method: 'POST' | 'PATCH' | 'DELETE' | 'PUT',
  body?: unknown,
): Promise<T> {
  const res = await fetch(path, {
    method,
    headers: body !== undefined ? { 'Content-Type': 'application/json' } : undefined,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const { code, body: errBody } = await parseError(res);
    throw new ApiError(code, res.status, errBody);
  }
  // 204 / empty body
  const text = await res.text();
  return (text ? JSON.parse(text) : null) as T;
}
