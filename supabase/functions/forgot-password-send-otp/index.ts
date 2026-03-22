// @ts-nocheck
// Follow the REST API documentation here:
// https://supabase.com/docs/reference/cli/supabase-functions-deploy

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.43.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { email } = await req.json();

    // Validate email
    if (!email || typeof email !== "string") {
      return new Response(
        JSON.stringify({
          error: "Invalid email provided",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Invalid email format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") || "";
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") || "";

    const supabase = createClient(supabaseUrl, supabaseServiceRoleKey);

    // Check if user exists
    const { data: users, error: userError } = await supabase
      .from("User")
      .select("id, email")
      .eq("email", email.toLowerCase())
      .limit(1);

    if (userError || !users || users.length === 0) {
      // For security, don't reveal if email exists or not
      // Return success anyway
      return new Response(
        JSON.stringify({
          success: true,
          message: "If an account exists with this email, a verification code has been sent.",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = users[0].id;

    // Generate OTP (6 digits)
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes from now

    // Store OTP in password_reset_tokens table
    const { error: insertError } = await supabase
      .from("password_reset_tokens")
      .insert({
        user_id: userId,
        token: otp,
        email: email.toLowerCase(),
        expires_at: otpExpiry.toISOString(),
        used: false,
      });

    if (insertError) {
      console.error("Failed to store OTP:", insertError);
      return new Response(
        JSON.stringify({
          error: "Failed to send verification code. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Send verification code via Supabase Auth email
    // Using custom email template (must be configured in Supabase)
    const { error: sendError } = await supabase.auth.admin.sendRawEmail({
      to: email.toLowerCase(),
      subject: "Your Skinzone Password Reset Code",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #00FF5F;">Skinzone Password Reset</h2>
          <p>You requested to reset your password. Use the code below in the app:</p>
          <div style="background: #000; padding: 20px; border: 1px solid #00FF5F; border-radius: 8px; text-align: center; margin: 20px 0;">
            <h1 style="color: #00FF5F; font-family: monospace; letter-spacing: 2px; margin: 0;">${otp}</h1>
          </div>
          <p style="color: #666;">This code expires in 10 minutes.</p>
          <p style="color: #666;">If you didn't request this, you can safely ignore this email.</p>
          <hr>
          <p style="color: #888; font-size: 12px;">© Skinzone. All rights reserved.</p>
        </div>
      `,
    });

    if (sendError) {
      console.error("Failed to send email:", sendError);
      return new Response(
        JSON.stringify({
          error: "Failed to send verification code. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Verification code sent to your email",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred. Please try again.",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
