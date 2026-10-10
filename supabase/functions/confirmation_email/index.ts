import { createClient } from "npm:@supabase/supabase-js@2";

type WebhookPayload = {
    record?: {
        bookingid?: number;
        booking_id?: number;
    };
    bookingid?: number;
    booking_id?: number;
};

type Booking = {
    bookingid: number;
    bookingdate: string;
    customerid: string;
    notes: string | null;
    status: string | null;
};

type BookingLine = {
    treatment_id: number | null;
    time: string;
};

type Service = {
    ServiceId: number;
    servicename: string;
    servicecost: number;
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function jsonResponse(body: unknown, status = 200) {
    return new Response(JSON.stringify(body), {
        status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
}

function escapeHtml(value: string | number | null | undefined) {
    return String(value ?? "")
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function formatDate(value: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "full",
        timeZone: "Africa/Johannesburg",
    }).format(date);
}

function formatCurrency(value: number) {
    return new Intl.NumberFormat("en-ZA", {
        style: "currency",
        currency: "ZAR",
    }).format(value);
}

function getBookingId(payload: WebhookPayload) {
    const record = payload.record ?? {};
    const id = record.bookingid ?? record.booking_id ?? payload.bookingid ?? payload.booking_id;
    return typeof id === "number" ? id : Number(id);
}

function renderLineItems(
    lines: Array<{ name: string; time: string; cost: number }>,
) {
    return lines
        .map(
            (line) => `
                <tr>
                    <td style="padding:12px 0;border-bottom:1px solid #2b2b2b;color:#d1d5db;">
                        ${escapeHtml(line.name)}<br>
                        <span style="color:#9ca3af;font-size:13px;">${escapeHtml(line.time)}</span>
                    </td>
                    <td align="right" style="padding:12px 0;border-bottom:1px solid #2b2b2b;color:#ffffff;">
                        ${escapeHtml(formatCurrency(line.cost))}
                    </td>
                </tr>`,
        )
        .join("");
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") {
        return new Response("ok", { headers: corsHeaders });
    }

    if (req.method !== "POST") {
        return jsonResponse({ error: "Method not allowed" }, 405);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom = Deno.env.get("BOOKING_EMAIL_FROM") ?? "SkinZone Naturel <onboarding@resend.dev>";

    const missingConfiguration = [
        !supabaseUrl && "SUPABASE_URL",
        !serviceRoleKey && "SUPABASE_SERVICE_ROLE_KEY",
        !resendApiKey && "RESEND_API_KEY",
    ].filter((name): name is string => Boolean(name));

    if (missingConfiguration.length > 0) {
        console.error(
            `Missing Edge Function configuration: ${missingConfiguration.join(", ")}`,
        );
        return jsonResponse(
            {
                error: "Email service is not configured",
                missing: missingConfiguration,
            },
            500,
        );
    }

    let payload: WebhookPayload;
    try {
        payload = await req.json();
    } catch {
        return jsonResponse({ error: "Invalid JSON payload" }, 400);
    }

    const bookingId = getBookingId(payload);
    if (!Number.isInteger(bookingId) || bookingId <= 0) {
        return jsonResponse({ error: "A valid bookingid or booking_id is required" }, 400);
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: booking, error: bookingError } = await adminClient
        .from("bookings")
        .select("bookingid,bookingdate,customerid,notes,status")
        .eq("bookingid", bookingId)
        .single<Booking>();

    if (bookingError || !booking) {
        console.error("Could not load booking:", bookingError);
        return jsonResponse({ error: "Could not load booking details" }, 404);
    }

    const [{ data: customer, error: customerError }, { data: bookingLines, error: linesError }] =
        await Promise.all([
            adminClient
                .from("User")
                .select("name,email")
                .eq("id", booking.customerid)
                .single<{ name: string; email: string }>(),
            adminClient
                .from("booking_line")
                .select("treatment_id,time")
                .eq("booking_id", bookingId)
                .order("time", { ascending: true })
                .returns<BookingLine[]>(),
        ]);

    if (customerError || !customer?.email) {
        console.error("Could not load customer email:", customerError);
        return jsonResponse({ error: "Could not load customer email" }, 500);
    }
    if (linesError) {
        console.error("Could not load booking lines:", linesError);
        return jsonResponse({ error: "Could not load booking lines" }, 500);
    }

    const treatmentIds = (bookingLines ?? [])
        .map((line) => line.treatment_id)
        .filter((id): id is number => typeof id === "number");
    const { data: services, error: servicesError } =
        treatmentIds.length > 0
            ? await adminClient
                  .from("Services")
                  .select("ServiceId,servicename,servicecost")
                  .in("ServiceId", treatmentIds)
                  .returns<Service[]>()
            : { data: [], error: null };

    if (servicesError) {
        console.error("Could not load booked services:", servicesError);
        return jsonResponse({ error: "Could not load booked services" }, 500);
    }

    const serviceById = new Map((services ?? []).map((service) => [service.ServiceId, service]));
    const lineItems = (bookingLines ?? []).map((line) => {
        const service = line.treatment_id == null ? undefined : serviceById.get(line.treatment_id);
        return {
            name: service?.servicename ?? "SkinZone Naturel treatment",
            time: line.time.slice(0, 5),
            cost: Number(service?.servicecost ?? 0),
        };
    });
    const expectedLineCount = (booking.notes ?? "")
        .split(",")
        .map((name) => name.trim())
        .filter(Boolean).length;
    if (lineItems.length === 0 || lineItems.length < expectedLineCount) {
        return jsonResponse({
            success: true,
            bookingId,
            skipped: "Waiting for all booking lines",
        });
    }
    const amountDue = 300;
    const firstName = customer.name?.trim() || "there";
    const bookingDate = formatDate(booking.bookingdate);
    const bookingTimes = lineItems.map((line) => line.time).join(", ") || "To be confirmed";
    const subject = `Booking confirmation #${booking.bookingid} - SkinZone Naturel`;
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background-color:#0d0d0d;font-family:Arial,Helvetica,sans-serif;color:#ffffff;">
    <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d0d0d;padding:40px 20px;">
        <tr><td align="center">
            <table width="600" cellpadding="0" cellspacing="0" style="background-color:#141414;border:1px solid #1f4d2e;border-radius:12px;overflow:hidden;">
                <tr><td align="center" style="background-color:#123524;padding:30px;">
                    <h1 style="margin:0;color:#ffffff;font-size:32px;">SkinZone Naturel</h1>
                    <p style="margin-top:10px;color:#c7d8c7;font-size:16px;">Natural Wellness • Natural Beauty</p>
                </td></tr>
                <tr><td style="padding:40px;">
                    <h2 style="color:#ffffff;margin-top:0;">Your Booking Confirmation</h2>
                    <p style="color:#d1d5db;line-height:1.7;">Hello ${escapeHtml(firstName)},</p>
                    <p style="color:#d1d5db;line-height:1.7;">Thank you for booking with SkinZone Naturel. Your appointment details are below.</p>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin:25px 0;">
                        <tr><td style="padding:8px 0;color:#9ca3af;">Booking number</td><td align="right" style="padding:8px 0;color:#ffffff;">#${booking.bookingid}</td></tr>
                        <tr><td style="padding:8px 0;color:#9ca3af;">Date</td><td align="right" style="padding:8px 0;color:#ffffff;">${escapeHtml(bookingDate)}</td></tr>
                        <tr><td style="padding:8px 0;color:#9ca3af;">Time</td><td align="right" style="padding:8px 0;color:#ffffff;">${escapeHtml(bookingTimes)}</td></tr>
                    </table>
                    <h3 style="color:#ffffff;">Treatments</h3>
                    <table width="100%" cellpadding="0" cellspacing="0">${renderLineItems(lineItems)}</table>
                    <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:20px;">
                        <tr><td style="padding:12px 0;color:#ffffff;font-weight:bold;">Amount due</td><td align="right" style="padding:12px 0;color:#7ddf98;font-size:20px;font-weight:bold;">${escapeHtml(formatCurrency(amountDue))}</td></tr>
                    </table>
                    <hr style="border:none;border-top:1px solid #2b2b2b;margin:30px 0;">
                    <p style="color:#9ca3af;font-size:14px;line-height:1.6;">Please keep this email for your records. If you need to change or cancel your appointment, please contact SkinZone Naturel.</p>
                    <p style="color:#ffffff;margin-top:30px;">Warm regards,<br><strong>SkinZone Naturel Team</strong></p>
                </td></tr>
                <tr><td align="center" style="background-color:#0b0b0b;padding:20px;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} SkinZone Naturel. All rights reserved.</td></tr>
            </table>
        </td></tr>
    </table>
</body>
</html>`;

    const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
            Authorization: `Bearer ${resendApiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            from: emailFrom,
            to: [customer.email],
            subject,
            html,
        }),
    });

    if (!resendResponse.ok) {
        const responseText = await resendResponse.text();
        console.error("Resend request failed:", responseText);
        return jsonResponse({ error: "Could not send booking confirmation email" }, 502);
    }

    return jsonResponse({ success: true, bookingId, amountDue });
});