import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Content-Type": "application/json",
  "Cache-Control": "no-store",
};

const required = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

const response = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: corsHeaders });

function md5(value: string) {
  const rotateLeft = (number: number, amount: number) =>
    (number << amount) | (number >>> (32 - amount));
  const add = (a: number, b: number) => (a + b) | 0;
  const bytes = new TextEncoder().encode(value);
  const words = Array.from(bytes);
  const bitLength = bytes.length * 8;
  words.push(0x80);
  while (words.length % 64 !== 56) words.push(0);
  for (let index = 0; index < 8; index++) {
    words.push((bitLength / 2 ** (8 * index)) & 0xff);
  }

  let a = 0x67452301;
  let b = 0xefcdab89;
  let c = 0x98badcfe;
  let d = 0x10325476;
  const shifts = [
    7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22, 7, 12, 17, 22,
    5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20, 5, 9, 14, 20,
    4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23, 4, 11, 16, 23,
    6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21, 6, 10, 15, 21,
  ];
  const constants = Array.from({ length: 64 }, (_, index) =>
    Math.floor(Math.abs(Math.sin(index + 1)) * 2 ** 32),
  );

  for (let offset = 0; offset < words.length; offset += 64) {
    const chunk = Array.from({ length: 16 }, (_, index) => {
      const position = offset + index * 4;
      return (
        words[position] |
        (words[position + 1] << 8) |
        (words[position + 2] << 16) |
        (words[position + 3] << 24)
      );
    });
    let aa = a;
    let bb = b;
    let cc = c;
    let dd = d;
    for (let index = 0; index < 64; index++) {
      let functionValue: number;
      let wordIndex: number;
      if (index < 16) {
        functionValue = (bb & cc) | (~bb & dd);
        wordIndex = index;
      } else if (index < 32) {
        functionValue = (dd & bb) | (~dd & cc);
        wordIndex = (5 * index + 1) % 16;
      } else if (index < 48) {
        functionValue = bb ^ cc ^ dd;
        wordIndex = (3 * index + 5) % 16;
      } else {
        functionValue = cc ^ (bb | ~dd);
        wordIndex = (7 * index) % 16;
      }
      const next = dd;
      dd = cc;
      cc = bb;
      bb = add(
        bb,
        rotateLeft(
          add(add(aa, functionValue), add(constants[index], chunk[wordIndex])),
          shifts[index],
        ),
      );
      aa = next;
    }
    a = add(a, aa);
    b = add(b, bb);
    c = add(c, cc);
    d = add(d, dd);
  }

  return [a, b, c, d]
    .flatMap((number) =>
      Array.from({ length: 4 }, (_, index) =>
        ((number >>> (8 * index)) & 0xff).toString(16).padStart(2, "0"),
      ),
    )
    .join("");
}

function payFastEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!'()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}

const payFastPaymentFieldOrder = [
  "merchant_id",
  "merchant_key",
  "return_url",
  "cancel_url",
  "notify_url",
  "notify_method",
  "name_first",
  "name_last",
  "email_address",
  "cell_number",
  "m_payment_id",
  "amount",
  "item_name",
  "item_description",
  "custom_int1",
  "custom_int2",
  "custom_int3",
  "custom_int4",
  "custom_int5",
  "custom_str1",
  "custom_str2",
  "custom_str3",
  "custom_str4",
  "custom_str5",
  "email_confirmation",
  "confirmation_address",
  "currency",
  "payment_method",
  "subscription_type",
  "billing_date",
  "recurring_amount",
  "frequency",
  "cycles",
  "subscription_notify_email",
  "subscription_notify_webhook",
  "subscription_notify_buyer",
];

function getOptionalPassphrase() {
  const value = Deno.env.get("PAYFAST_PASSPHRASE")?.trim() ?? "";
  return ["", "none", "null", "false"].includes(value.toLowerCase())
    ? ""
    : value;
}

Deno.serve(async (request) => {
  if (request.method !== "GET") return response("Method not allowed", 405);

  try {
    const supabase = createClient(
      required("SUPABASE_URL"),
      required("SUPABASE_SERVICE_ROLE_KEY"),
    );
    const url = new URL(request.url);
    const bookingId = url.searchParams.get("booking_id") ?? "";
    const customerId = url.searchParams.get("customer_id") ?? "";

    if (!/^\d+$/.test(bookingId) || !/^[0-9a-f-]{36}$/i.test(customerId)) {
      return response("Invalid booking details", 400);
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("bookingid, customerid, status")
      .eq("bookingid", Number(bookingId))
      .eq("customerid", customerId)
      .single();
    const bookingStatus = String(booking?.status ?? "").trim().toLowerCase();
    if (
      bookingError ||
      !booking ||
      (bookingStatus !== "1" && bookingStatus !== "pending")
    ) {
      return response("Booking is not available for payment", 400);
    }

    const sandbox =
      (Deno.env.get("PAYFAST_SANDBOX") ?? "true").trim().toLowerCase() ===
      "true";
    const payfastUrl = sandbox
      ? "https://sandbox.payfast.co.za/eng/process"
      : "https://www.payfast.co.za/eng/process";
    const returnUrl = required("PAYFAST_RETURN_URL");
    const cancelUrl = required("PAYFAST_CANCEL_URL");
    const notifyUrl = required("PAYFAST_NOTIFY_URL");
    const merchantId = required("PAYFAST_MERCHANT_ID");
    const merchantKey = required("PAYFAST_MERCHANT_KEY");
    const passphrase = getOptionalPassphrase();
    const { data: customer, error: customerError } =
      await supabase.auth.admin.getUserById(customerId);
    if (customerError) {
      throw new Error(`Could not load customer details: ${customerError.message}`);
    }
    const customerEmail = customer.user?.email?.trim();
    if (!customerEmail) {
      return response("A valid account email is required for payment", 400);
    }

    const fields: Record<string, string> = {
      merchant_id: merchantId,
      merchant_key: merchantKey,
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notify_url: notifyUrl,
      email_address: customerEmail,
      m_payment_id: bookingId,
      amount: "300.00",
      item_name: "SkinZone consultation deposit",
    };
    const signatureSource = payFastPaymentFieldOrder
      .filter((name) => Boolean(fields[name]?.trim()))
      .map(
        (name) =>
          `${name}=${payFastEncode((fields[name] ?? "").trim())}`,
      )
      .join("&");
    fields.signature = md5(
      passphrase
        ? `${signatureSource}&passphrase=${payFastEncode(passphrase.trim())}`
        : signatureSource,
    );
    console.log("PayFast signature diagnostics:", {
      sandbox,
      passphraseConfigured: Boolean(passphrase),
      fieldNames: Object.keys(fields),
      signatureLength: fields.signature.length,
      signatureFormat: /^[a-f0-9]{32}$/.test(fields.signature),
    });

    return new Response(
      JSON.stringify({
        payfastUrl,
        fields,
      }),
      { status: 200, headers: corsHeaders },
    );
  } catch (error) {
    console.error("Could not create PayFast payment form:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return response({ error: `PayFast payment setup failed: ${message}` }, 500);
  }
});
