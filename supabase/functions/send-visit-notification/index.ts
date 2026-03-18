// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

type NotifyPayload = {
    customerId?: string;
    treatmentName?: string;
    staffName?: string;
};

type ExpoTicket = {
    status: "ok" | "error";
    id?: string;
    details?: {
        error?: string;
    };
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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Restrict sending to staff/admin accounts.
    const { data: sender, error: senderError } = await adminClient
        .from("User")
        .select("role")
        .eq("id", userId)
        .single();

    if (senderError || !sender) {
        return jsonResponse({ error: "Unable to validate sender role" }, 403);
    }

    if (!["staff", "admin"].includes(sender.role?.toLowerCase?.() ?? "")) {
        return jsonResponse({ error: "Forbidden" }, 403);
    }

    let payload: NotifyPayload;
    try {
        payload = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    const customerId = payload.customerId?.trim();
    const treatmentName = payload.treatmentName?.trim();
    const staffName = payload.staffName?.trim();

    if (!customerId || !treatmentName || !staffName) {
        return jsonResponse(
            { error: "customerId, treatmentName and staffName are required" },
            400,
        );
    }

    const { data: tokenRows, error: tokenError } = await adminClient
        .from("notification_tokens")
        .select("expo_push_token")
        .eq("user_id", customerId)
        .eq("is_active", true);

    if (tokenError) {
        return jsonResponse({ error: tokenError.message }, 500);
    }

    const tokens = (tokenRows ?? [])
        .map((row) => row.expo_push_token)
        .filter((token): token is string => Boolean(token));

    if (tokens.length === 0) {
        return jsonResponse({ success: true, sent: 0, reason: "No active device tokens" });
    }

    const messages = tokens.map((token) => ({
        to: token,
        sound: "default",
        title: "New Visit Added",
        body: `Your \"${treatmentName}\" visit has been added by ${staffName}`,
        data: {
            type: "visit_added",
            customerId,
        },
    }));

    const expoResponse = await fetch("https://exp.host/--/api/v2/push/send", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
        },
        body: JSON.stringify(messages),
    });

    if (!expoResponse.ok) {
        const responseText = await expoResponse.text();
        return jsonResponse({ error: `Expo push request failed: ${responseText}` }, 502);
    }

    const expoResult = await expoResponse.json();
    const tickets: ExpoTicket[] = Array.isArray(expoResult?.data)
        ? expoResult.data
        : [];

    const invalidTokens: string[] = [];
    tickets.forEach((ticket, index) => {
        if (
            ticket.status === "error" &&
            ["DeviceNotRegistered", "InvalidCredentials", "MessageTooBig"].includes(
                ticket.details?.error ?? "",
            )
        ) {
            invalidTokens.push(tokens[index]);
        }
    });

    if (invalidTokens.length > 0) {
        await adminClient
            .from("notification_tokens")
            .update({ is_active: false })
            .in("expo_push_token", invalidTokens);
    }

    return jsonResponse({
        success: true,
        sent: tokens.length,
        invalidated: invalidTokens.length,
    });
});
