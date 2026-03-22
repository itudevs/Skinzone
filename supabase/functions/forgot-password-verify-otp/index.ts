// @ts-nocheck
// Verify OTP and reset password for unauthenticated user
// This function is called after user provides OTP and new password

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
    const { email, otp, newPassword } = await req.json();

    // Validate inputs
    if (!email || !otp || !newPassword) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: email, otp, newPassword",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (newPassword.length < 6) {
      return new Response(
        JSON.stringify({
          error: "Password must be at least 6 characters",
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

    // Verify OTP from password_reset_tokens table
    const { data: tokens, error: tokenError } = await supabase
      .from("password_reset_tokens")
      .select("id, user_id, expires_at, used")
      .eq("email", email.toLowerCase())
      .eq("token", otp.toString())
      .eq("used", false)
      .order("created_at", { ascending: false })
      .limit(1);

    if (tokenError || !tokens || tokens.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Invalid verification code",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const tokenRecord = tokens[0];

    // Check if OTP has expired
    const expiryTime = new Date(tokenRecord.expires_at).getTime();
    const currentTime = Date.now();

    if (currentTime > expiryTime) {
      return new Response(
        JSON.stringify({
          error: "Verification code has expired. Please request a new one.",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const userId = tokenRecord.user_id;

    // Get the user's auth ID (from User table's id field which is auth user id)
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();

    if (authError) {
      console.error("Failed to list users:", authError);
      return new Response(
        JSON.stringify({
          error: "Failed to process password reset",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const authUser = authUsers.users.find((u) => u.id === userId);

    if (!authUser) {
      return new Response(
        JSON.stringify({
          error: "User not found",
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update password using admin API
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      {
        password: newPassword,
      }
    );

    if (updateError) {
      console.error("Failed to update password:", updateError);
      return new Response(
        JSON.stringify({
          error: "Failed to update password. Please try again.",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Mark OTP as used
    const { error: markUsedError } = await supabase
      .from("password_reset_tokens")
      .update({ used: true })
      .eq("id", tokenRecord.id);

    if (markUsedError) {
      console.error("Failed to mark token as used:", markUsedError);
      // Don't fail the response, password was already updated
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your password has been successfully reset.",
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
