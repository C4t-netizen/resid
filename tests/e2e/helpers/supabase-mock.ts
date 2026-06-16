import type { Page, Route } from "@playwright/test";

const SUPABASE_HOST = "penajrdjjnyqiknesnsk.supabase.co";

export type AuthMockOptions = {
  /** Hace que /auth/v1/recover devuelva 200 OK. */
  recoverOk?: boolean;
  /** Hace que /auth/v1/verify devuelva una sesión válida. */
  verifyOk?: boolean;
  /** Hace que /auth/v1/user (updateUser) devuelva 200 OK. */
  updateUserOk?: boolean;
  /** Forzar error en verify (link expirado). */
  verifyExpired?: boolean;
};

const json = (route: Route, status: number, body: unknown) =>
  route.fulfill({
    status,
    contentType: "application/json",
    headers: { "access-control-allow-origin": "*" },
    body: JSON.stringify(body),
  });

const fakeSession = {
  access_token: "fake-access-token",
  token_type: "bearer",
  expires_in: 3600,
  expires_at: Math.floor(Date.now() / 1000) + 3600,
  refresh_token: "fake-refresh-token",
  user: {
    id: "00000000-0000-0000-0000-000000000001",
    aud: "authenticated",
    role: "authenticated",
    email: "tester@example.com",
    app_metadata: { provider: "email" },
    user_metadata: {},
    created_at: new Date().toISOString(),
  },
};

export async function mockSupabaseAuth(page: Page, opts: AuthMockOptions = {}) {
  const {
    recoverOk = true,
    verifyOk = true,
    updateUserOk = true,
    verifyExpired = false,
  } = opts;

  await page.route(`**://${SUPABASE_HOST}/auth/v1/**`, async (route) => {
    const url = new URL(route.request().url());
    const path = url.pathname.replace("/auth/v1/", "");
    const method = route.request().method();

    if (method === "OPTIONS") {
      return route.fulfill({
        status: 204,
        headers: {
          "access-control-allow-origin": "*",
          "access-control-allow-headers": "*",
          "access-control-allow-methods": "GET,POST,PUT,DELETE,OPTIONS",
        },
      });
    }

    // resetPasswordForEmail()
    if (path === "recover" && method === "POST") {
      return recoverOk
        ? json(route, 200, {})
        : json(route, 400, { error: "rate_limited", error_description: "Too many requests" });
    }

    // verifyOtp({ type: 'recovery', token_hash })
    if (path === "verify" && method === "POST") {
      if (verifyExpired) {
        return json(route, 403, {
          error: "otp_expired",
          error_description: "Email link is invalid or has expired",
        });
      }
      return verifyOk
        ? json(route, 200, fakeSession)
        : json(route, 400, { error: "invalid_token" });
    }

    // updateUser({ password })
    if (path === "user" && (method === "PUT" || method === "PATCH")) {
      return updateUserOk
        ? json(route, 200, fakeSession.user)
        : json(route, 400, { error: "weak_password" });
    }

    if (path === "user" && method === "GET") {
      return json(route, 200, fakeSession.user);
    }

    if (path === "logout") {
      return json(route, 204, {});
    }

    if (path.startsWith("token")) {
      return json(route, 200, fakeSession);
    }

    return route.continue();
  });
}
