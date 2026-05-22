import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

/** Sign a JWT with HS256 using the Supabase JWT secret */
async function signJWT(secret: string, payload: Record<string, unknown>): Promise<string> {
  const b64u = (s: string) =>
    btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
  const header = b64u(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64u(JSON.stringify(payload));
  const msg = `${header}.${body}`;
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(msg));
  const sigB64 = b64u(String.fromCharCode(...new Uint8Array(sig)));
  return `${msg}.${sigB64}`;
}

Deno.serve(async (req) => {
  // Always handle CORS preflight first
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: CORS });
  }

  try {
    if (req.method !== "POST") {
      return new Response("Method not allowed", { status: 405, headers: CORS });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const familyPin = Deno.env.get("FAMILY_PIN")!;
    const jwtSecret = Deno.env.get("JWT_SECRET")!;

    const admin = createClient(supabaseUrl, serviceKey);

    // ── Rate limiting (server-side, DB-backed) ────────────────────────────────
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
      req.headers.get("cf-connecting-ip") ??
      "unknown";

    const since = new Date(Date.now() - 5 * 60 * 1000).toISOString();
    const { count } = await admin
      .from("pin_attempts")
      .select("*", { count: "exact", head: true })
      .eq("ip", ip)
      .gte("attempted_at", since);

    if ((count ?? 0) >= 5) {
      return new Response(
        JSON.stringify({ success: false, error: "too_many_attempts" }),
        { status: 429, headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // Record this attempt before validating (prevents timing attacks)
    await admin.from("pin_attempts").insert({ ip });

    // ── Validate PIN ──────────────────────────────────────────────────────────
    let body: { pin?: string };
    try {
      body = await req.json();
    } catch {
      return new Response(
        JSON.stringify({ success: false }),
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    if (!body.pin || body.pin !== familyPin) {
      return new Response(
        JSON.stringify({ success: false }),
        { headers: { ...CORS, "Content-Type": "application/json" } },
      );
    }

    // ── Issue JWT (valid 24 h) ────────────────────────────────────────────────
    const now = Math.floor(Date.now() / 1000);
    const token = await signJWT(jwtSecret, {
      role: "authenticated",
      iss: "supabase",
      sub: "family-member",
      aud: "authenticated",
      iat: now,
      exp: now + 86400, // 24 hours
    });

    return new Response(
      JSON.stringify({ success: true, token }),
      { headers: { ...CORS, "Content-Type": "application/json" } },
    );

  } catch (err) {
    console.error("verify-pin error:", err);
    return new Response(
      JSON.stringify({ success: false, error: "internal_error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
