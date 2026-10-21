import { createClient } from "npm:@supabase/supabase-js@2";

const required = (name: string) => {
  const value = Deno.env.get(name)?.trim();
  if (!value) throw new Error(`${name} is not configured`);
  return value;
};

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
      return words[position] | (words[position + 1] << 8) |
        (words[position + 2] << 16) | (words[position + 3] << 24);
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
      bb = add(bb, rotateLeft(
        add(add(aa, functionValue), add(constants[index], chunk[wordIndex])),
        shifts[index],
      ));
      aa = next;
    }
    a = add(a, aa);
    b = add(b, bb);
    c = add(c, cc);
    d = add(d, dd);
  }
  return [a, b, c, d].flatMap((number) =>
    Array.from({ length: 4 }, (_, index) =>
      ((number >>> (8 * index)) & 0xff).toString(16).padStart(2, "0"),
    )
  ).join("");
}

function payFastEncode(value: string) {
  return encodeURIComponent(value)
    .replace(/%20/g, "+")
    .replace(/~/g, "%7E")
    .replace(/[!'()*]/g, (character) =>
      `%${character.charCodeAt(0).toString(16).toUpperCase()}`,
    );
}

function getOptionalPassphrase() {
  const value = Deno.env.get("PAYFAST_PASSPHRASE")?.trim() ?? "";
  return ["", "none", "null", "false"].includes(value.toLowerCase())
    ? ""
    : value;
}

const supabase = createClient(
  required("SUPABASE_URL"),
  required("SUPABASE_SERVICE_ROLE_KEY"),
);

Deno.serve(async (request) => {
  if (request.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const formData = await request.formData();
    const paymentEntries = Array.from(formData.entries()).filter(
      ([, value]) => typeof value === "string",
    ) as [string, string][];
    const payment = new URLSearchParams(paymentEntries);
    const expectedSignature = payment.get("signature")?.toLowerCase();
    const passphrase = getOptionalPassphrase();
    const signatureSource = paymentEntries
      .filter(([name]) => name !== "signature")
      .map(([name, value]) => `${name}=${payFastEncode(value.trim())}`)
      .join("&");
    const calculatedSignature = md5(
      passphrase
        ? `${signatureSource}&passphrase=${payFastEncode(passphrase)}`
        : signatureSource,
    );
    console.log("PayFast ITN signature diagnostics:", {
      passphraseConfigured: Boolean(passphrase),
      fieldNames: paymentEntries
        .filter(([name]) => name !== "signature")
        .map(([name]) => name),
      fieldCount: paymentEntries.filter(([name]) => name !== "signature").length,
      signatureLength: expectedSignature?.length ?? 0,
      signatureFormat: /^[a-f0-9]{32}$/.test(expectedSignature ?? ""),
      calculatedSignature,
      signatureMatches: expectedSignature === calculatedSignature,
    });
    if (!expectedSignature || expectedSignature !== calculatedSignature) {
      console.error("PayFast ITN rejected: signature mismatch");
      return new Response("Invalid PayFast signature", { status: 400 });
    }

    const validationParams = new URLSearchParams(paymentEntries);
    validationParams.append("cmd", "_notify-validate");
    const sandbox =
      (Deno.env.get("PAYFAST_SANDBOX") ?? "true").trim().toLowerCase() ===
      "true";
    const validationUrl = sandbox
      ? "https://sandbox.payfast.co.za/eng/query/validate"
      : "https://www.payfast.co.za/eng/query/validate";
    const validation = await fetch(validationUrl, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: validationParams.toString(),
    });
    const validationResult = (await validation.text()).trim();
    console.log("PayFast ITN validation diagnostics:", {
      sandbox,
      validationStatus: validation.status,
      validationResult,
    });

    if (validationResult !== "VALID") {
      console.error("PayFast ITN rejected: notification validation failed");
      return new Response("Invalid PayFast notification", { status: 400 });
    }

    const bookingId = Number(payment.get("m_payment_id"));
    const amount = Number(payment.get("amount_gross"));
    const paymentChecks = {
      bookingIdIsInteger: Number.isInteger(bookingId),
      amountIsExpected: amount === 300,
      statusIsComplete: payment.get("payment_status") === "COMPLETE",
      merchantMatches: payment.get("merchant_id") ===
        required("PAYFAST_MERCHANT_ID"),
    };
    console.log("PayFast ITN payment diagnostics:", {
      ...paymentChecks,
      paymentStatus: payment.get("payment_status"),
      amount,
    });
    if (!Object.values(paymentChecks).every(Boolean)) {
      console.error("PayFast ITN rejected: payment details failed validation");
      return new Response("Payment was not complete or had an invalid amount", {
        status: 400,
      });
    }

    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("bookingid, customerid")
      .eq("bookingid", bookingId)
      .single();
    if (bookingError || !booking) {
      console.error("PayFast booking lookup failed:", bookingError);
      return new Response("Booking not found", { status: 404 });
    }

    const paidAt = new Date().toISOString();
    const { error: paymentError } = await supabase.from("payments").upsert(
      {
        booking_id: booking.bookingid,
        customer_id: booking.customerid,
        payment_status: "complete",
        paid_at: paidAt,
      },
      { onConflict: "booking_id" },
    );
    if (paymentError) throw paymentError;

    const { error: updateError } = await supabase
      .from("bookings")
      .update({ status: "booked" })
      .eq("bookingid", booking.bookingid);
    if (updateError) throw updateError;

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("PayFast ITN processing failed:", error);
    return new Response("Unable to process notification", { status: 500 });
  }
});
