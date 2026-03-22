// @ts-nocheck
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers":
        "authorization, x-client-info, apikey, content-type",
};

type ExpoTicket = {
    status: "ok" | "error";
    id?: string;
    details?: {
        error?: string;
    };
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
        },
    });
}

function isBirthdayToday(dobIso: string) {
    const dob = new Date(dobIso);
    if (Number.isNaN(dob.getTime())) return false;

    const now = new Date();
    return (
        dob.getUTCDate() === now.getUTCDate() &&
        dob.getUTCMonth() === now.getUTCMonth()
    );
}

async function sendBirthdayPush(
    adminClient: ReturnType<typeof createClient>,
    userId: string,
) {
    const { data: tokenRows, error: tokenError } = await adminClient
        .from("notification_tokens")
        .select("expo_push_token")
        .eq("user_id", userId)
        .eq("is_active", true);

    if (tokenError) {
        return { sent: 0, invalidated: 0, error: tokenError.message };
    }

    const tokens = (tokenRows ?? [])
        .map((row) => row.expo_push_token)
        .filter((token): token is string => Boolean(token));

    if (tokens.length === 0) {
        return { sent: 0, invalidated: 0 };
    }

    const messages = tokens.map((token) => ({
        to: token,
        sound: "default",
        title: "Happy Birthday!",
        body: "You received 100 birthday points from Skinzone.",
        data: {
            type: "birthday_points_awarded",
            points: 100,
            userId,
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
        return {
            sent: 0,
            invalidated: 0,
            error: `Expo push request failed: ${responseText}`,
        };
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

    return { sent: tokens.length, invalidated: invalidTokens.length };
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
        return jsonResponse({ error: 'Unauthorized: missing bearer token' }, 401)
    }

    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')
    const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')

    if (!supabaseUrl || !supabaseAnonKey || !serviceRoleKey) {
        return jsonResponse({ error: 'Missing Supabase environment variables' }, 500)
    }

    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
    })

    const {
        data: { user },
        error: userError,
    } = await supabaseClient.auth.getUser()

    if (userError || !user) {
        console.error('Auth error:', userError)
        return jsonResponse({ error: 'Unauthorized: Invalid JWT', details: userError }, 401)
    }

    const userId = user.id
    const adminClient = createClient(supabaseUrl, serviceRoleKey)

    const { data: userData, error: profileError } = await adminClient
        .from("User")
        .select("id, dob, pointsused")
        .eq("id", userId)
        .single();

    if (profileError || !userData) {
        return jsonResponse({ error: "Unable to load user profile" }, 500);
    }

    if (!isBirthdayToday(userData.dob)) {
        return jsonResponse({ awarded: false, reason: "not_birthday" });
    }

    const currentYear = new Date().getUTCFullYear();
    const marker = `Birthday points awarded ${currentYear}`;

    const { data: existingReward } = await adminClient
        .from("customervisits")
        .select("csid")
        .eq("customerid", userId)
        .eq("notes", marker)
        .limit(1)
        .maybeSingle();

    if (existingReward) {
        return jsonResponse({ awarded: false, reason: "already_awarded" });
    }

    const currentPointsUsed = Number(userData.pointsused ?? 0);
    const newPointsUsed = currentPointsUsed - 100;

    const { error: updateError } = await adminClient
        .from("User")
        .update({ pointsused: newPointsUsed })
        .eq("id", userId);

    if (updateError) {
        return jsonResponse({ error: "Failed to update points" }, 500);
    }

    const { error: markerError } = await adminClient.from("customervisits").insert({
        customerid: userId,
        staffid: userId,
        totalamountpaid: 0,
        notes: marker,
        Freetreatment: true,
    });

    if (markerError) {
        // Roll back points update if marker creation fails.
        await adminClient
            .from("User")
            .update({ pointsused: currentPointsUsed })
            .eq("id", userId);

        return jsonResponse({ error: "Failed to record birthday reward" }, 500);
    }

    const pushResult = await sendBirthdayPush(adminClient, userId);

    return jsonResponse({
        awarded: true,
        pointsAwarded: 100,
        sent: pushResult.sent,
        invalidated: pushResult.invalidated,
        pushError: pushResult.error ?? null,
    });
});
