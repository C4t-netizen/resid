import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const jsonResponse = (body: Record<string, unknown>, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const inspectJwksConfig = () => {
  const jwksRaw = Deno.env.get("SUPABASE_JWKS");
  if (!jwksRaw) {
    console.error("[delete-user] SUPABASE_JWKS missing");
    return { exists: false, validJson: false };
  }

  try {
    const parsed = JSON.parse(jwksRaw);
    const hasKeys = Array.isArray(parsed?.keys);
    console.log("[delete-user] SUPABASE_JWKS present", { validJson: true, hasKeys });
    return { exists: true, validJson: true, hasKeys };
  } catch (error) {
    console.error("[delete-user] SUPABASE_JWKS invalid JSON", { message: (error as Error).message });
    return { exists: true, validJson: false };
  }
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    console.log("[delete-user] Environment check", {
      hasSupabaseUrl: Boolean(supabaseUrl),
      hasAnonKey: Boolean(anonKey),
      hasServiceKey: Boolean(serviceKey),
      jwks: inspectJwksConfig(),
    });

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return jsonResponse({ error: "Server configuration error" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    console.log("[delete-user] Authorization header", {
      present: Boolean(authHeader),
      startsWithBearer: authHeader.startsWith("Bearer "),
    });

    if (!authHeader) {
      console.error("[delete-user] Missing Authorization header");
      return jsonResponse({ error: "Unauthorized: Missing Authorization header" }, 401);
    }

    const token = authHeader.replace(/^Bearer\s+/i, "");
    if (!token) {
      console.error("[delete-user] Empty token after Bearer extraction");
      return jsonResponse({ error: "Unauthorized: Empty token" }, 401);
    }
    console.log("[delete-user] Token extracted", { present: Boolean(token), length: token.length });

    const admin = createClient(supabaseUrl, serviceKey);
    const authClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    let requesterId = "";
    try {
      console.log("[delete-user] Verifying requester with auth.getClaims()");
      const { data: claimsData, error: authError } = await authClient.auth.getClaims(token);

      if (authError) {
        console.error("[delete-user] auth.getClaims failed", {
          name: authError.name,
          message: authError.message,
          status: authError.status,
        });
        throw authError;
      }

      const subject = claimsData?.claims?.sub;
      console.log("[delete-user] Claims verified", {
        hasSubject: Boolean(subject),
        issuer: claimsData?.claims?.iss ?? null,
        audience: claimsData?.claims?.aud ?? null,
        role: claimsData?.claims?.role ?? null,
      });

      if (!subject || typeof subject !== "string") {
        console.error("[delete-user] auth.getClaims returned no valid subject");
        throw new Error("auth.getClaims returned no valid subject");
      }

      requesterId = subject;
      console.log("[delete-user] Authenticated requester", { requesterId });
    } catch (err) {
      const error = err as Error & { status?: number };
      return jsonResponse({
        error: "Unauthorized",
        detail: error.message,
        status: error.status ?? null,
      }, 401);
    }

    console.log("[delete-user] Reached super_admin role check", { requesterId });
    const { data: isSuper, error: roleError } = await admin.rpc("has_role", { _user_id: requesterId, _role: "super_admin" });
    console.log("[delete-user] has_role result", { isSuper, roleError: roleError?.message ?? null });
    if (roleError) {
      return jsonResponse({ error: `Role check failed: ${roleError.message}` }, 500);
    }
    if (!isSuper) {
      return jsonResponse({ error: "Forbidden: super_admin required" }, 403);
    }

    const { userId } = await req.json();
    if (!userId || typeof userId !== "string") {
      return jsonResponse({ error: "Missing userId" }, 400);
    }
    if (userId === requesterId) {
      return jsonResponse({ error: "No puedes eliminar tu propia cuenta" }, 400);
    }

    const { error: delErr } = await admin.auth.admin.deleteUser(userId);
    if (delErr) {
      return jsonResponse({ error: delErr.message }, 500);
    }

    return jsonResponse({ success: true });
  } catch (e) {
    return jsonResponse({ error: (e as Error).message }, 500);
  }
});
