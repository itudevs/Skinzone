// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type RegisterPayload = {
    token?: string;
    platform?: "ios" | "android" | "web";
};

function getUserIdFromJwt(jwt: string) {
    try {
        const parts = jwt.split(".");
        if (parts.length < 2) return null;
        const payload = JSON.parse(atob(parts[1].replace(/-/g, "+").replace(/_/g, "/")));
        const sub = payload?.sub;
        return typeof sub === "string" ? sub : null;
    } catch {
        return null;
    }
}

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    });
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const authHeader =
        req.headers.get("Authorization") ?? req.headers.get("authorization") ?? "";

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
        return jsonResponse({ error: "Missing Supabase environment variables" }, 500);
    }

    const jwt = authHeader.replace(/^Bearer\s+/i, "").trim();

    if (!jwt) {
        return jsonResponse({ error: "Unauthorized: missing bearer token" }, 401);
    }

    const authClient = createClient(supabaseUrl, supabaseAnonKey);

    const {
        data: { user },
        error: userError,
    } = await authClient.auth.getUser(jwt);

    const fallbackUserId = getUserIdFromJwt(jwt);
    const userId = user?.id ?? fallbackUserId;

    if (!userId) {
        return jsonResponse(
            { error: `Unauthorized: ${userError?.message ?? "invalid token"}` },
            401,
        );
    }

    let payload: RegisterPayload;
    try {
        payload = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    const token = payload.token?.trim();
    const platform = payload.platform;

    if (!token || !platform) {
        return jsonResponse({ error: "token and platform are required" }, 400);
    }

    const isExpoToken =
        token.startsWith("ExpoPushToken[") || token.startsWith("ExponentPushToken[");

    if (!isExpoToken) {
        return jsonResponse({ error: "Invalid Expo push token" }, 400);
    }

    if (!["ios", "android", "web"].includes(platform)) {
        return jsonResponse({ error: "Invalid platform" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { error: upsertError } = await adminClient
        .from("notification_tokens")
        .upsert(
            {
                user_id: userId,
                expo_push_token: token,
                platform,
                is_active: true,
                last_seen_at: new Date().toISOString(),
            },
            { onConflict: "user_id, expo_push_token" },
        );

    if (upsertError) {
        return jsonResponse({ error: upsertError.message }, 500);
    }

    return jsonResponse({ success: true });
});
