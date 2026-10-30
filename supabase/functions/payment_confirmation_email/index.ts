import { createClient } from "npm:@supabase/supabase-js@2";

type PaymentPayload = {
    bookingid?: number | string;
    booking_id?: number | string;
    record?: {
        bookingid?: number | string;
        booking_id?: number | string;
    };
};

type Booking = {
    bookingid: number;
    bookingdate: string;
    customerid: string;
};

type BookingLine = {
    treatment_id: number | null;
    time: string;
};

type Service = {
    ServiceId: number;
    servicename: string;
};

const corsHeaders = {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function response(body: unknown, status = 200) {
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

function bookingIdFrom(payload: PaymentPayload) {
    const id =
        payload.record?.bookingid ??
        payload.record?.booking_id ??
        payload.bookingid ??
        payload.booking_id;
    const parsed = Number(id);
    return Number.isInteger(parsed) && parsed > 0 ? parsed : null;
}

function formatDate(value: string) {
    return new Intl.DateTimeFormat("en-ZA", {
        dateStyle: "full",
        timeZone: "Africa/Johannesburg",
    }).format(new Date(value));
}

Deno.serve(async (req) => {
    if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });
    if (req.method !== "POST") return response({ error: "Method not allowed" }, 405);

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    const emailFrom =
        Deno.env.get("BOOKING_EMAIL_FROM") ??
        "SkinZone Naturel <onboarding@resend.dev>";

    if (!supabaseUrl || !serviceRoleKey || !resendApiKey) {
        console.error("Payment email function is missing required configuration");
        return response({ error: "Email service is not configured" }, 500);
    }

    let payload: PaymentPayload;
    try {
        payload = await req.json();
    } catch {
        return response({ error: "Invalid JSON payload" }, 400);
    }

    const bookingId = bookingIdFrom(payload);
    if (!bookingId) return response({ error: "A valid booking ID is required" }, 400);

    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: booking, error: bookingError } = await adminClient
        .from("bookings")
        .select("bookingid,bookingdate,customerid")
        .eq("bookingid", bookingId)
        .single<Booking>();

    if (bookingError || !booking) {
        console.error("Could not load paid booking:", bookingError);
        return response({ error: "Could not load booking details" }, 404);
    }

    const [{ data: customer, error: customerError }, { data: lines, error: linesError }] =
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
        console.error("Could not load paid booking customer:", customerError);
        return response({ error: "Could not load customer email" }, 500);
    }
    if (linesError) {
        console.error("Could not load paid booking lines:", linesError);
        return response({ error: "Could not load booking lines" }, 500);
    }

    const treatmentIds = (lines ?? [])
        .map((line) => line.treatment_id)
        .filter((id): id is number => typeof id === "number");
    const { data: services, error: servicesError } =
        treatmentIds.length > 0
            ? await adminClient
                  .from("Services")
                  .select("ServiceId,servicename")
                  .in("ServiceId", treatmentIds)
                  .returns<Service[]>()
            : { data: [], error: null };

    if (servicesError) {
        console.error("Could not load paid booking treatments:", servicesError);
        return response({ error: "Could not load treatment details" }, 500);
    }

    const names = new Map((services ?? []).map((service) => [service.ServiceId, service.servicename]));
    const treatmentRows = (lines ?? [])
        .map(
            (line) => `
              <tr>
                <td style="padding:10px 0;border-bottom:1px solid #2b2b2b;color:#d1d5db;">
                  ${escapeHtml(line.treatment_id == null ? "Treatment" : names.get(line.treatment_id) ?? "Treatment")}
                </td>
                <td align="right" style="padding:10px 0;border-bottom:1px solid #2b2b2b;color:#ffffff;">
                  ${escapeHtml(line.time.slice(0, 5))}
                </td>
              </tr>`,
        )
        .join("");

    const subject = `Payment received - booking #${booking.bookingid}`;
    const html = `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>${escapeHtml(subject)}</title></head>
<body style="margin:0;padding:0;background:#0d0d0d;font-family:Arial,Helvetica,sans-serif;color:#fff;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#0d0d0d;padding:40px 20px;">
    <tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="background:#141414;border:1px solid #1f4d2e;border-radius:12px;overflow:hidden;">
        <tr><td align="center" style="background:#123524;padding:30px;">
          <h1 style="margin:0;color:#fff;font-size:32px;">SkinZone Naturel</h1>
          <p style="margin-top:10px;color:#c7d8c7;font-size:16px;">Natural Wellness • Natural Beauty</p>
        </td></tr>
        <tr><td style="padding:40px;">
          <h2 style="margin-top:0;color:#fff;">Payment Received</h2>
          <p style="color:#d1d5db;line-height:1.7;">Hello ${escapeHtml(customer.name?.trim() || "there")},</p>
          <p style="color:#d1d5db;line-height:1.7;">We have received your <strong>R300.00 consultation fee</strong>. Your booking is now confirmed and secured.</p>
          <table width="100%" cellpadding="0" cellspacing="0" style="margin:24px 0;">
            <tr><td style="padding:8px 0;color:#9ca3af;">Booking number</td><td align="right" style="color:#fff;">#${booking.bookingid}</td></tr>
            <tr><td style="padding:8px 0;color:#9ca3af;">Date</td><td align="right" style="color:#fff;">${escapeHtml(formatDate(booking.bookingdate))}</td></tr>
          </table>
          <h3 style="color:#fff;">Treatments and times</h3>
          <table width="100%" cellpadding="0" cellspacing="0">${treatmentRows}</table>
          <p style="color:#9ca3af;font-size:14px;line-height:1.6;margin-top:28px;">Please keep this email for your records. We look forward to welcoming you.</p>
          <p style="color:#fff;margin-top:30px;">Warm regards,<br><strong>SkinZone Naturel Team</strong></p>
        </td></tr>
        <tr><td align="center" style="background:#0b0b0b;padding:20px;color:#6b7280;font-size:12px;">© ${new Date().getFullYear()} SkinZone Naturel. All rights reserved.</td></tr>
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
        body: JSON.stringify({ from: emailFrom, to: [customer.email], subject, html }),
    });

    if (!resendResponse.ok) {
        console.error("Payment confirmation email failed:", await resendResponse.text());
        return response({ error: "Could not send payment confirmation email" }, 502);
    }

    return response({ success: true, bookingId, amountReceived: 300 });
});
